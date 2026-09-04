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
// A first-N sample concentrates on whatever order the filesystem
// happens to return, undisclosed; a sorted fixed-stride spread covers
// the whole range and is the same on every run.
const facilityDirsAll = existsSync(facDir) ? readdirSync(facDir).sort() : [];
const facStep = Math.max(1, Math.ceil(facilityDirsAll.length / 200));
const facilities = facilityDirsAll.filter((_, i) => i % facStep === 0).slice(0, 200);
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

// CMS's own state and national averages shipped in every batch and
// rendered nowhere for the site's first month; a persona review found
// the gap. This asserts each state page shows the block and that its
// numbers match the build artifact, which matches the published file,
// so the block can neither quietly vanish nor drift from CMS's values.
const AVG_PATH = "build/state-averages.json";
if (!existsSync(AVG_PATH)) {
  console.log("  --    no state-averages artifact in this batch; nothing to check");
} else {
  const avg = JSON.parse(readFileSync(AVG_PATH, "utf8"));
  const keyAt = avg.columns.indexOf("State or Nation");
  const CURATED = [
    "Overall Rating",
    "Health Inspection Rating",
    "QM Rating",
    "Staffing Rating",
    "Cycle 1 Total Number of Health Deficiencies",
  ];
  const curatedAt = CURATED.map((c) => avg.columns.indexOf(c)).filter((i) => i >= 0);
  const rowFor = (want) =>
    avg.rows.find((r) => ((r[keyAt] ?? "") + "").trim().toUpperCase() === want) ?? null;
  let statesChecked = 0;
  const avgProblems = [];
  for (const st of states) {
    const row = keyAt < 0 ? null : rowFor(st.toUpperCase());
    if (!row) continue;
    const file = join(stateDir, st, "index.html");
    if (!existsSync(file)) continue;
    const html = readFileSync(file, "utf8");
    const block = /<section class="averages"[\s\S]*?<\/section>/.exec(html);
    if (!block) {
      avgProblems.push(`${st}: CMS published averages for this state and the page shows no averages block`);
      continue;
    }
    const text = block[0].replace(/<[^>]*>/g, " ");
    for (const i of curatedAt) {
      const v = ((row[i] ?? "") + "").trim();
      if (v && !text.includes(v)) {
        avgProblems.push(`${st}: published ${avg.columns[i]} is ${JSON.stringify(v)} and the block does not show it`);
      }
    }
    statesChecked++;
  }
  check(
    statesChecked > 0 && avgProblems.length === 0,
    `state and national averages shown and matching on ${statesChecked} state page(s)`,
    avgProblems.length
      ? `state pages disagree with CMS's published averages:\n      ` +
        avgProblems.slice(0, 8).join("\n      ")
      : "the averages artifact exists but no sampled state page could be checked against it"
  );
}

// The head must identify each page. Search engines and citation tools
// read the head and nothing else, so a head that says less than the
// page, or says the same thing on fourteen thousand pages, is the
// star-glyph problem in another organ: the page depicts an identity
// its machine-readable text does not carry. Canonicals are checked
// against the sitemap so the two ways the site states a page's address
// are provably the same string.
const stripComments = (s) => s.replace(/<!--[\s\S]*?-->/g, "");
const headOf = (file) =>
  /<head>[\s\S]*?<\/head>/.exec(stripComments(readFileSync(file, "utf8")))?.[0] ?? "";
const canonicalsOf = (head) =>
  [...head.matchAll(/<link[^>]*rel="canonical"[^>]*>/g)].map(
    (m) => /href="([^"]*)"/.exec(m[0])?.[1] ?? ""
  );
const descriptionOf = (head) =>
  /<meta[^>]*name="description"[^>]*content="([^"]*)"/.exec(head)?.[1] ??
  /<meta[^>]*content="([^"]*)"[^>]*name="description"/.exec(head)?.[1] ??
  "";
const titleOf = (head) => /<title>([\s\S]*?)<\/title>/.exec(head)?.[1] ?? "";
// Mirrors React's escapeHtml exactly: the five characters its
// serializer escapes in text and attribute values (amp, lt, gt,
// quot, and the apostrophe as &#x27;). This model and the serializer
// drift independently, which is how deploy run 63 failed on the
// first real apostrophe the widened sample met: the set here was
// missing #x27 and had never run that branch. The fixture now plants
// all five entities in published values, so a divergence between
// this function and what React emits goes red in CI instead of on a
// deploy. If a character is ever added or removed on either side,
// the other side and the fixture move with it.
const esc = (s) =>
  s
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#x27;");

const sitemapFile = join(DIR, "sitemap.xml");
const sitemapUrls = new Set(
  existsSync(sitemapFile)
    ? [...readFileSync(sitemapFile, "utf8").matchAll(/<loc>([^<]+)<\/loc>/g)].map((m) => m[1])
    : []
);

const cityAt = col("City/Town");
const headProblems = [];
let headsChecked = 0;

const checkHead = (file, path, expect = {}) => {
  if (!existsSync(file)) return;
  const head = headOf(file);
  const canon = canonicalsOf(head);
  if (canon.length !== 1) {
    headProblems.push(`${path}: ${canon.length} canonical link(s), want exactly 1`);
  } else {
    if (!canon[0].endsWith(path)) {
      headProblems.push(`${path}: canonical ${canon[0]} does not end with the page's own path`);
    }
    if (sitemapUrls.size && !sitemapUrls.has(canon[0])) {
      headProblems.push(`${path}: canonical ${canon[0]} is not the sitemap's URL for this page`);
    }
  }
  const desc = descriptionOf(head);
  if (!desc) headProblems.push(`${path}: no meta description`);
  for (const want of expect.desc ?? []) {
    if (desc && !desc.includes(esc(want))) {
      headProblems.push(`${path}: description omits ${JSON.stringify(want)}`);
    }
  }
  for (const want of expect.title ?? []) {
    if (!titleOf(head).includes(esc(want))) {
      headProblems.push(`${path}: title omits ${JSON.stringify(want)}`);
    }
  }
  headsChecked++;
};

for (const p of ["/", "/owners/", "/data/", "/about/", "/glossary/", "/methods/"]) {
  checkHead(join(DIR, p === "/" ? "index.html" : p.slice(1, -1), p === "/" ? "" : "index.html"), p);
}

const slimRows = new Map(slim.rows.map((r) => [r[ccnAt], r]));
for (const c of facilities) {
  const ccn = decodeURIComponent(c);
  const row = slimRows.get(ccn);
  if (!row) continue;
  const city = ((row[cityAt] ?? "") + "").trim();
  const state = ((row[col("State")] ?? "") + "").trim();
  checkHead(join(facDir, c, "index.html"), `/facility/${encodeURIComponent(ccn)}/`, {
    desc: [ccn, city],
    title: city && state ? [`${city}, ${state}`] : [],
  });
}

for (const st of states) {
  const count = slim.rows.filter((r) => ((r[col("State")] ?? "") + "").trim() === st).length;
  checkHead(join(stateDir, st, "index.html"), `/state/${st}/`, {
    desc: count ? [count.toLocaleString("en-US")] : [],
  });
}

const OWNER_PAGES_PATH = "build/owner-pages.json";
if (existsSync(OWNER_PAGES_PATH)) {
  const bySlug = new Map(
    JSON.parse(readFileSync(OWNER_PAGES_PATH, "utf8")).owners.map((o) => [o.slug, o])
  );
  const ownerDir = join(DIR, "owner");
  const ownerDirsAll = existsSync(ownerDir) ? readdirSync(ownerDir).sort() : [];
  const ownerStep = Math.max(1, Math.ceil(ownerDirsAll.length / 50));
  const ownerDirs = ownerDirsAll.filter((_, i) => i % ownerStep === 0).slice(0, 50);
  for (const slug of ownerDirs) {
    const o = bySlug.get(slug);
    if (!o) continue;
    checkHead(join(ownerDir, slug, "index.html"), `/owner/${slug}/`, {
      desc: [
        `${o.facilities.toLocaleString("en-US")} ${o.facilities === 1 ? "facility" : "facilities"}`,
        `${o.states} ${o.states === 1 ? "state" : "states"}`,
      ],
    });
  }
}

check(
  headsChecked > 0 && headProblems.length === 0,
  `head identity (canonical, description, title) on ${headsChecked} page(s)`,
  headProblems.length
    ? `heads disagree with the pages they describe:\n      ` +
      headProblems.slice(0, 10).join("\n      ") +
      (headProblems.length > 10 ? `\n      …and ${headProblems.length - 10} more` : "")
    : "no page heads were checked, so this run proves nothing"
);

// Structured data must repeat the page, exactly. The JSON-LD blocks
// are the machine-readable copy of what the page already renders, so
// every value is checked against the published row, and the two
// charter fences are enforced as absences: no rating ever appears as
// review vocabulary, and a published name containing a closing script
// tag must survive serialization without ending the block early. The
// fixture plants exactly that name, so this run proves the escape
// rather than assuming it.
const ldBlocksOf = (html) =>
  [...stripComments(html).matchAll(
    /<script type="application\/ld\+json">([\s\S]*?)<\/script>/g
  )].map((m) => m[1]);

const ldProblems = [];
let ldChecked = 0;
let hostileSeen = false;

for (const c of facilities) {
  const file = join(facDir, c, "index.html");
  if (!existsSync(file)) continue;
  const ccn = decodeURIComponent(c);
  const row = slimRows.get(ccn);
  if (!row) continue;
  const html = readFileSync(file, "utf8");
  const blocks = ldBlocksOf(html);
  if (blocks.length < 2) {
    ldProblems.push(`${ccn}: ${blocks.length} JSON-LD block(s), want the entity and the breadcrumb`);
    continue;
  }
  let entity = null;
  let crumbs = null;
  for (const b of blocks) {
    let parsed;
    try {
      parsed = JSON.parse(b);
    } catch {
      ldProblems.push(`${ccn}: a JSON-LD block does not parse; a value likely broke out of the script element`);
      continue;
    }
    if (parsed["@type"] === "MedicalOrganization") entity = parsed;
    if (parsed["@type"] === "BreadcrumbList") crumbs = parsed;
  }
  const name = ((row[col("Provider Name")] ?? "") + "").trim();
  const city = ((row[cityAt] ?? "") + "").trim();
  const state = ((row[col("State")] ?? "") + "").trim();
  if (!entity) {
    ldProblems.push(`${ccn}: no MedicalOrganization entity`);
  } else {
    if (entity.name !== name)
      ldProblems.push(`${ccn}: entity name ${JSON.stringify(entity.name)} is not the published ${JSON.stringify(name)}`);
    if ((entity.address?.addressLocality ?? "").trim() !== city)
      ldProblems.push(`${ccn}: entity locality disagrees with the published city`);
    if ((entity.address?.addressRegion ?? "").trim() !== state)
      ldProblems.push(`${ccn}: entity region disagrees with the published state`);
    if (entity.identifier?.value !== ccn)
      ldProblems.push(`${ccn}: entity identifier is not the CCN`);
    if (name.includes("</script>")) hostileSeen = true;
  }
  if (!crumbs || (crumbs.itemListElement ?? []).length < 3) {
    ldProblems.push(`${ccn}: breadcrumb list missing or short`);
  }
  ldChecked++;
}

check(
  ldChecked > 0 && ldProblems.length === 0,
  `structured data repeats the published record on ${ldChecked} facility page(s)`,
  ldProblems.length
    ? `JSON-LD disagrees with the pages:\n      ` +
      ldProblems.slice(0, 8).join("\n      ")
    : "no facility JSON-LD was checked, so this run proves nothing"
);

// The escape proof needs its hostile input to exist. When the sample
// is the whole export (the fixture), the planted name must be present
// and the assertion is firm. When the export outruns the sample (a
// real batch), the escape was exercised by CI's fixture run; printing
// a green here would be success claimed for finding nothing, so it is
// a stated skip instead.
if (facilityDirsAll.length > 0 && facilityDirsAll.length <= facilities.length) {
  check(
    hostileSeen,
    "a name containing a closing script tag survived serialization intact",
    "no facility name contains </script>; the fixture is supposed to plant one, so the escape went unexercised"
  );
} else if (!hostileSeen) {
  console.log(
    "  --    no sampled name carries </script> on this batch; the escape is proven by the fixture in CI"
  );
}

// The charter fence, as an absence the gate owns: a regulator's rating
// must never wear review vocabulary.
const reviewVocab = [];
for (const c of facilities) {
  const f = join(facDir, c, "index.html");
  if (!existsSync(f)) continue;
  const html = readFileSync(f, "utf8");
  if (html.includes("aggregateRating") || html.includes('"@type":"Review"')) {
    reviewVocab.push(c);
  }
}
check(
  reviewVocab.length === 0,
  "no page presents a CMS rating as review vocabulary",
  `aggregateRating or Review markup found on ${reviewVocab.length} page(s), e.g. ${reviewVocab[0]}`
);

// The Methods page's named examples teach from the roles CMS filed,
// derived per batch (entry 69): every role and count the page shows
// for a named example must be the export's, in the export's order.
// The names are properties of the real file, so on the fixture the
// examples are absent by design and this is a stated skip; the firm
// branch runs on every real batch, where the examples exist.
{
  const methodsPage = join(DIR, "methods", "index.html");
  const topPath = "build/owners-top.json";
  const html = existsSync(methodsPage) ? readFileSync(methodsPage, "utf8") : "";
  const top = existsSync(topPath)
    ? JSON.parse(readFileSync(topPath, "utf8")).top
    : [];
  const named = ["FORVIS MAZARS LLP", "CIBC BANK USA"].filter((n) =>
    html.includes(esc(n))
  );
  if (named.length === 0) {
    console.log(
      "  --    Methods named examples absent from this batch (the fixture " +
        "by design); their role breakdowns are asserted on real batches"
    );
  } else {
    for (const name of named) {
      const row = top.find((t) => t.name === name);
      const missing = (row?.roles ?? []).filter(
        (r) =>
          !html.includes(
            `${esc(r.role)}</span> at ${r.facilities.toLocaleString()}`
          )
      );
      check(
        !!row && row.roles.length > 0 && missing.length === 0,
        `Methods shows ${name}'s roles as exported (${row?.roles.length ?? 0} role(s))`,
        row
          ? `missing from the page: ${missing.map((r) => `${r.role} at ${r.facilities}`).join("; ")}`
          : `${name} rendered on Methods but is not in ${topPath}`
      );
    }
  }
}

// The Data page's catalog: one Dataset per table, identified by CMS's
// own dataset id, matching the data map.
{
  const dataPage = join(DIR, "data", "index.html");
  const map = JSON.parse(readFileSync(join(DIR, "data/data-map.json"), "utf8"));
  const wantIds = new Set(
    Object.values(map.tables)
      .map((t) => t.dataset_id)
      .filter(Boolean)
  );
  const blocks = existsSync(dataPage) ? ldBlocksOf(readFileSync(dataPage, "utf8")) : [];
  let catalog = null;
  for (const b of blocks) {
    try {
      const parsed = JSON.parse(b);
      if (parsed["@type"] === "DataCatalog") catalog = parsed;
    } catch {
      /* unparseable blocks are caught by the assertion below */
    }
  }
  const haveIds = new Set(
    (catalog?.dataset ?? []).map((d) => d.identifier).filter(Boolean)
  );
  const missing = [...wantIds].filter((id) => !haveIds.has(id));
  check(
    wantIds.size > 0 && catalog !== null && missing.length === 0,
    `the Data page's catalog names all ${wantIds.size} CMS dataset id(s)`,
    catalog === null
      ? "the Data page carries no DataCatalog JSON-LD"
      : missing.length
        ? `dataset id(s) in the data map but not the catalog: ${missing.slice(0, 5).join(", ")}`
        : "the data map carries no dataset ids, so this run proves nothing"
  );
}

// The sitemap must date a page by what the page's content is, not by
// when this pipeline last ran: stamping fourteen thousand URLs with
// the processing date told crawlers the whole site changed monthly
// while the data sat still, the footer lesson unapplied. Expected
// dates are recomputed here from the deployed data map, so the output
// is checked against the data rather than the code against itself.
{
  const map = JSON.parse(readFileSync(join(DIR, "data/data-map.json"), "utf8"));
  const generated = (map.generated_at ?? "").slice(0, 10);
  const d = (name) => map.tables[name]?.modified_date ?? null;
  const maxDate = (...xs) => {
    const real = xs.filter(Boolean);
    return real.length ? real.sort().at(-1) : generated;
  };
  const expected = {
    "/facility/": maxDate(d("providers")),
    "/state/": maxDate(d("providers"), d("state_us_averages")),
    "/owner/": maxDate(d("ownership_all") ?? d("ownership")),
  };
  const entries = existsSync(sitemapFile)
    ? [...readFileSync(sitemapFile, "utf8").matchAll(
        /<url>\s*<loc>([^<]+)<\/loc>\s*(?:<lastmod>([^<]+)<\/lastmod>)?/g
      )].map((m) => ({ loc: m[1], lastmod: (m[2] ?? "").slice(0, 10) }))
    : [];
  const mapProblems = [];
  const seen = new Set();
  let datedChecked = 0;
  let differsFromGenerated = 0;
  for (const e of entries) {
    if (seen.has(e.loc)) mapProblems.push(`${e.loc} appears more than once`);
    seen.add(e.loc);
    if (!e.loc.endsWith("/")) mapProblems.push(`${e.loc} lacks the trailing slash`);
    const kind = Object.keys(expected).find((k) => e.loc.includes(k));
    if (!kind) continue;
    if (e.lastmod !== expected[kind]) {
      mapProblems.push(
        `${e.loc}: lastmod ${e.lastmod || "(none)"} but the batch's ` +
          `${kind} content is dated ${expected[kind]}`
      );
    }
    if (e.lastmod && e.lastmod !== generated) differsFromGenerated++;
    datedChecked++;
  }
  check(
    entries.length > 0 && datedChecked > 0 && mapProblems.length === 0,
    `sitemap dates ${datedChecked} record page(s) by their content's own date`,
    mapProblems.length
      ? `the sitemap misdates pages:\n      ` + mapProblems.slice(0, 8).join("\n      ")
      : "no sitemap entries were checked, so this run proves nothing"
  );
  // Vacuity guard: when the batch carries a vintage that differs from
  // the processing date, some entry must show it, or the fix has
  // silently regressed to stamping everything with build time.
  const anyDiffers = Object.values(expected).some((v) => v && v !== generated);
  if (anyDiffers) {
    check(
      differsFromGenerated > 0,
      "at least one sitemap date is the data's, not the build's",
      "the data map carries a vintage differing from the processing date, yet every sitemap entry is stamped with the processing date"
    );
  }
}

// The largest-footprints table must link the permanent record where
// one exists: a query-string address is not separately indexable and
// dies with the explorer, while /owner/ pages are the pre-rendered
// citations. Fallback to the query string is correct only for names
// below the page threshold or in a degraded batch.
if (existsSync(OWNER_PAGES_PATH)) {
  const ownersIndex = join(DIR, "owners", "index.html");
  const hasOwners = JSON.parse(readFileSync(OWNER_PAGES_PATH, "utf8")).owners.length > 0;
  if (hasOwners && existsSync(ownersIndex)) {
    const html = stripComments(readFileSync(ownersIndex, "utf8"));
    const ownerLinks = [...html.matchAll(/href="[^"]*\/owner\/([^/"]+)\//g)].map((m) => m[1]);
    const broken = ownerLinks.filter((slug) => !existsSync(join(DIR, "owner", slug)));
    check(
      ownerLinks.length > 0 && broken.length === 0,
      `owners index links ${ownerLinks.length} pre-rendered owner page(s), all resolving`,
      broken.length
        ? `owner links point at pages that do not exist: ${broken.slice(0, 5).join(", ")}`
        : "owner pages exist for this batch and the largest-footprints table links none of them"
    );
  }
}

// The omission disclosure must name what it omits: ownership rows are
// excluded from the Owners page for blank names and for CMS's literal
// 'None' alike, and calling both "blank" described a published value
// as an absence (ruled 2026-08-30). React escapes apostrophes in text,
// so the built HTML is matched on either form.
{
  const ownersTop = "build/owners-top.json";
  const ownersIndex = join(DIR, "owners", "index.html");
  if (existsSync(ownersTop) && existsSync(ownersIndex)) {
    const omitted = JSON.parse(readFileSync(ownersTop, "utf8")).blank_owner_rows;
    if (omitted > 0) {
      const html = readFileSync(ownersIndex, "utf8");
      check(
        /(?:'|&#x27;|&#39;)None(?:'|&#x27;|&#39;)/.test(html),
        "the Owners page's omission disclosure names CMS's literal 'None'",
        "rows are omitted for the literal 'None' as well as blanks, and the page's disclosure does not say so"
      );
    }
  }
}

// The 404 page: Next's built-in emitted a second <title> after the
// site's own, and the first one wins, so error pages announced
// themselves with the homepage's identity. One title, and no canonical,
// because an error page is not an address worth indexing.
const notFound = join(DIR, "404.html");
if (existsSync(notFound)) {
  const html = stripComments(readFileSync(notFound, "utf8"));
  const titles = [...html.matchAll(/<title>/g)].length;
  check(
    titles === 1,
    "the 404 page carries exactly one title",
    `404.html has ${titles} <title> element(s); the first wins, so a reader's tab and a crawler both see the wrong identity`
  );
  check(
    canonicalsOf(html).length === 0,
    "the 404 page claims no canonical address",
    "404.html carries a canonical link, presenting an error page as an indexable address"
  );
}

if (problems.length) {
  console.error(`\nFAIL  ${problems.length} problem(s):\n`);
  for (const p of problems) console.error(`  - ${p}`);
  process.exit(1);
}
console.log("\nThe pages say what the data says.");
