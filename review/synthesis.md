# Review synthesis

One pass over the full-repository review's eleven artifacts,
producing the ranked plan the brief asked for. Written 2026-08-30 by
the main session (batches 1, 2, 6). Citation discipline throughout:
decision-log entries by date and opening phrase, code by path and
line, never by inferred index. review/batch-6.md was corrected in
place (commit 98ec62b, dated note in the file) after the cross-check
found eight of its fourteen index citations wrong, so no standing
artifact carries the bad pointers.

## The artifacts and how to weigh them

Sealed pre-exposure (clean-room session, pushed before any outside
notes reached it): batch-3.md, batch-4.md, batch-5.md on
claude/review-clean-read. Blind single reads: batch-1.md, batch-2.md
(main), the chat reviewer's batch-3. Contaminated: the chat
reviewer's batch-4, by its own disclosure. Post-exposure by
construction: cross-check-batch-3.md, cross-check-batches-1-2-6.md,
reactions-batch-2.md, and batch-6.md (an audit necessarily reads
everything). The weighting rule, stated so nobody inflates tallies
later: the chat batch-4's B4-1, B4-3, and B4-4 were pre-seen from a
clean-room summary and count as ONE reader wherever a convergence
tally appears, never two. Every tally below follows that rule.

## THE DEADLINE, above the ranking

scripts/diff_batches.py pairs cross-batch files by exact basename
(extract() at :61, the intersection at :118) while CMS stamps every
filename with the month, a fact stated twice in build_data.py,
enacted by classify(), and recorded in the log's 2026-08-28 checksum
entry (fourteen filenames rotated Jul to Aug on 2026-08-26). At a
real turnover the intersection is empty: MOVEMENT iterates nothing,
SCHEMA reports every file as added plus removed, and the script
exits 0. Confirmed by two independent readers. The test never
catches it because the variant zip keeps the same stamped names.

The date, stated carefully: CMS rotates early in the month (the
August file published 2026-08-01; the archive snapshot fell 07-29;
nextUpdateDate says 2026-09-30). Our September 5-6 refresh is
expected to fetch the same August batch, so the diff works by luck
there. The first refresh after CMS's next publication is the first
run that hits the bug, and that is expected around the turn of
September into October, not on any date this repository controls.
The working deadline is therefore the end of September, and the fix
package should ship well before it: pair files by the
stamp-stripped table identity classify() already computes, add the
stamp-rotated variant to the test red-first, add the
duplicate-flatten guard build_data.py already models (:1157), and
replace the raw traceback with a named verdict on unreadable input.
One PR, no ruling required, proposed as the first post-review work.

## THE STRUCTURAL FINDING

A claim true where it was written, unenforced or untrue at a
boundary, a call site, or a later date. Four reviewers named it
independently before reconciliation (the batch-1 flatten-guard twin,
the clean-room's disclosure drift, the chat batch-3 unenforced-twins
note, the chat batch-4 B4-5/B4-8/B4-10 cluster), and every batch
holds instances. It also occurred three times inside the review
itself, which is the strongest evidence it is structural: batch 6
cited the log by indices that were wrong more often than right; the
chat batch-4 read was contaminated and said so; and batch 6's own
counterexample ("held by machinery") rested on machinery nobody can
point at in-tree. The review made the finding about itself while
making the finding.

The remedy pattern, once: either the machinery reaches the claim,
or the claim narrows to what the machinery reaches. Instances,
ranked:

1. The hostile-name assertion (check_rendered_values.mjs:400-406).
   Ranked first per the chat reviewer's reaction, adopted here: it
   reports success for having found nothing, on the one check
   guarding a published value from escaping a script element. The
   cross-check deepened it to two dead conditions under one green
   label: the outer facilities.length <= 200 is always true because
   the slice cap makes it so, and the inner >= 200 disjunct
   satisfies the assertion vacuously on every deploy. Remedy: a
   stated skip on real batches, the dead condition removed.
2. The sort contract (lib/duckdb-client.ts:133-138 states it;
   OwnerExplorer.tsx:114 and :167-175 violate it post-fetch on a
   3,000-row cap, chips included). Three independent readers.
   Latent today (largest footprint ~426 rows). Carried at the
   boundary framing per the cross-check: fixing the call site
   leaves the querySQL export open, so this is WHAT 4 below.
3. SITE_AUTHOR "ships empty", falsified on three surfaces (the
   2026-08-23 "front door" entry, ADAPTATION touchpoint 10,
   lib/config.ts's own comment above a populated :19). Two
   independent readers. Ruled by the founder: drift with a known
   remedy, not a dispute; the decision (a real-name byline) stands
   and is implemented; the remedy is HOW package D.
4. Revisit conditions without watchers, at its worst reading:
   possibly zero-for-three. The 2026-08-27 formula-escaping and
   index-weight entries set per-batch conditions nothing tests; the
   2026-08-28 metastore entry's September condition is held, if at
   all, by an external trigger no repository machinery can prove
   exists, so the class's only proof of closeability sits outside
   the repo. The two watchable ones are HOW package E; the third is
   stated plainly here rather than implied handled.
5. The glossary freshness claim (app/glossary/page.tsx:74-76): "the
   next monthly batch carries the revision and this page moves with
   it", while the definitions are hardcoded constants and no gate
   compares them to the batch's dictionary. Principle 7's named
   shape; WHAT 6.
6. Truncation and count claims: FacilityRecords' notice fires on
   rows.length >= ROW_LIMIT and cannot distinguish exactly-2,000
   from capped; FacilitySearch says "the first N" when N is all of
   them; CsvButton's "never exports what's on screen" comment is
   false at the StateTable call site (where the behavior is right);
   the two CSV surfaces stamp degraded batches differently. HOW
   package C.
7. Stale pointers: state/README.md:24-25 and vendor-assets.mjs:12
   still send readers to entries that left PROJECT.md on
   2026-08-24, surviving the split entry's own completeness claim;
   PROJECT.md:106 wears aged measured figures. HOW package D.
8. Docstring and comment drift: dev_fixture's "headers match the
   real June 2026 download" (the tree itself attests 7 vs 14
   penalties columns), test_build_data's "three fidelity bugs" over
   six tests, the prose gate's scope line omitting lib/, the col()
   comment miscounting its own license. HOW package D.
9. Tripwires weaker than their labels: the loop guard asserts the
   record-state script by text presence; KNOWN_QUERY_CALLERS misses
   a same-file swap; capacityFigure's publishability rule has a
   public bypass beside it; glossary links dress dead anchors as
   definitions (two readers); FullRecord assumes the providers
   table stays single-mode. HOW packages B and F.

## WHAT: rulings for the founder, ranked

1. **The 'None' exclusion.** Rows whose Owner Name is the literal
   published string 'None' are excluded from the Owners page and
   search (build_data.py:445, OwnerExplorer.tsx:19-20), the only
   disclosure calls them "blank" (build_data.py:464 and the
   reader-facing app/owners/page.tsx:114-116), the log contains no
   ruling, and the search and detail paths disagree about whether
   the string names an owner. Three independent readers. Options as
   the reviewers put them: sanction and disclose it accurately, or
   drop the clause and let 'None' group like any exact string.
2. **Named filed parties on the Methods page** (clean-room batch
   5): FORVIS MAZARS LLP characterized as "an accounting firm",
   CIBC BANK USA, the GEN/GENESIS spelling cluster. The
   characterization is an assertion about the entity behind a
   string; naming parties in site copy sits against principle 4 and
   the declined single-name scope. Deliberate-looking and hedged,
   but it is the one place copy names filed parties: sanction it
   explicitly or reword to unnamed examples.
3. **The footer's blanket claim** "no edits, computations, or
   filtering" (app/layout.tsx:82-84, echoed on the Data page),
   against principle 1's own counts-and-groupings carve-out, the
   displayed tallies, and the owners-artifact filtering. The
   phrasing promises more than the principles do, on the pages
   displaying the carve-outs.
4. **The querySQL export boundary.** Whether raw SQL stays
   available to components, or the sorting contract's API becomes
   the only door. The cross-check prefers this framing; the
   OwnerExplorer fix rides on the answer.
5. **Extension binary pinning.** Both the fetch path and the cached
   reuse path ship the one third-party executable in every reader's
   path unpinned; the log rules origin confinement and is silent on
   binary trust. Chat reviewer's recommendation on record: pin,
   with the counterargument stated.
6. **The glossary freshness claim** (instance 5 above): build the
   comparison check, or narrow the sentence to what is true.
7. **Owner-surface presentation order.** Build-time owner pages and
   the explorer sort by the same four columns, disclosed on
   neither; the sort entry's standard is disclosure or silence.
8. **"{N} individuals" on Methods** counts distinct name strings
   with Owner Type Individual; the same page teaches that a name is
   not a person.
9. **Prose-rule scope.** state/README.md and data/README.md are
   prose strangers read, carry em dashes, and sit outside the
   rule's named scope; the rule and its own description disagree at
   that margin.
10. **Identity-collapse whitespace.** partitionIdentity compares
    raw values, so rows differing only in whitespace keep the
    column; whether trimming for a comparison is licensed where
    trimming for display is not has never been asked of the
    charter.

Parked by prior rulings, listed so they are not re-raised: the
corrections-page faithful-reproduction note (waiting on the
question recurring); the Methods repeated-fines teaching (waiting
on someone asking); wide-table print (its own entry when
addressed).

## HOW: work for the maintainer, in packages

A. **The deadline PR** (first, independent of every ruling):
   diff_batches pairing by table identity, stamp-rotation test
   red-first, flatten guard, named verdict on unreadable input.
B. **Gate honesty**: hostile-name stated-skip and dead condition;
   sample spread (an every-Nth pick, with the cross-check's
   correction that readdirSync order is unspecified, so the defect
   is undisclosed arbitrariness, not provably one-state);
   check:loop added to the deploy path and the deploy-subset
   boundary stated where check:doc already states its own;
   FAIL-path label; a sentence in KNOWN_QUERY_CALLERS naming the
   same-file-swap hole; the loop guard's text-presence limitation
   noted in its docstring.
C. **Count and truncation honesty**: ROW_LIMIT overflow detection
   (fetch one over, or count in SQL as OwnerExplorer's header
   does); FacilitySearch wording; explorer chips derived from SQL
   like the counts beside them; CSV vintage fallback unified.
   (The chips and sort fixes in OwnerExplorer wait on WHAT 4 only
   where the mechanism depends on it; the chips fix does not.)
D. **Document truth**: a dated log entry recording the SITE_AUTHOR
   populating edit, with ADAPTATION touchpoint 10 and the config
   comment corrected in the same change; PROJECT.md's aged figures
   re-measured or de-counted; the two stale PROJECT.md pointers
   retargeted; the three docstrings; the col() comment; the
   CsvButton comment; the providers-partition intent line; the CSV
   filename prefix derived from config or added to touchpoint 10.
E. **Watchers for the watchable revisit conditions**, red-first: a
   per-batch test for owner names beginning with a formula
   character (one query at transform time), and a per-batch
   measurement of owners-slim.json against the 2026-08-27 entry's
   figure. The metastore condition stays external and stays named
   as such.
F. **Low hardening, opportunistic**: ledger() normalizing missing
   entries (downgraded by the cross-check's build-side evidence);
   blank-CCN and duplicate-CCN assertions on the read side; the
   timed-out init worker terminated; sqlLit on the SET statements;
   glossary links rendered as links only where the anchor exists;
   FullRecord's shard-mode assumption; the search-results hover
   moved behind the hover guard and onto the variable; string_agg
   ORDER BY; fixture dataset ids from a stable digest; zip
   selection by name rather than mtime.

Sequencing: A now. D and B next, cheap and uncontroversial. C and
F behind or beside their WHATs where one applies. E after the
deadline PR, same instrument culture.

## Not doing

Dark mode (declined 2026-08-29 with its precondition; stands).
Comparison or staffing tools, new datasets, new page types, money
flows, entity resolution, per-name outbound links: standing
refusals, none disturbed by any finding. Reader-controlled sorting:
the state tables' clickable-header sort shipped 2026-08-06 and the
2026-08-29 sort entry names it as existing ("the site already
sorts... by published fields on state pages"), so it predates and
sits outside that entry's boundary, which governs the loaded
tables; there is no conflict and nothing to rule. IndexNow waits on
its September condition. The review proposes nothing requiring a
new query call site.

## The review by the numbers

Roughly 11,200 lines read whole across six batches plus the 780-line
yardstick, by three reviewers plus the founder's routing and
custody. Around 70 raw findings converging to the structural
finding, ten WHATs, and six HOW packages; four gate files, three
lib files, eight component files, and five app files were read
whole and found finding-free, named in their batch files so the
review reports what it looked at. Batch 1 stands 13-of-13 under
cross-check with none disputed; batch 2 stands 8-of-8 with one
strengthened and one mechanism corrected; batch 6's verdict
survived a 21-entry independent spot-check while its citation
apparatus did not, and was corrected in place. The process caught
a misrouting, a contamination, and a citation failure through its
own custody discipline, which is the review working, and the
structural finding's best evidence is that the review kept
committing instances of it while hunting them.
