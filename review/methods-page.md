# Whole-read reviews: the Methods page (2026-09-11)

Two independent whole-reads of `app/methods/page.tsx` (316 lines,
last touched by PR #63), run the same day with almost no overlap in
findings. The first came from the implementing session, which
verified every run-time claim against the code that implements it.
The second came from the chat reviewer, who checked claims against
the August production batch. Dispositions and rulings follow each.
Transcribed per the review-corpus convention; this directory is
exempt from the prose gate, and punctuation is as written.

## Review 1 (implementing session; claims checked against code)

M1. The "Where else does this name appear?" answer misdescribes the
search's run-time behavior in three clauses. (a) "finds a name by its
exact published spelling" — the search matches by tokens contained in
the name (deliberately, per its own comment, so JOHN MITCHELL finds
MITCHELL, JOHN); (b) "It does not find related spellings" — false as
written: spellings sharing text surface together in one search; what
the site never does is say whether they are the same party; (c)
"every facility" — the detail table caps at 3,000 disclosure rows
(disclosed as "showing the first N", header counts computed uncapped
in SQL). A principle-7-class claim with no gate on the sentence, on
the page whose job is teaching accurate reading. Severity:
breaks-charter. Type: HOW.

M2. "Two of the largest footprints … the roles CMS filed for each" is
hardcoded above conditional examples (`forvis || cibc`): a rotation
dropping either renders "Two" over one example — the defect the
page's own header comment warns against, with the plural() helper
sitting forty lines above, unused. HOW.

M3. Same defect in trap 2: "these four names are filed separately"
over a filtered list that renders at two or more. HOW.

M4. Trap 3's heading said "Capacity", a word the body never uses; on
a nursing-home site it reads as beds. HOW.

M5. "That is the same boundary as trap two" cites by number — the
staleness the page's own de-counted description already paid for.
HOW.

M6 (nit). RoleList renders "A, and B" for exactly two roles. HOW.

Read whole, no findings: traps 4 and 5; the provenance line (true by
construction, watched by the integrity gate); the derived
named-example roles (asserted by the rendered-values gate); the
person/party wording difference against About (context, not drift).

## Review 2 (chat reviewer; claims checked against the batch)

M1. "The glossary lists every role value CMS defines" is true, and
the sentence a reader needs is a different one. The August batch
publishes 18 distinct role values; the glossary lists 17. The missing
one is `Ownership Data Not Available`, which appears on 658
facilities, one row each. It is not in CMS's dictionary, so the
glossary is faithful and the gap is real: a reader clicking that role
on a facility page reaches a glossary with no entry for it. Severity:
breaks-charter. Type: WHAT — where to name the undefined value is a
disclosure decision.

M2. The code comment at line 60 still characterized the named parties
("an accounting firm, a bank") — the exact characterization the
2026-09-04 ruling removed from the reader-facing prose, surviving in
the file where the ruling was applied. HOW.

M3. Trap 3's paragraph was the densest prose on the site: seven
derived figures, a quoted marker string, three nested "of the N
that..." clauses. Rewrite keeping every figure, splitting the
clauses. HOW.

M4. Trap 1's closing sentence duplicated trap 3's thesis (no correct
label for the party / for the person). Resolve rather than leave.
HOW (cosmetic).

M5. "Five questions" was a count in a heading, on a page whose own
metadata comment explains why counts in headings go stale. HOW
(cosmetic).

M6. Claimed the deploy's three-way diff uses the CMS archive route
that trap 5 links to. REJECTED on a checked fact: the diff's prior
side is the zip this site itself serves
(`$NH_STATE_URL/downloads/theme_nursing-homes_current.zip`, entry
71), never CMS's archive. The reviewer confirmed the rejection: "I
conflated my own use of the archive endpoint in September with the
deploy's route. Trap 5 stands as written."

What held up, in the reviewer's words: trap 4 "is three sentences and
does the hardest epistemic work on the site"; the questions section
"answers each with what it cannot do, which almost nothing on the web
does"; the closing paragraph on county and state records,
deliberately unlinked, "the best-reasoned refusal in the project."

## Cross-verification and disposition

The implementing session verified review 2's M1 as far as the sandbox
reaches: 17 values in `lib/glossary.ts`, the marked value absent, and
the dangling-link mechanism real (`FacilityRecords.tsx` links every
glossary-column value to `glossary/#<anchor>`). The batch-side counts
rest on the reviewer's production pull. Review 2's M2 was initially
waved off by the implementing session as a working surface and
accepted on the reviewer's better argument. Review 1's M1 drew one
edit from the founder's side: "Each result is one published name,
exactly as CMS spelled it" replaced "group by the exact published
spelling", because a reader coming off the corrected first sentence
could hear "grouping" as merging.

## Rulings (founder, 2026-09-11)

On the undefined role value: all three remedies, in order. Name it on
Methods, because the sentence citing the glossary is where the reader
forms the expectation. Give it a glossary entry marked as
published-but-undefined, because a link that lands on nothing is
worse than a link that lands on "CMS publishes this value and its
dictionary does not define it." And add the watcher, because this one
was found by a reviewer with a production CSV and the next one will
not be.

The watcher warns, it does not block: the three existing hard stops
are all conditions where publishing would serve something wrong; an
undefined role value is CMS publishing a value, faithfully mirrored,
with the site simply unable to define it. Blocking the refresh would
withhold correct data over a documentation gap. But a warning nobody
reads is how conditions become unwatched, so it needs a real surface:
the processing-warnings channel, which About promises is public, and
a named line in the deploy log the check-in reads. First watcher in
this project that intentionally does not stop a deploy.

Execution is recorded in DECISIONS.md entry 75.
