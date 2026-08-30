#!/usr/bin/env python3
"""
Assert no em dash appears in prose a stranger reads.

The rule and its reasoning live in PROJECT.md, under "House style" in
the reviewing section. In short: heavy em dash use now reads as a tell
for machine-written prose, this site's credibility rests on being
accountably human-authored with a name on the About page, and the cost
of leaving the preference unwritten is that it recurs in every copy pass
forever, invisible to any session that reads only the repository.

This is the rare style rule worth a check, because an em dash is hard to
catch by reading and trivial to catch by grep. It is also where prose
gating stops.

Scope is what a stranger reads: site copy under app/, components/,
and lib/, plus PROJECT.md, README.md, and ADAPTATION.md. Code comments, commit
messages, and identifiers are working surfaces and are out of scope,
because extending a style rule into them is how a one-line rule becomes
a chore.

Honouring that exclusion inside a .tsx file means skipping comment
lines, which this does structurally rather than by parsing: whole-line
`//`, block `/* */`, and JSX `{/* */}`. A dash in a trailing comment on
a line that also carries code will be flagged. That residue is left
rather than chased, because the alternative is parsing JSX to tell a
string from a comment, and the cost of a false positive is one comma.

One carve-out, and it is a rule rather than a convenience. DECISIONS.md
is append-only. Sweeping punctuation through past entries would be
editing the permanent record for aesthetics, which is a worse violation
than the dashes, so entries keep theirs as artifacts of when they were
written. That does mean a new entry can carry one and this check will
not say so. Stated here rather than discovered later. Before
2026-08-24 the log lived inside PROJECT.md and the exemption was a
section of that file; now it is a whole file, which is the same rule
with one fewer way to get it wrong.

    python3 scripts/check_prose_style.py
"""

from __future__ import annotations

import sys
from pathlib import Path

ROOT = Path(__file__).resolve().parent.parent
EM_DASH = "—"

DOCS = ["PROJECT.md", "README.md", "ADAPTATION.md"]
# Exempt in full. The log moved out of PROJECT.md on 2026-08-24, so the
# carve-out is now a whole file rather than a section of one, which is
# simpler to state and impossible to get subtly wrong.
EXEMPT = ["DECISIONS.md"]
CODE_DIRS = ["app", "components", "lib"]
CODE_SUFFIXES = {".tsx", ".ts"}


problems: list[str] = []
scanned = 0


def scan(path: Path, skip_comments: bool = False) -> None:
    global scanned
    rel = path.relative_to(ROOT)
    if rel.name in EXEMPT:
        # Enforced rather than achieved by leaving it off a list, so
        # that adding it to DOCS by mistake still cannot scan it.
        return
    lines = path.read_text(encoding="utf-8").splitlines()
    scanned += 1
    in_block = False
    for n, line in enumerate(lines, start=1):
        if skip_comments:
            s = line.strip()
            if in_block:
                if "*/" in s:
                    in_block = False
                continue
            if s.startswith("{/*") or s.startswith("/*"):
                if "*/" not in s:
                    in_block = True
                continue
            if s.startswith("//") or s.startswith("*"):
                continue
        if EM_DASH in line:
            problems.append(f"{rel}:{n}: {line.strip()[:88]}")


for name in DOCS:
    p = ROOT / name
    if p.exists():
        scan(p)

for d in CODE_DIRS:
    base = ROOT / d
    if not base.exists():
        continue
    for p in sorted(base.rglob("*")):
        if p.is_file() and p.suffix in CODE_SUFFIXES:
            scan(p, skip_comments=True)

if problems:
    print(f"FAIL  {len(problems)} em dash(es) in prose a stranger reads:\n")
    for p in problems:
        print(f"  - {p}")
    print(
        f"\nThe rule and its reasoning are in PROJECT.md, under "
        f'"House style" in the reviewing section. When replacing one, look '
        f"at the job it was doing: a parenthetical aside wants commas, an "
        f"abrupt turn wants a colon or a full stop, and an interruption "
        f"usually wants to be two sentences. A blanket replace with commas "
        f"produces worse prose than the dashes it removes."
    )
    sys.exit(1)

print(f"  ok    no em dash in {scanned} file(s) of reader-facing prose")
print(f"  --    {', '.join(EXEMPT)} is append-only and was not scanned")
print("\nthe prose reads as written by a person")
