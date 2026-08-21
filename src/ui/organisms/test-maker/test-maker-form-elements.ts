export const FORM_ELEMENTS = {
  question: "question",
  answers: "answers",
  subQuestions: "subQuestions",
  textAndType: "text-and-type",
  questionAction: "question-action",
  answerKeyQuestionIndex: "answer-key-question-index",

  actions: {
    addQuestion: {
      name: "add-question",
      templateId: "question-template",
    },
    addAnswer: {
      name: "add-answer",
      templateIds: {
        radio: "answer-template-radio",
        checkbox: "answer-template-checkbox",
      },
    },
    addSubQuestion: {
      name: "add-subQuestion",
      templateId: "subQuestion-template",
    },
    removeAnswer: "remove-answer",
    removeQuestion: "remove-question",
    reorder: "reorder",
  },

  answerType: {
    radio: "radio",
    checkbox: "checkbox",
    radioGrid: "radio-grid",
    checkboxGrid: "checkbox-grid",
  },

  naming: {
    question: (qIdx: number) => `Pitanje ${qIdx + 1}`,
    qText: (qIdx: number) => `q-${qIdx}-text`,
    qType: (qIdx: number) => `q-${qIdx}-type`,
    qAnswer: (qIdx: number) => `q-${qIdx}-answer`,
    qAnswerText: (qIdx: number, aIdx: number) => `q-${qIdx}-answer-${aIdx}`,
    qGridAnswer: (qIdx: number, rIdx: number) => `q-${qIdx}-grid-row-${rIdx}-answer`,
    qSubQuestionText: (qIdx: number, aIdx: number) => `q-${qIdx}-subQuestion-${aIdx}`,
  },

  focus: {
    addQuestion: "add-question",
    questionType: (qIdx: number, type: string) => `q-${qIdx}-type-${type}`,
    addAnswer: (qIdx: number) => `q-${qIdx}-answer-add`,
    answerKey: (qIdx: number) => `q-${qIdx}-answer-key`,
    answerMove: (qIdx: number, aIdx: number, direction: "down" | "up") =>
      `q-${qIdx}-answer-${aIdx}-move-${direction}`,
    addSubQuestion: (qIdx: number) => `q-${qIdx}-subQuestion-add`,
    subQuestionMove: (qIdx: number, aIdx: number, direction: "down" | "up") =>
      `q-${qIdx}-subQuestion-${aIdx}-move-${direction}`,
  },

  templateIds: {
    subQuestions: "subQuestions-template",
  },
} as const;
