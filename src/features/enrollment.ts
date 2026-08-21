import { and, asc, eq } from "drizzle-orm";
import { db } from "../db";
import {
  course,
  lesson,
  lessonCompletion,
  lessonListen,
  program,
  programEnrollment,
  programEnrollmentRequest,
  user,
} from "../db/schema";
import { now, todayIsoDate } from "../domain/clock";

export async function getEnrollmentState(studentId: string) {
  const [requests, enrollments] = await Promise.all([
    db
      .select()
      .from(programEnrollmentRequest)
      .where(eq(programEnrollmentRequest.studentId, studentId)),
    db.select().from(programEnrollment).where(eq(programEnrollment.studentId, studentId)),
  ]);

  return {
    enrollmentByProgramId: new Map(enrollments.map((item) => [item.programId, item])),
    requestByProgramId: new Map(requests.map((item) => [item.programId, item])),
  };
}

export async function getTeacherEnrollmentRequests(teacherId: string) {
  const items = await db
    .select({
      programId: program.id,
      programName: program.name,
      startsOn: programEnrollment.startsOn,
      status: programEnrollmentRequest.status,
      studentEmail: user.email,
      studentId: user.id,
      studentName: user.name,
      studentPhone: user.phone,
    })
    .from(programEnrollmentRequest)
    .innerJoin(program, eq(programEnrollmentRequest.programId, program.id))
    .innerJoin(user, eq(programEnrollmentRequest.studentId, user.id))
    .leftJoin(
      programEnrollment,
      and(
        eq(programEnrollmentRequest.studentId, programEnrollment.studentId),
        eq(programEnrollmentRequest.programId, programEnrollment.programId),
      ),
    )
    .where(eq(program.teacherId, teacherId))
    .orderBy(asc(program.name), asc(user.name), asc(programEnrollmentRequest.createdAt));

  return items.map((item) => ({
    ...item,
    startsOn: item.startsOn ?? undefined,
  }));
}

export async function requestProgramEnrollment(studentId: string, programId: string) {
  const existing = await db.query.programEnrollmentRequest.findFirst({
    where: and(
      eq(programEnrollmentRequest.studentId, studentId),
      eq(programEnrollmentRequest.programId, programId),
    ),
  });

  if (existing) {
    return existing;
  }

  const currentTime = now();

  const [created] = await db
    .insert(programEnrollmentRequest)
    .values({
      studentId,
      programId,
      status: "pending",
      createdAt: currentTime,
      updatedAt: currentTime,
    })
    .returning();

  return created ?? null;
}

export async function getProgramEnrollment(studentId: string, programId: string) {
  return db.query.programEnrollment.findFirst({
    where: and(
      eq(programEnrollment.studentId, studentId),
      eq(programEnrollment.programId, programId),
    ),
  });
}

export async function getCompletedLessonIdsForProgram(studentId: string, programId: string) {
  const completedLessons = await db
    .select({
      lessonId: lessonCompletion.lessonId,
    })
    .from(lessonCompletion)
    .innerJoin(lesson, eq(lessonCompletion.lessonId, lesson.id))
    .innerJoin(course, eq(lesson.courseId, course.id))
    .where(and(eq(lessonCompletion.studentId, studentId), eq(course.programId, programId)));

  return new Set(completedLessons.map((item) => item.lessonId));
}

export async function completeLessonForStudent(studentId: string, lessonId: string) {
  const currentTime = now();

  await db
    .insert(lessonCompletion)
    .values({
      studentId,
      lessonId,
      completedAt: currentTime,
      createdAt: currentTime,
      updatedAt: currentTime,
    })
    .onConflictDoNothing();
}

export async function markLessonListenedForStudent(studentId: string, lessonId: string) {
  const currentTime = now();

  await db
    .insert(lessonListen)
    .values({
      studentId,
      lessonId,
      listenedAt: currentTime,
      createdAt: currentTime,
      updatedAt: currentTime,
    })
    .onConflictDoNothing();
}

export async function getLessonListenForStudent(studentId: string, lessonId: string) {
  return db.query.lessonListen.findFirst({
    where: and(eq(lessonListen.studentId, studentId), eq(lessonListen.lessonId, lessonId)),
  });
}

export async function getCourseLessons(courseId: string) {
  return db
    .select({
      id: lesson.id,
      position: lesson.position,
    })
    .from(lesson)
    .where(eq(lesson.courseId, courseId))
    .orderBy(asc(lesson.position));
}

export async function approveEnrollmentRequest(programId: string, studentId: string) {
  const currentTime = now();
  const startsOn = todayIsoDate();

  return db.transaction(async (tx) => {
    const [updatedRequest] = await tx
      .update(programEnrollmentRequest)
      .set({
        status: "approved",
        decidedAt: currentTime,
        updatedAt: currentTime,
      })
      .where(
        and(
          eq(programEnrollmentRequest.programId, programId),
          eq(programEnrollmentRequest.studentId, studentId),
          eq(programEnrollmentRequest.status, "pending"),
        ),
      )
      .returning({ id: programEnrollmentRequest.id });

    if (!updatedRequest) {
      return false;
    }

    await tx
      .insert(programEnrollment)
      .values({
        studentId,
        programId,
        startsOn,
        createdAt: currentTime,
        updatedAt: currentTime,
      })
      .onConflictDoNothing();

    return true;
  });
}

export async function rejectEnrollmentRequest(programId: string, studentId: string) {
  const currentTime = now();

  const [updatedRequest] = await db
    .update(programEnrollmentRequest)
    .set({
      status: "rejected",
      decidedAt: currentTime,
      updatedAt: currentTime,
    })
    .where(
      and(
        eq(programEnrollmentRequest.programId, programId),
        eq(programEnrollmentRequest.studentId, studentId),
        eq(programEnrollmentRequest.status, "pending"),
      ),
    )
    .returning({ id: programEnrollmentRequest.id });

  return Boolean(updatedRequest);
}
