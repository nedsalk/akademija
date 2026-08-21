import type { FC } from "hono/jsx";
import { routes } from "../../routes";

interface RegisterFormProps {
  errors?: {
    email?: string;
    password?: string;
    name?: string;
    phone?: string;
  };
  values?: {
    email?: string;
    password?: string;
    name?: string;
    phone?: string;
  };
}

export const RegisterForm: FC<RegisterFormProps> = ({ errors, values }) => {
  return (
    <section class="auth">
      <form method="post" action={routes.auth.$register}>
        <h1>Register</h1>

        <label>
          Full Name
          <input
            type="text"
            name="name"
            autocomplete="name"
            aria-describedby={errors?.name ? "name-error" : undefined}
            value={values?.name ?? ""}
          />
          {errors?.name && (
            <span id="name-error" role="alert">
              {errors.name}
            </span>
          )}
        </label>

        <label>
          Phone Number
          <input
            type="tel"
            name="phone"
            autocomplete="tel"
            placeholder="+38761123456"
            aria-describedby={errors?.phone ? "phone-error" : undefined}
            value={values?.phone ?? ""}
          />
          {errors?.phone && (
            <span id="phone-error" role="alert">
              {errors.phone}
            </span>
          )}
        </label>

        <label>
          Email
          <input
            type="text"
            name="email"
            autocomplete="email"
            aria-describedby={errors?.email ? "email-error" : undefined}
            value={values?.email ?? ""}
          />
          {errors?.email && (
            <span id="email-error" role="alert">
              {errors.email}
            </span>
          )}
        </label>

        <label>
          Password
          <input
            type="password"
            name="password"
            autocomplete="new-password"
            aria-describedby={errors?.password ? "password-error" : undefined}
          />
          {errors?.password && (
            <span id="password-error" role="alert">
              {errors.password}
            </span>
          )}
        </label>

        <button type="submit">Register</button>
        <div class="auth-link">
          Already have an account? <a href={routes.auth.$login}>Login</a>
        </div>
      </form>
    </section>
  );
};
