// Assert the built pages say, in their text, what CMS published.
//
// The footer promises figures are shown exactly as published. That is a
// claim about what the pages render, so under principle 7 it needs a
// check that reads what they rendered.
//
// The failure it exists for: star ratings were drawn as five identical
// filled glyphs, the unearned ones separated only by CSS colour. Colour
// exists in a browser and nowhere else, so a copied, scraped, or
// text-extracted page turned a one-star facility into a five-star one,
// silently, everywhere a rating appeared. A picture of a value is not
// the value; whatever a page depicts, its text has to say.
//
//   node scripts/check_rendered_values.mjs [--dir out]

import { existsSync, readFileSync, readdirSync } from "node:fs";
import { join } from "node:path";

const args = process.argv.slice(2);
const i = args.indexOf("--dir");
const DIR = i >= 0 && args[i + 1] ? args[i + 1] : "out";

if (!existsSync(DIR)) {
  console.error(`FAIL  no export at ${DIR}/ — run the build first`);
  process.exit(1);
}

const problems = [];
const check = (ok, label, detail) => {
  console.log(`  ${ok ? "ok  " : "FAIL"}  ${label}`);
  if (!ok) problems.push(detail ?? label);
};

const FILLED = "★";
const HOLLOW = "☆";

const slim = JSON.parse(readFileSync(join(DIR, "data/providers-slim.json"), "utf8"));
const col = (name) => slim.columns.indexOf(name);
const ccnAt = col("CMS Certification Number (CCN)");
const ratingAt = col("Overall Rating");
const published = new Map(slim.rows.map((r) => [r[ccnAt], (r[ratingAt] ?? "").trim()]));

const stateDir = join(DIR, "state");
const states = existsSync(stateDir) ? readdirSync(stateDir) : [];

let rowsChecked = 0;
const mismatches = [];
const seenRatings = new Set();

for (const st of states) {
  const file = join(stateDir, st, "index.html");
  if (!existsSync(file)) continue;
  const html = readFileSync(file, "utf8");

  for (const row of html.split("<tr")) {
    const ccn = /class="mono">(\d+)</.exec(row)?.[1];
    if (!ccn || !published.has(ccn)) continue;
    const stars = /class="stars"[^>]*>([\s\S]*?)<\/span>\s*<\/td>/.exec(row)?.[1];
    const rating = published.get(ccn);

    if (!/^[1-5]$/.test(rating)) continue; // unrated rows carry no glyphs
    if (!stars) {
      mismatches.push(`${ccn}: published ${rating} but the page renders no stars`);
      continue;
    }
    const text = stars.replace(/<[^>]*>/g, "");
    const filled = [...text].filter((c) => c === FILLED).length;
    const hollow = [...text].filter((c) => c === HOLLOW).length;
    const n = Number(rating);

    if (filled !== n || hollow !== 5 - n) {
      mismatches.push(
        `${ccn}: published ${rating}, text reads ${filled} filled and ` +
          `${hollow} hollow — a reader copying this row sees ${filled}`
      );
    } else if (!text.includes(`(${n} of 5)`)) {
      mismatches.push(`${ccn}: glyphs are right but the text omits "(${n} of 5)"`);
    }
    seenRatings.add(rating);
    rowsChecked++;
  }
}

// The specific regression, stated as itself: a filled glyph must never
// appear inside the element that means "not earned".
const filledInsideOff = [];
const scan = (file) => {
  const html = readFileSync(file, "utf8");
  if (html.includes(`class="off">${FILLED}`)) filledInsideOff.push(file);
};
for (const st of states) {
  const f = join(stateDir, st, "index.html");
  if (existsSync(f)) scan(f);
}
const facDir = join(DIR, "facility");
const facilities = existsSync(facDir) ? readdirSync(facDir).slice(0, 200) : [];
for (const c of facilities) {
  const f = join(facDir, c, "index.html");
  if (existsSync(f)) scan(f);
}

check(
  filledInsideOff.length === 0,
  "no unearned star is drawn with the earned glyph",
  `a filled ${FILLED} appears inside class="off" in ${filledInsideOff.length} ` +
    `page(s), e.g. ${filledInsideOff[0]} — colour is the only thing ` +
    `distinguishing it, and colour does not survive a copy`
);

check(
  mismatches.length === 0,
  `${rowsChecked} rendered rating(s) match the published value in text`,
  `ratings render differently from what CMS published:\n      ` +
    mismatches.slice(0, 10).join("\n      ") +
    (mismatches.length > 10 ? `\n      …and ${mismatches.length - 10} more` : "")
);

// Coverage, so a run that checked nothing cannot report success. The
// same lesson as the origin gate: green on an empty sample is not
// evidence, it is silence wearing evidence's badge.
check(
  rowsChecked > 0,
  `checked ${rowsChecked} row(s) across ${states.length} state page(s)`,
  "no rated rows were found to check, so this run proves nothing"
);
check(
  seenRatings.size > 1,
  `covered ${seenRatings.size} distinct rating value(s): ${[...seenRatings].sort().join(", ")}`,
  `only rating(s) ${[...seenRatings].join(", ")} appeared, so a bug that ` +
    `mangles some ratings and not others could pass`
);

// Fields that must appear on every facility page whatever they say.
// Surfacing one only when it carries the alarming value makes absence
// the carrier of every other value, and a reader cannot tell "CMS
// published N" from "CMS published nothing".
const ALWAYS_SHOWN = ["Abuse icon", "Special focus status"];
const missingLabel = [];
for (const c of facilities) {
  const f = join(facDir, c, "index.html");
  if (!existsSync(f)) continue;
  const html = readFileSync(f, "utf8");
  for (const label of ALWAYS_SHOWN) {
    if (!html.includes(`<dt>${label}</dt>`)) missingLabel.push(`${c}: ${label}`);
  }
}
check(
  facilities.length > 0 && missingLabel.length === 0,
  `${ALWAYS_SHOWN.join(" and ")} shown on all ${facilities.length} sampled facility page(s)`,
  facilities.length === 0
    ? "no facility pages were sampled, so this run proves nothing"
    : `a field is displayed only when it carries a value, so absence has ` +
      `to stand for every other value: ${missingLabel.slice(0, 5).join(", ")}`
);

if (problems.length) {
  console.error(`\nFAIL  ${problems.length} problem(s):\n`);
  for (const p of problems) console.error(`  - ${p}`);
  process.exit(1);
}
console.log("\nThe pages say what the data says.");
