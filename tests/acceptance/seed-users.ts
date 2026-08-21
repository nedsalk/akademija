import { parseSetCookieHeader } from "better-auth/cookies";
import { eq } from "drizzle-orm";
import { writeFileSync } from "fs";
import { auth } from "../../src/auth";
import { db } from "../../src/db";
import * as schema from "../../src/db/schema";
import type { UserRole } from "../../src/domain/types";
import type { SeededUser } from "./drivers/interface";

const manifestPath = process.env.E2E_SEEDED_USERS_PATH;
if (!manifestPath) {
  throw new Error("E2E_SEEDED_USERS_PATH environment variable is required");
}

const password = "ValidPass123!";
const definitions = [
  ...createDefinitions("student", 4),
  ...createDefinitions("teacher", 3),
  ...createDefinitions("admin", 2),
];
const seededUsers = await Promise.all(definitions.map(seedUser));

writeFileSync(manifestPath, JSON.stringify({ users: seededUsers }));

function createDefinitions(role: UserRole, count: number) {
  return Array.from({ length: count }, (_, index) => ({
    role,
    name: `E2E ${role} ${index + 1}`,
    email: `e2e-${role}-${index + 1}@example.com`,
    phone: Math.floor(Math.random() * 1_000_000_000).toString(),
  }));
}

async function seedUser(
  definition: ReturnType<typeof createDefinitions>[number],
): Promise<SeededUser> {
  const response = await auth.api.signUpEmail({
    body: {
      name: definition.name,
      email: definition.email,
      password,
      phone: definition.phone,
    },
    asResponse: true,
  });

  if (!response.ok) {
    throw new Error(`Failed to seed ${definition.email}: ${await response.text()}`);
  }

  const responseCookies = parseSetCookieHeader(response.headers.get("set-cookie") ?? "");
  const sessionCookie = Array.from(responseCookies.entries()).find(([name]) =>
    name.endsWith("better-auth.session_token"),
  );
  if (!sessionCookie) {
    throw new Error(`Signup did not create a session for ${definition.email}`);
  }

  const [storedUser] = await db
    .update(schema.user)
    .set({ role: definition.role })
    .where(eq(schema.user.email, definition.email))
    .returning();

  if (!storedUser) {
    throw new Error(`Seeded user not found: ${definition.email}`);
  }

  return {
    id: storedUser.id,
    name: storedUser.name,
    email: storedUser.email,
    phone: storedUser.phone ?? "",
    password,
    role: definition.role,
    sessionCookie: {
      name: sessionCookie[0],
      value: sessionCookie[1].value,
    },
  };
}
