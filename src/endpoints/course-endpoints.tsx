import { eq } from "drizzle-orm";
import { Hono } from "hono";
import type { HonoEnv } from "..";
import { db } from "../db";
import { course, textbook } from "../db/schema";
import { now } from "../domain/clock";
import {
  acknowledgeAttendanceViolation,
  evaluateAttendanceForCourse,
  saveAttendanceRule,
} from "../features/attendance";
import { getNextPosition, getOwnedCourse, getOwnedProgram } from "../features/catalog";
import { getCoursePageForViewer } from "../features/course-page-service";
import { routes } from "../routes";
import { CourseDetailPage } from "../ui/programs/CourseDetailPage";

const programPath = routes.programs.$(":programId");
const coursePath = programPath.courses.$(":courseId");
const attendancePath = coursePath.attendance;

export const courseEndpoints = new Hono<HonoEnv>();

courseEndpoints.post(programPath.$courses, async (c) => {
  const currentUser = c.var.session?.user;
  if (!currentUser?.id) {
    return c.redirect(routes.auth.$login);
  }

  const programId = c.req.param("programId");
  const currentProgram = await getOwnedProgram(currentUser.id, programId);
  if (!currentProgram) {
    return c.text("Program not found", 404);
  }

  const formData = await c.req.formData();
  const name = formData.get("name")?.toString().trim();
  const description = formData.get("description")?.toString().trim() ?? "";

  if (!name) {
    return c.text("Course name is required", 400);
  }

  const currentTime = now();
  await db.insert(course).values({
    name,
    description,
    position: await getNextPosition(course, course.position, course.programId, programId),
    programId,
    createdAt: currentTime,
    updatedAt: currentTime,
  });

  return c.redirect(routes.programs.$(programId).toString());
});

courseEndpoints.get(coursePath.toString(), async (c) => {
  const currentUser = c.var.session?.user;
  if (!currentUser?.id) {
    return c.redirect(routes.auth.$login);
  }

  const programId = c.req.param("programId");
  const courseId = c.req.param("courseId");
  const pageModel = await getCoursePageForViewer({
    userId: currentUser.id,
    role: currentUser.role,
    programId,
    courseId,
  });
  if (!pageModel.ok) {
    return c.text("Course not found", 404);
  }

  return c.render(<CourseDetailPage {...pageModel.value} />, {
    cssTemplate: "course-detail-template",
  });
});

courseEndpoints.post(coursePath.$textbook, async (c) => {
  const currentUser = c.var.session?.user;
  if (!currentUser?.id) {
    return c.redirect(routes.auth.$login);
  }

  const programId = c.req.param("programId");
  const courseId = c.req.param("courseId");
  const currentCourse = await getOwnedCourse(currentUser.id, programId, courseId);
  if (!currentCourse) {
    return c.text("Course not found", 404);
  }

  const formData = await c.req.formData();
  const title = formData.get("title")?.toString().trim();
  const author = formData.get("author")?.toString().trim();
  const description = formData.get("description")?.toString().trim();

  if (!title || !author || !description) {
    return c.text("Title, author, and description are required", 400);
  }

  const currentTime = now();
  const createdTextbook = await db
    .insert(textbook)
    .values({
      title,
      author,
      description,
      createdAt: currentTime,
      updatedAt: currentTime,
    })
    .returning({ id: textbook.id })
    .get();

  await db
    .update(course)
    .set({
      textbookId: createdTextbook.id,
      updatedAt: currentTime,
    })
    .where(eq(course.id, courseId));

  return c.redirect(routes.programs.$(programId).courses.$(courseId).toString());
});

courseEndpoints.post(coursePath.$delete, async (c) => {
  const currentUser = c.var.session?.user;
  if (!currentUser?.id) {
    return c.redirect(routes.auth.$login);
  }

  const programId = c.req.param("programId");
  const courseId = c.req.param("courseId");
  const currentCourse = await getOwnedCourse(currentUser.id, programId, courseId);
  if (!currentCourse) {
    return c.text("Course not found", 404);
  }

  await db.delete(course).where(eq(course.id, courseId));
  return c.redirect(routes.programs.$(programId).toString());
});

courseEndpoints.post(attendancePath.$rule, async (c) => {
  const currentUser = c.var.session?.user;
  if (!currentUser?.id) {
    return c.redirect(routes.auth.$login);
  }

  const programId = c.req.param("programId");
  const courseId = c.req.param("courseId");
  const currentCourse = await getOwnedCourse(currentUser.id, programId, courseId);
  if (!currentCourse) {
    return c.text("Course not found", 404);
  }

  const formData = await c.req.formData();
  const rule = await saveAttendanceRule(
    courseId,
    Number(formData.get("maxConsecutiveMissedLessons")?.toString() ?? "0"),
  );
  if (!rule.ok) {
    return c.text("Invalid attendance rule", 400);
  }

  return c.redirect(routes.programs.$(programId).courses.$(courseId).toString());
});

courseEndpoints.post(attendancePath.$evaluate, async (c) => {
  const currentUser = c.var.session?.user;
  if (!currentUser?.id) {
    return c.redirect(routes.auth.$login);
  }

  const programId = c.req.param("programId");
  const courseId = c.req.param("courseId");
  const currentCourse = await getOwnedCourse(currentUser.id, programId, courseId);
  if (!currentCourse) {
    return c.text("Course not found", 404);
  }

  await evaluateAttendanceForCourse(courseId);
  return c.redirect(routes.programs.$(programId).courses.$(courseId).toString());
});

courseEndpoints.post(attendancePath.$acknowledge, async (c) => {
  const currentUser = c.var.session?.user;
  if (!currentUser?.id) {
    return c.redirect(routes.auth.$login);
  }

  const programId = c.req.param("programId");
  const courseId = c.req.param("courseId");
  const currentCourse = await getOwnedCourse(currentUser.id, programId, courseId);
  if (!currentCourse) {
    return c.text("Course not found", 404);
  }

  const violationId = c.req.query("violationId");
  if (!violationId) {
    return c.text("Violation not found", 404);
  }

  const acknowledged = await acknowledgeAttendanceViolation({
    courseId,
    id: violationId,
  });
  if (!acknowledged) {
    return c.text("Violation not found", 404);
  }

  return c.redirect(routes.programs.$(programId).courses.$(courseId).toString());
});
