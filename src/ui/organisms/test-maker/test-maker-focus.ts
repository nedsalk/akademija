import type { QuestionDraft } from "../../../domain/questions";
import type { QuestionEditorAction } from "../../../features/question-editor-actions";
import { FORM_ELEMENTS } from "./test-maker-form-elements";

function moveTargetIndex(itemCount: number, fromIndex: number, direction: "down" | "up") {
  if (itemCount < 1 || fromIndex < 0 || fromIndex >= itemCount) {
    return fromIndex;
  }

  return direction === "down"
    ? (fromIndex + 1) % itemCount
    : (fromIndex - 1 + itemCount) % itemCount;
}

export function getNextTestMakerFocusTarget(drafts: QuestionDraft[], action: QuestionEditorAction) {
  switch (action.type) {
    case "add-answer":
      return FORM_ELEMENTS.focus.addAnswer(action.qIdx);
    case "add-question":
      return FORM_ELEMENTS.focus.addQuestion;
    case "add-row":
      return FORM_ELEMENTS.focus.addSubQuestion(action.qIdx);
    case "apply-question":
      return FORM_ELEMENTS.focus.questionType(action.qIdx, action.questionType);
    case "close-answer-key":
    case "open-answer-key":
      return FORM_ELEMENTS.focus.answerKey(action.qIdx);
    case "move-answer-down": {
      const answerCount = drafts[action.qIdx]?.options.length ?? 0;
      return FORM_ELEMENTS.focus.answerMove(
        action.qIdx,
        moveTargetIndex(answerCount, action.aIdx, "down"),
        "down",
      );
    }
    case "move-answer-up": {
      const answerCount = drafts[action.qIdx]?.options.length ?? 0;
      return FORM_ELEMENTS.focus.answerMove(
        action.qIdx,
        moveTargetIndex(answerCount, action.aIdx, "up"),
        "up",
      );
    }
    case "move-row-down": {
      const rowCount = drafts[action.qIdx]?.rows.length ?? 0;
      return FORM_ELEMENTS.focus.subQuestionMove(
        action.qIdx,
        moveTargetIndex(rowCount, action.rIdx, "down"),
        "down",
      );
    }
    case "move-row-up": {
      const rowCount = drafts[action.qIdx]?.rows.length ?? 0;
      return FORM_ELEMENTS.focus.subQuestionMove(
        action.qIdx,
        moveTargetIndex(rowCount, action.rIdx, "up"),
        "up",
      );
    }
    default:
      return undefined;
  }
}
