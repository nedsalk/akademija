import { asc, eq } from "drizzle-orm";
import { db } from "../db";
import { course, lesson, textbook } from "../db/schema";
import { getAssessmentAccess } from "../domain/assessments";
import { now } from "../domain/clock";
import { routes } from "../routes";
import type { CourseDetailPageProps } from "../ui/programs/CourseDetailPage";
import {
  getCourseAssessments,
  getLatestAssessmentAttempt,
  hasCompletedCourse,
  listCourseQuestions,
} from "./assessments";
import { getAttendanceRule, listAttendanceViolations } from "./attendance";
import { getOwnedCourse } from "./catalog";
import { getCompletedLessonIdsForProgram, getProgramEnrollment } from "./enrollment";
import { getLessonAvailability } from "./lesson-availability";

export async function getCoursePageForViewer(args: {
  userId: string;
  role?: string;
  programId: string;
  courseId: string;
}) {
  const enrollment =
    args.role === "student" ? await getProgramEnrollment(args.userId, args.programId) : null;
  const canManageCourse = Boolean(await getOwnedCourse(args.userId, args.programId, args.courseId));

  const currentCourse = await db
    .select({
      course,
      textbook,
    })
    .from(course)
    .leftJoin(textbook, eq(course.textbookId, textbook.id))
    .where(eq(course.id, args.courseId))
    .get();

  if (!currentCourse || currentCourse.course.programId !== args.programId) {
    return { ok: false as const, error: "not-found" as const };
  }

  const lessonList = await db
    .select()
    .from(lesson)
    .where(eq(lesson.courseId, args.courseId))
    .orderBy(asc(lesson.position));
  const completedLessonIds =
    args.role === "student" && enrollment
      ? await getCompletedLessonIdsForProgram(args.userId, args.programId)
      : new Set<string>();
  const lessonAvailability = getLessonAvailability(lessonList, completedLessonIds);
  const assessments = await getCourseAssessments(args.courseId);
  const weeklyAssessment = assessments.find((item) => item.kind === "weekly");
  const finalAssessment = assessments.find((item) => item.kind === "final");
  const latestFinalAttempt =
    args.role === "student" && finalAssessment
      ? await getLatestAssessmentAttempt(finalAssessment.id, args.userId)
      : null;
  const courseCompleted =
    args.role === "student" ? await hasCompletedCourse(args.userId, args.courseId) : false;
  const weeklyQuestionPool = canManageCourse ? await listCourseQuestions(args.courseId, 7) : [];
  const finalQuestionPool = canManageCourse ? await listCourseQuestions(args.courseId) : [];
  const attendanceRule = canManageCourse ? await getAttendanceRule(args.courseId) : null;
  const attendanceViolations = canManageCourse ? await listAttendanceViolations(args.courseId) : [];
  const currentTime = now();
  const finalAccess = finalAssessment
    ? getAssessmentAccess({
        kind: finalAssessment.kind,
        now: currentTime,
        courseCompleted,
        latestAttempt: latestFinalAttempt ?? null,
        window: {
          opensAt: finalAssessment.opensAt,
          closesAt: finalAssessment.closesAt,
        },
      })
    : null;
  const weeklyAccess = weeklyAssessment
    ? getAssessmentAccess({
        kind: weeklyAssessment.kind,
        now: currentTime,
        courseCompleted,
        latestAttempt: null,
        window: {
          opensAt: weeklyAssessment.opensAt,
          closesAt: weeklyAssessment.closesAt,
        },
      })
    : null;

  const value: CourseDetailPageProps = {
    attendanceRule: attendanceRule?.maxConsecutiveMissedLessons ?? null,
    attendanceViolations,
    canManageCourse,
    certificateHref:
      args.role === "student" && latestFinalAttempt?.status === "passed"
        ? routes.programs.$(args.programId).courses.$(args.courseId).$certificate
        : undefined,
    courseId: args.courseId,
    description: currentCourse.course.description,
    finalAssessment: finalAssessment
      ? {
          href:
            args.role === "student" && finalAccess?.available && finalAccess.canSubmit
              ? routes.programs
                  .$(args.programId)
                  .courses.$(args.courseId)
                  .assessments.$(finalAssessment.id)
                  .toString()
              : undefined,
          retryAvailableOn:
            latestFinalAttempt?.status === "failed" &&
            latestFinalAttempt.retryAvailableAt &&
            !finalAccess?.canSubmit
              ? latestFinalAttempt.retryAvailableAt.toISOString().slice(0, 10)
              : undefined,
          title: finalAssessment.title,
        }
      : null,
    finalQuestionPool: finalQuestionPool.map((question) => ({
      id: question.id,
      text: question.text,
    })),
    lessonList: lessonList.map((lessonItem) => ({
      ...lessonItem,
      isAvailable:
        canManageCourse || (enrollment ? (lessonAvailability.get(lessonItem.id) ?? false) : false),
      isCompleted: completedLessonIds.has(lessonItem.id),
    })),
    name: currentCourse.course.name,
    programId: args.programId,
    textbook: currentCourse.textbook,
    weeklyAssessment: weeklyAssessment
      ? {
          href:
            args.role === "student" && weeklyAccess?.available
              ? routes.programs
                  .$(args.programId)
                  .courses.$(args.courseId)
                  .assessments.$(weeklyAssessment.id)
                  .toString()
              : undefined,
          title: weeklyAssessment.title,
        }
      : null,
    weeklyQuestionPool: weeklyQuestionPool.map((question) => ({
      id: question.id,
      text: question.text,
    })),
  };

  return { ok: true as const, value };
}
