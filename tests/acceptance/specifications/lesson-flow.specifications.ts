import type { DSL } from "../dsl";
import type { Specification } from "./types";

export const lessonFlowSpecs: Specification = {
  "student sees the first lesson on their program start date": async (dsl: DSL) => {
    const { student, program, lesson } =
      await dsl.lessonFlow.given["an approved enrollment starting today with lessons"]();

    await dsl.lessonFlow.when["the student opens their enrolled program"]({
      student,
      program,
    });

    await dsl.lessonFlow.then["the first lesson is available"]({
      student,
      program,
      lesson,
    });
  },
  "student sees future lessons as locked": async (dsl: DSL) => {
    const { student, program, lessons } =
      await dsl.lessonFlow.given["an approved enrollment starting today with multiple lessons"]();

    await dsl.lessonFlow.when["the student opens their enrolled program"]({
      student,
      program,
    });

    await dsl.lessonFlow.then["the future lesson is locked"]({
      student,
      program,
      lesson: lessons[1],
    });
  },
  "student cannot open a locked lesson": async (dsl: DSL) => {
    const { student, program, lessons } =
      await dsl.lessonFlow.given["an approved enrollment starting today with multiple lessons"]();

    await dsl.lessonFlow.when["the student opens the lesson"]({
      student,
      program,
      lesson: lessons[1],
    });

    await dsl.lessonFlow.then["the lesson is unavailable"]({
      student,
    });
  },
  "student cannot mark a locked lesson as listened": async (dsl: DSL) => {
    const { student, program, lessons } =
      await dsl.lessonFlow.given["an approved enrollment starting today with multiple lessons"]();

    const result = await dsl.lessonFlow.when["the student posts listened for the lesson"]({
      student,
      program,
      lesson: lessons[1],
    });

    await dsl.lessonFlow.then["the lesson change is refused"](result);
  },
  "student cannot submit answers for a locked lesson": async (dsl: DSL) => {
    const { student, program, lessons } =
      await dsl.lessonFlow.given["an approved enrollment starting today with multiple lessons"]();

    const result = await dsl.lessonFlow.when["the student posts answers for the lesson"]({
      student,
      program,
      lesson: lessons[1],
    });

    await dsl.lessonFlow.then["the lesson change is refused"](result);
  },
  "student cannot submit answers before marking the lesson listened": async (dsl: DSL) => {
    const { student, program, lesson } =
      await dsl.lessonFlow.given["a student viewing an available lesson with a question"]();

    const result = await dsl.lessonFlow.when["the student posts answers for the lesson"]({
      student,
      program,
      lesson,
    });

    await dsl.lessonFlow.then["the lesson change is refused"](result);
  },
  "completing a lesson unlocks the next lesson": async (dsl: DSL) => {
    const { student, program, lessons } =
      await dsl.lessonFlow.given["an approved enrollment starting today with multiple lessons"]();

    await dsl.lessonFlow.when[
      "the student completes the lesson and returns to their enrolled program"
    ]({
      student,
      program,
      lesson: lessons[0],
    });

    await dsl.lessonFlow.then["the second lesson is available"]({
      student,
      program,
      lesson: lessons[1],
    });
  },
  "completed lesson is marked as completed": async (dsl: DSL) => {
    const { student, program, lessons } =
      await dsl.lessonFlow.given["an approved enrollment starting today with multiple lessons"]();

    await dsl.lessonFlow.when[
      "the student completes the lesson and returns to their enrolled program"
    ]({
      student,
      program,
      lesson: lessons[0],
    });

    await dsl.lessonFlow.then["the lesson is marked as completed"]({
      student,
      program,
      lesson: lessons[0],
    });
  },
  "available lesson shows video while questions stay hidden until listened": async (dsl: DSL) => {
    const { student, program, lesson, question } =
      await dsl.lessonFlow.given["a student viewing an available lesson with a question"]();

    await dsl.lessonFlow.then["the lesson video is shown and the questions are still hidden"]({
      student,
      program,
      lesson,
      question,
    });
  },
  "marking a lesson as listened reveals questions without completing the lesson": async (
    dsl: DSL,
  ) => {
    const { student, program, lesson, question } =
      await dsl.lessonFlow.given["a student viewing an available lesson with a question"]();

    await dsl.lessonFlow.when["the student marks the lesson as listened"]({
      student,
      program,
      lesson,
    });

    await dsl.lessonFlow.then["the questions are shown and the lesson is marked as listened"]({
      student,
      program,
      lesson,
      question,
    });
  },
  "completed lesson reopens with completed status and visible questions": async (dsl: DSL) => {
    const { student, program, lesson, question } =
      await dsl.lessonFlow.given["a student who completed a lesson with a question"]();

    await dsl.lessonFlow.then["the completed lesson shows completed status and visible questions"]({
      student,
      program,
      lesson,
      question,
    });
  },
  "submitting lesson answers saves them and shows immediate feedback": async (dsl: DSL) => {
    const { student, program, lesson, question } =
      await dsl.lessonFlow.given["a student viewing a listened lesson with a question"]();

    await dsl.lessonFlow.when["the student submits the lesson answers"]({
      student,
      program,
      lesson,
      question,
    });

    await dsl.lessonFlow.then["the submitted answer is saved and immediate feedback is shown"]({
      student,
      program,
      lesson,
      question,
    });
  },
  "submitted lesson answers are shown and cannot be changed on reopen": async (dsl: DSL) => {
    const { student, program, lesson, question } =
      await dsl.lessonFlow.given["a student who completed a lesson with a question"]();

    await dsl.lessonFlow.then["the submitted answers are shown and cannot be changed"]({
      student,
      program,
      lesson,
      question,
    });
  },
  "student cannot resubmit a completed lesson": async (dsl: DSL) => {
    const { student, program, lesson } =
      await dsl.lessonFlow.given["a student who completed a lesson with a question"]();

    const result = await dsl.lessonFlow.when["the student posts answers for the lesson"]({
      student,
      program,
      lesson,
    });

    await dsl.lessonFlow.then["the lesson change is refused"](result);
  },
};
