export type QuestionEditorAction =
  | { type: "add-question" }
  | { qIdx: number; type: "add-answer" }
  | { qIdx: number; type: "add-row" }
  | { qIdx: number; type: "close-answer-key" }
  | { qIdx: number; type: "open-answer-key" }
  | { qIdx: number; questionType: string; type: "apply-question" }
  | { qIdx: number; type: "move-question-down" }
  | { qIdx: number; type: "move-question-up" }
  | { aIdx: number; qIdx: number; type: "move-answer-down" }
  | { aIdx: number; qIdx: number; type: "move-answer-up" }
  | { qIdx: number; rIdx: number; type: "move-row-down" }
  | { qIdx: number; rIdx: number; type: "move-row-up" }
  | { qIdx: number; type: "remove-question" }
  | { aIdx: number; qIdx: number; type: "remove-answer" }
  | { qIdx: number; rIdx: number; type: "remove-row" };

export const questionEditorIntents = {
  addQuestion: "add-question",
  addAnswer: (qIdx: number) => `question:${qIdx}:answer:add`,
  addRow: (qIdx: number) => `question:${qIdx}:row:add`,
  applyQuestion: (qIdx: number, questionType: string) => `question:${qIdx}:type:${questionType}`,
  closeAnswerKey: (qIdx: number) => `question:${qIdx}:answer-key:close`,
  moveAnswerDown: (qIdx: number, aIdx: number) => `question:${qIdx}:answer:${aIdx}:move:down`,
  moveAnswerUp: (qIdx: number, aIdx: number) => `question:${qIdx}:answer:${aIdx}:move:up`,
  moveQuestionDown: (qIdx: number) => `question:${qIdx}:move:down`,
  moveQuestionUp: (qIdx: number) => `question:${qIdx}:move:up`,
  moveRowDown: (qIdx: number, rIdx: number) => `question:${qIdx}:row:${rIdx}:move:down`,
  moveRowUp: (qIdx: number, rIdx: number) => `question:${qIdx}:row:${rIdx}:move:up`,
  openAnswerKey: (qIdx: number) => `question:${qIdx}:answer-key:open`,
  removeAnswer: (qIdx: number, aIdx: number) => `question:${qIdx}:answer:${aIdx}:remove`,
  removeQuestion: (qIdx: number) => `question:${qIdx}:remove`,
  removeRow: (qIdx: number, rIdx: number) => `question:${qIdx}:row:${rIdx}:remove`,
} as const;

function parseIndex(value: string | undefined) {
  if (value === undefined || !/^\d+$/.test(value)) {
    return null;
  }

  return Number(value);
}

export function toQuestionEditorAction(
  intent: string | null | undefined,
): QuestionEditorAction | null {
  if (!intent) {
    return null;
  }

  if (intent === questionEditorIntents.addQuestion) {
    return { type: "add-question" };
  }

  const parts = intent.split(":");
  if (parts[0] !== "question") {
    return null;
  }

  const qIdx = parseIndex(parts[1]);
  if (qIdx === null) {
    return null;
  }

  if (parts.length === 3 && parts[2] === "remove") {
    return { qIdx, type: "remove-question" };
  }

  if (parts.length === 4 && parts[2] === "move") {
    if (parts[3] === "up") {
      return { qIdx, type: "move-question-up" };
    }
    if (parts[3] === "down") {
      return { qIdx, type: "move-question-down" };
    }
    return null;
  }

  if (parts.length === 4 && parts[2] === "type") {
    const questionType = parts[3];
    return questionType ? { qIdx, questionType, type: "apply-question" } : null;
  }

  if (parts.length === 4 && parts[2] === "answer-key") {
    if (parts[3] === "open") {
      return { qIdx, type: "open-answer-key" };
    }
    if (parts[3] === "close") {
      return { qIdx, type: "close-answer-key" };
    }
    return null;
  }

  if (parts.length === 4 && parts[2] === "answer" && parts[3] === "add") {
    return { qIdx, type: "add-answer" };
  }

  if (parts.length === 5 && parts[2] === "answer" && parts[4] === "remove") {
    const aIdx = parseIndex(parts[3]);
    return aIdx === null ? null : { aIdx, qIdx, type: "remove-answer" };
  }

  if (parts.length === 6 && parts[2] === "answer" && parts[4] === "move") {
    const aIdx = parseIndex(parts[3]);
    if (aIdx === null) {
      return null;
    }
    if (parts[5] === "up") {
      return { aIdx, qIdx, type: "move-answer-up" };
    }
    if (parts[5] === "down") {
      return { aIdx, qIdx, type: "move-answer-down" };
    }
    return null;
  }

  if (parts.length === 4 && parts[2] === "row" && parts[3] === "add") {
    return { qIdx, type: "add-row" };
  }

  if (parts.length === 5 && parts[2] === "row" && parts[4] === "remove") {
    const rIdx = parseIndex(parts[3]);
    return rIdx === null ? null : { qIdx, rIdx, type: "remove-row" };
  }

  if (parts.length === 6 && parts[2] === "row" && parts[4] === "move") {
    const rIdx = parseIndex(parts[3]);
    if (rIdx === null) {
      return null;
    }
    if (parts[5] === "up") {
      return { qIdx, rIdx, type: "move-row-up" };
    }
    if (parts[5] === "down") {
      return { qIdx, rIdx, type: "move-row-down" };
    }
  }

  return null;
}
