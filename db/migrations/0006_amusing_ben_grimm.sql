CREATE TABLE `program_application` (
	`id` text PRIMARY KEY NOT NULL,
	`student_id` text NOT NULL,
	`program_id` text NOT NULL,
	`status` text DEFAULT 'pending' NOT NULL,
	`created_at` integer NOT NULL,
	`updated_at` integer NOT NULL,
	FOREIGN KEY (`student_id`) REFERENCES `user`(`id`) ON UPDATE no action ON DELETE cascade,
	FOREIGN KEY (`program_id`) REFERENCES `program`(`id`) ON UPDATE no action ON DELETE cascade
);
--> statement-breakpoint
CREATE UNIQUE INDEX `program_application_student_program_unique` ON `program_application` (`student_id`,`program_id`);