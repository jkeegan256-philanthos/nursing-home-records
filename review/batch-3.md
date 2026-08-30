<!-- Transcribed verbatim on 2026-08-30 from the reviewer's notes as
     delivered by the founder; the committing session (batches 1, 2, 6)
     has not verified, edited, or reconciled them. -->

# Batch 3 review notes: query and data layer

Reviewer: Claude (chat), independent read, no access to Fable's notes.
Scope: lib/config.ts, csv.ts, data.ts, duckdb-client.ts, glossary.ts,
seo.ts, states.ts. 904 lines, all read entire.
Yardstick: PROJECT.md, ADAPTATION.md, README.md, state/README.md.

## Findings

**B3-1. `lib/data.ts:341` uses `col()` for "Overall Rating", which is
guarded, but `facilitiesFor()` also `col()`s "Provider Name" and
"City/Town" while the module comment claims only join-critical columns
hard-fail.** The comment at data.ts:262-267 says col() is for "CCN,
State, and the six columns build_data.py guards". SLIM_COLUMNS
(build_data.py:79-86) is CCN, Provider Name, City/Town, State, ZIP
Code, Overall Rating. So the code is correct and the comment is
imprecise: it reads as though CCN and State are additional to the six
when they are two of them, and a reader checking whether a given col()
call is licensed has to go count. Severity: costs-clarity. Type: HOW.

**B3-2. `lib/csv.ts:24` hardcodes the site name in the export filename
prefix, and ADAPTATION.md does not list it.** Every other identity
string is centralized in config.ts and mapped as touchpoint 10;
`nursinghomerecords_<table>_<key>_<vintage>.csv` is not. A fork gets
this site's name on every CSV a reader downloads, silently, which is
the exact failure mode touchpoint 10 exists to prevent. Either derive
the prefix from SITE_NAME or add it to touchpoint 10. Severity:
costs-clarity (breaks-charter adjacent: the fork inherits an
attribution). Type: HOW.

**B3-3. `lib/duckdb-client.ts:130-142` documents a sorting contract
that nothing enforces.** The comment is explicit and correct: a caller
that sorts must sort in the query, because post-fetch sorting orders
only the rows that survived LIMIT. But the module exports `querySQL`,
and `components/OwnerExplorer.tsx:114` uses it to build raw SQL with
its own `DETAIL_ROW_LIMIT = 3000` and no ORDER BY, bypassing
`queryParquet` entirely. The contract holds today by convention. It is
one raw-SQL call site away from the failure the comment describes.
Severity: breaks-correctness (latent). Type: WHAT — whether raw
`querySQL` should stay exported to components is a boundary question,
not an implementation detail. Cross-batch: the call site is batch 4.

**B3-4. `lib/duckdb-client.ts:88-95` retries init without cancelling
the timed-out attempt.** On timeout `dbPromise` is nulled so the next
interaction retries from scratch, but the original `init()` keeps
running and its `new Worker()` is never terminated. A reader on a slow
connection who waits 30s and then clicks a tab gets two engines
instantiating. Documented behaviour is "retry from scratch"; actual
behaviour is "retry alongside". Severity: costs-clarity /
breaks-correctness at the margin. Type: HOW.

**B3-5. `lib/data.ts:47-58` — `ledger()` assumes `.entries` exists.**
The try/catch covers a missing file, not a malformed one: a
`ledger.json` that parses but lacks `entries` returns `undefined`, and
the caller iterates it. The state channel is fetched from a remote
`/data/` URL (touchpoint 9), so malformed-but-parseable is a reachable
state, not a hypothetical. Severity: breaks-correctness (low
likelihood). Type: HOW.

**B3-6. `lib/data.ts:191-198` — `capacityFigure()` is the only
publishability gate, and it lives one call away from the raw figure.**
`methodsFigures()` is exported alongside it, so a future page can read
`.capacity` directly and print "0 individuals", which the comment at
188-190 says must never happen. Same shape as B3-3: a documented rule
with a public bypass beside it. Severity: costs-clarity. Type: HOW.

**B3-7. `lib/seo.ts:60-66` — inconsistent number formatting in
`ownerDescription`.** `facilities` is localized, `states` is not.
Cosmetic and invisible below 1,000 states, i.e. always. Noting it only
because the same function localizes one of two numbers in one
sentence. Severity: cosmetic. Type: HOW.

**B3-8. `lib/data.ts:301-315` — `ownershipRollup()` counts, and the
charter's no-calculation rule needs the reader to know that.** The
tallies are ruled in (home-page tallies kept with documented
rationale), and counting published values is not deriving new ones. But
this function, `listStates()`, and the owner page's facility/state
counts are the project's entire calculation surface, and they are not
marked as such anywhere in lib/. A one-line comment naming the
principle-2 boundary they sit on would make the next reviewer's job
shorter. Severity: costs-clarity. Type: HOW.

## Read whole, no findings

`lib/config.ts` — every identity constant carries its fork consequence
in a comment; REPO_LABEL derived rather than duplicated; CMS_ARCHIVE_URL
deliberately the page not a guessed zip pattern, with the reason stated.
`lib/states.ts` — reference vocabulary only, unknown code falls back to
itself, scope limited to titles and meta with the reason given.
`lib/glossary.ts` — verbatim from the CMS dictionary with the vintage
recorded and an explicit statement of what the dictionary does not
define (ADP is not expanded). Exemplary charter conformance.
`lib/seo.ts` otherwise — no rating vocabulary anywhere in the JSON-LD,
empty fields omitted rather than serialized as empty claims, canonical
and sitemap built through one function.

## Observations outside the scope fence

None. Nothing in this batch suggested new page types, new datasets, or
new query call sites.

## Note on method

Findings B3-3 and B3-6 are the same shape: a rule stated in a comment,
correct today, with a public export beside it that would violate the
rule without tripping anything. That pattern is worth watching for in
the other batches, and if it recurs it belongs in synthesis as a
structural finding rather than three separate items.
