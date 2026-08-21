import type { Result } from "./result";

declare const attendanceRuleBrand: unique symbol;

export interface AttendanceRule {
  readonly maxConsecutiveMissedLessons: number;
  readonly [attendanceRuleBrand]: true;
}

export function createAttendanceRule(
  maxConsecutiveMissedLessons: number,
): Result<AttendanceRule, "invalid-attendance-rule"> {
  if (
    !Number.isFinite(maxConsecutiveMissedLessons) ||
    !Number.isInteger(maxConsecutiveMissedLessons) ||
    maxConsecutiveMissedLessons < 0
  ) {
    return { ok: false, error: "invalid-attendance-rule" };
  }

  return {
    ok: true,
    value: { maxConsecutiveMissedLessons } as AttendanceRule,
  };
}

export interface AttendanceEvaluation {
  consecutiveMissedLessons: number;
  violation: { consecutiveMissedLessons: number } | null;
}

function wholeDaysBetween(start: Date, end: Date) {
  return Math.max(0, Math.floor((end.getTime() - start.getTime()) / (24 * 60 * 60 * 1000)));
}

export function evaluateAttendance(args: {
  rule: AttendanceRule;
  enrollmentStartedAt: Date;
  evaluatedAt: Date;
  mostRecentCompletionAt: Date | null;
}): AttendanceEvaluation {
  const lastSatisfiedOpportunity =
    args.mostRecentCompletionAt && args.mostRecentCompletionAt > args.enrollmentStartedAt
      ? args.mostRecentCompletionAt
      : args.enrollmentStartedAt;
  const consecutiveMissedLessons = wholeDaysBetween(lastSatisfiedOpportunity, args.evaluatedAt);

  return {
    consecutiveMissedLessons,
    violation:
      consecutiveMissedLessons > args.rule.maxConsecutiveMissedLessons
        ? { consecutiveMissedLessons }
        : null,
  };
}
