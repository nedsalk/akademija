import { Hono } from "hono";
import { serveStatic } from "hono/bun";
import { etag } from "hono/etag";
import type { HonoEnv } from ".";

export const staticEndpoints = new Hono<HonoEnv>();

staticEndpoints.use("*", etag());
staticEndpoints.use(
  "*",
  serveStatic({
    root: `${import.meta.dir}`,
    rewriteRequestPath: (path) => {
      return path.replace(/^\/static/, "");
    },
    onNotFound(path) {
      console.error(`File not found: ${path}`);
    },
    precompressed: true,
  }),
);
