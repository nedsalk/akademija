import { describe, expect, it } from "vitest";
import { reorderLessons } from "../../src/domain/content";

describe("lesson ordering", () => {
  it("saves the submitted lesson order and breaks ties by the previous order", () => {
    expect(
      reorderLessons([
        {
          id: "lesson-1",
          currentPosition: 0,
          submittedPosition: 2,
        },
        {
          id: "lesson-2",
          currentPosition: 1,
          submittedPosition: 1,
        },
        {
          id: "lesson-3",
          currentPosition: 2,
          submittedPosition: 2,
        },
      ]),
    ).toEqual({
      ok: true,
      value: [
        { id: "lesson-2", position: 0 },
        { id: "lesson-1", position: 1 },
        { id: "lesson-3", position: 2 },
      ],
    });
  });

  it("keeps the existing order when positions are omitted", () => {
    expect(
      reorderLessons([
        {
          id: "lesson-1",
          currentPosition: 0,
        },
        {
          id: "lesson-2",
          currentPosition: 1,
        },
      ]),
    ).toEqual({
      ok: true,
      value: [
        { id: "lesson-1", position: 0 },
        { id: "lesson-2", position: 1 },
      ],
    });
  });

  it("rejects impossible lesson positions", () => {
    expect(
      reorderLessons([
        {
          id: "lesson-1",
          currentPosition: -1,
          submittedPosition: 1,
        },
      ]),
    ).toEqual({
      ok: false,
      error: "Position must be a non-negative integer",
    });
  });
});
