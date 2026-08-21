import {
  type AnswerQuestion,
  type AnswerSelection,
  type AnswerSheetError,
  scoreAnswerSheet,
  validateAnswerSheet,
} from "./answers";
import type { Result } from "./result";

export type AssessmentKind = "weekly" | "final";
export type AssessmentAttemptStatus = "passed" | "failed";

export type AssessmentPublicationError =
  | "invalid-date"
  | "invalid-window"
  | "invalid-passing-threshold"
  | "unknown-question";

export type AssessmentSubmissionError =
  | "assessment-closed"
  | "course-incomplete"
  | "weekly-already-submitted"
  | "final-already-passed"
  | "final-retry-unavailable";

export type AssessmentAttemptError = AssessmentSubmissionError | AnswerSheetError;

export interface LatestAssessmentAttempt {
  retryAvailableAt: Date | null;
  status: AssessmentAttemptStatus;
}

declare const assessmentPublicationBrand: unique symbol;

export interface AssessmentPublication {
  closesAt: Date;
  courseId: string;
  kind: AssessmentKind;
  opensAt: Date;
  passingThresholdPercent: number;
  questionIds: string[];
  title: string;
  weekNumber?: number;
  readonly [assessmentPublicationBrand]: true;
}

export function createAssessmentPublication(args: {
  availableQuestionIds: string[];
  closesAt: Date;
  courseId: string;
  kind: AssessmentKind;
  opensAt: Date;
  passingThresholdPercent?: number;
  questionIds: string[];
}): Result<AssessmentPublication, AssessmentPublicationError> {
  if (Number.isNaN(args.opensAt.getTime()) || Number.isNaN(args.closesAt.getTime())) {
    return { ok: false, error: "invalid-date" };
  }

  if (args.opensAt.getTime() > args.closesAt.getTime()) {
    return { ok: false, error: "invalid-window" };
  }

  const passingThresholdPercent = args.passingThresholdPercent ?? 70;
  if (
    !Number.isFinite(passingThresholdPercent) ||
    passingThresholdPercent < 0 ||
    passingThresholdPercent > 100
  ) {
    return { ok: false, error: "invalid-passing-threshold" };
  }

  const availableQuestionIds = new Set(args.availableQuestionIds);
  if (args.questionIds.some((questionId) => !availableQuestionIds.has(questionId))) {
    return { ok: false, error: "unknown-question" };
  }

  return {
    ok: true,
    value: {
      closesAt: args.closesAt,
      courseId: args.courseId,
      kind: args.kind,
      opensAt: args.opensAt,
      passingThresholdPercent,
      questionIds: args.questionIds,
      title: args.kind === "weekly" ? "Weekly Test 1" : "Final Test",
      weekNumber: args.kind === "weekly" ? 1 : undefined,
    } as AssessmentPublication,
  };
}

function isAssessmentWithinWindow(args: { now: Date; opensAt: Date; closesAt: Date }) {
  const currentTime = args.now.getTime();
  return currentTime >= args.opensAt.getTime() && currentTime <= args.closesAt.getTime();
}

function getRetryAvailableAt(args: { submittedAt: Date; status: AssessmentAttemptStatus }) {
  if (args.status !== "failed") {
    return null;
  }

  const retryAvailableAt = new Date(args.submittedAt);
  retryAvailableAt.setUTCDate(retryAvailableAt.getUTCDate() + 7);
  return retryAvailableAt;
}

function canSubmitAssessment(args: {
  kind: AssessmentKind;
  now: Date;
  courseCompleted: boolean;
  latestAttempt: LatestAssessmentAttempt | null;
  window: {
    opensAt: Date;
    closesAt: Date;
  };
}): Result<true, AssessmentSubmissionError> {
  if (!isAssessmentWithinWindow({ now: args.now, ...args.window })) {
    return { ok: false, error: "assessment-closed" };
  }

  if (args.kind === "weekly") {
    if (args.latestAttempt) {
      return { ok: false, error: "weekly-already-submitted" };
    }

    return { ok: true, value: true };
  }

  if (!args.courseCompleted) {
    return { ok: false, error: "course-incomplete" };
  }

  if (args.latestAttempt?.status === "passed") {
    return { ok: false, error: "final-already-passed" };
  }

  if (
    args.latestAttempt?.status === "failed" &&
    args.latestAttempt.retryAvailableAt &&
    args.latestAttempt.retryAvailableAt.getTime() > args.now.getTime()
  ) {
    return { ok: false, error: "final-retry-unavailable" };
  }

  return { ok: true, value: true };
}

export function getAssessmentAccess(args: {
  kind: AssessmentKind;
  now: Date;
  courseCompleted: boolean;
  latestAttempt: LatestAssessmentAttempt | null;
  window: { opensAt: Date; closesAt: Date };
}) {
  if (!isAssessmentWithinWindow({ now: args.now, ...args.window })) {
    return { available: false, canSubmit: false } as const;
  }

  if (args.kind === "final" && !args.courseCompleted) {
    return { available: false, canSubmit: false } as const;
  }

  return {
    available: true,
    canSubmit: canSubmitAssessment(args).ok,
  } as const;
}

export interface AssessmentAttemptDraft {
  retryAvailableAt: Date | null;
  scorePercent: number;
  selections: AnswerSelection[];
  status: AssessmentAttemptStatus;
  submittedAt: Date;
}

export function createAssessmentAttempt(args: {
  assessment: {
    kind: AssessmentKind;
    passingThresholdPercent: number;
    questions: AnswerQuestion[];
    window: { opensAt: Date; closesAt: Date };
  };
  courseCompleted: boolean;
  latestAttempt: LatestAssessmentAttempt | null;
  now: Date;
  selections: AnswerSelection[];
}): Result<AssessmentAttemptDraft, AssessmentAttemptError> {
  const allowed = canSubmitAssessment({
    kind: args.assessment.kind,
    now: args.now,
    courseCompleted: args.courseCompleted,
    latestAttempt: args.latestAttempt,
    window: args.assessment.window,
  });
  if (!allowed.ok) {
    return allowed;
  }

  const answerSheet = validateAnswerSheet(args.assessment.questions, args.selections);
  if (!answerSheet.ok) {
    return answerSheet;
  }

  const scorePercent = scoreAnswerSheet({
    questions: args.assessment.questions,
    selections: answerSheet.value,
  });
  const status = scorePercent >= args.assessment.passingThresholdPercent ? "passed" : "failed";

  return {
    ok: true,
    value: {
      retryAvailableAt: getRetryAvailableAt({
        submittedAt: args.now,
        status,
      }),
      scorePercent,
      selections: answerSheet.value,
      status,
      submittedAt: args.now,
    },
  };
}
