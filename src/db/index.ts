import { createHash } from "node:crypto"
import fs from "node:fs"
import path from "node:path"
import type {
	InferInsertModel,
	InferSelectModel,
	TableConfig,
} from "drizzle-orm"
import { drizzle } from "drizzle-orm/better-sqlite3"
import { migrate } from "drizzle-orm/better-sqlite3/migrator"
import { and, eq } from "drizzle-orm/sql/expressions/conditions"
import type { AnySQLiteColumn, SQLiteTable } from "drizzle-orm/sqlite-core"
import { app } from "electron"

import log from "../logger"
import {
	type BodySlidePreset,
	type BodySlidePresetParsed,
	type Config,
	ImportStatus,
} from "../types"
import {
	config,
	type MultiRule,
	multiRules,
	type NewTemplate,
	type SingleRule,
	singleRules,
	templates,
} from "./schema"

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

const commonDB = <
	TTable extends SQLiteTable<TableConfig>,
	TRow = InferSelectModel<TTable>,
	TNew = InferInsertModel<TTable>,
>(
	table: TTable,
) => ({
	read: (id?: TRow["id"]) =>
		id !== undefined
			? (db.select().from(table).where(eq(table.id, id)).get() as
					| TRow
					| undefined)
			: (db.select().from(table).all() as TRow[]),

	create: (row: TNew) => db.insert(table).values(row).run(),

	update: (id: TRow["id"], row: Partial<TRow>) => {
		const { id: _id, ...rest } = row
		return db.update(table).set(rest).where(eq(table.id, id)).run()
	},

	delete: (id: TRow["id"]) => db.delete(table).where(eq(table.id, id)).run(),

	duplicate: (id: TRow["id"]) => {
		const item = db.select().from(table).where(eq(table.id, id)).get() as TRow
		const { id: _id, name, ...rest } = item
		const newName = `${name} Copy ${Date.now()}`
		return db
			.insert(table)
			.values({ ...rest, name: newName } as unknown as TNew)
			.run()
	},
})

export const templatesDB = {
	...commonDB(templates),
	importedStatus: (preset: BodySlidePreset) => {
		const hash = createHash("sha256")
		hash.update(fs.readFileSync(preset.filePath).toString())
		let importStatus: ImportStatus = ImportStatus.notImported
		const contentHash = hash.digest("hex")
		const sourceFileName = path.basename(preset.filePath)
		let id = 0
		const existing = db
			.select()
			.from(templates)
			.where(eq(templates.sourceXMLContentHash, contentHash))
			.get()
		if (existing) {
			importStatus = ImportStatus.imported
			id = existing.id
		} else {
			const needsUpdate = db
				.select()
				.from(templates)
				.where(
					and(
						eq(templates.name, preset.name),
						eq(templates.source, sourceFileName),
					),
				)
				.get()
			if (needsUpdate) {
				importStatus = ImportStatus.needsUpdate
				id = needsUpdate.id
			}
		}
		return { importStatus, id }
	},
	importedStatuses: (sources: BodySlidePresetParsed[]) => {
		return sources
			.filter((source) => typeof source.data !== "string")
			.map((source) => {
				return {
					...source,
					data: (source.data as BodySlidePreset[]).map((preset) => {
						return {
							...preset,
							importStatus: templatesDB.importedStatus(preset).importStatus,
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
		const sourceFileName = path.basename(source.filePath)
		const template: NewTemplate = {
			name: source.name,
			source: sourceFileName,
			bodyGen: source.bodyGen,
			gender: source.gender,
			sourceXMLContentHash: contentHash,
		}
		const { importStatus, id } = templatesDB.importedStatus(source)
		if (importStatus === ImportStatus.imported) {
			return { status: importStatus, id }
		}
		if (importStatus === ImportStatus.needsUpdate) {
			const updated = await db
				.update(templates)
				.set(template)
				.where(eq(templates.id, id))
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

export const singleRulesDB = commonDB(singleRules)

export const multiRulesDB = commonDB(multiRules)

export const rulesDB = {
	type: (id: number) => {
		const single = db
			.select()
			.from(singleRules)
			.where(eq(singleRules.id, id))
			.get()
		if (single) return "single"
		const multi = db
			.select()
			.from(multiRules)
			.where(eq(multiRules.id, id))
			.get()
		if (multi) return "multi"
		return null
	},
	read: () => {
		const singles = singleRulesDB.read() as SingleRule[]
		const multis = multiRulesDB.read() as MultiRule[]
		return [...singles, ...multis].sort((a, b) => a.name.localeCompare(b.name))
	},
}

export default db
