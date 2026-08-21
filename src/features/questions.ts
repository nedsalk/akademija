import { eq, inArray } from "drizzle-orm";
import { db } from "../db";
import { question, questionGridAnswer, questionOption, questionRow } from "../db/schema";
import { now } from "../domain/clock";
import type { PreparedQuestion } from "../domain/questions";

export type { QuestionDraft } from "../domain/questions";
export { prepareQuestionSet } from "../domain/questions";
export {
  applyQuestionEditorAction,
  createEmptyQuestionDraft,
  getNextAnswerKeyQuestionIndex,
  parseQuestionForm,
} from "./question-editor-state";

export async function replaceLessonQuestions(
  lessonId: string,
  preparedQuestions: PreparedQuestion[],
) {
  const currentTime = now();

  await db.transaction(async (tx) => {
    const currentQuestions = await tx
      .select({ id: question.id })
      .from(question)
      .where(eq(question.lessonId, lessonId));

    for (const currentQuestion of currentQuestions) {
      const currentOptions = await tx
        .select({ id: questionOption.id })
        .from(questionOption)
        .where(eq(questionOption.questionId, currentQuestion.id));

      if (currentOptions.length > 0) {
        await tx.delete(questionGridAnswer).where(
          inArray(
            questionGridAnswer.questionOptionId,
            currentOptions.map((option) => option.id),
          ),
        );
      }

      await tx.delete(questionOption).where(eq(questionOption.questionId, currentQuestion.id));
      await tx.delete(questionRow).where(eq(questionRow.questionId, currentQuestion.id));
    }

    await tx.delete(question).where(eq(question.lessonId, lessonId));

    for (const [questionIndex, preparedQuestion] of preparedQuestions.entries()) {
      const [insertedQuestion] = await tx
        .insert(question)
        .values({
          text: preparedQuestion.text,
          type: preparedQuestion.type,
          lessonId,
          position: questionIndex,
          createdAt: currentTime,
          updatedAt: currentTime,
        })
        .returning();

      if (!insertedQuestion) {
        continue;
      }

      const insertedRows =
        preparedQuestion.rows.length > 0
          ? await tx
              .insert(questionRow)
              .values(
                preparedQuestion.rows.map((row, rowIndex) => ({
                  text: row,
                  position: rowIndex,
                  questionId: insertedQuestion.id,
                  createdAt: currentTime,
                  updatedAt: currentTime,
                })),
              )
              .returning()
          : [];

      for (const [optionIndex, option] of preparedQuestion.options.entries()) {
        const [insertedOption] = await tx
          .insert(questionOption)
          .values({
            text: option.text,
            isCorrect: option.isCorrect,
            position: optionIndex,
            questionId: insertedQuestion.id,
            createdAt: currentTime,
            updatedAt: currentTime,
          })
          .returning();

        if (!insertedOption || preparedQuestion.rows.length === 0) {
          continue;
        }

        const correctRows =
          option.correctRows ??
          (option.isCorrect ? insertedRows.map((_, rowIndex) => rowIndex) : []);
        const gridAnswers = correctRows.flatMap((rowIndex) => {
          const row = insertedRows[rowIndex];
          return row
            ? [
                {
                  questionOptionId: insertedOption.id,
                  questionRowId: row.id,
                  createdAt: currentTime,
                  updatedAt: currentTime,
                },
              ]
            : [];
        });

        if (gridAnswers.length > 0) {
          await tx.insert(questionGridAnswer).values(gridAnswers);
        }
      }
    }
  });
}
