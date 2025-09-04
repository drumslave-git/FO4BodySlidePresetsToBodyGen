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
	bodyGen: t.text(),
	gender: t.integer(),
	sourceXMLContentHash: t.text(),
})

export type Template = InferSelectModel<typeof templates>
export type NewTemplate = InferInsertModel<typeof templates>
