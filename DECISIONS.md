# DECISIONS.md

The decision log for this project. Split out of PROJECT.md on
2026-08-24, because a charter is meant to be read first and stay short
while a log is meant to be appended to forever, and holding both in one
file meant every decision recorded made the principles harder to find.
Nothing here was rewritten in the move.

Read `PROJECT.md` first. This file is the record of what that charter
cost.

Standing policy: a decision reversed is not a mistake hidden; it is a
principle enforced. Entries are appended, never rewritten. When a
shipped feature is reversed, the original entry stays, the reversal is
dated beside it, and the reasoning is recorded at full length.

This log holds 42 entries. `scripts/check_project_doc.py` asserts that
number, along with the shape of every entry, so an entry lost or mangled
by a bad edit fails a build instead of disappearing quietly. Appending
one means updating the number; that is the point of it.

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
  between evidence and assumption. The state commit landed on main and
  no build followed it, which confirms the outcome and not the
  mechanism: the push used the built-in GITHUB_TOKEN, so the platform
  would have suppressed that build whether or not paths-ignore
  existed. The declared guard is therefore still proven only by
  control tests, and remains insurance against a future token swap
  rather than something production has exercised. Saying so costs
  nothing and keeps the ledger of what is actually known accurate.
  Second, the deploy-path origin check moved forward into the release
  that restores the third-party claim, rather than riding one release
  later with the smaller documentation work. The claim and the check
  that earns it ship together or neither ships: a sentence backed only
  by a fixture run is a sentence backed by a synthetic batch, and the
  gap between those two would have been small, temporary, and exactly
  the shape of the gap this whole week existed to close. Third, a
  process error worth recording because this project's habit of
  reporting its own is part of why its claims are worth anything:
  while merging, a partial conflict resolution was committed with `git
  add -A`, putting conflict markers into README.md and package.json.
  CI would have caught it. It should not have needed to, and the fix
  is a repository-wide marker sweep before any push rather than
  trusting the resolver to have finished. A second control followed
  from the same mistake later the same day. When a stacked branch had
  to absorb a squash-merged main across six conflicted files, the
  blunt resolution -- keep ours everywhere -- was verified rather than
  trusted: the branch-to-main diff was confirmed one-directional, and
  thirteen named features from both releases were probed individually
  before the push. Both controls exist because one careless `git add
  -A` proved that a resolution nobody checked is a resolution nobody
  knows the shape of, and a stacked branch absorbing a squash merge is
  exactly where that goes unnoticed. Fourth, caught the same day and
  fixed in this release because it is the same failure wearing a
  reader's clothes: star ratings were drawn as five identical filled
  glyphs, the unearned ones separated only by CSS colour. Colour
  exists in a browser and nowhere else. Copy a page, scrape it, save
  it as text, or read it with anything that does not paint
  stylesheets, and a facility CMS rated one came out as five filled
  stars, indistinguishable from a facility rated five, on every page
  carrying a rating. The footer says figures are shown exactly as
  published; that sentence was false for every rating below five the
  moment the page left the screen, which makes this a principle 1
  violation that principle 7 is what caught. The unearned stars are
  now a different character, and the number itself rides in the text
  out of the layout, so a clipboard, a scraper, a screen reader, or a
  model gets the published value rather than a shape it has to count.
  A reader also no longer sees a dash where CMS published something
  unrecognised: the dash now means only that CMS published nothing.
  scripts/check_rendered_values.mjs reads the built pages and compares
  their text to the published numerals, and was validated against the
  broken export first, where it named the one-star facility rendering
  as five. The general rule, which is the reader-facing form of the
  two test-harness notes above: colour, position, and shape are
  decoration, and decoration must never be the only thing carrying a
  published value. The general form, stated before the instances rather
  than after them because it is what makes them one thing: an absence
  wearing the shape of a presence. Six landed in a single day. An
  assertion that printed ok without asserting. A gate that went green
  having run no query. A class named off that turned nothing off. A
  grey star shaped exactly like an earned one. A commit that captured
  conflict markers. An edit whose pattern matched nothing, reporting
  success while leaving the file untouched. The last is the purest, and
  the one now mechanized rather than watched for: the edit helper
  asserts both that the pattern was found and that the file's bytes
  changed, so an edit that does nothing fails instead of announcing
  itself. The instance that explains why five readers
  walked past the stars is the fourth disguise: the class was called
  `off`. A name that describes intent rather than implementation is
  documentation living inside an identifier, and it carried no check,
  so every reader who saw `off` supplied "hollow" from the name and
  moved on -- the author of this fix included, having read the
  component on the first pass and registered the class without ever
  asking what it emitted. A variable name is a claim about behaviour,
  and principle 7 applies to it exactly as it applies to a sentence on
  a page.
- 2026-08-22: decoration audit, run because the star bug
  proved the rule needed one and recorded here because an audit that
  finds nothing is worth exactly what the rule it confirms is worth.
  The question asked of every rendering surface: is colour, position,
  or shape the only thing carrying a value CMS published? Findings, in
  full. Violations, both fixed in the same release: the star glyphs,
  above; and a published value the star component did not recognise
  being replaced with a dash, which is the site editing CMS data at
  the exact spot its footer promises it does not. Clean: no images,
  icons, SVG, CSS background images, or generated ::before/::after
  content exist anywhere in the site, so there is no non-text element
  that could carry a value. Every dash on every surface -- eighteen of
  them across seven files -- was checked individually and each is
  guarded by an emptiness test on the value it stands for, so a dash
  means CMS published nothing and never stands in for something CMS
  published. The remaining colour-only styles carry emphasis on text
  that is already there, not values: chip-warn colours a chip whose
  text is the published string, muted greys a dash or a label, quiet-
  link dots an underline under a role that is spelled out beside it.
  Sort arrows in the state tables are interface state, not data, and
  carry aria-sort besides. Considered and judged not a violation, with
  the reasoning recorded so the judgment can be revisited rather than
  rediscovered: the facility header shows an abuse chip only when the
  Abuse Icon is Y, so its absence covers N, blank, and anything
  unrecognised alike. That is the facts grid being a curated subset,
  which it has always been and which ADAPTATION.md names as a
  touchpoint, rather than a depiction that contradicts the data; the
  published string is one click away in the full record under
  principle 6. Adding Abuse Icon and Special Focus Status to the key
  facts would close it completely and is a two-line change, but it
  alters what every facility page displays, which is a design decision
  and not an audit's to make. Escalated, and decided the other way,
  which is recorded here as a separate fact from the audit's finding
  because an audit that quietly makes design decisions is one whose
  clean rows nobody can trust. Both fields are now displayed for every
  facility, on two grounds the audit had not reached. First, the rule
  from this same morning in its weakest form but the same form: the
  chip carries "Y" in text, but for every other facility the published
  value was carried by absence, and absence is a shape -- a reader
  could not tell "CMS published N" from "CMS published nothing", which
  are different facts. Second, and heavier for this charter: surfacing
  a field only when it says the alarming thing is closer to flagging
  than to display, and principle 4 means every facility shows its
  value whatever that value says. The change also converts the chips
  into exactly the pattern the sweep's clean rows describe -- emphasis
  on text present elsewhere on the page rather than the sole carrier
  of it. scripts/check_rendered_values.mjs now asserts both labels
  appear on every sampled facility page, so the field cannot quietly
  revert to appearing only when it has something alarming to say.
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
- 2026-08-22: the fork boundary corrected, and the origin gate moved
  onto the build that actually ships. ADAPTATION.md claimed eight
  touchpoints and had ten. The two missing ones are not theme
  knowledge, which is why they were missed while the document was being
  written about theme knowledge, and they share a shape worth naming:
  each is a default that is correct for this deployment and wrong for
  every other one, and quiet in both cases. NH_STATE_URL and STATE_BASE
  point a fork at this site's ledger and this site's slug reservations,
  which it would then serve as its own history; SITE_URL, REPO_URL, and
  CORRECTIONS_EMAIL point a fork's sitemap, its decision-log links, and
  its corrections address back here. A fork that skipped both would not
  fail. It would build, deploy, and look right. The continuity section
  of the charter rests on anyone being able to fork the repository and
  run the workflow, so a boundary document that does not mention the
  settings which make a fork someone else's mirror was not describing
  the boundary. Both are now touchpoints, named in README's first-time
  setup and beside the constants themselves, with the honest note that
  they cost minutes rather than the days the other eight cost. Beside
  that, two gaps of the same family: the glossary page was generated and
  in no sitemap, so the page carrying CMS's verbatim role definitions,
  which every inline role link points at, was the one page search
  engines were never told about; and the origin check ran only on pull
  requests against the synthetic fixture, never against the export being
  served. The claim on the Data page is about the build readers get, so
  the check now runs on that build, with the real batch behind it, and
  nothing deploys if it fails.
- 2026-08-23: counts made accountable to their own source, and a
  Release 3 decision reversed. That spec said drift notes should stay
  deliberately silent on row-count deltas, because monthly volume
  change is normal and reporting it is noise. The first half is right
  and the conclusion did not follow. It treated a delta as a display
  feature -- the fenced then-versus-now thing, still deferred, still
  fenced -- and so never asked whether a delta is also a diagnostic
  that no reader ever sees. It is, and the omission has the same shape
  as everything else this week: what the site requests was gated, what
  it renders was gated, and what it counts was left to be believed.
  The occasion was benign. June's 61,671 named owners became July's
  62,077, recomputed from the served file and correct. But nothing in
  the system could say which of the only two possible causes it was. A
  count that moves means CMS changed or we changed, and the second is
  always a bug, and both looked identical from outside and from
  inside. The discriminator turns out to need no thresholds and no
  judgement, only a comparison the ledger could already answer and was
  never asked: a count and the bytes it was derived from travel
  together, so a count that moved while its source file is byte-
  identical cannot have moved because the data changed. Every ledger
  entry now carries the derived headline numbers -- facilities,
  states, ownership rows, named owners, owner pages -- each tagged
  with the file it came from, and each build compares against the most
  recent earlier build that saw that file at that hash, rather than
  merely the previous build, so an unrelated batch in between cannot
  hide a regression. Byte-identical and moved is a hard failure.
  Changed source and moved is silent, which keeps the Release 3
  instinct intact where it was right. Worth knowing about the
  polarity: CMS stamps its filenames with the month, so this is silent
  across a monthly refresh, when there is nothing to compare, and loud
  across a code deploy on an unchanged batch, which is precisely the
  only case where this pipeline can be at fault. Its blind spot,
  stated at full size because the first draft of this entry
  understated it and a check whose limits are written small is a check
  over-believed. It is not merely that a code change and a data change
  in the same build are indistinguishable. CMS stamps every filename
  with the month, so at every monthly refresh there is no same-hash
  predecessor at all: the entire batch arrives with nothing to compare
  it to, and the check is silent by construction at the one moment the
  data actually turns over. It protects held-batch code deploys, which
  is a real and frequent case and the only one where this pipeline can
  be at fault. It never protects the turnover. Discrimination there is
  genuinely impossible, so the answer is not a check but an
  instrument: when the filename changes, each moved count is reported
  with its before and after and no verdict attached. A maintainer
  reading "named owners 62,077 to 62,431" moves on; one reading
  "62,077 to 41,002" investigates. The human is the discriminator
  because nothing else can be, and saying so plainly is more honest
  than a threshold pretending to be knowledge. Counts carry their
  logical table as well as their file so the pairing survives the
  rename. One boundary noted deliberately, and drawn around the object
  rather than the quantity, because "two numbers is fine and three is
  not" would not survive being revisited. The deferred retention fence
  encircles displaying change in CMS's data about facilities and
  owners: a browsable then-and-now of ratings, citations, or holdings.
  This note reports change in the mirror's own operation, a different
  object and already the ledger's stated job. The same distinction
  settles the question one level up, since the ledger's entries are
  themselves a public history and now carry counts: still fine, same
  reason. What would cross is a page inviting a reader to compare
  batches of CMS data. This is a processing note about one anomaly, in
  the channel principle 5 already makes public. Recorded so that if
  the judgement is ever revisited it is revisited as a judgement, not
  rediscovered as an oversight. NH_ALLOW_COUNT_DRIFT=1 passes a drift
  through and writes it into the ledger entry, so an intentional
  change becomes a recorded decision rather than a silent pass; the
  deploy workflow never sets it.
- 2026-08-23: the competitive landscape corrected, and what actually
  distinguishes this site written down instead of assumed. An earlier
  review reported that no direct competitor was found. It searched
  poorly and the finding was passed along unchecked. There are several:
  nursinghomereport.org publishes per-owner-name pages with state CSV
  downloads and a same-name caveat close to this site's own,
  caretrace.org offers browsing by owner name, role, organisation type,
  state and portfolio size, and nursinghomedatabase.com covers
  ownership across roughly 45,000 individuals and companies. Recording
  this because the belief was load-bearing for how the project thought
  about itself, and because a project that logs its own errors has no
  business quietly dropping one that flattered it. Nothing shipped to
  readers was wrong: the site has never claimed to be the only one,
  and a grep for every form of that claim found none. That is luck
  rather than design -- nobody wrote it, no check prevented it -- and
  the useful conclusion is that such a claim should stay off the site
  permanently. "No one else publishes this" is a claim about the world,
  and unlike every other claim here it cannot be checked by a build.
  Principle 7 has no machinery for it and should not grow any; the
  answer is not to gate the claim but to decline to make it. What does
  distinguish this site is demonstrable on the page and needs no
  outside agreement: the source zip's checksum, the append-only ledger
  of every build served, a vintage on every table, a single-origin
  claim gated by a browser on every deploy, and a glossary that says
  plainly where CMS declines to define its own role codes. A reader can
  verify every one of those without trusting anyone. That is a better
  position than being first and a more durable one than being alone,
  and it points outreach at auditability and freshness rather than at
  existence. One of those sites advertises a 2023 build; this one can
  prove what it served this morning.
- 2026-08-23: the site began linking its own front door, and moved
  from a GitHub handle toward a named author. Six audits read this
  repository and none noticed that `REPO_URL` appeared exactly twice,
  both deep-linking `/blob/main/PROJECT.md`, so the repository root
  was reachable from nowhere and a reader on any of the 14,693
  facility pages had no path to the source at all. A project whose
  entire argument is auditability was, in the only place a reader
  looks, unlinked. Fixed with a footer line on every page and a "Who
  built this" section on About. The authorship half is a privacy
  decision and is recorded as one so it reads later as a judgement
  rather than an oversight: a site that asks readers to hold nursing
  home operators to their filed disclosures is in a weak position
  publishing anonymously, and accountable publishing is the thing
  this project is trying to model. So the byline is a real name. It
  is a name only -- no biography, no standing, no years of experience
  -- because the credential is what the checks prove, not who ran
  them, and because the smallest disclosure that carries
  accountability is the right one. `SITE_AUTHOR` ships empty and the
  byline renders only when it is set, so the name is data rather than
  markup, a fork inherits nothing by default, and the decision can be
  reversed by clearing one string.
- 2026-08-23: the pattern reached a stylesheet, and that is the
  seventh instance. `thead th { position: sticky; top: 0 }` had been
  in `app/globals.css` since the original design session and had
  never once stuck: `.tablewrap` sets `overflow-x: auto`, which makes
  it a scroll container on both axes, but nothing constrained its
  height, so the header was anchored to a box that could not scroll
  vertically. Measured at three widths before touching anything:
  `scrollHeight === clientHeight` every time. The six earlier
  instances were assertions, gates, class names, glyphs, commits, and
  edits -- all of them code that runs or text that ships. A CSS
  declaration is neither, which is why five reviews read past it, and
  it is the purest form of the shape yet: not a check that passed
  without checking, but a rule that never fired at all. Nothing
  observable changes when it is deleted, which is precisely the
  argument for deleting it.
  The fix is split by breakpoint rather than applied everywhere. Above
  640px the wrapper gets a `max-height` and the declaration moves
  there, so it finally does what it says. On phones it is deleted
  outright: a `max-height` there would make a 1,200-row table a nested
  scroll container, and a thumb swipe inside one scrolls the table
  instead of the page, trapping the reader in a box with no visible
  way out. A header that scrolls away is the better of those two.
  Verified as behaviour, not as CSS text -- at 1280px, scrolling 600px
  inside the wrapper leaves the header at the top of the box; at 320px
  and 390px the same scroll moves the page and the header leaves the
  viewport, which is the intended trade rather than a regression.
  Two things fell out of running that measurement, both recorded
  because neither was on the list. First, a real overflow bug the
  measurement caught on its first pass: state pages scrolled sideways
  50px at 320px. The cause was the `.sr-only` span added in the star
  fix. It is absolutely positioned, `.tablewrap` was not a positioned
  ancestor, so it resolved its containing block against the page,
  escaped the wrapper's clipping at its static position inside the
  scrolled-away part of a wide table, and dragged the document's
  horizontal scroll width past the viewport. An accessibility fix
  quietly created a layout defect two releases later, visible only
  below 390px and only on pages with a wide table. Fixed with
  `position: relative` on the wrapper. Second, the instrument lied
  once before it told the truth: the first sticky measurement reported
  the page had not scrolled, because `html { scroll-behavior: smooth }`
  animates an assignment to `scrollTop` and the read two frames later
  caught the start of the journey. A measurement harness is subject to
  principle 7 exactly as the site is.
  Also repaired here: a decision-log entry above had been mangled by an
  earlier scripted edit, leaving `- d principle 7 applies...` where
  continuation text belonged and swallowing the following entry's
  bullet, so the decoration audit had not rendered as its own entry
  since the day it was written. Found by reading the file, not by a
  check. The standing policy is that entries are appended and never
  rewritten; restoring text an edit corrupted is not a rewrite of the
  decision, and the corruption is recorded here so the repair is
  itself in the log.
- 2026-08-23: principle 7 turned on this file. The corrupted entry
  repaired above had been malformed since the day it was written and
  was found by a person reading, not by anything automated -- which is
  the whole finding. By this date the code carried five gates and this
  document carried none, and it is the artifact a stranger learns the
  most from and the one that coordinates work across sessions that
  cannot see each other. A log that can silently hold one fewer entry
  than it claims is worth less than one that cannot, because the only
  thing it sells is completeness. `scripts/check_project_doc.py`
  asserts three things, one per way that failure presents: every entry
  opens with a date, no continuation line has acquired a bullet and no
  dated entry has been swallowed mid-line, and the entry count matches
  the total this document declares. The third is the one that catches
  a loss rather than a malformation, and it is deliberately mildly
  annoying: appending an entry now means updating a number. That cost
  is the mechanism. Validated the way the others were, by breaking the
  thing it guards -- the checker was run against the corruption before
  the repair and named the line and the swallowed entry, and against a
  count off by one and said so. Two boundaries, written as limits
  rather than left to be read as coverage. It runs on pull requests
  only, not in the deploy workflow, so an edit that reaches main
  without a pull request is unchecked -- and the likeliest one is a
  correction typed straight into the GitHub web editor, which is a
  normal thing to do to a prose file. "Every edit so far came through
  a PR" describes a habit, not a constraint, and stating it as
  coverage is exactly how an assumed presence gets born. And it does
  not read: it cannot tell whether an entry is honest, only whether it
  is there. That is the same boundary every check here has, and it is
  worth stating because a green structural check on a dishonest log
  would be the purest instance yet of the pattern this file spent a
  day naming. Structure is checkable; truth is not, and this log's
  value rests on a discipline no script can enforce.
- 2026-08-23: the family-readiness hedge rewritten rather than kept or
  retired, because the sentence was right and its reason was wrong.
  About said families were welcome but that the ergonomics work "will
  serve them properly on any device is planned; until it ships, this
  site makes no claim to be the easiest way for a family to choose a
  facility." That made the hedge a promissory note with an expiry date,
  and the release it was waiting on shipped, which is why it read as an
  open question tonight and why tonight's phone pass pushed it further
  from true. Retiring it would have promoted the site to family-ready
  as a side effect of a CSS commit. Keeping it would have left a claim
  whose justification had lapsed. The better reason was never
  ergonomics. The first draft of the paragraph got the contrast wrong:
  it listed star ratings, inspection summaries and side-by-side
  comparison as the things Care Compare provides, in a structure
  implying this site provides none of them. Two of the three were
  already here. The facility page renders four ratings in its facts
  grid and health citations is the first record tab, so a reader who
  clicked one facility after reading that paragraph would have found
  the page underselling itself. Only side-by-side comparison is
  genuinely exclusive, and it is also the real differentiator, because
  comparison is what choosing requires and a record does not supply
  it. So the paragraph now names the overlap: this site publishes the
  same ratings and inspection records as CMS files them, and does not
  compare, rank or recommend. What separates the two is structural and
  survives any amount of polish, so the paragraph describes that
  instead of promising to fix it. The heading loses its "today" and the
  paragraph its "right now", since both carried the temporal claim and
  would have contradicted the text beneath them. "Professional tool" stays: the
  2026-08-05 entry records it as a calibration of audience claims, so
  it is logged language, and a first draft here replaced it with
  "working tool" before that was caught -- a recorded decision is
  exactly the kind of thing an edit pass overwrites without noticing.
  The one outward claim added, that Care Compare puts facilities side
  by side, is a fact about a public CMS product rather than a
  comparison drawn in this site's favour; nothing here says better,
  only different, and the difference is visible on the page. This is also the first entry to
  meet the speed bump installed hours earlier: the declared total went
  29 to 30 or the build fails, and the mechanism bit on its own next
  commit rather than some distant one.
- 2026-08-24: a house style rule written down, swept, and gated, and
  the reasoning for gating a matter of taste at all. No em dash
  (U+2014) in prose a stranger reads: site copy, this file, README.md,
  ADAPTATION.md. Not code comments, not commit messages, not
  identifiers, because extending a style rule into working surfaces is
  how a one-line rule becomes a chore. The rule is not necessary in any
  strict sense. Nothing breaks, no claim becomes false, and plenty of
  good writing uses the character. Necessity is the wrong test. The
  cost of leaving a preference unwritten is that it recurs in every
  copy pass forever and is invisible to every session that reads only
  this repository; the cost of writing it down is one line and one
  grep. That asymmetry settles it without the preference needing to be
  objectively defensible, and it is the same argument that put the
  pattern-verification rule into this file two days ago. Why this
  particular preference: heavy em dash use now reads as a tell for
  machine-written prose, and a site whose credibility rests on being
  accountably human-authored, with a name on the About page since the
  2026-08-23 entry above, is undercut by copy that pattern-matches to
  generated text. Nineteen instances swept, judged one at a time,
  because an aside wants commas, an abrupt turn wants a colon or a full
  stop, and an interruption usually wants to be two sentences; a
  blanket replace with commas would have produced worse prose than the
  dashes it removed. The carve-out is a rule and not a convenience:
  entries in this log keep theirs, because they are append-only and
  sweeping punctuation through the permanent record for aesthetics is
  the worse violation. New entries follow the rule with nothing
  checking them, which is stated rather than left to be discovered.
  scripts/check_prose_style.py was validated the way the others were,
  by breaking what it guards: a dash in site copy exits 1, a dash in
  README exits 1, a dash in a code comment does not fire, a dash inside
  the exempt log does not fire. The first pass of that validation
  reported exit 0 for the failing cases because the harness piped the
  script into head and read head's status, which is the measurement
  instrument lying for the third time in two days and the reason its
  numbers get checked before its verdict is believed. Two findings fell
  out of writing the rule. The rule as first drafted named the
  character by glyph and so failed its own check, fixed by naming it by
  codepoint. And the checker as first written scanned code comments,
  contradicting the scope in the same paragraph that defined it, fixed
  by skipping comment lines structurally. Also repaired here, and
  unrelated to style: README's fork instructions still said "all five"
  and omitted SITE_AUTHOR, which the 2026-08-23 entry added. A fork
  following README to the letter would have inherited a real person's
  name while believing it had cleared every touchpoint, which is
  precisely the hazard ADAPTATION touchpoint 10 exists to prevent. The
  gap was introduced by the commit that created the constant and was
  found by reading the file for a different reason entirely. This is
  where prose gating stops. A style gate invites more style gates, and
  this project knows what a review pipeline does with room to generate
  its own work.
- 2026-08-24: a duplicated fact deleted rather than gated. The
  README gap repaired hours earlier, where fork instructions said "all
  five" and omitted SITE_AUTHOR, existed because the list of identity
  touchpoints was stated in two documents. Two copies of one fact drift
  in one of them silently, and this drift had a safety consequence: a
  fork following README to the letter would have published a real
  person's name while believing it had cleared every touchpoint, which
  is exactly what ADAPTATION touchpoint 10 exists to prevent. The
  obvious response was a check asserting that README's count matches
  ADAPTATION's. The better response is to have no second copy. README
  now points at ADAPTATION.md as the only place the touchpoints are
  listed, and enumerates nothing. No number to drift, no check to
  maintain, and the next touchpoint added is covered everywhere the
  moment it is written down once. Two further counts fell to the same
  reasoning while the file was open: the heading "The ten touchpoints"
  became "The touchpoints", and touchpoint 10's "All four default to
  this deployment" became "All of them", because a count inside the
  single source is still a number that can go stale. There are now no
  counts of touchpoints anywhere in the tree. Worth being explicit that
  this is not the prose gating declared finished in the entry above:
  that rule concerned taste, this concerns a factual inconsistency with
  a safety consequence, and the fix removes the possibility rather than
  adding a gate, which is the stronger move whenever it is available.
  The uncomfortable part, recorded because it is the honest argument
  for the change: the original gap was found by accident, while
  counting em dashes in the same file for an unrelated reason. That is
  luck rather than process, and the next drift of this kind will not
  arrive with a convenient sweep attached, which is precisely why the
  answer had to be structural rather than vigilant.
- 2026-08-24: this log split out of PROJECT.md into its own file. The
  charter and the log have opposite lifecycles. One is meant to be read
  first and stay short; the other is meant to be appended to forever.
  Holding both in one file meant every decision recorded made the
  principles harder to find, which is backwards, and it worsens
  monotonically. Measured before acting rather than estimated: PROJECT.md
  was 990 lines, of which the charter was 261 and this log was 729, so
  the record was 2.8 times the document a contributor is told to read
  first. Nothing was rewritten in the move. The 32 entries were extracted
  by line boundary and byte-compared against the removed region, and the
  entry count was asserted equal on both sides, because a split is
  exactly where content goes missing quietly. The append-only rule is
  untouched: moving a file is not editing an entry.
  Seven references would have gone stale, found by grep rather than
  assumed. Two were reader-facing and are the reason this needed care:
  the About page and the Data page both linked PROJECT.md under the
  anchor text "public decision log" and "decision log", which after a
  split would name a thing the target no longer held. Both retarget
  here. The rest were the House style carve-out inside PROJECT.md, which
  said "the decision log below" and no longer had a below; the two
  checkers; README; and the CI step comment.
  One thing grep cannot do is see tomorrow, so the pointer itself is now
  checked. scripts/check_project_doc.py asserts that PROJECT.md names
  DECISIONS.md and that the named file exists and holds entries, which
  means a future rename fails loudly instead of leaving a charter
  pointing at nothing. That is the same defect README's touchpoint count
  had: a fact stated in one document about another with nothing keeping
  them agreed, and the same answer, which is to check the one copy
  rather than maintain two.
  The prose carve-out got simpler in the move. It was "everything after
  the '## Decision log' heading inside PROJECT.md"; it is now "this
  whole file", and it is enforced by the scanner rather than achieved by
  leaving the file off a list, so adding it to the scanned set by
  mistake still cannot scan it. PROJECT.md is now scanned in full, which
  was verified safe before the split rather than after: the charter
  portion already contained zero em dashes.
  Two dead things were introduced by this change and removed in the same
  commit. Retargeting the prose checker left its `skip_from` parameter
  with no caller, and the first version of the exemption was a label
  that enforced nothing. Both are the shape this repository spent the
  week retiring, produced by the commit that documents retiring it,
  which is worth recording plainly rather than quietly deleting.
  Also added, under Continuity in the charter rather than here, because
  a future session deciding how to start a second property will be
  reading that: if a second property is ever built on another dataset,
  copy and adapt rather than extract a shared library. What travels is
  the charter, the principles, the check philosophy, and ADAPTATION.md's
  shape. What does not travel is the code, which is exactly what the
  touchpoints enumerate. Two sites sharing a pipeline means one agency's
  schema change can turn the other's build red, for an abstraction with
  two consumers. What makes copy-and-adapt safe rather than sloppy is
  that the touchpoints are enumerated; without that document, copying a
  pipeline is how two divergent codebases arrive that nobody can reason
  about. The advice holds at two properties and stops holding at ten.
- 2026-08-25: two rules the profile-repository incident earned, both
  written into PROJECT.md rather than left in conversation. The
  incident: minutes after the split above was pushed to a branch, the
  profile repository's README was updated to link DECISIONS.md on
  main. That file was not on main yet. The profile page is live, so
  the link was a 404 from the moment it landed, and it was written by
  the same session that had just argued, in the split's own pull
  request, that a file and its links must enter main in one commit so
  that no tree exists where the anchor is live and the target is not.
  The reasoning failure is precise and worth naming: atomicity is a
  property of a commit, and a commit cannot span two repositories. The
  guarantee was applied correctly inside this repository and then
  assumed to cover a change in a different one, where it structurally
  cannot. A cross-repository link has no atomic option; the ordering is
  sequenced by hand or it is broken.
  The larger version, and the reason it is recorded under Continuity
  rather than only here: as of 2026-08-23 there is a second repository,
  and it inherits none of this project's apparatus. Every gate here is
  repository-scoped, so the protection covers exactly one tree. That is
  precisely why a broken link could reach a live page in the profile
  repository and could not reach one on the site. The entry above says
  the charter travels and the code does not; this refines it. The
  charter does not travel automatically either, and a second property
  starts with no principles, no checks, and no log until someone
  carries them across on purpose.
  The second rule is the mechanizable half. The first attempt to fix
  the broken link ran `git revert --no-edit <sha> -q`, where `-q` is
  not a revert flag. The revert failed and did nothing. The
  `git commit --amend` on the next line ran anyway, because nothing
  chained them, and produced a commit whose message announced a revert
  its tree did not contain. Only the push rejection stopped it. That is
  the same shape as a `.replace()` matching nothing while reporting
  success, and as a pipeline taking its exit status from `head`: a
  failure followed by a success that hides it. So the rule joins the
  other two in the reviewing section, and it is mechanizable rather
  than watchable: chain with `&&`, or `set -e`, because sequencing is a
  claim that each step happened and an unguarded newline makes that
  claim without checking it.
  Recorded at this length because the failure was committed by the
  session that had just written the rule against it, in the document
  arguing for the rule. A log that records only other people's errors
  is worth less than one that records its author's.
- 2026-08-26: a Methods page added at /methods/, teaching how to read
  the ownership disclosures. It exists because five reviewers, three of
  them AI, independently made the same four errors reading this data,
  so the traps it names are failure modes the record actually produces
  rather than hypotheticals. It teaches; it does not advocate, rank, or
  characterise anyone.
  Every figure on it is derived at build time from the batch being
  served. That was not a preference. The real data lives only in CI,
  this session could not reach data.cms.gov, and a figure typed in from
  a conversation is a figure nobody checked. Deriving it also makes the
  page incapable of going stale, which the same day demonstrated the
  need for: CMS rotated at 06:41 UTC, facilities moved by three, and
  one firm's footprint moved by one, inside a day.
  Two of the four traps needed no new derivation at all. owners-top.json
  already carried name, type, facility count and state count for the top
  150 footprints, so the accounting-firm and multiple-spelling examples
  read from an artifact that already existed. Only the capacity figure
  was new.
  That figure needed a rule for which roles are ownership, and the rule
  is the one place this page could have smuggled in an inference. CMS's
  own vocabulary supplies a mechanical one: the four ownership roles all
  contain the words "ownership interest", while MORTGAGE INTEREST,
  SECURITY INTEREST and the partnership interests do not. So the page
  says "no role whose published description contains the words ownership
  interest" rather than "holds no ownership interest". The first is a
  fact about the file; the second is a judgement about what the strings
  mean, and it would have quietly decided the genuinely arguable case of
  a partnership interest. Stating the rule on the page lets a reader
  disagree with it, which a summary figure would not.
  The page omits any figure it cannot stand behind. The capacity figure
  renders only when at least one individual clears the threshold and at
  least one holds an ownership role; on the synthetic fixture nobody
  does, so the omission path is the one CI exercises on every run and
  the populated path only appears on deploy. That asymmetry is worth
  knowing rather than discovering.
  One regression was introduced and measured rather than assumed. A
  fifth navigation link took the header from one line to three at 320px,
  undoing part of the phone pass. Shortening the label to Methods
  restored one line at 390px and above; at 320px it is two lines, with
  no horizontal overflow. Forcing one line would have meant shrinking
  text that the same pass enlarged for tap targets, so the property that
  pass stated is relaxed deliberately at the narrowest width rather than
  silently.
  That relaxation superseded a claim living in the tree, which is the
  part worth recording. app/globals.css carried the comment "Four links
  on one line at 320px", written by the phone pass and true when
  written. The fifth link falsified it, in a code comment, where no gate
  looks: the prose check scopes out comments by design and nothing
  checks whether a comment is still true. The comment now describes the
  current behaviour and deliberately does not restate the number of
  links, because a count in a comment is a count that goes stale, which
  is the same lesson as the touchpoint count in README. Found by going
  looking for it rather than by anything failing.
  The capacity threshold now reads NH_METHODS_FACILITY_MIN, exactly as
  the partition size reads NH_PARTITION_MIN_BYTES, and the fixture sets
  it to 2. Before that change the populated branch of the page had never
  executed anywhere: the fixture produced zeros, so CI rendered only the
  omission path and the first run of the populated path would have been
  in production. That is the situation the origin check and the render
  check were both built to eliminate, reproduced in a new page by
  reasoning about thresholds instead of reusing the pattern already in
  the repository. Driving it immediately paid: the populated path
  rendered "of the 1 individuals ... 1 hold", because plural agreement
  had been assumed rather than computed. A count of one is not
  hypothetical, and the sentence that teaches readers to be careful
  cannot itself be ungrammatical. Agreement is now computed.
  The origin gate behaved as designed: it derives page-type coverage
  from the export, noticed a page type it had never opened, and failed
  until the new page joined its visit list. Eight page types now, and
  KNOWN_QUERY_CALLERS stays at 7 because the page reads build-time JSON
  and runs no query.
  Final wording is the founder's, as About's was. This is a draft in his
  voice's direction, not in his voice.
- 2026-08-27: a Content-Security-Policy shipped as a meta tag on every
  page, and the reason it is worth less than it looks worth recorded
  beside it. The site's claim is that it makes no third-party requests.
  Until now that was verified only at build time, by a browser gate
  covering a sample of pages and a declared list of interactions. The
  policy asks every reader's own browser to enforce the same-origin
  rule on every page, including the ones the gate never opens.
  What it does not cover is the engine, and that inverts most of the
  value. A dedicated worker takes its policy from the response headers
  of its own script rather than from the document that created it;
  inheritance happens only for blob: and data: workers. GitHub Pages
  sends no headers this project controls, so the DuckDB worker cannot
  be given a policy at all, and every read_parquet and extension load
  is issued from inside it. The one incident this project has actually
  had, the Parquet extension fetching from extensions.duckdb.org in
  every reader's browser for three weeks, would not have been stopped
  by this policy. scripts/check_no_third_party.mjs therefore remains
  the only thing standing between a reader and an off-origin engine
  fetch. It is not a belt beside a brace and must not be treated as
  one.
  That was measured rather than cited, on two local origins: a page
  carrying connect-src 'self' had its own cross-origin fetch blocked,
  with the violation event to prove the policy was live, while a
  same-origin worker created by that same page fetched the second
  origin and got HTTP 200 with a body.
  'wasm-unsafe-eval' was measured unnecessary in Chromium and retained
  anyway, for browser coverage, and the order of those two facts is the
  substance. Against duckdb-wasm 1.32.0, engine v1.4.3, the main-thread
  bundle contains only WebAssembly.validate, four calls, the platform
  probes; every Module, instantiate and instantiateStreaming lives in
  the worker bundle, which the finding above puts outside the policy.
  Probed directly: under script-src 'self' 'unsafe-inline', validate
  returns true with no violation while new WebAssembly.Module and
  WebAssembly.instantiate both throw CompileError and raise
  script-src / wasm-eval. So the green run is explained by the main
  thread never compiling, not by lax enforcement. What stopped the drop
  is that both facts making it safe, validate being ungated and the
  worker sitting outside the document policy, are measurements of one
  browser, taken in an environment holding only that browser, and the
  failure mode in a browser where either fails is the worst available:
  the entire interactive layer dead for that reader, no violation
  visible to anyone, on the phone-heavy audience this site serves. The
  directive permits no host, so retaining it costs the origin property
  nothing. Recorded at this length so the retention is not read later
  as an untested default: it was tested, the test says Chromium does
  not need it, and it stays because Chromium is not every browser.
  'unsafe-inline' on script-src is required, because a Next.js static
  export puts the RSC payload in inline scripts on every page. It
  permits inline code and never another host, so the origin property is
  unaffected, but it means this is an origin policy and not an XSS
  defence, and it is described that way in scripts/csp.mjs rather than
  allowed to imply more. The site has no injection surface to defend:
  no dangerouslySetInnerHTML anywhere, no eval, no cookies, no server,
  no user input reaching markup. Per-page script hashes were considered
  and declined on that basis.
  The tag is injected after the build rather than rendered by the root
  layout, and the ordering is the whole reason. Next hoists its own
  stylesheet link and entry script tags above anything a layout renders,
  and a meta policy governs only what the parser meets after it, so a
  rendered tag would have arrived after those fetches: a policy reading
  as though it covered the page while not covering the first several
  requests on it. That is the dead position: sticky wearing a security
  label. scripts/apply_csp.mjs writes it as the first child of <head>,
  wired as npm's postbuild hook so it runs wherever the build runs.
  frame-ancestors, report-uri and sandbox are absent on purpose: a
  browser ignores them in a meta tag, and a directive that cannot fire
  reads to the next person as protection that exists. Report-only mode
  was declined for the same shape of reason, since with no server and
  no third-party collector this site would accept, there is nowhere for
  a report to go. object-src and form-action stay although the export
  has neither element, because those constrain what may be added later,
  which is a different thing from a directive the parser discards.
  Three assertions in the origin gate earn the claim, each broken on
  purpose before being trusted. Every exported page must carry exactly
  the policy in scripts/csp.mjs as the first child of <head>, proven by
  stripping the tag from one page and altering the policy on another.
  No page the browser drives may raise a violation, proven by removing
  'unsafe-inline' from style-src and watching 22 violations appear,
  including style-src-attr on facility pages, which incidentally shows
  that allowance is load-bearing rather than decorative. And the CSV
  export must still start a download, which is a coverage gap that
  existed before this policy and would have outlived it: lib/csv.ts
  builds a blob: URL and clicks a synthetic anchor, a path nothing else
  here drives. It is asserted on a state page, whose rows come from
  build-time JSON, so it tests the download mechanism and not the
  engine.
- 2026-08-27: a cleanup pass before an outside review, five small
  things in one change because each is an instance of a rule this
  repository already holds, and one new rule written into the charter.
  The rule: a comment describes intent or a constraint, never measured
  state. Comments are the only text in the tree no gate scans, the
  prose check scopes them out by design, and nothing can test an
  English claim about code, so a measured value in a comment goes
  stale with nothing to say so. Earned by the stylesheet comment that
  said "four links on one line at 320px" until a fifth link falsified
  it, found by going looking rather than by anything failing. Not
  mechanizable, which is why it is a rule in the reviewing section
  rather than a check.
  Applied in the same change to the one other instance a full read of
  the tree found: the owner explorer's row limit was annotated with
  the largest footprint in a named month's batch, a figure about a
  batch that is no longer the batch. The comment now states the
  constraint and lets the rendered truncation notice carry the truth.
  Also fixed, and the same class as README's touchpoint count: the
  charter said "Two corollaries earned the same week" above a list
  that had grown to four, about to be five. It now carries no count
  and no timeframe. A count in a heading inside the document that
  teaches this lesson is the strongest argument yet for the structural
  fix over the vigilant one.
  The footer stopped answering only the wrong question. It said when
  this mirror last processed the batch, which advances on every code
  merge whether or not CMS published anything, so sixteen rebuilds of
  one unchanged file each moved a date that reads as freshness. It now
  also shows CMS's own dates, as a range rather than the newest alone,
  because the batch legitimately spans months: two of its datasets are
  annual, so the current spread runs 2025-11-01 to 2026-08-01, and
  naming only the newest would dress the whole batch in its freshest
  file, the same misdirection with a different date. The fixture now
  stamps one dataset with an older date so the range branch renders in
  CI rather than for the first time in production, which is the
  NH_METHODS_FACILITY_MIN lesson applied before it cost anything.
  The Data page's ledger paragraph gained its temporal half: each
  entry records what CMS was serving at the moment of that build's
  fetch, so several entries with one checksum are one batch served
  many times, and an entry's date is when this site last asked, not
  when CMS last changed. That sentence is the lesson of 2026-08-26,
  when the ledger's sixteen sightings of one file were misread as
  evidence CMS had not rotated, an hour after CMS rotated.
  And one spelling: the Methods page said "organisation", the only
  British spelling in any reader-facing prose, on a US site about US
  federal data. Swept the whole tree for the class; the one other hit
  is in a code comment, left alone by the same scope rule that keeps
  the em dash check out of comments.
- 2026-08-27: CSV formula escaping declined, on evidence, as a
  per-batch condition rather than a permanent verdict. The finding:
  toCsv() quotes only commas, quotes and newlines, so a published
  value beginning with the equals sign, plus, minus, or at sign would
  open as a live formula in spreadsheet software. Measured against the
  current batch: zero of the 62,262 published owner names begin with
  any of those characters, so the condition does not exist in the data
  being served. The two standing reasons not to escape hold either
  way: prefixing or quoting such a value would modify a published
  value on a site whose footer promises figures are shown exactly as
  published, and the untouched CMS originals are republished one page
  away, so a reader opening those carries identical exposure and this
  site would be mangling data to guard a door standing open beside it.
  The condition is measured per batch, not settled forever: if a
  future batch ever publishes a name beginning with one of those
  characters, this decision is to be revisited rather than inherited,
  and this entry is the place a future reviewer finds that condition
  stated.
- 2026-08-27: search index weight recorded as a measured non-issue,
  with the figures and a tripwire. The home page fetches two indexes
  lazily, the facility index on load and the owner index only after a
  search reaches three characters. Measured from outside on this date:
  owners-slim.json is 2.36 MB raw and 447 KB on the wire, because
  GitHub Pages compresses it, and the facility index is 326 KB, so a
  phone that searches pays roughly 770 KB once. That is an ordinary
  page weight, not a problem worth engineering around, and the lazy
  fetch already means readers who never search never pay it. Both
  figures scale with the batch, which is the tripwire: if a future
  batch pushes the compressed owner index materially past this figure,
  the decision is to be revisited with the then-current numbers rather
  than cited from this entry.
- 2026-08-27: the two search boxes made to answer one query the same
  way, and the Ownership page was the one that was wrong. The home
  page's search matches when every word of the query appears somewhere
  in the name, so JOHN MITCHELL finds MITCHELL, JOHN; the Ownership
  page's SQL matched the query as one substring, so the same query
  there returned nothing. CMS publishes people as LAST, FIRST and
  readers type FIRST LAST, which is the entire reason token matching
  exists on the home page, and a site whose credibility rests on
  consistency cannot have its dedicated search page be the worse of
  its two search boxes. The fix stays inside principle 2: the query is
  AND of one substring test per word, tokens split the query and never
  the published name, no fuzzy logic, no identity claim. The hint text
  now states the rule so a reader can predict the results. Proven red
  first at the semantic level, engine-independent: against the fixture
  ownership file, the old SQL for the reversed query returns zero rows
  and the new SQL returns the LAST, FIRST name. The origin gate now
  drives a reversed-order query on every run, because the hint's
  promise that word order does not matter is a claim about a query
  nothing else runs, and principle 7 does not exempt search hints.
- 2026-08-27: the footer's vintage line reordered after outside
  verification of the first deploy carrying it, because both first
  sight reactions agreed. The line led with the oldest date, "dated
  2025-11-01 to 2026-08-01", and on a facility page the reader's
  actual question is whether the numbers in front of them are the old
  part. They are not: the hub dataset carries the newest date, and the
  old end of the range belongs to annual files. A sentence led by its
  oldest date reads as though the whole batch is that old, which is
  the freshness misdirection this line was added to end, pointed the
  other way. It now leads with the newest date, discloses the old end,
  and points at the Data page, where every dataset's own date already
  lives: "dated through 2026-08-01, with older files back to
  2025-11-01; each dataset's own date is on the Data page." One
  deliberate deviation from the wording as proposed: "two annual
  datasets" named a count and a cadence, and neither is computable
  from the data map, which carries dates and not why they differ. A
  typed count in sitewide copy is the touchpoint-count defect with a
  monthly chance to go stale, so the sentence says "older files" and
  lets the Data page say which. Both ends of the range and the newest
  date remain computed from the batch, never typed.
- 2026-08-27: two process rules sharpened by a failure that got past
  the existing one, recorded because the failure was the author's, in
  the session running the review. While restacking a branch, a
  `git cherry-pick <sha> -q` failed with a usage error, because
  cherry-pick takes no `-q`, and the force-push two lines later ran
  anyway and briefly overwrote the remote branch with a copy of main.
  `set -e` was set at the top of that script and did not stop the
  sequence in this harness's shell. Recovered from the reflog, and the
  recovered branch verified by diff and by every check before being
  pushed again. The charter's rule had offered chaining with `&&` or
  `set -e` as equivalents; the evidence says they are not equivalent
  everywhere, so the rule now names `&&` as the half that holds and
  `set -e` as a supplement. And this is the second time a `-q` from
  memory was passed to a git subcommand that does not take it, the
  first being the 2026-08-24 revert, so the flag half is now its own
  rule: a flag recalled from memory is a guess wearing certainty, and
  the pair of a wrong flag and an unguarded sequence is what turns a
  typo into a wrong push.
  The same session produced the same shape in a watcher. A monitor
  polled an unauthenticated API through a proxy, the responses started
  coming back empty, and the loop read empty as not-finished-yet, so
  it waited forever on a question nobody was answering while the thing
  it watched completed. Absence wearing the shape of a presence, in
  the instrument rather than the site. The general form, which joins
  the measurement-harness lessons already in this log: a monitor must
  distinguish no-result-yet from no-answer-available, or its silence
  is indistinguishable from progress. The authenticated lens answered
  in one call what the watcher had failed to see for fifteen minutes.
