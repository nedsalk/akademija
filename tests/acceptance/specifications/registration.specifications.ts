import type { DSL } from "../dsl";
import type { Specification } from "./types";

export const registrationSpecs: Specification = {
  "new user is assigned student role": async (dsl: DSL) => {
    const user = await dsl.auth.when["visitor registers"]();
    await dsl.auth.then["they are assigned role"](user, "student");
  },
  "registration without email shows error": async (dsl: DSL) => {
    const visitor = await dsl.auth.given["a visitor"]();
    await dsl.auth.when["registering with invalid info"](
      {
        email: "",
      },
      visitor,
    );
    await dsl.auth.then["registration fails with error"]("Email is required", visitor);
  },

  "registration without password shows error": async (dsl: DSL) => {
    const visitor = await dsl.auth.given["a visitor"]();
    await dsl.auth.when["registering with invalid info"](
      {
        password: "",
      },
      visitor,
    );
    await dsl.auth.then["registration fails with error"]("Password is required", visitor);
  },

  "registration without full name shows error": async (dsl: DSL) => {
    const visitor = await dsl.auth.given["a visitor"]();
    await dsl.auth.when["registering with invalid info"](
      {
        name: "",
      },
      visitor,
    );
    await dsl.auth.then["registration fails with error"]("Full name is required", visitor);
  },

  "registration without phone number shows error": async (dsl: DSL) => {
    const visitor = await dsl.auth.given["a visitor"]();
    await dsl.auth.when["registering with invalid info"](
      {
        phone: "",
      },
      visitor,
    );
    await dsl.auth.then["registration fails with error"]("Phone number is required", visitor);
  },

  "registration with invalid value preserves valid fields": async (dsl: DSL) => {
    const visitor = await dsl.auth.given["a visitor"]();
    const validInfo = {
      name: "John Doe",
      password: "goodpass123",
      phone: "+38762123456",
    };

    const invalidInfo = {
      email: "invalid-email",
    };
    await dsl.auth.when["registering with invalid info"](
      {
        ...validInfo,
        ...invalidInfo,
      },
      visitor,
    );
    await dsl.auth.then["the registration form preserves values"](
      {
        ...validInfo,
        ...invalidInfo,
      },
      visitor,
    );
  },
};
