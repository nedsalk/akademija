PRAGMA foreign_keys=OFF;--> statement-breakpoint
DROP TABLE IF EXISTS `question`;--> statement-breakpoint
CREATE TABLE `question` (
	`id` text PRIMARY KEY NOT NULL,
	`text` text NOT NULL,
	`type` text NOT NULL,
	`lesson_id` text NOT NULL,
	`created_at` integer NOT NULL,
	`updated_at` integer NOT NULL,
	FOREIGN KEY (`lesson_id`) REFERENCES `lesson`(`id`) ON UPDATE no action ON DELETE cascade
);
--> statement-breakpoint
PRAGMA foreign_keys=ON;
