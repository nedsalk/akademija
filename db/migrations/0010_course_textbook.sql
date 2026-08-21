CREATE TABLE `textbook` (
  `id` text PRIMARY KEY NOT NULL,
  `title` text NOT NULL,
  `author` text NOT NULL,
  `description` text DEFAULT '' NOT NULL,
  `created_at` integer NOT NULL,
  `updated_at` integer NOT NULL
);
--> statement-breakpoint

ALTER TABLE `course` ADD `textbook_id` text REFERENCES textbook(id) ON DELETE set null;
