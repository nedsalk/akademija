import { QUESTION_TYPES } from "./constants";
import type { Result } from "./result";
import type { QuestionType } from "./types";

export type { QuestionType } from "./types";

interface QuestionOptionDraft {
  correctRows?: number[];
  isCorrect: boolean;
  text: string;
}

export type QuestionDraft = {
  options: QuestionOptionDraft[];
  rows: string[];
  text: string;
  type: QuestionType;
};

export interface PreparedQuestion {
  options: QuestionOptionDraft[];
  rows: string[];
  text: string;
  type: QuestionType;
}

const QUESTION_TYPE_SET: ReadonlySet<QuestionType> = new Set(QUESTION_TYPES);

function trimText(value?: string | null) {
  return value?.trim() ?? "";
}

function normalizeOptions(options: QuestionOptionDraft[]) {
  return options
    .map((option) => {
      const correctRows = option.correctRows
        ? Array.from(new Set(option.correctRows)).sort((left, right) => left - right)
        : undefined;
      return {
        text: trimText(option.text),
        isCorrect: option.isCorrect || Boolean(correctRows?.length),
        ...(correctRows?.length ? { correctRows } : {}),
      };
    })
    .filter((option) => option.text);
}

function normalizeRows(rows: string[]) {
  return rows.map((row) => trimText(row)).filter(Boolean);
}

export function prepareQuestionSet(drafts: QuestionDraft[]): Result<PreparedQuestion[], string> {
  const preparedQuestions: PreparedQuestion[] = [];

  for (const draft of drafts) {
    const text = trimText(draft.text);
    if (!text) {
      continue;
    }

    if (!QUESTION_TYPE_SET.has(draft.type)) {
      return {
        ok: false,
        error: "Question type is invalid",
      };
    }

    const options = normalizeOptions(draft.options);
    if (options.length < 2) {
      return {
        ok: false,
        error: "Each question must have at least two answer options",
      };
    }

    const rows =
      draft.type === "radio-grid" || draft.type === "checkbox-grid"
        ? normalizeRows(draft.rows)
        : [];
    const correctAnswerCount = options.filter((option) => option.isCorrect).length;

    if (draft.type === "radio" && correctAnswerCount !== 1) {
      return {
        ok: false,
        error: "Single-answer questions must have exactly one correct answer",
      };
    }

    if (draft.type === "checkbox" && correctAnswerCount < 1) {
      return {
        ok: false,
        error: "Multiple-answer questions must have at least one correct answer",
      };
    }

    if ((draft.type === "radio-grid" || draft.type === "checkbox-grid") && rows.length < 1) {
      return {
        ok: false,
        error: "Grid questions must have at least one row",
      };
    }

    if (draft.type === "radio-grid") {
      for (const rowIndex of rows.keys()) {
        const correctRowAnswerCount = options.filter((option) =>
          (option.correctRows ?? (option.isCorrect ? [rowIndex] : [])).includes(rowIndex),
        ).length;
        if (correctRowAnswerCount !== 1) {
          return {
            ok: false,
            error: "Single-answer questions must have exactly one correct answer",
          };
        }
      }
    }

    if (draft.type === "checkbox-grid") {
      for (const rowIndex of rows.keys()) {
        const correctRowAnswerCount = options.filter((option) =>
          (option.correctRows ?? (option.isCorrect ? [rowIndex] : [])).includes(rowIndex),
        ).length;
        if (correctRowAnswerCount < 1) {
          return {
            ok: false,
            error: "Multiple-answer questions must have at least one correct answer",
          };
        }
      }
    }

    preparedQuestions.push({
      text,
      type: draft.type,
      options,
      rows,
    });
  }

  return {
    ok: true,
    value: preparedQuestions,
  };
}
