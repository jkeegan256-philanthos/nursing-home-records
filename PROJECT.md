# PROJECT.md

The shared understanding behind this site. Read this before changing
anything. Code shows how; this file shows why and where the lines are.

## Purpose

Make the ownership structure of America's certified nursing homes
readable in seconds. Most people assume these are government
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

## What the filings are

These are disclosures filed by the facilities and their parties
themselves. CMS publishes them as filed and does not independently
verify them. Gaps and layered structures in the filings appear here as
gaps. Our checksums prove the mirror matches the source; they are
silent about whether the source matches reality. The site says this
where readers will see it, because a confident-looking mirror can
launder self-reported filings into apparent fact, and refusing that
laundering is provenance of a deeper kind.

## Named individuals

The disclosure file names natural persons — owners, officers, managing
employees — and this site makes those names searchable nationwide,
which CMS's own site does not. That is deliberate. The disclosure
exists so the public can see who stands behind a facility, and a
public record that cannot be found is not meaningfully public. The
safeguards are the principles above, applied without exception: exact
strings with no merging or identity claims (2), every name shown with
its role (3), the identical layout and neutral sort for every name
with no one singled out (4), and the declined scope — no money flows,
no editorial layer, no single-name campaigns. Corrections to the
underlying record belong with CMS; corrections to our display of it
belong on the corrections link.

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
A schedule also fires on the 5th at 09:47 UTC; delivery is measured
to run late and occasionally not at all, so the tap remains the
backup ritual whenever the 5th passes without a Scheduled run. The
Data page shows which batch is live. Local development:
`npm run fixture` then `npm run dev`.

## Continuity

Most civic tools are mortal; this one is built to fail legibly and
forkably. The code is MIT, the data is public and re-fetchable from
CMS, ADAPTATION.md maps the specifics, and the hosting has no bill to
lapse. Every page carries its batch vintage, so an unmaintained mirror
degrades into a labeled archive, not a silent lie. Anyone can fork the
repository and run the workflow to serve a current copy. An
institutional adopter is a legitimate outcome of outreach, not a
prerequisite for it.

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
- 2026-08-05: named-individual searchability written down as a
  deliberate decision, with principles 2-4 and the declined scope as
  its safeguards.
- 2026-08-05: owner pages pre-rendered at a uniform threshold, five or
  more distinct facilities, applied identically to every name per
  principle 4. Every other name remains searchable in the explorer.
- 2026-08-05: after the second external audit, adopted the
  self-reported-filings caveat on the Ownership page, About, and this
  charter; added continuity documentation; calibrated audience claims
  to the professional-tool-first reality; retired "readable by anyone"
  until the ergonomics release earns it. Declined per-entity business
  inference (e.g. "appears to provide pharmacy services") as a
  forbidden identity claim; the charter-clean substitute is CMS's own
  role definitions inline, which rides with the glossary work.
- 2026-08-06: integrity ledger and drift notes added. The ledger
  deliberately proves this mirror's served history, not CMS's, and
  says so beside the table. Drift notes report structural change only;
  row deltas stay silent because change-over-time display is the
  deferred retention feature, whose fence stands.
- 2026-08-06: ergonomics release shipped - keyboard-operable record
  tabs, responsive table and layout refinements, state tables gain
  filter, neutral-key sort, and the deferred CSV button. The standing
  rule's condition is met; when family-facing promotion begins is the
  founder's call, not triggered by the merge.
- 2026-08-05: scheduler verdict, by run label after a day of controlled
  measurement: scheduled delivery works on this account but arrives
  late (the monthly slot fired 4h54m behind) and drops some hourly
  slots. Permanent cron set to 09:47 UTC on the 5th, probe workflow
  retired, tap documented as the backup whenever the 5th passes
  without a Scheduled run.
