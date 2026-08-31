# PROJECT.md

The shared understanding behind this site. Read this before changing
anything. Code shows how; this file shows why and where the lines are.

## Purpose

Make the ownership structure of America's certified nursing homes
readable in seconds. Most people assume these are government
institutions. The data says otherwise: roughly three in four are
operated for profit and fewer than one in fifteen by any government,
a split the home page re-counts from every published batch, so the
measured numbers live there and this sentence only has to survive as
a shape. Around 1.25 million people lived in them on an average day
as of the 2026 batches; nothing re-measures that figure, so it
carries its date. Every facility in the file holds Medicare or
Medicaid certification, which is the only reason it appears in CMS
data at all. The site shows who stands behind each building, in what
role, since when, plainly and without commentary.

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
page with checksums and downloads. Deployed to GitHub Pages, roughly
twenty thousand pages per batch; README's measured sections carry
the dated figures, because a number in this file is a number nothing
re-measures. No servers, no database, no secrets.

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

## Future phases, in order of value

CSV export of any on-screen view, once second on this list, shipped
on 2026-08-06 as the ergonomics release's CSV button on state tables,
facility record tabs, and the owner search. Two remain, neither
started, cited by name rather than by number because this list has
now been renumbered once:

1. CMS chain performance layer: display CMS's own per-chain averages,
   cross-linked with the name pages. Stays inside principle 1 because
   CMS computes the numbers.
2. Batch retention for then-versus-now display of successive
   published vintages.

Each waits until the current site proves insufficient, and each ships
only if it survives the principles above.

## Reviewing this project

The manual lives in [REVIEWING.md](REVIEWING.md), split out of this
file on 2026-08-31 by the same argument that split the decision log:
opposite lifecycles. This file is meant to be read first and stay
short; that one grows every time something goes wrong.

It is required reading before changing anything, not background. It
holds the argument for running the site rather than only reading it,
and the working rules earned by incident: chain shell steps with
`&&`, verify that a pattern edit actually changed the bytes, keep
measured state out of comments, and the house prose style with its
DECISIONS.md carve-out.

## Decision log

The log lives in [DECISIONS.md](DECISIONS.md), split out of this file on
2026-08-24. It records every decision this project made and every one it
reversed, dated and at full length, and it is append-only.

It is a separate file because the two documents have opposite
lifecycles. This one is meant to be read first and stay short. That one
is meant to grow forever. Held together, every decision recorded made
the principles harder to find, which is backwards.
