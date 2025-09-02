import * as t from "drizzle-orm/sqlite-core"
import { sqliteTable as table } from "drizzle-orm/sqlite-core"
// import { AnySQLiteColumn } from "drizzle-orm/sqlite-core";

export const config = table("config", {
	key: t.text().primaryKey(),
	value: t.text(),
})
