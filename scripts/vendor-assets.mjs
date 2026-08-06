// Copies the runtime assets the site serves itself — the DuckDB-WASM
// engine and the three typefaces — from node_modules into public/, so
// every request a page makes stays on this domain. Versions are pinned
// by package-lock.json; the OFL license texts ride beside the fonts.
import { copyFileSync, mkdirSync, statSync } from "node:fs";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";

const root = dirname(dirname(fileURLToPath(import.meta.url)));
const nm = join(root, "node_modules");

const COPIES = [
  ["@duckdb/duckdb-wasm/dist/duckdb-mvp.wasm", "public/duckdb/duckdb-mvp.wasm"],
  ["@duckdb/duckdb-wasm/dist/duckdb-browser-mvp.worker.js", "public/duckdb/duckdb-browser-mvp.worker.js"],
  ["@duckdb/duckdb-wasm/dist/duckdb-eh.wasm", "public/duckdb/duckdb-eh.wasm"],
  ["@duckdb/duckdb-wasm/dist/duckdb-browser-eh.worker.js", "public/duckdb/duckdb-browser-eh.worker.js"],
  ["@fontsource-variable/public-sans/files/public-sans-latin-wght-normal.woff2", "public/fonts/public-sans-latin-wght-normal.woff2"],
  ["@fontsource-variable/public-sans/LICENSE", "public/fonts/LICENSE-public-sans.txt"],
  ["@fontsource-variable/source-serif-4/files/source-serif-4-latin-opsz-normal.woff2", "public/fonts/source-serif-4-latin-opsz-normal.woff2"],
  ["@fontsource-variable/source-serif-4/LICENSE", "public/fonts/LICENSE-source-serif-4.txt"],
  ["@fontsource-variable/spline-sans-mono/files/spline-sans-mono-latin-wght-normal.woff2", "public/fonts/spline-sans-mono-latin-wght-normal.woff2"],
  ["@fontsource-variable/spline-sans-mono/LICENSE", "public/fonts/LICENSE-spline-sans-mono.txt"],
];

let total = 0;
for (const [src, dest] of COPIES) {
  const to = join(root, dest);
  mkdirSync(dirname(to), { recursive: true });
  copyFileSync(join(nm, src), to);
  const bytes = statSync(to).size;
  total += bytes;
  console.log(`  ${dest}  ${(bytes / 1024).toFixed(0)} KB`);
}
console.log(`vendored ${(total / 1048576).toFixed(1)} MB total`);
