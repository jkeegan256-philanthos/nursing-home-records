# ADAPTATION.md

This repository is a working instance for one dataset: the CMS Provider
Data Catalog nursing homes theme. The pipeline's shape is generic; its
knowledge is not. This file maps every nursing-home-specific touchpoint
so that adapting it to another theme is a measured job, not an
archaeology project. It is a boundary document, not a promise: per the
charter, generalizing is consciously deferred.

## The ten touchpoints

1. Table map. `TABLE_PATTERNS` in `scripts/build_data.py`: eighteen
   filename regexes naming this theme's files. Unknown files still
   publish with a warning, so a fork runs on day one, but with
   auto-slugged names and no curation. A new theme means a new map.

2. Hub table. The whole design assumes `NH_ProviderInfo` is the spine:
   it drives page generation, the search index, and per-record pages.
   `SLIM_COLUMNS` (the six hard-fail anchors) and the `providers`
   handling in `build_data.py` encode that choice. Another theme must
   pick its own spine file and its own anchors.

3. Display columns. `OPTIONAL_PROVIDER_COLUMNS` in `lib/data.ts`, plus
   `KEY_FACTS` and `RATINGS` in `app/facility/[ccn]/page.tsx`: the
   curated fields, the five-star rendering, and the Abuse Icon and
   Special Focus chips are this dataset's vocabulary.

4. Join key. `CCN_CANDIDATES` assumes records join on a CCN. Most CMS
   provider themes share this; supplier and clinician data joins on
   NPI instead, which would touch the map, the client tabs, and URLs.

5. State partitioning. `STATE_CANDIDATES`, the 30 MB threshold, the
   two-letter sanitization, and the `_OTHER` bucket are tuned to this
   theme's file sizes and geography. The mechanism ports; the tuning
   does not.

6. The ownership layer. `export_owners`, `ownership_all.parquet`,
   `owners-top.json`, the literal `"Owner Name"` column, the blank-name
   filter, the Owners page, and the 5-plus-facility page threshold.
   Wholly specific: most themes have no equivalent file.

7. Copy and identity. `SITE_NAME`, ledes, the home-page ownership
   tallies (which parse this dataset's "For profit" prefixes),
   PROJECT.md itself, the CMS zip URL in the workflow, and
   `CMS_DATASET_URL`, which assumes Provider Data Catalog dataset IDs.

8. The fixture. `scripts/dev_fixture.py` fabricates this theme's
   files and headers, and CI depends on it. A fork needs a new
   fixture before it has tests.

9. Carried state. `NH_STATE_URL` in `build-deploy.yml`, and the
   `STATE_BASE` default in `scripts/build_data.py`, both point at
   *this* deployment's `/data/`. A fork that leaves them reads this
   site's ledger and this site's owner-slug reservations and serves
   them as its own history. Point them at your own deployed `/data/`
   URL. The build then stops rather than silently start a new chain,
   so a first build whose URL does not resolve yet needs
   `NH_STATE_BOOTSTRAP=1` once; see `state/README.md`. Not theme
   knowledge, but the same kind of hazard: a default that is correct
   here and wrong everywhere else, and quiet either way.

10. Absolute site identity. `SITE_URL` in `lib/config.ts` is the
    origin stamped into `sitemap.xml` and `robots.txt`; `REPO_URL`
    is where About and the Data page send readers for the decision
    log; `CORRECTIONS_EMAIL` is where error reports land. All three
    default to this deployment. A fork that renames `SITE_NAME` and
    stops there ships a site telling search engines it lives at
    nursinghomerecords.org and telling readers to write here about
    its data.

## Already generic, no adaptation needed

Manifest validation, the all-text fidelity policy, row-count
assertions, checksum and originals republishing, the per-state Parquet
mechanics, `data-map.json`, the DuckDB-WASM client, the provenance
strip, the deploy workflow's shape, and the warnings channel.

## Honest sizing

For someone who knows the target theme's files: a new table map, a
spine-table decision with its column lists, a new fixture, and new
copy. Roughly a few focused days. The pipeline core carries over
untouched. That is the "real work" the first external review
underestimated as a config change.

Touchpoints 9 and 10 are the exception to the shape of that estimate.
They cost minutes rather than days, and they were missing from this
document until 2026-08-22, which is the more useful fact about them: a
fork that skipped them would not fail, it would run, and it would
inherit this deployment's history and this deployment's address while
appearing to work. Do them first, before the first build.
