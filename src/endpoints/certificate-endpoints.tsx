import { and, desc, eq } from "drizzle-orm";
import { Hono } from "hono";
import type { HonoEnv } from "..";
import { db } from "../db";
import { assessment, assessmentAttempt, course, program, user } from "../db/schema";
import { buildCertificatePdf } from "../features/certificates";
import { getProgramEnrollment } from "../features/enrollment";
import { routes } from "../routes";

const certificatePath = routes.programs.$(":programId").courses.$(":courseId").$certificate;

export const certificateEndpoints = new Hono<HonoEnv>();

certificateEndpoints.get(certificatePath, async (c) => {
  const currentUser = c.var.session?.user;
  if (!currentUser?.id || currentUser.role !== "student") {
    return c.redirect(routes.auth.$login);
  }

  const programId = c.req.param("programId");
  const courseId = c.req.param("courseId");
  const enrollment = await getProgramEnrollment(currentUser.id, programId);
  if (!enrollment) {
    return c.text("Certificate unavailable", 404);
  }

  const finalAttempt = await db
    .select({
      assessmentTitle: assessment.title,
      courseName: course.name,
      studentName: user.name,
      submittedAt: assessmentAttempt.submittedAt,
      teacherName: program.teacherId,
    })
    .from(assessmentAttempt)
    .innerJoin(assessment, eq(assessmentAttempt.assessmentId, assessment.id))
    .innerJoin(course, eq(assessment.courseId, course.id))
    .innerJoin(program, eq(course.programId, program.id))
    .innerJoin(user, eq(assessmentAttempt.studentId, user.id))
    .where(
      and(
        eq(assessment.kind, "final"),
        eq(assessment.courseId, courseId),
        eq(course.programId, programId),
        eq(assessmentAttempt.studentId, currentUser.id),
        eq(assessmentAttempt.status, "passed"),
      ),
    )
    .orderBy(desc(assessmentAttempt.submittedAt))
    .get();

  if (!finalAttempt) {
    return c.text("Certificate unavailable", 404);
  }

  const teacher = await db
    .select({ name: user.name })
    .from(program)
    .innerJoin(user, eq(program.teacherId, user.id))
    .where(eq(program.id, programId))
    .get();

  if (!teacher) {
    return c.text("Certificate unavailable", 404);
  }

  const completionDate = finalAttempt.submittedAt.toISOString().slice(0, 10);
  const pdf = buildCertificatePdf([
    "Akademija Ibn Usejmin Certificate",
    `Student: ${finalAttempt.studentName}`,
    `Book title: ${finalAttempt.courseName}`,
    `Completion date: ${completionDate}`,
    `Teacher signature: ${teacher.name}`,
  ]);

  c.header("Content-Type", "application/pdf");
  c.header("Content-Disposition", `attachment; filename="${courseId}-certificate.pdf"`);
  return c.body(pdf);
});
