import type { Context, Next } from "hono";
import type { HonoEnv } from "..";
import { routes } from "../routes";

export function requireAuth() {
  return async (c: Context<HonoEnv>, next: Next) => {
    const session = c.var.session;

    if (!session) {
      return c.redirect(routes.auth.$login);
    }

    await next();
  };
}

export function requireRole(allowedRoles: string[]) {
  return async (c: Context<HonoEnv>, next: Next) => {
    const session = c.var.session;

    if (!session) {
      return c.redirect(routes.auth.$login);
    }

    const userRole = session.user?.role;

    if (!userRole || !allowedRoles.includes(userRole)) {
      return c.html(
        "<h1>Access Denied</h1><p>You do not have permission to access this page.</p>",
        403,
      );
    }

    await next();
  };
}
