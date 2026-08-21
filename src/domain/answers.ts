import type { QuestionType } from "./questions";
import type { Result } from "./result";

export interface AnswerSelection {
  questionId: string;
  questionOptionId: string;
  questionRowId: string | null;
}

export interface AnswerQuestion {
  id: string;
  options: Array<{
    correctRowIds?: Set<string>;
    id: string;
    isCorrect: boolean;
  }>;
  rows: Array<{ id: string }>;
  type: QuestionType;
}

export type AnswerSheetError = "unknown-question" | "unknown-option" | "unknown-row";

function toSelectionKey(
  questionId: string,
  questionOptionId: string,
  questionRowId: string | null,
) {
  return `${questionId}:${questionRowId ?? ""}:${questionOptionId}`;
}

export function validateAnswerSheet(
  questions: Array<{
    id: string;
    options: Array<{ id: string }>;
    rows: Array<{ id: string }>;
  }>,
  selections: AnswerSelection[],
): Result<AnswerSelection[], AnswerSheetError> {
  const questionById = new Map(questions.map((question) => [question.id, question]));

  for (const selection of selections) {
    const question = questionById.get(selection.questionId);
    if (!question) {
      return { ok: false, error: "unknown-question" };
    }

    if (!question.options.some((option) => option.id === selection.questionOptionId)) {
      return { ok: false, error: "unknown-option" };
    }

    if (
      selection.questionRowId &&
      !question.rows.some((row) => row.id === selection.questionRowId)
    ) {
      return { ok: false, error: "unknown-row" };
    }
  }

  return { ok: true, value: selections };
}

export function getAnswerFeedback(questions: AnswerQuestion[], selections: AnswerSelection[]) {
  const savedSelectionKeys = new Set(
    selections.map((selection) =>
      toSelectionKey(selection.questionId, selection.questionOptionId, selection.questionRowId),
    ),
  );

  return new Map(
    questions.map((question) => {
      const expectedKeys =
        question.type === "radio-grid" || question.type === "checkbox-grid"
          ? question.rows.flatMap((row) =>
              question.options
                .filter((option) =>
                  option.correctRowIds ? option.correctRowIds.has(row.id) : option.isCorrect,
                )
                .map((option) => toSelectionKey(question.id, option.id, row.id)),
            )
          : question.options
              .filter((option) => option.isCorrect)
              .map((option) => toSelectionKey(question.id, option.id, null));
      const selectedKeys = selections
        .filter((selection) => selection.questionId === question.id)
        .map((selection) =>
          toSelectionKey(selection.questionId, selection.questionOptionId, selection.questionRowId),
        );

      const isCorrect =
        selectedKeys.length === expectedKeys.length &&
        selectedKeys.every((key) => savedSelectionKeys.has(key)) &&
        expectedKeys.every((key) => savedSelectionKeys.has(key));

      return [question.id, isCorrect] as const;
    }),
  );
}

export function scoreAnswerSheet(args: {
  questions: AnswerQuestion[];
  selections: AnswerSelection[];
}) {
  const feedback = getAnswerFeedback(args.questions, args.selections);
  const correctCount = Array.from(feedback.values()).filter(Boolean).length;

  return args.questions.length === 0 ? 0 : Math.round((correctCount / args.questions.length) * 100);
}
