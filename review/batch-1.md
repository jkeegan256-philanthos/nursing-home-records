# Review batch 1: data pipeline

Read whole on 2026-08-30 against the Pass 0 yardstick (PROJECT.md,
ADAPTATION.md, README.md, state/README.md): scripts/build_data.py
(1,298 lines), scripts/dev_fixture.py (249), scripts/diff_batches.py
(243), scripts/test_build_data.py (357), scripts/test_diff_batches.py
(211). Notes only; nothing was changed.

Severity: breaks-charter / breaks-correctness / costs-clarity /
cosmetic. Type: WHAT (needs a ruling) / HOW (implementation call).

## Findings

- scripts/diff_batches.py:61 (extract) and :118 (movement pairing).
  Cross-batch files are paired by exact basename, but CMS stamps
  every filename with the month (NH_Ownership_Jun2026 vs _Sep2026),
  so at a real monthly turnover prior and current share zero names,
  the movement half computes nothing, and SCHEMA reports every file
  as added plus removed. Evidence: build_data.py's own count-drift
  comment ("CMS stamps its filenames with the month") and
  classify(), which strips the `_MMMYYYY` stamp for exactly this
  reason, eighty lines from the pattern this script did not reuse.
  The instrument shipped today (PR #52) and passes its tests only
  because the fixture variant keeps the same stamped names; a
  September same-batch run works by luck, an October turnover run
  reports an empty diff. Pair by the stamp-stripped table identity
  instead. breaks-correctness HOW.
- scripts/test_diff_batches.py:66 (derive_zip). The test gap that
  hid the finding above: no case rotates the month stamp between
  the two zips. When the pairing is fixed, a stamp-rotated variant
  goes in red-first. breaks-correctness HOW.
- scripts/diff_batches.py:61 (extract). Flattens zip entries by
  basename with no duplicate guard: two entries flattening to one
  name silently overwrite, the exact hazard build_data.py:1158
  refuses with a die(). The diff would then compare against half
  the data while reporting a verdict. breaks-correctness HOW.
- scripts/build_data.py:445 (the `named` filter in export_owners).
  Rows whose Owner Name is the literal string 'None' are excluded
  from the Owners page alongside NULL and blank, but the warning at
  :464 and the owners-top.json field name both say "blank owner
  name", which a 'None' row is not. A value-based interpretation of
  a published string (CMS's no-owner convention, presumably) is
  applied without being named to readers or in the warning. Where
  is the 'None' rule disclosed, and is it ruled? breaks-charter
  (edge; the interpretation may be right, the silence is the
  problem) WHAT.
- scripts/build_data.py:802 (export_owner_pages row sort). Owner
  page rows are sorted by State, City, Provider Name, Role, and
  nothing on the rendered page states the order, while entry 53's
  standard for the loaded tabs is a disclosed order or silence with
  no claim. Sorted-but-undisclosed sits between the two stools.
  Should the owner pages disclose their order the way the tabs do?
  costs-clarity WHAT.
- scripts/dev_fixture.py:232. dataset_id is derived from Python's
  hash(), which is randomized per process, so every fixture build
  mints different dataset ids. Observed twice today: the same
  fixture page printed fx6988 in one build and fx1458 in the next.
  Any future gate that pins an id will flake, and no two fixture
  runs are byte-comparable. Use a stable digest (md5 of the name).
  costs-clarity HOW.
- scripts/build_data.py:451 and :470. string_agg(DISTINCT ...)
  without ORDER BY: owner-type strings in owners-top.json and
  owners-slim.json can differ between byte-identical builds, which
  quietly defeats any byte-level build comparison. Add an ORDER BY
  inside the aggregate. costs-clarity HOW.
- scripts/dev_fixture.py:4 (docstring). "File names, headers, and
  the manifest schema match the real June 2026 download" is false
  for headers: fixture penalties carries 7 of the real file's ~14
  columns and StateUSAverages 6 of dozens. A measured-state claim
  in a comment, the exact corollary PROJECT.md warns about. Say
  "representative subsets" or make it true. costs-clarity HOW.
- scripts/test_build_data.py:5 (docstring). "Scope is deliberately
  narrow: the three fidelity bugs fixed on 2026-08-22" was true
  once; the file now holds six tests including count drift and the
  two zip modes. Same stale-comment corollary. costs-clarity HOW.
- scripts/build_data.py:948. The drift-skip check `name in d`
  matches count names as substrings of message strings; today's
  five names cannot collide, but a future count named inside
  another's message text would be skipped silently. Match on the
  message's name prefix instead. costs-clarity HOW.
- scripts/build_data.py:249. providers is never partitioned
  regardless of size, a deliberate special case with no comment
  saying why (the spine is read whole by the build; a shard split
  would serve nobody). One line of intent. cosmetic HOW.
- scripts/build_data.py:1122. With no --zip, the newest zip in
  data/ by mtime wins, so a re-touched older batch outranks a newer
  one. The workflow always passes an explicit path; local runs may
  not. cosmetic HOW.
- scripts/diff_batches.py:96 (main). Unreadable input surfaces as a
  raw traceback rather than a named verdict; the exit code is right
  and the presentation is not. cosmetic HOW.

## Nothing found here

None. All five files produced at least one note; no file in this
batch was finding-free.

## Observations carried to later batches

- For batch 2: state/README.md uses em dashes (:20, :59-60) while
  PROJECT.md's rule names only site copy, PROJECT.md, README.md and
  ADAPTATION.md; whether check_prose_style.py's 35-file scan set
  matches the rule's stated scope, and whether state/README.md is
  "prose a stranger reads", is a batch 2 question about the gate.
- For batch 6: PROJECT.md:106 says "About 545 MB and 14,751 pages
  per batch"; README's measured section says 20,377 pages and notes
  545 MB predates the owner pages. A measured value in the charter
  document has aged out of measurement, the same failure entry 49
  fixed in the README itself.
