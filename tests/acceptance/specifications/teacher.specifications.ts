import type { Specification } from "./types";

export const teacherSpecs: Specification = {
  "teacher can access teacher dashboard": async (dsl) => {
    const teacher = await dsl.auth.given["a registered user"]({
      role: "teacher",
    });
    await dsl.teacher.when["they go to the teacher dashboard"](teacher);
    await dsl.teacher.then["they see teacher dashboard"]({ visitor: teacher });
  },

  "student cannot access teacher dashboard": async (dsl) => {
    const student = await dsl.auth.given["a registered user"]({
      role: "student",
    });
    await dsl.teacher.when["they go to the teacher dashboard"](student);
    await dsl.teacher.then["they are denied access"]({ visitor: student });
  },

  "unauthenticated user is redirected to login when visiting teacher dashboard": async (dsl) => {
    const visitor = await dsl.auth.given["a visitor"]();
    await dsl.teacher.when["they go to the teacher dashboard"](visitor);
    await dsl.auth.then["they are on login view"](visitor);
  },
};
