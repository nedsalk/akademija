import type { Specification } from "./types";

export const adminSpecs: Specification = {
  "admin can see registered users": async (dsl) => {
    const { admin, users } = await dsl.admin.given["admin managing users"]();
    await dsl.admin.when["they go to user management"](admin);
    await dsl.admin.then["they can see those users"]({ admin, users });
  },
  "admin can change user role to teacher": async (dsl) => {
    const {
      admin,
      users: [user],
    } = await dsl.admin.given["admin managing users"]();
    await dsl.admin.when["they change user role"]({
      admin,
      user,
      new_role: "teacher",
    });
    await dsl.auth.then["they are assigned role"](user, "teacher");
  },

  "student cannot access user management": async (dsl) => {
    const student = await dsl.auth.given["a registered user"]({
      role: "student",
    });
    await dsl.admin.when["they go to admin dashboard"](student);
    await dsl.admin.then["they are denied access"]({ user: student });
  },

  "teacher cannot access user management": async (dsl) => {
    const teacher = await dsl.auth.given["a registered user"]({
      role: "teacher",
    });
    await dsl.admin.when["they go to admin dashboard"](teacher);
    await dsl.admin.then["they are denied access"]({ user: teacher });
  },

  "admin can access admin dashboard": async (dsl) => {
    const admin = await dsl.admin.given["a logged-in admin"]();
    await dsl.admin.when["they go to admin dashboard"](admin);
    await dsl.admin.then["they see admin dashboard"]({ user: admin });
  },
};
