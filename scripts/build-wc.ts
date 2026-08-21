import { $ } from "bun";
import { buildConfig, directories } from "./configs";

const { rootdir } = directories;

interface Options {
  rootdir: string;
}

export async function buildWebComponentsDev({ rootdir }: Options) {
  const webComponents = (await $`find ${rootdir} -type f -name "*.wc.ts"`.text())
    .trim()
    .split("\n");

  await Bun.build({
    entrypoints: webComponents,
    outdir: `${rootdir}/src/ui/generated/web-components`,
    target: "browser",
    external: ["*.css"],
    ...buildConfig,
  });
}

buildWebComponentsDev({ rootdir });
