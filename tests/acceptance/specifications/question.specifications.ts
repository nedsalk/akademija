import type { DSL } from "../dsl";
import type { Specification } from "./types";

export const questionSpecs: Specification = {
  "teacher adds a radio-grid question to lesson": async (dsl: DSL) => {
    const { teacher, lesson } = await dsl.program.given["a course with a lesson"]();
    const question = await dsl.question.when["they add a radio-grid question"]({
      teacher,
      lesson,
    });
    await dsl.question.then["the lesson is updated with that question"]({
      teacher,
      lesson,
      question,
    });
  },

  "teacher adds a radio-grid question with different answers per row": async (dsl: DSL) => {
    const { teacher, lesson } = await dsl.program.given["a course with a lesson"]();
    const question = await dsl.question.when[
      "they add a radio-grid question with two rows where each row has a different marked answer"
    ]({
      teacher,
      lesson,
    });
    await dsl.question.then["the lesson is updated with that question"]({
      teacher,
      lesson,
      question,
    });
  },

  "teacher adds a checkbox-grid question to lesson": async (dsl: DSL) => {
    const { teacher, lesson } = await dsl.program.given["a course with a lesson"]();
    const question = await dsl.question.when["they add a checkbox-grid question"]({
      teacher,
      lesson,
    });
    await dsl.question.then["the lesson is updated with that question"]({
      teacher,
      lesson,
      question,
    });
  },

  "teacher adds a checkbox-grid question with different multiple answers per row": async (
    dsl: DSL,
  ) => {
    const { teacher, lesson } = await dsl.program.given["a course with a lesson"]();
    const question = await dsl.question.when[
      "they add a checkbox-grid question with two rows where the rows have different marked answers"
    ]({
      teacher,
      lesson,
    });
    await dsl.question.then["the lesson is updated with that question"]({
      teacher,
      lesson,
      question,
    });
  },

  "teacher adds a single-answer question to lesson": async (dsl: DSL) => {
    const { teacher, lesson } = await dsl.program.given["a course with a lesson"]();
    const question = await dsl.question.when["they add a single-answer question"]({
      teacher,
      lesson,
    });
    await dsl.question.then["the question appears with marked answer"]({
      teacher,
      lesson,
      question,
    });
  },

  "teacher adds a multiple-answer question with 3 options where options 1 and 3 are marked correct":
    async (dsl: DSL) => {
      const { teacher, lesson } = await dsl.program.given["a course with a lesson"]();
      const question = await dsl.question.when[
        "they add a multiple-answer question with 3 options where options 1 and 3 are marked correct and save"
      ]({
        teacher,
        lesson,
      });
      await dsl.question.then["the lesson is updated with that question"]({
        teacher,
        lesson,
        question,
      });
    },

  "teacher removes a question from lesson": async (dsl: DSL) => {
    const { teacher, lesson, question } = await dsl.question.given["a lesson with a question"]();
    await dsl.question.when["they remove the question"]({
      teacher,
      lesson,
      question,
    });
    await dsl.question.then["the question is removed"]({
      teacher,
      lesson,
      question,
    });
  },

  "teacher adds a new question to lesson that already has a question": async (dsl: DSL) => {
    const { teacher, lesson, question } = await dsl.question.given["a lesson with a question"]();
    const question2 = await dsl.question.when["they add a single-answer question"]({
      teacher,
      lesson,
    });
    await dsl.question.then["the lesson has questions"]({
      teacher,
      lesson,
      questions: [question, question2],
    });
  },

  // "teacher can reorder questions within a lesson": async (dsl: DSL) => {
  //   const { teacher, lesson, questions } =
  //     await dsl.question.given["a lesson with multiple questions"]();
  //   const reorderedQuestions = await dsl.question.when["they reorder the questions"]({
  //     teacher,
  //     lesson,
  //     questions,
  //   });
  //   await dsl.question.then["the new question order is saved"]({
  //     teacher,
  //     lesson,
  //     questions: reorderedQuestions,
  //   });
  // },

  // "teacher moves the last question down to the first position": async (dsl: DSL) => {
  //   const { teacher, lesson, questions } =
  //     await dsl.question.given["a lesson with multiple questions"]();
  //   const reorderedQuestions = await dsl.question.when["they move the last question down"]({
  //     teacher,
  //     lesson,
  //     questions,
  //   });
  //   await dsl.question.then["the new question order is saved"]({
  //     teacher,
  //     lesson,
  //     questions: reorderedQuestions,
  //   });
  // },

  // "teacher moves the first question up to the last position": async (dsl: DSL) => {
  //   const { teacher, lesson, questions } =
  //     await dsl.question.given["a lesson with multiple questions"]();
  //   const reorderedQuestions = await dsl.question.when["they move the first question up"]({
  //     teacher,
  //     lesson,
  //     questions,
  //   });
  //   await dsl.question.then["the new question order is saved"]({
  //     teacher,
  //     lesson,
  //     questions: reorderedQuestions,
  //   });
  // },
};
