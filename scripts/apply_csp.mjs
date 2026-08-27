// Write the Content-Security-Policy meta tag into every exported page,
// as the first child of <head>.
//
// This runs after the build rather than being rendered by the root
// layout, and the reason is ordering. Next hoists its own stylesheet
// link and its entry <script src> tags to the top of <head>, above
// anything a layout renders. A meta policy governs only what the parser
// meets after it, so a tag rendered from app/layout.tsx would arrive
// after those resources had already been requested: a policy that reads
// as covering the page while not covering the first several fetches on
// it. Injecting after the build puts it ahead of everything, whatever
// Next decides to hoist next release.
//
// Wired as npm's "postbuild", so it runs wherever `npm run build` runs
// and cannot be left out of a workflow by hand.
//
//   node scripts/apply_csp.mjs [--dir out]

import { readFileSync, writeFileSync, readdirSync, existsSync, statSync } from "node:fs";
import { join } from "node:path";
import { CSP_META } from "./csp.mjs";

const args = process.argv.slice(2);
const i = args.indexOf("--dir");
const DIR = i >= 0 && args[i + 1] ? args[i + 1] : "out";

if (!existsSync(DIR)) {
  console.error(`FAIL  no export at ${DIR}/ -- run the build first`);
  process.exit(1);
}

function htmlFiles(dir) {
  const out = [];
  for (const e of readdirSync(dir, { withFileTypes: true })) {
    const full = join(dir, e.name);
    if (e.isDirectory()) out.push(...htmlFiles(full));
    else if (e.name.endsWith(".html")) out.push(full);
  }
  return out;
}

const files = htmlFiles(DIR);
if (files.length === 0) {
  console.error(`FAIL  ${DIR}/ contains no .html files, so nothing was protected`);
  process.exit(1);
}

let written = 0;
let already = 0;
const problems = [];

for (const file of files) {
  const before = readFileSync(file, "utf8");
  if (before.includes(CSP_META)) {
    already += 1;
    continue;
  }
  // A different policy already present means two sources are writing
  // this tag and the one that runs last wins silently. Fail instead.
  if (/<meta[^>]+http-equiv=["']?Content-Security-Policy/i.test(before)) {
    problems.push(`${file} already carries a different Content-Security-Policy meta tag`);
    continue;
  }
  if (!before.includes("<head>")) {
    problems.push(`${file} has no literal <head> to insert into`);
    continue;
  }
  const after = before.replace("<head>", `<head>${CSP_META}`);
  // An edit is not done until the bytes changed. The replace above
  // matches a literal, so a silent no-op is possible if Next ever emits
  // <head attr> instead, and a no-op here ships an unprotected page.
  if (after === before) {
    problems.push(`${file} was not modified by the insertion`);
    continue;
  }
  writeFileSync(file, after);
  if (!readFileSync(file, "utf8").includes(CSP_META)) {
    problems.push(`${file} does not carry the meta tag after being written`);
    continue;
  }
  written += 1;
}

if (problems.length) {
  console.error(`FAIL  ${problems.length} page(s) could not be given the policy:\n`);
  for (const p of problems.slice(0, 20)) console.error(`  - ${p}`);
  if (problems.length > 20) console.error(`  ... and ${problems.length - 20} more`);
  process.exit(1);
}

console.log(
  `  ok    Content-Security-Policy written into ${written} page(s)` +
    (already ? `, ${already} already carried it` : "")
);
