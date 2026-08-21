/** biome-ignore-all lint/suspicious/noThenProperty: <given-when-then> */
import type { LessonFlowDriver } from "../drivers/interface";
import type { AuthDSL } from "./auth.dsl";
import type { EnrollmentDSL } from "./enrollment.dsl";
import type { ProgramDSL } from "./program.dsl";
import type { QuestionDSL } from "./question.dsl";
import type {
  Expect,
  StudentProgramLesson,
  StudentProgramLessonQuestion,
  StudentProgramLessons,
} from "./types";

interface LessonChangeResult {
  status: number;
}

export interface LessonFlowDSL {
  given: {
    "an approved enrollment starting today with lessons": () => Promise<StudentProgramLesson>;
    "an approved enrollment starting today with multiple lessons": () => Promise<StudentProgramLessons>;
    "a student viewing an available lesson with a question": () => Promise<StudentProgramLessonQuestion>;
    "a student viewing a listened lesson with a question": () => Promise<StudentProgramLessonQuestion>;
    "a student who completed a lesson with a question": () => Promise<StudentProgramLessonQuestion>;
  };
  when: {
    "the student opens their enrolled program": (
      args: Pick<StudentProgramLesson, "student" | "program">,
    ) => Promise<void>;
    "the student opens the lesson": (args: StudentProgramLesson) => Promise<void>;
    "the student completes the lesson": (args: StudentProgramLesson) => Promise<void>;
    "the student completes the lesson and returns to their enrolled program": (
      args: StudentProgramLesson,
    ) => Promise<void>;
    "the student marks the lesson as listened": (args: StudentProgramLesson) => Promise<void>;
    "the student posts listened for the lesson": (
      args: StudentProgramLesson,
    ) => Promise<LessonChangeResult>;
    "the student posts answers for the lesson": (
      args: StudentProgramLesson,
    ) => Promise<LessonChangeResult>;
    "the student submits the lesson answers": (args: StudentProgramLessonQuestion) => Promise<void>;
  };
  then: {
    "the first lesson is available": (args: StudentProgramLesson) => Promise<void>;
    "the second lesson is available": (args: StudentProgramLesson) => Promise<void>;
    "the future lesson is locked": (args: StudentProgramLesson) => Promise<void>;
    "the lesson is unavailable": (args: Pick<StudentProgramLesson, "student">) => Promise<void>;
    "the lesson change is refused": (args: LessonChangeResult) => Promise<void>;
    "the lesson is marked as completed": (args: StudentProgramLesson) => Promise<void>;
    "the lesson video is shown and the questions are still hidden": (
      args: StudentProgramLessonQuestion,
    ) => Promise<void>;
    "the questions are shown and the lesson is marked as listened": (
      args: StudentProgramLessonQuestion,
    ) => Promise<void>;
    "the completed lesson shows completed status and visible questions": (
      args: StudentProgramLessonQuestion,
    ) => Promise<void>;
    "the submitted answer is saved and immediate feedback is shown": (
      args: StudentProgramLessonQuestion,
    ) => Promise<void>;
    "the submitted answers are shown and cannot be changed": (
      args: StudentProgramLessonQuestion,
    ) => Promise<void>;
  };
}

export function createLessonFlowDSL(
  driver: LessonFlowDriver,
  authDSL: AuthDSL,
  enrollmentDSL: EnrollmentDSL,
  programDSL: ProgramDSL,
  questionDSL: QuestionDSL,
  expect: Expect,
): LessonFlowDSL {
  async function createApprovedEnrollmentWithLessons(): Promise<StudentProgramLessons> {
    const { teacher, course, lessons } = await programDSL.given["a course with multiple lessons"]();
    const [firstLesson, secondLesson] = lessons;
    if (!firstLesson || !secondLesson) {
      throw new Error("Lesson-flow scenario requires two lessons");
    }
    const program = course.program;
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

    return { student, program, lessons: [firstLesson, secondLesson] };
  }

  async function createStudentViewingAvailableLessonWithQuestion(): Promise<StudentProgramLessonQuestion> {
    const { student, program, lessons } = await createApprovedEnrollmentWithLessons();
    const lesson = lessons[0];
    const question = await questionDSL.when["they add a single-answer question"]({
      teacher: program.teacher,
      lesson,
    });
    await programDSL.when["teacher sets the lesson video"]({
      teacher: program.teacher,
      lesson,
      videoUrl: "https://www.youtube.com/watch?v=dQw4w9WgXcQ",
    });

    await driver.openLesson(student, program, lesson);

    return { student, program, lesson, question };
  }

  return {
    given: {
      "an approved enrollment starting today with lessons": async () => {
        const { student, program, lessons } = await createApprovedEnrollmentWithLessons();

        return { student, program, lesson: lessons[0] };
      },
      "an approved enrollment starting today with multiple lessons": async () => {
        return createApprovedEnrollmentWithLessons();
      },
      "a student viewing an available lesson with a question": async () => {
        return createStudentViewingAvailableLessonWithQuestion();
      },
      "a student viewing a listened lesson with a question": async () => {
        const args = await createStudentViewingAvailableLessonWithQuestion();

        await driver.markLessonListened(args.student, args.program, args.lesson);

        return args;
      },
      "a student who completed a lesson with a question": async () => {
        const args = await createStudentViewingAvailableLessonWithQuestion();

        await driver.markLessonListened(args.student, args.program, args.lesson);
        await driver.submitCorrectLessonAnswers(
          args.student,
          args.program,
          args.lesson,
          args.question,
        );

        return args;
      },
    },
    when: {
      "the student opens their enrolled program": async ({ student, program }) => {
        await driver.openEnrolledProgram(student, program);
      },
      "the student opens the lesson": async ({ student, program, lesson }) => {
        await driver.openLesson(student, program, lesson);
      },
      "the student completes the lesson": async ({ student, program, lesson }) => {
        await driver.completeLesson(student, program, lesson);
      },
      "the student completes the lesson and returns to their enrolled program": async ({
        student,
        program,
        lesson,
      }) => {
        await driver.completeLesson(student, program, lesson);
        await driver.openEnrolledProgram(student, program);
      },
      "the student marks the lesson as listened": async ({ student, program, lesson }) => {
        await driver.markLessonListened(student, program, lesson);
      },
      "the student posts listened for the lesson": async ({ student, program, lesson }) => {
        return {
          status: await driver.postLessonListened(student, program, lesson),
        };
      },
      "the student posts answers for the lesson": async ({ student, program, lesson }) => {
        return {
          status: await driver.postLessonAnswers(student, program, lesson),
        };
      },
      "the student submits the lesson answers": async ({ student, program, lesson, question }) => {
        await driver.submitCorrectLessonAnswers(student, program, lesson, question);
      },
    },
    then: {
      "the first lesson is available": async ({ student, program, lesson }) => {
        const lessonIsAvailable = await driver.seesAvailableLesson(student, program, lesson);

        expect(lessonIsAvailable).toBe(true);
      },
      "the second lesson is available": async ({ student, program, lesson }) => {
        const lessonIsAvailable = await driver.seesAvailableLesson(student, program, lesson);

        expect(lessonIsAvailable).toBe(true);
      },
      "the future lesson is locked": async ({ student, program, lesson }) => {
        const lessonIsLocked = await driver.seesLockedLesson(student, program, lesson);

        expect(lessonIsLocked).toBe(true);
      },
      "the lesson is unavailable": async ({ student }) => {
        const lessonIsUnavailable = await driver.seesLessonUnavailable(student);

        expect(lessonIsUnavailable).toBe(true);
      },
      "the lesson change is refused": async ({ status }) => {
        expect(status).toBe(404);
      },
      "the lesson is marked as completed": async ({ student, program, lesson }) => {
        const lessonIsCompleted = await driver.seesCompletedLesson(student, program, lesson);

        expect(lessonIsCompleted).toBe(true);
      },
      "the lesson video is shown and the questions are still hidden": async ({
        student,
        lesson,
        question,
      }) => {
        const lessonVideoIsShown = await driver.seesLessonVideo(student, lesson);
        const listenedPromptIsShown = await driver.seesListenedPrompt(student);
        const questionsAreHidden = await driver.seesQuestionHidden(student, question);

        expect(lessonVideoIsShown).toBe(true);
        expect(listenedPromptIsShown).toBe(true);
        expect(questionsAreHidden).toBe(true);
      },
      "the questions are shown and the lesson is marked as listened": async ({
        student,
        question,
      }) => {
        const questionIsVisible = await driver.seesQuestionVisible(student, question);
        const lessonIsMarkedListened = await driver.seesLessonMarkedListened(student);
        const lessonIsCompleted = await driver.seesLessonMarkedCompletedOnPage(student);

        expect(questionIsVisible).toBe(true);
        expect(lessonIsMarkedListened).toBe(true);
        expect(lessonIsCompleted).toBe(false);
      },
      "the completed lesson shows completed status and visible questions": async ({
        student,
        question,
      }) => {
        const questionIsVisible = await driver.seesQuestionVisible(student, question);
        const lessonIsCompleted = await driver.seesLessonMarkedCompletedOnPage(student);

        expect(questionIsVisible).toBe(true);
        expect(lessonIsCompleted).toBe(true);
      },
      "the submitted answer is saved and immediate feedback is shown": async ({
        student,
        question,
      }) => {
        const submittedAnswerIsSaved = await driver.seesSubmittedAnswer(student, question);
        const immediateFeedbackIsShown = await driver.seesAnswerFeedback(student, question);

        expect(submittedAnswerIsSaved).toBe(true);
        expect(immediateFeedbackIsShown).toBe(true);
      },
      "the submitted answers are shown and cannot be changed": async ({ student, question }) => {
        const submittedAnswerIsSaved = await driver.seesSubmittedAnswer(student, question);
        const answersAreLocked = await driver.seesAnswersLocked(student);

        expect(submittedAnswerIsSaved).toBe(true);
        expect(answersAreLocked).toBe(true);
      },
    },
  };
}
