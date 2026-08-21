import { Hono } from "hono";
import type { HonoEnv } from "..";
import {
  getAssessmentPageForStudent,
  publishAssessmentForTeacher,
  submitAssessmentForStudent,
} from "../features/assessment-service";
import { routes } from "../routes";
import { AssessmentPage } from "../ui/programs/AssessmentPage";

const coursePath = routes.programs.$(":programId").courses.$(":courseId");
const assessmentPath = coursePath.assessments.$(":assessmentId");

export const assessmentEndpoints = new Hono<HonoEnv>();

assessmentEndpoints.post(coursePath.assessments.$weekly, async (c) => {
  const currentUser = c.var.session?.user;
  if (!currentUser?.id) {
    return c.redirect(routes.auth.$login);
  }

  const programId = c.req.param("programId");
  const courseId = c.req.param("courseId");
  const result = await publishAssessmentForTeacher({
    teacherId: currentUser.id,
    programId,
    courseId,
    kind: "weekly",
    formData: await c.req.formData(),
  });
  if (!result.ok && result.error === "not-found") {
    return c.text("Course not found", 404);
  }
  if (!result.ok) {
    return c.text("Invalid assessment", 400);
  }

  return c.redirect(result.value.redirectTo);
});

assessmentEndpoints.post(coursePath.assessments.$final, async (c) => {
  const currentUser = c.var.session?.user;
  if (!currentUser?.id) {
    return c.redirect(routes.auth.$login);
  }

  const programId = c.req.param("programId");
  const courseId = c.req.param("courseId");
  const result = await publishAssessmentForTeacher({
    teacherId: currentUser.id,
    programId,
    courseId,
    kind: "final",
    formData: await c.req.formData(),
  });
  if (!result.ok && result.error === "not-found") {
    return c.text("Course not found", 404);
  }
  if (!result.ok) {
    return c.text("Invalid assessment", 400);
  }

  return c.redirect(result.value.redirectTo);
});

assessmentEndpoints.get(assessmentPath.toString(), async (c) => {
  const currentUser = c.var.session?.user;
  if (!currentUser?.id || currentUser.role !== "student") {
    return c.redirect(routes.auth.$login);
  }

  const courseId = c.req.param("courseId");
  const programId = c.req.param("programId");
  const assessmentId = c.req.param("assessmentId");
  const pageModel = await getAssessmentPageForStudent({
    studentId: currentUser.id,
    programId,
    courseId,
    assessmentId,
  });
  if (!pageModel.ok) {
    return c.text("Assessment unavailable", 404);
  }

  return c.render(<AssessmentPage {...pageModel.value} />);
});

assessmentEndpoints.post(assessmentPath.$submit, async (c) => {
  const currentUser = c.var.session?.user;
  if (!currentUser?.id || currentUser.role !== "student") {
    return c.redirect(routes.auth.$login);
  }

  const courseId = c.req.param("courseId");
  const programId = c.req.param("programId");
  const assessmentId = c.req.param("assessmentId");
  const result = await submitAssessmentForStudent({
    studentId: currentUser.id,
    programId,
    courseId,
    assessmentId,
    formData: await c.req.formData(),
  });
  if (!result.ok) {
    return c.text("Assessment unavailable", 404);
  }

  return c.redirect(result.value.redirectTo);
});
