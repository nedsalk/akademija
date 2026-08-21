import { spawnSync } from "child_process";
import { mkdirSync } from "fs";
import { mkdtemp } from "fs/promises";
import { tmpdir } from "os";
import { join } from "path";

export default async function setup() {
  console.log("[Global Setup] Building application...");

  process.env.BETTER_AUTH_SECRET = "akademija-e2e-test-secret-that-is-at-least-32-characters";

  // Create temp directory for the build
  const testDir = await mkdtemp(join(tmpdir(), "e2e-akademija-test"));
  const buildDir = join(testDir, "build");
  mkdirSync(buildDir);

  const testsDir = join(testDir, "tests");
  mkdirSync(testsDir, { recursive: true });

  console.log(`[Global Setup] Test directory: ${testDir}`);

  // Run production build
  const result = spawnSync("bun", ["run", "scripts/prod-build.ts", buildDir], {
    stdio: "inherit",
    env: process.env,
  });

  if (result.status !== 0) {
    throw new Error(`Build failed with exit code ${result.status}`);
  }

  // Store build path for tests to use
  process.env.E2E_MAIN_TEST_DIR = testDir;
  process.env.E2E_BUILD_DIR = buildDir;
  process.env.E2E_TESTS_DIR = testsDir;
  process.env.E2E_DB_PATH = join(testDir, "app.sqlite");
  process.env.E2E_SEEDED_USERS_PATH = join(testDir, "seeded-users.json");

  console.log(testDir);

  applyMigrations(process.env.E2E_DB_PATH);
  seedUsers(process.env.E2E_DB_PATH, process.env.E2E_SEEDED_USERS_PATH);

  console.log("[Global Setup] Build complete");
}

function seedUsers(dbPath: string, manifestPath: string): void {
  const result = spawnSync("bun", ["run", "tests/acceptance/seed-users.ts"], {
    env: {
      ...process.env,
      DATABASE_URL: dbPath,
      E2E_SEEDED_USERS_PATH: manifestPath,
    },
    stdio: "pipe",
  });

  if (result.status !== 0) {
    throw new Error(`User seeding failed: ${result.stderr?.toString()}`);
  }
}

function applyMigrations(dbPath: string): void {
  const result = spawnSync("bun", ["run", "tests/acceptance/apply-migrations.ts"], {
    env: { ...process.env, DATABASE_URL: dbPath },
    stdio: "pipe",
  });

  if (result.status !== 0) {
    throw new Error(`Migration failed: ${result.stderr?.toString()}`);
  }
}
