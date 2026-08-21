// Pure specification - no test framework imports
import type { DSL } from "../dsl";
import type { Specification } from "./types";

export const authSpecs: Specification = {
  "registration logs user in": async (dsl: DSL) => {
    const user = await dsl.auth.when["visitor registers"]();
    await dsl.auth.then["they are logged in"](user);
  },

  "registration fails with invalid email format": async (dsl: DSL) => {
    const visitor = await dsl.auth.given["a visitor"]();
    await dsl.auth.when["registering with invalid info"](
      {
        email: "invalid-email-format",
      },
      visitor,
    );
    await dsl.auth.then["registration fails with error"]("Invalid email format", visitor);
  },

  "registration fails with duplicate email": async (dsl: DSL) => {
    const visitor = await dsl.auth.given["a visitor"]();
    await dsl.auth.when["attempting to register with used email"](visitor);
    await dsl.auth.then["registration fails with error"](
      "User with this email already exists",
      visitor,
    );
  },

  "user can login with valid credentials": async (dsl: DSL) => {
    const user = await dsl.auth.given["a registered user"]();
    await dsl.auth.when["they login with their credentials"](user);
    await dsl.auth.then["they are logged in"](user);
  },

  "login with wrong password does not authenticate user": async (dsl: DSL) => {
    const user = await dsl.auth.given["a logged-out registered user"]();
    await dsl.auth.when["they attempt to login with wrong password"](user, "wrong-password");
    await dsl.auth.then["they are not logged in"](user);
  },

  "login with non-existent email shows invalid credentials error": async (dsl: DSL) => {
    const visitor = await dsl.auth.given["a visitor"]();
    await dsl.auth.when["they attempt login with non-existent email"](
      visitor,
      "nonexistent@example.com",
    );
    await dsl.auth.then["they see login error"]("Invalid credentials", visitor);
  },

  "login with incorrect password shows invalid credentials error": async (dsl: DSL) => {
    const user = await dsl.auth.given["a logged-out registered user"]();
    await dsl.auth.when["they attempt to login with wrong password"](user, "wrong-password");
    await dsl.auth.then["they see login error"]("Invalid credentials", user);
  },

  "user can logout": async (dsl: DSL) => {
    const user = await dsl.auth.given["a logged-in user"]();
    await dsl.auth.when["they logout"](user);
    await dsl.auth.then["they are not logged in"](user);
  },

  "after logout user is redirected to login": async (dsl: DSL) => {
    const user = await dsl.auth.given["a logged-in user"]();
    await dsl.auth.when["they logout"](user);
    await dsl.auth.then["they are on login view"](user);
  },
};
