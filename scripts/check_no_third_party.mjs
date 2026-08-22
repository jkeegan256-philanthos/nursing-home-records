// Load the built site in a real browser and check two things no static
// inspection of the export can: that it talks to nobody but itself, and
// that the record it shows is the record it published.
//
// This replaces a grep. The grep looked through the exported files for
// a list of CDN hostnames, which cannot work for the failure it was
// meant to catch: DuckDB assembles its extension URL inside a
// WebAssembly binary at run time, so extensions.duckdb.org appears
// nowhere in the export, and every reader's browser fetched it anyway.
// No denylist can see a string that does not exist until the page runs.
//
// So run the page. Record every request the browser makes, and fail on
// any host that is not the one serving the site. That is the only shape
// of check that could have caught it, and it catches the next one too,
// whatever the hostname turns out to be.
//
// What a green result covers, written down because the strength of this
// check is exactly its sample and nothing beyond it. Pages visited: the
// home page, one facility page, the owners page, an owner detail page,
// and the Data, About and glossary pages. Interactions driven, which
// matters as much as the pages because three query paths are reachable
// only by acting: the home search box is typed into, the full record's
// <details> is opened, each record tab with an _OTHER shard is clicked,
// and the owner search is typed into and submitted with Enter. Every
// DuckDB query path the site has is therefore fired at least once.
//
// What it does not cover: any page type not in that list, and any
// future interaction added without being added here. A green result is
// evidence about the sample, not about the site.
//
//   node scripts/check_no_third_party.mjs [--dir out] [--port 8123]

import { createReadStream, existsSync, readFileSync, readdirSync, statSync } from "node:fs";
import { createServer } from "node:http";
import { extname, join, normalize } from "node:path";

const args = process.argv.slice(2);
const argOf = (flag, fallback) => {
  const i = args.indexOf(flag);
  return i >= 0 && args[i + 1] ? args[i + 1] : fallback;
};
const DIR = argOf("--dir", "out");
const PORT = Number(argOf("--port", "8123"));

if (!existsSync(DIR)) {
  console.error(`FAIL  no export at ${DIR}/ — run the build first`);
  process.exit(1);
}

const MIME = {
  ".html": "text/html; charset=utf-8",
  ".js": "text/javascript; charset=utf-8",
  ".mjs": "text/javascript; charset=utf-8",
  ".json": "application/json; charset=utf-8",
  ".css": "text/css; charset=utf-8",
  ".txt": "text/plain; charset=utf-8",
  ".xml": "application/xml; charset=utf-8",
  ".wasm": "application/wasm",
  ".woff2": "font/woff2",
  ".parquet": "application/octet-stream",
  ".pdf": "application/pdf",
  ".zip": "application/zip",
};

// DuckDB range-reads Parquet over HTTP, so a server without range
// support would fail the queries for the wrong reason.
function serve() {
  return createServer((req, res) => {
    const path = decodeURIComponent(new URL(req.url, "http://x").pathname);
    let file = join(DIR, normalize(path).replace(/^(\.\.[/\\])+/, ""));
    if (existsSync(file) && statSync(file).isDirectory()) file = join(file, "index.html");
    if (!existsSync(file)) {
      const html = `${file.replace(/\/$/, "")}.html`;
      if (existsSync(html)) file = html;
      else {
        res.writeHead(404).end("not found");
        return;
      }
    }
    const size = statSync(file).size;
    const type = MIME[extname(file)] ?? "application/octet-stream";
    const range = req.headers.range;
    const m = range && /^bytes=(\d*)-(\d*)$/.exec(range);
    if (m) {
      const start = m[1] ? Number(m[1]) : size - Number(m[2]);
      const end = m[1] && m[2] ? Number(m[2]) : size - 1;
      res.writeHead(206, {
        "Content-Type": type,
        "Content-Range": `bytes ${start}-${end}/${size}`,
        "Content-Length": end - start + 1,
        "Accept-Ranges": "bytes",
      });
      createReadStream(file, { start, end }).pipe(res);
      return;
    }
    res.writeHead(200, {
      "Content-Type": type,
      "Content-Length": size,
      "Accept-Ranges": "bytes",
    });
    createReadStream(file).pipe(res);
  });
}

const readJson = (p) => JSON.parse(readFileSync(join(DIR, p), "utf8"));

// Targets come out of the export itself, so this works unchanged
// against the fixture batch and against a real CMS batch.
function targets() {
  const providers = readJson("data/providers-slim.json");
  const ccnIdx = providers.columns.indexOf("CMS Certification Number (CCN)");
  const ccn = providers.rows[0]?.[ccnIdx >= 0 ? ccnIdx : 0];
  if (!ccn) throw new Error("providers-slim.json has no rows to test with");

  let owner = null;
  try {
    owner = readJson("data/owners-slim.json").rows[0]?.[0] ?? null;
  } catch {
    /* a batch with no ownership file has no owner view to check */
  }
  return { ccn, owner };
}

const { ccn, owner } = targets();
const server = serve();
await new Promise((r) => server.listen(PORT, "127.0.0.1", r));
const ORIGIN = `http://127.0.0.1:${PORT}`;

let chromium;
try {
  ({ chromium } = await import("playwright"));
} catch {
  console.error(
    "FAIL  playwright is not installed. This check must not be skipped:\n" +
      "      npm ci && npx playwright install --with-deps chromium"
  );
  process.exit(1);
}

// Containers often carry a system Chromium instead of Playwright's own
// download; point at it with PLAYWRIGHT_CHROMIUM_PATH.
const browser = await chromium.launch(
  process.env.PLAYWRIGHT_CHROMIUM_PATH
    ? { executablePath: process.env.PLAYWRIGHT_CHROMIUM_PATH }
    : {}
);
const context = await browser.newContext();
const page = await context.newPage();

const offOrigin = new Set();
// Same-origin paths are recorded too, so the run can prove it actually
// exercised the engine rather than merely failing to catch it idle.
const requested = new Set();
const failed = [];
const badStatus = [];

page.on("request", (r) => {
  const u = new URL(r.url());
  if (u.protocol === "data:" || u.protocol === "blob:") return;
  if (u.origin !== ORIGIN) offOrigin.add(r.url());
  else requested.add(u.pathname);
});
page.on("requestfailed", (r) => {
  if (new URL(r.url()).origin === ORIGIN) {
    failed.push(`${r.url()} — ${r.failure()?.errorText ?? "failed"}`);
  }
});
page.on("response", (r) => {
  if (new URL(r.url()).origin === ORIGIN && r.status() >= 400) {
    badStatus.push(`${r.status()} ${r.url()}`);
  }
});

const problems = [];
const check = (ok, label, detail) => {
  console.log(`  ${ok ? "ok  " : "FAIL"}  ${label}`);
  if (!ok) problems.push(detail ?? label);
};

const go = (p) => page.goto(ORIGIN + p, { waitUntil: "networkidle" });

console.log(`Serving ${DIR}/ at ${ORIGIN}\n`);

// 1. Home page, including the owner index the search pulls in.
await go("/");
await page.fill("input[type=search]", String(ccn).slice(0, 3));
await page.waitForTimeout(2500);
check(
  [...requested].some((p) => p.endsWith("/data/providers-slim.json")),
  "home page pulled the facility search index",
  "the home page never requested providers-slim.json"
);

// 2. A facility page. The full record is the query worth asserting on:
//    it reads providers.parquet for one CCN, so it is never legitimately
//    empty, and an engine that cannot read Parquet cannot fake it.
await go(`/facility/${encodeURIComponent(ccn)}/`);
await page.locator("details.fullrecord summary").click();
await page
  .locator("details.fullrecord table tbody tr")
  .first()
  .waitFor({ timeout: 45_000 })
  .catch(() => {});
const recordRows = await page.locator("details.fullrecord table tbody tr").count();
check(
  recordRows > 0,
  `facility ${ccn}: full record rendered ${recordRows} field(s) from Parquet`,
  `the full record on /facility/${ccn}/ rendered no rows — the engine could not read Parquet`
);

const tabError = (await page.locator(".tab-status").allTextContents()).find((t) =>
  t.includes("could not be read")
);
check(!tabError, "facility record tabs report no engine error", tabError);

// A partitioned table with an _OTHER shard holds the rows CMS published
// without a usable state code. The page must ask for that shard as well
// as the state one, or it shows a record shorter than the published one
// and says nothing about it. Asserting on the request rather than on a
// row count keeps this true for any batch: if the shard exists, it gets
// read.
const map = readJson("data/data-map.json");
const sharded = Object.entries(map.tables).filter(
  ([, t]) => t.mode === "by_state" && (t.states ?? []).includes("_OTHER") && t.facility_join
);
if (sharded.length === 0) {
  console.log("  --    no _OTHER shard in this batch; nothing to check");
} else {
  for (const [key, t] of sharded) {
    const tab = page.locator(`[id="tab-${key}"]`);
    if (await tab.count()) {
      await tab.click();
      await page.waitForTimeout(4000);
    }
    // endsWith, not equality, so a project-path deployment still matches.
    const want = `/${t.path}/_OTHER.parquet`;
    check(
      [...requested].some((p) => p.endsWith(want)),
      `${key}: the _OTHER shard is read alongside the state shard`,
      `the page never requested ${want}, so rows CMS published without a ` +
        `state code are invisible on facility pages`
    );
  }
}

// 3a. Owner search: type and press Enter. A distinct query from the
//     ones above -- an aggregate over the whole ownership file rather
//     than a filtered read -- and the only one reached solely through
//     an interaction. Loading pages and waiting would never fire it.
if (owner) {
  const needle = String(owner).replace(/[^A-Za-z]/g, "").slice(0, 4);
  if (needle.length >= 3) {
    await go("/owners/");
    await page.fill("input[type=search]", needle);
    await page.press("input[type=search]", "Enter");
    await page
      .locator(".search-results li")
      .first()
      .waitFor({ timeout: 45_000 })
      .catch(() => {});
    const hits = await page.locator(".search-results li").count();
    check(
      hits > 0,
      `owner search for "${needle}" returned ${hits} name(s) from an aggregate query`,
      `searching "${needle}" returned nothing; the owner-search query path ` +
        `is the one no page load reaches, so this is the path most likely ` +
        `to break unnoticed`
    );
  }
}

// 3b. The owner detail view, reached by URL rather than by typing.
if (owner) {
  await go(`/owners/?name=${encodeURIComponent(owner)}`);
  await page
    .locator(".record-head table tbody tr")
    .first()
    .waitFor({ timeout: 45_000 })
    .catch(() => {});
  const ownerRows = await page.locator(".record-head table tbody tr").count();
  check(
    ownerRows > 0,
    `owner "${owner}": explorer rendered ${ownerRows} disclosure row(s)`,
    `the owner explorer rendered no rows for "${owner}"`
  );
}

// 4. The remaining page types. The state and pre-rendered owner pages
//    run no query, but they are page types this site serves and so
//    they are page types this check has to open.
const anyState = existsSync(join(DIR, "state"))
  ? readdirSync(join(DIR, "state"))[0]
  : null;
const anyOwner = existsSync(join(DIR, "owner"))
  ? readdirSync(join(DIR, "owner"))[0]
  : null;
for (const p of [
  "/data/",
  "/about/",
  "/glossary/",
  anyState && `/state/${anyState}/`,
  anyOwner && `/owner/${anyOwner}/`,
  "/404/",
]) {
  if (p) await go(p);
}
console.log("  --    static pages loaded");

await browser.close();
await new Promise((r) => server.close(r));

console.log();

// The check that keeps every check above from being vacuous. DuckDB only
// reaches for its extension on the first read_parquet, so a run that
// loaded the home page and stopped would record zero foreign requests
// and pass while proving nothing -- it would have passed on the broken
// build too. If no Parquet was read over HTTP, this gate has not
// exercised the thing it exists to watch, and a green result is not
// evidence of anything.
// Coverage of page types, derived from the export rather than declared,
// so it cannot drift. A page type added later shows up here, nothing
// visits it, and this fails asking to be driven -- rather than quietly
// sitting outside the sample while everyone assumes it is inside.
const ASSET_DIRS = new Set(["_next", "duckdb", "fonts", "data"]);
const routeTypes = readdirSync(DIR, { withFileTypes: true })
  .filter((d) => d.isDirectory() && !ASSET_DIRS.has(d.name))
  .map((d) => d.name);
const visitedTypes = new Set(
  [...requested].map((p) => p.split("/")[1]).filter(Boolean)
);
const unvisited = routeTypes.filter((t) => !visitedTypes.has(t));
check(
  unvisited.length === 0,
  `every page type in the export was opened (${routeTypes.length}: ${routeTypes.sort().join(", ")})`,
  `the export serves page type(s) this check never opens: ${unvisited.join(", ")}. ` +
    `Open one of each, or this run is silent about them while reading as green`
);

// Coverage of query paths. This one has to be declared, because nothing
// can infer which call sites a browser run actually reached. Declaring
// it is the point: a new query call site changes this map and fails the
// check, which forces someone to drive it here rather than assume the
// shared helper makes it safe. That assumption is what missed the
// extension fetch and the star glyphs both.
const KNOWN_QUERY_CALLERS = {
  "components/FullRecord.tsx": 1,
  "components/FacilityRecords.tsx": 2,
  "components/OwnerExplorer.tsx": 4,
};
const QUERY_CALL = /\b(querySQL|queryParquet|queryParquetAll)\(/g;
const actualCallers = {};
for (const dir of ["components", "lib", "app"]) {
  const walk = (d) => {
    for (const e of readdirSync(d, { withFileTypes: true })) {
      const full = join(d, e.name);
      if (e.isDirectory()) walk(full);
      else if (/\.tsx?$/.test(e.name) && full !== join("lib", "duckdb-client.ts")) {
        const n = (readFileSync(full, "utf8").match(QUERY_CALL) || []).length;
        if (n) actualCallers[full.split("\\").join("/")] = n;
      }
    }
  };
  if (existsSync(dir)) walk(dir);
}
const callerDrift = [];
for (const [f, n] of Object.entries(actualCallers)) {
  if (KNOWN_QUERY_CALLERS[f] !== n) {
    callerDrift.push(`${f}: ${n} call(s), expected ${KNOWN_QUERY_CALLERS[f] ?? 0}`);
  }
}
for (const f of Object.keys(KNOWN_QUERY_CALLERS)) {
  if (!(f in actualCallers)) callerDrift.push(`${f}: no query calls found any more`);
}
check(
  callerDrift.length === 0,
  `${Object.values(actualCallers).reduce((a, b) => a + b, 0)} query call site(s) accounted for`,
  `the site's query call sites changed: ${callerDrift.join("; ")}. Drive the ` +
    `new path in this check and update KNOWN_QUERY_CALLERS — a shared helper ` +
    `is not evidence that a new path behaves`
);

const parquetReads = [...requested].filter((p) => p.endsWith(".parquet"));
check(
  parquetReads.length > 0,
  `the browser issued ${parquetReads.length} Parquet read(s), so a query really ran`,
  "no .parquet was requested: the pages above never ran a query, so this " +
    "run proves nothing about what the engine fetches"
);

check(
  offOrigin.size === 0,
  `zero off-origin requests${offOrigin.size ? "" : " across every page above"}`,
  `the page contacted ${offOrigin.size} off-origin URL(s):\n      ` +
    [...offOrigin].join("\n      ")
);
check(
  failed.length === 0,
  "no same-origin request failed",
  `same-origin requests failed (a vendored file is missing?):\n      ` +
    failed.join("\n      ")
);
check(
  badStatus.length === 0,
  "no same-origin request returned an error status",
  `same-origin error responses:\n      ` + badStatus.join("\n      ")
);

if (problems.length) {
  console.error(`\nFAIL  ${problems.length} problem(s):\n`);
  for (const p of problems) console.error(`  - ${p}`);
  process.exit(1);
}
console.log("\nEvery request this site made went to this site.");
