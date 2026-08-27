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

The disclosure file names natural persons, owners and officers and
managing employees, and this site makes those names searchable
nationwide, which CMS's own site does not. That is deliberate. The
disclosure exists so the public can see who stands behind a facility,
and a public record that cannot be found is not meaningfully public. The
safeguards are the principles above, applied without exception: exact
strings with no merging or identity claims (2), every name shown with
its role (3), the identical layout and neutral sort for every name
with no one singled out (4), and the declined scope: no money flows,
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

Every page carries a Content-Security-Policy meta tag confining the
document to this origin. It covers the document only. A worker takes
its policy from its own response headers, and GitHub Pages sends none
we control, so the DuckDB engine is outside it and the browser enforces
nothing about what the engine fetches. That is why the origin gate in
`scripts/check_no_third_party.mjs` is load-bearing rather than a second
belt, and why it is not to be relaxed on the strength of the policy.

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

If a second property is ever built on another dataset, copy and adapt
rather than extract a shared library. What travels is the charter, the
seven principles, the check philosophy, and ADAPTATION.md's shape. What
does not travel is the code, which is exactly what the touchpoints
enumerate. Two sites sharing a pipeline means one agency's schema
change can turn the other's build red, and an abstraction maintained
for two consumers is a cost with no payer. The thing to keep identical
is the discipline, not the source.

What makes that safe rather than sloppy is that the touchpoints are
enumerated. Without ADAPTATION.md, copying a pipeline is how two
divergent codebases arrive that nobody can reason about; with it, every
divergence is documented and deliberate. That is also where the advice
stops: it holds at two properties and it does not hold at ten.

And the charter does not travel automatically either. A second
repository starts with no principles, no checks, and no log unless
someone carries them across deliberately. This was learned the cheap
way on 2026-08-24: a second repository had existed for one day, holding
nothing but a profile README, and a broken link reached a live page
there within minutes of being written. The same link could not have
reached the site, because the site has gates and that repository has
none. Every check in this project is repository-scoped, so the
apparatus protects exactly one tree and no other. Copying the discipline
means copying the files that enforce it, not only the ones that
describe it.

## Future phases, in order of value, none started

1. CMS chain performance layer: display CMS's own per-chain averages,
   cross-linked with the name pages. Stays inside principle 1 because
   CMS computes the numbers.
2. CSV export of any on-screen view, for citability.
3. Batch retention for then-versus-now display of successive
   published vintages.

Each waits until the current site proves insufficient, and each ships
only if it survives the principles above.

## Reviewing this project

Read the code, then run it. Not either one.

This is here because of what it cost to learn. Four independent reviews
read this codebase carefully and were right about everything that exists
at rest: the transform, the fidelity rules, the principles, the copy.
The fifth built the site and drove it in a browser, and found within
minutes that every facility page had been fetching a file from
extensions.duckdb.org since the day the site went live, while the Data
page told readers no such request was ever made. The URL was assembled
inside a WebAssembly binary at run time. It existed in no file. No
amount of careful reading could have found it, and the check meant to
prevent it was a grep, which is careful reading performed by a machine.

The general form: static inspection proves what is in the files and
nothing whatever about what the files go and do. Any claim this site
makes about its own behaviour -- what it requests, what it renders, what
it does when something fails -- is a claim about run time, and can only
be honestly checked by running it. `npm run check:origins` is that check
for the third-party claim. A claim of the same kind that ships without
one is a claim nobody has verified.

A run-time check is only as strong as its sample, and its sample is not
just which pages it opens but which interactions it performs. Three of
this site's query paths are reachable only by acting: the full record
fires on a `<details>` toggle, the owner search on Enter, a record tab
on a click. A check that loaded pages and waited would exercise none of
them and go green having proved nothing about them. So the origin gate
drives each one, and its header lists exactly which pages and which
interactions a green result covers. When a page type or an interaction
is added, it goes in that list, or the gate quietly stops covering the
thing everyone assumes it covers.

That last sentence is a rule, and a rule that depends on someone reading
this file is not self-maintaining, so the gate asserts its own coverage
instead. Page types it derives from the export and compares against what
the browser actually opened, which cannot drift: a page type added later
appears in the export, nothing visits it, and the run fails naming it.
Query call sites it cannot derive -- nothing can infer which of them a
browser run reached -- so those are declared, and declaring them is the
point: adding a query anywhere changes the count and fails the check,
forcing whoever added it to drive it here rather than reason that the
shared helper makes it safe. That reasoning is precisely what missed the
extension fetch and the star glyphs.

The honest limit of the declared half: nothing stops someone satisfying
the count by raising the number instead of driving the interaction. It
is a tripwire, not a proof, and the two are worth distinguishing because
a tripwire mistaken for a proof is this whole file's recurring failure
in yet another costume. What makes a tripwire worth having anyway is
where it fires and what it says when it does: at the moment of the
change, to the person making it, naming the specific reasoning it exists
to interrupt. Someone who reads that message and bumps the number has
made a decision rather than an oversight, and a decision is the thing
this log can hold.

Corollaries, each earned by an incident:

- A safety property that holds because of something outside this
  repository is not a safety property this repository has. The deploy
  loop was prevented, correctly, by a GitHub behaviour written down
  nowhere in this tree. Declare it or check it, and preferably both.
- The check has to be able to fail. Every gate here was validated by
  breaking the thing it guards and confirming it goes red and says
  which thing. A gate never seen to fail is a gate nobody has tested.
- Verify that an edit applied by pattern actually changed the file. A
  pattern that matches nothing returns the text unchanged and reports
  success, so the change is announced, committed, and absent. This is
  not a personal habit: this file is a coordination layer across AI
  working sessions, and such a session edits by scripted replace
  essentially always, which makes the failure structural to this
  project's expected contributor rather than incidental to one of
  them. Assert both that the pattern was found and that the bytes
  differ; either alone leaves a hole. The 2026-08-22 entry records
  what it cost, including the two edits documenting the rule that
  would themselves have vanished silently.
- Chain shell steps with `&&`. `set -e` is a supplement, not a
  substitute: on 2026-08-27 a working harness ran a failed
  `git cherry-pick` straight into a force-push with `set -e` set at
  the top of the script, so the only guard that holds everywhere is
  the one written into the line itself. A failed command followed by
  an unconditional one produces a success that papers over it, and
  the papering is invisible in the transcript because only the last
  status survives. On 2026-08-24 a `git revert` rejected a bad flag
  and did nothing, and the `git commit --amend` on the next line ran
  anyway, producing a commit whose message announced a revert its tree
  did not contain. Only the push rejection stopped it reaching a
  branch. This is the same shape as the rules above and as a
  pipeline whose exit status comes from `head` rather than from the
  script: a failure followed by a success that hides it. Sequencing is
  a claim that each step happened, and an unguarded `;` or newline
  makes that claim without checking it.
- A flag recalled from memory is a guess wearing certainty. Twice, on
  2026-08-24 and 2026-08-27, a `-q` passed to a git subcommand that
  does not take it turned the command into a usage error that the next
  line papered over. The failure needs both halves: the wrong flag
  makes the command fail, and the unguarded sequence hides that it
  did, so this rule and the one above retire the pair together. Before
  passing a flag to a subcommand you have not used it with, check the
  help text or omit it; every git porcelain command runs fine verbose.
- A comment describes intent or a constraint, never measured state.
  Comments are the only text in the tree no gate scans: the prose
  check scopes them out by design, and nothing can test an English
  claim about code. A measured value written into one goes stale with
  nothing to say so, which is how "four links on one line at 320px"
  sat false in the stylesheet after a fifth link shipped. State the
  reason a rule exists and let the code and the checks carry the
  numbers; a figure that matters belongs in a dated log entry, where
  staleness is the format.

### House style: no em dash in prose a stranger reads

No em dash (U+2014) in site copy or in this file, README.md, or
ADAPTATION.md. En dash (U+2013) is fine for ranges, and hyphens are
ordinary punctuation; the rule names one character, by codepoint rather
than by glyph so that stating it does not violate it. Code comments, commit
messages, and identifiers are working surfaces and are out of scope,
because extending a style rule into them is how a one-line rule becomes
a chore.

Nothing breaks if this is ignored. No claim becomes false and plenty of
good writing uses the character. It is written down anyway because of an
asymmetry: unwritten, the preference recurs in every copy pass forever
and is invisible to every session that reads only the repository, while
written, it costs one line and one grep. That asymmetry is the same
argument that put the pattern-verification rule above into this file,
and it settles the question without needing the preference to be
objectively defensible.

The reason it is a preference worth having: heavy em dash use now reads
as a tell for machine-written prose, and this site's credibility rests
on being accountably human-authored, with a name on the About page.
Copy that pattern-matches to generated text works against the thing the
site is for.

When replacing one, look at the job it was doing. A parenthetical aside
wants commas, an abrupt turn wants a colon or a full stop, and an
interruption usually wants to be two sentences. A blanket replace with
commas produces worse prose than the dashes it removes.

`scripts/check_prose_style.py` enforces this, and one carve-out belongs
in the rule rather than only in the script: **`DECISIONS.md` is exempt
in full.** Its entries are append-only, so sweeping punctuation through
them would be editing the permanent record for aesthetics, which is the
worse violation. Existing entries keep their dashes as artifacts of when
they were written. New entries should follow the rule even though
nothing checks them.

This is where prose gating stops. A style gate invites more style gates,
and this project already knows what a review pipeline does with room to
generate its own work.

## Decision log

The log lives in [DECISIONS.md](DECISIONS.md), split out of this file on
2026-08-24. It records every decision this project made and every one it
reversed, dated and at full length, and it is append-only.

It is a separate file because the two documents have opposite
lifecycles. This one is meant to be read first and stay short. That one
is meant to grow forever. Held together, every decision recorded made
the principles harder to find, which is backwards.
