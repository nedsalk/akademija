import { describe, expect, it } from "vitest";
import {
  createAssessmentAttempt,
  createAssessmentPublication,
  getAssessmentAccess,
} from "../../src/domain/assessments";

const now = new Date("2026-05-12T00:00:00.000Z");
const openWindow = {
  opensAt: new Date("2026-05-01T00:00:00.000Z"),
  closesAt: new Date("2026-05-20T00:00:00.000Z"),
};

describe("assessment windows", () => {
  it("includes the opening and closing instants", () => {
    expect(
      getAssessmentAccess({
        kind: "weekly",
        now: openWindow.opensAt,
        courseCompleted: false,
        latestAttempt: null,
        window: openWindow,
      }),
    ).toEqual({ available: true, canSubmit: true });
    expect(
      getAssessmentAccess({
        kind: "weekly",
        now: openWindow.closesAt,
        courseCompleted: false,
        latestAttempt: null,
        window: openWindow,
      }),
    ).toEqual({ available: true, canSubmit: true });
  });
});

describe("assessment publication", () => {
  it("creates weekly publication details from valid input", () => {
    const result = createAssessmentPublication({
      availableQuestionIds: ["question-1", "question-2"],
      closesAt: new Date("2026-05-20T00:00:00.000Z"),
      courseId: "course-1",
      kind: "weekly",
      opensAt: new Date("2026-05-12T00:00:00.000Z"),
      questionIds: ["question-1", "question-2"],
    });

    expect(result).toEqual({
      ok: true,
      value: {
        closesAt: new Date("2026-05-20T00:00:00.000Z"),
        courseId: "course-1",
        kind: "weekly",
        opensAt: new Date("2026-05-12T00:00:00.000Z"),
        passingThresholdPercent: 70,
        questionIds: ["question-1", "question-2"],
        title: "Weekly Test 1",
        weekNumber: 1,
      },
    });
  });

  it("rejects an assessment window that closes before it opens", () => {
    expect(
      createAssessmentPublication({
        availableQuestionIds: ["question-1"],
        closesAt: new Date("2026-05-11T00:00:00.000Z"),
        courseId: "course-1",
        kind: "final",
        opensAt: new Date("2026-05-12T00:00:00.000Z"),
        questionIds: ["question-1"],
      }),
    ).toEqual({ ok: false, error: "invalid-window" });
  });

  it("rejects an invalid passing threshold", () => {
    expect(
      createAssessmentPublication({
        availableQuestionIds: ["question-1"],
        closesAt: new Date("2026-05-20T00:00:00.000Z"),
        courseId: "course-1",
        kind: "final",
        opensAt: new Date("2026-05-12T00:00:00.000Z"),
        passingThresholdPercent: Number.NaN,
        questionIds: ["question-1"],
      }),
    ).toEqual({ ok: false, error: "invalid-passing-threshold" });
  });

  it("rejects questions outside the course question set", () => {
    expect(
      createAssessmentPublication({
        availableQuestionIds: ["question-1"],
        closesAt: new Date("2026-05-20T00:00:00.000Z"),
        courseId: "course-1",
        kind: "weekly",
        opensAt: new Date("2026-05-12T00:00:00.000Z"),
        questionIds: ["question-2"],
      }),
    ).toEqual({ ok: false, error: "unknown-question" });
  });
});

describe("assessment submission", () => {
  const questions = [
    {
      id: "question-1",
      type: "radio" as const,
      options: [
        { id: "option-1", isCorrect: true },
        { id: "option-2", isCorrect: false },
      ],
      rows: [],
    },
  ];
  const selection = {
    questionId: "question-1",
    questionOptionId: "option-2",
    questionRowId: null,
  };

  it("rejects weekly resubmission", () => {
    expect(
      createAssessmentAttempt({
        assessment: {
          kind: "weekly",
          passingThresholdPercent: 70,
          questions,
          window: openWindow,
        },
        now,
        courseCompleted: false,
        latestAttempt: { status: "passed", retryAvailableAt: null },
        selections: [selection],
      }),
    ).toEqual({ ok: false, error: "weekly-already-submitted" });
  });

  it("rejects final submission before course completion", () => {
    expect(
      createAssessmentAttempt({
        assessment: {
          kind: "final",
          passingThresholdPercent: 70,
          questions,
          window: openWindow,
        },
        now,
        courseCompleted: false,
        latestAttempt: null,
        selections: [selection],
      }),
    ).toEqual({ ok: false, error: "course-incomplete" });
  });

  it("rejects final resubmission after passing", () => {
    expect(
      createAssessmentAttempt({
        assessment: {
          kind: "final",
          passingThresholdPercent: 70,
          questions,
          window: openWindow,
        },
        now,
        courseCompleted: true,
        latestAttempt: { status: "passed", retryAvailableAt: null },
        selections: [selection],
      }),
    ).toEqual({ ok: false, error: "final-already-passed" });
  });

  it("rejects final retry before retry date", () => {
    expect(
      createAssessmentAttempt({
        assessment: {
          kind: "final",
          passingThresholdPercent: 70,
          questions,
          window: openWindow,
        },
        now,
        courseCompleted: true,
        latestAttempt: {
          status: "failed",
          retryAvailableAt: new Date("2026-05-19T00:00:00.000Z"),
        },
        selections: [selection],
      }),
    ).toEqual({ ok: false, error: "final-retry-unavailable" });
  });

  it("allows final retry on the retry date", () => {
    expect(
      createAssessmentAttempt({
        assessment: {
          kind: "final",
          passingThresholdPercent: 70,
          questions,
          window: openWindow,
        },
        now: new Date("2026-05-19T00:00:00.000Z"),
        courseCompleted: true,
        latestAttempt: {
          status: "failed",
          retryAvailableAt: new Date("2026-05-19T00:00:00.000Z"),
        },
        selections: [selection],
      }),
    ).toMatchObject({ ok: true });
  });

  it("creates a complete failed attempt with its retry date", () => {
    expect(
      createAssessmentAttempt({
        assessment: {
          kind: "final",
          passingThresholdPercent: 70,
          questions,
          window: openWindow,
        },
        courseCompleted: true,
        latestAttempt: null,
        now,
        selections: [selection],
      }),
    ).toEqual({
      ok: true,
      value: {
        retryAvailableAt: new Date("2026-05-19T00:00:00.000Z"),
        scorePercent: 0,
        selections: [selection],
        status: "failed",
        submittedAt: now,
      },
    });
  });
  it("rejects selections outside the assessment questions", () => {
    expect(
      createAssessmentAttempt({
        assessment: {
          kind: "weekly",
          passingThresholdPercent: 70,
          questions,
          window: openWindow,
        },
        courseCompleted: false,
        latestAttempt: null,
        now,
        selections: [
          {
            questionId: "question-2",
            questionOptionId: "option-1",
            questionRowId: null,
          },
        ],
      }),
    ).toEqual({ ok: false, error: "unknown-question" });
  });
});
