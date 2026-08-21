import {
  type AssessmentAttemptError,
  type AssessmentKind,
  type AssessmentPublicationError,
  createAssessmentPublication,
  getAssessmentAccess,
} from "../domain/assessments";
import { now } from "../domain/clock";
import type { Result } from "../domain/result";
import { routes } from "../routes";
import {
  getAssessmentAttemptSelections,
  getAssessmentForCourseInProgram,
  getAssessmentQuestions,
  getLatestAssessmentAttempt,
  hasCompletedCourse,
  listCourseQuestions,
  publishAssessment,
  submitAssessmentAttempt,
} from "./assessments";
import { getOwnedCourse } from "./catalog";
import { getProgramEnrollment } from "./enrollment";
import { getLessonAnswerFeedback, parseLessonAnswerForm } from "./lesson-answers";

type AssessmentCommandError = "not-found" | "unavailable" | "validation" | AssessmentAttemptError;

type PublishAssessmentError = "not-found" | AssessmentPublicationError;

interface AssessmentRouteArgs {
  studentId: string;
  programId: string;
  courseId: string;
  assessmentId: string;
}

export interface AssessmentPageModel {
  assessmentName: string;
  attemptStatus?: "passed" | "failed";
  backHref: string;
  canSubmit: boolean;
  feedbackByQuestionId: Record<string, "Correct" | "Incorrect">;
  questions: Array<{
    id: string;
    options: Array<{ id: string; text: string }>;
    rows: Array<{ id: string; text: string }>;
    text: string;
    type: "radio" | "checkbox" | "radio-grid" | "checkbox-grid";
  }>;
  savedAnswers: Array<{
    questionId: string;
    questionOptionId: string;
    questionRowId: string | null;
  }>;
  scorePercent?: number;
  submitAction: string;
}

function feedbackToRecord(feedback: Map<string, boolean>) {
  return Object.fromEntries(
    Array.from(feedback.entries()).map(([questionId, isCorrect]) => [
      questionId,
      isCorrect ? "Correct" : "Incorrect",
    ]),
  ) as Record<string, "Correct" | "Incorrect">;
}

function getFormString(formData: FormData, name: string) {
  return formData.get(name)?.toString() ?? null;
}

function parsePassingThreshold(formData: FormData) {
  const rawValue = getFormString(formData, "passingThresholdPercent")?.trim();
  return rawValue ? Number(rawValue) : undefined;
}

function getPublicationFallbackDays(kind: AssessmentKind) {
  return kind === "weekly" ? { closesAt: 7, opensAt: -1 } : { closesAt: 365, opensAt: -1 };
}

function resolveAssessmentDateInput(args: {
  fallbackDays: number;
  now: Date;
  rawValue: string | null | undefined;
}): Result<Date, "invalid-date"> {
  const trimmedValue = args.rawValue?.trim();
  if (!trimmedValue) {
    const date = new Date(args.now);
    date.setUTCDate(date.getUTCDate() + args.fallbackDays);
    date.setUTCHours(0, 0, 0, 0);
    return { ok: true, value: date };
  }

  const date = new Date(`${trimmedValue}T00:00:00.000Z`);
  return Number.isNaN(date.getTime())
    ? { ok: false, error: "invalid-date" }
    : { ok: true, value: date };
}

export async function publishAssessmentForTeacher(args: {
  courseId: string;
  formData: FormData;
  kind: AssessmentKind;
  programId: string;
  teacherId: string;
}): Promise<Result<{ redirectTo: string }, PublishAssessmentError>> {
  const ownedCourse = await getOwnedCourse(args.teacherId, args.programId, args.courseId);
  if (!ownedCourse) {
    return { ok: false, error: "not-found" };
  }

  const currentTime = now();
  const fallbackDays = getPublicationFallbackDays(args.kind);
  const opensAt = resolveAssessmentDateInput({
    fallbackDays: fallbackDays.opensAt,
    now: currentTime,
    rawValue: getFormString(args.formData, "opensOn"),
  });
  if (!opensAt.ok) {
    return opensAt;
  }

  const closesAt = resolveAssessmentDateInput({
    fallbackDays: fallbackDays.closesAt,
    now: currentTime,
    rawValue: getFormString(args.formData, "closesOn"),
  });
  if (!closesAt.ok) {
    return closesAt;
  }

  const publication = createAssessmentPublication({
    availableQuestionIds: (
      await listCourseQuestions(args.courseId, args.kind === "weekly" ? 7 : undefined)
    ).map((question) => question.id),
    closesAt: closesAt.value,
    courseId: args.courseId,
    kind: args.kind,
    opensAt: opensAt.value,
    passingThresholdPercent: parsePassingThreshold(args.formData),
    questionIds: args.formData.getAll("questionId").map((value) => value.toString()),
  });
  if (!publication.ok) {
    return publication;
  }

  await publishAssessment(publication.value);

  return {
    ok: true,
    value: {
      redirectTo: routes.programs.$(args.programId).courses.$(args.courseId).toString(),
    },
  };
}

async function getAssessmentContext(args: AssessmentRouteArgs) {
  const [enrollment, currentAssessment] = await Promise.all([
    getProgramEnrollment(args.studentId, args.programId),
    getAssessmentForCourseInProgram({
      assessmentId: args.assessmentId,
      courseId: args.courseId,
      programId: args.programId,
    }),
  ]);

  if (!enrollment || !currentAssessment) {
    return { ok: false as const, error: "not-found" as const };
  }

  const [latestAttempt, courseCompleted] = await Promise.all([
    getLatestAssessmentAttempt(args.assessmentId, args.studentId),
    hasCompletedCourse(args.studentId, args.courseId),
  ]);

  return {
    ok: true as const,
    value: {
      courseCompleted,
      currentAssessment,
      latestAttempt: latestAttempt ?? null,
    },
  };
}

export async function getAssessmentPageForStudent(
  args: AssessmentRouteArgs,
): Promise<Result<AssessmentPageModel, AssessmentCommandError>> {
  const context = await getAssessmentContext(args);
  if (!context.ok) {
    return context;
  }

  const { currentAssessment, latestAttempt, courseCompleted } = context.value;
  const currentTime = now();
  const access = getAssessmentAccess({
    kind: currentAssessment.kind,
    now: currentTime,
    courseCompleted,
    latestAttempt,
    window: {
      opensAt: currentAssessment.opensAt,
      closesAt: currentAssessment.closesAt,
    },
  });
  if (!access.available) {
    return { ok: false, error: "unavailable" };
  }
  const questions = await getAssessmentQuestions(args.assessmentId);
  const savedAnswers = latestAttempt ? await getAssessmentAttemptSelections(latestAttempt.id) : [];
  const feedback = latestAttempt
    ? getLessonAnswerFeedback(questions, savedAnswers)
    : new Map<string, boolean>();

  return {
    ok: true,
    value: {
      assessmentName: currentAssessment.title,
      attemptStatus: latestAttempt?.status,
      backHref: routes.programs.$(args.programId).courses.$(args.courseId).toString(),
      canSubmit: access.canSubmit,
      feedbackByQuestionId: feedbackToRecord(feedback),
      questions: questions.map((question) => ({
        id: question.id,
        options: question.options.map((option) => ({
          id: option.id,
          text: option.text,
        })),
        rows: question.rows.map((row) => ({
          id: row.id,
          text: row.text,
        })),
        text: question.text,
        type: question.type,
      })),
      savedAnswers,
      scorePercent: latestAttempt?.scorePercent,
      submitAction: routes.programs
        .$(args.programId)
        .courses.$(args.courseId)
        .assessments.$(args.assessmentId).$submit,
    },
  };
}

export async function submitAssessmentForStudent(
  args: AssessmentRouteArgs & { formData: FormData },
): Promise<Result<{ redirectTo: string }, AssessmentCommandError>> {
  const context = await getAssessmentContext(args);
  if (!context.ok) {
    return context;
  }

  const { currentAssessment, courseCompleted } = context.value;
  const questions = await getAssessmentQuestions(args.assessmentId);
  const selections = parseLessonAnswerForm(args.formData, questions);
  const submission = await submitAssessmentAttempt({
    assessment: {
      id: args.assessmentId,
      kind: currentAssessment.kind,
      passingThresholdPercent: currentAssessment.passingThresholdPercent,
      questions,
      window: {
        opensAt: currentAssessment.opensAt,
        closesAt: currentAssessment.closesAt,
      },
    },
    courseCompleted,
    selections,
    studentId: args.studentId,
  });
  if (!submission.ok) {
    return submission;
  }

  return {
    ok: true,
    value: {
      redirectTo: routes.programs
        .$(args.programId)
        .courses.$(args.courseId)
        .assessments.$(args.assessmentId)
        .toString(),
    },
  };
}
