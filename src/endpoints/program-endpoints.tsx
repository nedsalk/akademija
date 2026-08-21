import { eq } from "drizzle-orm";
import { Hono } from "hono";
import type { HonoEnv } from "..";
import { db } from "../db";
import { program } from "../db/schema";
import { now } from "../domain/clock";
import { getOwnedProgram } from "../features/catalog";
import { requestProgramEnrollment } from "../features/enrollment";
import {
  canManagePrograms,
  getProgramPageForViewer,
  getProgramsPageForViewer,
} from "../features/program-page-service";
import { routes } from "../routes";
import { ProgramDetailPage } from "../ui/programs/ProgramDetailPage";
import { ProgramsPage } from "../ui/programs/ProgramsPage";

export const programEndpoints = new Hono<HonoEnv>();

programEndpoints.get(routes.$programs, async (c) => {
  const currentUser = c.var.session?.user;
  if (!currentUser?.id) {
    return c.redirect(routes.auth.$login);
  }

  const pageModel = await getProgramsPageForViewer({
    userId: currentUser.id,
    role: currentUser.role,
  });

  return c.render(<ProgramsPage {...pageModel} />);
});

programEndpoints.post(routes.$programs, async (c) => {
  const currentUser = c.var.session?.user;
  if (!currentUser?.id || !canManagePrograms(currentUser.role)) {
    return c.html("<h1>Access Denied</h1>", 403);
  }

  const formData = await c.req.formData();
  const name = formData.get("name")?.toString().trim();

  if (!name) {
    return c.text("Program name is required", 400);
  }

  const currentTime = now();
  await db.insert(program).values({
    name,
    teacherId: currentUser.id,
    createdAt: currentTime,
    updatedAt: currentTime,
  });

  return c.redirect(routes.$programs);
});

programEndpoints.get(routes.programs.$(":programId").toString(), async (c) => {
  const currentUser = c.var.session?.user;
  if (!currentUser?.id) {
    return c.redirect(routes.auth.$login);
  }

  const programId = c.req.param("programId");
  const pageModel = await getProgramPageForViewer({
    userId: currentUser.id,
    role: currentUser.role,
    programId,
  });
  if (!pageModel.ok) {
    return c.text("Program not found", 404);
  }

  return c.render(<ProgramDetailPage {...pageModel.value} />);
});

programEndpoints.post(routes.programs.$(":programId").$edit, async (c) => {
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
    return c.text("Program name is required", 400);
  }

  await db
    .update(program)
    .set({
      name,
      description,
      updatedAt: now(),
    })
    .where(eq(program.id, programId));

  return c.redirect(routes.programs.$(programId).toString());
});

programEndpoints.post(routes.programs.$(":programId").$enroll, async (c) => {
  const currentUser = c.var.session?.user;

  if (!currentUser?.id) {
    return c.redirect(routes.auth.$login);
  }

  if (currentUser.role !== "student") {
    return c.text("Only students can request enrollment in programs", 403);
  }

  await requestProgramEnrollment(currentUser.id, c.req.param("programId"));
  return c.redirect(routes.$programs);
});
