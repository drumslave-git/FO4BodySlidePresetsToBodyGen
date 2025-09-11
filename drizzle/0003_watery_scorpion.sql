CREATE TABLE `multiRules` (
	`id` integer PRIMARY KEY AUTOINCREMENT NOT NULL,
	`gender` text,
	`race` text
);
--> statement-breakpoint
CREATE TABLE `singleRules` (
	`id` integer PRIMARY KEY AUTOINCREMENT NOT NULL,
	`plugin` text,
	`formId` text
);
