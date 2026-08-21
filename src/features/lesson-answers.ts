import { and, eq } from "drizzle-orm";
import { db } from "../db";
import {
  lessonAnswerSelection,
  lessonAnswerSubmission,
  question,
  questionGridAnswer,
  questionOption,
  questionRow,
} from "../db/schema";
import { type AnswerSelection, getAnswerFeedback } from "../domain/answers";
import { now } from "../domain/clock";
import type { QuestionType } from "../domain/questions";

interface LessonQuestionForAnswers {
  id: string;
  type: QuestionType;
  options: Array<{ id: string }>;
  rows: Array<{ id: string }>;
}

export interface LessonAnswerSelectionInput extends AnswerSelection {}

interface LessonQuestionForFeedback {
  id: string;
  options: Array<{
    correctRowIds?: Set<string>;
    id: string;
    isCorrect: boolean;
  }>;
  rows: Array<{ id: string }>;
  type: QuestionType;
}

export function parseLessonAnswerForm(
  formData: FormData,
  questions: LessonQuestionForAnswers[],
): LessonAnswerSelectionInput[] {
  const validQuestions = new Map(questions.map((item) => [item.id, item]));
  const selections: LessonAnswerSelectionInput[] = [];

  for (const [key, rawValue] of formData.entries()) {
    const value = rawValue.toString();
    const rowMatch = key.match(/^question:(.+):row:(.+)$/);

    if (rowMatch) {
      const questionId = rowMatch[1];
      const questionRowId = rowMatch[2];
      if (!questionId || !questionRowId) {
        continue;
      }

      const questionItem = validQuestions.get(questionId);
      if (
        !questionItem ||
        !questionItem.options.some((option) => option.id === value) ||
        !questionItem.rows.some((row) => row.id === questionRowId)
      ) {
        continue;
      }

      selections.push({ questionId, questionOptionId: value, questionRowId });
      continue;
    }

    const questionMatch = key.match(/^question:(.+)$/);
    if (!questionMatch) {
      continue;
    }

    const questionId = questionMatch[1];
    if (!questionId) {
      continue;
    }

    const questionItem = validQuestions.get(questionId);
    if (!questionItem || !questionItem.options.some((option) => option.id === value)) {
      continue;
    }

    selections.push({
      questionId,
      questionOptionId: value,
      questionRowId: null,
    });
  }

  return selections;
}

export async function saveLessonAnswers(
  studentId: string,
  lessonId: string,
  selections: LessonAnswerSelectionInput[],
) {
  const currentTime = now();

  await db.transaction(async (tx) => {
    const existingSubmission = await tx.query.lessonAnswerSubmission.findFirst({
      where: and(
        eq(lessonAnswerSubmission.studentId, studentId),
        eq(lessonAnswerSubmission.lessonId, lessonId),
      ),
    });

    let submissionId = existingSubmission?.id;

    if (!submissionId) {
      const [createdSubmission] = await tx
        .insert(lessonAnswerSubmission)
        .values({
          studentId,
          lessonId,
          createdAt: currentTime,
          updatedAt: currentTime,
        })
        .returning();

      submissionId = createdSubmission?.id;
    }

    if (!submissionId) {
      throw new Error("Could not create lesson answer submission");
    }

    await tx
      .delete(lessonAnswerSelection)
      .where(eq(lessonAnswerSelection.submissionId, submissionId));

    if (selections.length === 0) {
      return;
    }

    await tx.insert(lessonAnswerSelection).values(
      selections.map((selection) => ({
        submissionId,
        questionId: selection.questionId,
        questionOptionId: selection.questionOptionId,
        questionRowId: selection.questionRowId,
        createdAt: currentTime,
        updatedAt: currentTime,
      })),
    );
  });
}

export async function getSavedLessonAnswers(studentId: string, lessonId: string) {
  const submission = await db.query.lessonAnswerSubmission.findFirst({
    where: and(
      eq(lessonAnswerSubmission.studentId, studentId),
      eq(lessonAnswerSubmission.lessonId, lessonId),
    ),
  });

  if (!submission) {
    return [];
  }

  return db
    .select({
      questionId: lessonAnswerSelection.questionId,
      questionOptionId: lessonAnswerSelection.questionOptionId,
      questionRowId: lessonAnswerSelection.questionRowId,
    })
    .from(lessonAnswerSelection)
    .where(eq(lessonAnswerSelection.submissionId, submission.id));
}

export async function getQuestionAnswerShape(lessonId: string) {
  const [questions, options, rows, gridAnswers] = await Promise.all([
    db
      .select({
        id: question.id,
        type: question.type,
      })
      .from(question)
      .where(eq(question.lessonId, lessonId)),
    db
      .select({
        id: questionOption.id,
        questionId: questionOption.questionId,
      })
      .from(questionOption)
      .innerJoin(question, eq(questionOption.questionId, question.id))
      .where(eq(question.lessonId, lessonId)),
    db
      .select({
        id: questionRow.id,
        questionId: questionRow.questionId,
      })
      .from(questionRow)
      .innerJoin(question, eq(questionRow.questionId, question.id))
      .where(eq(question.lessonId, lessonId)),
    db
      .select({
        optionId: questionGridAnswer.questionOptionId,
        rowId: questionGridAnswer.questionRowId,
      })
      .from(questionGridAnswer)
      .innerJoin(questionOption, eq(questionGridAnswer.questionOptionId, questionOption.id))
      .innerJoin(question, eq(questionOption.questionId, question.id))
      .where(eq(question.lessonId, lessonId)),
  ]);

  const correctRowIdsByOptionId = new Map<string, Set<string>>();
  for (const gridAnswer of gridAnswers) {
    const rowIds = correctRowIdsByOptionId.get(gridAnswer.optionId) ?? new Set<string>();
    rowIds.add(gridAnswer.rowId);
    correctRowIdsByOptionId.set(gridAnswer.optionId, rowIds);
  }

  return questions.map((questionItem) => ({
    id: questionItem.id,
    type: questionItem.type,
    options: options
      .filter((option) => option.questionId === questionItem.id)
      .map((option) => ({
        ...option,
        correctRowIds: correctRowIdsByOptionId.get(option.id),
      })),
    rows: rows.filter((row) => row.questionId === questionItem.id),
  }));
}

export function getLessonAnswerFeedback(
  questions: LessonQuestionForFeedback[],
  selections: LessonAnswerSelectionInput[],
) {
  return getAnswerFeedback(questions, selections);
}
