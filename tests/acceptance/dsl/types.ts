import type {
  AssessmentRecord as DomainAssessmentRecord,
  AttendanceRule as DomainAttendanceRule,
  AttendanceViolation as DomainAttendanceViolation,
  CertificateRecord as DomainCertificateRecord,
  Course as DomainCourse,
  DiscussionRecord as DomainDiscussionRecord,
  Enrollment as DomainEnrollment,
  EnrollmentApplication as DomainEnrollmentApplication,
  Lesson as DomainLesson,
  NotificationRecord as DomainNotificationRecord,
  Program as DomainProgram,
  Question as DomainQuestion,
  QuestionOption as DomainQuestionOption,
  StudentProgram as DomainStudentProgram,
  StudentProgramCourse as DomainStudentProgramCourse,
  StudentProgramLesson as DomainStudentProgramLesson,
  StudentProgramLessonQuestion as DomainStudentProgramLessonQuestion,
  StudentProgramLessons as DomainStudentProgramLessons,
  TeacherCourse as DomainTeacherCourse,
  TeacherLesson as DomainTeacherLesson,
  TeacherLessonQuestion as DomainTeacherLessonQuestion,
  TeacherLessonQuestions as DomainTeacherLessonQuestions,
  TeacherProgram as DomainTeacherProgram,
  Textbook as DomainTextbook,
  User as DomainUser,
  EnrollmentRequestStatus,
  UserRole,
} from "../../../src/domain/types";

export type { EnrollmentRequestStatus, UserRole };

export interface Visitor {
  testId: string;
}

export interface User extends DomainUser, Visitor {
  password: string;
}

export interface Program extends DomainProgram {
  teacher: User;
}

export interface Course extends DomainCourse {
  program: Program;
}

export interface Textbook extends DomainTextbook {}

export interface Lesson extends DomainLesson {
  course: Course;
}

export interface QuestionOption extends DomainQuestionOption {
  correctRows?: number[];
}

export interface Question extends Omit<DomainQuestion, "lesson"> {
  lesson: Lesson;
  options: QuestionOption[];
  rows?: string[];
}

export interface StudentProgram extends Omit<DomainStudentProgram, "student" | "program"> {
  student: User;
  program: Program;
}

export interface StudentProgramCourse extends Omit<
  DomainStudentProgramCourse,
  "student" | "program" | "course"
> {
  student: User;
  program: Program;
  course: Course;
}

export interface StudentProgramLesson extends Omit<
  DomainStudentProgramLesson,
  "student" | "program" | "lesson"
> {
  student: User;
  program: Program;
  lesson: Lesson;
}

export interface StudentProgramLessons extends Omit<
  DomainStudentProgramLessons,
  "student" | "program" | "lessons"
> {
  student: User;
  program: Program;
  lessons: [Lesson, Lesson];
}

export interface StudentProgramLessonQuestion extends Omit<
  DomainStudentProgramLessonQuestion,
  "student" | "program" | "lesson" | "question"
> {
  student: User;
  program: Program;
  lesson: Lesson;
  question: Question;
}

export interface TeacherProgram extends Omit<DomainTeacherProgram, "teacher" | "program"> {
  teacher: User;
  program: Program;
}

export interface TeacherCourse extends Omit<DomainTeacherCourse, "teacher" | "course"> {
  teacher: User;
  course: Course;
}

export interface TeacherLesson extends Omit<DomainTeacherLesson, "teacher" | "lesson"> {
  teacher: User;
  lesson: Lesson;
}

export interface TeacherLessonQuestion extends Omit<
  DomainTeacherLessonQuestion,
  "teacher" | "lesson" | "question"
> {
  teacher: User;
  lesson: Lesson;
  question: Question;
}

export interface TeacherLessonQuestions extends Omit<
  DomainTeacherLessonQuestions,
  "teacher" | "lesson" | "questions"
> {
  teacher: User;
  lesson: Lesson;
  questions: Question[];
}

export interface EnrollmentApplication extends DomainEnrollmentApplication {}
export interface Enrollment extends DomainEnrollment {}
export interface AssessmentRecord extends DomainAssessmentRecord {}
export interface DiscussionRecord extends DomainDiscussionRecord {}
export interface AttendanceRule extends DomainAttendanceRule {}
export interface AttendanceViolation extends DomainAttendanceViolation {}
export interface NotificationRecord extends DomainNotificationRecord {}
export interface CertificateRecord extends DomainCertificateRecord {}

export type Expect = (actual: unknown) => {
  toBe(expected: unknown): void;
  toBeDefined(): void;
  toContain(expected: string): void;
};
