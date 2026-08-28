# Nursing Home Records

A static site that republishes the CMS Provider Data Catalog nursing
homes theme exactly as CMS ships it, live at
[nursinghomerecords.org](https://nursinghomerecords.org) and rebuilt
monthly from the CMS source zip. No calculations, no filtering, no
editorial layer. One zip goes in each month; a browsable site comes out.

Reviewing or changing this? `PROJECT.md` has a short "Reviewing this
project" section on why reading the code is not enough here, and what
to run instead.

Read `PROJECT.md` first. It holds the goals, the principles, and the
declined scope that every change must respect. `DECISIONS.md` is the
log beside it: every feature this project shipped and then reversed,
dated and at full length. Reversals are documented here, not erased.

Forking? Work through the touchpoints in `ADAPTATION.md`, which is the
only place they are listed. This file deliberately does not repeat them
or count them, because a list kept in two places drifts in one of them
silently, and the drift that matters here is not cosmetic: several
touchpoints carry this deployment's identity, one of them names a real
person, and a fork that misses them still builds. It just tells search
engines it lives at this domain, reads this site's batch history as its
own, and publishes somebody else's name as its author.

## How it works

    data/                                    optional zip override; CI fetches otherwise
    scripts/build_data.py                    zip -> Parquet + JSON, via DuckDB
    scripts/dev_fixture.py                   tiny synthetic batch for testing
    app/, components/, lib/                  Next.js site (static export)
    state/                                   carried state: ledger, slug reservations
    .github/workflows/build-deploy.yml       deploys: transform, build, gates, publish
    .github/workflows/ci.yml                 PR gate: the fixture batch through every check

On every push, monthly schedule, or manual run, the Action fetches the
current CMS theme zip (or uses one committed in `data/`), then runs the
transform and `next build`:

0. `scripts/vendor-assets.mjs` copies the DuckDB engine and the fonts out
   of `node_modules`, asks the engine its own version, and downloads the
   matching Parquet extension. Without that last step the engine fetches
   the extension from `extensions.duckdb.org` in every reader's browser.
1. The zip is unzipped and checked against the CMS `manifest.json`
   inside it (file presence and byte sizes). The zip's SHA-256 is
   recorded and shown on the site.
2. Every CSV becomes Parquet (zstd). Tables over 30 MB of CSV are split
   into one file per state (`public/data/parquet/<table>/<ST>.parquet`)
   so the browser can pull one small file; the rest are single files.
3. Row counts are asserted equal between each CSV and its Parquet
   output. Any mismatch fails the build.
4. The untouched zip, the CMS data dictionary PDF, and the manifest are
   republished under `/data/downloads/`.
5. Next.js pre-renders every page: the home page, one page per state,
   one page per facility from `NH_ProviderInfo`, one page per
   disclosed owner name at five or more facilities, and the About,
   Data, Methods, and glossary pages. Per-facility detail tables
   (citations, penalties, ownership, and so on) are queried in the
   browser with DuckDB-WASM against the Parquet files.
6. The Ownership page regroups the ownership file by owner name. The
   transform writes one whole-country copy
   (`public/data/parquet/ownership_all.parquet`) for name search, and
   `build/owners-top.json` with the names connected to the most
   facilities.

Fidelity rules the pipeline enforces:

- Every column is read and published as text. No type inference, so
  leading zeros in CCNs, ZIP codes, and tag numbers survive untouched.
- Values are never edited, computed, or filtered. Column names are kept
  exactly as CMS publishes them, spaces and all.
- If CMS adds a file the script does not recognize, it is still
  published, and a processing note appears on the site's Data page.
- Datasets carry their own CMS `modified_date`, shown next to every
  table, because files in one theme download can differ in vintage.
- The Ownership page groups rows by the exact name string CMS
  publishes. Counts are distinct facilities. No names are matched,
  merged, or ranked by anything except those counts.

## Monthly update (the whole job)

Open the repo's Actions tab, choose "Build and deploy", and tap
"Run workflow". About six minutes later the new batch is live
(measured below). A
scheduled run also fires on the 5th of each month at 09:47 UTC;
measured behavior is that delivery can run hours late and can skip a
slot entirely, so if the 5th passes with no run wearing the Scheduled
label, the tap is the dependable ritual. Works from a phone.

"Has CMS published anything new?" has a cheaper answer than the 39 MB
zip. CMS's catalog at
`https://data.cms.gov/provider-data/api/1/metastore/schemas/dataset/items`
returns every Provider Data Catalog dataset; the entries whose theme
is "Nursing homes including rehab services" are this site's eighteen.
Each carries four dates: `modified` (the data's vintage, the field
this site displays), `released` (when CMS published it), `%modified`
(the publish timestamp, to the second), and `nextUpdateDate` (CMS's
own stated expectation for the next release, operator intelligence
rather than a promise). The probe answers in both directions the
question the zip's checksum answers in one: an unchanged checksum
proves the data is unchanged, but a changed checksum can be a
repackaged container around byte-identical files, which the build
names in its processing notes when it happens. This is a manual
check, deliberately not wired into the build, whose input stays the
zip alone.

Committing a zip to `data/` pins the build to that exact batch instead
of fetching; see `data/README.md`.

## First-time setup

1. Create a public GitHub repository and push this folder to `main`.
   Free GitHub Pages only publishes from public repos, which fits a
   public data site anyway.
2. In the repo: Settings, then Pages, then set Source to
   "GitHub Actions".
3. Point `NH_STATE_URL` and `lib/config.ts` at your own deployment
   (the touchpoints in `ADAPTATION.md`). For the very first run only, whose URL does not serve
   anything yet, add `NH_STATE_BOOTSTRAP=1` to the workflow's
   environment; remove it afterwards.
4. Wait for the first workflow run to finish, then open the URL shown
   on the deploy step.

The site serves from the custom domain root, so the workflow's
"Set base path" step sets `NEXT_PUBLIC_BASE_PATH` to empty. To serve
from a project path instead, with no custom domain, swap in the
commented variant in `.github/workflows/build-deploy.yml`, which
derives the prefix from the repo name at run time. The old
github.io address redirects to the domain automatically.

## Local development

    npm ci
    pip install duckdb

    # quick loop with a tiny synthetic batch (no big zip needed)
    npm run fixture
    npm run dev

    # real data: put the zip in data/ first
    npm run data
    npm run dev

`npm run data` regenerates `public/data/` and `build/` from the zip.
For a fast production build while testing, cap the number of facility
pages: `PAGES_LIMIT=200 npm run build`.

`npm run check:origins` loads the built site in a browser and fails on
any request that leaves this origin. It is the gate that proves the site
is self-contained; a grep over the export cannot, because DuckDB builds
its extension URL at run time. It runs on every pull request against the
fixture, and on every deploy against the export about to be served.

The build carries state between batches, the ledger chain and the owner
slug reservations, reading the deployed site first and the committed
copy in `state/` second. If neither can be read it stops rather than
silently start a new chain; see `state/README.md`. A local `npm run data`
never writes to `state/`, and `npm run fixture` carries no state at all.

`npm run build` downloads the DuckDB Parquet extension once, into
`public/duckdb/extensions/` (gitignored), and reuses it after that, so
the first build on a fresh clone needs network.

## The August 2026 batch, measured

Figures read 2026-08-28 from deploy run 49's log and the batch
ledger, not recalled.

- Input: one 39.1 MB zip carrying 18 CMS datasets; 14,690 facilities
  across 53 states and territories.
- Published: 2,547,105 rows across 19 Parquet tables, the 18 datasets
  plus the transform's whole-country ownership copy, every value as
  text.
- Pages: 20,377. One per facility, one per state, one per disclosed
  owner name at five or more facilities (5,628 this batch), and six
  static pages.
- The compressed Pages artifact is 234 MB. The uncompressed CSV and
  Parquet totals are printed in every transform log; they were last
  read whole on the June batch (613 MB of CSV to 25 MB of Parquet)
  and the next run's log is the current answer.

## Run time, measured

A healthy end-to-end run is roughly 5 to 6 minutes, and the spread is
mostly not ours. Measured 2026-08-28 across four runs on the real
batch, Next 16 on Node 24, runs 46 to 49: end to end 5m26s to 6m00s.
Within run 49: transform 1m03s, `next build` 2m07s, Chromium install
26s, origin check 17s, Pages artifact upload 29s, deploy job 27s.
One figure kept for comparison across the framework major, build
against build: `next build` measured about 1m30s under Next 15 on
2026-08-22. Judge a slow run by the build job, not the run total; a
build job much past 4 minutes is worth looking at, a slow deploy job
usually is not.

## Hosting notes

- GitHub Pages caps a published site at 1 GB. The export was last
  measured whole on the June batch at 545 MB, before the owner pages
  shipped; it has grown since (20,377 pages against June's 14,751),
  and the compressed Pages artifact measured 234 MB on run 49. Worth
  re-measuring the uncompressed size at the next refresh rather than
  assuming the headroom.
- Cloudflare Pages caps deployments at 20,000 files. The pre-rendered
  pages alone are over 40,000 files (each page ships an HTML file
  plus a small payload file), so this export does not fit there
  without cutting the per-facility pages.
- The Parquet layout uses exact file names, not globs, because DuckDB
  in the browser cannot list directories over HTTP.

## Data and affiliation

All data comes from the Centers for Medicare & Medicaid Services
Provider Data Catalog and is United States government public data. This
project is not affiliated with or endorsed by CMS. Each table on the
site links to its CMS dataset page.

## Troubleshooting

- Build fails with "ProviderInfo is missing columns the site needs":
  CMS renamed a column. Update `SLIM_COLUMNS` in `scripts/build_data.py`
  and the matching names in `lib/data.ts`.
- Processing notes on the Data page list anything unusual the transform
  saw (unknown files, size mismatches, rows with a blank state).
- Processing note "batch change: <count> N -> M": a headline figure moved
  at a monthly refresh. The source filename changed too, so nothing can
  say whether CMS moved it or the pipeline did; read the size of the
  move. A few hundred either way is ordinary. A collapse is not.
- Build fails with "a published count changed while its source file did
  not": a number this site displays moved while the CMS file it derives
  from is byte-identical to an earlier build, so CMS cannot have caused
  it. Find the pipeline change. `NH_ALLOW_COUNT_DRIFT=1` passes it
  through and records it in the ledger entry as a decision.
- Build fails with "unreachable ... and no committed copy exists": the
  previous batch's ledger and slug reservations could not be read from
  either source, and continuing would restart the chain permanently.
  Re-run once the source is reachable. Only if you mean to start a new
  chain, a fork's first build for instance, set `NH_STATE_BOOTSTRAP=1`
  once.
- The workflow log shows the same per-table report the script prints
  locally: rows, sizes, and mode for every dataset.

## License

The code in this repository is released under the MIT License (see
LICENSE). The data it republishes is published by CMS as a work of the
United States government and is public domain; it is not covered by,
and does not need, the code license.
