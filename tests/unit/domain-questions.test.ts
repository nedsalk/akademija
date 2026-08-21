import { describe, expect, it } from "vitest";
import { prepareQuestionSet } from "../../src/domain/questions";
import {
  questionEditorIntents,
  toQuestionEditorAction,
} from "../../src/features/question-editor-actions";
import {
  applyQuestionEditorAction,
  getNextAnswerKeyQuestionIndex,
  parseQuestionForm,
} from "../../src/features/question-editor-state";

describe("lesson question sets", () => {
  it("accepts a valid question set and stores trimmed text", () => {
    expect(
      prepareQuestionSet([
        {
          text: " Single answer ",
          type: "radio",
          options: [
            { text: " First option ", isCorrect: false },
            { text: " Second option ", isCorrect: true },
          ],
          rows: [],
        },
        {
          text: " Grid question ",
          type: "checkbox-grid",
          options: [
            { text: " Option 1 ", isCorrect: true },
            { text: " Option 2 ", isCorrect: false },
          ],
          rows: [" Row 1 "],
        },
      ]),
    ).toEqual({
      ok: true,
      value: [
        {
          text: "Single answer",
          type: "radio",
          options: [
            { text: "First option", isCorrect: false },
            { text: "Second option", isCorrect: true },
          ],
          rows: [],
        },
        {
          text: "Grid question",
          type: "checkbox-grid",
          options: [
            { text: "Option 1", isCorrect: true },
            { text: "Option 2", isCorrect: false },
          ],
          rows: ["Row 1"],
        },
      ],
    });
  });

  it("ignores blank questions instead of saving placeholders", () => {
    expect(
      prepareQuestionSet([
        {
          text: "   ",
          type: "radio",
          options: [],
          rows: [],
        },
      ]),
    ).toEqual({
      ok: true,
      value: [],
    });
  });

  it("rejects question sets without enough answer options", () => {
    expect(
      prepareQuestionSet([
        {
          text: "Single answer",
          type: "radio",
          options: [{ text: "Only option", isCorrect: true }],
          rows: [],
        },
      ]),
    ).toEqual({
      ok: false,
      error: "Each question must have at least two answer options",
    });
  });

  it("rejects invalid correctness rules for question types", () => {
    expect(
      prepareQuestionSet([
        {
          text: "Single answer",
          type: "radio",
          options: [
            { text: "Option 1", isCorrect: true },
            { text: "Option 2", isCorrect: true },
          ],
          rows: [],
        },
      ]),
    ).toEqual({
      ok: false,
      error: "Single-answer questions must have exactly one correct answer",
    });

    expect(
      prepareQuestionSet([
        {
          text: "Grid question",
          type: "checkbox-grid",
          options: [
            { text: "Option 1", isCorrect: true },
            { text: "Option 2", isCorrect: false },
          ],
          rows: [],
        },
      ]),
    ).toEqual({
      ok: false,
      error: "Grid questions must have at least one row",
    });
  });
});

describe("question editor actions", () => {
  const drafts = [
    {
      text: "Question A",
      type: "radio" as const,
      options: [
        { text: "Answer A1", isCorrect: false },
        { text: "Answer A2", isCorrect: true },
      ],
      rows: ["Row A1", "Row A2"],
    },
    {
      text: "Question B",
      type: "radio" as const,
      options: [
        { text: "Answer B1", isCorrect: false },
        { text: "Answer B2", isCorrect: true },
      ],
      rows: ["Row B1", "Row B2"],
    },
  ];

  it("moves the last question down to the first position", () => {
    expect(
      applyQuestionEditorAction(drafts, {
        qIdx: 1,
        type: "move-question-down",
      }).map((question) => question.text),
    ).toEqual(["Question B", "Question A"]);
  });

  it("moves the first question up to the last position", () => {
    expect(
      applyQuestionEditorAction(drafts, {
        qIdx: 0,
        type: "move-question-up",
      }).map((question) => question.text),
    ).toEqual(["Question B", "Question A"]);
  });

  it("wraps answers and rows at the list boundaries", () => {
    expect(
      applyQuestionEditorAction(drafts, {
        aIdx: 1,
        qIdx: 0,
        type: "move-answer-down",
      })[0]?.options.map((answer) => answer.text),
    ).toEqual(["Answer A2", "Answer A1"]);

    expect(
      applyQuestionEditorAction(drafts, {
        qIdx: 0,
        rIdx: 0,
        type: "move-row-up",
      })[0]?.rows,
    ).toEqual(["Row A2", "Row A1"]);
  });

  it("keeps checkbox-grid answer keys scoped to selected rows", () => {
    const formData = new FormData();
    formData.append("q-0-text", "Grid question");
    formData.append("q-0-type", "checkbox-grid");
    formData.append("q-0-answer-0", "Answer A");
    formData.append("q-0-answer-1", "Answer B");
    formData.append("q-0-subQuestion-0", "Row A");
    formData.append("q-0-subQuestion-1", "Row B");
    formData.append("q-0-grid-row-1-answer", "0");

    expect(parseQuestionForm(formData, { preserveEmpty: true })[0]?.options).toEqual([
      { text: "Answer A", isCorrect: true, correctRows: [1] },
      { text: "Answer B", isCorrect: false },
    ]);
  });

  it("moves radio-grid answer keys with their rows", () => {
    expect(
      applyQuestionEditorAction(
        [
          {
            text: "Grid question",
            type: "radio-grid",
            options: [
              { text: "Answer A", isCorrect: true, correctRows: [0] },
              { text: "Answer B", isCorrect: true, correctRows: [1] },
            ],
            rows: ["Row A", "Row B"],
          },
        ],
        {
          qIdx: 0,
          rIdx: 0,
          type: "move-row-down",
        },
      )[0]?.options,
    ).toEqual([
      { text: "Answer A", isCorrect: true, correctRows: [1] },
      { text: "Answer B", isCorrect: true, correctRows: [0] },
    ]);
  });

  it("keeps an open grid answer key after unrelated question intents", () => {
    expect(
      getNextAnswerKeyQuestionIndex(
        [
          {
            text: "Grid question",
            type: "radio-grid",
            options: [
              { text: "Answer A", isCorrect: true, correctRows: [0] },
              { text: "Answer B", isCorrect: false, correctRows: [] },
            ],
            rows: ["Row A"],
          },
          {
            text: "Other question",
            type: "radio",
            options: [
              { text: "Answer A", isCorrect: false },
              { text: "Answer B", isCorrect: true },
            ],
            rows: [],
          },
        ],
        {
          qIdx: 1,
          questionType: "checkbox",
          type: "apply-question",
        },
        0,
      ),
    ).toBe(0);
  });
});

describe("question editor action parsing", () => {
  it("parses question action intents", () => {
    expect(toQuestionEditorAction(questionEditorIntents.moveRowDown(2, 1))).toEqual({
      qIdx: 2,
      rIdx: 1,
      type: "move-row-down",
    });
  });

  it("rejects invalid question action intents", () => {
    expect(toQuestionEditorAction("question:2:nope")).toBeNull();
    expect(toQuestionEditorAction("question:-1:row:1:move:down")).toBeNull();
  });
});
