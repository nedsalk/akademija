/** biome-ignore-all lint/suspicious/noThenProperty: <given-when-then> */
import type { AttendanceDriver } from "../drivers/interface";
import type { AuthDSL } from "./auth.dsl";
import type { EnrollmentDSL } from "./enrollment.dsl";
import type { LessonFlowDSL } from "./lesson-flow.dsl";
import type { ProgramDSL } from "./program.dsl";
import type { Course, Expect, Program, User } from "./types";

interface TeacherCourseStudentArgs {
  course: Course;
  program: Program;
  student: User;
  teacher: User;
}

interface AttendanceRuleResult {
  status: number;
}

interface CrossCourseAttendanceViolationArgs {
  ownedCourse: Course;
  ownedTeacher: User;
  violationCourse: Course;
  violationId: string;
  violationStudent: User;
  violationTeacher: User;
}

interface CrossCourseAttendanceViolationResult extends CrossCourseAttendanceViolationArgs {
  status: number;
}

export interface AttendanceDSL {
  given: {
    "a teacher configuring attendance for a course": () => Promise<{
      course: Course;
      teacher: User;
    }>;
    "a student below the missed-lesson threshold": () => Promise<TeacherCourseStudentArgs>;
    "a student who completed the current lesson after prior misses": () => Promise<TeacherCourseStudentArgs>;
    "a student who exceeded the missed-lesson threshold": () => Promise<TeacherCourseStudentArgs>;
    "a student who exceeded the missed-lesson threshold before evaluation": () => Promise<TeacherCourseStudentArgs>;
    "a teacher with an unacknowledged attendance violation": () => Promise<TeacherCourseStudentArgs>;
    "a teacher with another course's attendance violation id": () => Promise<CrossCourseAttendanceViolationArgs>;
  };
  when: {
    "they set the maximum consecutive missed lessons": (args: {
      course: Course;
      teacher: User;
    }) => Promise<void>;
    "they acknowledge the violation": (args: TeacherCourseStudentArgs) => Promise<void>;
    "they evaluate attendance": (args: TeacherCourseStudentArgs) => Promise<void>;
    "they save an invalid attendance rule": (args: {
      course: Course;
      teacher: User;
    }) => Promise<AttendanceRuleResult>;
    "they acknowledge the other course's violation": (
      args: CrossCourseAttendanceViolationArgs,
    ) => Promise<CrossCourseAttendanceViolationResult>;
  };
  then: {
    "the new rule is saved": (args: { course: Course; teacher: User }) => Promise<void>;
    "no attendance violation exists": (args: TeacherCourseStudentArgs) => Promise<void>;
    "an attendance violation exists": (args: TeacherCourseStudentArgs) => Promise<void>;
    "the violation is marked acknowledged": (args: TeacherCourseStudentArgs) => Promise<void>;
    "the invalid attendance rule is refused": (args: AttendanceRuleResult) => Promise<void>;
    "the other course violation remains open": (
      args: CrossCourseAttendanceViolationResult,
    ) => Promise<void>;
  };
}

export function createAttendanceDSL(
  driver: AttendanceDriver,
  authDSL: AuthDSL,
  enrollmentDSL: EnrollmentDSL,
  lessonFlowDSL: LessonFlowDSL,
  programDSL: ProgramDSL,
  expect: Expect,
): AttendanceDSL {
  async function createCourseWithStudent() {
    const teacher = await authDSL.given["a registered user"]({
      role: "teacher",
    });
    const program = await programDSL.when["they create a program"](teacher);
    const course = await programDSL.when["they add a course to the program"]({
      teacher,
      program,
    });
    const lesson = await programDSL.when["teacher adds lesson to course"]({
      teacher,
      course,
    });
    const student = await authDSL.given["a registered user"]({
      role: "student",
    });
    await enrollmentDSL.when["student requests program enrollment"]({
      student,
      program,
    });
    await programDSL.when["teacher approves student's enrollment"]({
      teacher,
      student,
      program,
    });
    return { teacher, program, course, student, lesson };
  }

  async function createExceededThresholdScenario(): Promise<TeacherCourseStudentArgs> {
    const args = await createCourseWithStudent();
    await driver.saveRule(args.teacher, args.course, 1);
    await driver.setCurrentDate(args.teacher, { advanceByDays: 2 });
    await driver.openCourse(args.teacher, args.course);
    return args;
  }

  async function createEvaluatedExceededThresholdScenario(): Promise<TeacherCourseStudentArgs> {
    const args = await createExceededThresholdScenario();
    await driver.evaluateAttendance(args.teacher, args.course);
    return args;
  }

  return {
    given: {
      "a teacher configuring attendance for a course": async () => {
        const { teacher, course } = await createCourseWithStudent();
        return { teacher, course };
      },
      "a student below the missed-lesson threshold": async () => {
        const args = await createCourseWithStudent();
        await driver.saveRule(args.teacher, args.course, 2);
        await driver.setCurrentDate(args.teacher, { advanceByDays: 1 });
        await driver.openCourse(args.teacher, args.course);
        return args;
      },
      "a student who completed the current lesson after prior misses": async () => {
        const args = await createCourseWithStudent();
        await driver.saveRule(args.teacher, args.course, 0);
        await driver.setCurrentDate(args.teacher, { advanceByDays: 1 });
        await lessonFlowDSL.when["the student completes the lesson"](args);
        await driver.openCourse(args.teacher, args.course);
        return args;
      },
      "a student who exceeded the missed-lesson threshold": async () => {
        return createEvaluatedExceededThresholdScenario();
      },
      "a student who exceeded the missed-lesson threshold before evaluation": async () => {
        return createExceededThresholdScenario();
      },
      "a teacher with an unacknowledged attendance violation": async () => {
        return createEvaluatedExceededThresholdScenario();
      },
      "a teacher with another course's attendance violation id": async () => {
        const owned = await createCourseWithStudent();
        const violation = await createEvaluatedExceededThresholdScenario();
        const violationId = await driver.getViolationId(
          violation.teacher,
          violation.course,
          violation.student.name,
        );

        return {
          ownedCourse: owned.course,
          ownedTeacher: owned.teacher,
          violationCourse: violation.course,
          violationId,
          violationStudent: violation.student,
          violationTeacher: violation.teacher,
        };
      },
    },
    when: {
      "they set the maximum consecutive missed lessons": async ({ teacher, course }) => {
        await driver.saveRule(teacher, course, 2);
      },
      "they acknowledge the violation": async (args) => {
        await driver.acknowledgeViolation(args.teacher, args.student.name);
      },
      "they evaluate attendance": async (args) => {
        await driver.evaluateAttendance(args.teacher, args.course);
      },
      "they save an invalid attendance rule": async ({ teacher, course }) => {
        return {
          status: await driver.postRule(teacher, course, "-1"),
        };
      },
      "they acknowledge the other course's violation": async (args) => {
        return {
          ...args,
          status: await driver.postAcknowledgement({
            teacher: args.ownedTeacher,
            course: args.ownedCourse,
            violationId: args.violationId,
          }),
        };
      },
    },
    then: {
      "the new rule is saved": async ({ teacher }) => {
        expect(await driver.seesRuleSaved(teacher, 2)).toBe(true);
      },
      "no attendance violation exists": async ({ teacher }) => {
        expect(await driver.seesNoViolations(teacher)).toBe(true);
      },
      "an attendance violation exists": async ({ teacher, student }) => {
        expect(await driver.seesViolation(teacher, student.name, 2, "open")).toBe(true);
      },
      "the violation is marked acknowledged": async ({ teacher, student }) => {
        expect(await driver.seesViolation(teacher, student.name, 2, "acknowledged")).toBe(true);
      },
      "the invalid attendance rule is refused": async ({ status }) => {
        expect(status).toBe(400);
      },
      "the other course violation remains open": async (args) => {
        expect(args.status).toBe(404);
        await driver.openCourse(args.violationTeacher, args.violationCourse);
        expect(
          await driver.seesViolation(args.violationTeacher, args.violationStudent.name, 2, "open"),
        ).toBe(true);
      },
    },
  };
}
