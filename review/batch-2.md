# Review batch 2: gates and CI

Read whole on 2026-08-30 against the Pass 0 yardstick, with the
brief's assigned lens: which assertions are vacuous, and which would
still pass if the thing they guard were removed. Files:
check_no_third_party.mjs (796), check_rendered_values.mjs (570),
check_project_doc.py (156), check_prose_style.py (119),
check_loop_guard.py (85), vendor-assets.mjs (113), apply_csp.mjs
(94), csp.mjs (78), ci.yml (98), build-deploy.yml (187). Notes only;
nothing was changed.

## Findings

- scripts/check_rendered_values.mjs:400-406. The one true vacuity
  instance the lens turned up: the hostile-name escape assertion is
  `hostileSeen || facilities.length >= 200`, and the real batch's
  sample is exactly 200 by the slice cap, so on every deploy run the
  line "a name containing a closing script tag survived
  serialization intact" prints ok with the escape unexercised in
  that run. The design intent is legitimate (the assertion is
  fixture-keyed and CI drives it for real), but a skipped check
  should print as a stated skip, the way the _OTHER-shard branch
  does, not as a green claim. This is also an instance of the
  four-reviewer structural shape: a sentence true where written
  ("the fixture plants one") and false at the real-batch boundary.
  costs-clarity HOW.
- scripts/check_rendered_values.mjs:96 and :301. Both samples are
  first-N by directory order: 200 facilities means the lowest CCNs,
  and CCNs are state-prefixed, so the head, JSON-LD, and
  always-shown checks sample essentially one state's pages; the 50
  owner slugs are the alphabet's front. A rendering defect
  correlated with later states or letters passes. The assertions
  are not vacuous, but the sample's shape is undisclosed and
  systematically biased where a spread (every Nth entry) costs one
  line. costs-clarity HOW.
- scripts/vendor-assets.mjs:96-107. The Parquet extension is
  fetched from extensions.duckdb.org with no integrity pin: the
  engine is version-locked by package-lock.json, but the extension
  binary is whatever the CDN serves that day, vendored and then
  shipped to every reader. The origin gate would catch a binary
  that breaks; it cannot catch one that works and does something
  else. The one third-party executable in the reader's path is the
  one artifact nothing pins. Whether to record a sha256 per engine
  version and update it deliberately is a posture ruling, not a
  mechanical fix. breaks-correctness (latent, supply chain) WHAT.
- .github/workflows/build-deploy.yml (whole-file observation with
  ci.yml). The deploy path runs a strict subset of the gates
  (rendered, origins), and the subset's omissions are stated
  honestly for check:doc in that script's own docstring but nowhere
  for the rest. The sharpest instance: the loop guard asserts
  build-deploy.yml's own shape, runs only on pull requests, and a
  direct push to main that edits this workflow deploys without the
  guard ever running, anywhere. The property most worth holding on
  the deploy path is the one property never checked on it, and the
  cost of running check:loop there is under a second.
  costs-clarity HOW.
- scripts/check_no_third_party.mjs:679-716. KNOWN_QUERY_CALLERS is
  a per-file count, so the tripwire PROJECT.md documents has one
  unstated hole beyond the one it states: a call site removed and
  another added in the same file leaves the count unchanged and the
  new path undriven, invisibly. The stated limit covers bumping the
  number; it does not cover this. One sentence in the comment, or
  counts keyed by call expression, closes the gap between what the
  tripwire claims and what it trips on. costs-clarity HOW.
- scripts/check_prose_style.py:16. The docstring scopes the scan to
  "site copy under app/ and components/" while CODE_DIRS includes
  lib/ (added later, per the log). Stale in the safe direction;
  same measured-state-in-a-comment corollary as batch 1's two
  docstring findings. cosmetic HOW.
- Scope of the prose rule itself (carried from batch 1, and this is
  the gate batch where it lands): state/README.md carries em dashes
  and is prose a forker reads; data/README.md is the same kind of
  file; PROJECT.md's rule names only site copy plus three docs, and
  the gate enforces exactly the rule. Either the named scope is the
  ruling and the dashes stand, or "prose a stranger reads" is the
  ruling and the scan set is short two files. The rule and its own
  description disagree at the margin, which only the founder can
  settle. costs-clarity WHAT.
- scripts/check_no_third_party.mjs:775. The off-origin check's
  label reads "zero off-origin requests" even when printed on the
  FAIL path. cosmetic HOW.

## Nothing found here

apply_csp.mjs (byte-change verification, readback after write, and
a refusal on conflicting policies: the pattern-edit corollary
applied in full), csp.mjs (the policy's limits documented above the
policy, directives absent because meta ignores them rather than
present as decoration), check_loop_guard.py (a tripwire that says
it is one), check_project_doc.py (its own coverage boundary stated
more honestly than any other gate's). Four of ten files
finding-free, which the vacuity lens makes worth saying: these
gates would fail if the things they guard were removed.

## For synthesis

The batch's one real vacuity instance (the hostile-name green) and
the prose-gate scope disagreement both join the four-named
structural shape: claims true where written, unenforced or untrue
at a boundary. The extension-pinning WHAT is this batch's only
finding that could matter to a reader rather than to a maintainer.
