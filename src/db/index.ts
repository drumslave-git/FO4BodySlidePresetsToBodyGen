import fs from "node:fs"
import path from "node:path"
import type {
	InferInsertModel,
	InferSelectModel,
	TableConfig,
} from "drizzle-orm"
import { drizzle } from "drizzle-orm/better-sqlite3"
import { migrate } from "drizzle-orm/better-sqlite3/migrator"
import { eq } from "drizzle-orm/sql/expressions/conditions"
import type { SQLiteTable } from "drizzle-orm/sqlite-core"
import { app } from "electron"

import log from "../logger"
import type { Config } from "../types"
import {
	config,
	type MultiRule,
	multiRules,
	type Rule,
	type SingleRule,
	singleRules,
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
	read: (id?: number) =>
		id !== undefined
			? (db.select().from(table).where(eq(table.id, id)).get() as
					| TRow
					| undefined)
			: (db.select().from(table).all() as TRow[]),

	create: (row: TNew) => {
		const { id: _id, ...rest } = row
		return db.insert(table).values(rest).run()
	},

	update: (id: number, row: Partial<TRow>) => {
		const { id: _id, ...rest } = row
		return db
			.update(table)
			.set(rest as unknown as Partial<TRow>)
			.where(eq(table.id, id))
			.run()
	},
	delete: (id: number) => db.delete(table).where(eq(table.id, id)).run(),

	duplicate: (id: number) => {
		const item = db.select().from(table).where(eq(table.id, id)).get() as TRow
		const { id: _id, name, ...rest } = item
		const newName = `${name} Copy ${Date.now()}`
		return db
			.insert(table)
			.values({ ...rest, name: newName } as unknown as TNew)
			.run()
	},
})

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
	read: (): Rule[] => {
		const singles = (singleRulesDB.read() as SingleRule[]).map((rule) => ({
			...rule,
			formatted: `${rule.plugin}|${rule.formId}`,
		}))
		const multis = (multiRulesDB.read() as MultiRule[]).map((rule) => ({
			...rule,
			formatted: `All|${rule.gender}|${rule.race}`,
		}))
		return [...singles, ...multis].sort((a, b) => a.name.localeCompare(b.name))
	},
	delete: (id: number) => {
		const type = rulesDB.type(id)
		if (type === "single") {
			return singleRulesDB.delete(id)
		} else if (type === "multi") {
			return multiRulesDB.delete(id)
		}
	},
	duplicate: (id: number) => {
		const type = rulesDB.type(id)
		if (type === "single") {
			return singleRulesDB.duplicate(id)
		} else if (type === "multi") {
			return multiRulesDB.duplicate(id)
		}
	},
}

export default db
