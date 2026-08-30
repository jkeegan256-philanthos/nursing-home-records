#!/usr/bin/env python3
"""
Diff CMS batches against each other and against the site's built
tables, splitting the failure modes a two-way check conflates.

    python3 scripts/diff_batches.py \
        --prior  prior-batch.zip \
        --current current-batch.zip \
        --site   public/data

Three verdicts, because they answer different questions:

SCHEMA     Column vocabulary moved between batches. The one kind of
           CMS movement that can break this pipeline rather than
           merely describe the world, so it is its own verdict and
           prints first, never a line buried in row counts.
MOVEMENT   Rows present in only one batch, per file, described and
           never judged. Row identity is the full tuple -- these
           files publish no primary key -- which means an edited
           row appears as one removal plus one addition, and the
           report says so, because a reader of raw counts would
           otherwise see churn where there is only restyling.
INTEGRITY  The built parquet under --site holds exactly the current
           zip's rows, table by table, on the columns the parquet
           carries. This checks the transform and only the
           transform: a green verdict says nothing about what any
           deployed site serves, which is checked from outside.

Deliberately no network: inputs are local paths, so the script runs
wherever the zips are and its behavior is proven against fixture
batches by scripts/test_diff_batches.py. Exit is nonzero only for
an INTEGRITY mismatch or unreadable input; CMS moving is
information, not failure.
"""

import argparse
import csv
import json
import re
import sys
import tempfile
import zipfile
from pathlib import Path

try:
    import duckdb
except ImportError:
    print("FAIL  duckdb is required: pip install duckdb")
    sys.exit(1)

SAMPLE_ROWS = 5


def qlit(s) -> str:
    return "'" + str(s).replace("'", "''") + "'"


def qident(s: str) -> str:
    return '"' + s.replace('"', '""') + '"'


class InputError(Exception):
    """Bad or ambiguous input: reported as a named verdict, never a
    traceback, because an instrument that crashes reads as broken
    rather than as refusing."""


def extract(zip_path: Path, into: Path) -> dict[str, Path]:
    """CSV members only, flattened by basename. Two entries that
    flatten to one name would silently halve the diff, the hazard
    build_data.py's extractor refuses with a die(); refuse it here
    for the same reason."""
    out = {}
    seen: dict[str, str] = {}
    with zipfile.ZipFile(zip_path) as z:
        for name in z.namelist():
            if not name.lower().endswith(".csv"):
                continue
            base = Path(name).name
            if base in seen:
                raise InputError(
                    f"{zip_path.name}: entries {seen[base]!r} and {name!r} "
                    f"flatten to the same name {base!r}; one would silently "
                    f"overwrite the other and the diff would cover half the data"
                )
            seen[base] = name
            dest = into / base
            dest.write_bytes(z.read(name))
            out[base] = dest
    return out


# CMS stamps every filename with the month (NH_Ownership_Jun2026 ->
# NH_Ownership_Sep2026), so across a real turnover two batches share
# zero exact basenames. Files are therefore paired by their
# stamp-stripped identity, the same suffix build_data.py's classify()
# strips; pairing by exact name would report an empty diff at the one
# moment this instrument exists for.
def strip_stamp(basename: str) -> str:
    return re.sub(r"_[A-Za-z]{3}\d{4}(?=\.csv$)", "", basename)


def by_identity(files: dict[str, Path], label: str) -> dict[str, str]:
    """Map stamp-stripped identity -> actual basename, refusing the
    ambiguity of two files in one batch sharing an identity."""
    out: dict[str, str] = {}
    for base in files:
        key = strip_stamp(base)
        if key in out:
            raise InputError(
                f"the {label} zip carries both {out[key]!r} and {base!r}, "
                f"which share the stamp-stripped identity {key!r}; pairing "
                f"across batches would be ambiguous"
            )
        out[key] = base
    return out


def header_of(path: Path) -> list[str]:
    with open(path, newline="", encoding="utf-8-sig") as f:
        return next(csv.reader(f))


def csv_rel(path: Path) -> str:
    return f"read_csv({qlit(path)}, header=true, all_varchar=true)"


def norm_cols(cols: list[str], prefix: str = "") -> str:
    """NULL and empty string compare equal; everything is text."""
    return ", ".join(f"coalesce({prefix}{qident(c)}, '') AS {qident(c)}" for c in cols)


def main() -> None:
    ap = argparse.ArgumentParser(description=__doc__)
    ap.add_argument("--prior", type=Path, help="prior batch zip (enables SCHEMA and MOVEMENT)")
    ap.add_argument("--current", type=Path, required=True, help="current batch zip")
    ap.add_argument("--site", type=Path, help="built data dir holding data-map.json and parquet/ (enables INTEGRITY)")
    args = ap.parse_args()
    try:
        run_diff(args)
    except (InputError, FileNotFoundError, zipfile.BadZipFile, json.JSONDecodeError) as exc:
        print(f"FAIL  {exc}")
        sys.exit(1)


def run_diff(args: argparse.Namespace) -> None:
    con = duckdb.connect()
    schema_changes = []
    integrity_fail = False

    with tempfile.TemporaryDirectory() as td:
        tmp = Path(td)
        cur_dir = tmp / "current"
        cur_dir.mkdir()
        current = extract(args.current, cur_dir)

        if args.prior:
            pri_dir = tmp / "prior"
            pri_dir.mkdir()
            prior = extract(args.prior, pri_dir)

            # Pair by stamp-stripped identity, and label a pair with
            # both names when the stamp rotated, so the report reads
            # as the rename it is.
            pri_id = by_identity(prior, "prior")
            cur_id = by_identity(current, "current")
            pairs = [
                (
                    pri_id[k] if pri_id[k] == cur_id[k] else f"{pri_id[k]} -> {cur_id[k]}",
                    prior[pri_id[k]],
                    current[cur_id[k]],
                )
                for k in sorted(set(pri_id) & set(cur_id))
            ]

            print("== SCHEMA: column vocabulary between batches ==")
            for k in sorted(set(cur_id) - set(pri_id)):
                schema_changes.append(f"file only in current batch: {cur_id[k]}")
            for k in sorted(set(pri_id) - set(cur_id)):
                schema_changes.append(f"file only in prior batch: {pri_id[k]}")
            for label, pf, cf in pairs:
                old = header_of(pf)
                new = header_of(cf)
                if old != new:
                    gone = [c for c in old if c not in new]
                    came = [c for c in new if c not in old]
                    detail = []
                    if gone:
                        detail.append("dropped: " + ", ".join(gone))
                    if came:
                        detail.append("appeared: " + ", ".join(came))
                    if not detail:
                        detail.append("column order changed")
                    schema_changes.append(f"{label}: " + "; ".join(detail))
            if schema_changes:
                print("  !! COLUMNS MOVED -- this is the movement that can break")
                print("  !! the pipeline rather than describe the world:")
                for c in schema_changes:
                    print(f"  !!   {c}")
            else:
                print("  every file carries the same columns in both batches")

            print()
            print("== MOVEMENT: rows between batches ==")
            print("  Row identity is the full row (these files publish no")
            print("  primary key), so an edited row counts as one removal")
            print("  plus one addition, not as a change; before reading a")
            print("  count as churn, read the sample pairs.")
            for label, pf, cf in pairs:
                old_h = header_of(pf)
                new_h = header_of(cf)
                shared = [c for c in old_h if c in new_h]
                if not shared:
                    print(f"  {label}: no columns in common, rows not comparable")
                    continue
                p_sel = f"SELECT {norm_cols(shared)} FROM {csv_rel(pf)}"
                c_sel = f"SELECT {norm_cols(shared)} FROM {csv_rel(cf)}"
                only_p = con.execute(
                    f"SELECT count(*) FROM ({p_sel} EXCEPT ALL {c_sel})"
                ).fetchone()[0]
                only_c = con.execute(
                    f"SELECT count(*) FROM ({c_sel} EXCEPT ALL {p_sel})"
                ).fetchone()[0]
                total_c = con.execute(
                    f"SELECT count(*) FROM {csv_rel(cf)}"
                ).fetchone()[0]
                note = "" if old_h == new_h else " (compared on shared columns only)"
                print(f"  {label}: only in prior: {only_p} · only in current: {only_c} · current total: {total_c}{note}")
                for label, sql, n in (
                    ("prior", f"{p_sel} EXCEPT ALL {c_sel}", only_p),
                    ("current", f"{c_sel} EXCEPT ALL {p_sel}", only_c),
                ):
                    if n:
                        for row in con.execute(f"{sql} LIMIT {SAMPLE_ROWS}").fetchall():
                            print(f"      only in {label}: " + " | ".join(str(v) for v in row))
                        if n > SAMPLE_ROWS:
                            print(f"      ... {n - SAMPLE_ROWS} more only-in-{label} row(s)")
            print()

        integrity_checked = False
        if args.site:
            print("== INTEGRITY: built parquet vs the current zip ==")
            print("  This checks the transform. It does not check what a")
            print("  deployed site serves; that is verified from outside.")
            data_map = json.loads((args.site / "data-map.json").read_text())
            for key, info in sorted(data_map["tables"].items()):
                src = info.get("source_file")
                if not src or src not in current:
                    print(f"  {key}: NOT CHECKED -- source file {src!r} not in the current zip")
                    continue
                pq_path = args.site / "parquet" / key
                if pq_path.is_dir():
                    files = sorted(pq_path.glob("*.parquet"))
                else:
                    pq_path = args.site / "parquet" / f"{key}.parquet"
                    files = [pq_path] if pq_path.exists() else []
                if not files:
                    print(f"  {key}: MISMATCH -- no parquet found under {args.site / 'parquet'}")
                    integrity_fail = True
                    continue
                cols = info["columns"]
                csv_head = header_of(current[src])
                missing = [c for c in cols if c not in csv_head]
                if missing:
                    print(f"  {key}: MISMATCH -- parquet columns absent from {src}: {', '.join(missing)}")
                    integrity_fail = True
                    continue
                pq_list = "[" + ", ".join(qlit(f) for f in files) + "]"
                pq_sel = f"SELECT {norm_cols(cols)} FROM read_parquet({pq_list})"
                cs_sel = f"SELECT {norm_cols(cols)} FROM {csv_rel(current[src])}"
                extra = con.execute(
                    f"SELECT count(*) FROM ({pq_sel} EXCEPT ALL {cs_sel})"
                ).fetchone()[0]
                lost = con.execute(
                    f"SELECT count(*) FROM ({cs_sel} EXCEPT ALL {pq_sel})"
                ).fetchone()[0]
                if extra or lost:
                    print(
                        f"  {key}: MISMATCH -- {lost} row(s) in {src} missing from the "
                        f"parquet, {extra} row(s) in the parquet absent from {src}"
                    )
                    integrity_fail = True
                else:
                    n = con.execute(f"SELECT count(*) FROM {csv_rel(current[src])}").fetchone()[0]
                    print(f"  {key}: exact match, {n} row(s) against {src}")
            integrity_checked = True
            print()

    print("== verdicts ==")
    if args.prior:
        print(f"  SCHEMA: {'CHANGED, read the banner above' if schema_changes else 'unchanged'}")
        print("  MOVEMENT: described above; movement is information, not failure")
    else:
        print("  SCHEMA: NOT CHECKED (no --prior)")
        print("  MOVEMENT: NOT CHECKED (no --prior)")
    if integrity_checked:
        print(f"  INTEGRITY: {'MISMATCH' if integrity_fail else 'MATCH'}")
    else:
        print("  INTEGRITY: NOT CHECKED (no --site)")

    sys.exit(1 if integrity_fail else 0)


if __name__ == "__main__":
    main()
