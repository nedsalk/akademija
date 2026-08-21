import type { DSL } from "../dsl";
import type { Specification } from "./types";

export const programSpecs: Specification = {
  "teacher can create a program and see it": async (dsl: DSL) => {
    const teacher = await dsl.auth.given["a registered user"]({
      role: "teacher",
    });
    const program = await dsl.program.when["they create a program"](teacher);
    await dsl.program.then["they can see that program"]({
      teacher,
      program,
    });
  },

  "given a program, its teacher can see its details": async (dsl: DSL) => {
    const program = await dsl.program.given["a program"]();
    await dsl.program.then["teacher can see program details"]({
      teacher: program.teacher,
      program,
    });
  },

  "teacher can add course to program": async (dsl: DSL) => {
    const program = await dsl.program.given["a program"]();
    const course = await dsl.program.when["they add a course to the program"]({
      teacher: program.teacher,
      program,
    });
    await dsl.program.then["they can see that course in the program"]({
      teacher: program.teacher,
      program,
      course,
    });
  },

  "teacher can add textbook to course": async (dsl: DSL) => {
    const { teacher, course } = await dsl.program.given["a course"]();
    const textbook = await dsl.program.when["teacher adds a textbook to the course"]({
      teacher,
      course,
    });
    await dsl.program.then["the textbook is assigned to the course"]({
      teacher,
      course,
      textbook,
    });
  },

  "teacher can edit program name": async (dsl: DSL) => {
    const program = await dsl.program.given["a program"]();
    const new_name = await dsl.program.when["teacher edits program name"]({
      teacher: program.teacher,
      program,
    });
    await dsl.program.then["teacher sees updated name"]({
      teacher: program.teacher,
      program,
      new_name,
    });
  },

  "teacher can add lesson to course": async (dsl: DSL) => {
    const { teacher, course } = await dsl.program.given["a course"]();
    const lesson = await dsl.program.when["teacher adds lesson to course"]({
      teacher,
      course,
    });
    await dsl.program.then["they can see the lesson"]({ teacher, lesson });
  },

  "teacher can reorder lessons": async (dsl: DSL) => {
    const { teacher, course, lessons } =
      await dsl.program.given["a course with multiple lessons"]();
    const reorderedLessons = await dsl.program.when["teacher reorders lessons"]({
      teacher,
      course,
      lessons,
    });
    await dsl.program.then["the new lesson order is saved"]({
      teacher,
      course,
      lessons: reorderedLessons,
    });
  },

  "teacher can remove lesson": async (dsl: DSL) => {
    const { teacher, lesson } = await dsl.program.given["a course with a lesson"]();
    await dsl.program.when["teacher removes the lesson"]({ teacher, lesson });
    await dsl.program.then["the lesson is removed"]({ teacher, lesson });
  },

  "teacher can rename lesson": async (dsl: DSL) => {
    const { teacher, lesson } = await dsl.program.given["a course with a lesson"]();
    const new_name = await dsl.program.when["teacher renames the lesson"]({
      teacher,
      lesson,
    });
    await dsl.program.then["the lesson is renamed"]({
      teacher,
      lesson,
      new_name,
    });
  },

  "teacher can remove a course (from their program)": async (dsl: DSL) => {
    const { teacher, course } = await dsl.program.given["a course"]();
    await dsl.program.when["they remove the course"]({ teacher, course });
    await dsl.program.then["the course is removed"]({ teacher, course });
  },
};
