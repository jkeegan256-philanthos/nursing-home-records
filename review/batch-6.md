# Review batch 6: the DECISIONS audit

Read whole on 2026-08-30: all 56 entries of DECISIONS.md (1,774
lines) against the tree, with standing claims spot-verified by grep
and read, not assumed. Method note: dated facts inside entries
(entry 44's "KNOWN_QUERY_CALLERS stays at 7", "eight page types")
age correctly by design in an append-only log and were not treated
as drift; the audit's targets are standing claims, and the founder's
refinement is applied: drift (log stale) is separated from
unenforced rulings (log right, nothing holds the code to it), and a
third class emerged in the reading. Notes only; nothing was changed.

## Accurate: standing claims spot-verified against the tree

Entry 21: the Data page's third-party sentence stands, narrowed,
carrying its own history verbatim ("It was here once before while it
was untrue"), its log link correctly retargeted at DECISIONS.md.
Entry 13: the lookup-links reversal held completely; zero hits for
the three destinations anywhere in app/, components/, lib/. Entry
30: About says "compare, rank, or recommend" as recorded. Entry 14:
the cron is 47 9 5 * * as ruled. Entry 45: the five headline counts
named in the entry are exactly the five record_count() calls. Entry
48: the review-vocabulary absence is enforced in the rendered gate
as promised. Entry 52: vendor staleness safe by construction,
confirmed in vendor-assets.mjs. Entry 55: the anchor's stated scope
(loaded facility tables alone) matches the code. Entry 49 correcting
entry 48's page count inside the log is the append-only correction
process working as designed.

## Drift: the log or charter has aged out of the tree

- state/README.md:24-25 and scripts/vendor-assets.mjs:12 both point
  at "the 2026-08-22 entry/entries in PROJECT.md". Those entries
  moved to DECISIONS.md on 2026-08-24, and the split entry claims
  its grep found and retargeted the seven stale references; these
  two survived it, one because the reference line-wraps mid-phrase
  and one because it lives in a code comment. The split entry's
  completeness claim is therefore itself an instance of the
  structural shape. costs-clarity HOW.
- PROJECT.md:106: "About 545 MB and 14,751 pages per batch" in the
  charter's architecture section. Entry 49 taught that a measured
  figure carries its date as part of its value and re-baselined the
  README; the charter's copy of the same aged figures was left
  wearing them. 20,377 pages is the measured current answer.
  costs-clarity HOW.
- ADAPTATION.md touchpoint 1 says "eighteen filename regexes"; true
  today (TABLE_PATTERNS holds 18), but it is a count inside the
  single source, the class the log retired twice for headings and
  copy. Observation only. cosmetic.

## Unenforced rulings: the log is right and nothing holds the code

- Entry 53's mechanism ruling vs the owner explorer. The ruling's
  rationale is stated as general and lives verbatim in
  lib/duckdb-client.ts's comment: a caller that sorts must sort in
  the query, never after the fetch, because post-fetch sorting
  orders only the rows that survived LIMIT. components/
  OwnerExplorer.tsx:113-115 runs querySQL with LIMIT 3000 and no
  ORDER BY, then sorts the returned rows client-side (:166-172).
  Latent today: the largest current footprint yields roughly 426
  rows, so the cap never binds and the sorted set is complete. But
  entry 53's stated boundary covers the loaded facility tables, so
  either the mechanism ruling is general and this call site
  violates it, or the explorer is an unruled surface performing the
  exact trap the ruling names. Which of those it is requires a
  ruling, which is the point of filing it here rather than as a
  bug. breaks-correctness (latent) WHAT. (Independently reached by
  both other reviewers: B3-3, B4-1.)
- Entry 41 (CSV formula escaping declined) sets an explicit
  per-batch revisit condition: "if a future batch ever publishes a
  name beginning with one of those characters, this decision is to
  be revisited rather than inherited." Nothing tests any batch for
  a leading equals, plus, minus, or at sign; grep finds no watcher
  in any script. The condition is held by nobody, and it is
  mechanizable in one query at transform time. breaks-correctness
  (conditional; the decision's own terms) HOW.
- Entry 42 (search index weight) same class: "if a future batch
  pushes the compressed owner index materially past this figure,
  the decision is to be revisited with the then-current numbers."
  Nothing measures owners-slim.json per batch. HOW.
- The counterexample proving the class is closeable: entry 39's
  revisit condition ("September's release is the revisit evidence
  for the probe and the cron") is wired into the September trigger
  and held by machinery. Two of the three standing revisit
  conditions have no watcher; one does. The sub-class deserves a
  name at synthesis: revisit conditions without watchers.

## Unruled surfaces: the code takes a position the log never took

- The literal 'None' owner-name exclusion. The log contains no
  ruling: grep for 'None' and "blank owner" across all 56 entries
  returns nothing. The exclusion ships in two layers
  (scripts/build_data.py:445 and components/OwnerExplorer.tsx:20),
  ADAPTATION touchpoint 6 names only "the blank-name filter", and a
  'None' row is not blank. Batch 1 filed the disclosure question;
  this audit adds the log-silence evidence: an interpretation of a
  published value, applied twice, decided nowhere. breaks-charter
  (edge) WHAT.
- Extension binary trust. Entries 20-21 rule origin confinement at
  full length; no entry addresses whether the binary fetched from
  extensions.duckdb.org is itself verified. The log is silent where
  batch 2's WHAT asks a question. Feeds that WHAT.
- Owner-surface presentation order. The build-time owner pages
  (build_data.py:802) and the explorer detail (:166-172) sort by
  the same four columns, consistently with each other, disclosed on
  neither. Entry 53 sets the disclosure standard for the facility
  tabs and is silent here. Feeds batch 1's WHAT on the static half;
  the explorer half is the same question.

## Nothing found here

The log's structure, preamble, declared count, and append-only
discipline all check out (the doc gate says so mechanically; this
read confirms the substance). No entry was found claiming something
the tree contradicts outright; the drift cases above are stale
pointers and aged figures, not falsified decisions. For a 56-entry
log written across five weeks by many sessions, the dominant defect
class is not drift at all: it is conditions and contracts the log
states correctly that no machinery holds, which is the log-side
face of the structural shape the review has now named in every
batch.
