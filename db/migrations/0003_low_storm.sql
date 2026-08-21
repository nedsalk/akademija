CREATE TABLE `lesson` (
	`id` text PRIMARY KEY NOT NULL,
	`name` text NOT NULL,
	`course_id` text NOT NULL,
	`created_at` integer NOT NULL,
	`updated_at` integer NOT NULL,
	FOREIGN KEY (`course_id`) REFERENCES `course`(`id`) ON UPDATE no action ON DELETE cascade
);
