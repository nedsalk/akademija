import type { FC } from "hono/jsx";
import { routes } from "../../routes";

interface User {
  id: string;
  email: string;
  name: string;
  role?: string;
}

const LoggedInNav: FC<{ user: User }> = ({ user }) => {
  return (
    <>
      <nav>
        <a href={routes.$home}>Početna</a>
        {user.role === "admin" && <a href={routes.$admin}>Admin Dashboard</a>}
        {(user.role === "admin" || user.role === "teacher") && (
          <a href={routes.$teacher}>Teacher Dashboard</a>
        )}
        {user.role === "student" && <a href={routes.$programs}>My Programs</a>}
        <span>{user.email}</span>
        <form method="post" action={routes.auth.$logout}>
          <button class="small" type="submit">
            Odjavi se
          </button>
        </form>
      </nav>
    </>
  );
};

const LoggedOutNav: FC = () => {
  return (
    <>
      <nav>
        <a href={routes.$home}>Početna</a>
        <a href={routes.auth.$register}>Registracija</a>
        <a class="small button" href={routes.auth.$login}>
          Log in
        </a>
      </nav>
    </>
  );
};
export const Header: FC<{ user: User | null }> = ({ user }) => {
  return <header>{user ? <LoggedInNav user={user} /> : <LoggedOutNav />}</header>;
};
