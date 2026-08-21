import { $, argv, build } from "bun";
import { buildClient } from "./build-client";
import { buildConfig, directories } from "./configs";

const { rootdir, webAppDir } = directories;

const outdir = argv[2] ?? `${rootdir}/out`;

await $`rm -rf ${outdir}`;

await build({
  entrypoints: [`${webAppDir}/index.tsx`],
  outdir,
  target: "bun",
  ...buildConfig,
});

await buildClient({
  rootdir,
  outdir,
});
