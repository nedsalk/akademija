import { eq } from "drizzle-orm";
import { Hono } from "hono";
import type { HonoEnv } from ".";
import { db } from "./db";
import * as schema from "./db/schema";
import { parseUserRole } from "./domain/users";
import { requireRole } from "./middleware/auth-middleware";
import { routes } from "./routes";

export const adminEndpoints = new Hono<HonoEnv>();
adminEndpoints.use(`${routes.$admin}/*`, requireRole(["admin"]));

// Admin dashboard
adminEndpoints.get(routes.$admin, (c) => {
  return c.render(
    <>
      <h1>Admin Dashboard</h1>
      <p>Welcome to the admin panel. You have full system access.</p>
      <nav>
        <a href={`${routes.$admin}/users`}>Manage Users</a>
      </nav>
    </>,
  );
});

// User management page
adminEndpoints.get(routes.admin.$users, async (c) => {
  const users = await db.select().from(schema.user);

  return c.render(
    <>
      <h1>Manage Users</h1>
      <p>
        <a href={routes.$admin}>Back to Dashboard</a>
      </p>

      <table>
        <thead>
          <tr>
            <th>Name</th>
            <th>Email</th>
            <th>Phone</th>
            <th>Role</th>
            <th>Actions</th>
          </tr>
        </thead>
        <tbody>
          {users.map((user) => (
            <tr key={user.id}>
              <th scope="row">{user.name}</th>
              <td>{user.email}</td>
              <td>{user.phone || "Not provided"}</td>
              <td>{user.role}</td>
              <td>
                <form
                  method="post"
                  action={routes.admin.users.$changeRole}
                  style="display: inline;"
                >
                  <input type="hidden" name="userId" value={user.id} />
                  <label>
                    <span class="visually-hidden">Change role for {user.name}</span>
                    <select name="role" required>
                      <option value="">Change role...</option>
                      <option value="student">Student</option>
                      <option value="teacher">Teacher</option>
                      <option value="admin">Admin</option>
                    </select>
                  </label>
                  <button type="submit">Update</button>
                </form>
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </>,
  );
});

// Handle role change
adminEndpoints.post(routes.admin.users.$changeRole, async (c) => {
  const body = await c.req.parseBody();
  const userId = body.userId as string;
  const role = body.role as string;

  if (!userId || !role) {
    return c.redirect(`${routes.$admin}/users?error=Missing+fields`);
  }

  const parsedRole = parseUserRole(role);
  if (!parsedRole.ok) {
    return c.redirect(`${routes.$admin}/users?error=Invalid+role`);
  }

  try {
    await db.update(schema.user).set({ role: parsedRole.value }).where(eq(schema.user.id, userId));

    return c.redirect(`${routes.$admin}/users?success=Role+updated`);
  } catch {
    return c.redirect(`${routes.$admin}/users?error=Failed+to+update+role`);
  }
});
