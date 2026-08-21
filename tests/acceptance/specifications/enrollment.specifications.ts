import type { Specification } from "./types";

export const enrollmentSpecs: Specification = {
  "student sees list of available programs": async (dsl) => {
    const { student, programs } = await dsl.enrollment.given["available programs"]();

    await dsl.enrollment.then["the student can see available programs"]({
      student,
      programs,
    });
  },

  "a student's program enrollment is initially in pending status": async (dsl) => {
    const { student, program } = await dsl.enrollment.given["a student and a program"]();

    await dsl.enrollment.when["student requests program enrollment"]({
      student,
      program,
    });

    await dsl.enrollment.then["student sees their enrollment status"]({
      student,
      program,
      status: "pending",
    });
  },

  "teacher sees a student's enrollment as pending on their program": async (dsl) => {
    const { student, program } = await dsl.enrollment.given["a student program enrollment"]();

    await dsl.program.then["teacher sees student enrollments in program"]({
      teacher: program.teacher,
      students: [student],
      program,
      status: "pending",
    });
  },

  "student can apply only once to the same program": async (dsl) => {
    const { student, program } =
      await dsl.enrollment.given["a student with a pending program application"]();

    await dsl.enrollment.then["the student cannot apply to that program again"]({
      student,
      program,
    });
  },

  "teacher sees student's details on program enrollment": async (dsl) => {
    const { student, program } = await dsl.enrollment.given["a student program enrollment"]();

    await dsl.program.then["teacher sees student's enrollment details"]({
      teacher: program.teacher,
      student,
      program,
    });
  },

  "teacher can approve a student's program enrollment": async (dsl) => {
    const { student, program } = await dsl.enrollment.given["a student program enrollment"]();

    await dsl.program.when["teacher approves student's enrollment"]({
      teacher: program.teacher,
      student,
      program,
    });

    await dsl.program.then["teacher sees student enrollments in program"]({
      teacher: program.teacher,
      students: [student],
      program,
      status: "approved",
    });
  },

  "teacher can view enrolled students": async (dsl) => {
    const { students, program } = await dsl.enrollment.given["approved program enrollments"](2);

    await dsl.program.then["teacher sees student enrollments in program"]({
      teacher: program.teacher,
      students,
      program,
      status: "approved",
    });
  },

  "student sees approved status after teacher approves program enrollment": async (dsl) => {
    const { student, program } = await dsl.enrollment.given["a student program enrollment"]();

    await dsl.program.when["teacher approves student's enrollment"]({
      teacher: program.teacher,
      student,
      program,
    });

    await dsl.enrollment.then["student sees their enrollment status"]({
      student,
      program,
      status: "approved",
    });
  },

  "approved program enrollment gets start date of approval": async (dsl) => {
    const { student, program } = await dsl.enrollment.given["a student program enrollment"]();

    await dsl.program.when["teacher approves student's enrollment"]({
      teacher: program.teacher,
      student,
      program,
    });

    // format: 2024-12-29
    const todayDate = new Date().toISOString().slice(0, 10);

    await dsl.program.then["teacher sees student's enrollment start date"]({
      teacher: program.teacher,
      student,
      program,
      start_date: todayDate,
    });
  },

  "teacher can reject a student's program enrollment": async (dsl) => {
    const { student, program } = await dsl.enrollment.given["a student program enrollment"]();

    await dsl.program.when["teacher rejects student's enrollment"]({
      teacher: program.teacher,
      student,
      program,
    });

    await dsl.program.then["teacher sees student enrollments in program"]({
      teacher: program.teacher,
      students: [student],
      program,
      status: "rejected",
    });
  },

  "student sees rejected status after teacher rejects program enrollment": async (dsl) => {
    const { student, program } = await dsl.enrollment.given["a student program enrollment"]();

    await dsl.program.when["teacher rejects student's enrollment"]({
      teacher: program.teacher,
      student,
      program,
    });

    await dsl.enrollment.then["student sees their enrollment status"]({
      student,
      program,
      status: "rejected",
    });
  },
};
