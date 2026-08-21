import { and, asc, eq } from "drizzle-orm";
import { db } from "../db";
import { notificationRecord, notificationSubscription, programEnrollment } from "../db/schema";
import { now, todayIsoDate } from "../domain/clock";
import type { NotificationKind } from "../domain/types";
import { getProgramWithCatalog } from "./catalog";
import { getCompletedLessonIdsForProgram } from "./enrollment";
import { getLessonAvailability } from "./lesson-availability";

function daysSince(startIsoDate: string, endIsoDate: string) {
  const start = new Date(`${startIsoDate}T00:00:00.000Z`).getTime();
  const end = new Date(`${endIsoDate}T00:00:00.000Z`).getTime();
  return Math.max(0, Math.floor((end - start) / (24 * 60 * 60 * 1000)));
}

export async function saveNotificationSubscription(userId: string, endpoint: string) {
  const currentTime = now();
  const existing = await db.query.notificationSubscription.findFirst({
    where: eq(notificationSubscription.userId, userId),
  });

  if (existing) {
    await db
      .update(notificationSubscription)
      .set({
        endpoint,
        updatedAt: currentTime,
      })
      .where(eq(notificationSubscription.id, existing.id));
    return existing;
  }

  const [created] = await db
    .insert(notificationSubscription)
    .values({
      userId,
      endpoint,
      createdAt: currentTime,
      updatedAt: currentTime,
    })
    .returning();

  return created ?? null;
}

export async function getNotificationSubscription(userId: string) {
  return db.query.notificationSubscription.findFirst({
    where: eq(notificationSubscription.userId, userId),
  });
}

export async function listNotificationRecords(recipientUserId: string) {
  return db
    .select({
      id: notificationRecord.id,
      kind: notificationRecord.kind,
      title: notificationRecord.title,
      body: notificationRecord.body,
      status: notificationRecord.status,
      dedupeKey: notificationRecord.dedupeKey,
    })
    .from(notificationRecord)
    .where(eq(notificationRecord.recipientUserId, recipientUserId))
    .orderBy(asc(notificationRecord.createdAt));
}

export async function createNotificationRecord(args: {
  recipientUserId: string;
  kind: NotificationKind;
  title: string;
  body?: string;
  dedupeKey: string;
}) {
  const existing = await db.query.notificationRecord.findFirst({
    where: eq(notificationRecord.dedupeKey, args.dedupeKey),
  });
  if (existing) {
    return existing;
  }

  const currentTime = now();
  const [created] = await db
    .insert(notificationRecord)
    .values({
      recipientUserId: args.recipientUserId,
      kind: args.kind,
      title: args.title,
      body: args.body ?? "",
      dedupeKey: args.dedupeKey,
      createdAt: currentTime,
      updatedAt: currentTime,
    })
    .returning();

  return created ?? null;
}

export async function syncStudentProgramNotifications(studentId: string, programId: string) {
  const subscription = await getNotificationSubscription(studentId);
  if (!subscription) {
    return;
  }

  const [enrollment, programState, completedLessonIds] = await Promise.all([
    db.query.programEnrollment.findFirst({
      where: and(
        eq(programEnrollment.studentId, studentId),
        eq(programEnrollment.programId, programId),
      ),
    }),
    getProgramWithCatalog(programId),
    getCompletedLessonIdsForProgram(studentId, programId),
  ]);

  if (!enrollment || !programState) {
    return;
  }

  const today = todayIsoDate();

  for (const course of programState.courses) {
    const availability = getLessonAvailability(course.lessons, completedLessonIds);
    const availableLesson = course.lessons.find(
      (lesson) => availability.get(lesson.id) && !completedLessonIds.has(lesson.id),
    );

    if (!availableLesson) {
      continue;
    }

    await createNotificationRecord({
      recipientUserId: studentId,
      kind: "lesson_release",
      title: `New lesson available: ${availableLesson.name}`,
      body: course.name,
      dedupeKey: `lesson-release:${studentId}:${availableLesson.id}`,
    });

    if (availableLesson.position === 0 && daysSince(enrollment.startsOn, today) >= 1) {
      await createNotificationRecord({
        recipientUserId: studentId,
        kind: "lesson_reminder",
        title: `Lesson reminder: ${availableLesson.name}`,
        body: course.name,
        dedupeKey: `lesson-reminder:${studentId}:${availableLesson.id}`,
      });
    }
  }
}

export async function notifyTeacherOfDiscussionQuestion(args: {
  teacherId: string;
  lessonId: string;
  questionBody: string;
}) {
  await createNotificationRecord({
    recipientUserId: args.teacherId,
    kind: "discussion_question",
    title: "New lesson question submitted",
    body: args.questionBody,
    dedupeKey: `discussion-question:${args.teacherId}:${args.lessonId}:${args.questionBody}`,
  });
}

export async function notifyTeacherOfAttendanceViolation(args: {
  teacherId: string;
  violationId: string;
  studentId: string;
}) {
  await createNotificationRecord({
    recipientUserId: args.teacherId,
    kind: "attendance_violation",
    title: "Attendance violation detected",
    body: args.studentId,
    dedupeKey: `attendance-violation:${args.violationId}`,
  });
}
