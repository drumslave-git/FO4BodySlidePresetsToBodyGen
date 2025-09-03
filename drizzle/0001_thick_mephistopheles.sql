CREATE TABLE `templates` (
	`id` integer PRIMARY KEY AUTOINCREMENT NOT NULL,
	`name` text,
	`bodyGen` text,
	`gender` integer,
	`sourceXMLContentHash` text
);
