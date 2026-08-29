#!/usr/bin/env python3
"""
Prove scripts/diff_batches.py reports exactly what was planted and
nothing else, before trusting it on a real batch.

The instrument under test has three verdicts: SCHEMA (column
vocabulary moved between batches -- the one CMS movement that can
break the pipeline rather than describe the world), MOVEMENT (rows
only in one batch, described, never judged), and INTEGRITY (the
built parquet is exactly the current zip's rows -- the transform
check, deliberately not a claim about what any deployed site
serves).

The fixture zip is built by dev_fixture.py; a variant zip is derived
from it here with a known delta: in the ownership file one row
removed, one row added, one value edited; in the penalties file one
column renamed. The assertions demand exactly that delta in the
report. Because row identity is the full tuple (these files have no
primary key), the edited row must surface as one removal plus one
addition, and the report must say so in words -- a September reader
seeing honest-but-raw counts would reach for the phone.
"""

import csv
import io
import json
import re
import subprocess
import sys
import tempfile
import zipfile
from pathlib import Path

ROOT = Path(__file__).resolve().parent.parent
SCRIPT = ROOT / "scripts" / "diff_batches.py"
FIXTURE_ZIP = ROOT / "build" / "fixture" / "theme_fixture.zip"

OWN = "NH_Ownership_Jun2026.csv"
PEN = "NH_Penalties_Jun2026.csv"

failures = []


def check(ok: bool, label: str, detail: str = "") -> None:
    print(("  ok    " if ok else "  FAIL  ") + label)
    if not ok:
        failures.append(label + (f" -- {detail}" if detail else ""))


def run(args: list[str]) -> subprocess.CompletedProcess:
    return subprocess.run(
        [sys.executable, str(SCRIPT), *args],
        capture_output=True,
        text=True,
    )


def rewrite_csv(data: bytes, mutate) -> bytes:
    rows = list(csv.reader(io.StringIO(data.decode("utf-8"))))
    rows = mutate(rows)
    buf = io.StringIO()
    csv.writer(buf, quoting=csv.QUOTE_ALL, lineterminator="\r\n").writerows(rows)
    return buf.getvalue().encode("utf-8")


def derive_zip(src: Path, dest: Path, mutations: dict) -> None:
    with zipfile.ZipFile(src) as zin, zipfile.ZipFile(dest, "w") as zout:
        for name in zin.namelist():
            data = zin.read(name)
            if name in mutations:
                data = rewrite_csv(data, mutations[name])
            zout.writestr(name, data)


def main() -> None:
    if not FIXTURE_ZIP.exists():
        subprocess.run(
            [sys.executable, str(ROOT / "scripts" / "dev_fixture.py")], check=True
        )

    with tempfile.TemporaryDirectory() as td:
        tmp = Path(td)
        variant = tmp / "variant.zip"

        # The planted delta. Ownership: drop the second data row, add a
        # new row copied from the first with a new owner name, edit one
        # value in the third. Penalties: rename one column.
        def mutate_own(rows):
            added = list(rows[1])
            name_i = rows[0].index("Owner Name")
            added[name_i] = "PLANTED, OWNER"
            edited = list(rows[3])
            edited[name_i] = "EDITED, OWNER"
            return [rows[0], rows[1], added, edited] + rows[4:]

        def mutate_pen(rows):
            head = list(rows[0])
            head[head.index("Penalty Type")] = "Penalty Kind"
            return [head] + rows[1:]

        derive_zip(
            FIXTURE_ZIP,
            variant,
            {OWN: mutate_own, PEN: mutate_pen},
        )

        # --- movement + schema, prior = fixture, current = variant ---
        r = run(["--prior", str(FIXTURE_ZIP), "--current", str(variant)])
        out = r.stdout
        check(r.returncode == 0, "movement-only run exits 0", f"rc={r.returncode}\n{r.stderr}")

        # Ownership: removed row + edited-old = 2 only-in-prior; added
        # row + edited-new = 2 only-in-current.
        m = re.search(rf"{re.escape(OWN)}.*?only in prior: (\d+).*?only in current: (\d+)", out, re.S)
        check(
            m is not None and m.group(1) == "2" and m.group(2) == "2",
            "ownership reports exactly the planted 2/2 row delta",
            m.group(0)[:200] if m else out[:400],
        )
        check("PLANTED, OWNER" in out, "the added row appears in the sample")
        # Every other common unchanged file reports no movement.
        moved_files = re.findall(r"only in prior: ([1-9]\d*)", out)
        check(
            moved_files == ["2"],
            "no file beyond ownership reports row movement",
            str(moved_files),
        )
        # The tuple-identity caveat is stated in words.
        check(
            "removal" in out and "addition" in out and "edit" in out.lower(),
            "the report says edits appear as a removal-addition pair",
        )
        # Schema drift is a loud verdict naming the file and both columns.
        check(
            re.search(r"SCHEMA", out) is not None
            and PEN in out
            and "Penalty Type" in out
            and "Penalty Kind" in out,
            "the renamed penalties column is a SCHEMA verdict naming old and new",
        )
        check("MOVEMENT" in out and "INTEGRITY" in out, "all three verdict lines print")
        check("NOT CHECKED" in out, "integrity without --site is a stated non-check")

        # Identical zips: quiet on every axis.
        r = run(["--prior", str(FIXTURE_ZIP), "--current", str(FIXTURE_ZIP)])
        check(
            r.returncode == 0 and re.search(r"only in (prior|current): [1-9]", r.stdout) is None,
            "identical zips report zero movement",
        )

        # --- integrity: a faithful parquet, then a corrupted one ---
        import duckdb

        site = tmp / "site"
        (site / "parquet").mkdir(parents=True)
        with zipfile.ZipFile(FIXTURE_ZIP) as z:
            own_csv = tmp / OWN
            own_csv.write_bytes(z.read(OWN))
            own_cols = next(csv.reader(io.StringIO(z.read(OWN).decode("utf-8"))))
        con = duckdb.connect()
        q = lambda p: "'" + str(p).replace("'", "''") + "'"
        con.execute(
            f"COPY (SELECT * FROM read_csv({q(own_csv)}, header=true, all_varchar=true)) "
            f"TO {q(site / 'parquet' / 'ownership_all.parquet')} (FORMAT PARQUET)"
        )
        (site / "data-map.json").write_text(
            json.dumps(
                {
                    "generated_at": "2026-08-29T00:00:00Z",
                    "tables": {
                        "ownership_all": {
                            "mode": "single",
                            "path": "data/parquet/ownership_all.parquet",
                            "columns": own_cols,
                            "source_file": OWN,
                        }
                    },
                }
            )
        )
        r = run(["--current", str(FIXTURE_ZIP), "--site", str(site)])
        check(
            r.returncode == 0 and "INTEGRITY: MATCH" in r.stdout,
            "a faithful parquet is INTEGRITY: MATCH, exit 0",
            r.stdout[-400:] + r.stderr[-200:],
        )

        full = q(site / "parquet" / "ownership_all.parquet")
        con.execute(
            f"COPY (SELECT * FROM read_parquet({full}) LIMIT "
            f"(SELECT count(*) - 1 FROM read_parquet({full}))) "
            f"TO {q(tmp / 'short.parquet')} (FORMAT PARQUET)"
        )
        (tmp / "short.parquet").replace(site / "parquet" / "ownership_all.parquet")
        r = run(["--current", str(FIXTURE_ZIP), "--site", str(site)])
        check(
            r.returncode != 0 and "ownership_all" in r.stdout and "MISMATCH" in r.stdout,
            "a parquet missing one row is a nonzero MISMATCH naming the table",
            f"rc={r.returncode} {r.stdout[-400:]}",
        )

    if failures:
        print(f"\nFAIL  {len(failures)} assertion(s):")
        for f in failures:
            print(f"  - {f}")
        sys.exit(1)
    print("\nthe batch diff reports what was planted and nothing else")


if __name__ == "__main__":
    main()
