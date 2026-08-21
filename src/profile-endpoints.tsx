import { eq } from "drizzle-orm";
import { Hono } from "hono";
import type { HonoEnv } from ".";
import { db } from "./db";
import { user } from "./db/schema";
import { now } from "./domain/clock";
import { updateUserProfile } from "./domain/users";
import {
  getNotificationSubscription,
  saveNotificationSubscription,
} from "./features/notifications";
import { routes } from "./routes";
import { ProfilePage } from "./ui/ProfilePage";

export const profileEndpoints = new Hono<HonoEnv>();

profileEndpoints.get(routes.$profile, async (c) => {
  const session = c.var.session;
  if (!session?.user?.id) {
    return c.redirect(routes.auth.$login);
  }

  const [currentUser, subscription] = await Promise.all([
    db
      .select({ name: user.name, phone: user.phone })
      .from(user)
      .where(eq(user.id, session.user.id))
      .get(),
    getNotificationSubscription(session.user.id),
  ]);

  if (!currentUser) {
    return c.text("User not found", 404);
  }

  return c.render(
    <ProfilePage
      notificationsEnabled={Boolean(subscription)}
      values={{
        name: currentUser.name,
        phone: currentUser.phone ?? "",
      }}
    />,
  );
});

profileEndpoints.post(routes.$profile, async (c) => {
  const session = c.var.session;
  if (!session?.user?.id) {
    return c.redirect(routes.auth.$login);
  }

  const formData = await c.req.formData();
  const profileUpdate = updateUserProfile(
    {
      name: formData.get("name")?.toString(),
      phone: formData.get("phone")?.toString(),
    },
    now(),
  );

  if (!profileUpdate.ok) {
    return c.render(
      <ProfilePage
        errors={profileUpdate.error}
        notificationsEnabled={Boolean(await getNotificationSubscription(session.user.id))}
        values={{
          name: formData.get("name")?.toString().trim() ?? "",
          phone: formData.get("phone")?.toString().trim() ?? "",
        }}
      />,
    );
  }

  await db.update(user).set(profileUpdate.value).where(eq(user.id, session.user.id));

  return c.redirect(routes.$profile);
});

profileEndpoints.post(routes.profile.notifications.$subscribe, async (c) => {
  const session = c.var.session;
  if (!session?.user?.id) {
    return c.redirect(routes.auth.$login);
  }

  await saveNotificationSubscription(session.user.id, `subscription:${session.user.id}`);

  return c.redirect(routes.$profile);
});
