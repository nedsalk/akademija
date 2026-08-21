CREATE TABLE `lesson_answer_submission` (
  `id` text PRIMARY KEY NOT NULL,
  `student_id` text NOT NULL,
  `lesson_id` text NOT NULL,
  `created_at` integer NOT NULL,
  `updated_at` integer NOT NULL,
  FOREIGN KEY (`student_id`) REFERENCES `user`(`id`) ON UPDATE no action ON DELETE cascade,
  FOREIGN KEY (`lesson_id`) REFERENCES `lesson`(`id`) ON UPDATE no action ON DELETE cascade
);
--> statement-breakpoint
CREATE UNIQUE INDEX `lesson_answer_submission_student_lesson_unique` ON `lesson_answer_submission` (`student_id`,`lesson_id`);
--> statement-breakpoint
CREATE TABLE `lesson_answer_selection` (
  `id` text PRIMARY KEY NOT NULL,
  `submission_id` text NOT NULL,
  `question_id` text NOT NULL,
  `question_option_id` text NOT NULL,
  `question_row_id` text,
  `created_at` integer NOT NULL,
  `updated_at` integer NOT NULL,
  FOREIGN KEY (`submission_id`) REFERENCES `lesson_answer_submission`(`id`) ON UPDATE no action ON DELETE cascade,
  FOREIGN KEY (`question_id`) REFERENCES `question`(`id`) ON UPDATE no action ON DELETE cascade,
  FOREIGN KEY (`question_option_id`) REFERENCES `question_option`(`id`) ON UPDATE no action ON DELETE cascade,
  FOREIGN KEY (`question_row_id`) REFERENCES `question_row`(`id`) ON UPDATE no action ON DELETE cascade
);
