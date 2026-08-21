CREATE TABLE `attendance_rule` (
  `id` text PRIMARY KEY NOT NULL,
  `course_id` text NOT NULL,
  `max_consecutive_missed_lessons` integer NOT NULL,
  `created_at` integer NOT NULL,
  `updated_at` integer NOT NULL,
  FOREIGN KEY (`course_id`) REFERENCES `course`(`id`) ON UPDATE no action ON DELETE cascade
);
--> statement-breakpoint
CREATE UNIQUE INDEX `attendance_rule_course_unique` ON `attendance_rule` (`course_id`);
--> statement-breakpoint
CREATE TABLE `attendance_violation` (
  `id` text PRIMARY KEY NOT NULL,
  `course_id` text NOT NULL,
  `student_id` text NOT NULL,
  `consecutive_missed_lessons` integer NOT NULL,
  `status` text DEFAULT 'open' NOT NULL,
  `created_at` integer NOT NULL,
  `updated_at` integer NOT NULL,
  FOREIGN KEY (`course_id`) REFERENCES `course`(`id`) ON UPDATE no action ON DELETE cascade,
  FOREIGN KEY (`student_id`) REFERENCES `user`(`id`) ON UPDATE no action ON DELETE cascade
);
--> statement-breakpoint
CREATE UNIQUE INDEX `attendance_violation_course_student_unique` ON `attendance_violation` (`course_id`,`student_id`);
