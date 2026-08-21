import { Hono } from "hono";
import type { HonoEnv } from ".";
import { routes } from "./routes";

function getBasePath() {
  const basePath = process.env.BASE_PATH || "/";
  if (basePath === "/") {
    return "/";
  }

  return basePath.endsWith("/") ? basePath : `${basePath}/`;
}

export const pwaEndpoints = new Hono<HonoEnv>();

pwaEndpoints.get(routes.manifest.toString(), (c) => {
  const basePath = getBasePath();

  return c.json(
    {
      name: "Akademija Ibn Usejmin",
      short_name: "Akademija",
      start_url: basePath,
      display: "standalone",
      background_color: "#f7f2e8",
      theme_color: "#1f4d3d",
      icons: [
        {
          src: `${basePath}static/ui/logo.svg`,
          sizes: "any",
          type: "image/svg+xml",
          purpose: "any",
        },
      ],
    },
    200,
    {
      "content-type": "application/manifest+json; charset=utf-8",
    },
  );
});

pwaEndpoints.get(routes.serviceWorker.toString(), (c) => {
  const body = `
self.addEventListener("install", (event) => {
  self.skipWaiting();
});

self.addEventListener("activate", (event) => {
  event.waitUntil(self.clients.claim());
});
`.trim();

  return c.body(body, 200, {
    "content-type": "application/javascript; charset=utf-8",
    "cache-control": "no-cache",
  });
});
