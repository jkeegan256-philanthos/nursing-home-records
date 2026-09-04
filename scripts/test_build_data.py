#!/usr/bin/env python3
"""
Assertions on the transform, run in CI before the fixture build.

Scope: outcomes that used to go wrong silently, each reproduced as a
failing case first. The three fidelity bugs fixed on 2026-08-22, the
count-drift discriminator, and the two zip modes (a repackaged archive
and a manifest-only revision). The fixture build that follows proves
the pipeline runs; this proves it runs correctly on the inputs that
used to break it.

    python3 scripts/test_build_data.py
"""

from __future__ import annotations

import csv
import io
import json
import os
import subprocess
import sys
import tempfile
import zipfile
from pathlib import Path

import duckdb

HERE = Path(__file__).resolve().parent
BUILD = HERE / "build_data.py"

PROVIDER_COLS = [
    "CMS Certification Number (CCN)", "Provider Name", "City/Town",
    "State", "ZIP Code", "Overall Rating",
]
CITATION_COLS = PROVIDER_COLS + ["Survey Date", "Deficiency Tag Number"]

failures: list[str] = []


def check(ok: bool, label: str, detail: str = "") -> None:
    print(f"  {'ok  ' if ok else 'FAIL'}  {label}")
    if not ok:
        failures.append(f"{label}{': ' + detail if detail else ''}")


def csv_bytes(cols: list[str], rows: list[dict]) -> bytes:
    buf = io.StringIO()
    w = csv.DictWriter(buf, fieldnames=cols, quoting=csv.QUOTE_ALL, lineterminator="\r\n")
    w.writeheader()
    w.writerows(rows)
    return buf.getvalue().encode("utf-8")


def run_transform(
    files: dict[str, bytes],
    root: Path,
    state_url: str = "",
    allow_drift: bool = False,
    zip_stamp: tuple = (2026, 8, 26, 2, 11, 4),
    manifest: bytes = b"[]",
) -> subprocess.CompletedProcess:
    # zip_stamp is the entry timestamp written into every zip entry. Two
    # calls differing only in it produce archives whose contents are
    # byte-identical but whose sha256 differs -- the exact shape CMS
    # produced on 2026-08-27, when the zips differed in four bytes, all
    # in manifest.json's local-header timestamp.
    (root / "data").mkdir(parents=True, exist_ok=True)
    zip_path = root / "batch.zip"
    with zipfile.ZipFile(zip_path, "w") as zf:
        for name, blob in files.items():
            zf.writestr(zipfile.ZipInfo(name, date_time=zip_stamp), blob)
        zf.writestr(zipfile.ZipInfo("manifest.json", date_time=zip_stamp), manifest)
    env = {
        **os.environ,
        "NH_PARTITION_MIN_BYTES": "100",   # force partitioning on tiny inputs
        "NH_STATE_URL": state_url,         # "" carries no state at all
    }
    if state_url:
        env["NH_STATE_SAVE"] = "1"
        env["NH_STATE_BOOTSTRAP"] = "1"
    if allow_drift:
        env["NH_ALLOW_COUNT_DRIFT"] = "1"
    return subprocess.run(
        [sys.executable, str(BUILD), "--zip", str(zip_path), "--root", str(root)],
        capture_output=True, text=True, env=env,
    )


def provider(ccn: str, state: str) -> dict:
    return {
        "CMS Certification Number (CCN)": ccn,
        "Provider Name": f"HOME {ccn}",
        "City/Town": "TOWN",
        "State": state,
        "ZIP Code": "84000",
        "Overall Rating": "3",
    }


def citation(ccn: str, state: str, tag: str) -> dict:
    return {**provider(ccn, state), "Survey Date": "2025-01-01",
            "Deficiency Tag Number": tag}


# ---------------------------------------------------------------- B3

def test_whitespace_state_does_not_split_a_state() -> None:
    """A published " UT " used to pass a stripped validity check and then
    become a filename with spaces in it, splitting UT across two shards
    that no page knew to ask for."""
    print("\nB3  a state value with surrounding whitespace")
    with tempfile.TemporaryDirectory() as tmp:
        root = Path(tmp)
        res = run_transform({
            "NH_ProviderInfo_Jun2026.csv": csv_bytes(
                PROVIDER_COLS, [provider("000001", "UT"), provider("000002", " UT ")]
            ),
            "NH_HealthCitations_Jun2026.csv": csv_bytes(
                CITATION_COLS,
                [citation("000001", "UT", "0001"), citation("000002", " UT ", "0002")] * 3,
            ),
        }, root)
        check(res.returncode == 0, "transform succeeds", res.stderr[-400:])

        shards = sorted(p.name for p in (root / "public/data/parquet/health_citations").iterdir())
        check(
            shards == ["UT.parquet"],
            f"one shard per state, cleanly named (got {shards})",
        )

        states = json.loads((root / "public/data/data-map.json").read_text())[
            "tables"]["health_citations"]["states"]
        check(states == ["UT"], f"data-map records the clean code (got {states})")

        # Fidelity: the partition key is normalised, the published value is not.
        con = duckdb.connect()
        raw = con.execute(
            f"""SELECT DISTINCT "State" FROM read_parquet(
                '{root}/public/data/parquet/health_citations/UT.parquet') ORDER BY 1"""
        ).fetchall()
        check(
            sorted(r[0] for r in raw) == [" UT ", "UT"],
            "the rows keep CMS's exact value, spaces and all",
            str(raw),
        )


# ---------------------------------------------------------------- B2

def test_two_files_one_table_name_is_fatal() -> None:
    """The SNF VBP patterns match any fiscal year, so a zip spanning a
    year boundary used to write one shard twice and keep the last."""
    print("\nB2  two source files that map to one table name")
    with tempfile.TemporaryDirectory() as tmp:
        root = Path(tmp)
        rows = [provider("000001", "UT")]
        res = run_transform({
            "NH_ProviderInfo_Jun2026.csv": csv_bytes(PROVIDER_COLS, rows),
            "FY_2026_SNF_VBP_Facility_Performance.csv": csv_bytes(PROVIDER_COLS, rows),
            "FY_2027_SNF_VBP_Facility_Performance.csv": csv_bytes(PROVIDER_COLS, rows),
        }, root)
        check(res.returncode != 0, "the build refuses to run")
        check(
            "snf_vbp_facility" in res.stdout and "overwrite" in res.stdout,
            "and says which two files collided",
            res.stdout[-400:],
        )


# ---------------------------------------------------------------- B1

def test_other_shard_holds_the_rows_and_unions_cleanly() -> None:
    """Rows CMS published with no usable state go to _OTHER.parquet. A
    facility page reads <ST>.parquet and _OTHER.parquet together, so the
    record shown is the record published."""
    print("\nB1  rows with no usable state code")
    with tempfile.TemporaryDirectory() as tmp:
        root = Path(tmp)
        cites = [citation("000001", "UT", "0001"), citation("000001", "UT", "0002")]
        stray = citation("000001", "", "0003")          # blank state, same facility
        res = run_transform({
            "NH_ProviderInfo_Jun2026.csv": csv_bytes(PROVIDER_COLS, [provider("000001", "UT")]),
            "NH_HealthCitations_Jun2026.csv": csv_bytes(CITATION_COLS, cites * 2 + [stray]),
        }, root)
        check(res.returncode == 0, "transform succeeds", res.stderr[-400:])

        d = root / "public/data/parquet/health_citations"
        check((d / "_OTHER.parquet").exists(), "_OTHER shard is written")

        con = duckdb.connect()
        n = lambda sql: con.execute(sql).fetchone()[0]
        where = """WHERE "CMS Certification Number (CCN)" = '000001'"""
        state_only = n(f"SELECT count(*) FROM read_parquet(['{d}/UT.parquet']) {where}")
        both = n(
            f"SELECT count(*) FROM read_parquet(['{d}/UT.parquet','{d}/_OTHER.parquet']) {where}"
        )
        check(state_only == 4, f"the state shard alone holds 4 rows (got {state_only})")
        check(
            both == 5,
            f"the shards together hold every published row (got {both}, want 5)",
        )


# ---------------------------------------------------------------- drift

def test_count_drift_discriminates_cms_from_us() -> None:
    """A headline count that moves while its source file is byte-identical
    cannot have moved because CMS changed, so it moved because we did."""
    print("\nD   a published count moving without its source")
    with tempfile.TemporaryDirectory() as tmp:
        root = Path(tmp)
        rows = [provider(f"{i:06d}", "UT") for i in range(1, 6)]
        files = {
            "NH_ProviderInfo_Jun2026.csv": csv_bytes(PROVIDER_COLS, rows),
        }
        state = root / "state"
        empty = root / "empty"
        empty.mkdir(parents=True, exist_ok=True)

        # First build starts the chain; second reads it and must agree.
        first = run_transform(files, root, state_url=str(empty))
        check(first.returncode == 0, "a first build records the counts", first.stdout[-300:])
        ledger = json.loads((state / "ledger.json").read_text())
        counts = ledger["entries"][-1].get("counts", {})
        check(
            counts.get("facilities", {}).get("value") == 5,
            f"facilities recorded as 5 (got {counts.get('facilities')})",
        )

        again = run_transform(files, root, state_url=str(state))
        check(again.returncode == 0, "an unchanged rebuild passes silently", again.stdout[-300:])

        # Now make the previous build claim a different number for the same
        # bytes: exactly the shape of a pipeline regression.
        led = state / "ledger.json"
        d = json.loads(led.read_text())
        d["entries"][-1]["counts"]["facilities"]["value"] = 4
        led.write_text(json.dumps(d))
        broke = run_transform(files, root, state_url=str(state))
        check(broke.returncode != 0, "a count moving on identical bytes stops the build")
        check(
            "byte-identical" in broke.stdout and "facilities" in broke.stdout,
            "and says which count and which file",
            broke.stdout[-300:],
        )

        # The deliberate override proceeds and leaves a record.
        d = json.loads(led.read_text())
        d["entries"][-1]["counts"]["facilities"]["value"] = 4
        led.write_text(json.dumps(d))
        forced = run_transform(files, root, state_url=str(state), allow_drift=True)
        check(forced.returncode == 0, "NH_ALLOW_COUNT_DRIFT lets it through")
        entry = json.loads(led.read_text())["entries"][-1]
        check(
            bool(entry.get("count_drift_override")),
            "and the override is recorded in the ledger entry, not just the log",
            str(entry.get("count_drift_override")),
        )


# ---------------------------------------------------------------- modes

def test_repackaged_zip_is_named_not_mistaken_for_data() -> None:
    """On 2026-08-27 CMS regenerated the zip container around
    byte-identical files. The zip's sha256 identifies the archive; the
    per-file hashes identify the data; a build that sees the first move
    without the second has to say so, or the next reader of the ledger
    repeats the misreading this test exists to retire."""
    print("\nM1  a new archive carrying no new data")
    with tempfile.TemporaryDirectory() as tmp:
        root = Path(tmp)
        files = {
            "NH_ProviderInfo_Jun2026.csv": csv_bytes(
                PROVIDER_COLS, [provider("000001", "UT")]
            ),
        }
        state = root / "state"
        empty = root / "empty"
        empty.mkdir(parents=True, exist_ok=True)

        first = run_transform(files, root, state_url=str(empty))
        check(first.returncode == 0, "a first build records the batch", first.stdout[-300:])

        # Identical content, later entry timestamps: a different archive.
        again = run_transform(
            files, root, state_url=str(state), zip_stamp=(2026, 8, 27, 21, 54, 0)
        )
        check(again.returncode == 0, "a repackage is a warning, not a failure", again.stdout[-300:])
        check(
            "repackaged" in again.stdout,
            "and the build names the mode",
            again.stdout[-400:],
        )

        # Control: the same archive again is silence, not a repackage.
        same = run_transform(
            files, root, state_url=str(state), zip_stamp=(2026, 8, 27, 21, 54, 0)
        )
        check(
            same.returncode == 0 and "repackaged" not in same.stdout,
            "an unchanged archive raises no repackage warning",
            same.stdout[-300:],
        )


def test_manifest_only_change_is_named_metadata_not_data() -> None:
    """The fourth mode: only manifest.json moves. It fails the
    all-files-identical test, so without its own branch it would be
    silently classified as new data. And the manifest is not a mere
    envelope: it carries the per-dataset modified dates the site
    displays, so this mode is reader-visible."""
    print("\nM2  a manifest-only change")
    with tempfile.TemporaryDirectory() as tmp:
        root = Path(tmp)
        files = {
            "NH_ProviderInfo_Jun2026.csv": csv_bytes(
                PROVIDER_COLS, [provider("000001", "UT")]
            ),
        }
        state = root / "state"
        empty = root / "empty"
        empty.mkdir(parents=True, exist_ok=True)

        first = run_transform(files, root, state_url=str(empty))
        check(first.returncode == 0, "a first build records the batch", first.stdout[-300:])

        # Same dataset bytes, same timestamps, revised manifest.
        revised = run_transform(files, root, state_url=str(state), manifest=b"[ ]")
        check(revised.returncode == 0, "a metadata revision is a warning, not a failure", revised.stdout[-300:])
        check(
            "catalog metadata revised" in revised.stdout,
            "and the build names the mode",
            revised.stdout[-400:],
        )
        check(
            "repackaged" not in revised.stdout,
            "and does not call it a repackage",
            revised.stdout[-300:],
        )

# ---------------------------------------------------------------- roles

def test_top_owner_roles_are_derived_per_role() -> None:
    """The Methods page teaches from named example parties using the
    roles CMS filed for them, never an outside characterization, so
    the top-owner export carries a per-role distinct-facility
    breakdown for each name. One name filed in two roles across
    overlapping facilities is exactly the shape the page renders: the
    counts need not sum to the name's facility count, and the order
    is by footprint, largest role first."""
    def own(ccn: str, role: str) -> dict:
        return {
            "CMS Certification Number (CCN)": ccn,
            "Provider Name": f"HOME {ccn}", "City/Town": "TOWN",
            "State": "UT", "ZIP Code": "84000",
            "Role played by Owner or Manager in Facility": role,
            "Owner Type": "Individual", "Owner Name": "BREAKDOWN, PAT",
            "Ownership Percentage": "NOT APPLICABLE",
            "Association Date": "since 01/01/2015",
            "Processing Date": "2026-06-01",
        }

    own_cols = list(own("0", "").keys())
    rows = [
        own("111111", "OPERATIONAL/MANAGERIAL CONTROL"),
        own("222222", "OPERATIONAL/MANAGERIAL CONTROL"),
        own("111111", "5% OR GREATER DIRECT OWNERSHIP INTEREST"),
    ]
    files = {
        "NH_ProviderInfo_Jun2026.csv": csv_bytes(
            list(provider("0", "UT").keys()),
            [provider("111111", "UT"), provider("222222", "UT")],
        ),
        "NH_Ownership_Jun2026.csv": csv_bytes(own_cols, rows),
    }
    with tempfile.TemporaryDirectory() as td:
        root = Path(td)
        res = run_transform(files, root)
        check(res.returncode == 0, "roles: transform succeeds on the two-role batch",
              res.stderr[-400:] if res.returncode else "")
        tops = list(root.rglob("owners-top.json"))
        check(len(tops) == 1, "roles: exactly one owners-top.json written",
              str(tops))
        if not tops:
            return
        top = json.loads(tops[0].read_text(encoding="utf-8"))["top"]
        row = next((r for r in top if r["name"] == "BREAKDOWN, PAT"), None)
        check(row is not None, "roles: the two-role name is in the export", str(top)[:200])
        got = row.get("roles") if row else None
        want = [
            {"role": "OPERATIONAL/MANAGERIAL CONTROL", "facilities": 2},
            {"role": "5% OR GREATER DIRECT OWNERSHIP INTEREST", "facilities": 1},
        ]
        check(got == want,
              "roles: per-role distinct-facility breakdown, largest first",
              f"got {got!r}")


# ---------------------------------------------------------------- watchers

def _own_row(ccn: str, name: str, role: str = "CORPORATE OFFICER") -> dict:
    return {
        "CMS Certification Number (CCN)": ccn,
        "Provider Name": f"HOME {ccn}", "City/Town": "TOWN",
        "State": "UT", "ZIP Code": "84000",
        "Role played by Owner or Manager in Facility": role,
        "Owner Type": "Individual", "Owner Name": name,
        "Ownership Percentage": "NOT APPLICABLE",
        "Association Date": "since 01/01/2015",
        "Processing Date": "2026-06-01",
    }


_OWN_COLS = list(_own_row("0", "X").keys())


def test_formula_leading_owner_name_stops_the_build() -> None:
    """Entry 70's first watcher: the 2026-08-27 entry reserves a batch
    publishing a formula-leading owner name for a human ruling, so the
    build must stop before publish and the message must let that human
    rule in a minute: the entry's date, the names verbatim, and the
    standing reasons not to escape."""
    rows = [
        _own_row("111111", "SMITH, JANE"),
        _own_row("222222", "=SUM(A1) LLC"),
    ]
    files = {
        "NH_ProviderInfo_Jun2026.csv": csv_bytes(
            list(provider("0", "UT").keys()),
            [provider("111111", "UT"), provider("222222", "UT")],
        ),
        "NH_Ownership_Jun2026.csv": csv_bytes(_OWN_COLS, rows),
    }
    with tempfile.TemporaryDirectory() as td:
        res = run_transform(files, Path(td))
        out = res.stdout + res.stderr
        check(res.returncode != 0,
              "watchers: a formula-leading owner name stops the build", out[-300:])
        check("=SUM(A1) LLC" in out,
              "watchers: the offending name is printed verbatim", out[-300:])
        check("2026-08-27" in out and "revisit" in out,
              "watchers: the message carries the entry date and the "
              "revisit-not-inherit condition", out[-300:])
        check("shown as published" in out and "one page away" in out,
              "watchers: both standing reasons ride in the message", out[-300:])


def test_owner_index_weight_past_threshold_stops_the_build() -> None:
    """Entry 70's second watcher, fired against the real threshold by
    a genuinely inflated index rather than a lowered bar: enough
    unique incompressible names that owners-slim.json exceeds 700 KB
    gzip-compressed."""
    import hashlib as _h
    rows = [
        _own_row("111111", f"OWNER {_h.sha256(str(i).encode()).hexdigest()[:28].upper()} {i}")
        for i in range(90_000)
    ]
    files = {
        "NH_ProviderInfo_Jun2026.csv": csv_bytes(
            list(provider("0", "UT").keys()), [provider("111111", "UT")],
        ),
        "NH_Ownership_Jun2026.csv": csv_bytes(_OWN_COLS, rows),
    }
    with tempfile.TemporaryDirectory() as td:
        res = run_transform(files, Path(td))
        out = res.stdout + res.stderr
        check(res.returncode != 0,
              "watchers: an owner index past 700 KB compressed stops the build",
              out[-300:])
        check("proxy" in out and "chosen" in out,
              "watchers: the message labels gzip a proxy and the threshold "
              "chosen, not measured", out[-300:])


for t in (
    test_whitespace_state_does_not_split_a_state,
    test_two_files_one_table_name_is_fatal,
    test_other_shard_holds_the_rows_and_unions_cleanly,
    test_count_drift_discriminates_cms_from_us,
    test_repackaged_zip_is_named_not_mistaken_for_data,
    test_manifest_only_change_is_named_metadata_not_data,
    test_top_owner_roles_are_derived_per_role,
    test_formula_leading_owner_name_stops_the_build,
    test_owner_index_weight_past_threshold_stops_the_build,
):
    t()

print()
if failures:
    print(f"FAIL  {len(failures)} assertion(s):")
    for f in failures:
        print(f"  - {f}")
    sys.exit(1)
print("transform assertions pass")
