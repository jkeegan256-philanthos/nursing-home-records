<!-- CONTAMINATED READ, per the reviewer's own disclosure below:
     three findings were pre-seen from a summary of the clean-room
     session's batch-4 notes and carry no divergence weight. Weigh
     these notes accordingly at synthesis.

     Transcribed verbatim on 2026-08-30 from the reviewer's notes as
     delivered by the founder; the committing session (batches 1, 2, 6)
     has not verified, edited, or reconciled them.

     Independence status of the review as a whole, recorded so no
     later reader infers more blindness than there was: the founder
     has read the clean-room session's batch-3 cross-check and its
     summaries of batches 4 and 5, so the clean-room notes are sealed
     only from the committing session, which has not read them and
     will not before synthesis. -->

# Batch 4 review notes: components

Reviewer: Claude (chat). 1,668 lines, all twelve files read entire.

CONTAMINATION DISCLOSURE. This is not a blind read. Before writing it I
had seen a one-paragraph summary of the clean-room session's batch-4
findings (the OwnerExplorer client-side sort, the NAMED 'None'
predicate, the glossary deep-links to anchors that do not exist). Those
three are marked [CONFIRMED-NOT-INDEPENDENT] below and carry no
divergence weight. Everything else I reached from the files. The brief's
two-track design assumed blind reads on both sides; for batch 4 that
held on their side only, and synthesis should weight it accordingly.

## Findings

**B4-1. `OwnerExplorer.tsx:114` takes `LIMIT 3000` with no ORDER BY,
then sorts the returned rows client-side (163-169).**
[CONFIRMED-NOT-INDEPENDENT — I had also reached this from batch 3, filed
as B3-3.] Exactly the pattern `duckdb-client.ts:130-138` forbids in
writing. Severity: breaks-correctness (latent). Type: WHAT.

**B4-2. `OwnerExplorer.tsx:170-172` — `types` and `roles` chips derive
from the capped slice, not from SQL, while every count beside them
does not.** The counts (`facilities`, `states`, `totalRows`, `byState`)
each run their own uncapped aggregate with a comment explaining why.
The chips two lines above do not, and there is no comment marking the
difference. An owner past 3,000 rows shows counts covering the whole
record and a role list covering the first 3,000. This is a distinct
defect from B4-1: fixing the sort does not fix the chips. Severity:
breaks-correctness (latent). Type: HOW.

**B4-3. `OwnerExplorer.tsx:19-20` — the NAMED predicate excludes the
literal published string `'None'`, and nothing on this component says
so.** [CONFIRMED-NOT-INDEPENDENT.] Adding only what my read contributes:
the exclusion is in the *search* predicate but not in the *detail*
query (114), so a reader arriving at `/owners/?name=None` by URL gets a
full detail view for a name the search will never return. The two paths
disagree about whether that string names an owner. Severity:
breaks-charter. Type: WHAT.

**B4-4. `OwnerExplorer.tsx:428` links `Owner Type` values to
`/glossary/#<value>`, and `FacilityRecords.tsx:21-24` does the same for
both glossary columns — but the glossary page creates anchors only for
`COLUMN_DEFINITIONS` terms and `ROLE_VALUES`.** [CONFIRMED-NOT-INDEPENDENT
for the existence of the defect.] Verified independently against
`app/glossary/page.tsx:33-48`: there is no `id` for "Individual" or
"Organization", so every Owner Type cell on both surfaces is a link to
the top of the glossary dressed as a link to a definition. Severity:
costs-clarity. Type: HOW.

**B4-5. `FacilityRecords.tsx:409-411` — the truncation notice fires on
`rows.length >= ROW_LIMIT`, which cannot distinguish "exactly 2,000
rows" from "capped".** A facility with exactly ROW_LIMIT rows is told
it is seeing the first 2,000 of an unstated larger number. The
count-line is the same sentence that now carries the sort disclosure,
so a false truncation claim sits beside a true order claim. The fix is
to fetch ROW_LIMIT+1 and show the notice on the overflow, or to count
in SQL as OwnerExplorer does for its header. Note that OwnerExplorer's
equivalent line (line 385) is correct, because it compares against an
uncapped SQL count. Two components, same sentence, different rigor.
Severity: breaks-correctness. Type: HOW.

**B4-6. `FacilityRecords.tsx:76-80` — the identity collapse compares
raw values, so a column whose rows differ only in whitespace stays
expanded.** `partitionIdentity` uses `r[i] === first` with no trim,
while `alnum()` normalization is applied only to the Location
restatement test twelve lines below. A published `"MO"` and `" MO"` in
one facility's rows would keep the State column in the table and drop
it from the identity line. Whether trimming is licensed here is a real
question (the site does not normalize published values elsewhere), so
this may be correct as written and merely undocumented. Severity:
costs-clarity. Type: WHAT — trimming for a comparison is not the same
act as trimming for display, and the charter has not been asked about
it.

**B4-7. `FacilityRecords.tsx:161-168` and `172-176` — `recalcScrollable`
runs on `[tabs, active]` and on window resize, but not when the table's
own layout settles.** Fonts loading, or the anchor column's own
`position: sticky` taking effect, can change `scrollWidth` after the
effect has run. The anchor is a measured state by design; the
measurement is taken once per tab change and never re-taken on a layout
event that is not a window resize. A `ResizeObserver` on the wrapper
would close it. Live behaviour is correct on production today, so this
is latent. Severity: costs-clarity. Type: HOW.

**B4-8. `StateTable.tsx:110-113` — the CSV button's `fetchAll` resolves
from the in-memory `rows` prop rather than running its own query,
which contradicts `CsvButton.tsx:7-9`'s stated contract.** The comment
on the button says "the button never exports what's on screen: fetchAll
runs its own uncapped query". Here it exports exactly what is on screen
— correctly, because the state page's rows are server-rendered whole
and there is no cap to defeat. The behaviour is right; the shared
component's comment is now false for one of its three call sites.
Severity: costs-clarity. Type: HOW.

**B4-9. `FacilitySearch.tsx:63` hardcodes `providers-slim.json` column
positions as `[0,1,2,3,4,5]` with no name check.** `OwnerExplorer.tsx:216`
does the same thing for the ratings map (`r[0]`, `r[5]`). Every other
column access in the codebase goes through a name lookup with an
explicit missing-column path (`colOrNull`, `res.cols.indexOf`). If the
slim export's column order ever changes, these two read the wrong
fields silently and the column-contract guard does not cover them
because no name is ever asked for. Severity: breaks-correctness
(latent). Type: HOW.

**B4-10. `FacilitySearch.tsx:130` says "Showing the first N facility
matches" where N is the number shown, capped at 40.** When exactly 40
match, the sentence claims a truncation that did not occur; when 12
match, "the first 12" is odd phrasing for all of them. Same class as
B4-5, on a different surface. Severity: cosmetic. Type: HOW.

## Read whole, no findings

`Stars.tsx` — the strongest file in the batch. The published number is
carried in text, not colour, with the reasoning recorded in the comment
and an unrecognized value shown as published rather than coerced.
`JsonLd.tsx` — escapes every `<` with the reason stated and the gate
named; the fixture plants the adversarial name.
`PrintProvenance.tsx` — labels the retrieval date against the batch
dates, which is the distinction I asked for when it shipped.
`CopyName.tsx` — the clipboard fallback is a prompt, not a silent
failure, and the comment states the boundary about where the name goes
next.
`CsvButton.tsx` — correct in itself (see B4-8, which is about a call
site, not this file).
`FullRecord.tsx` — lazy-loads on toggle, single row, blank shown as a
dash rather than omitted.
`Provenance.tsx` — no findings.

## Note on method

B4-5, B4-8 and B4-10 are one shape: a sentence that was true where it
was written and is not quite true at some call site or boundary
condition. That is the same genus as the clean-room's "disclosure
drift" theme and as my batch-3 note about rules with unenforced twins.
Three sessions have now independently named a version of it. It should
be the review's single structural finding, with instances, rather than
a dozen scattered items.
