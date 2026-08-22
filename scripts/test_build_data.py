#!/usr/bin/env python3
"""
Assertions on the transform, run in CI before the fixture build.

Scope is deliberately narrow: the three fidelity bugs fixed on
2026-08-22, each reproduced as a failing case first. The fixture build
that follows proves the pipeline runs; this proves it runs correctly on
the inputs that used to break it silently.

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
) -> subprocess.CompletedProcess:
    (root / "data").mkdir(parents=True, exist_ok=True)
    zip_path = root / "batch.zip"
    with zipfile.ZipFile(zip_path, "w") as zf:
        for name, blob in files.items():
            zf.writestr(name, blob)
        zf.writestr("manifest.json", b"[]")
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


for t in (
    test_whitespace_state_does_not_split_a_state,
    test_two_files_one_table_name_is_fatal,
    test_other_shard_holds_the_rows_and_unions_cleanly,
    test_count_drift_discriminates_cms_from_us,
):
    t()

print()
if failures:
    print(f"FAIL  {len(failures)} assertion(s):")
    for f in failures:
        print(f"  - {f}")
    sys.exit(1)
print("transform assertions pass")
