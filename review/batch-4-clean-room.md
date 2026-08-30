# Batch 4: components

Clean-room read, every file whole: CitePage.tsx, CopyName.tsx,
CsvButton.tsx, FacilityRecords.tsx, FacilitySearch.tsx, FullRecord.tsx,
JsonLd.tsx, OwnerExplorer.tsx, PrintProvenance.tsx, Provenance.tsx,
Stars.tsx, StateTable.tsx. Measured against the same charter documents
as batch 3.

## Findings

- components/OwnerExplorer.tsx:19-20: the NAMED predicate excludes rows whose Owner Name is the exact string 'None' from search results, and the build applies the same filter to the owners artifacts (scripts/build_data.py:446) while its only disclosure, the processing note at scripts/build_data.py:464, calls every filtered row a "blank owner name"; a reader who searches for None is told "No owner names contain that text" while rows carrying that published value exist and render in facility ownership tabs. A filter on a published value whose one disclosure mislabels it needs a ruling: sanction it and say it, or drop it. [breaks-charter] [WHAT]
- components/OwnerExplorer.tsx:114 and 167-173: the detail query takes LIMIT 3000 with no ORDER BY and the rows are then sorted client-side, the exact pattern lib/duckdb-client.ts:133-138 forbids in its own words; the roles and types chips at lines 174-175 are also derived from the capped slice while the header counts come from SQL over all rows. Latent until one name exceeds 3000 disclosure rows, and then "showing the first 3,000" labels an arbitrary scan slice presented in sorted order, with role chips that can omit roles present in unfetched rows. [breaks-correctness] [HOW]
- components/FacilityRecords.tsx:478-484: cells in GLOSSARY_COLUMNS link to the glossary at #termAnchor(value), but the glossary page only creates anchors for the five column terms and the seventeen dictionary role values (app/glossary/page.tsx:33-48); every "Owner Type" value ("Individual", "Organization") and any role value outside the dictionary's list yields a link that opens the glossary at the top with no target, and OwnerExplorer.tsx:487-492 has the same behavior for off-list roles. [costs-clarity] [HOW]
- components/FacilitySearch.tsx:132-133: "Showing the first N facility matches" renders even when N is below the 40-row cap, when those are in fact all the matches, implying a truncation that did not happen; FacilityRecords.tsx:409-411 gets the same disclosure right by adding the suffix only at the limit. [cosmetic] [HOW]
- components/FullRecord.tsx:62: the value is rendered through trim() in the one section titled "Full record as published", so a value CMS published with leading or trailing whitespace displays edited; invisible after HTML whitespace collapsing, but the DOM text a reader copies is not the published string, and FacilityRecords renders the raw value for the same data. [cosmetic] [HOW]
- components/FullRecord.tsx:25-31: the loader assumes the providers table is mode single and passes info.path straight to queryParquet; if ProviderInfo ever crossed the 30 MB threshold and split by state, the path would be a directory and the toggle would always show "The record could not be loaded", with nothing naming the real cause. Latent; FacilityRecords.tsx:248-258 already has the shard logic this would need. [costs-clarity] [HOW]
- components/OwnerExplorer.tsx:420-424 vs components/FacilityRecords.tsx:415-420: the CSV filename's vintage falls back to the literal "current" in one and to the batch's generated_at month in the other when modified_date is missing, so the two export surfaces stamp degraded batches differently. [cosmetic] [HOW]

## Nothing found

Read whole, no findings: CitePage.tsx, CopyName.tsx, CsvButton.tsx,
JsonLd.tsx, PrintProvenance.tsx, Provenance.tsx, Stars.tsx,
StateTable.tsx.

## Observations (not proposals, recorded per the scope fence)

- components/StateTable.tsx:30-83: reader-controlled sorting already exists on state tables, by clickable headers over the five published fields, disclosed in the count line as "sorted by published fields only"; the numeric sort converts published strings to numbers for ordering only, values render as published. Recorded because the scope fence names reader-controlled sorting; this is existing shipped behavior, not something this review proposes.
- components/FacilityRecords.tsx:53-63 and 91-105: the Location column is collapsed off the identity line by an alphanumeric-containment heuristic when judged a restatement of the address, making it the one published column a reader can see only in the CSV; the comment documents the choice, so this reads as deliberate, noted here for the founder's awareness.
- components/FacilityRecords.tsx:474-475, FullRecord.tsx:62, OwnerExplorer.tsx:494-498: blank published values render as a muted dash glyph across the site, a consistent display convention for absence rather than an edit of a value.
