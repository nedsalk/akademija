CREATE TABLE `assessment` (
  `id` text PRIMARY KEY NOT NULL,
  `kind` text NOT NULL,
  `title` text NOT NULL,
  `course_id` text NOT NULL,
  `week_number` integer,
  `opens_at` integer NOT NULL,
  `closes_at` integer NOT NULL,
  `passing_threshold_percent` integer DEFAULT 70 NOT NULL,
  `created_at` integer NOT NULL,
  `updated_at` integer NOT NULL,
  FOREIGN KEY (`course_id`) REFERENCES `course`(`id`) ON UPDATE no action ON DELETE cascade
);
--> statement-breakpoint
CREATE TABLE `assessment_question` (
  `id` text PRIMARY KEY NOT NULL,
  `assessment_id` text NOT NULL,
  `question_id` text NOT NULL,
  `position` integer DEFAULT 0 NOT NULL,
  `created_at` integer NOT NULL,
  `updated_at` integer NOT NULL,
  FOREIGN KEY (`assessment_id`) REFERENCES `assessment`(`id`) ON UPDATE no action ON DELETE cascade,
  FOREIGN KEY (`question_id`) REFERENCES `question`(`id`) ON UPDATE no action ON DELETE cascade
);
--> statement-breakpoint
CREATE UNIQUE INDEX `assessment_question_assessment_question_unique` ON `assessment_question` (`assessment_id`,`question_id`);
--> statement-breakpoint
CREATE TABLE `assessment_attempt` (
  `id` text PRIMARY KEY NOT NULL,
  `assessment_id` text NOT NULL,
  `student_id` text NOT NULL,
  `score_percent` integer NOT NULL,
  `status` text NOT NULL,
  `submitted_at` integer NOT NULL,
  `retry_available_at` integer,
  `created_at` integer NOT NULL,
  `updated_at` integer NOT NULL,
  FOREIGN KEY (`assessment_id`) REFERENCES `assessment`(`id`) ON UPDATE no action ON DELETE cascade,
  FOREIGN KEY (`student_id`) REFERENCES `user`(`id`) ON UPDATE no action ON DELETE cascade
);
--> statement-breakpoint
CREATE TABLE `assessment_attempt_selection` (
  `id` text PRIMARY KEY NOT NULL,
  `attempt_id` text NOT NULL,
  `question_id` text NOT NULL,
  `question_option_id` text NOT NULL,
  `question_row_id` text,
  `created_at` integer NOT NULL,
  `updated_at` integer NOT NULL,
  FOREIGN KEY (`attempt_id`) REFERENCES `assessment_attempt`(`id`) ON UPDATE no action ON DELETE cascade,
  FOREIGN KEY (`question_id`) REFERENCES `question`(`id`) ON UPDATE no action ON DELETE cascade,
  FOREIGN KEY (`question_option_id`) REFERENCES `question_option`(`id`) ON UPDATE no action ON DELETE cascade,
  FOREIGN KEY (`question_row_id`) REFERENCES `question_row`(`id`) ON UPDATE no action ON DELETE cascade
);
