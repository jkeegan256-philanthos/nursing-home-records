# PROJECT.md

The shared understanding behind this site. Read this before changing
anything. Code shows how; this file shows why and where the lines are.

## Purpose

Make the ownership structure of America's certified nursing homes
readable by anyone in seconds. Most people assume these are government
institutions. The data says otherwise: roughly three in four are
operated for profit, fewer than one in fifteen by any government, and
every facility in the file holds Medicare or Medicaid certification,
which is the only reason it appears in CMS data at all. Around 1.25
million people live in them on an average day. The site shows who
stands behind each building, in what role, since when, plainly and
without commentary.

## Audiences

Families choosing a facility. Hospital discharge planners. Reporters
who need a citable link. State agencies vetting owners. Researchers.
Workers deciding where to work. Small audiences with large leverage.

## Principles

These are load-bearing. A change that violates one is wrong even if it
looks useful.

1. Display, never calculate. Every value on the site is CMS's own,
   shown as published. Counts of rows and groupings by published
   fields are allowed; derived scores, rankings by judgment, and
   edited values are not.
2. Exact strings. Names group by the exact published name. No
   matching, merging, or identity claims. Related companies often file
   under several names; the site says so instead of guessing.
3. Roles first. The disclosure file includes lenders, accountants,
   consultants, and managers, not just owners. Any view that shows a
   name without its role misleads.
4. Uniform rules, no targets. Every name gets the identical layout.
   Sort keys are neutral. The site never singles anyone out; whatever
   pattern exists reveals itself to anyone who looks.
5. Radical provenance. Every table carries its source file, CMS
   dataset id, and modified date. The untouched zip, manifest, and
   data dictionary are republished with a checksum. Processing
   warnings are public.
6. Full record one click away. Summaries never replace access to the
   complete published record.

## Declined scope

Decided deliberately. Do not revisit casually.

- No money flows. Cost reports, payments, and margins are out. The
  site maps who surrounds a building, not what they were paid.
- No name merging or entity resolution of our own. If portfolio
  averages are ever wanted, use CMS's own chain performance dataset,
  where CMS did the resolution and the math.
- No single-name campaigns. The founder's firsthand experience is the
  reason the site exists, not evidence on it. It stays out of the
  copy.
- No editorial layer: no adjectives, no verdicts, no "worst of"
  lists.

## Architecture in one breath

A GitHub Action fetches the monthly CMS nursing homes theme zip (or
uses one committed in data/), validates it against its manifest,
converts every CSV to Parquet as pure text with row counts asserted,
splits tables over 30 MB by state, and rebuilds a Next.js static
export: one page per state, one per facility, an Ownership page that
searches all owner names in the browser via DuckDB-WASM, and a Data
page with checksums and downloads. Deployed to GitHub Pages. About
545 MB and 14,751 pages per batch. No servers, no database, no
secrets.

## Operating it

Monthly refresh is one tap: Actions, Build and deploy, Run workflow.
A schedule also fires on the 5th, but GitHub pauses schedules on quiet
repos, so the tap is the ritual. The Data page shows which batch is
live. Local development: `npm run fixture` then `npm run dev`.

## Future phases, in order of value, none started

1. CMS chain performance layer: display CMS's own per-chain averages,
   cross-linked with the name pages. Stays inside principle 1 because
   CMS computes the numbers.
2. CSV export of any on-screen view, for citability.
3. Batch retention for then-versus-now display of successive
   published vintages.

Each waits until the current site proves insufficient, and each ships
only if it survives the principles above.

## Decision log

- 2025: first version built by hand over about nine months; expired
  July 2026.
- 2026-07-22: rebuild agreed. Zip-in, static-out, provenance
  everywhere, all values as text.
- 2026-07-22: full-record tables moved to on-demand load after the
  first build exceeded the GitHub Pages 1 GB cap.
- 2026-07-23: workflow changed to fetch the zip itself after hitting
  GitHub's 25 MB browser upload cap.
- 2026-07-23: Ownership page added after profiling the disclosure
  file: 61,671 names, two in five name-facility pairs holding stacked
  roles, corporate families splintered across spellings.
- 2026-07-24: trend-not-target confirmed as policy. Money flows,
  name merging, and single-name framing declined.
- 2026-07-24: home page ownership tallies, facility ownership chip,
  corrections link, and this charter added.
