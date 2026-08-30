# Cross-check: batches 1, 2 and 6 against the tree

Author: the clean-room session (branch claude/review-clean-read).
Post-exposure material by construction: written after reading
review/batch-1.md, review/batch-2.md and review/batch-6.md from the
main review branch, at the founder's instruction, to give the three
single-read batches the second reader batch 3 got. Method: every
finding re-verified against the tree by reading the cited code whole
(diff_batches.py and test_diff_batches.py entire, the gates entire,
DECISIONS.md entire, all 1,775 lines) plus targeted greps; no code
run, no fixes, notes only. Their batch-4 transcription and
reactions-batch-2.md were deliberately left unread.

## Batch 1: data pipeline

All thirteen findings verified. Twelve confirmed as filed, one
confirmed with its evidence upgraded, none disputed.

- Pairing at monthly turnover (diff_batches.py:61, :112-118):
  CONFIRMED, and the deadline is real. extract() keys files by exact
  basename, common files are the basename intersection, and CMS
  stamps every filename with the month: stated twice in
  build_data.py (:905, :937-938), enacted by classify() stripping
  the _MMMYYYY suffix (:175-176), and recorded in the log's
  2026-08-28 checksum entry, which classifies the 2026-08-26
  transition as fourteen filenames rotating Jul to Aug. At an
  October run diffing September against October the intersection is
  empty: the MOVEMENT loop iterates nothing and prints no per-file
  line, SCHEMA reports every file as only-in-prior plus
  only-in-current, and the script exits 0. INTEGRITY is unaffected
  (it uses the current zip alone). The finding as filed describes
  both halves correctly. Two readers now behind it.
- Test gap (test_diff_batches.py:66): CONFIRMED. derive_zip() copies
  member names verbatim (zout.writestr(name, ...)), so prior and
  current always share the same Jun2026-stamped names and no case
  rotates the stamp.
- Basename flatten with no duplicate guard (diff_batches.py:68-71):
  CONFIRMED. out[base] and dest.write_bytes both silently overwrite;
  build_data.py:1157-1162 refuses exactly this with a die(), and the
  comment at :1176-1181 even cites that refusal as the model.
- The 'None' exclusion (build_data.py:443-446, :464): CONFIRMED,
  now convergent across three readers (batch 1, clean-room batch 4,
  and the batch 6 log-silence evidence below).
- Owner page sort undisclosed (build_data.py:801-802): CONFIRMED.
  rows.sort keys on State, City, Provider Name, Role; the rendered
  page (app/owner/[slug]/page.tsx) states no order; the explorer
  detail sorts by the same four columns, also undisclosed.
- hash()-derived fixture dataset ids (dev_fixture.py:232):
  CONFIRMED. Python str hashing is randomized per process, so ids
  differ every build.
- string_agg(DISTINCT ...) without ORDER BY (build_data.py:451,
  :470): CONFIRMED at both sites.
- Fixture docstring "headers ... match the real June 2026 download"
  (dev_fixture.py:4): CONFIRMED, with the evidence upgraded to
  in-tree. The fixture's penalties file carries 7 columns
  (dev_fixture.py:172-174); the log's own 2026-08-29 identity-
  collapse entry measures the real penalties table at 14 columns
  ("penalties fell from 14 columns to 7"), so the tree itself
  attests the mismatch and the docstring's categorical claim is
  false without needing the reviewer's outside knowledge.
- test_build_data.py docstring "deliberately narrow: the three
  fidelity bugs" (:5): CONFIRMED. The file holds six test functions
  including count drift, the repackage, and the manifest-only case.
- Drift-skip substring match (build_data.py:948): CONFIRMED. `name
  in d` tests substring against message strings; today's five count
  names (facilities, states, ownership_rows, named_owners,
  owner_pages) cannot collide, so latent as filed.
- providers never partitioned, uncommented (build_data.py:250):
  CONFIRMED. The `table != "providers"` clause carries no line of
  intent.
- Newest zip by mtime (build_data.py:1123-1125): CONFIRMED.
- Unreadable input as raw traceback (diff_batches.py): CONFIRMED.
  Nothing wraps extract(); a bad path or bad zip raises, exit is
  nonzero via the exception, presentation is a traceback.

No additions: the clean-room read of these five files found nothing
batch 1 missed. Batch 1's decision-log references, unlike batch 6's
(below), all check out.

## Batch 2: gates and CI

All eight findings verified: six confirmed as filed, one confirmed
with a strengthening, one confirmed with a mechanism correction.
One addition to its finding-free list.

- Hostile-name assertion (check_rendered_values.mjs:400-406):
  CONFIRMED, arithmetic exact, and the vacuity is one condition
  deeper than filed. facilities is readdirSync(...).slice(0, 200)
  (:96), so on the real batch of 14,690 directories its length is
  exactly 200; the inner disjunct facilities.length >= 200 is then
  true and the check prints ok with hostileSeen unexamined. The
  strengthening: the outer gate `facilities.length > 0 &&
  facilities.length <= 200` is half dead, because the slice cap
  makes length <= 200 always true, so the block that reads as a
  fixture-only branch runs on every deploy and its assertion is
  satisfied vacuously there. Two conditions, one dead and one
  vacuously satisfiable, under a label claiming the escape was
  exercised. The ranked-first placement among the structural
  instances is justified; the stated-skip remedy is right.
- Sample shape (check_rendered_values.mjs:96, :303):
  CONFIRMED-WITH-CORRECTION. The bias finding stands: both samples
  are an undisclosed first-N where a spread costs one line. The
  mechanism as filed overstates determinism: readdirSync guarantees
  no ordering, so "the lowest CCNs" and "the alphabet's front"
  describe one possible order (sorted or insertion-ordered
  filesystems), not a property of the code; on other filesystems
  the sample is arbitrary rather than state-concentrated, which is
  equally undisclosed and no better. Synthesis should carry the
  defect without repeating the one-state mechanism as fact.
- Extension unpinned (vendor-assets.mjs:96-107): CONFIRMED, plus one
  supporting fact: the cached-copy branch (:91-94) reuses an
  existing file with no verification at all, so both the fetch path
  and the reuse path ship the one third-party executable unpinned.
  The WHAT stands; the log is silent on binary trust (see batch 6).
- Loop guard runs only on pull requests: CONFIRMED. check:loop
  appears once in the tree's workflows, ci.yml:47-48, trigger
  pull_request; build-deploy.yml runs check:rendered and
  check:origins only, so a direct push to main that edits
  build-deploy.yml deploys with the guard never evaluated anywhere.
- KNOWN_QUERY_CALLERS per-file counts
  (check_no_third_party.mjs:679-716): CONFIRMED. Counts key on file
  path; a call site removed and another added in one file leaves
  the count equal and the new path undriven.
- Prose gate docstring scope (check_prose_style.py:16): CONFIRMED.
  The docstring names app/ and components/; CODE_DIRS includes lib,
  added by the 2026-08-28 SEO entry. Stale in the safe direction.
- Prose rule scope WHAT: CONFIRMED. state/README.md carries em
  dashes (:20, :59-60, verified in the Pass 0 read); the scan set
  is the three named docs plus the code dirs, so neither
  state/README.md nor data/README.md is scanned, and the rule's
  named scope and its "prose a stranger reads" phrasing genuinely
  disagree at that margin.
- FAIL-path label (check_no_third_party.mjs:773-776): CONFIRMED.
  The conditional drops only the suffix; the words "zero off-origin
  requests" print on the failure path too.

Addition to the finding-free list: check_loop_guard.py:60-71 asserts
the record-state script by substring presence ("git add state",
"refusing to push"), not by structure, so a future edit that
comments out or reworks the refusal while leaving the words in an
echo or comment still passes. Under this batch's own lens that is
presence-of-text standing in for presence-of-behavior. Mild, and the
file's other assertions are sound; filed as costs-clarity HOW.
apply_csp.mjs, csp.mjs and check_project_doc.py: agreed
finding-free, verified by whole reads.

## Batch 6: the DECISIONS audit

The verdict first, since the founder asked for it directly: the
audit's central negative claim survives independent spot-checking,
with one drift addition it missed, and its citation apparatus does
not survive: a majority of its numeric entry references point at
the wrong entry.

How much was checked: DECISIONS.md read whole; the declared total
(56) verified by machine count; 21 entries' standing claims verified
against the tree by this session. Ten were re-verifications of the
audit's own spot-checks: the lookup-links reversal (zero grep hits
for the three destinations in app/, components/, lib/), the cron
(47 9 5 * * in build-deploy.yml), the Data page sentence narrowed
and carrying its history with the log link on DECISIONS.md, the
five headline counts matching the five record_count() calls exactly,
About's "compare, rank, or recommend", the review-vocabulary absence
asserted in the rendered gate, the in-log page-count correction, the
vendor staleness-by-construction, the sort ruling's boundary, and
the anchor's stated scope. Eleven were entries the audit did not
cite, sampled independently: the ergonomics state-table claims, the
decoration audit's always-shown assertion (ALWAYS_SHOWN in the
rendered gate), the Methods fixture threshold (NH_METHODS_FACILITY_MIN=2
in package.json's fixture script), the reversed-order search driven
every run, the averages block asserted and matched, the /_not-found/
visit existence-guarded, the Node 24 and action-major bumps, the
repackage and manifest-only tests, the metastore probe documented in
README with all four date fields, the print-provenance and skip-link
components, and the three-way diff's no-network property. All held.

- Citation numbering: CONFIRMED-WITH-CORRECTION, the largest issue
  in the batch. DECISIONS.md numbers nothing; the audit assigned
  indices and applied them inconsistently. Checked against file
  order, 8 of its 14 numeric references are wrong: its "entry 13"
  (lookup reversal) is entry 14, its 14 (cron) is 16, its 21
  (narrowed sentence) is 20, its 39 (September revisit) is 47, its
  41 (formula escaping) is 38, its 42 (index weight) is 39, its 44
  (KNOWN_QUERY_CALLERS quote) is 35, and its 45 (five counts) is
  25. Six are right: 30, 48, 49, 52, 53, 55. Every substantive
  claim behind the misnumbered citations verified true, so this is
  a pointer defect, not an evidence defect, but synthesis must cite
  these entries by date and description, never by the audit's
  indices. It is also, uncomfortably, the review's structural shape
  inside the review itself: references true in substance and wrong
  at the pointer.
- Drift items: all three CONFIRMED. state/README.md:25-26 and
  vendor-assets.mjs:12 still say "the 2026-08-22 entry/entries in
  PROJECT.md"; PROJECT.md:106 still says "About 545 MB and 14,751
  pages per batch" against the measured 20,377; TABLE_PATTERNS
  counts 18, matching ADAPTATION's "eighteen", observation as
  filed.
- Drift addition the audit missed: the 2026-08-23 authorship entry
  (file-order 27) states "SITE_AUTHOR ships empty and the byline
  renders only when it is set, so ... a fork inherits nothing by
  default." lib/config.ts:19 ships SITE_AUTHOR populated with the
  founder's name, and no later entry records populating it. The
  decision itself (a real-name byline, rendered only when set)
  stands and is implemented, so the audit's "no decision falsified"
  headline survives; but the mechanism sentence is false of the
  tree, the falsifying edit is unlogged, and this is now the third
  surface carrying the ships-empty claim against a populated
  constant, beside ADAPTATION touchpoint 10 and config.ts's own
  comment (clean-room batch 3, finding 1). One founder ruling
  covers all three surfaces. WHAT.
- Unenforced rulings: the sort-ruling gap CONFIRMED (three readers).
  The formula-escape revisit condition CONFIRMED unheld: no script
  tests any batch for leading formula characters. The index-weight
  condition CONFIRMED unheld: the only owners-slim reference in any
  gate reads a name from it (check_no_third_party.mjs:142) and
  measures nothing. The counterexample, that the metastore entry's
  September condition is "wired into the September trigger and held
  by machinery", is NOT VERIFIABLE IN-TREE and weaker than filed:
  no repository machinery holds it; the only wiring in evidence is
  the 2026-08-29 refresh entry's description of instructions given
  to an external scheduled trigger. By the charter's own corollary,
  a property held by something outside the repository is not a
  property the repository has, so in-tree the sub-class may be
  zero-for-three, which sharpens rather than weakens the audit's
  "revisit conditions without watchers" name for it.
- Unruled surfaces: the 'None' log silence CONFIRMED by grep (no
  entry mentions 'None', blank owner, or blank name); the
  extension-binary-trust silence CONFIRMED from the whole read (the
  two 2026-08-22 origin entries rule confinement, none rules
  verification); the presentation-order silence CONFIRMED.

## For synthesis

Tallies: batch 1, 13 of 13 confirmed, none disputed, no additions.
Batch 2, 8 of 8 confirmed (one strengthened, one mechanism
corrected), one addition to its finding-free list. Batch 6, verdict
earned on a 21-entry spot-check, one missed drift item added, and a
citation apparatus that must not be used at synthesis. The
structural shape gains three further instances from this pass: the
dead outer condition beside the vacuous disjunct, the loop-guard
check's text-presence assertions, and the audit's own misnumbered
citations. The SITE_AUTHOR ships-empty divergence now spans three
surfaces and two independent readers and should be merged into one
ranked finding.
