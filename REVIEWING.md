# Reviewing this project

The engineering-practice manual, split out of PROJECT.md on
2026-08-31 by the same argument that split the decision log: opposite
lifecycles. The charter is meant to be read first and stay short;
this file grows every time something goes wrong. Read PROJECT.md for
what the site is and where the lines are. Read this before changing
anything, because every rule in it was earned by a dated incident.

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
a tripwire mistaken for a proof is this project's recurring failure
in yet another costume. What makes a tripwire worth having anyway is
where it fires and what it says when it does: at the moment of the
change, to the person making it, naming the specific reasoning it exists
to interrupt. Someone who reads that message and bumps the number has
made a decision rather than an oversight, and a decision is the thing
the decision log can hold.

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
  not a personal habit: this project's documents are a coordination
  layer across AI working sessions, and such a session edits by
  scripted replace essentially always, which makes the failure
  structural to this project's expected contributor rather than
  incidental to one of them. Assert both that the pattern was found
  and that the bytes differ; either alone leaves a hole. The
  2026-08-22 entry records what it cost, including the two edits
  documenting the rule that would themselves have vanished silently.
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

## House style: no em dash in prose a stranger reads

No em dash (U+2014) in site copy or in PROJECT.md, REVIEWING.md,
README.md, or ADAPTATION.md. En dash (U+2013) is fine for ranges, and
hyphens are ordinary punctuation; the rule names one character, by
codepoint rather than by glyph so that stating it does not violate it,
and it names this file explicitly rather than as "this file", because
prose moves between files and a referent that moves with it is how a
rule quietly stops covering the document it lives in. Code comments,
commit messages, and identifiers are working surfaces and are out of
scope, because extending a style rule into them is how a one-line rule
becomes a chore.

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
