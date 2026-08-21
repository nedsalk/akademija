import type {
  ASSESSMENT_KINDS,
  ATTENDANCE_VIOLATION_STATUSES,
  CERTIFICATE_STATUSES,
  DISCUSSION_AUTHOR_ROLES,
  DISCUSSION_STATUSES,
  ENROLLMENT_REQUEST_STATUSES,
  NOTIFICATION_KINDS,
  NOTIFICATION_STATUSES,
  QUESTION_TYPES,
  USER_ROLES,
} from "./constants";

export type UserRole = (typeof USER_ROLES)[number];

export type QuestionType = (typeof QUESTION_TYPES)[number];

export type EnrollmentRequestStatus = (typeof ENROLLMENT_REQUEST_STATUSES)[number];
export type LessonStatus = "not-listened" | "listened" | "completed";

export type AssessmentKind = (typeof ASSESSMENT_KINDS)[number];
export type AssessmentStatus =
  | "draft"
  | "published"
  | "available"
  | "submitted"
  | "passed"
  | "failed";

export type DiscussionStatus = (typeof DISCUSSION_STATUSES)[number];
export type DiscussionAuthorRole = (typeof DISCUSSION_AUTHOR_ROLES)[number];

export type AttendanceViolationStatus = (typeof ATTENDANCE_VIOLATION_STATUSES)[number];

export type NotificationKind = (typeof NOTIFICATION_KINDS)[number];
export type NotificationStatus = (typeof NOTIFICATION_STATUSES)[number];

export type CertificateStatus = (typeof CERTIFICATE_STATUSES)[number];

export interface DateWindow {
  opensAt: Date;
  closesAt: Date;
}

export interface User {
  id: string;
  name: string;
  email: string;
  phone: string;
  password?: string;
  role?: UserRole;
}

export interface Textbook {
  id: string;
  title: string;
  author: string;
  description: string;
}

export interface Program {
  id: string;
  name: string;
  description?: string;
  teacherId?: string;
  teacher?: User;
}

export interface Course {
  id: string;
  name: string;
  description?: string;
  position?: number;
  programId?: string;
  program?: Program;
  textbookId?: string | null;
  textbook?: Textbook | null;
}

export interface Lesson {
  id: string;
  name: string;
  videoUrl?: string;
  position?: number;
  courseId?: string;
  course?: Course;
  status?: LessonStatus;
}

export interface ProgramSummary {
  id: string;
  name: string;
  description: string;
  teacherId: string;
}

export interface CourseSummary {
  id: string;
  programId: string;
  name: string;
  position: number;
}

export interface LessonSummary {
  id: string;
  courseId: string;
  name: string;
  position: number;
}

export interface QuestionOption {
  id?: string;
  text: string;
  isCorrect: boolean;
}

export interface QuestionRow {
  id?: string;
  text: string;
}

export interface Question {
  id: string;
  text: string;
  type: QuestionType;
  options: QuestionOption[];
  rows?: string[];
  lessonId?: string;
  lesson?: Lesson;
}

export interface EnrollmentApplication {
  programId: string;
  studentId: string;
  status: EnrollmentRequestStatus;
}

export interface Enrollment {
  programId: string;
  studentId: string;
  startsOn?: string;
  progress?: EnrollmentProgress;
}

export interface EnrollmentProgress {
  completedLessonIds?: string[];
}

export interface StudentProgram {
  student: User;
  program: Program;
}

export interface TeacherProgram {
  teacher: User;
  program: Program;
}

export interface TeacherCourse {
  teacher: User;
  course: Course;
}

export interface TeacherLesson {
  teacher: User;
  lesson: Lesson;
}

export interface StudentProgramCourse extends StudentProgram {
  course: Course;
}

export interface StudentProgramLesson extends StudentProgram {
  lesson: Lesson;
}

export interface StudentProgramLessons extends StudentProgram {
  lessons: [Lesson, Lesson];
}

export interface TeacherLessonQuestion extends TeacherLesson {
  question: Question;
}

export interface TeacherLessonQuestions extends TeacherLesson {
  questions: Question[];
}

export interface StudentProgramLessonQuestion extends StudentProgramLesson {
  question: Question;
}

export interface AssessmentRecord {
  id: string;
  kind: AssessmentKind;
  status: AssessmentStatus;
  score?: number;
  passingThresholdPercent?: number;
  availableWindow?: DateWindow;
  course: Course;
  student: User;
}

export interface DiscussionRecord {
  id: string;
  status: DiscussionStatus;
  body: string;
  author: User;
  authorRole: DiscussionAuthorRole;
  lesson: Lesson;
  parentId?: string | null;
}

export interface AttendanceRule {
  course: Course;
  maxConsecutiveMissedLessons: number;
}

export interface AttendanceViolation {
  id: string;
  status: AttendanceViolationStatus;
  consecutiveMissedLessons: number;
  student: User;
  course: Course;
}

export interface NotificationRecord {
  id: string;
  kind: NotificationKind;
  status: NotificationStatus;
  recipient: User;
  scheduledAt?: Date;
  sentAt?: Date;
}

export interface CertificateRecord {
  id: string;
  status: CertificateStatus;
  student: User;
  course: Course;
  completedAt: Date;
  teacherSignature: string;
}
