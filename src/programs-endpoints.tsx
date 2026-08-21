import { Hono } from "hono";
import type { HonoEnv } from ".";
import { assessmentEndpoints } from "./endpoints/assessment-endpoints";
import { certificateEndpoints } from "./endpoints/certificate-endpoints";
import { courseEndpoints } from "./endpoints/course-endpoints";
import { lessonEndpoints } from "./endpoints/lesson-endpoints";
import { programEndpoints } from "./endpoints/program-endpoints";
import { requireAuth } from "./middleware/auth-middleware";
import { routes } from "./routes";

export const programsEndpoints = new Hono<HonoEnv>();

programsEndpoints.use(`${routes.$programs}/*`, requireAuth());
programsEndpoints.use(routes.$programs, requireAuth());

programsEndpoints.route("/", programEndpoints);
programsEndpoints.route("/", courseEndpoints);
programsEndpoints.route("/", lessonEndpoints);
programsEndpoints.route("/", assessmentEndpoints);
programsEndpoints.route("/", certificateEndpoints);
