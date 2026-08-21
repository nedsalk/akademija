import type { Drivers } from "../drivers/interface";
import { type AdminDSL, createAdminDSL } from "./admin.dsl";
import { type AssessmentDSL, createAssessmentDSL } from "./assessment.dsl";
import { type AttendanceDSL, createAttendanceDSL } from "./attendance.dsl";
import { type AuthDSL, createAuthDSL } from "./auth.dsl";
import { type CertificateDSL, createCertificateDSL } from "./certificate.dsl";
import { createDiscussionDSL, type DiscussionDSL } from "./discussion.dsl";
import { createEnrollmentDSL, type EnrollmentDSL } from "./enrollment.dsl";
import { createLessonFlowDSL, type LessonFlowDSL } from "./lesson-flow.dsl";
import { createNotificationDSL, type NotificationDSL } from "./notification.dsl";
import { createProgramDSL, type ProgramDSL } from "./program.dsl";
import { createPWADSL, type PWADSL } from "./pwa.dsl";
import { createQuestionDSL, type QuestionDSL } from "./question.dsl";
import { createTeacherDSL, type TeacherDSL } from "./teacher.dsl";
import type { Expect } from "./types";

export interface DSL {
  auth: AuthDSL;
  admin: AdminDSL;
  teacher: TeacherDSL;
  program: ProgramDSL;
  question: QuestionDSL;
  enrollment: EnrollmentDSL;
  lessonFlow: LessonFlowDSL;
  assessment: AssessmentDSL;
  certificate: CertificateDSL;
  discussion: DiscussionDSL;
  attendance: AttendanceDSL;
  pwa: PWADSL;
  notification: NotificationDSL;
}

export function createDSL(
  {
    auth,
    admin,
    teacher,
    program,
    question,
    enrollment,
    lessonFlow,
    assessment,
    certificate,
    discussion,
    attendance,
    notification,
    pwa,
  }: Drivers,
  expect: Expect,
): DSL {
  const authDSL = createAuthDSL(auth, expect);
  const programDSL = createProgramDSL(program, authDSL, expect);
  const questionDSL = createQuestionDSL(question, expect, programDSL);
  const enrollmentDSL = createEnrollmentDSL(enrollment, authDSL, programDSL, expect);
  const lessonFlowDSL = createLessonFlowDSL(
    lessonFlow,
    authDSL,
    enrollmentDSL,
    programDSL,
    questionDSL,
    expect,
  );
  const assessmentDSL = createAssessmentDSL(
    assessment,
    authDSL,
    enrollmentDSL,
    lessonFlowDSL,
    programDSL,
    questionDSL,
    expect,
  );
  const certificateDSL = createCertificateDSL(
    certificate,
    assessmentDSL,
    enrollmentDSL,
    programDSL,
    expect,
  );
  const discussionDSL = createDiscussionDSL(
    discussion,
    authDSL,
    enrollmentDSL,
    lessonFlowDSL,
    programDSL,
    questionDSL,
    expect,
  );
  const attendanceDSL = createAttendanceDSL(
    attendance,
    authDSL,
    enrollmentDSL,
    lessonFlowDSL,
    programDSL,
    expect,
  );
  return {
    auth: authDSL,
    admin: createAdminDSL(admin, authDSL, expect),
    teacher: createTeacherDSL(teacher, expect),
    program: programDSL,
    question: questionDSL,
    enrollment: enrollmentDSL,
    lessonFlow: lessonFlowDSL,
    assessment: assessmentDSL,
    certificate: certificateDSL,
    discussion: discussionDSL,
    attendance: attendanceDSL,
    pwa: createPWADSL(pwa, authDSL, expect),
    notification: createNotificationDSL(
      notification,
      authDSL,
      discussionDSL,
      attendanceDSL,
      enrollmentDSL,
      programDSL,
      expect,
    ),
  };
}
