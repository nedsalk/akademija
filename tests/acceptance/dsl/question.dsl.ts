/** biome-ignore-all lint/suspicious/noThenProperty: <given-when-then> */
import type { QuestionDriver } from "../drivers/interface";
import type {
  Expect,
  Lesson,
  Question,
  TeacherLesson,
  TeacherLessonQuestion,
  TeacherLessonQuestions,
  User,
} from "./types";

export interface QuestionDSL {
  given: {
    "a lesson with a question": () => Promise<TeacherLessonQuestion>;
    "a lesson with multiple questions": () => Promise<TeacherLessonQuestions>;
  };
  when: {
    "they add a single-answer question": (args: {
      teacher: User;
      lesson: Lesson;
    }) => Promise<Question>;
    "they add a single-answer question with options": (args: {
      teacher: User;
      lesson: Lesson;
      options: Array<{ text: string; isCorrect: boolean }>;
    }) => Promise<Question>;
    "they add a radio-grid question": (args: {
      teacher: User;
      lesson: Lesson;
    }) => Promise<Question>;
    "they add a radio-grid question with two rows where each row has a different marked answer": (args: {
      teacher: User;
      lesson: Lesson;
    }) => Promise<Question>;
    "they add a checkbox-grid question": (args: {
      teacher: User;
      lesson: Lesson;
    }) => Promise<Question>;
    "they add a checkbox-grid question with two rows where the rows have different marked answers": (args: {
      teacher: User;
      lesson: Lesson;
    }) => Promise<Question>;
    "they add a multiple-answer question with 3 options where options 1 and 3 are marked correct and save": (args: {
      teacher: User;
      lesson: Lesson;
    }) => Promise<Question>;
    "they remove the question": (args: {
      teacher: User;
      lesson: Lesson;
      question: Question;
    }) => Promise<void>;
    "they reorder the questions": (args: {
      teacher: User;
      lesson: Lesson;
      questions: Question[];
    }) => Promise<Question[]>;
    "they move the last question down": (args: {
      teacher: User;
      lesson: Lesson;
      questions: Question[];
    }) => Promise<Question[]>;
    "they move the first question up": (args: {
      teacher: User;
      lesson: Lesson;
      questions: Question[];
    }) => Promise<Question[]>;
  };
  then: {
    "the question appears with marked answer": (args: {
      teacher: User;
      lesson: Lesson;
      question: Question;
    }) => Promise<void>;
    "the lesson is updated with that question": (args: {
      teacher: User;
      lesson: Lesson;
      question: Question;
    }) => Promise<void>;
    "the question is removed": (args: {
      teacher: User;
      lesson: Lesson;
      question: Question;
    }) => Promise<void>;
    "the lesson has questions": (args: {
      teacher: User;
      lesson: Lesson;
      questions: Question[];
    }) => Promise<void>;
    "the new question order is saved": (args: {
      teacher: User;
      lesson: Lesson;
      questions: Question[];
    }) => Promise<void>;
  };
}

export function createQuestionDSL(
  driver: QuestionDriver,
  expect: Expect,
  programDSL: {
    given: {
      "a course with a lesson": () => Promise<TeacherLesson>;
    };
  },
): QuestionDSL {
  return {
    given: {
      "a lesson with a question": async () => {
        const { teacher, lesson } = await programDSL.given["a course with a lesson"]();
        const options = [
          { text: "Option A", isCorrect: false },
          { text: "Option B", isCorrect: true },
        ];
        const question = await driver.addSingleAnswerQuestion(teacher, lesson, options);
        return { teacher, lesson, question };
      },
      "a lesson with multiple questions": async () => {
        const { teacher, lesson } = await programDSL.given["a course with a lesson"]();
        const firstQuestion = await driver.addSingleAnswerQuestion(teacher, lesson, [
          { text: "Option A", isCorrect: false },
          { text: "Option B", isCorrect: true },
        ]);
        const secondQuestion = await driver.addSingleAnswerQuestion(teacher, lesson, [
          { text: "Option C", isCorrect: false },
          { text: "Option D", isCorrect: true },
        ]);
        return {
          teacher,
          lesson,
          questions: [firstQuestion, secondQuestion],
        };
      },
    },
    when: {
      "they add a single-answer question": async ({ teacher, lesson }) => {
        const options = [
          { text: "Option A", isCorrect: false },
          { text: "Option B", isCorrect: true },
        ];
        return driver.addSingleAnswerQuestion(teacher, lesson, options);
      },
      "they add a single-answer question with options": async ({ teacher, lesson, options }) => {
        return driver.addSingleAnswerQuestion(teacher, lesson, options);
      },
      "they add a radio-grid question": async ({ teacher, lesson }) => {
        const options = [
          { text: "Option A", isCorrect: false },
          { text: "Option B", isCorrect: true },
        ];
        const rows = ["Row A", "Row B"];
        return driver.addRadioGridQuestion(teacher, lesson, options, rows);
      },
      "they add a radio-grid question with two rows where each row has a different marked answer":
        async ({ teacher, lesson }) => {
          const options = [
            { text: "Option A", isCorrect: true, correctRows: [0] },
            { text: "Option B", isCorrect: true, correctRows: [1] },
          ];
          const rows = ["Row A", "Row B"];
          return driver.addRadioGridQuestion(teacher, lesson, options, rows);
        },
      "they add a checkbox-grid question": async ({ teacher, lesson }) => {
        const options = [
          { text: "Option A", isCorrect: true },
          { text: "Option B", isCorrect: false },
          { text: "Option C", isCorrect: true },
        ];
        const rows = ["Row A", "Row B"];
        return driver.addCheckboxGridQuestion(teacher, lesson, options, rows);
      },
      "they add a checkbox-grid question with two rows where the rows have different marked answers":
        async ({ teacher, lesson }) => {
          const options = [
            { text: "Option A", isCorrect: true, correctRows: [0, 1] },
            { text: "Option B", isCorrect: true, correctRows: [1] },
            { text: "Option C", isCorrect: true, correctRows: [0] },
          ];
          const rows = ["Row A", "Row B"];
          return driver.addCheckboxGridQuestion(teacher, lesson, options, rows);
        },
      "they add a multiple-answer question with 3 options where options 1 and 3 are marked correct and save":
        async ({ teacher, lesson }) => {
          const options = [
            { text: "Option A", isCorrect: true },
            { text: "Option B", isCorrect: false },
            { text: "Option C", isCorrect: true },
          ];
          return driver.addMultipleAnswerQuestion(teacher, lesson, options);
        },
      "they remove the question": async ({ teacher, lesson, question }) => {
        return driver.removeQuestion(teacher, lesson, question);
      },
      "they reorder the questions": async ({ teacher, lesson, questions }) => {
        const reorderedQuestions = [questions[1], questions[0]].filter(
          (question): question is Question => Boolean(question),
        );
        await driver.reorderQuestions(teacher, lesson, reorderedQuestions);
        return reorderedQuestions;
      },
      "they move the last question down": async ({ teacher, lesson, questions }) => {
        const reorderedQuestions = [questions[1], questions[0]].filter(
          (question): question is Question => Boolean(question),
        );
        await driver.moveLastQuestionDown(teacher, lesson);
        return reorderedQuestions;
      },
      "they move the first question up": async ({ teacher, lesson, questions }) => {
        const reorderedQuestions = [questions[1], questions[0]].filter(
          (question): question is Question => Boolean(question),
        );
        await driver.moveFirstQuestionUp(teacher, lesson);
        return reorderedQuestions;
      },
    },

    then: {
      "the question appears with marked answer": async ({
        teacher,
        lesson,
        question,
      }): Promise<void> => {
        const seeQuestion = await driver.seeQuestionWithMarkedAnswer(teacher, lesson, question);
        expect(seeQuestion).toBe(true);
      },
      "the lesson is updated with that question": async ({
        teacher,
        lesson,
        question,
      }): Promise<void> => {
        const lessonUpdated = await driver.seesQuestions(teacher, lesson, [question]);
        expect(lessonUpdated).toBe(true);
      },
      "the question is removed": async ({ teacher, lesson, question }): Promise<void> => {
        const questionExists = await driver.seesQuestions(teacher, lesson, [question]);
        expect(questionExists).toBe(false);
      },
      "the lesson has questions": async ({ teacher, lesson, questions }): Promise<void> => {
        const hasAllQuestions = await driver.seesQuestions(teacher, lesson, questions);
        expect(hasAllQuestions).toBe(true);
      },
      "the new question order is saved": async ({ teacher, lesson, questions }): Promise<void> => {
        const hasAllQuestions = await driver.seesQuestions(teacher, lesson, questions);
        expect(hasAllQuestions).toBe(true);
      },
    },
  };
}
