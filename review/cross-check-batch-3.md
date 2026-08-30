# Cross-check: chat reviewer's batch 3 against the clean-room read

Author: the clean-room session (branch claude/review-clean-read).
Written after this session's three batch commits (eb6c467, ad304d4,
7a8bdaf) were pushed, and after it received the chat reviewer's batch-3
notes in full. This file is therefore post-exposure material: it is not
part of the sealed clean-room read, and the sealed files predate the
exposure. As of this commit the session's total outside exposure is the
chat reviewer's batch-3 notes plus the founder's one-line
characterizations of other findings (a batch-1 flatten-guard twin, a
diff_batches basename bug, and three batch-2 items: a vacuous
hostile-name assertion, an extension-pinning question, and a PR-only
loop guard). It has read none of those files or notes itself.

## Their findings, verified against the code

- B3-1 (col() comment imprecise): confirmed, and a miss on the
  clean-room side. lib/data.ts:242-243 reads as "CCN, State, and the
  six columns" when CCN and State are two of the six in SLIM_COLUMNS
  (scripts/build_data.py:79-86). Valid costs-clarity finding.
- B3-2 (hardcoded nursinghomerecords_ CSV filename prefix, unlisted in
  ADAPTATION.md): confirmed, their best catch. lib/csv.ts:24 is a
  fork-identity string outside lib/config.ts and outside touchpoint
  10's list; a fork ships this site's name on every downloaded CSV.
  The clean-room read filed csv.ts under nothing found.
- B3-3 (querySQL sorting contract unenforced): convergent on
  substance with the clean-room batch-4 finding on
  OwnerExplorer.tsx:114 and 167-173 (LIMIT 3000 unordered, client-side
  sort, the pattern lib/duckdb-client.ts:133-138 forbids; the roles
  and types chips also derive from the capped slice). Framings differ:
  they tag the export boundary (WHAT), the clean-room note tags the
  call site (HOW). The boundary framing is the better one for
  synthesis, since fixing one call site leaves the export open.
- B3-4 (timeout retries alongside, worker never terminated):
  convergent with clean-room batch-3 finding 5, near-identical
  evidence, one severity notch apart.
- B3-5 (ledger() assumes .entries): the code observation is correct as
  written, but the reachability claim is wrong. The build normalizes
  the fetched remote copy through prev_ledger.get("entries", [])
  (scripts/build_data.py:1029) and always rewrites
  public/data/ledger.json as {"entries": [...]}
  (scripts/build_data.py:1101-1103), and that locally written file is
  the only one lib/data.ts reads. Reaching the fragility needs a
  build_data.py regression, and the failure then surfaces as a crashed
  static export (a TypeError rendering the Data page), a red build
  rather than a wrong page. Downgrade to hardening.
- B3-6 (methodsFigures() exported beside its own publishability gate
  capacityFigure()): confirmed; the clean-room read missed it. Same
  shape as B3-3.
- B3-7 (ownerDescription localization inconsistency): convergent with
  clean-room batch-3 finding 6, identical.
- B3-8 (calculation surface unmarked in lib/): convergent in
  substance, different disposition. The clean-room note recorded
  ownershipRollup() as sanctioned via ADAPTATION touchpoint 7; they
  propose marking the principle-1 boundary in the code. Compatible.

## Divergences toward the clean-room read

- lib/config.ts: they filed it read whole, no findings, with praise;
  the clean-room batch-3 finding 1 is that the comment at lines 16-18
  ends "so a fork does not inherit a name" while line 19 ships
  SITE_AUTHOR populated, and ADAPTATION touchpoint 10's "It ships
  empty" no longer matches the file. Two independent readers reached
  opposite verdicts on the same seven lines. Their B3-2 and this
  finding are the same hazard class, fork inherits deployment
  identity, found in different files; each reader saw one instance and
  missed the other's.
- No chat equivalent of the clean-room blank-CCN asymmetry (allCCNs()
  drops rows facilitiesFor() keeps, a latent broken state-table link),
  the duplicate-CCN silent collapse in getFacility(), or the cosmetic
  unescaped interpolation at lib/duckdb-client.ts:68.

## Their structural point

Their note on method (a rule stated in a comment with a public export
beside it that violates it without tripping anything: B3-3, B3-6) is
confirmed from inside the clean room by independent instances found
before any exposure: the OwnerExplorer sort violation and the batch-5
glossary finding (a freshness claim whose content is hardcoded
elsewhere with no gate). One ranked structural finding with instances
is the right synthesis form, in principle 7's own vocabulary: claims
shipping without checks.
