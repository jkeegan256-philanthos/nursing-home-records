# Visual reviews: the main pages (2026-09-11)

Two visual reviews, run the same day. The implementing session built
main at the entry-75 tip locally on fixture data and read the five
nav pages at 1280 and 400 (ten screenshots delivered to the
founder). The chat reviewer read production at 1280 and 390,
including the facility and state pages the five-page pass did not
cover. Transcribed per the corpus convention, with one deliberate
redaction: the reviewer's text and the walk context name a real
facility and a real chain-plus-city search; those names stay out of
this repository by the same line that keeps the reader walk's worked
report out (reader/README.md), so they appear here as shapes. The
full text is founder-facing.

## Review 1 (implementing session, local build, fixture)

V1. The footer's "Cite this page" button flowed inline inside the
batch-dates paragraph; at 400px it wrapped mid-paragraph and tore
the line rhythm on every page. FIXED: the button is its own block.

V2. Methods' new search sentence read "spellings that share text
surface in the same search"; "share text surface" garden-paths.
FIXED: "turn up in the same search".

Observations, no action: the narrow reading measure with full-width
tables is the #44 presentation pass working; nav wraps cleanly at
400; no page scrolls horizontally; fixture artifacts (unbalanced
state columns at 4 states, "0.0 MB" for the tiny fixture zip) are
not findings.

## Review 2 (chat reviewer, production)

V1. A facility page's abuse-icon chip and ownership-type chip read
alike at a phone glance. Verification narrowed it: the chip already
carried a distinct class (ochre wash, bold), so the question was
strengthening, not creating. RULED: solid ochre, paper text, same
shape and size, uniform wherever CMS set Y; the label now names the
flag's owner ("CMS abuse icon: Y") and the hover title states that
CMS flagged the facility for abuse citations, the flag being CMS's,
not this site's judgment.

V2. Methods trap 1's example paragraph ran fifteen lines of inline
mono caps at phone width. FIXED: split into one short paragraph per
named example, the same split trap 3 got; the rendered-values gate's
role spans untouched.

V3. The home page gives three exact ownership-split numbers where
About gives a shape. Observation, both correct, no action.

V4. The state table's facility column wrapped long names to three
lines at 390 against stranded columns. RULED, under the #51
precedent (presentation may differ where the phone says no): at
480px and below, city stacks under the name as a muted second line
and the City and CCN columns yield; the CCN stays filterable, on the
facility page, and in the CSV export.

V5. The owners page put three paragraphs (~180 words) before the
search input; at phone width the input sat at the fold's edge.
RULED: the input moves directly under the first paragraph; the
caution and filings paragraphs follow. Correction recorded: the
approval plan claimed the cautions would still precede rendered
results, which is wrong, results render inside the explorer under
the input. What holds instead: the input's own hint carries the
exact-strings, LAST-FIRST, and disclosed-role reminders, and the
fuller teaching sits immediately below.

V6. The home search and the state filter had different scopes with
no scope named. FIXED: "Search all facilities by name, city, ZIP,
CCN, or owner name" / "Filter this table by facility name, city, or
CCN".

V7. The home search's dead end was one line with no route onward.
Upgraded by the first reader-walk result: the reader searched a
chain name plus a city where that chain has no facility; the
conjunctive token match returned nothing while six facilities in
that city and seventeen names of that chain sat one query away.
RULED: the dead end is not allowed to be the whole answer. On a
multi-word search matching nothing as a whole, the empty state now
shows what the file contains for each word separately: exact
published values, counted in full, first few listed in the index's
own name order, labeled as partial matches with the closing line
that nothing there says any of them is what the reader meant. No
merging, no ranking, no guessing. Single-word dead ends keep the
plain line plus the routes onward (browse by state, the Ownership
page).

What the reviewer flagged as genuinely good: the desktop ratings
row, the provenance strip ("the best-designed element on the site"),
and the nav at both widths.

## Verification of this round

Every change re-rendered locally and read: the dead-end state driven
in the browser with a fixture query of the same shape as the walk's
(an owner-name word plus a facility word, conjunctively nothing),
showing the owner group, the facility group with full counts, and,
incidentally, the fixture's hostile script-tag facility name
rendering escaped in the new list; the state table at 400 showing
two controlled lines per row; the solid chip beside the plain one;
the owners page with the input under the first paragraph (one
duplicated phrase between the extended hint and the following
paragraph was caught in the render and trimmed); the single-word
dead end showing the guidance branch; the footer button on its own
line. Execution recorded in DECISIONS.md entry 76.
