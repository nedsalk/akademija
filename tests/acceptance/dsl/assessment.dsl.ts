/** biome-ignore-all lint/suspicious/noThenProperty: <given-when-then> */
import type { AssessmentDriver } from "../drivers/interface";
import type { AuthDSL } from "./auth.dsl";
import type { EnrollmentDSL } from "./enrollment.dsl";
import type { LessonFlowDSL } from "./lesson-flow.dsl";
import type { ProgramDSL } from "./program.dsl";
import type { QuestionDSL } from "./question.dsl";
import type { Course, Expect, Program, Question, StudentProgramCourse, User } from "./types";

interface StudentAssessmentArgs extends StudentProgramCourse {
  questions: Question[];
  retryAvailableOn?: string;
}

interface WeeklyTestWithChosenQuestionsArgs extends StudentAssessmentArgs {
  expectedQuestions: Question[];
}

interface StudentAssessmentWithNextCourseArgs extends StudentAssessmentArgs {
  nextCourse: Course;
}

interface CrossProgramAssessmentArgs {
  assessmentCourse: Course;
  assessmentId: string;
  enrolledProgram: Program;
  student: User;
}

interface CrossCourseAssessmentPublicationArgs {
  course: Course;
  externalQuestion: Question;
  teacher: User;
}

interface AssessmentInteractionResult {
  status: number;
}

async function createCourseWithQuestions(args: {
  programDSL: ProgramDSL;
  questionDSL: QuestionDSL;
  lessonCount: number;
}) {
  const { teacher, course } = await args.programDSL.given["a program with a course"]();
  const program = course.program;
  const questions: Question[] = [];

  for (let index = 0; index < args.lessonCount; index++) {
    const lesson = await args.programDSL.when["teacher adds lesson to course"]({
      teacher,
      course,
    });
    const question = await args.questionDSL.when["they add a single-answer question with options"]({
      teacher,
      lesson,
      options: [
        { text: `Wrong ${index + 1}`, isCorrect: false },
        { text: `Correct ${index + 1}`, isCorrect: true },
      ],
    });
    questions.push(question);
  }

  return { teacher, program, course, questions };
}

async function createStudentInProgram(
  authDSL: AuthDSL,
  enrollmentDSL: EnrollmentDSL,
  programDSL: ProgramDSL,
  teacher: User,
  program: Program,
) {
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
  return student;
}

async function completeCourseLessons(args: {
  student: User;
  program: Program;
  questions: Question[];
  lessonFlowDSL: LessonFlowDSL;
  assessmentDriver: AssessmentDriver;
}) {
  for (const question of args.questions) {
    const lesson = question.lesson;
    if (!lesson) {
      continue;
    }

    await args.lessonFlowDSL.when["the student marks the lesson as listened"]({
      student: args.student,
      program: args.program,
      lesson,
    });
    await args.lessonFlowDSL.when["the student submits the lesson answers"]({
      student: args.student,
      program: args.program,
      lesson,
      question,
    });
  }

  const firstQuestion = args.questions[0];
  if (!firstQuestion?.lesson) {
    throw new Error("Course completion scenario requires a lesson question");
  }

  await args.assessmentDriver.openCourse(args.student, firstQuestion.lesson.course);
}

export interface AssessmentDSL {
  given: {
    "an enrolled student with seven released lessons and a published weekly test": () => Promise<StudentAssessmentArgs>;
    "an enrolled student before the weekly test window": () => Promise<StudentAssessmentArgs>;
    "an enrolled student after the weekly test window": () => Promise<StudentAssessmentArgs>;
    "a student viewing a weekly test published with chosen questions": () => Promise<WeeklyTestWithChosenQuestionsArgs>;
    "a student taking an available weekly test": () => Promise<StudentAssessmentArgs>;
    "a student who already submitted an available weekly test": () => Promise<StudentAssessmentArgs>;
    "a student who completed a course book with a published final test": () => Promise<StudentAssessmentArgs>;
    "a student taking an available final test": () => Promise<StudentAssessmentArgs>;
    "a student who passed an available final test": () => Promise<StudentAssessmentArgs>;
    "a student who failed the final test less than seven days ago": () => Promise<StudentAssessmentArgs>;
    "a student on a failed final test result less than seven days ago": () => Promise<StudentAssessmentArgs>;
    "a student who failed the final test seven days ago": () => Promise<StudentAssessmentArgs>;
    "a student who failed the final test in the current course while the next course exists": () => Promise<StudentAssessmentWithNextCourseArgs>;
    "a student enrolled in another program than the assessment course": () => Promise<CrossProgramAssessmentArgs>;
    "a teacher with a question from another course": () => Promise<CrossCourseAssessmentPublicationArgs>;
  };
  when: {
    "the student submits correct weekly test answers": (
      args: StudentAssessmentArgs,
    ) => Promise<void>;
    "the student submits answers below the passing threshold": (
      args: StudentAssessmentArgs,
    ) => Promise<void>;
    "the student submits answers at or above the passing threshold": (
      args: StudentAssessmentArgs,
    ) => Promise<void>;
    "the student submits the same assessment again": (
      args: StudentAssessmentArgs,
    ) => Promise<AssessmentInteractionResult>;
    "the student opens that assessment from their enrolled program": (
      args: CrossProgramAssessmentArgs,
    ) => Promise<AssessmentInteractionResult>;
    "the teacher publishes an assessment with another course's question": (
      args: CrossCourseAssessmentPublicationArgs,
    ) => Promise<AssessmentInteractionResult>;
    "the student opens the course": (args: StudentAssessmentArgs) => Promise<void>;
  };
  then: {
    "the weekly test is available": (args: StudentAssessmentArgs) => Promise<void>;
    "the weekly test is unavailable": (args: StudentAssessmentArgs) => Promise<void>;
    "the weekly test uses chosen questions": (
      args: WeeklyTestWithChosenQuestionsArgs,
    ) => Promise<void>;
    "their weekly test score is saved": (args: StudentAssessmentArgs) => Promise<void>;
    "the final test is available": (args: StudentAssessmentArgs) => Promise<void>;
    "the final test is marked failed": (args: StudentAssessmentArgs) => Promise<void>;
    "the final test is marked passed": (args: StudentAssessmentArgs) => Promise<void>;
    "the final test retry is unavailable": (args: StudentAssessmentArgs) => Promise<void>;
    "the final test retry is available": (args: StudentAssessmentArgs) => Promise<void>;
    "the assessment is unavailable": (args: AssessmentInteractionResult) => Promise<void>;
    "the assessment submission is refused": (args: AssessmentInteractionResult) => Promise<void>;
    "the assessment is not published": (args: AssessmentInteractionResult) => Promise<void>;
    "the next course can still be opened": (
      args: StudentAssessmentWithNextCourseArgs,
    ) => Promise<void>;
  };
}

export function createAssessmentDSL(
  driver: AssessmentDriver,
  authDSL: AuthDSL,
  enrollmentDSL: EnrollmentDSL,
  lessonFlowDSL: LessonFlowDSL,
  programDSL: ProgramDSL,
  questionDSL: QuestionDSL,
  expect: Expect,
): AssessmentDSL {
  async function createAvailableFinalTest(options?: {
    currentDate?: string;
  }): Promise<StudentAssessmentArgs> {
    const args = await createCourseWithQuestions({
      lessonCount: 2,
      programDSL,
      questionDSL,
    });
    const student = await createStudentInProgram(
      authDSL,
      enrollmentDSL,
      programDSL,
      args.teacher,
      args.program,
    );
    if (options?.currentDate) {
      await driver.setCurrentDate(student, { isoDate: options.currentDate });
    }
    await completeCourseLessons({
      student,
      program: args.program,
      questions: args.questions,
      lessonFlowDSL,
      assessmentDriver: driver,
    });
    await driver.publishFinalTest({
      teacher: args.teacher,
      course: args.course,
      passingThresholdPercent: 70,
    });
    await driver.openCourse(student, args.course);
    await driver.openAssessment(student, "Final Test");
    return {
      student,
      program: args.program,
      course: args.course,
      questions: args.questions,
    };
  }

  return {
    given: {
      "an enrolled student with seven released lessons and a published weekly test": async () => {
        const { teacher, program, course, questions } = await createCourseWithQuestions({
          lessonCount: 7,
          programDSL,
          questionDSL,
        });
        const student = await createStudentInProgram(
          authDSL,
          enrollmentDSL,
          programDSL,
          teacher,
          program,
        );
        await driver.publishWeeklyTest({ teacher, course });
        await driver.openCourse(student, course);
        return { student, program, course, questions };
      },
      "an enrolled student before the weekly test window": async () => {
        const args = await createCourseWithQuestions({
          lessonCount: 7,
          programDSL,
          questionDSL,
        });
        const student = await createStudentInProgram(
          authDSL,
          enrollmentDSL,
          programDSL,
          args.teacher,
          args.program,
        );
        await driver.publishWeeklyTest({
          teacher: args.teacher,
          course: args.course,
          opensOn: "2026-05-20",
          closesOn: "2026-05-27",
        });
        await driver.setCurrentDate(student, { isoDate: "2026-05-19" });
        await driver.openCourse(student, args.course);
        return {
          student,
          program: args.program,
          course: args.course,
          questions: args.questions,
        };
      },
      "an enrolled student after the weekly test window": async () => {
        const args = await createCourseWithQuestions({
          lessonCount: 7,
          programDSL,
          questionDSL,
        });
        const student = await createStudentInProgram(
          authDSL,
          enrollmentDSL,
          programDSL,
          args.teacher,
          args.program,
        );
        await driver.publishWeeklyTest({
          teacher: args.teacher,
          course: args.course,
          opensOn: "2026-05-01",
          closesOn: "2026-05-05",
        });
        await driver.setCurrentDate(student, { isoDate: "2026-05-10" });
        await driver.openCourse(student, args.course);
        return {
          student,
          program: args.program,
          course: args.course,
          questions: args.questions,
        };
      },
      "a student viewing a weekly test published with chosen questions": async () => {
        const args = await createCourseWithQuestions({
          lessonCount: 7,
          programDSL,
          questionDSL,
        });
        const student = await createStudentInProgram(
          authDSL,
          enrollmentDSL,
          programDSL,
          args.teacher,
          args.program,
        );
        const firstExpectedQuestion = args.questions[1];
        const secondExpectedQuestion = args.questions[3];
        if (!firstExpectedQuestion || !secondExpectedQuestion) {
          throw new Error("Chosen-question scenario requires four questions");
        }
        const expectedQuestions = [firstExpectedQuestion, secondExpectedQuestion];
        await driver.publishWeeklyTest({
          teacher: args.teacher,
          course: args.course,
          questionTexts: expectedQuestions.map((question) => question.text),
        });
        await driver.openCourse(student, args.course);
        await driver.openAssessment(student, "Weekly Test 1");
        return {
          student,
          program: args.program,
          course: args.course,
          questions: args.questions,
          expectedQuestions,
        };
      },
      "a student taking an available weekly test": async () => {
        const args = await createCourseWithQuestions({
          lessonCount: 7,
          programDSL,
          questionDSL,
        });
        const student = await createStudentInProgram(
          authDSL,
          enrollmentDSL,
          programDSL,
          args.teacher,
          args.program,
        );
        await driver.publishWeeklyTest({
          teacher: args.teacher,
          course: args.course,
        });
        await driver.openCourse(student, args.course);
        await driver.openAssessment(student, "Weekly Test 1");
        return {
          student,
          program: args.program,
          course: args.course,
          questions: args.questions,
        };
      },
      "a student who already submitted an available weekly test": async () => {
        const args = await createCourseWithQuestions({
          lessonCount: 7,
          programDSL,
          questionDSL,
        });
        const student = await createStudentInProgram(
          authDSL,
          enrollmentDSL,
          programDSL,
          args.teacher,
          args.program,
        );
        await driver.publishWeeklyTest({
          teacher: args.teacher,
          course: args.course,
        });
        await driver.openCourse(student, args.course);
        await driver.openAssessment(student, "Weekly Test 1");
        await driver.submitAssessmentAnswers(student, args.questions, "correct");
        return {
          student,
          program: args.program,
          course: args.course,
          questions: args.questions,
        };
      },
      "a student who completed a course book with a published final test": async () => {
        const args = await createCourseWithQuestions({
          lessonCount: 2,
          programDSL,
          questionDSL,
        });
        const student = await createStudentInProgram(
          authDSL,
          enrollmentDSL,
          programDSL,
          args.teacher,
          args.program,
        );
        await completeCourseLessons({
          student,
          program: args.program,
          questions: args.questions,
          lessonFlowDSL,
          assessmentDriver: driver,
        });
        await driver.publishFinalTest({
          teacher: args.teacher,
          course: args.course,
        });
        await driver.openCourse(student, args.course);
        return {
          student,
          program: args.program,
          course: args.course,
          questions: args.questions,
        };
      },
      "a student taking an available final test": async () => {
        return createAvailableFinalTest();
      },
      "a student who passed an available final test": async () => {
        const args = await createAvailableFinalTest();
        await driver.submitAssessmentAnswers(args.student, args.questions, "correct");
        return args;
      },
      "a student who failed the final test less than seven days ago": async () => {
        const args = await createAvailableFinalTest({
          currentDate: "2026-05-12",
        });
        const retryAvailableOn = "2026-05-19";
        await driver.submitAssessmentAnswers(args.student, args.questions, "incorrect");
        await driver.openCourse(args.student, args.course);
        return { ...args, retryAvailableOn };
      },
      "a student on a failed final test result less than seven days ago": async () => {
        const args = await createAvailableFinalTest({
          currentDate: "2026-05-12",
        });
        await driver.submitAssessmentAnswers(args.student, args.questions, "incorrect");
        return { ...args, retryAvailableOn: "2026-05-19" };
      },
      "a student who failed the final test seven days ago": async () => {
        const args = await createAvailableFinalTest({
          currentDate: "2026-05-12",
        });
        await driver.submitAssessmentAnswers(args.student, args.questions, "incorrect");
        await driver.setCurrentDate(args.student, { advanceByDays: 7 });
        await driver.openCourse(args.student, args.course);
        return args;
      },
      "a student who failed the final test in the current course while the next course exists":
        async () => {
          const args = await createCourseWithQuestions({
            lessonCount: 2,
            programDSL,
            questionDSL,
          });
          const nextCourse = await programDSL.when["they add a course to the program"]({
            teacher: args.teacher,
            program: args.program,
          });
          const student = await createStudentInProgram(
            authDSL,
            enrollmentDSL,
            programDSL,
            args.teacher,
            args.program,
          );
          await completeCourseLessons({
            student,
            program: args.program,
            questions: args.questions,
            lessonFlowDSL,
            assessmentDriver: driver,
          });
          await driver.publishFinalTest({
            teacher: args.teacher,
            course: args.course,
            passingThresholdPercent: 70,
          });
          await driver.openCourse(student, args.course);
          await driver.openAssessment(student, "Final Test");
          await driver.submitAssessmentAnswers(student, args.questions, "incorrect");
          await driver.openProgram(student, args.program);
          return {
            student,
            program: args.program,
            course: args.course,
            questions: args.questions,
            nextCourse,
          };
        },
      "a student enrolled in another program than the assessment course": async () => {
        const teacher = await authDSL.given["a registered user"]({
          role: "teacher",
        });
        const enrolledProgram = await programDSL.when["they create a program"](teacher);
        const assessmentProgram = await programDSL.when["they create a program"](teacher);
        const assessmentCourse = await programDSL.when["they add a course to the program"]({
          teacher,
          program: assessmentProgram,
        });
        const lesson = await programDSL.when["teacher adds lesson to course"]({
          teacher,
          course: assessmentCourse,
        });
        await questionDSL.when["they add a single-answer question"]({
          teacher,
          lesson,
        });
        const student = await createStudentInProgram(
          authDSL,
          enrollmentDSL,
          programDSL,
          teacher,
          enrolledProgram,
        );
        const assessmentStudent = await createStudentInProgram(
          authDSL,
          enrollmentDSL,
          programDSL,
          teacher,
          assessmentProgram,
        );
        await driver.publishWeeklyTest({
          teacher,
          course: assessmentCourse,
        });
        const assessmentId = await driver.getAssessmentId(
          assessmentStudent,
          assessmentCourse,
          "Weekly Test 1",
        );

        return {
          assessmentCourse,
          assessmentId,
          enrolledProgram,
          student,
        };
      },
      "a teacher with a question from another course": async () => {
        const teacher = await authDSL.given["a registered user"]({
          role: "teacher",
        });
        const program = await programDSL.when["they create a program"](teacher);
        const course = await programDSL.when["they add a course to the program"]({
          teacher,
          program,
        });
        const otherCourse = await programDSL.when["they add a course to the program"]({
          teacher,
          program,
        });
        const lesson = await programDSL.when["teacher adds lesson to course"]({
          teacher,
          course,
        });
        const otherLesson = await programDSL.when["teacher adds lesson to course"]({
          teacher,
          course: otherCourse,
        });
        await questionDSL.when["they add a single-answer question"]({
          teacher,
          lesson,
        });
        const externalQuestion = await questionDSL.when["they add a single-answer question"]({
          teacher,
          lesson: otherLesson,
        });

        return { course, externalQuestion, teacher };
      },
    },
    when: {
      "the student submits correct weekly test answers": async ({ student, questions }) => {
        await driver.submitAssessmentAnswers(student, questions, "correct");
      },
      "the student submits answers below the passing threshold": async ({ student, questions }) => {
        await driver.submitAssessmentAnswers(student, questions, "incorrect");
      },
      "the student submits answers at or above the passing threshold": async ({
        student,
        questions,
      }) => {
        await driver.submitAssessmentAnswers(student, questions, "correct");
      },
      "the student submits the same assessment again": async ({ student }) => {
        return { status: await driver.postCurrentAssessment(student) };
      },
      "the student opens that assessment from their enrolled program": async ({
        student,
        enrolledProgram,
        assessmentCourse,
        assessmentId,
      }) => {
        return {
          status: await driver.openAssessmentByRoute({
            student,
            program: enrolledProgram,
            course: assessmentCourse,
            assessmentId,
          }),
        };
      },
      "the teacher publishes an assessment with another course's question": async ({
        teacher,
        course,
        externalQuestion,
      }) => {
        return {
          status: await driver.publishWeeklyTestWithQuestionIds({
            teacher,
            course,
            questionIds: [externalQuestion.id],
          }),
        };
      },
      "the student opens the course": async ({ student, course }) => {
        await driver.openCourse(student, course);
      },
    },
    then: {
      "the weekly test is available": async ({ student }) => {
        expect(await driver.seesAssessmentAvailable(student, "Weekly Test 1")).toBe(true);
      },
      "the weekly test is unavailable": async ({ student }) => {
        expect(await driver.seesAssessmentUnavailable(student, "Weekly Test 1")).toBe(true);
      },
      "the weekly test uses chosen questions": async ({ student, expectedQuestions }) => {
        expect(await driver.seesAssessmentQuestions(student, expectedQuestions)).toBe(true);
      },
      "their weekly test score is saved": async ({ student }) => {
        expect(await driver.seesAssessmentScore(student, 100)).toBe(true);
      },
      "the final test is available": async ({ student }) => {
        expect(await driver.seesAssessmentAvailable(student, "Final Test")).toBe(true);
      },
      "the final test is marked failed": async ({ student }) => {
        expect(await driver.seesAssessmentStatus(student, "failed")).toBe(true);
      },
      "the final test is marked passed": async ({ student }) => {
        expect(await driver.seesAssessmentStatus(student, "passed")).toBe(true);
      },
      "the final test retry is unavailable": async ({ student, retryAvailableOn }) => {
        expect(
          retryAvailableOn ? await driver.seesRetryAvailableOn(student, retryAvailableOn) : false,
        ).toBe(true);
      },
      "the final test retry is available": async ({ student }) => {
        expect(await driver.seesAssessmentAvailable(student, "Final Test")).toBe(true);
      },
      "the assessment is unavailable": async ({ status }) => {
        expect(status).toBe(404);
      },
      "the assessment submission is refused": async ({ status }) => {
        expect(status).toBe(404);
      },
      "the assessment is not published": async ({ status }) => {
        expect(status).toBe(400);
      },
      "the next course can still be opened": async ({ student, nextCourse }) => {
        expect(await driver.seesCourseLink(student, nextCourse)).toBe(true);
      },
    },
  };
}
