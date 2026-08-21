/** biome-ignore-all lint/suspicious/noThenProperty: <given-when-then> */
import type { EnrollmentDriver } from "../drivers/interface";
import type { AuthDSL } from "./auth.dsl";
import type { ProgramDSL } from "./program.dsl";
import type { EnrollmentRequestStatus, Expect, Program, StudentProgram, User } from "./types";

interface StudentsProgramArgs {
  students: User[];
  program: Program;
}

export interface EnrollmentDSL {
  given: {
    "a student and a program": () => Promise<StudentProgram>;
    "a student program enrollment": () => Promise<StudentProgram>;
    "approved program enrollments": (count: number) => Promise<StudentsProgramArgs>;
    "available programs": () => Promise<{
      student: User;
      programs: Program[];
    }>;
    "a student with a pending program application": () => Promise<StudentProgram>;
  };
  when: {
    "student requests program enrollment": (args: StudentProgram) => Promise<void>;
  };
  then: {
    "student sees their enrollment status": (
      args: StudentProgram & {
        status: EnrollmentRequestStatus;
      },
    ) => Promise<void>;
    "the student can see available programs": (args: {
      student: User;
      programs: Program[];
    }) => Promise<void>;
    "the student cannot apply to that program again": (args: StudentProgram) => Promise<void>;
  };
}

export function createEnrollmentDSL(
  driver: EnrollmentDriver,
  authDSL: AuthDSL,
  programDSL: ProgramDSL,
  expect: Expect,
): EnrollmentDSL {
  return {
    given: {
      "a student and a program": async () => {
        const teacher = await authDSL.given["a registered user"]({
          role: "teacher",
        });
        const program = await programDSL.when["they create a program"](teacher);
        const student = await authDSL.given["a registered user"]({
          role: "student",
        });

        return { student, program };
      },
      "a student program enrollment": async () => {
        const teacher = await authDSL.given["a registered user"]({
          role: "teacher",
        });
        const program = await programDSL.when["they create a program"](teacher);
        const student = await authDSL.given["a registered user"]({
          role: "student",
        });

        await driver.requestEnrollment(student, program);

        return { student, program };
      },
      "approved program enrollments": async (count) => {
        const teacher = await authDSL.given["a registered user"]({
          role: "teacher",
        });
        const program = await programDSL.when["they create a program"](teacher);
        const students = await Promise.all(
          Array.from({ length: count }, () =>
            authDSL.given["a registered user"]({ role: "student" }),
          ),
        );

        await driver.requestEnrollments(students, program);

        for (const student of students) {
          await programDSL.when["teacher approves student's enrollment"]({
            student,
            program,
            teacher,
          });
        }

        return { students, program };
      },
      "available programs": async () => {
        const firstTeacher = await authDSL.given["a registered user"]({
          role: "teacher",
        });
        const secondTeacher = await authDSL.given["a registered user"]({
          role: "teacher",
        });
        const firstProgram = await programDSL.when["they create a program"](firstTeacher);
        const secondProgram = await programDSL.when["they create a program"](secondTeacher);
        const student = await authDSL.given["a registered user"]({
          role: "student",
        });

        return { student, programs: [firstProgram, secondProgram] };
      },
      "a student with a pending program application": async () => {
        const teacher = await authDSL.given["a registered user"]({
          role: "teacher",
        });
        const program = await programDSL.when["they create a program"](teacher);
        const student = await authDSL.given["a registered user"]({
          role: "student",
        });

        await driver.requestEnrollment(student, program);

        return { student, program };
      },
    },
    when: {
      "student requests program enrollment": async ({ student, program }) => {
        await driver.requestEnrollment(student, program);
      },
    },
    then: {
      "student sees their enrollment status": async ({ student, program, status }) => {
        const actualStatus = await driver.getEnrollmentStatus(student, program);
        expect(actualStatus).toBe(status);
      },
      "the student can see available programs": async ({ student, programs }) => {
        const visiblePrograms = await driver.getVisibleProgramNames(student);

        for (const program of programs) {
          expect(visiblePrograms.includes(program.name)).toBe(true);
        }
      },
      "the student cannot apply to that program again": async ({ student, program }) => {
        const actualStatus = await driver.getEnrollmentStatus(student, program);
        const canRequestEnrollment = await driver.canRequestEnrollment(student, program);

        expect(actualStatus).toBe("pending");
        expect(canRequestEnrollment).toBe(false);
      },
    },
  };
}
