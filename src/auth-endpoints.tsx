import { Hono } from "hono";
import type { HonoEnv } from ".";
import { auth } from "./auth";
import { prepareRegistrationDetails } from "./domain/users";
import { routes } from "./routes";
import { LoginForm } from "./ui/organisms/login";
import { RegisterForm } from "./ui/organisms/register";

export const authEndpoints = new Hono<HonoEnv>();

// Login page
authEndpoints.get(routes.auth.$login, async (c) => {
  if (c.var.session) {
    return c.redirect(routes.$home);
  }
  const error = c.req.query("error");
  return c.render(<LoginForm error={error} />, { cssTemplate: "auth-template" });
});

// Register page
authEndpoints.get(routes.auth.$register, async (c) => {
  if (c.var.session) {
    return c.redirect(routes.$home);
  }
  return c.render(<RegisterForm />, { cssTemplate: "auth-template" });
});

// Login form submission
authEndpoints.post(routes.auth.$login, async (c) => {
  const body = await c.req.parseBody();
  const email = body.email as string;
  const password = body.password as string;

  try {
    const response = await auth.api.signInEmail({
      body: { email, password },
      asResponse: true,
    });

    if (response.ok) {
      // Copy cookies from auth response
      const setCookie = response.headers.get("set-cookie");
      if (setCookie) {
        c.header("set-cookie", setCookie);
      }
      return c.redirect(routes.$home);
    }
    return c.redirect(`${routes.auth.$login}?error=Invalid credentials`);
  } catch {
    return c.redirect(`${routes.auth.$login}?error=Invalid credentials`);
  }
});

// Register form submission
authEndpoints.post(routes.auth.$register, async (c) => {
  const body = await c.req.parseBody();
  const email = body.email as string;
  const password = body.password as string;
  const name = body.name as string;
  const phone = body.phone as string;

  const registration = prepareRegistrationDetails({
    email,
    password,
    name,
    phone,
  });

  if (!registration.ok) {
    c.status(422);
    return c.render(<RegisterForm errors={registration.error} values={{ email, name, phone }} />, {
      cssTemplate: "auth-template",
    });
  }

  try {
    const response = await auth.api.signUpEmail({
      body: registration.value,
      asResponse: true,
    });

    if (response.ok) {
      // Copy cookies from auth response
      const setCookie = response.headers.get("set-cookie");
      if (setCookie) {
        c.header("set-cookie", setCookie);
      }
      return c.redirect(routes.$home);
    }

    const errorData = await response.json();

    if (
      errorData?.code === "USER_ALREADY_EXISTS" ||
      errorData?.code === "USER_ALREADY_EXISTS_USE_ANOTHER_EMAIL"
    ) {
      return c.render(
        <RegisterForm
          errors={{ email: "User with this email already exists" }}
          values={{
            email: registration.value.email,
            name: registration.value.name,
            phone: registration.value.phone,
          }}
        />,
        { cssTemplate: "auth-template" },
      );
    }

    if (errorData?.message?.includes("Invalid email")) {
      return c.render(
        <RegisterForm
          errors={{ email: "Invalid email format" }}
          values={{
            email: registration.value.email,
            name: registration.value.name,
            phone: registration.value.phone,
          }}
        />,
        { cssTemplate: "auth-template" },
      );
    }

    if (errorData?.message) {
      return c.render(
        <RegisterForm
          errors={{ email: errorData.message }}
          values={{
            email: registration.value.email,
            name: registration.value.name,
            phone: registration.value.phone,
          }}
        />,
        { cssTemplate: "auth-template" },
      );
    }

    return c.render(
      <RegisterForm
        errors={{ email: "Registration failed" }}
        values={{
          email: registration.value.email,
          name: registration.value.name,
          phone: registration.value.phone,
        }}
      />,
      { cssTemplate: "auth-template" },
    );
  } catch {
    return c.render(
      <RegisterForm
        errors={{ email: "Registration failed. Please try again." }}
        values={{
          email: registration.value.email,
          name: registration.value.name,
          phone: registration.value.phone,
        }}
      />,
      { cssTemplate: "auth-template" },
    );
  }
});

// Logout
authEndpoints.post(routes.auth.$logout, async (c) => {
  try {
    const response = await auth.api.signOut({
      headers: c.req.raw.headers,
      asResponse: true,
    });

    // Copy cookies from auth response to clear session
    const setCookie = response.headers.get("set-cookie");
    if (setCookie) {
      c.header("set-cookie", setCookie);
    }
  } catch {
    // Ignore errors during logout
  }
  return c.redirect(routes.auth.$login);
});
