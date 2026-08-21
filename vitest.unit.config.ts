import { defineConfig } from "vitest/config";

export default defineConfig({
  test: {
    include: ["tests/unit/**/*.test.ts"],
    exclude: ["tests/unit/routes.types.test.ts"],
    reporters: ["dot"],
  },
});
