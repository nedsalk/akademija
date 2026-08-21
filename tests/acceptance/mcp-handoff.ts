import { existsSync, rmSync } from "fs";
import { mkdir, writeFile } from "fs/promises";
import { join } from "path";
import type { createPlaywrightDrivers } from "./drivers/playwright/create-drivers";

const MCP_DIR = join(process.cwd(), ".mcp");
const HANDOFF_PATH = join(MCP_DIR, "handoff.json");
const CONTINUE_PATH = join(MCP_DIR, "continue");

export async function maybeHandoffToMcp({
  baseURL,
  drivers,
  error,
  groupName,
  specName,
}: {
  baseURL: string;
  drivers: ReturnType<typeof createPlaywrightDrivers>;
  error?: unknown;
  groupName: string;
  specName: string;
}) {
  if (process.env.MCP_HANDOFF !== "1") {
    return;
  }

  await mkdir(MCP_DIR, { recursive: true });
  if (existsSync(CONTINUE_PATH)) {
    rmSync(CONTINUE_PATH);
  }

  const handoff = await drivers.$mcp.capture({
    baseURL,
    groupName,
    specName,
    error,
  });

  await writeFile(HANDOFF_PATH, `${JSON.stringify(handoff, null, 2)}\n`);

  console.log(`[MCP handoff] ${handoff.status}: ${groupName} / ${specName}`);
  console.log(`[MCP handoff] ${HANDOFF_PATH}`);
  console.log(`[MCP handoff] Create ${CONTINUE_PATH} to release the test.`);

  while (!existsSync(CONTINUE_PATH)) {
    await new Promise((resolve) => setTimeout(resolve, 500));
  }
}
