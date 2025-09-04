import { createHash } from "node:crypto"
import fs from "node:fs"
import path from "node:path"
import { drizzle } from "drizzle-orm/better-sqlite3"
import { migrate } from "drizzle-orm/better-sqlite3/migrator"
import { eq } from "drizzle-orm/sql/expressions/conditions"
import { app } from "electron"

import log from "../logger"
import {
	type BodySlidePreset,
	type BodySlidePresetParsed,
	type Config,
	ImportStatus,
} from "../types"
import { config, type NewTemplate, type Template, templates } from "./schema"

const dataFolder = path.resolve(
	app.getAppPath(),
	...(app.isPackaged ? ["..", ".."] : []),
	"data",
)
log.info("Data folder:", dataFolder)
if (!fs.existsSync(dataFolder)) {
	fs.mkdirSync(dataFolder, { recursive: true })
}
const db = drizzle(path.resolve(dataFolder, "app.db"))

export const applyMigrations = () => {
	const migrationsFolder = path.resolve(
		app.getAppPath(),
		app.isPackaged ? ".." : "",
		"drizzle",
	)
	console.log("Applying migrations from:", migrationsFolder)
	migrate(db, { migrationsFolder: migrationsFolder })
}

const defaultConfig = (config: Config) => {
	const defaults = {
		...config,
	}
	if (!defaults.outputFolder && defaults.dataFolder) {
		defaults.outputFolder = defaults.dataFolder
	}
	if (!defaults.dataFolder) {
		defaults.lastActiveLocation = "/settings"
	}
	return defaults
}

export const readConfig = () => {
	const data = db
		.select()
		.from(config)
		.all()
		.reduce((acc, curr) => {
			acc[curr.key as keyof Config] = curr.value
			return acc
		}, {} as Config)

	return defaultConfig(data)
}

export const writeConfig = (key: string, value: string) => {
	const existing = db.select().from(config).where(eq(config.key, key)).get()
	if (existing) {
		db.update(config).set({ value }).where(eq(config.key, key)).run()
	} else {
		db.insert(config).values({ key, value }).run()
	}
}

export const templatesDB = {
	read: (id?: number) =>
		id
			? db.select().from(templates).where(eq(templates.id, id)).get()
			: db.select().from(templates).all(),
	create: (template: NewTemplate) =>
		db.insert(templates).values(template).run(),
	update: (id: number, template: Partial<Template>) =>
		db.update(templates).set(template).where(eq(templates.id, id)).run(),
	delete: (id: number) =>
		db.delete(templates).where(eq(templates.id, id)).run(),
	importedStatus: (sources: BodySlidePresetParsed[]) => {
		return sources
			.filter((source) => typeof source.data !== "string")
			.map((source) => {
				return {
					...source,
					data: (source.data as BodySlidePreset[]).map((preset) => {
						const hash = createHash("sha256")
						hash.update(fs.readFileSync(preset.filePath).toString())
						let importStatus: ImportStatus = ImportStatus.notImported
						const contentHash = hash.digest("hex")
						const name = `${preset.name} from ${preset.filePath}`
						const existing = db
							.select()
							.from(templates)
							.where(eq(templates.sourceXMLContentHash, contentHash))
							.get()
						if (existing) {
							importStatus = ImportStatus.imported
						} else {
							const needsUpdate = db
								.select()
								.from(templates)
								.where(eq(templates.name, name))
								.get()
							if (needsUpdate) {
								importStatus = ImportStatus.needsUpdate
							}
						}
						return {
							...preset,
							importStatus,
						}
					}),
				}
			})
	},
	import: async (
		source: BodySlidePreset,
	): Promise<{ status: string; id: number }> => {
		const hash = createHash("sha256")
		hash.update(fs.readFileSync(source.filePath).toString())
		const contentHash = hash.digest("hex")
		const template: NewTemplate = {
			name: `${source.name} from ${source.filePath}`,
			bodyGen: source.bodyGen,
			gender: source.gender,
			sourceXMLContentHash: contentHash,
		}
		const existing = db
			.select()
			.from(templates)
			.where(eq(templates.sourceXMLContentHash, contentHash))
			.get()
		if (existing) {
			return { status: "exists", id: existing.id }
		}
		const needsUpdate = db
			.select()
			.from(templates)
			.where(eq(templates.name, template.name))
			.get()
		if (needsUpdate) {
			const updated = await db
				.update(templates)
				.set(template)
				.where(eq(templates.id, needsUpdate.id))
				.returning({
					id: templates.id,
				})
			return { status: "updated", id: updated.at(0).id }
		}
		const result = await db.insert(templates).values(template).returning({
			id: templates.id,
		})

		return { status: "created", id: result.at(0).id }
	},
}

export default db
