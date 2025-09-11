import type { InferInsertModel, InferSelectModel } from "drizzle-orm"
import * as t from "drizzle-orm/sqlite-core"
import { sqliteTable as table } from "drizzle-orm/sqlite-core"
// import { AnySQLiteColumn } from "drizzle-orm/sqlite-core";

export const config = table("config", {
	key: t.text().primaryKey(),
	value: t.text(),
})

export const templates = table("templates", {
	id: t.integer("id").primaryKey({ autoIncrement: true }),
	name: t.text(),
	source: t.text(),
	bodyGen: t.text(),
	gender: t.integer(),
	sourceXMLContentHash: t.text(),
})

export type Template = InferSelectModel<typeof templates>
export type NewTemplate = InferInsertModel<typeof templates>

export const singleRules = table("singleRules", {
	id: t.integer("id").primaryKey({ autoIncrement: true }),
	name: t.text(),
	plugin: t.text(),
	formId: t.text(),
})

export type SingleRule = InferSelectModel<typeof singleRules>
export type NewSingleRule = InferInsertModel<typeof singleRules>

export const multiRules = table("multiRules", {
	id: t.integer("id").primaryKey({ autoIncrement: true }),
	name: t.text(),
	gender: t.text(),
	race: t.text(),
})

export type MultiRule = InferSelectModel<typeof multiRules>
export type NewMultiRule = InferInsertModel<typeof multiRules>
