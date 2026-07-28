// backend/shared/scripts/rename-esm.mjs
// Renames the ESM build's .js output to .mjs (and fixes relative import
// specifiers) so Node and bundlers treat it as ESM regardless of the
// package's "type": "commonjs". Run automatically by `npm run build:esm`.
import { readdir, readFile, writeFile, rename, mkdir, rm } from "node:fs/promises";
import { join, extname } from "node:path";

const SRC = "dist-esm";
const OUT = "dist/constants-esm";

async function walk(dir) {
  const entries = await readdir(dir, { withFileTypes: true });
  const files = [];
  for (const e of entries) {
    const p = join(dir, e.name);
    if (e.isDirectory()) files.push(...(await walk(p)));
    else files.push(p);
  }
  return files;
}

await rm(OUT, { recursive: true, force: true });
await mkdir(OUT, { recursive: true });

for (const file of await walk(SRC)) {
  const rel = file.slice(SRC.length + 1);
  if (extname(file) === ".js") {
    // rewrite relative specifiers to .mjs so ESM resolution works
    const code = (await readFile(file, "utf8")).replace(
      /(from\s+["'])(\.\/[^"']+?)(?:\.js)?(["'])/g,
      (_m, a, spec, b) => `${a}${spec}.mjs${b}`
    );
    await writeFile(join(OUT, rel.replace(/\.js$/, ".mjs")), code);
  } else {
    await writeFile(join(OUT, rel), await readFile(file));
  }
}
await rm(SRC, { recursive: true, force: true });
console.log(`[shared] ESM constants written to ${OUT}`);
