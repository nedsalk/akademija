import type { Result } from "./result";

export interface LessonReorderInput {
  currentPosition: number;
  id: string;
  submittedPosition?: number | null;
}

interface ReorderedLesson {
  id: string;
  position: number;
}

function requirePosition(
  value: number,
  error = "Position must be a non-negative integer",
): Result<number, string> {
  if (!Number.isInteger(value) || value < 0) {
    return { ok: false, error };
  }

  return { ok: true, value };
}

export function reorderLessons(lessons: LessonReorderInput[]): Result<ReorderedLesson[], string> {
  const rankedLessons = [];

  for (const lesson of lessons) {
    const currentPosition = requirePosition(lesson.currentPosition);
    if (!currentPosition.ok) {
      return currentPosition;
    }

    const submittedPosition =
      typeof lesson.submittedPosition === "number" && Number.isFinite(lesson.submittedPosition)
        ? lesson.submittedPosition
        : lesson.currentPosition + 1;
    const normalizedSubmittedPosition = requirePosition(Math.max(submittedPosition - 1, 0));
    if (!normalizedSubmittedPosition.ok) {
      return normalizedSubmittedPosition;
    }

    rankedLessons.push({
      id: lesson.id,
      currentPosition: currentPosition.value,
      submittedPosition: normalizedSubmittedPosition.value,
    });
  }

  rankedLessons.sort((left, right) => {
    if (left.submittedPosition !== right.submittedPosition) {
      return left.submittedPosition - right.submittedPosition;
    }

    return left.currentPosition - right.currentPosition;
  });

  return {
    ok: true,
    value: rankedLessons.map((lesson, index) => ({
      id: lesson.id,
      position: index,
    })),
  };
}
