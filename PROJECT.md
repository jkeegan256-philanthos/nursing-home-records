# PROJECT.md

The shared understanding behind this site. Read this before changing
anything. Code shows how; this file shows why and where the lines are.

## Purpose

Make the ownership structure of America's certified nursing homes
readable in seconds. Most people assume these are government
institutions. The data says otherwise: roughly three in four are
operated for profit, fewer than one in fifteen by any government, and
every facility in the file holds Medicare or Medicaid certification,
which is the only reason it appears in CMS data at all. Around 1.25
million people live in them on an average day. The site shows who
stands behind each building, in what role, since when, plainly and
without commentary.

## Audiences

Families choosing a facility. Hospital discharge planners. Reporters
who need a citable link. State agencies vetting owners. Researchers.
Workers deciding where to work. Small audiences with large leverage.

## Principles

These are load-bearing. A change that violates one is wrong even if it
looks useful.

1. Display, never calculate. Every value on the site is CMS's own,
   shown as published. Counts of rows and groupings by published
   fields are allowed; derived scores, rankings by judgment, and
   edited values are not.
2. Exact strings. Names group by the exact published name. No
   matching, merging, or identity claims. Related companies often file
   under several names; the site says so instead of guessing.
3. Roles first. The disclosure file includes lenders, accountants,
   consultants, and managers, not just owners. Any view that shows a
   name without its role misleads.
4. Uniform rules, no targets. Every name gets the identical layout.
   Sort keys are neutral. The site never singles anyone out; whatever
   pattern exists reveals itself to anyone who looks.
5. Radical provenance. Every table carries its source file, CMS
   dataset id, and modified date. The untouched zip, manifest, and
   data dictionary are republished with a checksum. Processing
   warnings are public.
6. Full record one click away. Summaries never replace access to the
   complete published record.
7. A claim and the check that earns it ship together, or neither
   ships. Anything this site says about its own behaviour -- what it
   requests, what it renders, what it does when something fails -- is
   a claim about run time, and a claim with no check that runs the
   thing is a claim nobody has verified. Where the check cannot be
   built yet, the claim comes down until it can. This one was learned
   the expensive way; the 2026-08-22 entries are the receipt.

## Declined scope

Decided deliberately. Do not revisit casually.

- No money flows. Cost reports, payments, and margins are out. The
  site maps who surrounds a building, not what they were paid.
- No name merging or entity resolution of our own. If portfolio
  averages are ever wanted, use CMS's own chain performance dataset,
  where CMS did the resolution and the math.
- No single-name campaigns. The founder's firsthand experience is the
  reason the site exists, not evidence on it. It stays out of the
  copy.
- No editorial layer: no adjectives, no verdicts, no "worst of"
  lists.

## What the filings are

These are disclosures filed by the facilities and their parties
themselves. CMS publishes them as filed and does not independently
verify them. Gaps and layered structures in the filings appear here as
gaps. Our checksums prove the mirror matches the source; they are
silent about whether the source matches reality. The site says this
where readers will see it, because a confident-looking mirror can
launder self-reported filings into apparent fact, and refusing that
laundering is provenance of a deeper kind.

## Named individuals

The disclosure file names natural persons — owners, officers, managing
employees — and this site makes those names searchable nationwide,
which CMS's own site does not. That is deliberate. The disclosure
exists so the public can see who stands behind a facility, and a
public record that cannot be found is not meaningfully public. The
safeguards are the principles above, applied without exception: exact
strings with no merging or identity claims (2), every name shown with
its role (3), the identical layout and neutral sort for every name
with no one singled out (4), and the declined scope — no money flows,
no editorial layer, no single-name campaigns. Corrections to the
underlying record belong with CMS; corrections to our display of it
belong on the corrections link.

## Architecture in one breath

A GitHub Action fetches the monthly CMS nursing homes theme zip (or
uses one committed in data/), validates it against its manifest,
converts every CSV to Parquet as pure text with row counts asserted,
splits tables over 30 MB by state, and rebuilds a Next.js static
export: one page per state, one per facility, an Ownership page that
searches all owner names in the browser via DuckDB-WASM, and a Data
page with checksums and downloads. Deployed to GitHub Pages. About
545 MB and 14,751 pages per batch. No servers, no database, no
secrets.

## Operating it

Monthly refresh is one tap: Actions, Build and deploy, Run workflow.
A schedule also fires on the 5th at 09:47 UTC; delivery is measured
to run late and occasionally not at all, so the tap remains the
backup ritual whenever the 5th passes without a Scheduled run. The
Data page shows which batch is live. Local development:
`npm run fixture` then `npm run dev`.

## Continuity

Most civic tools are mortal; this one is built to fail legibly and
forkably. The code is MIT, the data is public and re-fetchable from
CMS, ADAPTATION.md maps the specifics, and the hosting has no bill to
lapse. Every page carries its batch vintage, so an unmaintained mirror
degrades into a labeled archive, not a silent lie. Anyone can fork the
repository and run the workflow to serve a current copy. An
institutional adopter is a legitimate outcome of outreach, not a
prerequisite for it.

## Future phases, in order of value, none started

1. CMS chain performance layer: display CMS's own per-chain averages,
   cross-linked with the name pages. Stays inside principle 1 because
   CMS computes the numbers.
2. CSV export of any on-screen view, for citability.
3. Batch retention for then-versus-now display of successive
   published vintages.

Each waits until the current site proves insufficient, and each ships
only if it survives the principles above.

## Decision log

Standing policy: a decision reversed is not a mistake hidden; it is a
principle enforced. Entries are appended, never rewritten. When a
shipped feature is reversed, the original entry stays, the reversal is
dated beside it, and the reasoning is recorded at full length.

- 2025: first version built by hand over about nine months; expired
  July 2026.
- 2026-07-22: rebuild agreed. Zip-in, static-out, provenance
  everywhere, all values as text.
- 2026-07-22: full-record tables moved to on-demand load after the
  first build exceeded the GitHub Pages 1 GB cap.
- 2026-07-23: workflow changed to fetch the zip itself after hitting
  GitHub's 25 MB browser upload cap.
- 2026-07-23: Ownership page added after profiling the disclosure
  file: 61,671 names, two in five name-facility pairs holding stacked
  roles, corporate families splintered across spellings.
- 2026-07-24: trend-not-target confirmed as policy. Money flows,
  name merging, and single-name framing declined.
- 2026-07-24: home page ownership tallies, facility ownership chip,
  corrections link, and this charter added.
- 2026-08-05: named-individual searchability written down as a
  deliberate decision, with principles 2-4 and the declined scope as
  its safeguards.
- 2026-08-05: owner pages pre-rendered at a uniform threshold, five or
  more distinct facilities, applied identically to every name per
  principle 4. Every other name remains searchable in the explorer.
- 2026-08-05: after the second external audit, adopted the
  self-reported-filings caveat on the Ownership page, About, and this
  charter; added continuity documentation; calibrated audience claims
  to the professional-tool-first reality; retired "readable by anyone"
  until the ergonomics release earns it. Declined per-entity business
  inference (e.g. "appears to provide pharmacy services") as a
  forbidden identity claim; the charter-clean substitute is CMS's own
  role definitions inline, which rides with the glossary work.
- 2026-08-06: integrity ledger and drift notes added. The ledger
  deliberately proves this mirror's served history, not CMS's, and
  says so beside the table. Drift notes report structural change only;
  row deltas stay silent because change-over-time display is the
  deferred retention feature, whose fence stands.
- 2026-08-06: ergonomics release shipped - keyboard-operable record
  tabs, responsive table and layout refinements, state tables gain
  filter, neutral-key sort, and the deferred CSV button. The standing
  rule's condition is met; when family-facing promotion begins is the
  founder's call, not triggered by the merge.
- 2026-08-06: uniform public-record lookup links adopted under every
  name - OIG exclusions, SEC EDGAR, CourtListener - the same row for
  all 61,671 names, exact string pre-filled where the destination
  allows, copy button where it doesn't. The boundary: the site carries
  the reader's question to the public record; it never carries the
  record's answer back. Refused and logged: any automated join against
  the exclusion list or similar, because a name-string join is the
  machine making the match, and the government's own verification
  requires identifiers the file does not hold. Links, never joins.
- 2026-08-07: the lookup-links row reversed, one day after shipping,
  on the strength of an outside critique the designer judged correct.
  Three errors, logged beside the designer's own rules. First, OIG's
  LEIE is an enforcement-only database: a name hit reads as a verdict,
  a miss reads as silence, OIG's own guidance says name-matching alone
  is insufficient, and the verification step requires an SSN the
  public never holds — the row sent readers into a workflow that
  cannot be completed, wearing the costume of due diligence. Second,
  the selection frame: choosing exclusions, dockets, and securities
  enforcement out of all possible public records is a menu that says
  "check whether these people are bad"; the neutral "public records"
  label was a fig leaf over it. Third, the decisive asymmetry: the row
  automated the construction of suspicion without automating its
  resolution, so under principle 4's identical layout it worked
  honestly for distinctive names and misled for common ones — uniform
  rules producing non-uniform harm, the exact failure this charter
  exists to catch, caught in the architect's own feature. Revision:
  all three links stripped; the copy button stays, because the
  LAST-comma-FIRST format is the genuine friction the feature solved
  and a copy button carries zero frame, zero implied workflow, zero
  destination endorsement — it formalizes what readers were doing by
  hand, nothing more. Research guidance moved to a single site-level
  prose note on About, naming kinds of records in general terms,
  linked to nothing, attached to no name. Retained on principle: the
  boundary between a join and a link stands — a join publishes an
  association as the site's content, a link requires a human act and
  leaves the pages silent — which is why this feature was revisable
  rather than radioactive; but a principled boundary does not rescue a
  badly chosen instance sitting close to it, and this instance was
  badly chosen. Reusers adapting this code: the row is gone because it
  could not be made honest, not because it broke; re-adding anything
  like it means answering the three errors above first.
- 2026-08-07: after three independent reviews of the reversal converged
  on its proportionality, the log gained its standing-policy preamble,
  and README and About each gained a one-sentence pointer to the
  documented reversals — two doors, disjoint audiences: repo skimmers
  never read About, site readers never open repos. Declined: a GitHub
  Release to memorialize the reversal, as ceremony; and a proposed
  categorical rule, "the machine may not construct a query that
  implies a match," because it silently upgrades an instance judgment
  into a bright line. The shipped boundary stays as judged: links
  versus joins is the principle, and instances near the line are
  weighed against it case by case — this week is the evidence that the
  weighing works. If the bright line is ever adopted, it gets its own
  dated entry with its own reasoning, not a rewording in a recap.
- 2026-08-05: scheduler verdict, by run label after a day of controlled
  measurement: scheduled delivery works on this account but arrives
  late (the monthly slot fired 4h54m behind) and drops some hourly
  slots. Permanent cron set to 09:47 UTC on the 5th, probe workflow
  retired, tap documented as the backup whenever the 5th passes
  without a Scheduled run.
- 2026-08-22: the zero-third-party claim retracted, copy first and
  alone. A project review built the site and drove it in a browser --
  the first check to do that rather than read the code and infer -- and
  recorded an outbound request to extensions.duckdb.org on every
  facility page load. DuckDB-WASM 1.32.0 does not statically link the
  Parquet reader into the bundle this site serves; the first
  read_parquet call autoloads it from duckdb.org. The Data page said,
  flatly, that the site makes no third-party requests and that a build
  check enforced it. Both halves were untrue. The check greps the
  exported files for a list of CDN hostnames, and the URL in question
  is assembled inside a WebAssembly binary at run time, where no grep
  of the export can reach it: the gate could not have caught this, and
  a longer denylist would not have helped. The sequencing here is
  deliberate and is the point of this entry. The false sentence comes
  down today, in a change that touches nothing but copy, because a
  claim that is untrue should stop being made at the first moment it
  can, not at the moment its subject is repaired -- shipping the
  correction and the fix together would leave the untrue sentence
  standing for however long the fix takes, which is a choice about
  convenience wearing the costume of tidiness. What replaces it names
  the request, names what it discloses, and names what breaks when a
  network blocks it. Vendoring the extension so this site serves it,
  and replacing the grep with a headless page load that records every
  request and fails on any host that is not this one, follow as their
  own changes; the sentence returns only with its own dated entry, when
  it is true again. Distinguished from the 2026-08-07 reversal on
  purpose: that was a judgment defended and then overturned on
  reflection; this is not a judgment at all but a statement of fact
  that was wrong, and the remedy for a wrong fact is retraction, not
  reconsideration. Noted for reusers: this failure mode is not
  particular to this site. Any static site that ships DuckDB-WASM and
  believes it has vendored the engine has likely inherited the
  extension fetch too, and will not find it by reading its own
  source.
- 2026-08-22: carried state made fail-closed, and given a second home.
  The ledger chain and the owner-slug reservations were read from one
  place, the deployed site, by one unauthenticated GET each. On any
  failure -- a timeout, a DNS blip, a Pages hiccup -- the build warned
  and carried on with nothing, which meant writing a ledger that began
  again at one entry and a slug map that had forgotten every URL it had
  ever reserved, then deploying that as the new truth for the next build
  to read. The site was the only copy of the history of the site, so the
  thing being rebuilt was also the only witness to what it had been.
  This is deliberately the opposite call from the column contract, where
  a renamed CMS field blanks a field and prints a note rather than
  killing the monthly refresh, and the difference is worth stating
  because both look like the same choice from a distance. A dented page
  is visible, bounded, and fixes itself next batch. A truncated ledger
  is invisible, total, and is confirmed by the next batch rather than
  repaired by it. Where degrading is recoverable, degrade; where a green
  build is itself the disaster, stop. So: the deployed copy is still
  read first, because it is what readers actually got; a copy committed
  under state/ is read second; and a build that can read neither now
  refuses to run, before the transform rather than after it. The
  distinction the code has to make is between a source that answers and
  says the file is not there -- a chain that has not started cannot be
  truncated, so that case proceeds and says so -- and a source that
  answers nothing at all, which is the case that stops. NH_STATE_BOOTSTRAP
  starts a chain from nothing on purpose; the deploy workflow never sets
  it, so production cannot reach it by accident. Only builds that can
  actually deploy write the committed copy, because a fallback that
  records batches nobody served is not a record of anything.
- 2026-08-22: the deploy loop guard declared rather than inherited.
  Committing the carried state back to main means the deploy workflow
  writes to the branch that triggers the deploy workflow, and the
  July scoping of Release 3 rejected exactly this path for exactly
  this reason. It was taken anyway, on the strength of a protection
  that was real and unwritten: GitHub raises no workflow event for a
  push made with the default GITHUB_TOKEN. That is true today. It is
  also invisible in the repository, holds nowhere in this file, and
  ends silently the first time anyone swaps in a PAT or a GitHub App
  token to satisfy branch protection -- a change whose diff would look
  entirely reasonable, and whose consequence is a build that deploys
  that commits that builds, burning minutes and appending a junk entry
  to the ledger the commit exists to protect. Relying on it unwritten
  was the same error as the extension fetch three entries above:
  correct behaviour resting on a fact nobody could read. So the guard
  is now declared, paths-ignore on state/**, which survives a token
  change; the record-state job additionally refuses to push a commit
  reaching outside state/, so widening what it stages cannot defeat
  the trigger guard without tripping this one; and
  scripts/check_loop_guard.py asserts both in CI, validated by
  removing each and confirming it fails. The precise version of what
  was wrong, because the imprecise version misleads: the guard was
  never absent, it was the platform's rather than the repository's.
  The general rule, since this is the second instance in one day: a
  safety property that holds because of something outside this
  repository is not a safety property this repository has. Write it
  down or check it, and preferably both. The cost, recorded here so
  nobody rediscovers it at midnight: a commit touching only state/ no
  longer deploys, so a hand-edited ledger does not reach readers until
  some other change rides with it or someone taps Run workflow. That
  is a fair trade and arguably a second feature -- hand-editing the
  ledger is something this design wants to be awkward.
- 2026-08-22: the zero-third-party claim earned back, and the gate
  rebuilt around what it failed to see. The Parquet extension is now
  vendored at build time and the engine is pointed at this origin to
  find it, so no reader's browser contacts duckdb.org. Two details are
  the substance. First, the build asks the engine its own version rather
  than carrying a hardcoded one, because DuckDB composes the extension
  path from that version, and a version that drifted from the shipped
  binary would send every reader quietly back to duckdb.org for a file
  this site believed it was serving -- the same failure again, wearing
  a fix. Second, the check. The old one grepped the exported files for
  a list of CDN hostnames, and the thing it was built to prevent was
  invisible to it in principle: the URL is assembled inside a
  WebAssembly binary while the page runs, so it exists in no file at any
  point where a grep could look. Lengthening that list would not have
  helped, and the temptation to lengthen it is the reason this is
  written down. The replacement loads the finished site in a browser,
  exercises both DuckDB-backed views, records every request, and fails
  on any host that is not the one serving the site. It was validated by
  removing the fix and confirming it fails, naming the exact URL. The
  general form, kept because the next instance will not look like this
  one: a claim about what software does at run time can only be checked
  by running it. Static inspection of what was shipped can prove what is
  in the files and nothing whatever about what the files go and do. With
  that check standing, the sentence returns to the Data page -- narrowed
  to what is actually verified, and carrying its own history, because a
  claim that was once false and is now true should say so rather than
  quietly reappear.
- 2026-08-22: four notes from the session that shipped these changes,
  kept because the difference between the first two is the difference
  between evidence and assumption. The state commit landed on main and no build followed it,
  which confirms the outcome and not the mechanism: the push used the
  built-in GITHUB_TOKEN, so the platform would have suppressed that
  build whether or not paths-ignore existed. The declared guard is
  therefore still proven only by control tests, and remains insurance
  against a future token swap rather than something production has
  exercised. Saying so costs nothing and keeps the ledger of what is
  actually known accurate. Second, the deploy-path origin check moved
  forward into the release that restores the third-party claim, rather
  than riding one release later with the smaller documentation work.
  The claim and the check that earns it ship together or neither ships:
  a sentence backed only by a fixture run is a sentence backed by a
  synthetic batch, and the gap between those two would have been small,
  temporary, and exactly the shape of the gap this whole week existed
  to close. Third, a process error worth recording because this
  project's habit of reporting its own is part of why its claims are
  worth anything: while merging, a partial conflict resolution was
  committed with `git add -A`, putting conflict markers into README.md
  and package.json. CI would have caught it. It should not have needed
  to, and the fix is a repository-wide marker sweep before any push
  rather than trusting the resolver to have finished.
  Fourth, caught the same day and fixed in this release because it is
  the same failure wearing a reader's clothes: star ratings were drawn
  as five identical filled glyphs, the unearned ones separated only by
  CSS colour. Colour exists in a browser and nowhere else. Copy a page,
  scrape it, save it as text, or read it with anything that does not
  paint stylesheets, and a facility CMS rated one came out as five
  filled stars, indistinguishable from a facility rated five, on every
  page carrying a rating. The footer says figures are shown exactly as
  published; that sentence was false for every rating below five the
  moment the page left the screen, which makes this a principle 1
  violation that principle 7 is what caught. The unearned stars are now
  a different character, and the number itself rides in the text out of
  the layout, so a clipboard, a scraper, a screen reader, or a model
  gets the published value rather than a shape it has to count. A
  reader also no longer sees a dash where CMS published something
  unrecognised: the dash now means only that CMS published nothing.
  scripts/check_rendered_values.mjs reads the built pages and compares
  their text to the published numerals, and was validated against the
  broken export first, where it named the one-star facility rendering
  as five. The general rule, which is the reader-facing form of the two
  test-harness notes above: colour, position, and shape are decoration,
  and decoration must never be the only thing carrying a published
  value. Three instances of one pattern landed in a single day -- an
  assertion that printed ok while asserting nothing, a gate that went
  green having run no query, and a grey star shaped exactly like an
  earned one. Each was an artifact wearing the appearance of the thing
  it was not. The instance that explains why five readers walked past
  the stars is the fourth disguise: the class was called `off`. A name
  that describes intent rather than implementation is documentation
  living inside an identifier, and it carried no check, so every reader
  who saw `off` supplied "hollow" from the name and moved on -- the
  author of this fix included, having read the component on the first
  pass and registered the class without ever asking what it emitted. A
  variable name is a claim about behaviour, and principle 7 applies to
  it exactly as it applies to a sentence on a page.
- 2026-08-22: decoration audit, run because the star bug proved the rule
  needed one and recorded here because an audit that finds nothing is
  worth exactly what the rule it confirms is worth. The question asked
  of every rendering surface: is colour, position, or shape the only
  thing carrying a value CMS published? Findings, in full.
  Violations, both fixed in the same release: the star glyphs, above;
  and a published value the star component did not recognise being
  replaced with a dash, which is the site editing CMS data at the exact
  spot its footer promises it does not. Clean: no images, icons, SVG,
  CSS background images, or generated ::before/::after content exist
  anywhere in the site, so there is no non-text element that could
  carry a value. Every dash on every surface -- eighteen of them across
  seven files -- was checked individually and each is guarded by an
  emptiness test on the value it stands for, so a dash means CMS
  published nothing and never stands in for something CMS published.
  The remaining colour-only styles carry emphasis on text that is
  already there, not values: chip-warn colours a chip whose text is the
  published string, muted greys a dash or a label, quiet-link dots an
  underline under a role that is spelled out beside it. Sort arrows in
  the state tables are interface state, not data, and carry aria-sort
  besides. Considered and judged not a violation, with the reasoning
  recorded so the judgment can be revisited rather than rediscovered:
  the facility header shows an abuse chip only when the Abuse Icon is
  Y, so its absence covers N, blank, and anything unrecognised alike.
  That is the facts grid being a curated subset, which it has always
  been and which ADAPTATION.md names as a touchpoint, rather than a
  depiction that contradicts the data; the published string is one
  click away in the full record under principle 6. Adding Abuse Icon
  and Special Focus Status to the key facts would close it completely
  and is a two-line change, but it alters what every facility page
  displays, which is a design decision and not an audit's to make. Escalated, and decided the other way, which is
  recorded here as a separate fact from the audit's finding because an
  audit that quietly makes design decisions is one whose clean rows
  nobody can trust. Both fields are now displayed for every facility,
  on two grounds the audit had not reached. First, the rule from this
  same morning in its weakest form but the same form: the chip carries
  "Y" in text, but for every other facility the published value was
  carried by absence, and absence is a shape -- a reader could not tell
  "CMS published N" from "CMS published nothing", which are different
  facts. Second, and heavier for this charter: surfacing a field only
  when it says the alarming thing is closer to flagging than to
  display, and principle 4 means every facility shows its value
  whatever that value says. The change also converts the chips into
  exactly the pattern the sweep's clean rows describe -- emphasis on
  text present elsewhere on the page rather than the sole carrier of
  it. scripts/check_rendered_values.mjs now asserts both labels appear
  on every sampled facility page, so the field cannot quietly revert to
  appearing only when it has something alarming to say.
- 2026-08-22: three fidelity fixes in the transform and the record
  pages, from the same review. The load-bearing one is principle 6.
  Rows CMS publishes with a blank or non-standard state code are put in
  an _OTHER shard by the partitioner, and no page ever read that shard:
  a facility page asked for its own state's file and nothing else, so
  where a facility had such rows the record shown was shorter than the
  record published, with no notice that anything was missing. The
  processing note said those rows were kept, which was true of the file
  and false of the site. That is an undisclosed filter, which is the
  thing this project exists not to do, and it fell hardest on rows
  already flagged as irregular. Facility pages now read the state shard
  and the _OTHER shard together, and the provenance strip says so where
  the shard exists. Two smaller ones beside it. A published state value
  with surrounding whitespace passed a stripped validity check and was
  then used unstripped as a filename, splitting one state across two
  shards while the home page counted the facility and the state table
  omitted it; partitioning now normalises the key while the row keeps
  CMS's exact value, because choosing which file a row goes in is not
  editing the row. And two source files that classify to one table name
  used to overwrite each other in silence, with every per-file row-count
  assertion still passing, which the SNF VBP patterns make a live hazard
  at a fiscal-year boundary rather than a hypothetical; the zip
  extractor already refused two entries flattening to one filename, and
  the table map now refuses the same thing one level up. Each of the
  three is asserted in scripts/test_build_data.py, the first test in
  this repository that checks an outcome rather than that nothing
  crashed.
