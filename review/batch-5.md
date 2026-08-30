# Batch 5: pages, routing and CSS

Clean-room read, every file whole: app/page.tsx, app/layout.tsx,
app/not-found.tsx, app/robots.ts, app/sitemap.ts, app/globals.css, and
every page under app/ (about, data, facility/[ccn], glossary, methods,
owner/[slug], owners, state/[state]). Measured against the same charter
documents as batches 3 and 4.

## Findings

- app/glossary/page.tsx:74-76: the page claims "If CMS revises a definition, the next monthly batch carries the revision and this page moves with it", but the quoted definitions and the "updated July 2026" vintage are hardcoded constants in lib/glossary.ts:10-38; a batch refresh moves only the linked PDF, and no gate compares the quotes against the batch's dictionary (the gates reference the glossary page only as a sampled URL). A claim about the site's own behavior shipping without the check that earns it is principle 7's named failure shape. [breaks-charter] [WHAT]
- app/methods/page.tsx:42-51 and 79-101: the Methods page names specific filed parties in editorial prose, FORVIS MAZARS LLP called "an accounting firm" on the page, CIBC BANK USA, and four GEN/GENESIS names presented together as a spelling cluster; the characterization "an accounting firm" is an assertion about the entity behind an exact string that the file does not make, which is the identity claim principle 2 refuses, and naming parties at all sits in tension with principle 4's "never singles anyone out" and the declined single-name scope. The hedges are careful and the selection rule is mechanical (largest footprints, omitted if a rotation drops them), so this reads deliberate, but it is the one place site copy names filed parties and it needs an explicit ruling that it is sanctioned. [breaks-charter] [WHAT]
- app/owners/page.tsx:114-116: the reader-facing disclosure "N rows with a blank name are omitted here but appear on facility pages" mislabels the exclusion: blank_owner_rows is total rows minus the named set, and the named set also excludes rows whose Owner Name is the exact string 'None' (scripts/build_data.py:446, 459-464), so rows carrying a real published value are described to readers as blank. Page half of the batch-4 finding on OwnerExplorer's NAMED predicate; one ruling covers both. [breaks-charter] [WHAT]
- app/methods/page.tsx:155-157: the capacity sentence counts "{N} individuals", but the SQL counts distinct exact name strings with Owner Type Individual (scripts/build_data.py:372-381); calling name strings people asserts name equals person, the exact equation trap 2 on the same page and the owner pages' "Same name can be more than one person" caveat refuse. [costs-clarity] [WHAT]
- app/layout.tsx:82-84: the sitewide footer claims figures are shown "with no edits, computations, or filtering", and app/data/page.tsx:49 and 188-189 repeat it; principle 1 itself carves out counts and groupings, and the site displays computed counts on the home page, owner pages, and Methods figures, and filters blank and 'None' owner rows out of the owners artifacts. The blanket phrasing overstates what the principles actually promise, on the same pages that display the carve-outs. [costs-clarity] [WHAT]
- app/facility/[ccn]/page.tsx:86 and 130: the abuse chip matches the published value case-insensitively but prints the hardcoded string "Abuse icon: Y", so a batch publishing "y" would render a normalized value in the chip while the fact grid shows the raw one. [cosmetic] [HOW]
- app/owner/[slug]/page.tsx:120-127: role cells deep-link to glossary anchors built from the published value; a role value outside the dictionary's seventeen lands on a nonexistent anchor, the same dead-anchor pattern recorded in batch 4 for FacilityRecords and OwnerExplorer. [costs-clarity] [HOW]
- app/page.tsx:32: the home tally's remainder bucket is described as "listed otherwise", but ownershipRollup's other bucket (lib/data.ts:294-300) also counts rows whose Ownership Type is blank, which are not listed otherwise but not listed at all. [cosmetic] [HOW]
- app/globals.css:277: the search-result hover hardcodes #f4f6f3, the value of --stripe, instead of the variable, and sits outside the @media (hover: hover) guard that the stylesheet's own comment at lines 168-176 establishes precisely because a tap was measured leaving hover paint stuck on touch; search result links keep that stuck-paint behavior. [cosmetic] [HOW]

## Nothing found

Read whole, no findings: app/robots.ts, app/sitemap.ts,
app/not-found.tsx, app/about/page.tsx, app/state/[state]/page.tsx.

## Observations (not proposals, recorded per the scope fence)

- app/about/page.tsx:33: "roughly three in four" is a typed prose figure; the Methods page's code comment forbids figures from prose because batches move. "Roughly" makes it a characterization rather than a figure and the ratio is durable, so this reads as a deliberate exception, noted for awareness.
- app/state/[state]/page.tsx:55 and 105: averages values render through trim(), the same display trim recorded for FullRecord in batch 4; visually inert under HTML whitespace collapsing.
- app/data/page.tsx:55: the source zip size renders as bytes divided to one decimal MB, a computed presentation of site metadata rather than of a CMS value; consistent with how the ledger table shows sizes.
