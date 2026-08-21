import { $, Glob } from "bun";
import { copyFileSync, readFileSync, writeFileSync } from "fs";
import { join } from "path";
import { brotliCompressSync, constants, gzipSync } from "zlib";
import { buildConfig } from "./configs";

interface Options {
  rootdir: string;
  outdir: string;
  filenames?: string[];
}

export async function buildClient({ rootdir, outdir }: Options) {
  const webComponents = (await $`find ${rootdir} -type f -name "*.wc.ts"`.text())
    .trim()
    .split("\n");

  const uiFolder = join(outdir, "ui");

  await Bun.build({
    entrypoints: webComponents,
    outdir: join(uiFolder, "generated/web-components"),
    target: "browser",
    external: ["*.css"],
    ...buildConfig,
  });

  const mainCssFile = (await $`find ${rootdir}/src -type f -name "main.css"`.text()).trim();

  await Bun.build({
    entrypoints: [mainCssFile],
    outdir: uiFolder,
    target: "browser",
    ...buildConfig,
  });

  const templateCssFiles: string[] = [];
  for await (const file of new Glob("templates/*.css").scan(join(rootdir, "src/ui"))) {
    templateCssFiles.push(join(rootdir, "src/ui", file));
  }

  await Bun.build({
    entrypoints: templateCssFiles,
    outdir: join(uiFolder, "templates"),
    target: "browser",
    ...buildConfig,
  });

  const logoPath = (await $`find ${rootdir}/src -type f -name "logo.svg"`.text()).trim();

  copyFileSync(logoPath, `${uiFolder}/logo.svg`);

  // Compress static files with gzip and brotli
  console.log("Compressing static files...");
  const glob = new Glob("**/*.{js,css}");
  for await (const file of glob.scan(uiFolder)) {
    const fullPath = join(uiFolder, file);
    const content = readFileSync(fullPath);

    // Gzip (for older browsers)
    const gzipped = gzipSync(content, { level: 9 });
    writeFileSync(`${fullPath}.gz`, gzipped);

    // Brotli (for modern browsers, better compression)
    const brotli = brotliCompressSync(content, {
      params: {
        [constants.BROTLI_PARAM_QUALITY]: 11,
      },
    });
    writeFileSync(`${fullPath}.br`, brotli);
  }
}
