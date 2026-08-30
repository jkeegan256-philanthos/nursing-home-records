// Copies the runtime assets the site serves itself — the DuckDB-WASM
// engine, its Parquet extension, and the three typefaces — into
// public/, so every request a page makes stays on this domain. Versions
// are pinned by package-lock.json; the OFL license texts ride beside the
// fonts.
//
// The extension is the part that is easy to miss, and did get missed:
// shipping duckdb-*.wasm from your own origin does not make the engine
// self-contained, because DuckDB 1.4 does not statically link the
// Parquet reader. The first read_parquet() call autoloads it over the
// network, from extensions.duckdb.org, unless the engine has been
// pointed somewhere else. See the 2026-08-22 entries in DECISIONS.md.
import { copyFileSync, existsSync, mkdirSync, statSync, writeFileSync } from "node:fs";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";
import { createRequire } from "node:module";

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

// ---------------------------------------------------------------- extensions

// Ask the engine its own version rather than hardcoding one. DuckDB
// builds the extension path as /<version>/<platform>/<name>, so a
// version that drifts from the shipped binary would send every reader
// back to duckdb.org for a file this site thought it was serving.
async function engineVersion() {
  const require = createRequire(import.meta.url);
  const duckdb = require("@duckdb/duckdb-wasm/dist/duckdb-node-blocking.cjs");
  const dist = join(nm, "@duckdb/duckdb-wasm/dist");
  const db = await duckdb.createDuckDB(
    {
      mvp: {
        mainModule: join(dist, "duckdb-mvp.wasm"),
        mainWorker: join(dist, "duckdb-node-mvp.worker.cjs"),
      },
      eh: {
        mainModule: join(dist, "duckdb-eh.wasm"),
        mainWorker: join(dist, "duckdb-node-eh.worker.cjs"),
      },
    },
    new duckdb.VoidLogger(),
    duckdb.NODE_RUNTIME
  );
  await db.instantiate(() => {});
  const conn = db.connect();
  const v = conn.query("SELECT version() AS v").toArray()[0].toJSON().v;
  conn.close();
  if (!/^v\d+\.\d+\.\d+$/.test(v)) {
    throw new Error(`unrecognised DuckDB version string: ${JSON.stringify(v)}`);
  }
  return v;
}

// The platforms selectBundle() can pick in a browser. Both are vendored
// because the engine chooses at run time, on the reader's machine.
const EXT_PLATFORMS = ["wasm_eh", "wasm_mvp"];
const EXTENSIONS = ["parquet"];
const EXT_ORIGIN = "https://extensions.duckdb.org";

const version = await engineVersion();
console.log(`  DuckDB engine ${version}`);

for (const platform of EXT_PLATFORMS) {
  for (const name of EXTENSIONS) {
    const rel = `duckdb/extensions/${version}/${platform}/${name}.duckdb_extension.wasm`;
    const to = join(root, "public", rel);
    if (existsSync(to)) {
      console.log(`  public/${rel}  ${(statSync(to).size / 1024).toFixed(0)} KB (cached)`);
      total += statSync(to).size;
      continue;
    }
    const url = `${EXT_ORIGIN}/${version}/${platform}/${name}.duckdb_extension.wasm`;
    const res = await fetch(url);
    if (!res.ok) {
      throw new Error(
        `could not fetch ${url} (HTTP ${res.status}). The site cannot be ` +
          `built without it: without a vendored copy the engine would fetch ` +
          `this file from ${EXT_ORIGIN} in every reader's browser.`
      );
    }
    const body = Buffer.from(await res.arrayBuffer());
    mkdirSync(dirname(to), { recursive: true });
    writeFileSync(to, body);
    total += body.length;
    console.log(`  public/${rel}  ${(body.length / 1024).toFixed(0)} KB`);
  }
}

console.log(`vendored ${(total / 1048576).toFixed(1)} MB total`);
