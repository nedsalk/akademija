import type { BuildConfig } from "bun";
import { join } from "path";

export const buildConfig: Omit<BuildConfig, "entrypoints"> = {
  // minify: true,
  splitting: true,
};

const rootdir = join(import.meta.dir, "..");
const webAppDir = join(rootdir, "src");

export const directories = {
  rootdir,
  webAppDir,
};
