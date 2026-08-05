# ADAPTATION.md

This repository is a working instance for one dataset: the CMS Provider
Data Catalog nursing homes theme. The pipeline's shape is generic; its
knowledge is not. This file maps every nursing-home-specific touchpoint
so that adapting it to another theme is a measured job, not an
archaeology project. It is a boundary document, not a promise: per the
charter, generalizing is consciously deferred.

## The eight touchpoints

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
