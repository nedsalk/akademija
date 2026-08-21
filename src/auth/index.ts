import { betterAuth } from "better-auth";
import { drizzleAdapter } from "better-auth/adapters/drizzle";
import { db } from "../db";
import * as schema from "../db/schema";

export const auth = betterAuth({
  database: drizzleAdapter(db, {
    provider: "sqlite",
    schema,
  }),
  emailAndPassword: {
    enabled: true,
  },
  session: {
    cookieCache: {
      enabled: process.env.NODE_ENV === "production",
      maxAge: 60 * 5, // 5 minutes (only in production)
    },
  },
  user: {
    additionalFields: {
      role: {
        type: "string",
        required: true,
        defaultValue: "student",
        input: false, // Not directly settable via signup
        returned: true, // Include in session
      },
      phone: {
        type: "string",
        required: false,
        input: true, // Can be set during signup
        returned: false, // Don't include in session (PII)
      },
    },
  },
});
