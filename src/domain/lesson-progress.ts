import type { Result } from "./result";

export type LessonProgressError =
  | "lesson-not-found"
  | "lesson-locked"
  | "lesson-not-listened"
  | "lesson-already-completed";

interface LessonRef {
  id: string;
}

export function getLessonAvailability(lessons: LessonRef[], completedLessonIds: Set<string>) {
  return new Map(
    lessons.map((lessonItem, index) => [
      lessonItem.id,
      index === 0 || completedLessonIds.has(lessons[index - 1]?.id ?? ""),
    ]),
  );
}

function isAvailable(args: {
  lessonId: string;
  orderedLessons: LessonRef[];
  completedLessonIds: Set<string>;
}) {
  return (
    getLessonAvailability(args.orderedLessons, args.completedLessonIds).get(args.lessonId) ?? false
  );
}

function hasLesson(lessonId: string, orderedLessons: LessonRef[]) {
  return orderedLessons.some((lessonItem) => lessonItem.id === lessonId);
}

export function canOpenLesson(args: {
  lessonId: string;
  orderedLessons: LessonRef[];
  completedLessonIds: Set<string>;
}): Result<true, LessonProgressError> {
  if (!hasLesson(args.lessonId, args.orderedLessons)) {
    return { ok: false, error: "lesson-not-found" };
  }

  if (!isAvailable(args)) {
    return { ok: false, error: "lesson-locked" };
  }

  return { ok: true, value: true };
}

export function listenToLesson(args: {
  lessonId: string;
  orderedLessons: LessonRef[];
  completedLessonIds: Set<string>;
  hasQuestions: boolean;
}): Result<{ recordListen: true; completeLesson: boolean }, LessonProgressError> {
  const canOpen = canOpenLesson(args);
  if (!canOpen.ok) {
    return canOpen;
  }

  if (args.completedLessonIds.has(args.lessonId)) {
    return { ok: false, error: "lesson-already-completed" };
  }

  return {
    ok: true,
    value: { recordListen: true, completeLesson: !args.hasQuestions },
  };
}

export function submitLessonAnswers(args: {
  lessonId: string;
  listenedLessonIds: Set<string>;
  completedLessonIds: Set<string>;
  orderedLessons: LessonRef[];
}): Result<{ completeLesson: true }, LessonProgressError> {
  const canOpen = canOpenLesson(args);
  if (!canOpen.ok) {
    return canOpen;
  }

  if (args.completedLessonIds.has(args.lessonId)) {
    return { ok: false, error: "lesson-already-completed" };
  }

  if (!args.listenedLessonIds.has(args.lessonId)) {
    return { ok: false, error: "lesson-not-listened" };
  }

  return { ok: true, value: { completeLesson: true } };
}
