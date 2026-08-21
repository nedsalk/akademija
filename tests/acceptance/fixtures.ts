import { test as base } from "@playwright/test";
import type { ChildProcess } from "child_process";
import { spawn } from "child_process";
import { randomUUID } from "crypto";
import { copyFileSync, mkdirSync, readFileSync } from "fs";
import { createServer } from "net";
import { join } from "path";
import type { SeededUser } from "./drivers/interface";

type ServerInfo = {
  process: ChildProcess;
  port: number;
};

type AcceptanceFixtures = {
  seededUsers: SeededUser[];
};

export const test = base.extend<AcceptanceFixtures>({
  // oxlint-disable-next-line no-empty-pattern Playwright requires object destructuring
  seededUsers: async ({}, use) => {
    const manifestPath = process.env.E2E_SEEDED_USERS_PATH;
    if (!manifestPath) {
      throw new Error("E2E_SEEDED_USERS_PATH not set. Global setup may have failed.");
    }

    const manifest = JSON.parse(readFileSync(manifestPath, "utf8")) as {
      users: SeededUser[];
    };
    await use(manifest.users);
  },

  // oxlint-disable-next-line no-empty-pattern Playwright requires object destructuring
  baseURL: async ({}, use) => {
    const testDirPath = join(
      // biome-ignore lint/style/noNonNullAssertion: <you'll fail anyways mate>
      process.env.E2E_TESTS_DIR!,
      randomUUID(),
    );
    mkdirSync(testDirPath);

    const dbPath = join(testDirPath, "app.sqlite");

    // biome-ignore lint/style/noNonNullAssertion: <you'll fail anyways mate>
    copyFileSync(process.env.E2E_DB_PATH!, dbPath);

    const { process: serverProcess, port } = await startServer(dbPath);

    await use(`http://localhost:${port}`);

    await stopServer(serverProcess);
  },
});

async function startServer(dbPath: string): Promise<ServerInfo> {
  const buildPath = process.env.E2E_BUILD_DIR;
  if (!buildPath) {
    throw new Error("E2E_BUILD_DIR not set. Global setup may have failed.");
  }
  const entrypoint = join(buildPath, "index.js");
  const port = await getAvailablePort();

  return new Promise((resolve, reject) => {
    const proc = spawn("bun", ["run", entrypoint], {
      env: {
        ...process.env,
        PORT: String(port),
        DATABASE_URL: dbPath,
      },
      stdio: ["ignore", "pipe", "pipe"],
    });

    proc.stdout?.on("data", (data) => {
      const output = data.toString();
      const match = output.match(/localhost:(\d+)/);
      if (match) {
        resolve({ process: proc, port: Number(match[1]) });
      }
    });

    proc.stderr?.on("data", (data) => {
      console.error(`[server stderr]: ${data}`);
    });

    proc.on("error", reject);

    proc.on("exit", (code) => {
      if (code !== null && code !== 0) {
        reject(new Error(`Server exited with code ${code}`));
      }
    });
  });
}

async function getAvailablePort() {
  return new Promise<number>((resolve, reject) => {
    const server = createServer();
    server.once("error", reject);
    server.listen(0, () => {
      const address = server.address();
      server.close(() => {
        if (!address || typeof address === "string") {
          reject(new Error("Could not allocate test server port"));
          return;
        }
        resolve(address.port);
      });
    });
  });
}

async function stopServer(proc: ChildProcess) {
  if (proc.exitCode !== null || proc.signalCode !== null) {
    return;
  }

  await new Promise<void>((resolve) => {
    const timeout = setTimeout(() => {
      proc.kill("SIGKILL");
    }, 1000);

    proc.once("close", () => {
      clearTimeout(timeout);
      proc.stdout?.destroy();
      proc.stderr?.destroy();
      resolve();
    });

    if (!proc.kill("SIGTERM")) {
      clearTimeout(timeout);
      resolve();
    }
  });
}

export { expect } from "@playwright/test";
