ALTER TABLE `program_application` RENAME TO `program_enrollment`;
--> statement-breakpoint
DROP INDEX IF EXISTS `program_application_student_program_unique`;
--> statement-breakpoint
CREATE UNIQUE INDEX `program_enrollment_student_program_unique` ON `program_enrollment` (`student_id`,`program_id`);
