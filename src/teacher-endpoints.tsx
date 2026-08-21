import { Hono } from "hono";
import type { HonoEnv } from ".";
import { getOwnedProgram } from "./features/catalog";
import {
  approveEnrollmentRequest,
  getTeacherEnrollmentRequests,
  rejectEnrollmentRequest,
} from "./features/enrollment";
import { requireRole } from "./middleware/auth-middleware";
import { routes } from "./routes";
import { EnrollmentsPage } from "./ui/enrollments/EnrollmentsPage";

export const teacherEndpoints = new Hono<HonoEnv>();

teacherEndpoints.use(`${routes.$teacher}/*`, requireRole(["admin", "teacher"]));
teacherEndpoints.use(routes.$enrollments, requireRole(["admin", "teacher"]));
teacherEndpoints.use(`${routes.$enrollments}/*`, requireRole(["admin", "teacher"]));

teacherEndpoints.get(routes.$teacher, (c) => {
  return c.render(
    <div>
      <h1>Teacher Dashboard</h1>
      <p>Welcome, {c.var.session?.user?.name}.</p>
      <ul>
        <li>
          <a href={routes.$programs}>Programs</a>
        </li>
        <li>
          <a href={routes.$enrollments}>Enrollments</a>
        </li>
      </ul>
    </div>,
  );
});

teacherEndpoints.get(routes.$enrollments, async (c) => {
  const currentUser = c.var.session?.user;
  if (!currentUser?.id) {
    return c.redirect(routes.auth.$login);
  }

  const enrollmentRequests = await getTeacherEnrollmentRequests(currentUser.id);

  return c.render(<EnrollmentsPage enrollmentRequests={enrollmentRequests} />);
});

teacherEndpoints.post(
  routes.enrollments.$(":programId").enrollmentRequests.$(":studentId").$approve,
  async (c) => {
    const currentUser = c.var.session?.user;
    if (!currentUser?.id) {
      return c.redirect(routes.auth.$login);
    }

    const programId = c.req.param("programId");
    const currentProgram = await getOwnedProgram(currentUser.id, programId);
    if (!currentProgram) {
      return c.text("Program not found", 404);
    }

    const approved = await approveEnrollmentRequest(programId, c.req.param("studentId"));
    if (!approved) {
      return c.text("Enrollment request not found", 404);
    }

    return c.redirect(routes.$enrollments);
  },
);

teacherEndpoints.post(
  routes.enrollments.$(":programId").enrollmentRequests.$(":studentId").$reject,
  async (c) => {
    const currentUser = c.var.session?.user;
    if (!currentUser?.id) {
      return c.redirect(routes.auth.$login);
    }

    const programId = c.req.param("programId");
    const currentProgram = await getOwnedProgram(currentUser.id, programId);
    if (!currentProgram) {
      return c.text("Program not found", 404);
    }

    const rejected = await rejectEnrollmentRequest(programId, c.req.param("studentId"));
    if (!rejected) {
      return c.text("Enrollment request not found", 404);
    }

    return c.redirect(routes.$enrollments);
  },
);
