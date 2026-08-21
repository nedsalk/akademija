CREATE TABLE `question_grid_answer` (
  `id` text PRIMARY KEY NOT NULL,
  `question_option_id` text NOT NULL,
  `question_row_id` text NOT NULL,
  `created_at` integer NOT NULL,
  `updated_at` integer NOT NULL,
  FOREIGN KEY (`question_option_id`) REFERENCES `question_option`(`id`) ON UPDATE no action ON DELETE cascade,
  FOREIGN KEY (`question_row_id`) REFERENCES `question_row`(`id`) ON UPDATE no action ON DELETE cascade
);
--> statement-breakpoint
CREATE UNIQUE INDEX `question_grid_answer_option_row_unique` ON `question_grid_answer` (`question_option_id`,`question_row_id`);
