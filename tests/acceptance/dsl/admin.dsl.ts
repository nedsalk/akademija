/** biome-ignore-all lint/suspicious/noThenProperty: <given-when-then> */
import type { ArrayOfLength } from "../../../src/helpers";
import type { AdminDriver } from "../drivers/interface";
import type { AuthDSL } from "./auth.dsl";
import type { Expect, User } from "./types";

interface AdminArgs {
  admin: User;
}

interface UserArgs {
  user: User;
}

export interface AdminDSL {
  given: {
    "admin managing users": <Count extends number = 3>(args?: {
      user_count?: Count;
    }) => Promise<{ admin: User; users: ArrayOfLength<User, Count> }>;
    "a logged-in admin": () => Promise<User>;
  };
  when: {
    "they go to user management": (user: User) => Promise<void>;
    "they change user role": (
      args: AdminArgs & {
        user: User;
        new_role: "teacher";
      },
    ) => Promise<void>;
    "they go to admin dashboard": (user: User) => Promise<void>;
  };
  then: {
    "they can see those users": (args: AdminArgs & { users: User[] }) => Promise<void>;
    "they are denied access": (args: UserArgs) => Promise<void>;
    "they see admin dashboard": (args: UserArgs) => Promise<void>;
  };
}

export function createAdminDSL(driver: AdminDriver, authDSL: AuthDSL, expect: Expect): AdminDSL {
  return {
    given: {
      "admin managing users": async ({ user_count } = {}) => {
        const count = (user_count ?? 3) as NonNullable<typeof user_count>;
        const users = (await Promise.all(
          Array.from({ length: count }, () => authDSL.given["a registered user"]()),
        )) as ArrayOfLength<User, NonNullable<typeof user_count>>;

        // Create and login as admin
        const admin = await authDSL.given["a registered user"]({
          role: "admin",
        });

        // Navigate to user management
        await driver.navigateToUserManagement(admin);

        return { admin, users };
      },

      "a logged-in admin": async () => {
        const admin = await authDSL.given["a registered user"]({
          role: "admin",
        });
        return admin;
      },
    },

    when: {
      "they go to user management": async (user) => {
        await driver.navigateToUserManagement(user);
      },

      "they change user role": async ({ admin, user, new_role }): Promise<void> => {
        await driver.changeUserRole(admin, user, new_role);
      },

      "they go to admin dashboard": async (user) => {
        await driver.navigateToAdminDashboard(user);
      },
    },

    then: {
      "they can see those users": async ({ admin, users }) => {
        // Verify admin sees the user management page
        const onUserManagementPage = await driver.isOnUserManagement(admin);

        expect(onUserManagementPage).toBe(true);

        // Get the list of users displayed on the page
        const displayedUsers = await driver.getUsersList(admin);

        // Verify we have users displayed
        expect(displayedUsers.length > 0).toBe(true);

        // Verify each registered user appears in the list
        for (const user of [...users, admin]) {
          const userDisplayed = displayedUsers.some(
            (displayedUser) => displayedUser.email === user.email,
          );
          expect(userDisplayed).toBe(true);
        }

        if (admin?.email) {
          const adminDisplayed = displayedUsers.some(
            (displayedUser) => displayedUser.email === admin.email,
          );
          expect(adminDisplayed).toBe(true);
        }
      },

      "they are denied access": async ({ user }): Promise<void> => {
        const accessDenied = await driver.seesAccessDenied(user);
        expect(accessDenied).toBe(true);
      },

      "they see admin dashboard": async ({ user }): Promise<void> => {
        const seesAdminDashboard = await driver.seesAdminDashboard(user);
        expect(seesAdminDashboard).toBe(true);
      },
    },
  };
}
