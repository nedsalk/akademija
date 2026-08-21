import { rm } from "fs/promises";

export default async function teardown() {
  console.log("[Global Teardown] Cleaning up...");

  try {
    const buildDir = process.env.E2E_MAIN_TEST_DIR;
    if (!buildDir) {
      throw new Error("E2E_MAIN_TEST_DIR not set. Global setup may have failed.");
    }
    await rm(buildDir, { recursive: true, force: true });
    console.log(`[Global Teardown] Removed build directory: ${buildDir}`);
  } catch (error) {
    console.error("[Global Teardown] Error cleaning up:", error);
  }
}
