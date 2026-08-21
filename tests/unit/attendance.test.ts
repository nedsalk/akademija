import { describe, expect, it } from "vitest";
import { createAttendanceRule, evaluateAttendance } from "../../src/domain/attendance";

describe("attendance evaluation", () => {
  it("reports a violation after consecutive missed lesson opportunities", () => {
    const rule = createAttendanceRule(1);
    expect(rule.ok).toBe(true);
    if (!rule.ok) return;

    expect(
      evaluateAttendance({
        rule: rule.value,
        enrollmentStartedAt: new Date("2026-05-10T00:00:00.000Z"),
        evaluatedAt: new Date("2026-05-12T00:00:00.000Z"),
        mostRecentCompletionAt: null,
      }),
    ).toEqual({
      consecutiveMissedLessons: 2,
      violation: { consecutiveMissedLessons: 2 },
    });
  });

  it("resets consecutive misses when the current lesson is completed", () => {
    const rule = createAttendanceRule(0);
    expect(rule.ok).toBe(true);
    if (!rule.ok) return;

    expect(
      evaluateAttendance({
        rule: rule.value,
        enrollmentStartedAt: new Date("2026-05-10T00:00:00.000Z"),
        evaluatedAt: new Date("2026-05-12T00:00:00.000Z"),
        mostRecentCompletionAt: new Date("2026-05-12T00:00:00.000Z"),
      }),
    ).toEqual({ consecutiveMissedLessons: 0, violation: null });
  });
});

describe("attendance rules", () => {
  it("accepts non-negative integer missed-lesson limits", () => {
    expect(createAttendanceRule(0)).toEqual({
      ok: true,
      value: { maxConsecutiveMissedLessons: 0 },
    });
  });

  it("rejects invalid missed-lesson limits", () => {
    expect(createAttendanceRule(-1)).toEqual({
      ok: false,
      error: "invalid-attendance-rule",
    });
    expect(createAttendanceRule(Number.NaN)).toEqual({
      ok: false,
      error: "invalid-attendance-rule",
    });
  });
});
