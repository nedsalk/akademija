import type { QuestionDraft, QuestionType } from "../domain/questions";
import type { QuestionEditorAction } from "./question-editor-actions";

interface ParseQuestionFormOptions {
  preserveEmpty?: boolean;
}

function createBlankOption() {
  return {
    correctRows: [],
    text: "",
    isCorrect: false,
  };
}

export function createEmptyQuestionDraft(): QuestionDraft {
  return {
    text: "",
    type: "radio",
    options: [],
    rows: [],
  };
}

function cloneQuestionDraft(draft: QuestionDraft): QuestionDraft {
  return {
    text: draft.text,
    type: draft.type,
    options: draft.options.map((option) => {
      const sourceOption = option ?? createBlankOption();
      return {
        ...sourceOption,
        ...(sourceOption.correctRows ? { correctRows: [...sourceOption.correctRows] } : {}),
      };
    }),
    rows: draft.rows.map((row) => row ?? ""),
  };
}

export function parseQuestionForm(formData: FormData, options: ParseQuestionFormOptions = {}) {
  const questions = new Map<number, QuestionDraft>();

  for (const [fullKey, rawValue] of formData.entries()) {
    const value = rawValue.toString();
    const match = fullKey.match(/^q-(\d+)-(.+)$/);

    if (!match) {
      continue;
    }

    const questionIndex = Number(match[1]);
    const key = match[2];
    if (!key) {
      continue;
    }
    const draft = questions.get(questionIndex) ?? createEmptyQuestionDraft();

    if (key === "text") {
      draft.text = value;
      questions.set(questionIndex, draft);
      continue;
    }

    if (key === "type") {
      draft.type = value as QuestionType;
      questions.set(questionIndex, draft);
      continue;
    }

    const answerTextMatch = key.match(/^answer-(\d+)$/);
    if (answerTextMatch) {
      const optionIndex = Number(answerTextMatch[1]);
      const option = draft.options[optionIndex] ?? {
        text: "",
        isCorrect: false,
      };
      option.text = value;
      draft.options[optionIndex] = option;
      questions.set(questionIndex, draft);
      continue;
    }

    if (key === "answer") {
      const optionIndex = Number(value);
      const option = draft.options[optionIndex] ?? {
        text: "",
        isCorrect: false,
      };
      option.isCorrect = true;
      draft.options[optionIndex] = option;
      questions.set(questionIndex, draft);
      continue;
    }

    const gridAnswerMatch = key.match(/^grid-row-(\d+)-answer$/);
    if (gridAnswerMatch) {
      const rowIndex = Number(gridAnswerMatch[1]);
      const optionIndex = Number(value);
      const option = draft.options[optionIndex] ?? {
        correctRows: [],
        text: "",
        isCorrect: false,
      };
      option.correctRows = option.correctRows ?? [];
      if (!option.correctRows.includes(rowIndex)) {
        option.correctRows.push(rowIndex);
      }
      option.isCorrect = true;
      draft.options[optionIndex] = option;
      questions.set(questionIndex, draft);
      continue;
    }

    const rowMatch = key.match(/^subQuestion-(\d+)$/);
    if (rowMatch) {
      const rowIndex = Number(rowMatch[1]);
      draft.rows[rowIndex] = value;
      questions.set(questionIndex, draft);
    }
  }

  const drafts = Array.from(questions.entries())
    .sort(([left], [right]) => left - right)
    .map(([, draft]) => cloneQuestionDraft(draft));

  if (options.preserveEmpty) {
    return drafts;
  }

  return drafts.map((draft) => ({
    ...draft,
    options: draft.options.filter((option) => option?.text.trim()),
    rows: draft.rows.filter((row) => row?.trim()),
  }));
}

function getQuestionDraft(drafts: QuestionDraft[], questionIndex: number) {
  return drafts[questionIndex] ?? null;
}

function moveItem<T>(items: T[], fromIndex: number, toIndex: number) {
  if (
    !Number.isInteger(fromIndex) ||
    !Number.isInteger(toIndex) ||
    fromIndex < 0 ||
    fromIndex >= items.length ||
    items.length < 1
  ) {
    return items;
  }

  const normalizedToIndex = ((toIndex % items.length) + items.length) % items.length;
  const nextItems = [...items];
  const [item] = nextItems.splice(fromIndex, 1);
  if (item === undefined) {
    return items;
  }
  nextItems.splice(normalizedToIndex, 0, item);
  return nextItems;
}

function removeCorrectRow(correctRows: number[] | undefined, rowIndex: number) {
  return (correctRows ?? [])
    .filter((correctRow) => correctRow !== rowIndex)
    .map((correctRow) => (correctRow > rowIndex ? correctRow - 1 : correctRow));
}

function moveCorrectRows(
  correctRows: number[] | undefined,
  fromIndex: number,
  toIndex: number,
  rowCount: number,
) {
  const rowOrder = moveItem(
    Array.from({ length: rowCount }, (_, rowIndex) => rowIndex),
    fromIndex,
    toIndex,
  );
  return (correctRows ?? [])
    .map((correctRow) => rowOrder.indexOf(correctRow))
    .filter((correctRow) => correctRow >= 0);
}

export function applyQuestionEditorAction(drafts: QuestionDraft[], action: QuestionEditorAction) {
  const nextDrafts = drafts.map((draft) => cloneQuestionDraft(draft));

  switch (action.type) {
    case "add-question":
      nextDrafts.push(createEmptyQuestionDraft());
      break;
    case "add-answer": {
      const draft = getQuestionDraft(nextDrafts, action.qIdx);
      draft?.options.push(createBlankOption());
      break;
    }
    case "add-row": {
      const draft = getQuestionDraft(nextDrafts, action.qIdx);
      draft?.rows.push("");
      break;
    }
    case "apply-question": {
      const draft = getQuestionDraft(nextDrafts, action.qIdx);
      if (draft) {
        draft.type = action.questionType as QuestionType;
      }
      break;
    }
    case "close-answer-key":
    case "open-answer-key":
      break;
    case "remove-question":
      nextDrafts.splice(action.qIdx, 1);
      break;
    case "remove-answer": {
      const draft = getQuestionDraft(nextDrafts, action.qIdx);
      if (draft && draft.options.length > 2) {
        draft.options.splice(action.aIdx, 1);
      }
      break;
    }
    case "remove-row": {
      const draft = getQuestionDraft(nextDrafts, action.qIdx);
      if (draft && draft.rows.length > 1) {
        draft.rows.splice(action.rIdx, 1);
        draft.options = draft.options.map((option) => {
          const correctRows = removeCorrectRow(option.correctRows, action.rIdx);
          return {
            ...option,
            correctRows,
            isCorrect: option.correctRows === undefined ? option.isCorrect : correctRows.length > 0,
          };
        });
      }
      break;
    }
    case "move-question-up":
      return moveItem(nextDrafts, action.qIdx, action.qIdx - 1);
    case "move-question-down":
      return moveItem(nextDrafts, action.qIdx, action.qIdx + 1);
    case "move-answer-up": {
      const draft = getQuestionDraft(nextDrafts, action.qIdx);
      if (draft) {
        draft.options = moveItem(draft.options, action.aIdx, action.aIdx - 1);
      }
      break;
    }
    case "move-answer-down": {
      const draft = getQuestionDraft(nextDrafts, action.qIdx);
      if (draft) {
        draft.options = moveItem(draft.options, action.aIdx, action.aIdx + 1);
      }
      break;
    }
    case "move-row-up": {
      const draft = getQuestionDraft(nextDrafts, action.qIdx);
      if (draft) {
        const rowCount = draft.rows.length;
        draft.rows = moveItem(draft.rows, action.rIdx, action.rIdx - 1);
        draft.options = draft.options.map((option) => ({
          ...option,
          correctRows: moveCorrectRows(option.correctRows, action.rIdx, action.rIdx - 1, rowCount),
        }));
      }
      break;
    }
    case "move-row-down": {
      const draft = getQuestionDraft(nextDrafts, action.qIdx);
      if (draft) {
        const rowCount = draft.rows.length;
        draft.rows = moveItem(draft.rows, action.rIdx, action.rIdx + 1);
        draft.options = draft.options.map((option) => ({
          ...option,
          correctRows: moveCorrectRows(option.correctRows, action.rIdx, action.rIdx + 1, rowCount),
        }));
      }
      break;
    }
  }

  return nextDrafts;
}

function isGridQuestionType(type: QuestionType) {
  return type === "radio-grid" || type === "checkbox-grid";
}

export function getNextAnswerKeyQuestionIndex(
  drafts: QuestionDraft[],
  action: QuestionEditorAction,
  submittedAnswerKeyQuestionIndex: number | undefined,
) {
  if (action.type === "open-answer-key") {
    return action.qIdx;
  }

  if (submittedAnswerKeyQuestionIndex === undefined) {
    return undefined;
  }

  let nextAnswerKeyQuestionIndex = submittedAnswerKeyQuestionIndex;

  switch (action.type) {
    case "close-answer-key":
      return action.qIdx === submittedAnswerKeyQuestionIndex
        ? undefined
        : submittedAnswerKeyQuestionIndex;
    case "remove-question":
      if (action.qIdx === submittedAnswerKeyQuestionIndex) {
        return undefined;
      }
      if (action.qIdx < submittedAnswerKeyQuestionIndex) {
        nextAnswerKeyQuestionIndex = submittedAnswerKeyQuestionIndex - 1;
      }
      break;
    case "move-question-down": {
      const nextQuestionOrder = moveItem(
        drafts.map((_, qIdx) => qIdx),
        action.qIdx,
        action.qIdx + 1,
      );
      nextAnswerKeyQuestionIndex = nextQuestionOrder.indexOf(submittedAnswerKeyQuestionIndex);
      break;
    }
    case "move-question-up": {
      const nextQuestionOrder = moveItem(
        drafts.map((_, qIdx) => qIdx),
        action.qIdx,
        action.qIdx - 1,
      );
      nextAnswerKeyQuestionIndex = nextQuestionOrder.indexOf(submittedAnswerKeyQuestionIndex);
      break;
    }
  }

  const nextDraft = applyQuestionEditorAction(drafts, action)[nextAnswerKeyQuestionIndex];
  return nextDraft && isGridQuestionType(nextDraft.type) ? nextAnswerKeyQuestionIndex : undefined;
}
