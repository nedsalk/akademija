import { describe, expect, it } from "vitest";
import { getLessonAvailability } from "../../src/domain/lesson-progress";

describe("getLessonAvailability", () => {
  it("unlocks only the first lesson before any completion", () => {
    const availability = getLessonAvailability(
      [{ id: "lesson-1" }, { id: "lesson-2" }, { id: "lesson-3" }],
      new Set(),
    );

    expect(availability.get("lesson-1")).toBe(true);
    expect(availability.get("lesson-2")).toBe(false);
    expect(availability.get("lesson-3")).toBe(false);
  });

  it("unlocks the next lesson after the previous lesson is completed", () => {
    const availability = getLessonAvailability(
      [{ id: "lesson-1" }, { id: "lesson-2" }, { id: "lesson-3" }],
      new Set(["lesson-1"]),
    );

    expect(availability.get("lesson-1")).toBe(true);
    expect(availability.get("lesson-2")).toBe(true);
    expect(availability.get("lesson-3")).toBe(false);
  });
});
