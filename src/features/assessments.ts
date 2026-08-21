import { and, asc, desc, eq, inArray } from "drizzle-orm";
import { db } from "../db";
import {
  assessment,
  assessmentAttempt,
  assessmentAttemptSelection,
  assessmentQuestion,
  course,
  lesson,
  lessonCompletion,
  question,
  questionGridAnswer,
  questionOption,
  questionRow,
} from "../db/schema";
import {
  type AssessmentAttemptError,
  type AssessmentKind,
  type AssessmentPublication,
  createAssessmentAttempt,
} from "../domain/assessments";
import { now } from "../domain/clock";
import type { Result } from "../domain/result";
import type { LessonAnswerSelectionInput } from "./lesson-answers";

export async function listCourseQuestions(courseId: string, limitLessons?: number) {
  const lessonItems = await db
    .select({
      id: lesson.id,
    })
    .from(lesson)
    .where(eq(lesson.courseId, courseId))
    .orderBy(asc(lesson.position));

  const lessonIds = (limitLessons ? lessonItems.slice(0, limitLessons) : lessonItems).map(
    (item) => item.id,
  );

  if (lessonIds.length === 0) {
    return [];
  }

  return db
    .select({
      id: question.id,
      text: question.text,
      type: question.type,
      lessonId: question.lessonId,
    })
    .from(question)
    .where(inArray(question.lessonId, lessonIds))
    .orderBy(asc(question.lessonId), asc(question.position));
}

export async function publishAssessment(args: AssessmentPublication) {
  const currentTime = now();
  const [created] = await db
    .insert(assessment)
    .values({
      kind: args.kind,
      title: args.title,
      courseId: args.courseId,
      weekNumber: args.weekNumber ?? null,
      opensAt: args.opensAt,
      closesAt: args.closesAt,
      passingThresholdPercent: args.passingThresholdPercent ?? 70,
      createdAt: currentTime,
      updatedAt: currentTime,
    })
    .returning();

  if (!created) {
    throw new Error("Could not create assessment");
  }

  if (args.questionIds.length > 0) {
    await db.insert(assessmentQuestion).values(
      args.questionIds.map((questionId, index) => ({
        assessmentId: created.id,
        questionId,
        position: index,
        createdAt: currentTime,
        updatedAt: currentTime,
      })),
    );
  }

  return created;
}

export async function getCourseAssessments(courseId: string) {
  return db
    .select()
    .from(assessment)
    .where(eq(assessment.courseId, courseId))
    .orderBy(asc(assessment.opensAt));
}

export async function getLatestAssessment(courseId: string, kind: AssessmentKind) {
  return db.query.assessment.findFirst({
    where: and(eq(assessment.courseId, courseId), eq(assessment.kind, kind)),
    orderBy: [desc(assessment.createdAt)],
  });
}

export async function getAssessmentById(assessmentId: string) {
  return db.query.assessment.findFirst({
    where: eq(assessment.id, assessmentId),
  });
}

export async function getAssessmentForCourseInProgram(args: {
  assessmentId: string;
  courseId: string;
  programId: string;
}) {
  const result = await db
    .select({ assessment, programId: course.programId })
    .from(assessment)
    .innerJoin(course, eq(assessment.courseId, course.id))
    .where(eq(assessment.id, args.assessmentId))
    .get();

  if (
    !result ||
    result.assessment.courseId !== args.courseId ||
    result.programId !== args.programId
  ) {
    return null;
  }

  return result.assessment;
}

export async function getAssessmentQuestions(assessmentId: string) {
  const assessmentQuestions = await db
    .select({
      id: question.id,
      text: question.text,
      type: question.type,
      lessonId: question.lessonId,
    })
    .from(assessmentQuestion)
    .innerJoin(question, eq(assessmentQuestion.questionId, question.id))
    .where(eq(assessmentQuestion.assessmentId, assessmentId))
    .orderBy(asc(assessmentQuestion.position));

  const questionIds = assessmentQuestions.map((item) => item.id);
  if (questionIds.length === 0) {
    return [];
  }

  const [options, rows, gridAnswers] = await Promise.all([
    db
      .select()
      .from(questionOption)
      .where(inArray(questionOption.questionId, questionIds))
      .orderBy(asc(questionOption.position)),
    db
      .select()
      .from(questionRow)
      .where(inArray(questionRow.questionId, questionIds))
      .orderBy(asc(questionRow.position)),
    db
      .select({
        optionId: questionGridAnswer.questionOptionId,
        rowId: questionGridAnswer.questionRowId,
      })
      .from(questionGridAnswer)
      .innerJoin(questionOption, eq(questionGridAnswer.questionOptionId, questionOption.id))
      .where(inArray(questionOption.questionId, questionIds)),
  ]);

  const correctRowIdsByOptionId = new Map<string, Set<string>>();
  for (const gridAnswer of gridAnswers) {
    const rowIds = correctRowIdsByOptionId.get(gridAnswer.optionId) ?? new Set<string>();
    rowIds.add(gridAnswer.rowId);
    correctRowIdsByOptionId.set(gridAnswer.optionId, rowIds);
  }

  return assessmentQuestions.map((questionItem) => ({
    ...questionItem,
    options: options
      .filter((option) => option.questionId === questionItem.id)
      .map((option) => ({
        ...option,
        correctRowIds: correctRowIdsByOptionId.get(option.id),
      })),
    rows: rows.filter((row) => row.questionId === questionItem.id),
  }));
}

export async function getLatestAssessmentAttempt(assessmentId: string, studentId: string) {
  return db.query.assessmentAttempt.findFirst({
    where: and(
      eq(assessmentAttempt.assessmentId, assessmentId),
      eq(assessmentAttempt.studentId, studentId),
    ),
    orderBy: [desc(assessmentAttempt.submittedAt)],
  });
}

export async function getAssessmentAttemptSelections(attemptId: string) {
  return db
    .select({
      questionId: assessmentAttemptSelection.questionId,
      questionOptionId: assessmentAttemptSelection.questionOptionId,
      questionRowId: assessmentAttemptSelection.questionRowId,
    })
    .from(assessmentAttemptSelection)
    .where(eq(assessmentAttemptSelection.attemptId, attemptId));
}

export async function hasCompletedCourse(studentId: string, courseId: string) {
  const lessons = await db
    .select({ id: lesson.id })
    .from(lesson)
    .where(eq(lesson.courseId, courseId));

  if (lessons.length === 0) {
    return false;
  }

  const completed = await db
    .select({ lessonId: lessonCompletion.lessonId })
    .from(lessonCompletion)
    .innerJoin(lesson, eq(lessonCompletion.lessonId, lesson.id))
    .where(and(eq(lessonCompletion.studentId, studentId), eq(lesson.courseId, courseId)));

  return completed.length >= lessons.length;
}

export async function submitAssessmentAttempt(args: {
  assessment: {
    id: string;
    kind: AssessmentKind;
    passingThresholdPercent: number;
    questions: Awaited<ReturnType<typeof getAssessmentQuestions>>;
    window: { opensAt: Date; closesAt: Date };
  };
  courseCompleted: boolean;
  selections: LessonAnswerSelectionInput[];
  studentId: string;
}): Promise<Result<typeof assessmentAttempt.$inferSelect, AssessmentAttemptError>> {
  return db.transaction(async (tx) => {
    const latestAttempt = await tx.query.assessmentAttempt.findFirst({
      where: and(
        eq(assessmentAttempt.assessmentId, args.assessment.id),
        eq(assessmentAttempt.studentId, args.studentId),
      ),
      orderBy: [desc(assessmentAttempt.submittedAt)],
    });
    const attempt = createAssessmentAttempt({
      assessment: args.assessment,
      courseCompleted: args.courseCompleted,
      latestAttempt: latestAttempt ?? null,
      now: now(),
      selections: args.selections,
    });
    if (!attempt.ok) {
      return attempt;
    }

    const [createdAttempt] = await tx
      .insert(assessmentAttempt)
      .values({
        assessmentId: args.assessment.id,
        studentId: args.studentId,
        scorePercent: attempt.value.scorePercent,
        status: attempt.value.status,
        submittedAt: attempt.value.submittedAt,
        retryAvailableAt: attempt.value.retryAvailableAt,
        createdAt: attempt.value.submittedAt,
        updatedAt: attempt.value.submittedAt,
      })
      .returning();

    if (!createdAttempt) {
      throw new Error("Could not save assessment attempt");
    }

    if (attempt.value.selections.length > 0) {
      await tx.insert(assessmentAttemptSelection).values(
        attempt.value.selections.map((selection) => ({
          attemptId: createdAttempt.id,
          questionId: selection.questionId,
          questionOptionId: selection.questionOptionId,
          questionRowId: selection.questionRowId,
          createdAt: attempt.value.submittedAt,
          updatedAt: attempt.value.submittedAt,
        })),
      );
    }

    return { ok: true, value: createdAttempt };
  });
}

export async function getCourseLessonCount(courseId: string) {
  const lessons = await db
    .select({ id: lesson.id })
    .from(lesson)
    .where(eq(lesson.courseId, courseId));

  return lessons.length;
}

export async function getCourseName(courseId: string) {
  const courseItem = await db.query.course.findFirst({
    where: eq(course.id, courseId),
  });

  return courseItem?.name ?? null;
}
