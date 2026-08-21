import type { FC } from "hono/jsx";
import { routes } from "../routes";

interface ProfilePageProps {
  notificationsEnabled?: boolean;
  errors?: {
    name?: string;
    phone?: string;
  };
  values: {
    name: string;
    phone: string;
  };
}

export const ProfilePage: FC<ProfilePageProps> = ({
  errors,
  notificationsEnabled = false,
  values,
}) => {
  return (
    <div>
      <h1>Profile</h1>
      <form method="post" action={routes.$profile}>
        <label>
          Full Name
          <input type="text" name="name" value={values.name} required />
          {errors?.name ? <span>{errors.name}</span> : null}
        </label>
        <label>
          Phone Number
          <input type="tel" name="phone" value={values.phone} required />
          {errors?.phone ? <span>{errors.phone}</span> : null}
        </label>
        <button type="submit">Update Profile</button>
      </form>
      <section>
        <h2>Notifications</h2>
        <p>Push notifications: {notificationsEnabled ? "Enabled" : "Disabled"}</p>
        <form method="post" action={routes.profile.notifications.$subscribe}>
          <button type="submit">Enable Notifications</button>
        </form>
      </section>
    </div>
  );
};
