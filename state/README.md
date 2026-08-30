# Carried state

The pipeline's memory between batches. Three files, written by
`scripts/build_data.py` and committed by the deploy workflow after every
successful deploy:

    ledger.json        the append-only record of every build this site served,
                       with per-file checksums and the counts derived from them
    owner-slugs.json   the owner-name -> URL reservations, so a cited link
                       never comes to mean a different name
    data-map.json      the previous batch's table structure, for drift notes

## Why the files are here and not only on the site

The deployed site is authoritative: it is what readers actually got, and
the build reads it first. But it is also the thing being rebuilt, and
keeping the only copy of a site's history on that site makes the site its
own single point of failure. Before this directory existed, one timed-out
fetch was enough to restart the ledger chain from zero and drop every
slug reservation — permanently, on the next deploy, with nothing but a
processing note to mark it.

So the build now reads the deployed copy first, this committed copy
second, and refuses to build on neither. See the 2026-08-22 entries in
DECISIONS.md.

## The commit-back loop

The deploy workflow writes here and pushes to the branch that triggers
the deploy workflow. Two guards stop that from running away, and
`scripts/check_loop_guard.py` asserts both in CI:

- `paths-ignore: ["state/**"]` on the push trigger, so a commit touching
  only this directory raises no build.
- The `record-state` job refuses to push a commit that reaches outside
  `state/`, so widening what it stages cannot defeat the first guard.

GitHub also raises no workflow event for pushes made with the default
`GITHUB_TOKEN`. That is real, and it is not one of the two: it is not
visible in this repository and it ends without warning if the token is
ever swapped for a PAT or a GitHub App token.

## Do not hand-edit

These files are generated. `git checkout state/` is the right response to
an unexpected local diff.

A local `npm run data` deliberately does **not** write here: the fallback
is only meaningful if it records batches that were actually served, so
only a build inside GitHub Actions updates it (or one run with
`NH_STATE_SAVE=1`, for testing the path).

## Starting a chain from nothing

A fork, or a genuine first build, has no chain to protect. Point
`NH_STATE_URL` at your own deployed `/data/` URL. Until that URL serves
these files, the build starts each file's chain by itself and says so.

If the URL is unreachable rather than merely empty — the domain does not
resolve yet, say — the build stops rather than guess. `NH_STATE_BOOTSTRAP=1`
starts a fresh chain on purpose. The deploy workflow never sets it.
