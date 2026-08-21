import { describe, expect, it } from "vitest";
import {
  canOpenLesson,
  getLessonAvailability,
  listenToLesson,
  submitLessonAnswers,
} from "../../src/domain/lesson-progress";

const lessons = [{ id: "lesson-1" }, { id: "lesson-2" }, { id: "lesson-3" }];

describe("getLessonAvailability", () => {
  it("unlocks only the first lesson before any completion", () => {
    const availability = getLessonAvailability(lessons, new Set());

    expect(availability.get("lesson-1")).toBe(true);
    expect(availability.get("lesson-2")).toBe(false);
    expect(availability.get("lesson-3")).toBe(false);
  });

  it("unlocks the next lesson after the previous lesson is completed", () => {
    const availability = getLessonAvailability(lessons, new Set(["lesson-1"]));

    expect(availability.get("lesson-1")).toBe(true);
    expect(availability.get("lesson-2")).toBe(true);
    expect(availability.get("lesson-3")).toBe(false);
  });
});

describe("canOpenLesson", () => {
  it("allows the first lesson", () => {
    expect(
      canOpenLesson({
        lessonId: "lesson-1",
        orderedLessons: lessons,
        completedLessonIds: new Set(),
      }),
    ).toEqual({ ok: true, value: true });
  });

  it("rejects a locked lesson", () => {
    expect(
      canOpenLesson({
        lessonId: "lesson-2",
        orderedLessons: lessons,
        completedLessonIds: new Set(),
      }),
    ).toEqual({ ok: false, error: "lesson-locked" });
  });
});

describe("listening to a lesson", () => {
  it("rejects a locked lesson", () => {
    expect(
      listenToLesson({
        lessonId: "lesson-2",
        orderedLessons: lessons,
        completedLessonIds: new Set(),
        hasQuestions: true,
      }),
    ).toEqual({ ok: false, error: "lesson-locked" });
  });

  it("rejects a completed lesson", () => {
    expect(
      listenToLesson({
        lessonId: "lesson-1",
        orderedLessons: lessons,
        completedLessonIds: new Set(["lesson-1"]),
        hasQuestions: true,
      }),
    ).toEqual({ ok: false, error: "lesson-already-completed" });
  });

  it("completes a listened lesson that has no questions", () => {
    expect(
      listenToLesson({
        lessonId: "lesson-1",
        orderedLessons: lessons,
        completedLessonIds: new Set(),
        hasQuestions: false,
      }),
    ).toEqual({
      ok: true,
      value: { recordListen: true, completeLesson: true },
    });
  });
});

describe("submitting lesson answers", () => {
  it("rejects a lesson that has not been listened", () => {
    expect(
      submitLessonAnswers({
        lessonId: "lesson-1",
        listenedLessonIds: new Set(),
        completedLessonIds: new Set(),
        orderedLessons: lessons,
      }),
    ).toEqual({ ok: false, error: "lesson-not-listened" });
  });

  it("rejects a completed lesson", () => {
    expect(
      submitLessonAnswers({
        lessonId: "lesson-1",
        listenedLessonIds: new Set(["lesson-1"]),
        completedLessonIds: new Set(["lesson-1"]),
        orderedLessons: lessons,
      }),
    ).toEqual({ ok: false, error: "lesson-already-completed" });
  });

  it("completes an eligible lesson", () => {
    expect(
      submitLessonAnswers({
        lessonId: "lesson-1",
        listenedLessonIds: new Set(["lesson-1"]),
        completedLessonIds: new Set(),
        orderedLessons: lessons,
      }),
    ).toEqual({ ok: true, value: { completeLesson: true } });
  });
});
