import { and, asc, eq, sql } from "drizzle-orm";
import { db } from "../db";
import {
  course,
  lesson,
  program,
  question,
  questionGridAnswer,
  questionOption,
  questionRow,
} from "../db/schema";

export async function listOwnedPrograms(userId: string) {
  return db.select().from(program).where(eq(program.teacherId, userId)).orderBy(asc(program.name));
}

export async function getOwnedProgram(userId: string, programId: string) {
  return db
    .select()
    .from(program)
    .where(and(eq(program.id, programId), eq(program.teacherId, userId)))
    .get();
}

export async function getOwnedCourse(userId: string, programId: string, courseId: string) {
  const result = await db
    .select({
      id: course.id,
      name: course.name,
      description: course.description,
      position: course.position,
      programId: course.programId,
      createdAt: course.createdAt,
      updatedAt: course.updatedAt,
      teacherId: program.teacherId,
    })
    .from(course)
    .innerJoin(program, eq(course.programId, program.id))
    .where(eq(course.id, courseId))
    .get();

  if (!result || result.programId !== programId || result.teacherId !== userId) {
    return null;
  }

  return result;
}

export async function getOwnedLesson(
  userId: string,
  programId: string,
  courseId: string,
  lessonId: string,
) {
  const result = await db
    .select({
      id: lesson.id,
      name: lesson.name,
      videoUrl: lesson.videoUrl,
      position: lesson.position,
      courseId: lesson.courseId,
      createdAt: lesson.createdAt,
      updatedAt: lesson.updatedAt,
      programId: course.programId,
      teacherId: program.teacherId,
    })
    .from(lesson)
    .innerJoin(course, eq(lesson.courseId, course.id))
    .innerJoin(program, eq(course.programId, program.id))
    .where(eq(lesson.id, lessonId))
    .get();

  if (
    !result ||
    result.courseId !== courseId ||
    result.programId !== programId ||
    result.teacherId !== userId
  ) {
    return null;
  }

  return result;
}

export async function getProgramWithCatalog(programId: string) {
  const currentProgram = await db.select().from(program).where(eq(program.id, programId)).get();

  if (!currentProgram) {
    return null;
  }

  const courses = await db
    .select()
    .from(course)
    .where(eq(course.programId, programId))
    .orderBy(asc(course.position));

  const lessons = await db
    .select()
    .from(lesson)
    .innerJoin(course, eq(lesson.courseId, course.id))
    .where(eq(course.programId, programId))
    .orderBy(asc(lesson.position));

  const lessonsByCourseId = new Map<string, typeof lessons>();
  for (const lessonItem of lessons) {
    const items = lessonsByCourseId.get(lessonItem.lesson.courseId) ?? [];
    items.push(lessonItem);
    lessonsByCourseId.set(lessonItem.lesson.courseId, items);
  }

  return {
    ...currentProgram,
    courses: courses.map((courseItem) => ({
      ...courseItem,
      lessons: (lessonsByCourseId.get(courseItem.id) ?? []).map(
        ({ lesson: lessonItem }) => lessonItem,
      ),
    })),
  };
}

export async function getLessonWithQuestions(lessonId: string) {
  const currentLesson = await db
    .select({
      lessonId: lesson.id,
      lessonName: lesson.name,
      lessonVideoUrl: lesson.videoUrl,
      lessonPosition: lesson.position,
      courseId: lesson.courseId,
      courseName: course.name,
      programId: program.id,
      programName: program.name,
      teacherId: program.teacherId,
    })
    .from(lesson)
    .innerJoin(course, eq(lesson.courseId, course.id))
    .innerJoin(program, eq(course.programId, program.id))
    .where(eq(lesson.id, lessonId))
    .get();

  if (!currentLesson) {
    return null;
  }

  const questions = await db
    .select()
    .from(question)
    .where(eq(question.lessonId, lessonId))
    .orderBy(asc(question.position));

  const options = await db
    .select()
    .from(questionOption)
    .innerJoin(question, eq(questionOption.questionId, question.id))
    .where(eq(question.lessonId, lessonId))
    .orderBy(asc(questionOption.position));

  const [rows, gridAnswers] = await Promise.all([
    db
      .select()
      .from(questionRow)
      .innerJoin(question, eq(questionRow.questionId, question.id))
      .where(eq(question.lessonId, lessonId))
      .orderBy(asc(questionRow.position)),
    db
      .select({
        optionId: questionGridAnswer.questionOptionId,
        rowPosition: questionRow.position,
      })
      .from(questionGridAnswer)
      .innerJoin(questionOption, eq(questionGridAnswer.questionOptionId, questionOption.id))
      .innerJoin(questionRow, eq(questionGridAnswer.questionRowId, questionRow.id))
      .innerJoin(question, eq(questionOption.questionId, question.id))
      .where(eq(question.lessonId, lessonId)),
  ]);

  const correctRowsByOptionId = new Map<string, number[]>();
  for (const gridAnswer of gridAnswers) {
    const correctRows = correctRowsByOptionId.get(gridAnswer.optionId) ?? [];
    correctRows.push(gridAnswer.rowPosition);
    correctRowsByOptionId.set(gridAnswer.optionId, correctRows);
  }

  const optionsByQuestionId = new Map<string, typeof options>();
  for (const optionItem of options) {
    const items = optionsByQuestionId.get(optionItem.question_option.questionId) ?? [];
    items.push(optionItem);
    optionsByQuestionId.set(optionItem.question_option.questionId, items);
  }

  const rowsByQuestionId = new Map<string, typeof rows>();
  for (const rowItem of rows) {
    const items = rowsByQuestionId.get(rowItem.question_row.questionId) ?? [];
    items.push(rowItem);
    rowsByQuestionId.set(rowItem.question_row.questionId, items);
  }

  return {
    lesson: {
      id: currentLesson.lessonId,
      name: currentLesson.lessonName,
      videoUrl: currentLesson.lessonVideoUrl,
      position: currentLesson.lessonPosition,
      courseId: currentLesson.courseId,
    },
    course: {
      id: currentLesson.courseId,
      name: currentLesson.courseName,
      programId: currentLesson.programId,
    },
    program: {
      id: currentLesson.programId,
      name: currentLesson.programName,
      teacherId: currentLesson.teacherId,
    },
    questions: questions.map((questionItem) => ({
      ...questionItem,
      options: (optionsByQuestionId.get(questionItem.id) ?? []).map(
        ({ question_option: optionItem }) => ({
          ...optionItem,
          correctRows: correctRowsByOptionId.get(optionItem.id),
        }),
      ),
      rows: (rowsByQuestionId.get(questionItem.id) ?? []).map(
        ({ question_row: rowItem }) => rowItem,
      ),
    })),
  };
}

export async function getNextPosition(
  table:
    | typeof course
    | typeof lesson
    | typeof question
    | typeof questionOption
    | typeof questionRow,
  positionColumn:
    | typeof course.position
    | typeof lesson.position
    | typeof question.position
    | typeof questionOption.position
    | typeof questionRow.position,
  parentColumn:
    | typeof course.programId
    | typeof lesson.courseId
    | typeof question.lessonId
    | typeof questionOption.questionId
    | typeof questionRow.questionId,
  parentId: string,
) {
  const [result] = await db
    .select({
      max: sql<number>`coalesce(max(${positionColumn}), -1)`,
    })
    .from(table)
    .where(eq(parentColumn, parentId));

  return (result?.max ?? -1) + 1;
}
