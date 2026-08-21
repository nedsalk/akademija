import { integer, sqliteTable, text, uniqueIndex } from "drizzle-orm/sqlite-core";
import {
  ASSESSMENT_ATTEMPT_STATUSES,
  ASSESSMENT_KINDS,
  ATTENDANCE_VIOLATION_STATUSES,
  DISCUSSION_STATUSES,
  ENROLLMENT_REQUEST_STATUSES,
  NOTIFICATION_KINDS,
  NOTIFICATION_STATUSES,
  QUESTION_TYPES,
  USER_ROLES,
} from "../domain/constants";

export const user = sqliteTable("user", {
  id: text("id").primaryKey(),
  name: text("name").notNull(),
  email: text("email").notNull().unique(),
  emailVerified: integer("email_verified", { mode: "boolean" }).notNull(),
  image: text("image"),
  createdAt: integer("created_at", { mode: "timestamp" }).notNull(),
  updatedAt: integer("updated_at", { mode: "timestamp" }).notNull(),
  role: text("role", { enum: USER_ROLES }).notNull().default("student"),
  phone: text("phone"),
});

export const session = sqliteTable("session", {
  id: text("id").primaryKey(),
  expiresAt: integer("expires_at", { mode: "timestamp" }).notNull(),
  token: text("token").notNull().unique(),
  createdAt: integer("created_at", { mode: "timestamp" }).notNull(),
  updatedAt: integer("updated_at", { mode: "timestamp" }).notNull(),
  ipAddress: text("ip_address"),
  userAgent: text("user_agent"),
  userId: text("user_id")
    .notNull()
    .references(() => user.id, { onDelete: "cascade" }),
});

export const account = sqliteTable("account", {
  id: text("id").primaryKey(),
  accountId: text("account_id").notNull(),
  providerId: text("provider_id").notNull(),
  userId: text("user_id")
    .notNull()
    .references(() => user.id, { onDelete: "cascade" }),
  accessToken: text("access_token"),
  refreshToken: text("refresh_token"),
  idToken: text("id_token"),
  accessTokenExpiresAt: integer("access_token_expires_at", {
    mode: "timestamp",
  }),
  refreshTokenExpiresAt: integer("refresh_token_expires_at", {
    mode: "timestamp",
  }),
  scope: text("scope"),
  password: text("password"),
  createdAt: integer("created_at", { mode: "timestamp" }).notNull(),
  updatedAt: integer("updated_at", { mode: "timestamp" }).notNull(),
});

export const verification = sqliteTable("verification", {
  id: text("id").primaryKey(),
  identifier: text("identifier").notNull(),
  value: text("value").notNull(),
  expiresAt: integer("expires_at", { mode: "timestamp" }).notNull(),
  createdAt: integer("created_at", { mode: "timestamp" }),
  updatedAt: integer("updated_at", { mode: "timestamp" }),
});

export const program = sqliteTable("program", {
  id: text("id")
    .primaryKey()
    .$defaultFn(() => crypto.randomUUID()),
  name: text("name").notNull(),
  description: text("description").notNull().default(""),
  teacherId: text("teacher_id")
    .notNull()
    .references(() => user.id, { onDelete: "cascade" }),
  createdAt: integer("created_at", { mode: "timestamp" }).notNull(),
  updatedAt: integer("updated_at", { mode: "timestamp" }).notNull(),
});

export const course = sqliteTable("course", {
  id: text("id")
    .primaryKey()
    .$defaultFn(() => crypto.randomUUID()),
  name: text("name").notNull(),
  description: text("description").notNull().default(""),
  position: integer("position").notNull().default(0),
  textbookId: text("textbook_id").references(() => textbook.id, {
    onDelete: "set null",
  }),
  programId: text("program_id")
    .notNull()
    .references(() => program.id, { onDelete: "cascade" }),
  createdAt: integer("created_at", { mode: "timestamp" }).notNull(),
  updatedAt: integer("updated_at", { mode: "timestamp" }).notNull(),
});

export const textbook = sqliteTable("textbook", {
  id: text("id")
    .primaryKey()
    .$defaultFn(() => crypto.randomUUID()),
  title: text("title").notNull(),
  author: text("author").notNull(),
  description: text("description").notNull().default(""),
  createdAt: integer("created_at", { mode: "timestamp" }).notNull(),
  updatedAt: integer("updated_at", { mode: "timestamp" }).notNull(),
});

export const lesson = sqliteTable("lesson", {
  id: text("id")
    .primaryKey()
    .$defaultFn(() => crypto.randomUUID()),
  name: text("name").notNull(),
  videoUrl: text("video_url").notNull().default(""),
  position: integer("position").notNull().default(0),
  courseId: text("course_id")
    .notNull()
    .references(() => course.id, { onDelete: "cascade" }),
  createdAt: integer("created_at", { mode: "timestamp" }).notNull(),
  updatedAt: integer("updated_at", { mode: "timestamp" }).notNull(),
});

export const question = sqliteTable("question", {
  id: text("id")
    .primaryKey()
    .$defaultFn(() => crypto.randomUUID()),
  text: text("text").notNull(),
  type: text("type", { enum: QUESTION_TYPES }).notNull(),
  position: integer("position").notNull().default(0),
  lessonId: text("lesson_id")
    .notNull()
    .references(() => lesson.id, { onDelete: "cascade" }),
  createdAt: integer("created_at", { mode: "timestamp" }).notNull(),
  updatedAt: integer("updated_at", { mode: "timestamp" }).notNull(),
});

export const questionOption = sqliteTable("question_option", {
  id: text("id")
    .primaryKey()
    .$defaultFn(() => crypto.randomUUID()),
  text: text("text").notNull(),
  isCorrect: integer("is_correct", { mode: "boolean" }).notNull().default(false),
  position: integer("position").notNull().default(0),
  questionId: text("question_id")
    .notNull()
    .references(() => question.id, { onDelete: "cascade" }),
  createdAt: integer("created_at", { mode: "timestamp" }).notNull(),
  updatedAt: integer("updated_at", { mode: "timestamp" }).notNull(),
});

export const questionRow = sqliteTable("question_row", {
  id: text("id")
    .primaryKey()
    .$defaultFn(() => crypto.randomUUID()),
  text: text("text").notNull(),
  position: integer("position").notNull().default(0),
  questionId: text("question_id")
    .notNull()
    .references(() => question.id, { onDelete: "cascade" }),
  createdAt: integer("created_at", { mode: "timestamp" }).notNull(),
  updatedAt: integer("updated_at", { mode: "timestamp" }).notNull(),
});

export const questionGridAnswer = sqliteTable(
  "question_grid_answer",
  {
    id: text("id")
      .primaryKey()
      .$defaultFn(() => crypto.randomUUID()),
    questionOptionId: text("question_option_id")
      .notNull()
      .references(() => questionOption.id, { onDelete: "cascade" }),
    questionRowId: text("question_row_id")
      .notNull()
      .references(() => questionRow.id, { onDelete: "cascade" }),
    createdAt: integer("created_at", { mode: "timestamp" }).notNull(),
    updatedAt: integer("updated_at", { mode: "timestamp" }).notNull(),
  },
  (table) => [
    uniqueIndex("question_grid_answer_option_row_unique").on(
      table.questionOptionId,
      table.questionRowId,
    ),
  ],
);

export const programEnrollmentRequest = sqliteTable(
  "program_enrollment_request",
  {
    id: text("id")
      .primaryKey()
      .$defaultFn(() => crypto.randomUUID()),
    studentId: text("student_id")
      .notNull()
      .references(() => user.id, { onDelete: "cascade" }),
    programId: text("program_id")
      .notNull()
      .references(() => program.id, { onDelete: "cascade" }),
    status: text("status", { enum: ENROLLMENT_REQUEST_STATUSES }).notNull().default("pending"),
    decidedAt: integer("decided_at", { mode: "timestamp" }),
    createdAt: integer("created_at", { mode: "timestamp" }).notNull(),
    updatedAt: integer("updated_at", { mode: "timestamp" }).notNull(),
  },
  (table) => [
    uniqueIndex("program_enrollment_request_student_program_unique").on(
      table.studentId,
      table.programId,
    ),
  ],
);

export const programEnrollment = sqliteTable(
  "program_enrollment",
  {
    id: text("id")
      .primaryKey()
      .$defaultFn(() => crypto.randomUUID()),
    studentId: text("student_id")
      .notNull()
      .references(() => user.id, { onDelete: "cascade" }),
    programId: text("program_id")
      .notNull()
      .references(() => program.id, { onDelete: "cascade" }),
    startsOn: text("starts_on").notNull(),
    createdAt: integer("created_at", { mode: "timestamp" }).notNull(),
    updatedAt: integer("updated_at", { mode: "timestamp" }).notNull(),
  },
  (table) => [
    uniqueIndex("program_enrollment_student_program_unique").on(table.studentId, table.programId),
  ],
);

export const lessonCompletion = sqliteTable(
  "lesson_completion",
  {
    id: text("id")
      .primaryKey()
      .$defaultFn(() => crypto.randomUUID()),
    studentId: text("student_id")
      .notNull()
      .references(() => user.id, { onDelete: "cascade" }),
    lessonId: text("lesson_id")
      .notNull()
      .references(() => lesson.id, { onDelete: "cascade" }),
    completedAt: integer("completed_at", { mode: "timestamp" }).notNull(),
    createdAt: integer("created_at", { mode: "timestamp" }).notNull(),
    updatedAt: integer("updated_at", { mode: "timestamp" }).notNull(),
  },
  (table) => [
    uniqueIndex("lesson_completion_student_lesson_unique").on(table.studentId, table.lessonId),
  ],
);

export const lessonListen = sqliteTable(
  "lesson_listen",
  {
    id: text("id")
      .primaryKey()
      .$defaultFn(() => crypto.randomUUID()),
    studentId: text("student_id")
      .notNull()
      .references(() => user.id, { onDelete: "cascade" }),
    lessonId: text("lesson_id")
      .notNull()
      .references(() => lesson.id, { onDelete: "cascade" }),
    listenedAt: integer("listened_at", { mode: "timestamp" }).notNull(),
    createdAt: integer("created_at", { mode: "timestamp" }).notNull(),
    updatedAt: integer("updated_at", { mode: "timestamp" }).notNull(),
  },
  (table) => [
    uniqueIndex("lesson_listen_student_lesson_unique").on(table.studentId, table.lessonId),
  ],
);

export const lessonAnswerSubmission = sqliteTable(
  "lesson_answer_submission",
  {
    id: text("id")
      .primaryKey()
      .$defaultFn(() => crypto.randomUUID()),
    studentId: text("student_id")
      .notNull()
      .references(() => user.id, { onDelete: "cascade" }),
    lessonId: text("lesson_id")
      .notNull()
      .references(() => lesson.id, { onDelete: "cascade" }),
    createdAt: integer("created_at", { mode: "timestamp" }).notNull(),
    updatedAt: integer("updated_at", { mode: "timestamp" }).notNull(),
  },
  (table) => [
    uniqueIndex("lesson_answer_submission_student_lesson_unique").on(
      table.studentId,
      table.lessonId,
    ),
  ],
);

export const lessonAnswerSelection = sqliteTable("lesson_answer_selection", {
  id: text("id")
    .primaryKey()
    .$defaultFn(() => crypto.randomUUID()),
  submissionId: text("submission_id")
    .notNull()
    .references(() => lessonAnswerSubmission.id, { onDelete: "cascade" }),
  questionId: text("question_id")
    .notNull()
    .references(() => question.id, { onDelete: "cascade" }),
  questionOptionId: text("question_option_id")
    .notNull()
    .references(() => questionOption.id, { onDelete: "cascade" }),
  questionRowId: text("question_row_id").references(() => questionRow.id, {
    onDelete: "cascade",
  }),
  createdAt: integer("created_at", { mode: "timestamp" }).notNull(),
  updatedAt: integer("updated_at", { mode: "timestamp" }).notNull(),
});

export const assessment = sqliteTable("assessment", {
  id: text("id")
    .primaryKey()
    .$defaultFn(() => crypto.randomUUID()),
  kind: text("kind", { enum: ASSESSMENT_KINDS }).notNull(),
  title: text("title").notNull(),
  courseId: text("course_id")
    .notNull()
    .references(() => course.id, { onDelete: "cascade" }),
  weekNumber: integer("week_number"),
  opensAt: integer("opens_at", { mode: "timestamp" }).notNull(),
  closesAt: integer("closes_at", { mode: "timestamp" }).notNull(),
  passingThresholdPercent: integer("passing_threshold_percent").notNull().default(70),
  createdAt: integer("created_at", { mode: "timestamp" }).notNull(),
  updatedAt: integer("updated_at", { mode: "timestamp" }).notNull(),
});

export const assessmentQuestion = sqliteTable(
  "assessment_question",
  {
    id: text("id")
      .primaryKey()
      .$defaultFn(() => crypto.randomUUID()),
    assessmentId: text("assessment_id")
      .notNull()
      .references(() => assessment.id, { onDelete: "cascade" }),
    questionId: text("question_id")
      .notNull()
      .references(() => question.id, { onDelete: "cascade" }),
    position: integer("position").notNull().default(0),
    createdAt: integer("created_at", { mode: "timestamp" }).notNull(),
    updatedAt: integer("updated_at", { mode: "timestamp" }).notNull(),
  },
  (table) => [
    uniqueIndex("assessment_question_assessment_question_unique").on(
      table.assessmentId,
      table.questionId,
    ),
  ],
);

export const assessmentAttempt = sqliteTable("assessment_attempt", {
  id: text("id")
    .primaryKey()
    .$defaultFn(() => crypto.randomUUID()),
  assessmentId: text("assessment_id")
    .notNull()
    .references(() => assessment.id, { onDelete: "cascade" }),
  studentId: text("student_id")
    .notNull()
    .references(() => user.id, { onDelete: "cascade" }),
  scorePercent: integer("score_percent").notNull(),
  status: text("status", { enum: ASSESSMENT_ATTEMPT_STATUSES }).notNull(),
  submittedAt: integer("submitted_at", { mode: "timestamp" }).notNull(),
  retryAvailableAt: integer("retry_available_at", { mode: "timestamp" }),
  createdAt: integer("created_at", { mode: "timestamp" }).notNull(),
  updatedAt: integer("updated_at", { mode: "timestamp" }).notNull(),
});

export const assessmentAttemptSelection = sqliteTable("assessment_attempt_selection", {
  id: text("id")
    .primaryKey()
    .$defaultFn(() => crypto.randomUUID()),
  attemptId: text("attempt_id")
    .notNull()
    .references(() => assessmentAttempt.id, { onDelete: "cascade" }),
  questionId: text("question_id")
    .notNull()
    .references(() => question.id, { onDelete: "cascade" }),
  questionOptionId: text("question_option_id")
    .notNull()
    .references(() => questionOption.id, { onDelete: "cascade" }),
  questionRowId: text("question_row_id").references(() => questionRow.id, {
    onDelete: "cascade",
  }),
  createdAt: integer("created_at", { mode: "timestamp" }).notNull(),
  updatedAt: integer("updated_at", { mode: "timestamp" }).notNull(),
});

export const lessonDiscussion = sqliteTable("lesson_discussion", {
  id: text("id")
    .primaryKey()
    .$defaultFn(() => crypto.randomUUID()),
  lessonId: text("lesson_id")
    .notNull()
    .references(() => lesson.id, { onDelete: "cascade" }),
  authorId: text("author_id")
    .notNull()
    .references(() => user.id, { onDelete: "cascade" }),
  parentId: text("parent_id"),
  body: text("body").notNull(),
  status: text("status", { enum: DISCUSSION_STATUSES }).notNull().default("pending"),
  createdAt: integer("created_at", { mode: "timestamp" }).notNull(),
  updatedAt: integer("updated_at", { mode: "timestamp" }).notNull(),
});

export const attendanceRule = sqliteTable(
  "attendance_rule",
  {
    id: text("id")
      .primaryKey()
      .$defaultFn(() => crypto.randomUUID()),
    courseId: text("course_id")
      .notNull()
      .references(() => course.id, { onDelete: "cascade" }),
    maxConsecutiveMissedLessons: integer("max_consecutive_missed_lessons").notNull(),
    createdAt: integer("created_at", { mode: "timestamp" }).notNull(),
    updatedAt: integer("updated_at", { mode: "timestamp" }).notNull(),
  },
  (table) => [uniqueIndex("attendance_rule_course_unique").on(table.courseId)],
);

export const attendanceViolation = sqliteTable(
  "attendance_violation",
  {
    id: text("id")
      .primaryKey()
      .$defaultFn(() => crypto.randomUUID()),
    courseId: text("course_id")
      .notNull()
      .references(() => course.id, { onDelete: "cascade" }),
    studentId: text("student_id")
      .notNull()
      .references(() => user.id, { onDelete: "cascade" }),
    consecutiveMissedLessons: integer("consecutive_missed_lessons").notNull(),
    status: text("status", { enum: ATTENDANCE_VIOLATION_STATUSES }).notNull().default("open"),
    createdAt: integer("created_at", { mode: "timestamp" }).notNull(),
    updatedAt: integer("updated_at", { mode: "timestamp" }).notNull(),
  },
  (table) => [
    uniqueIndex("attendance_violation_course_student_unique").on(table.courseId, table.studentId),
  ],
);

export const notificationSubscription = sqliteTable(
  "notification_subscription",
  {
    id: text("id")
      .primaryKey()
      .$defaultFn(() => crypto.randomUUID()),
    userId: text("user_id")
      .notNull()
      .references(() => user.id, { onDelete: "cascade" }),
    endpoint: text("endpoint").notNull(),
    createdAt: integer("created_at", { mode: "timestamp" }).notNull(),
    updatedAt: integer("updated_at", { mode: "timestamp" }).notNull(),
  },
  (table) => [uniqueIndex("notification_subscription_user_unique").on(table.userId)],
);

export const notificationRecord = sqliteTable(
  "notification_record",
  {
    id: text("id")
      .primaryKey()
      .$defaultFn(() => crypto.randomUUID()),
    recipientUserId: text("recipient_user_id")
      .notNull()
      .references(() => user.id, { onDelete: "cascade" }),
    kind: text("kind", { enum: NOTIFICATION_KINDS }).notNull(),
    title: text("title").notNull(),
    body: text("body").notNull().default(""),
    dedupeKey: text("dedupe_key").notNull(),
    status: text("status", { enum: NOTIFICATION_STATUSES }).notNull().default("pending"),
    createdAt: integer("created_at", { mode: "timestamp" }).notNull(),
    updatedAt: integer("updated_at", { mode: "timestamp" }).notNull(),
  },
  (table) => [uniqueIndex("notification_record_dedupe_unique").on(table.dedupeKey)],
);
