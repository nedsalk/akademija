export const USER_ROLES = ["admin", "teacher", "student"] as const;

export const QUESTION_TYPES = ["radio", "checkbox", "radio-grid", "checkbox-grid"] as const;

export const ENROLLMENT_REQUEST_STATUSES = ["pending", "approved", "rejected"] as const;

export const ASSESSMENT_KINDS = ["weekly", "final"] as const;
export const ASSESSMENT_ATTEMPT_STATUSES = ["passed", "failed"] as const;
export const DISCUSSION_STATUSES = ["pending", "approved", "rejected"] as const;
export const DISCUSSION_AUTHOR_ROLES = ["student", "teacher"] as const;
export const ATTENDANCE_VIOLATION_STATUSES = ["open", "acknowledged"] as const;

export const NOTIFICATION_KINDS = [
  "lesson_release",
  "lesson_reminder",
  "discussion_question",
  "attendance_violation",
] as const;

export const NOTIFICATION_STATUSES = ["pending", "sent", "failed"] as const;
export const CERTIFICATE_STATUSES = ["unavailable", "available", "downloaded"] as const;
