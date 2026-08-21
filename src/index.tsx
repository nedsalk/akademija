import { Hono } from "hono";
import { serveStatic } from "hono/bun";
import { jsxRenderer } from "hono/jsx-renderer";
import { adminEndpoints } from "./admin-endpoints";
import { auth } from "./auth";
import { authEndpoints } from "./auth-endpoints";
import { profileEndpoints } from "./profile-endpoints";
import { programsEndpoints } from "./programs-endpoints";
import { pwaEndpoints } from "./pwa-endpoints";
import { staticEndpoints } from "./static-endpoints";
import { teacherEndpoints } from "./teacher-endpoints";
import { testEndpoints } from "./test-endpoints";
import { Main } from "./ui/Main";
import type { HtmlEscapedString } from "hono/utils/html";
import { compress } from "hono/compress";

type Variables = {
  session: Awaited<ReturnType<typeof auth.api.getSession>>;
};

export type HonoEnv = {
  Variables: Variables;
};

declare module "hono" {
  interface ContextRenderer {
    (
      content: HtmlEscapedString | Promise<HtmlEscapedString>,
      props?: {
        cssTemplate: NonNullable<(typeof Main)["defaultProps"]>["cssTemplate"];
      },
    ): Response | Promise<Response>;
  }
}

const app = new Hono<HonoEnv>();

app.use("*", compress());

// Get current session helper
export async function getSession(c: { req: { raw: Request } }) {
  const session = await auth.api.getSession({
    headers: c.req.raw.headers,
  });
  return session;
}

app.use("*", async (c, next) => {
  const session = await auth.api.getSession({
    headers: c.req.raw.headers,
  });
  c.set("session", session);

  return next();
});

// Auth API routes
app.on(["POST", "GET"], "/api/auth/**", (c) => auth.handler(c.req.raw));

app.get(
  "/.well-known/appspecific/com.chrome.devtools.json",
  serveStatic({
    root: `${import.meta.dir}/..`,
    path: ".well-known/appspecific/com.chrome.devtools.json",
  }),
);

// Apply Main layout to all GET routes
app.use(
  "*",
  jsxRenderer(
    ({ children, cssTemplate }, c) => {
      return (
        <Main cssTemplate={cssTemplate} user={c.var.session?.user ?? null}>
          {children}
        </Main>
      );
    },
    {
      docType: true,
    },
  ),
);

app.route("/static", staticEndpoints);
app.route("", pwaEndpoints);
app.route("", authEndpoints);
app.route("", adminEndpoints);
app.route("", teacherEndpoints);
app.route("", programsEndpoints);
app.route("", testEndpoints);
app.route("", profileEndpoints);

// Home page
app.get("/", (c) => {
  return c.render(<h1>Welcome to Akademija Ibn Usejmin</h1>);
});

export default {
  fetch: app.fetch,
  port: process.env.PORT ? Number(process.env.PORT) : 3000,
};
