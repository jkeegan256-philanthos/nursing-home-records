# Nursing Home Records

A static site that republishes the CMS Provider Data Catalog nursing
homes theme exactly as CMS ships it. No calculations, no filtering, no
editorial layer. One zip goes in each month; a browsable site comes out.

Read `PROJECT.md` first. It holds the goals, the principles, and the
declined scope that every change must respect. Its decision log also
records the features this project shipped and then reversed, with the
reasoning at full length — reversals are documented here, not erased.

Rename the site in `lib/config.ts` (`SITE_NAME`), and point
`CORRECTIONS_URL` wherever you want error reports to land.

## How it works

    data/                                    optional zip override; CI fetches otherwise
    scripts/build_data.py                    zip -> Parquet + JSON, via DuckDB
    scripts/dev_fixture.py                   tiny synthetic batch for testing
    app/, components/, lib/                  Next.js site (static export)
    state/                                   carried state: ledger, slug reservations
    .github/workflows/build-deploy.yml       CI: transform, build, deploy

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
5. Next.js pre-renders the home page, one page per state, and one page
   per facility from `NH_ProviderInfo`. Per-facility detail tables
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
"Run workflow". Roughly 10 minutes later the new batch is live. A
scheduled run also fires on the 5th of each month at 09:47 UTC;
measured behavior is that delivery can run hours late and can skip a
slot entirely, so if the 5th passes with no run wearing the Scheduled
label, the tap is the dependable ritual. Works from a phone.

Committing a zip to `data/` pins the build to that exact batch instead
of fetching; see `data/README.md`.

## First-time setup

1. Create a public GitHub repository and push this folder to `main`.
   Free GitHub Pages only publishes from public repos, which fits a
   public data site anyway.
2. In the repo: Settings, then Pages, then set Source to
   "GitHub Actions".
3. Wait for the first workflow run to finish, then open the URL shown
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
its extension URL at run time. CI runs it on every pull request.

The build carries state between batches — the ledger chain and the owner
slug reservations — reading the deployed site first and the committed
copy in `state/` second. If neither can be read it stops rather than
silently start a new chain; see `state/README.md`. A local `npm run data`
never writes to `state/`, and `npm run fixture` carries no state at all.

`npm run build` downloads the DuckDB Parquet extension once, into
`public/duckdb/extensions/` (gitignored), and reuses it after that, so
the first build on a fresh clone needs network.

## The June 2026 batch, measured

- Input: 613 MB of CSV across 18 datasets, 2,293,572 rows,
  14,695 facilities.
- Output: 25 MB of Parquet. The 184 MB quality reporting file compresses
  to 3.0 MB; health citations go from 165 MB to 3.8 MB.
- Transform: about 2.5 minutes. Full static build: about 4 minutes,
  14,751 pages. Deployed site: about 545 MB.

## Hosting notes

- GitHub Pages caps a published site at 1 GB. The current export is
  around 545 MB, so there is headroom, but keep an eye on it if CMS
  grows the datasets.
- Cloudflare Pages caps deployments at 20,000 files. This export is
  about 29,800 files (each pre-rendered page ships an HTML file plus a
  small payload file), so it does not fit there without cutting the
  per-facility pages.
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
- Build fails with "unreachable ... and no committed copy exists": the
  previous batch's ledger and slug reservations could not be read from
  either source, and continuing would restart the chain permanently.
  Re-run once the source is reachable. Only if you mean to start a new
  chain — a fork's first build, say — set `NH_STATE_BOOTSTRAP=1` once.
- The workflow log shows the same per-table report the script prints
  locally: rows, sizes, and mode for every dataset.

## License

The code in this repository is released under the MIT License (see
LICENSE). The data it republishes is published by CMS as a work of the
United States government and is public domain; it is not covered by,
and does not need, the code license.
