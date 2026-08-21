import { eq } from "drizzle-orm";
import { Hono } from "hono";
import { getSession, type HonoEnv } from ".";
import { db } from "./db";
import * as schema from "./db/schema";
import { advanceDays, resetNow, setNow, setToday, todayIsoDate } from "./domain/clock";
import { parseUserRole } from "./domain/users";
import { getNotificationSubscription, listNotificationRecords } from "./features/notifications";
import { routes } from "./routes";

export const testEndpoints = new Hono<HonoEnv>();

// Only enable test endpoints in non-production environments
const isTestEnv = process.env.NODE_ENV !== "production";

if (!isTestEnv) {
  testEndpoints.all("*", (c) => {
    return c.json({ error: "Test endpoints not available in production" }, 404);
  });
} else {
  testEndpoints.get(routes.api.test.$getSession, async (c) => {
    const session = await getSession(c);

    return c.json(session);
  });

  testEndpoints.post(routes.api.test.$setNow, async (c) => {
    const body = await c.req.json();
    const isoDateTime = body.isoDateTime as string | undefined;
    const isoDate = body.isoDate as string | undefined;
    const advanceByDays = body.advanceByDays as number | undefined;

    try {
      if (typeof advanceByDays === "number") {
        advanceDays(advanceByDays);
      } else if (isoDateTime) {
        setNow(isoDateTime);
      } else if (isoDate) {
        setToday(isoDate);
      } else {
        return c.json({ error: "isoDateTime, isoDate, or advanceByDays is required" }, 400);
      }

      return c.json({ success: true, today: todayIsoDate() });
    } catch (error) {
      return c.json(
        {
          error: error instanceof Error ? error.message : "Invalid date value",
        },
        400,
      );
    }
  });

  testEndpoints.post(routes.api.test.$resetNow, (c) => {
    resetNow();
    return c.json({ success: true, today: todayIsoDate() });
  });

  testEndpoints.get(routes.api.test.$notifications, async (c) => {
    const session = await getSession(c);
    if (!session?.user?.id) {
      return c.json({ error: "Unauthorized" }, 401);
    }

    const [subscription, notifications] = await Promise.all([
      getNotificationSubscription(session.user.id),
      listNotificationRecords(session.user.id),
    ]);

    return c.json({
      notifications,
      subscription,
    });
  });

  // API endpoint to set user role (test-only)
  testEndpoints.post(routes.api.test.$setRole, async (c) => {
    const body = await c.req.json();
    const id = body.id as string;
    const role = body.role as string;

    if (!id || !role) {
      return c.json({ error: "Email and role are required" }, 400);
    }

    const parsedRole = parseUserRole(role);
    if (!parsedRole.ok) {
      return c.json({ error: parsedRole.error }, 400);
    }

    try {
      await db.update(schema.user).set({ role: parsedRole.value }).where(eq(schema.user.id, id));

      return c.json({ success: true });
    } catch {
      return c.json({ error: "Failed to update role" }, 500);
    }
  });
}
