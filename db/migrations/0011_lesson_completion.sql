CREATE TABLE `lesson_completion` (
  `id` text PRIMARY KEY NOT NULL,
  `student_id` text NOT NULL,
  `lesson_id` text NOT NULL,
  `completed_at` integer NOT NULL,
  `created_at` integer NOT NULL,
  `updated_at` integer NOT NULL,
  FOREIGN KEY (`student_id`) REFERENCES `user`(`id`) ON UPDATE no action ON DELETE cascade,
  FOREIGN KEY (`lesson_id`) REFERENCES `lesson`(`id`) ON UPDATE no action ON DELETE cascade
);
--> statement-breakpoint
CREATE UNIQUE INDEX `lesson_completion_student_lesson_unique` ON `lesson_completion` (`student_id`,`lesson_id`);
