// Driver contracts - protocol-agnostic interfaces

import type {
  Course,
  Lesson,
  Program,
  Question,
  QuestionOption,
  Textbook,
  User,
  UserRole,
  Visitor,
} from "../dsl/types";

interface Credentials {
  email: string;
  password: string;
}

export interface RegistrationData extends Credentials {
  name: string;
  phone: string;
  role?: UserRole;
}

export interface AcquireRegisteredUserOptions {
  role?: UserRole;
  authenticated?: boolean;
}

export interface SeededUser extends RegistrationData {
  id: string;
  role: UserRole;
  sessionCookie: {
    name: string;
    value: string;
  };
}

export interface AuthDriver {
  createVisitor(): Promise<Visitor>;
  acquireRegisteredUser(options?: AcquireRegisteredUserOptions): Promise<User>;
  register(credentials?: Partial<RegistrationData>): Promise<User>;
  failRegistration(data: RegistrationData, visitor: Visitor): Promise<void>;
  getRegistrationFormValues(visitor: Visitor): Promise<RegistrationData>;
  getRegistrationError(visitor: Visitor): Promise<string | null>;
  login(user: User): Promise<void>;
  getLoginError(visitor: Visitor): Promise<string | null>;
  logout(user: User): Promise<void>;
  isOnLoginPage(user: Visitor): Promise<boolean>;
  getUserRole(user: User): Promise<string | null>;
  isAuthenticated(user: Visitor): Promise<boolean>;
}

export interface UserInfo {
  id: string;
  email: string;
  role?: string;
}
export interface AdminDriver {
  navigateToUserManagement(user: User): Promise<void>;
  isOnUserManagement(user: User): Promise<boolean>;
  getUsersList(admin: User): Promise<UserInfo[]>;
  changeUserRole(admin: User, targetUser: User, newRole: string): Promise<void>;
  seesAccessDenied(user: User): Promise<boolean>;
  navigateToAdminDashboard(user: User): Promise<void>;
  seesAdminDashboard(user: User): Promise<boolean>;
}

export interface TeacherDriver {
  navigateToTeacherDashboard(visitor: Visitor): Promise<void>;
  seesTeacherDashboard(visitor: Visitor): Promise<boolean>;
  seesAccessDenied(visitor: Visitor): Promise<boolean>;
}

export interface ProgramDriver {
  getLessonDetails(teacher: User, lesson: Lesson): Promise<Lesson>;
  createProgram(teacher: User): Promise<Program>;
  seesProgramOnDashboard(teacher: User, program: Program): Promise<boolean>;
  seesStudentEnrollmentDetails(teacher: User, student: User, program: Program): Promise<boolean>;
  approveStudentEnrollment(teacher: User, student: User, program: Program): Promise<void>;
  postStudentEnrollmentApproval(teacher: User, student: User, program: Program): Promise<number>;
  rejectStudentEnrollment(teacher: User, student: User, program: Program): Promise<void>;
  getStudentEnrollmentStatusInProgram(
    teacher: User,
    student: User,
    program: Program,
  ): Promise<string | null>;
  getStudentEnrollmentStartDateInProgram(
    teacher: User,
    student: User,
    program: Program,
  ): Promise<string | null>;
  addCourseToProgram(teacher: User, program: Program): Promise<Course>;
  seesCourseInProgram(teacher: User, program: Program, course: Course): Promise<boolean>;
  editProgramName(teacher: User, program: Program, new_name: string): Promise<void>;
  getProgramDetails(teacher: User, program: Program): Promise<Program>;
  addTextbookToCourse(teacher: User, course: Course): Promise<Textbook>;
  getCourseTextbook(teacher: User, course: Course): Promise<Textbook | null>;
  addLessonToCourse(teacher: User, course: Course): Promise<Lesson>;
  reorderLessons(teacher: User, course: Course, lessonsInOrder: Lesson[]): Promise<void>;
  getCourseLessonNames(teacher: User, course: Course): Promise<string[]>;
  seesLessonInCourse(teacher: User, lesson: Lesson): Promise<boolean>;
  removeLesson(teacher: User, lesson: Lesson): Promise<void>;
  renameLesson(teacher: User, lesson: Lesson, new_name: string): Promise<void>;
  setLessonVideoUrl(teacher: User, lesson: Lesson, videoUrl: string): Promise<void>;
  removeCourse(teacher: User, course: Course): Promise<void>;
}

export interface QuestionDriver {
  addSingleAnswerQuestion(
    teacher: User,
    lesson: Lesson,
    options: QuestionOption[],
  ): Promise<Question>;
  addRadioGridQuestion(
    teacher: User,
    lesson: Lesson,
    options: QuestionOption[],
    rows: string[],
  ): Promise<Question>;
  addCheckboxGridQuestion(
    teacher: User,
    lesson: Lesson,
    options: QuestionOption[],
    rows: string[],
  ): Promise<Question>;
  addMultipleAnswerQuestion(
    teacher: User,
    lesson: Lesson,
    options: QuestionOption[],
  ): Promise<Question>;
  seeQuestionWithMarkedAnswer(teacher: User, lesson: Lesson, question: Question): Promise<boolean>;
  removeQuestion(teacher: User, lesson: Lesson, question: Question): Promise<void>;
  reorderQuestions(teacher: User, lesson: Lesson, questionsInOrder: Question[]): Promise<void>;
  moveLastQuestionDown(teacher: User, lesson: Lesson): Promise<void>;
  moveFirstQuestionUp(teacher: User, lesson: Lesson): Promise<void>;
  seesQuestions(teacher: User, lesson: Lesson, questions: Question[]): Promise<boolean>;
}

export interface LessonFlowDriver {
  openEnrolledProgram(student: User, program: Program): Promise<void>;
  openLesson(student: User, program: Program, lesson: Lesson): Promise<void>;
  completeLesson(student: User, program: Program, lesson: Lesson): Promise<void>;
  markLessonListened(student: User, program: Program, lesson: Lesson): Promise<void>;
  submitCorrectLessonAnswers(
    student: User,
    program: Program,
    lesson: Lesson,
    question: Question,
  ): Promise<void>;
  postLessonListened(student: User, program: Program, lesson: Lesson): Promise<number>;
  postLessonAnswers(student: User, program: Program, lesson: Lesson): Promise<number>;
  seesSubmittedAnswer(student: User, question: Question): Promise<boolean>;
  seesAnswerFeedback(student: User, question: Question): Promise<boolean>;
  seesAnswersLocked(student: User): Promise<boolean>;
  seesLessonVideo(student: User, lesson: Lesson): Promise<boolean>;
  seesListenedPrompt(student: User): Promise<boolean>;
  seesQuestionHidden(student: User, question: Question): Promise<boolean>;
  seesQuestionVisible(student: User, question: Question): Promise<boolean>;
  seesLessonMarkedListened(student: User): Promise<boolean>;
  seesLessonMarkedCompletedOnPage(student: User): Promise<boolean>;
  seesAvailableLesson(student: User, program: Program, lesson: Lesson): Promise<boolean>;
  seesLockedLesson(student: User, program: Program, lesson: Lesson): Promise<boolean>;
  seesCompletedLesson(student: User, program: Program, lesson: Lesson): Promise<boolean>;
  seesLessonUnavailable(student: User): Promise<boolean>;
}

export interface AssessmentDriver {
  openCourse(student: User, course: Course): Promise<void>;
  openProgram(student: User, program: Program): Promise<void>;
  publishWeeklyTest(args: {
    teacher: User;
    course: Course;
    questionTexts?: string[];
    opensOn?: string;
    closesOn?: string;
  }): Promise<void>;
  publishFinalTest(args: {
    teacher: User;
    course: Course;
    questionTexts?: string[];
    opensOn?: string;
    closesOn?: string;
    passingThresholdPercent?: number;
  }): Promise<void>;
  getAssessmentId(teacher: User, course: Course, title: string): Promise<string>;
  openAssessmentByRoute(args: {
    student: User;
    program: Program;
    course: Course;
    assessmentId: string;
  }): Promise<number>;
  publishWeeklyTestWithQuestionIds(args: {
    teacher: User;
    course: Course;
    questionIds: string[];
  }): Promise<number>;
  setCurrentDate(
    user: User,
    args: {
      isoDate?: string;
      advanceByDays?: number;
    },
  ): Promise<void>;
  resetCurrentDate(user: User): Promise<void>;
  seesAssessmentAvailable(student: User, title: string): Promise<boolean>;
  seesAssessmentUnavailable(student: User, title: string): Promise<boolean>;
  openAssessment(student: User, title: string): Promise<void>;
  submitAssessmentAnswers(
    student: User,
    questions: Question[],
    mode: "correct" | "incorrect",
  ): Promise<void>;
  postCurrentAssessment(student: User): Promise<number>;
  seesAssessmentQuestions(student: User, questions: Question[]): Promise<boolean>;
  seesAssessmentScore(student: User, scorePercent: number): Promise<boolean>;
  seesAssessmentStatus(student: User, status: "passed" | "failed"): Promise<boolean>;
  seesRetryAvailableOn(student: User, isoDate: string): Promise<boolean>;
  seesCourseLink(student: User, course: Course): Promise<boolean>;
}

export interface CertificateDriver {
  seesCertificateAvailable(student: User): Promise<boolean>;
  seesCertificateUnavailable(student: User): Promise<boolean>;
  downloadCertificate(student: User): Promise<string>;
  getCertificateStatus(args: { student: User; program: Program; course: Course }): Promise<number>;
}

export interface DiscussionDriver {
  submitQuestion(student: User, body: string): Promise<void>;
  openLesson(teacher: User, lesson: Lesson): Promise<void>;
  approveDiscussion(teacher: User, discussionBody: string): Promise<void>;
  getDiscussionId(teacher: User, lesson: Lesson, discussionBody: string): Promise<string>;
  postQuestion(student: User, lesson: Lesson, body: string): Promise<number>;
  postReply(args: {
    student: User;
    lesson: Lesson;
    discussionId: string;
    body: string;
  }): Promise<number>;
  postApproval(args: { teacher: User; lesson: Lesson; discussionId: string }): Promise<number>;
  submitReply(student: User, discussionBody: string, replyBody: string): Promise<void>;
  submitTeacherReply(teacher: User, discussionBody: string, replyBody: string): Promise<void>;
  seesPendingDiscussion(user: User, discussionBody: string): Promise<boolean>;
  seesDiscussionAuthor(teacher: User, discussionBody: string, student: User): Promise<boolean>;
  seesDiscussionHidden(student: User, discussionBody: string): Promise<boolean>;
  seesApprovedDiscussionAnonymously(student: User, discussionBody: string): Promise<boolean>;
  seesPendingReply(teacher: User, replyBody: string): Promise<boolean>;
  seesReplyThreaded(student: User, discussionBody: string, replyBody: string): Promise<boolean>;
  seesTeacherReplyThreaded(
    student: User,
    discussionBody: string,
    replyBody: string,
    teacher: User,
  ): Promise<boolean>;
}

export interface AttendanceDriver {
  saveRule(teacher: User, course: Course, maxMissed: number): Promise<void>;
  postRule(teacher: User, course: Course, maxMissed: string): Promise<number>;
  openCourse(user: User, course: Course): Promise<void>;
  evaluateAttendance(teacher: User, course: Course): Promise<void>;
  setCurrentDate(user: User, args: { isoDate?: string; advanceByDays?: number }): Promise<void>;
  acknowledgeViolation(teacher: User, studentName: string): Promise<void>;
  getViolationId(teacher: User, course: Course, studentName: string): Promise<string>;
  postAcknowledgement(args: {
    teacher: User;
    course: Course;
    violationId: string;
  }): Promise<number>;
  seesRuleSaved(teacher: User, maxMissed: number): Promise<boolean>;
  seesNoViolations(teacher: User): Promise<boolean>;
  seesViolation(
    teacher: User,
    studentName: string,
    missedCount: number,
    status: "open" | "acknowledged",
  ): Promise<boolean>;
}

export interface PWADriver {
  openShell(visitor: Visitor): Promise<void>;
  seesInstallManifest(visitor: Visitor): Promise<boolean>;
  seesServiceWorkerRegistration(visitor: Visitor): Promise<boolean>;
  seesInstallabilityPrerequisites(visitor: Visitor): Promise<boolean>;
}

export interface NotificationDriver {
  subscribe(user: User): Promise<void>;
  setCurrentDate(user: User, args: { isoDate?: string; advanceByDays?: number }): Promise<void>;
  openProgram(user: User, programId: string): Promise<void>;
  openCourse(user: User, course: Course): Promise<void>;
  seesSavedSubscription(user: User): Promise<boolean>;
  seesNotification(user: User, kind: string): Promise<boolean>;
}

export interface Drivers {
  auth: AuthDriver;
  admin: AdminDriver;
  teacher: TeacherDriver;
  program: ProgramDriver;
  question: QuestionDriver;
  enrollment: EnrollmentDriver;
  lessonFlow: LessonFlowDriver;
  assessment: AssessmentDriver;
  certificate: CertificateDriver;
  discussion: DiscussionDriver;
  attendance: AttendanceDriver;
  pwa: PWADriver;
  notification: NotificationDriver;
}

export interface EnrollmentDriver {
  requestEnrollment(student: User, program: Program): Promise<void>;
  requestEnrollments(students: User[], program: Program): Promise<void>;
  getEnrollmentStatus(student: User, program: Program): Promise<string | null>;
  getVisibleProgramNames(student: User): Promise<string[]>;
  canRequestEnrollment(student: User, program: Program): Promise<boolean>;
}
