import { asc } from "drizzle-orm";
import { db } from "../db";
import { program } from "../db/schema";
import type { ProgramDetailPageProps } from "../ui/programs/ProgramDetailPage";
import { getProgramWithCatalog } from "./catalog";
import {
  getCompletedLessonIdsForProgram,
  getEnrollmentState,
  getProgramEnrollment,
} from "./enrollment";
import { getLessonAvailability } from "./lesson-availability";
import { syncStudentProgramNotifications } from "./notifications";

export function canManagePrograms(role?: string) {
  return role === "admin" || role === "teacher";
}

export async function getProgramsPageForViewer(args: { userId: string; role?: string }) {
  const [allPrograms, enrollmentState] = await Promise.all([
    db.select().from(program).orderBy(asc(program.name)),
    args.role === "student"
      ? getEnrollmentState(args.userId)
      : Promise.resolve({
          enrollmentByProgramId: new Map(),
          requestByProgramId: new Map(),
        }),
  ]);

  const programs = allPrograms.map((item) => {
    const request = enrollmentState.requestByProgramId.get(item.id);
    const enrollment = enrollmentState.enrollmentByProgramId.get(item.id);

    return {
      id: item.id,
      name: item.name,
      description: item.description,
      enrollmentStart: enrollment?.startsOn,
      isOwnedByViewer: item.teacherId === args.userId,
      requestStatus: request?.status,
    };
  });

  return {
    canManagePrograms: canManagePrograms(args.role),
    ownedPrograms: programs.filter((item) => item.isOwnedByViewer),
    programs,
  };
}

export async function getProgramPageForViewer(args: {
  userId: string;
  role?: string;
  programId: string;
}) {
  const currentProgram = await getProgramWithCatalog(args.programId);
  if (!currentProgram) {
    return { ok: false as const, error: "not-found" as const };
  }

  const canManageProgram = canManagePrograms(args.role) && currentProgram.teacherId === args.userId;
  const enrollment =
    args.role === "student" ? await getProgramEnrollment(args.userId, args.programId) : null;
  const completedLessonIds =
    args.role === "student" && enrollment
      ? await getCompletedLessonIdsForProgram(args.userId, args.programId)
      : new Set<string>();

  if (args.role === "student") {
    await syncStudentProgramNotifications(args.userId, args.programId);
  }

  const value: ProgramDetailPageProps = {
    canManageProgram,
    description: currentProgram.description,
    id: currentProgram.id,
    name: currentProgram.name,
    courseList: currentProgram.courses.map((course) => {
      const lessonAvailability = getLessonAvailability(course.lessons, completedLessonIds);

      return {
        ...course,
        lessons: course.lessons.map((lesson) => ({
          ...lesson,
          isAvailable:
            canManageProgram || (enrollment ? (lessonAvailability.get(lesson.id) ?? false) : false),
          isCompleted: completedLessonIds.has(lesson.id),
        })),
      };
    }),
  };

  return { ok: true as const, value };
}
