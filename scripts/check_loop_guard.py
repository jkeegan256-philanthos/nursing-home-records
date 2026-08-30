#!/usr/bin/env python3
"""
Assert the deploy workflow cannot trigger itself.

build-deploy.yml commits state/ back to main after a successful deploy.
A push to main is a build, which deploys, which commits state again --
a runaway that burns minutes and writes junk entries into the ledger it
exists to protect.

GitHub does not raise workflow events for pushes made with the default
GITHUB_TOKEN, which stops this today. That protection is real and it is
invisible: it lives in GitHub's behaviour, not in this repository, and
it disappears the moment someone swaps in a PAT or a GitHub App token
to satisfy branch protection. Nothing in the diff would look wrong.

So the guard that has to survive that change is the declared one, and
this is the check that keeps it declared.

One honest limit: the record-state assertions below are text-presence
tripwires. They assert the words ("git add state", "refusing to push")
exist in the job's script, not that the behavior does, so a rewording
that keeps the words while dropping the refusal would pass. The
behavioral half is the job's own staged-files check at run time; this
gate keeps the declaration from quietly disappearing, which is the
failure it was built for.

    python3 scripts/check_loop_guard.py
"""

from __future__ import annotations

import sys
from pathlib import Path

import yaml

WORKFLOW = Path(__file__).resolve().parent.parent / ".github/workflows/build-deploy.yml"
STATE_GLOB = "state/**"

doc = yaml.safe_load(WORKFLOW.read_text(encoding="utf-8"))
# PyYAML reads a bare `on:` key as the boolean True.
triggers = doc.get("on", doc.get(True)) or {}
push = triggers.get("push")

problems: list[str] = []

if push is None:
    print("  ok    no push trigger, so no loop is possible")
else:
    ignored = push.get("paths-ignore") or []
    if STATE_GLOB not in ignored:
        problems.append(
            f"the push trigger does not ignore {STATE_GLOB!r} (paths-ignore = "
            f"{ignored!r}). The record-state job commits state/ back to this "
            f"branch; without this the commit triggers another build."
        )
    else:
        print(f"  ok    push trigger ignores {STATE_GLOB}")

jobs = doc.get("jobs") or {}
record = jobs.get("record-state")
if record is None:
    print("  ok    no record-state job, so nothing commits back")
else:
    script = "\n".join(
        str(step.get("run", "")) for step in (record.get("steps") or [])
    )
    if "git add state" not in script:
        problems.append(
            "record-state no longer stages state/ explicitly; widening what it "
            "commits would defeat the paths-ignore guard without touching it"
        )
    elif "refusing to push" not in script:
        problems.append(
            "record-state stages state/ but no longer refuses to push a commit "
            "that reaches outside it"
        )
    else:
        print("  ok    record-state stages only state/, and checks that it did")

    if (record.get("permissions") or {}).get("contents") != "write":
        problems.append(
            "record-state cannot push: it needs permissions.contents: write"
        )
    else:
        print("  ok    record-state has the write permission it needs")

if problems:
    print(f"\nFAIL  {len(problems)} problem(s):")
    for p in problems:
        print(f"  - {p}")
    sys.exit(1)
print("\nthe deploy workflow cannot trigger itself")
