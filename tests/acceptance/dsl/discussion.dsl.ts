/** biome-ignore-all lint/suspicious/noThenProperty: <given-when-then> */
import type { DiscussionDriver } from "../drivers/interface";
import type { AuthDSL } from "./auth.dsl";
import type { EnrollmentDSL } from "./enrollment.dsl";
import type { LessonFlowDSL } from "./lesson-flow.dsl";
import type { ProgramDSL } from "./program.dsl";
import type { QuestionDSL } from "./question.dsl";
import type { Expect, Lesson, Program, User } from "./types";

interface StudentLessonArgs {
  lesson: Lesson;
  program: Program;
  student: User;
}

interface StudentLessonQuestionArgs extends StudentLessonArgs {
  questionBody: string;
}

interface TeacherStudentLessonArgs extends StudentLessonQuestionArgs {
  teacher: User;
}

interface TeacherLessonReplyArgs extends TeacherStudentLessonArgs {
  teacherReplyBody: string;
}

interface StudentPairLessonArgs extends TeacherStudentLessonArgs {
  otherStudent: User;
}

interface ApprovedLessonQuestionArgs extends TeacherStudentLessonArgs {}

interface ApprovedLessonReplyArgs extends ApprovedLessonQuestionArgs {
  replyBody: string;
}

interface DiscussionPostResult {
  status: number;
}

interface CrossLessonReplyArgs extends ApprovedLessonQuestionArgs {
  otherLesson: Lesson;
  parentDiscussionId: string;
  replyBody: string;
}

interface CrossLessonReplyResult extends CrossLessonReplyArgs {
  status: number;
}

interface CrossLessonModerationArgs extends TeacherStudentLessonArgs {
  discussionId: string;
  otherLesson: Lesson;
}

interface CrossLessonModerationResult extends CrossLessonModerationArgs {
  status: number;
}

async function createListenedLesson(args: {
  authDSL: AuthDSL;
  enrollmentDSL: EnrollmentDSL;
  lessonFlowDSL: LessonFlowDSL;
  programDSL: ProgramDSL;
  questionDSL: QuestionDSL;
}) {
  const { teacher, lesson } = await args.programDSL.given["a course with a lesson"]();
  const program = lesson.course.program;
  const question = await args.questionDSL.when["they add a single-answer question"]({
    teacher,
    lesson,
  });
  await args.programDSL.when["teacher sets the lesson video"]({
    teacher,
    lesson,
    videoUrl: "https://www.youtube.com/watch?v=dQw4w9WgXcQ",
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
  await args.lessonFlowDSL.when["the student marks the lesson as listened"]({
    student,
    program,
    lesson,
  });

  return {
    teacher,
    student,
    program,
    lesson,
    lessonQuestion: question,
  };
}

export interface DiscussionDSL {
  given: {
    "a student has listened to a lesson": () => Promise<TeacherStudentLessonArgs>;
    "a student opened a discussion": () => Promise<TeacherLessonReplyArgs>;
    "a teacher with a pending lesson question": () => Promise<TeacherStudentLessonArgs>;
    "a student viewing a lesson with another student's pending discussion": () => Promise<StudentPairLessonArgs>;
    "a student viewing an approved lesson question": () => Promise<ApprovedLessonQuestionArgs>;
    "a teacher with a pending lesson reply": () => Promise<ApprovedLessonReplyArgs>;
    "a teacher with an approved lesson question": () => Promise<ApprovedLessonQuestionArgs>;
    "a student who has not listened to a lesson": () => Promise<TeacherStudentLessonArgs>;
    "a student enrolled in a different program than the lesson": () => Promise<TeacherStudentLessonArgs>;
    "a student with an approved discussion and another listened lesson": () => Promise<CrossLessonReplyArgs>;
    "a teacher with a pending discussion and another owned lesson": () => Promise<CrossLessonModerationArgs>;
  };
  when: {
    "the student opens a discussion": (args: StudentLessonQuestionArgs) => Promise<void>;
    "the teacher approves the question": (args: TeacherStudentLessonArgs) => Promise<void>;
    "the student submits a reply": (args: ApprovedLessonReplyArgs) => Promise<void>;
    "the teacher approves the reply": (args: ApprovedLessonReplyArgs) => Promise<void>;
    "the teacher replies to that discussion after approving it": (
      args: TeacherLessonReplyArgs,
    ) => Promise<void>;
    "the teacher replies to that discussion before approving it": (
      args: TeacherLessonReplyArgs,
    ) => Promise<void>;
    "the student asks the lesson question": (
      args: TeacherStudentLessonArgs,
    ) => Promise<DiscussionPostResult>;
    "the student replies to that discussion from the other lesson": (
      args: CrossLessonReplyArgs,
    ) => Promise<CrossLessonReplyResult>;
    "the teacher approves that discussion from the other lesson": (
      args: CrossLessonModerationArgs,
    ) => Promise<CrossLessonModerationResult>;
  };
  then: {
    "the teacher sees it as pending their approval": (
      args: TeacherStudentLessonArgs,
    ) => Promise<void>;
    "the student can see their discussion pending teacher approval": (
      args: StudentLessonQuestionArgs,
    ) => Promise<void>;
    "the teacher can see the student's identity on that question": (
      args: TeacherStudentLessonArgs,
    ) => Promise<void>;
    "they cannot see that discussion": (args: StudentPairLessonArgs) => Promise<void>;
    "enrolled students can see the approved question anonymously": (
      args: ApprovedLessonQuestionArgs,
    ) => Promise<void>;
    "the reply is pending teacher approval": (args: ApprovedLessonReplyArgs) => Promise<void>;
    "the reply appears threaded under the question": (
      args: ApprovedLessonReplyArgs,
    ) => Promise<void>;
    "the student can see the teacher reply": (args: TeacherLessonReplyArgs) => Promise<void>;
    "the student cannot see the teacher reply": (args: TeacherLessonReplyArgs) => Promise<void>;
    "the lesson question is not accepted": (args: DiscussionPostResult) => Promise<void>;
    "the reply is not accepted": (args: CrossLessonReplyResult) => Promise<void>;
    "the original discussion remains pending": (args: CrossLessonModerationResult) => Promise<void>;
  };
}

export function createDiscussionDSL(
  driver: DiscussionDriver,
  authDSL: AuthDSL,
  enrollmentDSL: EnrollmentDSL,
  lessonFlowDSL: LessonFlowDSL,
  programDSL: ProgramDSL,
  questionDSL: QuestionDSL,
  expect: Expect,
): DiscussionDSL {
  async function createOpenedDiscussion(): Promise<TeacherLessonReplyArgs> {
    const args = await createListenedLesson({
      authDSL,
      enrollmentDSL,
      lessonFlowDSL,
      programDSL,
      questionDSL,
    });
    const questionBody = `Question ${crypto.randomUUID().slice(0, 6)}`;
    await driver.submitQuestion(args.student, questionBody);
    return {
      ...args,
      questionBody,
      teacherReplyBody: `Teacher reply ${crypto.randomUUID().slice(0, 6)}`,
    };
  }

  async function createPendingLessonQuestion(): Promise<TeacherStudentLessonArgs> {
    const args = await createOpenedDiscussion();
    await driver.openLesson(args.teacher, args.lesson);
    return args;
  }

  async function createApprovedLessonQuestion(): Promise<ApprovedLessonQuestionArgs> {
    const args = await createPendingLessonQuestion();
    await driver.approveDiscussion(args.teacher, args.questionBody);
    await lessonFlowDSL.when["the student opens the lesson"](args);
    return args;
  }

  async function createPendingLessonReply(): Promise<ApprovedLessonReplyArgs> {
    const args = await createApprovedLessonQuestion();
    const replyBody = `Reply ${crypto.randomUUID().slice(0, 6)}`;
    await driver.submitReply(args.student, args.questionBody, replyBody);
    await driver.openLesson(args.teacher, args.lesson);
    return { ...args, replyBody };
  }

  return {
    given: {
      "a student has listened to a lesson": async () => {
        const args = await createListenedLesson({
          authDSL,
          enrollmentDSL,
          lessonFlowDSL,
          programDSL,
          questionDSL,
        });
        const questionBody = `Question ${crypto.randomUUID().slice(0, 6)}`;
        return { ...args, questionBody };
      },
      "a student opened a discussion": async () => {
        return createOpenedDiscussion();
      },
      "a teacher with a pending lesson question": async () => {
        return createPendingLessonQuestion();
      },
      "a student viewing a lesson with another student's pending discussion": async () => {
        const args = await createPendingLessonQuestion();
        const otherStudent = await authDSL.given["a registered user"]({
          role: "student",
        });
        await enrollmentDSL.when["student requests program enrollment"]({
          student: otherStudent,
          program: args.program,
        });
        await programDSL.when["teacher approves student's enrollment"]({
          teacher: args.teacher,
          student: otherStudent,
          program: args.program,
        });
        await lessonFlowDSL.when["the student marks the lesson as listened"]({
          student: otherStudent,
          program: args.program,
          lesson: args.lesson,
        });
        return { ...args, otherStudent };
      },
      "a student viewing an approved lesson question": async () => {
        return createApprovedLessonQuestion();
      },
      "a teacher with a pending lesson reply": async () => {
        return createPendingLessonReply();
      },
      "a teacher with an approved lesson question": async () => {
        return createApprovedLessonQuestion();
      },
      "a student who has not listened to a lesson": async () => {
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
        await questionDSL.when["they add a single-answer question"]({
          teacher,
          lesson,
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
        return {
          teacher,
          student,
          program,
          lesson,
          questionBody: `Question ${crypto.randomUUID().slice(0, 6)}`,
        };
      },
      "a student enrolled in a different program than the lesson": async () => {
        const teacher = await authDSL.given["a registered user"]({
          role: "teacher",
        });
        const enrolledProgram = await programDSL.when["they create a program"](teacher);
        const lessonProgram = await programDSL.when["they create a program"](teacher);
        const course = await programDSL.when["they add a course to the program"]({
          teacher,
          program: lessonProgram,
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
          program: enrolledProgram,
        });
        await programDSL.when["teacher approves student's enrollment"]({
          teacher,
          student,
          program: enrolledProgram,
        });
        return {
          teacher,
          student,
          program: enrolledProgram,
          lesson,
          questionBody: `Question ${crypto.randomUUID().slice(0, 6)}`,
        };
      },
      "a student with an approved discussion and another listened lesson": async () => {
        const args = await createListenedLesson({
          authDSL,
          enrollmentDSL,
          lessonFlowDSL,
          programDSL,
          questionDSL,
        });
        const questionBody = `Question ${crypto.randomUUID().slice(0, 6)}`;
        await driver.submitQuestion(args.student, questionBody);
        await driver.openLesson(args.teacher, args.lesson);
        await driver.approveDiscussion(args.teacher, questionBody);
        const parentDiscussionId = await driver.getDiscussionId(
          args.teacher,
          args.lesson,
          questionBody,
        );
        await lessonFlowDSL.when["the student submits the lesson answers"]({
          student: args.student,
          program: args.program,
          lesson: args.lesson,
          question: args.lessonQuestion,
        });
        const otherLesson = await programDSL.when["teacher adds lesson to course"]({
          teacher: args.teacher,
          course: args.lesson.course,
        });
        await lessonFlowDSL.when["the student marks the lesson as listened"]({
          student: args.student,
          program: args.program,
          lesson: otherLesson,
        });

        return {
          ...args,
          otherLesson,
          parentDiscussionId,
          questionBody,
          replyBody: `Reply ${crypto.randomUUID().slice(0, 6)}`,
        };
      },
      "a teacher with a pending discussion and another owned lesson": async () => {
        const args = await createListenedLesson({
          authDSL,
          enrollmentDSL,
          lessonFlowDSL,
          programDSL,
          questionDSL,
        });
        const questionBody = `Question ${crypto.randomUUID().slice(0, 6)}`;
        await driver.submitQuestion(args.student, questionBody);
        await driver.openLesson(args.teacher, args.lesson);
        const discussionId = await driver.getDiscussionId(args.teacher, args.lesson, questionBody);
        const otherLesson = await programDSL.when["teacher adds lesson to course"]({
          teacher: args.teacher,
          course: args.lesson.course,
        });

        return { ...args, discussionId, otherLesson, questionBody };
      },
    },
    when: {
      "the student opens a discussion": async (args) => {
        await driver.submitQuestion(args.student, args.questionBody);
      },
      "the teacher approves the question": async (args) => {
        await driver.approveDiscussion(args.teacher, args.questionBody);
        await lessonFlowDSL.when["the student opens the lesson"](args);
      },
      "the student submits a reply": async (args) => {
        await driver.submitReply(args.student, args.questionBody, args.replyBody);
        await driver.openLesson(args.teacher, args.lesson);
      },
      "the teacher approves the reply": async (args) => {
        await driver.approveDiscussion(args.teacher, args.replyBody);
        await lessonFlowDSL.when["the student opens the lesson"](args);
      },
      "the teacher replies to that discussion after approving it": async (args) => {
        await driver.openLesson(args.teacher, args.lesson);
        await driver.approveDiscussion(args.teacher, args.questionBody);
        await driver.submitTeacherReply(args.teacher, args.questionBody, args.teacherReplyBody);
        await lessonFlowDSL.when["the student opens the lesson"](args);
      },
      "the teacher replies to that discussion before approving it": async (args) => {
        await driver.openLesson(args.teacher, args.lesson);
        await driver.submitTeacherReply(args.teacher, args.questionBody, args.teacherReplyBody);
        await lessonFlowDSL.when["the student opens the lesson"](args);
      },
      "the student asks the lesson question": async (args) => {
        return {
          status: await driver.postQuestion(args.student, args.lesson, args.questionBody),
        };
      },
      "the student replies to that discussion from the other lesson": async (args) => {
        return {
          ...args,
          status: await driver.postReply({
            student: args.student,
            lesson: args.otherLesson,
            discussionId: args.parentDiscussionId,
            body: args.replyBody,
          }),
        };
      },
      "the teacher approves that discussion from the other lesson": async (args) => {
        return {
          ...args,
          status: await driver.postApproval({
            teacher: args.teacher,
            lesson: args.otherLesson,
            discussionId: args.discussionId,
          }),
        };
      },
    },
    then: {
      "the teacher sees it as pending their approval": async (args) => {
        await driver.openLesson(args.teacher, args.lesson);
        expect(await driver.seesPendingDiscussion(args.teacher, args.questionBody)).toBe(true);
      },
      "the student can see their discussion pending teacher approval": async (args) => {
        expect(await driver.seesPendingDiscussion(args.student, args.questionBody)).toBe(true);
      },
      "the teacher can see the student's identity on that question": async (args) => {
        expect(
          await driver.seesDiscussionAuthor(args.teacher, args.questionBody, args.student),
        ).toBe(true);
      },
      "they cannot see that discussion": async (args) => {
        expect(await driver.seesDiscussionHidden(args.otherStudent, args.questionBody)).toBe(true);
      },
      "enrolled students can see the approved question anonymously": async (args) => {
        expect(
          await driver.seesApprovedDiscussionAnonymously(args.student, args.questionBody),
        ).toBe(true);
      },
      "the reply is pending teacher approval": async (args) => {
        expect(await driver.seesPendingReply(args.teacher, args.replyBody)).toBe(true);
      },
      "the reply appears threaded under the question": async (args) => {
        expect(
          await driver.seesReplyThreaded(args.student, args.questionBody, args.replyBody),
        ).toBe(true);
      },
      "the student can see the teacher reply": async (args) => {
        expect(
          await driver.seesTeacherReplyThreaded(
            args.student,
            args.questionBody,
            args.teacherReplyBody,
            args.teacher,
          ),
        ).toBe(true);
      },
      "the student cannot see the teacher reply": async (args) => {
        expect(await driver.seesDiscussionHidden(args.student, args.teacherReplyBody)).toBe(true);
      },
      "the lesson question is not accepted": async ({ status }) => {
        expect(status).toBe(404);
      },
      "the reply is not accepted": async ({ status }) => {
        expect(status).toBe(404);
      },
      "the original discussion remains pending": async (args) => {
        expect(args.status).toBe(404);
        await driver.openLesson(args.teacher, args.lesson);
        expect(await driver.seesPendingDiscussion(args.teacher, args.questionBody)).toBe(true);
      },
    },
  };
}
