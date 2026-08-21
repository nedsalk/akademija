CREATE TABLE `lesson_discussion` (
  `id` text PRIMARY KEY NOT NULL,
  `lesson_id` text NOT NULL,
  `author_id` text NOT NULL,
  `parent_id` text,
  `body` text NOT NULL,
  `status` text DEFAULT 'pending' NOT NULL,
  `created_at` integer NOT NULL,
  `updated_at` integer NOT NULL,
  FOREIGN KEY (`lesson_id`) REFERENCES `lesson`(`id`) ON UPDATE no action ON DELETE cascade,
  FOREIGN KEY (`author_id`) REFERENCES `user`(`id`) ON UPDATE no action ON DELETE cascade
);
