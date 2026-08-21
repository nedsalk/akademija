import type { FC } from "hono/jsx";
import { routes } from "../../routes";

interface LoginFormProps {
  error?: string;
}

export const LoginForm: FC<LoginFormProps> = ({ error }) => {
  return (
    <section class="auth">
      <form method="post" action={routes.auth.$login}>
        <h1>Login</h1>
        {error && (
          <div class="auth-error" role="alert">
            {error}
          </div>
        )}
        <label for="email">Email</label>
        <input type="email" id="email" name="email" autocomplete="email" />
        <label for="password">Password</label>
        <input type="password" id="password" name="password" autocomplete="current-password" />
        <button type="submit">Login</button>
        <p>
          Don't have an account? <a href={routes.auth.$register}>Register</a>
        </p>
      </form>
    </section>
  );
};
