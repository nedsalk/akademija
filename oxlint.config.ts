import { defineConfig } from "oxlint";

export default defineConfig({
  categories: {
    correctness: "warn",
  },
  rules: {
    "eslint/no-unused-vars": "error",
    "unicorn/no-thenable": "off",
  },
  ignorePatterns: ["node_modules/**/*", "dist/**/*", "release/**/*"],
});
