# Review batch 6: the DECISIONS audit

Read whole on 2026-08-30: all 56 entries of DECISIONS.md (1,774
lines) against the tree, standing claims spot-verified by grep and
read. Dated facts inside entries age correctly by design in an
append-only log and were not treated as drift. Buckets per the
founder's refinement: drift (log stale), unenforced rulings (log
right, nothing holds the code to it), and a third that emerged in
the reading: unruled surfaces. Notes only; nothing outside review/
was changed.

CORRECTED IN PLACE on 2026-08-30, by founder instruction, after the
cross-check found eight of this file's fourteen entry-number
citations pointing at the wrong entry: the log's entries carry no
numbers, the audit cited by inferred index, and an audit that cannot
be re-checked without redoing it is the failure it was auditing for.
Every citation below is now by date and opening phrase, which the
file itself carries. The evidence held in every case; only the
pointers were wrong. Two substantive corrections from the same
cross-check are folded in and marked.

## Accurate: standing claims spot-verified against the tree

The 2026-08-22 entry "the zero-third-party claim earned back": the
Data page's sentence stands, narrowed, carrying its own history
verbatim ("It was here once before while it was untrue"), its log
link correctly retargeted at DECISIONS.md. The 2026-08-07 entry
"the lookup-links row reversed": the reversal held completely; zero
hits for the three destinations anywhere in app/, components/,
lib/. The 2026-08-23 entry "the family-readiness hedge rewritten":
About says "compare, rank, or recommend" as recorded. The
2026-08-05 entry "scheduler verdict": the cron is 47 9 5 * * as
ruled. The 2026-08-23 entry "counts made accountable": the five
headline counts named are exactly the five record_count() calls.
The 2026-08-28 entry "the pages made legible to search engines":
the review-vocabulary absence is enforced in the rendered gate as
promised. The 2026-08-29 entry "the engine-loaded tables reviewed
at last": vendor staleness safe by construction, confirmed in
vendor-assets.mjs. The 2026-08-29 entry "the sticky first column
ships": the anchor's stated scope matches the code. The 2026-08-28
entry "the README reviewed whole" correcting the SEO entry's page
count inside the log is the append-only correction process working.

## Drift: the log or charter has aged out of the tree

- The 2026-08-23 entry "the site began linking its own front door"
  states "SITE_AUTHOR ships empty and the byline renders only when
  it is set... the decision can be reversed by clearing one
  string." lib/config.ts:19 ships `SITE_AUTHOR = "Joseph Keegan"`,
  and no entry records the populating edit; the comment above the
  constant still describes the empty-is-valid design. [Missed by
  this audit's first pass, caught by the cross-check; verified
  against the tree before being recorded here.] Naming the founder
  on this deployment is correct and undisputed; the defect is a
  falsified standing claim in the log, and the remedy is known: a
  dated entry recording the populating edit. drift with known
  remedy, HOW.
- state/README.md:24-25 and scripts/vendor-assets.mjs:12 both point
  at "the 2026-08-22 entry/entries in PROJECT.md". Those entries
  moved to DECISIONS.md on 2026-08-24, and the split entry ("this
  log split out of PROJECT.md") claims its grep found and
  retargeted the seven stale references; these two survived it, one
  line-wrapped mid-phrase, one in a code comment. The split entry's
  completeness claim is itself an instance of the structural shape.
  costs-clarity HOW.
- PROJECT.md:106: "About 545 MB and 14,751 pages per batch" in the
  charter's architecture section. The README-review entry taught
  that a measured figure carries its date and re-baselined the
  README; the charter's copy was left wearing the aged figures.
  20,377 pages is the measured current answer. costs-clarity HOW.
- ADAPTATION.md touchpoint 1 says "eighteen filename regexes"; true
  today (TABLE_PATTERNS holds 18) but a count inside the single
  source, the class the log retired twice. Observation. cosmetic.

## Unenforced rulings: the log is right and nothing holds the code

- The 2026-08-29 entry "the loaded tables sorted" states the
  mechanism as general, and lib/duckdb-client.ts carries it
  verbatim in a comment: a caller that sorts must sort in the
  query, never after the fetch, because post-fetch sorting orders
  only the rows that survived LIMIT. components/
  OwnerExplorer.tsx:113-115 runs querySQL with LIMIT 3000 and no
  ORDER BY, then sorts the returned rows client-side (:166-172).
  Latent today (the largest current footprint yields roughly 426
  rows, so the cap never binds), and the entry's stated boundary
  covers the loaded facility tables, so either the mechanism ruling
  is general and this call site violates it, or the explorer is an
  unruled surface performing the exact named trap. Requires a
  ruling either way. breaks-correctness (latent) WHAT.
  (Independently reached by both other reviewers: B3-3, B4-1.)
- The 2026-08-27 entry "CSV formula escaping declined" sets an
  explicit per-batch revisit condition: "if a future batch ever
  publishes a name beginning with one of those characters, this
  decision is to be revisited rather than inherited." Nothing tests
  any batch for a leading equals, plus, minus, or at sign. The
  condition is held by nobody and is mechanizable in one query at
  transform time. breaks-correctness (conditional, by the
  decision's own terms) HOW.
- The 2026-08-27 entry "search index weight recorded" same class:
  revisit "if a future batch pushes the compressed owner index
  materially past this figure." Nothing measures owners-slim.json
  per batch. HOW.
- [Corrected per the cross-check.] The first pass of this audit
  claimed the 2026-08-28 metastore entry's revisit condition is
  "wired into the September trigger and held by machinery." That
  trigger lives outside this repository, so the claim is
  unverifiable in-tree, which makes the sub-class possibly
  zero-for-three rather than the two-of-three first reported: no
  standing revisit condition in the log has a watcher this
  repository can prove exists. The one candidate proof of
  closeability is itself outside the repo. Stated plainly rather
  than smoothed: revisit conditions without watchers, zero
  verifiable of three.

## Unruled surfaces: the code takes a position the log never took

- The literal 'None' owner-name exclusion. The log contains no
  ruling: grep for 'None' and "blank owner" across all 56 entries
  returns nothing. The exclusion ships in two layers
  (scripts/build_data.py:445 and components/OwnerExplorer.tsx:20),
  ADAPTATION touchpoint 6 names only "the blank-name filter", and a
  'None' row is not blank. An interpretation of a published value,
  applied twice, decided nowhere. breaks-charter (edge) WHAT.
- Extension binary trust. The two 2026-08-22 entries retracting and
  earning back the third-party claim rule origin confinement at
  full length; no entry addresses whether the binary fetched from
  extensions.duckdb.org is itself verified. Feeds batch 2's WHAT.
- Owner-surface presentation order. The build-time owner pages
  (build_data.py:802) and the explorer detail (:166-172) sort by
  the same four columns, consistent with each other, disclosed on
  neither. The sort entry sets the disclosure standard for the
  facility tabs and is silent here. Feeds batch 1's WHAT.

## Nothing found here

The log's structure, preamble, declared count, and append-only
discipline check out. No decision is falsified by the tree except
the SITE_AUTHOR standing claim above; the other drift cases are
stale pointers and aged figures. For a 56-entry log written across
five weeks by many sessions, the dominant defect class is not
drift: it is conditions and contracts the log states correctly that
no machinery this repository can see holds, which is the log-side
face of the structural shape the review has named in every batch.
