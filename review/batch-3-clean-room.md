# Batch 3: query and data layer

Clean-room read, every file whole: lib/data.ts, lib/duckdb-client.ts,
lib/seo.ts, lib/config.ts, lib/states.ts, lib/glossary.ts, lib/csv.ts.
Measured against PROJECT.md, ADAPTATION.md, README.md, state/README.md.

## Findings

- lib/config.ts:16-19: the comment block ends "so a fork does not inherit a name and a blank never ships as a half-finished attribution", and the very next line ships SITE_AUTHOR populated with a real name; a fork of this exact tree inherits that name silently, which is the hazard ADAPTATION.md touchpoint 10 names, and touchpoint 10's own claim "It ships empty" no longer matches this file. Evidence: lib/config.ts:19, ADAPTATION.md:87-93. [costs-clarity] [WHAT]
- lib/data.ts:348: allCCNs() drops rows whose CCN is blank (filter(Boolean)), so such a row gets no facility page, while facilitiesFor() at lib/data.ts:334-342 keeps the same row with ccn set to the empty string; StateTable.tsx:129 then renders it as a link to /facility// which the export never generated, a broken link with no notice. Latent: fires only if CMS ships a ProviderInfo row with a blank CCN, and nothing in the read path asserts it cannot. [breaks-correctness] [HOW]
- lib/data.ts:359-361: getFacility() builds its CCN map with the Map constructor, so duplicate CCNs silently keep only the last row, while allCCNs() at lib/data.ts:345-352 emits every occurrence; a duplicated CCN would generate the same page twice, both showing the last row, and the earlier published row would never render anywhere, with no processing note. No uniqueness assertion exists on the read side. [costs-clarity] [HOW]
- lib/duckdb-client.ts:68-69: the extension repository URL is interpolated into SET statements bare, though sqlLit() sits in the same file; a base path containing an apostrophe would make both SETs fail (each is caught and logged), leaving the engine on its default repository, which is the extensions.duckdb.org fetch this project's history is about. The origin gate would catch it before deploy, so the cost is a confusing failure mode, not an escape. [cosmetic] [HOW]
- lib/duckdb-client.ts:85-93: on init timeout the promise rejects and dbPromise resets, but the in-flight init() keeps running and its Worker is never terminated; a late success strands a live worker and database nothing references, and the retry spawns a second. Rare path, bounded waste. [cosmetic] [HOW]
- lib/seo.ts:167-169: ownerDescription() formats the facilities count with toLocaleString but the states count without; states cannot exceed 53 so no rendering difference today, just an inconsistency between the two counts in one sentence. [cosmetic] [HOW]

## Nothing found

Read whole, no findings: lib/states.ts, lib/glossary.ts, lib/csv.ts.

## Observations (not proposals, recorded per the scope fence)

- lib/data.ts:287-306: ownershipRollup() groups by prefix of "Ownership Type" rather than the exact string. ADAPTATION.md touchpoint 7 names this parsing explicitly, so it reads as a sanctioned, documented departure from exact-string grouping, not a finding.
- lib/data.ts:95-98: averagesFor() matches "State or Nation" values with trim().toUpperCase(), a normalized join rather than an exact-string one. It selects rows, never edits displayed values, and defends against case drift in a key CMS controls; noted only because principle 2 readers may ask.
