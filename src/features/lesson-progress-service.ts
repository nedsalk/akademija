import { and, eq } from "drizzle-orm";
import { db } from "../db";
import {
  lessonAnswerSelection,
  lessonAnswerSubmission,
  lessonCompletion,
  lessonListen,
} from "../db/schema";
import { now } from "../domain/clock";
import {
  canOpenLesson,
  submitLessonAnswers as decideLessonAnswerSubmission,
  type LessonProgressError,
  listenToLesson,
} from "../domain/lesson-progress";
import type { Result } from "../domain/result";
import { routes } from "../routes";
import { getLessonWithQuestions } from "./catalog";
import {
  getCompletedLessonIdsForProgram,
  getCourseLessons,
  getLessonListenForStudent,
  getProgramEnrollment,
} from "./enrollment";
import { getQuestionAnswerShape, parseLessonAnswerForm } from "./lesson-answers";

type LessonCommandError = "not-found" | LessonProgressError;
type LessonState = NonNullable<Awaited<ReturnType<typeof getLessonWithQuestions>>>;
type LessonProgressContext = {
  completedLessonIds: Set<string>;
  lessonState: LessonState;
  listenedLessonIds: Set<string>;
  orderedLessons: Array<{ id: string; position: number }>;
};

interface LessonCommandArgs {
  studentId: string;
  programId: string;
  courseId: string;
  lessonId: string;
}

async function getLessonCommandContext(args: LessonCommandArgs) {
  const lessonState = await getLessonWithQuestions(args.lessonId);
  if (
    !lessonState ||
    lessonState.course.id !== args.courseId ||
    lessonState.program.id !== args.programId
  ) {
    return { ok: false as const, error: "not-found" as const };
  }

  const enrollment = await getProgramEnrollment(args.studentId, args.programId);
  if (!enrollment) {
    return { ok: false as const, error: "not-found" as const };
  }

  const [orderedLessons, completedLessonIds, listenedLesson] = await Promise.all([
    getCourseLessons(args.courseId),
    getCompletedLessonIdsForProgram(args.studentId, args.programId),
    getLessonListenForStudent(args.studentId, args.lessonId),
  ]);

  return {
    ok: true as const,
    value: {
      completedLessonIds,
      lessonState,
      listenedLessonIds: listenedLesson ? new Set([args.lessonId]) : new Set<string>(),
      orderedLessons,
    },
  };
}

function lessonRedirect(args: LessonCommandArgs) {
  return routes.programs
    .$(args.programId)
    .courses.$(args.courseId)
    .lessons.$(args.lessonId)
    .toString();
}

function courseRedirect(args: LessonCommandArgs) {
  return routes.programs.$(args.programId).courses.$(args.courseId).toString();
}

export async function openLessonForStudent(
  args: LessonCommandArgs,
): Promise<Result<LessonProgressContext, LessonCommandError>> {
  const context = await getLessonCommandContext(args);
  if (!context.ok) {
    return context;
  }

  const allowed = canOpenLesson({
    lessonId: args.lessonId,
    orderedLessons: context.value.orderedLessons,
    completedLessonIds: context.value.completedLessonIds,
  });
  if (!allowed.ok) {
    return allowed;
  }

  return { ok: true, value: context.value };
}

export async function markLessonListened(
  args: LessonCommandArgs,
): Promise<Result<{ redirectTo: string }, LessonCommandError>> {
  const context = await getLessonCommandContext(args);
  if (!context.ok) {
    return context;
  }

  const transition = listenToLesson({
    lessonId: args.lessonId,
    orderedLessons: context.value.orderedLessons,
    completedLessonIds: context.value.completedLessonIds,
    hasQuestions: context.value.lessonState.questions.length > 0,
  });
  if (!transition.ok) {
    return transition;
  }

  const currentTime = now();
  await db.transaction(async (tx) => {
    await tx
      .insert(lessonListen)
      .values({
        studentId: args.studentId,
        lessonId: args.lessonId,
        listenedAt: currentTime,
        createdAt: currentTime,
        updatedAt: currentTime,
      })
      .onConflictDoNothing();

    if (transition.value.completeLesson) {
      await tx
        .insert(lessonCompletion)
        .values({
          studentId: args.studentId,
          lessonId: args.lessonId,
          completedAt: currentTime,
          createdAt: currentTime,
          updatedAt: currentTime,
        })
        .onConflictDoNothing();
    }
  });

  return {
    ok: true,
    value: {
      redirectTo: transition.value.completeLesson ? courseRedirect(args) : lessonRedirect(args),
    },
  };
}

export async function submitLessonAnswers(
  args: LessonCommandArgs & { formData: FormData },
): Promise<Result<{ redirectTo: string }, LessonCommandError>> {
  const context = await getLessonCommandContext(args);
  if (!context.ok) {
    return context;
  }

  const transition = decideLessonAnswerSubmission({
    lessonId: args.lessonId,
    listenedLessonIds: context.value.listenedLessonIds,
    completedLessonIds: context.value.completedLessonIds,
    orderedLessons: context.value.orderedLessons,
  });
  if (!transition.ok) {
    return transition;
  }

  const questionAnswerShape = await getQuestionAnswerShape(args.lessonId);
  const selections = parseLessonAnswerForm(args.formData, questionAnswerShape);
  const currentTime = now();

  await db.transaction(async (tx) => {
    const [createdSubmission] = await tx
      .insert(lessonAnswerSubmission)
      .values({
        studentId: args.studentId,
        lessonId: args.lessonId,
        createdAt: currentTime,
        updatedAt: currentTime,
      })
      .onConflictDoNothing()
      .returning();

    const submission =
      createdSubmission ??
      (await tx.query.lessonAnswerSubmission.findFirst({
        where: and(
          eq(lessonAnswerSubmission.studentId, args.studentId),
          eq(lessonAnswerSubmission.lessonId, args.lessonId),
        ),
      }));

    if (!submission) {
      throw new Error("Could not create lesson answer submission");
    }

    await tx
      .delete(lessonAnswerSelection)
      .where(eq(lessonAnswerSelection.submissionId, submission.id));

    if (selections.length > 0) {
      await tx.insert(lessonAnswerSelection).values(
        selections.map((selection) => ({
          submissionId: submission.id,
          questionId: selection.questionId,
          questionOptionId: selection.questionOptionId,
          questionRowId: selection.questionRowId,
          createdAt: currentTime,
          updatedAt: currentTime,
        })),
      );
    }

    if (transition.value.completeLesson) {
      await tx
        .insert(lessonCompletion)
        .values({
          studentId: args.studentId,
          lessonId: args.lessonId,
          completedAt: currentTime,
          createdAt: currentTime,
          updatedAt: currentTime,
        })
        .onConflictDoNothing();
    }
  });

  return { ok: true, value: { redirectTo: lessonRedirect(args) } };
}
