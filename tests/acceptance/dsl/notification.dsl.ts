/* biome-ignore-all lint/suspicious/noThenProperty: <given-when-then> */
import type { NotificationDriver } from "../drivers/interface";
import type { AttendanceDSL } from "./attendance.dsl";
import type { AuthDSL } from "./auth.dsl";
import type { DiscussionDSL } from "./discussion.dsl";
import type { EnrollmentDSL } from "./enrollment.dsl";
import type { ProgramDSL } from "./program.dsl";
import type { Expect, Program, User } from "./types";

interface StudentProgramArgs {
  program: Program;
  student: User;
}

async function createProgramWithStudent(args: {
  authDSL: AuthDSL;
  enrollmentDSL: EnrollmentDSL;
  programDSL: ProgramDSL;
}) {
  const teacher = await args.authDSL.given["a registered user"]({
    role: "teacher",
  });
  const program = await args.programDSL.when["they create a program"](teacher);
  const course = await args.programDSL.when["they add a course to the program"]({
    teacher,
    program,
  });
  const lesson = await args.programDSL.when["teacher adds lesson to course"]({
    teacher,
    course,
  });
  const student = await args.authDSL.given["a registered user"]({
    role: "student",
  });
  await args.enrollmentDSL.when["student requests program enrollment"]({
    student,
    program,
  });
  await args.programDSL.when["teacher approves student's enrollment"]({
    teacher,
    student,
    program,
  });
  return { teacher, program, course, lesson, student };
}

export interface NotificationDSL {
  given: {
    "a student enabling notifications": () => Promise<{ student: User }>;
    "a subscribed student with a newly released lesson": () => Promise<StudentProgramArgs>;
    "a subscribed student with a released lesson still incomplete for twenty-four hours": () => Promise<StudentProgramArgs>;
    "a teacher with a newly submitted lesson question": () => Promise<{
      teacher: User;
    }>;
    "a teacher with a new attendance violation": () => Promise<{
      teacher: User;
    }>;
  };
  when: {
    "they subscribe to notifications": (args: { student: User }) => Promise<void>;
  };
  then: {
    "their notification subscription is saved": (args: { student: User }) => Promise<void>;
    "a new-lesson notification record exists": (args: StudentProgramArgs) => Promise<void>;
    "a missed-lesson reminder notification record exists": (
      args: StudentProgramArgs,
    ) => Promise<void>;
    "a question notification record exists": (args: { teacher: User }) => Promise<void>;
    "an attendance notification record exists": (args: { teacher: User }) => Promise<void>;
  };
}

export function createNotificationDSL(
  driver: NotificationDriver,
  authDSL: AuthDSL,
  discussionDSL: DiscussionDSL,
  attendanceDSL: AttendanceDSL,
  enrollmentDSL: EnrollmentDSL,
  programDSL: ProgramDSL,
  expect: Expect,
): NotificationDSL {
  async function createSubscribedStudent() {
    const args = await createProgramWithStudent({
      authDSL,
      enrollmentDSL,
      programDSL,
    });
    await driver.subscribe(args.student);
    return args;
  }

  return {
    given: {
      "a student enabling notifications": async () => {
        const student = await authDSL.given["a registered user"]({
          role: "student",
        });
        return { student };
      },
      "a subscribed student with a newly released lesson": async () => {
        const args = await createSubscribedStudent();
        await driver.openProgram(args.student, args.program.id);
        return args;
      },
      "a subscribed student with a released lesson still incomplete for twenty-four hours":
        async () => {
          const args = await createSubscribedStudent();
          await driver.setCurrentDate(args.student, { advanceByDays: 1 });
          await driver.openProgram(args.student, args.program.id);
          return args;
        },
      "a teacher with a newly submitted lesson question": async () => {
        const discussionArgs = await discussionDSL.given["a student has listened to a lesson"]();
        await discussionDSL.when["the student opens a discussion"](discussionArgs);
        return { teacher: discussionArgs.teacher };
      },
      "a teacher with a new attendance violation": async () => {
        const args =
          await attendanceDSL.given[
            "a student who exceeded the missed-lesson threshold before evaluation"
          ]();
        await attendanceDSL.when["they evaluate attendance"](args);
        return { teacher: args.teacher };
      },
    },
    when: {
      "they subscribe to notifications": async ({ student }) => {
        await driver.subscribe(student);
      },
    },
    then: {
      "their notification subscription is saved": async ({ student }) => {
        expect(await driver.seesSavedSubscription(student)).toBe(true);
      },
      "a new-lesson notification record exists": async ({ student }) => {
        expect(await driver.seesNotification(student, "lesson_release")).toBe(true);
      },
      "a missed-lesson reminder notification record exists": async ({ student }) => {
        expect(await driver.seesNotification(student, "lesson_reminder")).toBe(true);
      },
      "a question notification record exists": async ({ teacher }) => {
        expect(await driver.seesNotification(teacher, "discussion_question")).toBe(true);
      },
      "an attendance notification record exists": async ({ teacher }) => {
        expect(await driver.seesNotification(teacher, "attendance_violation")).toBe(true);
      },
    },
  };
}
