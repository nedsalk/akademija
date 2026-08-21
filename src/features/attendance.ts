import { and, asc, eq } from "drizzle-orm";
import { db } from "../db";
import {
  attendanceRule,
  attendanceViolation,
  course,
  lesson,
  lessonCompletion,
  program,
  programEnrollment,
  user,
} from "../db/schema";
import { createAttendanceRule, evaluateAttendance } from "../domain/attendance";
import { now } from "../domain/clock";
import { notifyTeacherOfAttendanceViolation } from "./notifications";

export async function saveAttendanceRule(courseId: string, maxConsecutiveMissedLessons: number) {
  const rule = createAttendanceRule(maxConsecutiveMissedLessons);
  if (!rule.ok) {
    return rule;
  }

  const currentTime = now();
  const existing = await db.query.attendanceRule.findFirst({
    where: eq(attendanceRule.courseId, courseId),
  });

  if (existing) {
    await db
      .update(attendanceRule)
      .set({
        maxConsecutiveMissedLessons: rule.value.maxConsecutiveMissedLessons,
        updatedAt: currentTime,
      })
      .where(eq(attendanceRule.id, existing.id));
    return { ok: true as const, value: rule.value };
  }

  await db.insert(attendanceRule).values({
    courseId,
    maxConsecutiveMissedLessons: rule.value.maxConsecutiveMissedLessons,
    createdAt: currentTime,
    updatedAt: currentTime,
  });

  return { ok: true as const, value: rule.value };
}

export async function getAttendanceRule(courseId: string) {
  return db.query.attendanceRule.findFirst({
    where: eq(attendanceRule.courseId, courseId),
  });
}

export async function evaluateAttendanceForCourse(courseId: string) {
  const rule = await getAttendanceRule(courseId);
  if (!rule) {
    return [];
  }

  const enrollments = await db
    .select({
      startsOn: programEnrollment.startsOn,
      studentId: programEnrollment.studentId,
      teacherId: program.teacherId,
    })
    .from(programEnrollment)
    .innerJoin(
      course,
      and(eq(programEnrollment.programId, course.programId), eq(course.id, courseId)),
    )
    .innerJoin(program, eq(course.programId, program.id))
    .where(eq(course.id, courseId));

  const currentTime = now();
  const results = [];

  for (const enrollment of enrollments) {
    const completions = await db
      .select({ completedAt: lessonCompletion.completedAt })
      .from(lessonCompletion)
      .innerJoin(lesson, eq(lessonCompletion.lessonId, lesson.id))
      .where(
        and(eq(lesson.courseId, courseId), eq(lessonCompletion.studentId, enrollment.studentId)),
      );

    const validatedRule = createAttendanceRule(rule.maxConsecutiveMissedLessons);
    if (!validatedRule.ok) {
      throw new Error("Stored attendance rule is invalid");
    }
    const mostRecentCompletionAt = completions.reduce<Date | null>(
      (latest, completion) =>
        !latest || completion.completedAt > latest ? completion.completedAt : latest,
      null,
    );
    const evaluation = evaluateAttendance({
      rule: validatedRule.value,
      enrollmentStartedAt: new Date(`${enrollment.startsOn}T00:00:00.000Z`),
      evaluatedAt: currentTime,
      mostRecentCompletionAt,
    });
    const missedCount = evaluation.consecutiveMissedLessons;

    const existing = await db.query.attendanceViolation.findFirst({
      where: and(
        eq(attendanceViolation.courseId, courseId),
        eq(attendanceViolation.studentId, enrollment.studentId),
      ),
      orderBy: [asc(attendanceViolation.createdAt)],
    });

    if (evaluation.violation) {
      if (existing) {
        await db
          .update(attendanceViolation)
          .set({
            consecutiveMissedLessons: missedCount,
            updatedAt: currentTime,
          })
          .where(eq(attendanceViolation.id, existing.id));
      } else {
        const [created] = await db
          .insert(attendanceViolation)
          .values({
            courseId,
            studentId: enrollment.studentId,
            consecutiveMissedLessons: missedCount,
            status: "open",
            createdAt: currentTime,
            updatedAt: currentTime,
          })
          .returning();
        if (created) {
          await notifyTeacherOfAttendanceViolation({
            teacherId: enrollment.teacherId,
            violationId: created.id,
            studentId: enrollment.studentId,
          });
        }
      }
    } else if (existing) {
      await db.delete(attendanceViolation).where(eq(attendanceViolation.id, existing.id));
    }

    results.push({
      missedCount,
      studentId: enrollment.studentId,
    });
  }

  return results;
}

export async function listAttendanceViolations(courseId: string) {
  return db
    .select({
      id: attendanceViolation.id,
      studentId: attendanceViolation.studentId,
      studentName: user.name,
      consecutiveMissedLessons: attendanceViolation.consecutiveMissedLessons,
      status: attendanceViolation.status,
    })
    .from(attendanceViolation)
    .innerJoin(user, eq(attendanceViolation.studentId, user.id))
    .where(eq(attendanceViolation.courseId, courseId))
    .orderBy(asc(attendanceViolation.createdAt));
}

export async function acknowledgeAttendanceViolation(args: { courseId: string; id: string }) {
  const [updatedViolation] = await db
    .update(attendanceViolation)
    .set({
      status: "acknowledged",
      updatedAt: now(),
    })
    .where(
      and(eq(attendanceViolation.id, args.id), eq(attendanceViolation.courseId, args.courseId)),
    )
    .returning({ id: attendanceViolation.id });

  return Boolean(updatedViolation);
}
