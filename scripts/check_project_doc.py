#!/usr/bin/env python3
"""
Assert the decision log in PROJECT.md is structurally intact.

Principle 7 says a claim ships with the check that earns it. PROJECT.md
makes the largest claim in the repository -- that every decision and
every reversal is recorded at full length, appended and never rewritten
-- and until now it was the one artifact with no check at all. The code
accumulated gates while the document a stranger learns the most from had
none.

The failure this exists for, found on 2026-08-23 by a human reading the
file rather than by anything automated: a scripted edit had turned a
continuation line into a list marker,

    A variable name is a claim about behaviour,
    - d principle 7 applies to it exactly as it applies to a sentence on a
      page. - 2026-08-22: decoration audit, run because the star bug

which left one entry mangled and swallowed the entire next entry's
bullet, so the decoration audit had not rendered as its own entry since
the day it was written. Nothing broke. No build noticed. The log simply
held one fewer entry than it claimed to, quietly, for a day -- and a log
that can lose an entry without saying so is worth less than one that
cannot, which is the whole of its value.

Three assertions, matching the three ways that failure can present:

  1. every entry opens with a date
  2. no orphaned continuation bullets, and no entry swallowed mid-line
  3. the entry count matches the total the document itself declares

The third is the one that catches a loss rather than a malformation.
Appending an entry means updating a number, which is a deliberate speed
bump: it costs a moment and it makes a vanished entry impossible to miss.

Two boundaries, stated rather than left to be discovered.

Coverage is partial, and the precise shape matters more than the
reassuring summary. This runs in CI on pull requests only. It does not
run in the deploy workflow, because a monthly data refresh should not
fail on the shape of a paragraph. So an edit that reaches main without a
pull request is not checked at all -- and the likeliest such edit is a
correction typed straight into the GitHub web editor, which is a normal
thing to do to a prose file and bypasses this entirely. "Every edit so
far has come through a PR" is a description of habit, not a constraint,
and writing it as coverage is how an assumed presence gets born.

And it reads structure, never meaning: it can tell you an entry is
present and cannot tell you it is true. A green structural check on a
dishonest log would be the purest instance yet of the pattern this file
spent a day naming.

    python3 scripts/check_project_doc.py
"""

from __future__ import annotations

import re
import sys
from pathlib import Path

DOC = Path(__file__).resolve().parent.parent / "PROJECT.md"

# "- 2026-08-23: " or, for the one pre-rebuild entry, "- 2025: ".
ENTRY = re.compile(r"^- (\d{4}(?:-\d{2}-\d{2})?): \S")
# A dated entry that ended up inside another line instead of starting one.
SWALLOWED = re.compile(r"\S\s+- \d{4}(?:-\d{2}-\d{2})?: ")
DECLARED = re.compile(r"log holds (\d+) entries")

text = DOC.read_text(encoding="utf-8")
lines = text.splitlines()

problems: list[str] = []

# Isolate the decision log: from its heading to the next section or EOF.
try:
    start = lines.index("## Decision log")
except ValueError:
    print("FAIL  PROJECT.md has no '## Decision log' section")
    sys.exit(1)

end = len(lines)
for i in range(start + 1, len(lines)):
    if lines[i].startswith("## "):
        end = i
        break
body = lines[start + 1 : end]

first_entry = next((i for i, l in enumerate(body) if l.startswith("- ")), None)
if first_entry is None:
    print("FAIL  the decision log contains no entries at all")
    sys.exit(1)

entries = 0
for offset, line in enumerate(body[first_entry:], start=start + 1 + first_entry):
    n = offset + 1  # 1-indexed, to match an editor
    if line.startswith("- "):
        if ENTRY.match(line):
            entries += 1
        else:
            problems.append(
                f"PROJECT.md:{n}: an entry that does not open with a date. "
                f"A continuation line that acquires a list marker looks "
                f"exactly like this: {line[:60]!r}"
            )
    elif line and not line.startswith("  "):
        problems.append(
            f"PROJECT.md:{n}: a continuation line that is not indented two "
            f"spaces, so it will render outside the entry it belongs to: "
            f"{line[:60]!r}"
        )
    if SWALLOWED.search(line):
        problems.append(
            f"PROJECT.md:{n}: a dated entry appears inside another line "
            f"instead of starting one, so it has lost its own bullet: "
            f"{line[:70]!r}"
        )

if not problems:
    print(f"  ok    {entries} entries, each opening with a date")
    print("  ok    no orphaned bullets and no entry swallowed mid-line")

m = DECLARED.search(text)
if m is None:
    problems.append(
        "PROJECT.md does not declare how many entries its log holds, so a "
        "vanished entry cannot be detected. Add 'This log holds N entries' "
        "to the Decision log section."
    )
elif int(m.group(1)) != entries:
    problems.append(
        f"PROJECT.md declares {m.group(1)} decision-log entries and has "
        f"{entries}. Either an entry was lost to a bad edit, or one was "
        f"appended without updating the declared total."
    )
else:
    print(f"  ok    the declared total ({entries}) matches what is there")

if problems:
    print(f"\nFAIL  {len(problems)} problem(s):")
    for p in problems:
        print(f"  - {p}")
    sys.exit(1)
print("\nthe decision log is intact")
