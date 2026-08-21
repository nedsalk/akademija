import { mkdir } from "fs/promises";
import { join } from "path";
import type { SharedContext } from "./base-driver";

interface CaptureArgs {
  baseURL: string;
  groupName: string;
  specName: string;
  error?: unknown;
}

export interface McpHandoff {
  baseURL: string;
  groupName: string;
  specName: string;
  status: "passed" | "failed";
  error?: string;
  visitors: Array<{
    testId: string;
    url: string;
    storageStatePath: string;
    user?: {
      id: string;
      email: string;
      password: string;
      role?: string;
    };
  }>;
}

export class PlaywrightMcpHandoff {
  constructor(private sharedContext: SharedContext) {}

  async capture({ baseURL, groupName, specName, error }: CaptureArgs): Promise<McpHandoff> {
    const handoffDir = join(process.cwd(), ".mcp");
    await mkdir(handoffDir, { recursive: true });

    const visitors = await Promise.all(
      Array.from(this.sharedContext.visitors.entries()).map(async ([testId, { context, page }]) => {
        const storageStatePath = join(handoffDir, `${testId}.storage.json`);
        await context.storageState({ path: storageStatePath });
        const user = this.sharedContext.users.get(testId);

        return {
          testId,
          url: page.url(),
          storageStatePath,
          user: user
            ? {
                id: user.id,
                email: user.email,
                password: user.password,
                role: user.role,
              }
            : undefined,
        };
      }),
    );

    return {
      baseURL,
      groupName,
      specName,
      status: error ? "failed" : "passed",
      error: error instanceof Error ? error.message : undefined,
      visitors,
    };
  }
}
