#!/usr/bin/env python3
"""
Transform the monthly CMS nursing-homes theme zip into site data.

Input   data/theme_nursing-homes_current.zip   (committed each month)
Output  public/data/parquet/<table>.parquet            small tables
        public/data/parquet/<table>/<STATE>.parquet    large tables, split by state
        public/data/data-map.json      table index the browser uses to build queries
        public/data/providers-slim.json  compact facility index for the search box
        public/data/downloads/         untouched zip + data dictionary + manifest
        build/providers.json           full ProviderInfo rows for the Next.js build
        build/site-meta.json           provenance for the /data page

Policy: every column is read as text (all_varchar). Nothing is typed,
rounded, computed, or filtered. Leading zeros in CCNs and ZIP codes
survive. Row counts are verified CSV -> Parquet and the build fails on
any mismatch.
"""

from __future__ import annotations

import argparse
import hashlib
import json
import os
import re
import shutil
import sys
import zipfile
from datetime import datetime, timezone
from pathlib import Path

import duckdb

# ---------------------------------------------------------------- config

# Tables whose source CSV exceeds this size are split into one Parquet
# file per state so the browser can range-read a small slice.
# Override with NH_PARTITION_MIN_BYTES (the test fixture sets it low).
PARTITION_MIN_BYTES = int(os.environ.get("NH_PARTITION_MIN_BYTES", 30_000_000))

# Uniform threshold for pre-rendered owner pages: every name connected
# to at least this many distinct facilities gets a static page, no
# exceptions either way. The fixture lowers it to exercise the path.
OWNER_PAGE_MIN = int(os.environ.get("NH_OWNER_PAGE_MIN", 5))

# filename pattern -> (logical table name, human label)
TABLE_PATTERNS: list[tuple[str, str, str]] = [
    (r"^NH_ProviderInfo_", "providers", "Provider information"),
    (r"^NH_HealthCitations_", "health_citations", "Health deficiencies"),
    (r"^NH_FireSafetyCitations_", "fire_safety_citations", "Fire safety deficiencies"),
    (r"^NH_QualityMsr_MDS_", "quality_measures_mds", "MDS quality measures"),
    (r"^NH_QualityMsr_Claims_", "quality_measures_claims", "Claims quality measures"),
    (r"^NH_Ownership_", "ownership", "Ownership"),
    (r"^NH_Penalties_", "penalties", "Penalties"),
    (r"^NH_SurveySummary_", "survey_summary", "Survey summary"),
    (r"^NH_SurveyDates_", "survey_dates", "Survey dates"),
    (r"^NH_StateUSAverages_", "state_us_averages", "State and national averages"),
    (r"^NH_DataCollectionIntervals_", "data_collection_intervals", "Data collection intervals"),
    (r"^NH_CitationDescriptions_", "citation_descriptions", "Citation code descriptions"),
    (r"^NH_HlthInspecCutpointsState_", "health_inspection_cutpoints", "Health inspection cut points"),
    (r"^Skilled_Nursing_Facility_Quality_Reporting_Program_Provider_Data_", "snf_qrp_provider", "SNF quality reporting (per provider)"),
    (r"^Skilled_Nursing_Facility_Quality_Reporting_Program_National_Data_", "snf_qrp_national", "SNF quality reporting (national)"),
    (r"^Swing_Bed_SNF_data_", "swing_bed_snf", "Swing bed SNF data"),
    (r"^FY_\d+_SNF_VBP_Facility_Performance", "snf_vbp_facility", "SNF value-based purchasing (per facility)"),
    (r"^FY_\d+_SNF_VBP_Aggregate_Performance", "snf_vbp_aggregate", "SNF value-based purchasing (aggregate)"),
]

# Files that legitimately appear in the zip without a manifest entry.
EXPECTED_EXTRAS = {"manifest.json"}
DICTIONARY_PATTERN = re.compile(r"data[_ ]?dictionary", re.IGNORECASE)

# Columns the site build requires from ProviderInfo. If CMS renames one,
# fail loudly here instead of building a broken site. Only these six
# hard-fail: they anchor search, joins, and page generation. Every other
# ProviderInfo column the site reads degrades to a blank field plus a
# processing note on the Data page (see lib/data.ts).
SLIM_COLUMNS = [
    "CMS Certification Number (CCN)",
    "Provider Name",
    "City/Town",
    "State",
    "ZIP Code",
    "Overall Rating",
]

CCN_CANDIDATES = ["CMS Certification Number (CCN)", "Federal Provider Number", "CCN"]
STATE_CANDIDATES = ["State", "Provider State"]

warnings: list[str] = []


def warn(msg: str) -> None:
    warnings.append(msg)
    print(f"  WARN  {msg}")


def die(msg: str) -> None:
    print(f"  FAIL  {msg}")
    sys.exit(1)


def qident(name: str) -> str:
    return '"' + name.replace('"', '""') + '"'


def qlit(value: str) -> str:
    return "'" + value.replace("'", "''") + "'"


def sha256_of(path: Path) -> str:
    h = hashlib.sha256()
    with path.open("rb") as f:
        for chunk in iter(lambda: f.read(1 << 20), b""):
            h.update(chunk)
    return h.hexdigest()


def classify(filename: str) -> tuple[str, str]:
    for pattern, name, label in TABLE_PATTERNS:
        if re.match(pattern, filename):
            return name, label
    slug = re.sub(r"_[A-Za-z]{3}\d{4}$", "", Path(filename).stem)
    slug = re.sub(r"[^A-Za-z0-9]+", "_", slug).strip("_").lower() or "unclassified"
    warn(f"unrecognized file {filename}; publishing as table '{slug}'")
    return slug, slug.replace("_", " ").capitalize()


def pick(columns: list[str], candidates: list[str], contains: str | None = None) -> str | None:
    for c in candidates:
        if c in columns:
            return c
    if contains:
        for c in columns:
            if contains.lower() in c.lower():
                return c
    return None


# ---------------------------------------------------------------- steps

def load_manifest(extract_dir: Path) -> tuple[list[dict], dict[str, dict]]:
    mpath = extract_dir / "manifest.json"
    if not mpath.exists():
        warn("manifest.json missing from zip; skipping manifest validation")
        return [], {}
    datasets = json.loads(mpath.read_text(encoding="utf-8"))
    by_file: dict[str, dict] = {}
    for ds in datasets:
        for res in ds.get("resources", []):
            by_file[res["filename"]] = {
                "dataset_name": ds.get("name"),
                "dataset_id": ds.get("dataset_id"),
                "modified_date": ds.get("modified_date"),
                "declared_size": res.get("filesize"),
            }
    return datasets, by_file


def validate_against_manifest(extract_dir: Path, by_file: dict[str, dict]) -> None:
    present = {p.name for p in extract_dir.iterdir() if p.is_file()}
    for filename, meta in by_file.items():
        if filename not in present:
            die(f"manifest lists {filename} but it is not in the zip")
        actual = (extract_dir / filename).stat().st_size
        declared = meta.get("declared_size")
        if declared is not None and int(declared) != actual:
            warn(f"{filename}: size {actual:,} differs from manifest {int(declared):,}")
    for filename in sorted(present - set(by_file)):
        if filename in EXPECTED_EXTRAS or DICTIONARY_PATTERN.search(filename):
            continue
        warn(f"{filename} is in the zip but not in the manifest")


def convert_table(
    con: duckdb.DuckDBPyConnection,
    csv_path: Path,
    table: str,
    parquet_root: Path,
) -> dict:
    """Convert one CSV to Parquet, splitting by state when large. Returns metadata."""
    rel = f"read_csv({qlit(str(csv_path))}, header=true, all_varchar=true)"
    columns = [r[0] for r in con.execute(f"DESCRIBE SELECT * FROM {rel}").fetchall()]
    total = con.execute(f"SELECT count(*) FROM {rel}").fetchone()[0]

    ccn_col = pick(columns, CCN_CANDIDATES, contains="ccn")
    state_col = pick(columns, STATE_CANDIDATES)
    src_bytes = csv_path.stat().st_size
    partition = src_bytes >= PARTITION_MIN_BYTES and state_col is not None and table != "providers"
    if src_bytes >= PARTITION_MIN_BYTES and state_col is None:
        warn(f"{csv_path.name} is large but has no state column; writing a single file")

    written = 0
    out_bytes = 0
    states: list[str] = []

    if partition:
        out_dir = parquet_root / table
        out_dir.mkdir(parents=True, exist_ok=True)
        raw_states = [
            r[0]
            for r in con.execute(
                f"SELECT DISTINCT {qident(state_col)} FROM {rel} "
                f"WHERE {qident(state_col)} IS NOT NULL ORDER BY 1"
            ).fetchall()
        ]
        clean = [s for s in raw_states if re.fullmatch(r"[A-Z]{2}", str(s).strip())]
        for st in clean:
            dest = out_dir / f"{st}.parquet"
            con.execute(
                f"COPY (SELECT * FROM {rel} WHERE {qident(state_col)} = {qlit(st)}) "
                f"TO {qlit(str(dest))} (FORMAT PARQUET, COMPRESSION ZSTD)"
            )
            n = con.execute(f"SELECT count(*) FROM read_parquet({qlit(str(dest))})").fetchone()[0]
            written += n
            out_bytes += dest.stat().st_size
            states.append(st)
        leftover = total - written
        if leftover > 0:
            in_list = ", ".join(qlit(s) for s in clean) or qlit("__none__")
            dest = out_dir / "_OTHER.parquet"
            con.execute(
                f"COPY (SELECT * FROM {rel} WHERE {qident(state_col)} IS NULL "
                f"OR {qident(state_col)} NOT IN ({in_list})) "
                f"TO {qlit(str(dest))} (FORMAT PARQUET, COMPRESSION ZSTD)"
            )
            n = con.execute(f"SELECT count(*) FROM read_parquet({qlit(str(dest))})").fetchone()[0]
            written += n
            out_bytes += dest.stat().st_size
            states.append("_OTHER")
            warn(f"{table}: {n:,} rows had a blank or non-standard state; kept in _OTHER.parquet")
    else:
        dest = parquet_root / f"{table}.parquet"
        dest.parent.mkdir(parents=True, exist_ok=True)
        con.execute(
            f"COPY (SELECT * FROM {rel}) TO {qlit(str(dest))} (FORMAT PARQUET, COMPRESSION ZSTD)"
        )
        written = con.execute(f"SELECT count(*) FROM read_parquet({qlit(str(dest))})").fetchone()[0]
        out_bytes = dest.stat().st_size

    if written != total:
        die(f"{table}: row count mismatch, CSV has {total:,} rows but Parquet has {written:,}")

    return {
        "table": table,
        "mode": "by_state" if partition else "single",
        "path": f"data/parquet/{table}" if partition else f"data/parquet/{table}.parquet",
        "rows": total,
        "columns": columns,
        "ccn_column": ccn_col,
        "state_column": state_col,
        "states": states if partition else None,
        "source_bytes": src_bytes,
        "parquet_bytes": out_bytes,
    }



def export_owners(
    con: duckdb.DuckDBPyConnection,
    csv_path: Path,
    own_meta: dict,
    parquet_root: Path,
    build_dir: Path,
) -> dict | None:
    """Build the artifacts behind the Ownership page: one whole-country
    Parquet of the ownership table, and a small JSON of the largest
    footprints. Rows are regrouped by the exact owner name as published;
    nothing is matched, merged, or edited."""
    if "Owner Name" not in own_meta["columns"]:
        warn("ownership file has no 'Owner Name' column; skipping the owners page artifacts")
        return None
    rel = f"read_csv({qlit(str(csv_path))}, header=true, all_varchar=true)"
    dest = parquet_root / "ownership_all.parquet"
    con.execute(
        f"COPY (SELECT * FROM {rel}) TO {qlit(str(dest))} (FORMAT PARQUET, COMPRESSION ZSTD)"
    )
    n = con.execute(f"SELECT count(*) FROM read_parquet({qlit(str(dest))})").fetchone()[0]
    if n != own_meta["rows"]:
        die(f"ownership_all: row count mismatch, {own_meta['rows']:,} vs {n:,}")

    ccn = qident(own_meta["ccn_column"]) if own_meta["ccn_column"] else "NULL"
    st = qident(own_meta["state_column"]) if own_meta["state_column"] else None
    st_expr = f"count(DISTINCT {st})" if st else "0"
    named = (
        f"SELECT * FROM {rel} WHERE \"Owner Name\" IS NOT NULL "
        f"AND trim(\"Owner Name\") <> '' AND \"Owner Name\" <> 'None'"
    )
    # 150 exported vs 100 rendered on the Owners page: intentional
    # headroom so the page slice can grow without waiting for a rebuild.
    top = con.execute(
        f"SELECT \"Owner Name\", string_agg(DISTINCT coalesce(\"Owner Type\", '')), "
        f"count(DISTINCT {ccn}), {st_expr} FROM ({named}) "
        f"GROUP BY 1 ORDER BY 3 DESC, 1 LIMIT 150"
    ).fetchall()
    total_owners = con.execute(
        f"SELECT count(DISTINCT \"Owner Name\") FROM ({named})"
    ).fetchone()[0]
    blank_rows = own_meta["rows"] - con.execute(
        f"SELECT count(*) FROM ({named})"
    ).fetchone()[0]
    if blank_rows:
        warn(f"ownership: {blank_rows:,} rows have a blank owner name; they appear in facility tables but not on the Owners page")

    # Full owner index for the home-page unified search: every named
    # owner, exact strings, loaded by the browser only when a search
    # begins.
    all_named = con.execute(
        f"SELECT \"Owner Name\", string_agg(DISTINCT coalesce(\"Owner Type\", '')), "
        f"count(DISTINCT {ccn}) FROM ({named}) GROUP BY 1 ORDER BY 1"
    ).fetchall()
    (parquet_root.parent / "owners-slim.json").write_text(
        json.dumps(
            {"columns": ["Owner Name", "Owner Type", "Facilities"], "rows": all_named},
            ensure_ascii=False,
            separators=(",", ":"),
        ),
        encoding="utf-8",
    )

    (build_dir / "owners-top.json").write_text(
        json.dumps(
            {
                "total_owners": total_owners,
                "blank_owner_rows": blank_rows,
                "dataset_name": own_meta.get("dataset_name"),
                "dataset_id": own_meta.get("dataset_id"),
                "modified_date": own_meta.get("modified_date"),
                "source_file": own_meta.get("source_file"),
                "top": [
                    {"name": r[0], "types": r[1], "facilities": r[2], "states": r[3]}
                    for r in top
                ],
            },
            ensure_ascii=False,
            separators=(",", ":"),
        ),
        encoding="utf-8",
    )

    export_owner_pages(con, named, own_meta, build_dir, parquet_root.parent)

    return {
        "label": "Ownership, all states",
        "mode": "single",
        "path": "data/parquet/ownership_all.parquet",
        "rows": own_meta["rows"],
        "columns": own_meta["columns"],
        "ccn_column": own_meta["ccn_column"],
        "state_column": own_meta["state_column"],
        "states": None,
        "dataset_name": own_meta.get("dataset_name"),
        "dataset_id": own_meta.get("dataset_id"),
        "modified_date": own_meta.get("modified_date"),
        "source_file": own_meta.get("source_file"),
        "facility_join": False,
    }


# The previously deployed site is the pipeline's only state. One base
# feeds slug anchoring, the ledger, and the drift notes; the fixture
# points it at local files (or empty to skip), CI at production.
STATE_BASE = os.environ.get("NH_STATE_URL", "https://nursinghomerecords.org/data")


def fetch_state(name: str, consequence: str) -> dict | None:
    """Read one JSON state file from the previously deployed site.
    Empty STATE_BASE skips silently (fixture default); a fetch failure
    degrades to a warn that names the consequence for the reader."""
    if not STATE_BASE:
        return None
    src = f"{STATE_BASE.rstrip('/')}/{name}"
    try:
        if re.match(r"^https?://", src):
            import urllib.request

            with urllib.request.urlopen(src, timeout=30) as r:
                data = json.load(r)
        else:
            data = json.loads(Path(src).read_text(encoding="utf-8"))
        if not isinstance(data, dict):
            raise ValueError("malformed state file")
        return data
    except Exception as exc:
        warn(f"{name} could not be read ({exc}); {consequence}")
        return None


def load_previous_slugs() -> dict[str, str]:
    """The live site's owner slug map, so names keep their URLs."""
    data = fetch_state(
        "owner-slugs.json",
        "previously cited owner URLs may have shifted this batch",
    )
    if not data:
        return {}
    slugs = data.get("slugs", {})
    if not isinstance(slugs, dict):
        warn(
            "owner-slugs.json is malformed; "
            "previously cited owner URLs may have shifted this batch"
        )
        return {}
    return {str(k): str(v) for k, v in slugs.items()}


def export_owner_pages(
    con: duckdb.DuckDBPyConnection,
    named: str,
    own_meta: dict,
    build_dir: Path,
    public_data: Path,
) -> None:
    """One JSON of per-owner rows for every name at the uniform
    OWNER_PAGE_MIN threshold, feeding the pre-rendered /owner/ pages.
    Rows are regrouped by exact name; nothing is matched or edited."""
    page_cols = [
        own_meta["ccn_column"] or "CMS Certification Number (CCN)",
        "Provider Name",
        "City/Town",
        "State",
        "Role played by Owner or Manager in Facility",
        "Ownership Percentage",
        "Association Date",
        "Owner Type",
    ]
    prev = load_previous_slugs()
    slug_file = public_data / "owner-slugs.json"

    def write_slug_map(current: dict[str, str]) -> None:
        # Departed names keep their reservation, so an old URL is never
        # reassigned to a different name.
        merged = dict(current)
        for name, slug in prev.items():
            merged.setdefault(name, slug)
        slug_file.write_text(
            json.dumps({"slugs": merged}, ensure_ascii=False, separators=(",", ":")),
            encoding="utf-8",
        )

    missing = [c for c in page_cols[:5] if c not in own_meta["columns"]]
    empty = {"threshold": OWNER_PAGE_MIN, "owners": []}
    out = build_dir / "owner-pages.json"
    if missing or not own_meta["ccn_column"]:
        warn(
            "ownership file lacks columns needed for owner pages ("
            + ", ".join(missing or ["CCN"])
            + "); skipping them this batch"
        )
        out.write_text(json.dumps(empty, separators=(",", ":")), encoding="utf-8")
        # Carry the anchor map through a degraded batch unchanged, so
        # the chain survives until the columns come back.
        write_slug_map({})
        return

    ccn = qident(own_meta["ccn_column"])
    qualifying = {
        r[0]
        for r in con.execute(
            f"SELECT \"Owner Name\" FROM ({named}) "
            f"GROUP BY 1 HAVING count(DISTINCT {ccn}) >= {OWNER_PAGE_MIN}"
        ).fetchall()
    }
    sel = ", ".join(
        qident(c) if c in own_meta["columns"] else "NULL" for c in page_cols
    )
    by_name: dict[str, list[list]] = {}
    for r in con.execute(f"SELECT \"Owner Name\", {sel} FROM ({named})").fetchall():
        if r[0] in qualifying:
            by_name.setdefault(r[0], []).append(list(r[1:]))

    owners = []
    used: dict[str, int] = {}
    # Every slug ever published stays reserved for its name, so a cited
    # URL can never come to mean a different person or company.
    taken: set[str] = set(prev.values())
    assigned: set[str] = set()
    for name in sorted(by_name):
        slug = prev.get(name)
        if not slug or slug in assigned:
            base = re.sub(r"[^a-z0-9]+", "-", name.lower()).strip("-") or "owner"
            n = used.get(base, 0) + 1
            slug = base if n == 1 else f"{base}-{n}"
            # A published name can naturally end in -<digits>, and past
            # batches hold reservations; probe the whole set.
            while slug in taken or slug in assigned:
                n += 1
                slug = f"{base}-{n}"
            used[base] = n
        assigned.add(slug)
        rows = by_name[name]
        rows.sort(key=lambda x: (x[3] or "", x[2] or "", x[1] or "", x[4] or ""))
        owners.append(
            {
                "name": name,
                "slug": slug,
                "types": sorted({x[7] for x in rows if x[7]}),
                "facilities": len({x[0] for x in rows}),
                "states": len({x[3] for x in rows if x[3] and str(x[3]).strip()}),
                "rows": rows,
            }
        )
    out.write_text(
        json.dumps(
            {"threshold": OWNER_PAGE_MIN, "owners": owners},
            ensure_ascii=False,
            separators=(",", ":"),
        ),
        encoding="utf-8",
    )
    write_slug_map({o["name"]: o["slug"] for o in owners})
    anchored = sum(1 for o in owners if prev.get(o["name"]) == o["slug"])
    print(
        f"  owner pages: {len(owners):,} names at the {OWNER_PAGE_MIN}+ facility "
        f"threshold ({anchored:,} slugs anchored to the previous batch)"
    )


def export_providers(con: duckdb.DuckDBPyConnection, csv_path: Path, build_dir: Path, public_data: Path) -> None:
    rel = f"read_csv({qlit(str(csv_path))}, header=true, all_varchar=true)"
    columns = [r[0] for r in con.execute(f"DESCRIBE SELECT * FROM {rel}").fetchall()]
    missing = [c for c in SLIM_COLUMNS if c not in columns]
    if missing:
        die(
            "ProviderInfo is missing columns the site needs: "
            + ", ".join(missing)
            + ". CMS may have renamed them; update SLIM_COLUMNS and lib/data.ts together."
        )
    order = qident(SLIM_COLUMNS[1])
    rows = con.execute(f"SELECT * FROM {rel} ORDER BY {order}").fetchall()
    (build_dir / "providers.json").write_text(
        json.dumps({"columns": columns, "rows": rows}, ensure_ascii=False, separators=(",", ":")),
        encoding="utf-8",
    )
    slim_sel = ", ".join(qident(c) for c in SLIM_COLUMNS)
    slim_rows = con.execute(f"SELECT {slim_sel} FROM {rel} ORDER BY {order}").fetchall()
    (public_data / "providers-slim.json").write_text(
        json.dumps({"columns": SLIM_COLUMNS, "rows": slim_rows}, ensure_ascii=False, separators=(",", ":")),
        encoding="utf-8",
    )


def record_history(
    data_map: dict,
    source_zip: dict,
    tables: list[dict],
    file_hashes: dict[str, str],
    public_data: Path,
) -> None:
    """The integrity layer: drift notes against the previously served
    batch, and an append-only ledger of every served build. Both read
    the live site's own state; both degrade to a note, never a dead
    build. The ledger proves this mirror's history, not CMS's."""
    prev_map = fetch_state(
        "data-map.json",
        "batch comparison unavailable this build; "
        "structural changes since the last batch are not reported",
    )
    prev_ledger = fetch_state(
        "ledger.json",
        "ledger history unavailable this build; the chain restarts from this entry",
    )

    # Drift notes: structure only. Row-count deltas are normal monthly
    # movement and stay deliberately silent (retention is a deferred
    # feature; its fence is not crossed here).
    if prev_map:
        cur = data_map["tables"]
        prev = prev_map.get("tables", {})
        for t in sorted(set(cur) - set(prev)):
            warn(f"batch change: new table '{t}' ({cur[t]['source_file']})")
        for t in sorted(set(prev) - set(cur)):
            warn(f"batch change: table '{t}' from the previous batch is absent")
        for t in sorted(set(cur) & set(prev)):
            cur_cols = set(cur[t]["columns"])
            prev_cols = set(prev[t].get("columns", []))
            added = sorted(cur_cols - prev_cols)
            removed = sorted(prev_cols - cur_cols)
            if added:
                warn(f"batch change: {t} added column(s): " + ", ".join(added))
            if removed:
                warn(f"batch change: {t} removed column(s): " + ", ".join(removed))
            pm = prev[t].get("modified_date")
            cm = cur[t].get("modified_date")
            if pm and cm and cm < pm:
                warn(f"batch change: {t} modified_date moved backward ({pm} -> {cm})")

    entries = list(prev_ledger.get("entries", [])) if prev_ledger else []

    # Same filename, different content: only detectable via the ledger's
    # per-file hashes, and the reason they exist.
    if entries:
        prev_files = entries[-1].get("files", {})
        for fname in sorted(file_hashes):
            p = prev_files.get(fname)
            if p and p.get("sha256") and p["sha256"] != file_hashes[fname]:
                warn(
                    f"batch change: {fname} content changed although its "
                    "filename did not"
                )

    by_file = {t["source_file"]: t for t in tables}
    entries.append(
        {
            "generated_at": data_map["generated_at"],
            "trigger": os.environ.get("GITHUB_EVENT_NAME", "local"),
            "commit": os.environ.get("GITHUB_SHA", ""),
            "source_zip": source_zip,
            "files": {
                fname: {
                    "sha256": file_hashes[fname],
                    "rows": by_file.get(fname, {}).get("rows"),
                    "modified_date": by_file.get(fname, {}).get("modified_date"),
                }
                for fname in sorted(file_hashes)
            },
        }
    )
    (public_data / "ledger.json").write_text(
        json.dumps({"entries": entries}, ensure_ascii=False, separators=(",", ":")),
        encoding="utf-8",
    )
    print(f"  ledger: {len(entries)} served build(s) on record")


# ---------------------------------------------------------------- main

def main() -> None:
    parser = argparse.ArgumentParser(description=__doc__)
    parser.add_argument("--zip", dest="zip_path", default=None, help="path to the theme zip (default: newest zip in data/)")
    parser.add_argument("--root", default=None, help="repo root (default: parent of this script's directory)")
    args = parser.parse_args()

    root = Path(args.root) if args.root else Path(__file__).resolve().parent.parent
    if args.zip_path:
        zip_path = Path(args.zip_path)
    else:
        zips = sorted((root / "data").glob("*.zip"), key=lambda p: p.stat().st_mtime)
        if not zips:
            die("no zip found in data/; commit the monthly theme zip there")
        zip_path = zips[-1]
    if not zip_path.exists():
        die(f"{zip_path} does not exist")

    public_data = root / "public" / "data"
    build_dir = root / "build"
    extract_dir = build_dir / "extract"
    parquet_root = public_data / "parquet"
    downloads = public_data / "downloads"
    for d in (public_data, extract_dir):
        if d.exists():
            shutil.rmtree(d)
    for d in (parquet_root, downloads, build_dir, extract_dir):
        d.mkdir(parents=True, exist_ok=True)

    print(f"Source  {zip_path.name}  ({zip_path.stat().st_size:,} bytes)")
    zip_hash = sha256_of(zip_path)
    print(f"sha256  {zip_hash}")

    file_hashes: dict[str, str] = {}
    with zipfile.ZipFile(zip_path) as zf:
        seen: dict[str, str] = {}
        for info in zf.infolist():
            name = Path(info.filename).name  # flatten; refuse path tricks
            if not name or info.is_dir():
                continue
            if name in seen:
                die(
                    f"zip entries {seen[name]!r} and {info.filename!r} flatten to the "
                    f"same name {name!r}; one would silently overwrite the other"
                )
            seen[name] = info.filename
            with zf.open(info) as src, (extract_dir / name).open("wb") as dst:
                shutil.copyfileobj(src, dst)
            file_hashes[name] = sha256_of(extract_dir / name)

    datasets, by_file = load_manifest(extract_dir)
    validate_against_manifest(extract_dir, by_file)

    con = duckdb.connect()
    tables: list[dict] = []
    providers_csv: Path | None = None
    ownership_meta: dict | None = None

    for csv_path in sorted(extract_dir.glob("*.csv")):
        table, label = classify(csv_path.name)
        print(f"  {csv_path.name}  ->  {table}")
        meta = convert_table(con, csv_path, table, parquet_root)
        src_info = by_file.get(csv_path.name, {})
        meta.update(
            label=label,
            source_file=csv_path.name,
            dataset_name=src_info.get("dataset_name"),
            dataset_id=src_info.get("dataset_id"),
            modified_date=src_info.get("modified_date"),
            facility_join=bool(meta["ccn_column"]) and table != "providers",
        )
        tables.append(meta)
        if table == "providers":
            providers_csv = csv_path
        if table == "ownership":
            ownership_meta = meta

    if providers_csv is None:
        die("no NH_ProviderInfo file found; the site cannot build without it")
    export_providers(con, providers_csv, build_dir, public_data)
    owners_extra = None
    if ownership_meta is not None:
        owners_extra = export_owners(
            con, extract_dir / ownership_meta["source_file"], ownership_meta,
            parquet_root, build_dir,
        )

    # untouched originals for the downloads page
    shutil.copy2(zip_path, downloads / zip_path.name)
    for p in extract_dir.iterdir():
        if DICTIONARY_PATTERN.search(p.name) or p.name == "manifest.json":
            shutil.copy2(p, downloads / p.name)

    data_map = {
        "generated_at": datetime.now(timezone.utc).isoformat(timespec="seconds"),
        "tables": {
            t["table"]: {
                k: t[k]
                for k in (
                    "label", "mode", "path", "rows", "columns", "ccn_column",
                    "state_column", "states", "dataset_name", "dataset_id",
                    "modified_date", "source_file", "facility_join",
                )
            }
            for t in tables
        },
    }
    if owners_extra is not None:
        data_map["tables"]["ownership_all"] = owners_extra
    (public_data / "data-map.json").write_text(
        json.dumps(data_map, ensure_ascii=False, separators=(",", ":")), encoding="utf-8"
    )

    source_zip = {
        "filename": zip_path.name,
        "bytes": zip_path.stat().st_size,
        "sha256": zip_hash,
    }
    record_history(data_map, source_zip, tables, file_hashes, public_data)

    site_meta = {
        "generated_at": data_map["generated_at"],
        "source_zip": source_zip,
        "downloads": sorted(p.name for p in downloads.iterdir()),
        "datasets": datasets,
        "tables": [
            {k: t[k] for k in (
                "table", "label", "source_file", "dataset_id", "modified_date",
                "rows", "mode", "source_bytes", "parquet_bytes",
            )}
            for t in tables
        ],
        "warnings": warnings,
    }
    (build_dir / "site-meta.json").write_text(
        json.dumps(site_meta, ensure_ascii=False, indent=1), encoding="utf-8"
    )
    # Same provenance, machine-readable and deployed, so scripts and the
    # future integrity ledger can read the live site's state.
    (public_data / "build.json").write_text(
        json.dumps(site_meta, ensure_ascii=False, separators=(",", ":")),
        encoding="utf-8",
    )

    print()
    print(f"{'table':32} {'rows':>10} {'csv':>12} {'parquet':>12}  mode")
    for t in sorted(tables, key=lambda x: -x["rows"]):
        print(
            f"{t['table']:32} {t['rows']:>10,} {t['source_bytes']:>12,} "
            f"{t['parquet_bytes']:>12,}  {t['mode']}"
        )
    total_src = sum(t["source_bytes"] for t in tables)
    total_out = sum(t["parquet_bytes"] for t in tables)
    print(f"{'total':32} {'':>10} {total_src:>12,} {total_out:>12,}")
    print(f"\nDone. {len(warnings)} warning(s).")


if __name__ == "__main__":
    main()
