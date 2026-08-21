DROP INDEX IF EXISTS `program_enrollment_student_program_unique`;
--> statement-breakpoint
DROP TABLE IF EXISTS `program_enrollment`;
--> statement-breakpoint
DROP TABLE IF EXISTS `program_enrollment_request`;
--> statement-breakpoint
CREATE TABLE `program_enrollment_request` (
	`id` text PRIMARY KEY NOT NULL,
	`student_id` text NOT NULL,
	`program_id` text NOT NULL,
	`status` text DEFAULT 'pending' NOT NULL,
	`decided_at` integer,
	`created_at` integer NOT NULL,
	`updated_at` integer NOT NULL,
	FOREIGN KEY (`student_id`) REFERENCES `user`(`id`) ON UPDATE no action ON DELETE cascade,
	FOREIGN KEY (`program_id`) REFERENCES `program`(`id`) ON UPDATE no action ON DELETE cascade
);
--> statement-breakpoint
CREATE UNIQUE INDEX `program_enrollment_request_student_program_unique` ON `program_enrollment_request` (`student_id`,`program_id`);
--> statement-breakpoint
CREATE TABLE `program_enrollment` (
	`id` text PRIMARY KEY NOT NULL,
	`student_id` text NOT NULL,
	`program_id` text NOT NULL,
	`starts_on` text NOT NULL,
	`created_at` integer NOT NULL,
	`updated_at` integer NOT NULL,
	FOREIGN KEY (`student_id`) REFERENCES `user`(`id`) ON UPDATE no action ON DELETE cascade,
	FOREIGN KEY (`program_id`) REFERENCES `program`(`id`) ON UPDATE no action ON DELETE cascade
);
--> statement-breakpoint
CREATE UNIQUE INDEX `program_enrollment_student_program_unique` ON `program_enrollment` (`student_id`,`program_id`);
--> statement-breakpoint
ALTER TABLE `course` ADD `description` text NOT NULL DEFAULT '';
--> statement-breakpoint
ALTER TABLE `course` ADD `position` integer NOT NULL DEFAULT 0;
--> statement-breakpoint
ALTER TABLE `lesson` ADD `video_url` text NOT NULL DEFAULT '';
--> statement-breakpoint
ALTER TABLE `lesson` ADD `position` integer NOT NULL DEFAULT 0;
--> statement-breakpoint
ALTER TABLE `question` ADD `position` integer NOT NULL DEFAULT 0;
--> statement-breakpoint
ALTER TABLE `question_option` ADD `position` integer NOT NULL DEFAULT 0;
--> statement-breakpoint
CREATE TABLE `question_row` (
	`id` text PRIMARY KEY NOT NULL,
	`text` text NOT NULL,
	`position` integer NOT NULL DEFAULT 0,
	`question_id` text NOT NULL,
	`created_at` integer NOT NULL,
	`updated_at` integer NOT NULL,
	FOREIGN KEY (`question_id`) REFERENCES `question`(`id`) ON UPDATE no action ON DELETE cascade
);
