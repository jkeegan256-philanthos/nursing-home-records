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
        state/                         committed fallback copy of the carried state

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
ROLE_CANDIDATES = ["Role played by Owner or Manager in Facility", "Role"]
OWNER_TYPE_CANDIDATES = ["Owner Type"]

# The Methods page teaches that a role is not an ownership stake. That
# claim needs a figure, and a figure needs a rule for which published
# roles are ownership. CMS's own vocabulary supplies one: the four
# ownership roles all contain the words "ownership interest", while
# MORTGAGE INTEREST, SECURITY INTEREST and the partnership interests
# do not. Matching that substring is mechanical and quotable, so the
# page can state the rule instead of asking a reader to trust a
# judgement about what the strings mean. Anything looser would be
# this project inferring ownership, which principle 2 forbids.
OWNERSHIP_ROLE_MARKER = "OWNERSHIP INTEREST"
# A name has to appear at this many facilities before its capacity mix
# is interesting. Uniform threshold, applied to every name alike.
# Override with NH_METHODS_FACILITY_MIN, exactly as NH_PARTITION_MIN_BYTES
# is overridden: the fixture sets it low so CI renders the populated
# branch of the Methods page. Without that, the only execution of the
# populated path would be in production, which is the situation the
# origin check and the render check were both built to eliminate.
METHODS_FACILITY_THRESHOLD = int(os.environ.get("NH_METHODS_FACILITY_MIN", 50))

warnings: list[str] = []

# Headline numbers this site derives from the batch and shows to readers.
# Recorded in every ledger entry so the next build can ask the one
# question the pipeline could not previously answer about itself: when a
# count moves, was it CMS or was it us?
#
# The discriminator needs no thresholds and no judgement. A count that
# moved while its source file is byte-identical cannot have moved because
# the data changed, so it moved because this code changed, and that is
# always a defect. A count that moved alongside a changed source file is
# ordinary monthly movement and stays silent -- deliberately, because
# reporting normal volume change to readers is the noise the Release 3
# spec was right to refuse. This is a diagnostic that never reaches a
# reader; it only ever stops a build.
derived_counts: dict[str, dict] = {}

# The one deliberate way past it, same shape as NH_STATE_BOOTSTRAP: never
# set in the deploy workflow, so an intentional change becomes a recorded
# decision instead of a silent pass.
COUNT_DRIFT_OVERRIDE = os.environ.get("NH_ALLOW_COUNT_DRIFT", "") not in ("", "0")


def record_count(
    name: str, value: int, source_file: str | None, table: str | None = None
) -> None:
    derived_counts[name] = {
        "value": int(value),
        "source_file": source_file,
        "table": table,
    }



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
    # Partition on the trimmed value, never on the raw one. A published
    # " UT " passes a stripped validity check and then becomes a
    # filename with spaces in it, splitting one state across two files
    # that no page knows to ask for. Choosing which file a row goes in
    # is not editing the row: the value inside the Parquet stays exactly
    # as CMS published it, spaces and all.
    state_expr = f"trim({qident(state_col)})" if state_col else None
    src_bytes = csv_path.stat().st_size
    # providers is never split whatever its size: the build reads it
    # whole for page generation and the search index, so a shard
    # layout would serve nobody and complicate the one table
    # everything joins against.
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
                f"SELECT DISTINCT {state_expr} FROM {rel} "
                f"WHERE {state_expr} IS NOT NULL ORDER BY 1"
            ).fetchall()
        ]
        clean = [s for s in raw_states if re.fullmatch(r"[A-Z]{2}", str(s))]
        for st in clean:
            dest = out_dir / f"{st}.parquet"
            con.execute(
                f"COPY (SELECT * FROM {rel} WHERE {state_expr} = {qlit(st)}) "
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
                f"COPY (SELECT * FROM {rel} WHERE {state_expr} IS NULL "
                f"OR {state_expr} NOT IN ({in_list})) "
                f"TO {qlit(str(dest))} (FORMAT PARQUET, COMPRESSION ZSTD)"
            )
            n = con.execute(f"SELECT count(*) FROM read_parquet({qlit(str(dest))})").fetchone()[0]
            written += n
            out_bytes += dest.stat().st_size
            states.append("_OTHER")
            warn(
                f"{table}: {n:,} rows had a blank or non-standard state; kept in "
                f"_OTHER.parquet and shown on facility pages alongside the "
                f"state file"
            )
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



def export_methods_figures(
    con: duckdb.DuckDBPyConnection,
    named: str,
    own_meta: dict,
    build_dir: Path,
) -> None:
    """Derive the figures the Methods page teaches from, at build time.

    Every number on that page is a fact about the batch being served, so
    none of them can be transcribed from a previous batch or from a
    conversation. CMS rotates the file monthly and the figures move with
    it: on 2026-08-26 a rotation moved facilities by three and one firm's
    footprint by one, within a day. A hardcoded figure is a claim about a
    batch that is no longer the one on the page.

    Two figures, both counts and groupings over published fields, which
    is what principle 1 permits. Nothing here scores, ranks, or infers.
    """
    ccn_col = own_meta.get("ccn_column")
    role_col = pick(own_meta["columns"], ROLE_CANDIDATES, contains="role")
    type_col = pick(own_meta["columns"], OWNER_TYPE_CANDIDATES, contains="owner type")
    out = build_dir / "methods.json"

    if not (ccn_col and role_col and type_col):
        # The page renders its prose and omits the figure rather than
        # guessing. Absence is a shape: say which column was missing.
        missing = [
            n
            for n, v in (("CCN", ccn_col), ("role", role_col), ("owner type", type_col))
            if not v
        ]
        warn(
            f"methods figures: ownership file has no {', '.join(missing)} column; "
            f"the Methods page will omit the capacity figure"
        )
        out.write_text(
            json.dumps({"capacity": None, "source_file": own_meta.get("source_file")}),
            encoding="utf-8",
        )
        return

    ccn = qident(ccn_col)
    role = qident(role_col)
    otype = qident(type_col)
    marker = qlit(f"%{OWNERSHIP_ROLE_MARKER}%")
    n = int(METHODS_FACILITY_THRESHOLD)

    # One pass: per individual, how many facilities, and at how many of
    # them does any role carry the ownership marker.
    row = con.execute(
        f"""
        WITH per_name AS (
          SELECT "Owner Name" AS name,
                 count(DISTINCT {ccn}) AS facilities,
                 count(DISTINCT CASE WHEN upper({role}) LIKE {marker}
                                     THEN {ccn} END) AS owning_facilities
          FROM ({named})
          WHERE upper(trim(coalesce({otype}, ''))) = 'INDIVIDUAL'
          GROUP BY 1
        ), wide AS (
          SELECT * FROM per_name WHERE facilities >= {n}
        )
        SELECT
          (SELECT count(*) FROM wide),
          (SELECT count(*) FROM wide WHERE owning_facilities = 0),
          (SELECT count(*) FROM wide WHERE owning_facilities > 0),
          (SELECT count(*) FROM wide
             WHERE owning_facilities > 0 AND owning_facilities < facilities)
        """
    ).fetchone()

    people, none_owning, some_owning, mixed = (int(x) for x in row)
    payload = {
        "capacity": {
            "threshold": n,
            "people": people,
            "none_owning": none_owning,
            "some_owning": some_owning,
            "mixed": mixed,
            "role_column": role_col,
            "owner_type_column": type_col,
            "ownership_marker": OWNERSHIP_ROLE_MARKER,
        },
        "source_file": own_meta.get("source_file"),
        "modified_date": own_meta.get("modified_date"),
    }
    out.write_text(json.dumps(payload, ensure_ascii=False, separators=(",", ":")), encoding="utf-8")
    print(
        f"  methods: {people:,} individuals at {n}+ facilities; "
        f"{none_owning:,} with no {OWNERSHIP_ROLE_MARKER.lower()} role, "
        f"{mixed:,} of {some_owning:,} holding one at only some"
    )


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
    # trim() so " UT " and "UT" are not counted as two states.
    st_expr = f"count(DISTINCT trim({st}))" if st else "0"
    # The Owners page groups named owners. Excluded, per the 2026-08-30
    # ruling in DECISIONS.md: NULL, whitespace-only, and the literal
    # string 'None', which is CMS's published no-owner convention;
    # grouping it as an owner would present a convention as a person.
    # The excluded rows stay in every facility table and every CSV.
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
    record_count("ownership_rows", own_meta["rows"], own_meta.get("source_file"), "ownership")
    record_count("named_owners", total_owners, own_meta.get("source_file"), "ownership")
    blank_rows = own_meta["rows"] - con.execute(
        f"SELECT count(*) FROM ({named})"
    ).fetchone()[0]
    if blank_rows:
        warn(
            f"ownership: {blank_rows:,} rows carry no owner name (blank, or "
            f"the literal 'None', CMS's no-owner convention); they appear in "
            f"facility tables but not on the Owners page"
        )

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

    export_methods_figures(con, named, own_meta, build_dir)

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


# Carried state: the slug reservations, the ledger chain, and the
# previous data map. It lives in two places on purpose. The deployed
# site is authoritative, because it is what readers actually got; the
# committed copy under state/ is the fallback, because a site is not a
# safe place to keep the only copy of the history of that site.
#
# NH_STATE_URL points at the deployed copy; empty opts out entirely
# (the fixture's default) and carries no state at all.
STATE_BASE = os.environ.get("NH_STATE_URL", "https://nursinghomerecords.org/data")

# The committed fallback. Written after every state-carrying build so
# the workflow can commit it; read when the deployed copy cannot be.
# main() re-points this at --root when one is given.
STATE_DIR = Path(__file__).resolve().parent.parent / "state"

# The one deliberate way to start a chain from nothing: a first build,
# or a fork that means to keep its own history rather than inherit one.
# Never set in the deploy workflow, so production cannot reach it by
# accident.
STATE_BOOTSTRAP = os.environ.get("NH_STATE_BOOTSTRAP", "") not in ("", "0")

# Only a build that can actually be deployed writes the committed
# fallback. A local `npm run data` must never leave a state/ behind
# claiming a batch nobody served -- the fallback's whole value is that
# it records what readers got.
STATE_SAVE = bool(os.environ.get("GITHUB_ACTIONS")) or os.environ.get(
    "NH_STATE_SAVE", ""
) not in ("", "0")


def _read_json_dict(src: str, timeout: int = 30) -> dict:
    if re.match(r"^https?://", src):
        import urllib.request

        with urllib.request.urlopen(src, timeout=timeout) as r:
            data = json.load(r)
    else:
        data = json.loads(Path(src).read_text(encoding="utf-8"))
    if not isinstance(data, dict):
        raise ValueError("malformed state file")
    return data


# Carried state is read once per name and reused: the preflight below
# resolves all three before the transform starts, so an unreachable
# source costs seconds instead of the whole batch.
_STATE_CACHE: dict[str, dict | None] = {}

# Every carried-state file, in the order a reader would miss them.
STATE_FILES = ("owner-slugs.json", "ledger.json", "data-map.json")


def fetch_state(name: str) -> dict | None:
    """Read one carried-state file: deployed copy first, committed copy
    second, and a dead build third.

    The third case is the point. This state is append-only by design --
    the ledger chain and the slug reservations that keep a cited owner
    URL meaning the same name -- so continuing without it does not
    produce a dented page the way a renamed CMS column does. It produces
    a build that silently and permanently truncates the history it was
    supposed to be keeping, and then deploys that truncation as the new
    truth. A red build is recoverable; a green one here is not."""
    if not STATE_BASE:
        return None
    if name in _STATE_CACHE:
        return _STATE_CACHE[name]
    value = _fetch_state_uncached(name)
    _STATE_CACHE[name] = value
    return value


def _absent_not_unreachable(src: str, exc: Exception) -> bool:
    """Did the source answer and say the file is not there?

    The whole fail-closed policy turns on this. A source that answers
    404 is telling us the truth: this file has never been published, and
    a chain that has not started cannot be truncated. A source that
    times out, refuses the connection, or does not resolve is telling us
    nothing, and continuing on nothing is the disaster case."""
    import urllib.error

    if re.match(r"^https?://", src):
        return isinstance(exc, urllib.error.HTTPError) and exc.code == 404
    # Local path: the directory answering while the file is missing is
    # the same statement a 404 makes.
    return isinstance(exc, FileNotFoundError) and Path(src).parent.is_dir()


def _fetch_state_uncached(name: str) -> dict | None:
    src = f"{STATE_BASE.rstrip('/')}/{name}"
    try:
        return _read_json_dict(src)
    except Exception as exc:
        live_error = exc
        absent = _absent_not_unreachable(src, exc)

    local = STATE_DIR / name
    try:
        data = _read_json_dict(str(local))
        warn(
            f"{name}: the deployed copy could not be read ({live_error}); "
            f"falling back to the committed copy in state/, which may be one "
            f"batch behind"
        )
        return data
    except FileNotFoundError:
        pass
    except Exception as exc:
        die(
            f"{name}: the deployed copy could not be read ({live_error}) and "
            f"the committed copy in state/ is unreadable ({exc}). Refusing to "
            f"build on no carried state."
        )

    if absent:
        warn(
            f"{name}: not published at {STATE_BASE.rstrip('/')} yet and none "
            f"committed in state/; this file's chain starts with this build"
        )
        return None

    if STATE_BOOTSTRAP:
        warn(
            f"{name}: unreachable ({live_error}) and none committed in state/; "
            f"starting a fresh chain because NH_STATE_BOOTSTRAP is set"
        )
        return None

    die(
        f"{name}: unreachable at {src} ({live_error}), and no committed "
        f"copy exists at {local}. Refusing to build: continuing here would "
        f"restart the ledger chain and drop every owner-slug reservation, "
        f"silently and permanently. Re-run once the source is reachable, or "
        f"set NH_STATE_BOOTSTRAP=1 to start a new chain on purpose."
    )
    return None  # unreachable; die() exits


# What each carried-state file looks like when a build legitimately
# produces none of it -- a deployment with no ownership file has no slug
# reservations. Recording that emptiness is not fabricating state; it is
# the difference between "this chain is empty" and "this chain is
# unreachable", and without it the first unreachable source would fail
# every later build over a file that never existed.
STATE_EMPTY: dict[str, dict] = {
    "owner-slugs.json": {"slugs": {}},
    "ledger.json": {"entries": []},
    "data-map.json": {"tables": {}},
}


def save_state(public_data: Path) -> None:
    """Snapshot what this build is about to serve into the committed
    fallback, so the next build has a second place to read it from.
    Skipped entirely when state carrying is off (the fixture) or when
    this build cannot deploy, which is why neither a fixture run nor a
    local `npm run data` ever touches state/."""
    if not STATE_BASE or not STATE_SAVE:
        return
    STATE_DIR.mkdir(parents=True, exist_ok=True)
    saved, empty = [], []
    for name in STATE_FILES:
        src = public_data / name
        if src.exists():
            shutil.copy2(src, STATE_DIR / name)
            saved.append(name)
        else:
            (STATE_DIR / name).write_text(
                json.dumps(STATE_EMPTY[name], separators=(",", ":")),
                encoding="utf-8",
            )
            empty.append(name)
    note = f"  state: {', '.join(saved)} snapshotted to state/"
    if empty:
        note += f" ({', '.join(empty)} recorded empty, not produced this batch)"
    print(note)


def load_previous_slugs() -> dict[str, str]:
    """The live site's owner slug map, so names keep their URLs."""
    data = fetch_state("owner-slugs.json")
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
                "states": len({str(x[3]).strip() for x in rows if x[3] and str(x[3]).strip()}),
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
    record_count("owner_pages", len(owners), own_meta.get("source_file"), "ownership")
    write_slug_map({o["name"]: o["slug"] for o in owners})
    anchored = sum(1 for o in owners if prev.get(o["name"]) == o["slug"])
    print(
        f"  owner pages: {len(owners):,} names at the {OWNER_PAGE_MIN}+ facility "
        f"threshold ({anchored:,} slugs anchored to the previous batch)"
    )


def export_state_averages(
    con: duckdb.DuckDBPyConnection, csv_path: Path, meta: dict, build_dir: Path
) -> None:
    """Pass CMS's state and national averages through to the site build.

    The whole file, every row and column as text, because the state page
    shows a curated slice with the full published row one click below,
    and the curation is the page's choice, not the transform's. CMS
    computed these numbers, so displaying them is principle 1's
    "CMS's own, shown as published", never arithmetic of ours."""
    rel = f"read_csv({qlit(str(csv_path))}, header=true, all_varchar=true)"
    rows = con.execute(f"SELECT * FROM {rel}").fetchall()
    (build_dir / "state-averages.json").write_text(
        json.dumps(
            {
                "columns": meta["columns"],
                "rows": rows,
                "dataset_name": meta.get("dataset_name"),
                "dataset_id": meta.get("dataset_id"),
                "modified_date": meta.get("modified_date"),
                "source_file": meta.get("source_file"),
            },
            ensure_ascii=False,
            separators=(",", ":"),
        ),
        encoding="utf-8",
    )
    print(f"  state averages: {len(rows)} row(s) passed through for the state pages")


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
    record_count("facilities", len(rows), csv_path.name, "providers")
    record_count(
        "states",
        con.execute(
            f'SELECT count(DISTINCT trim("State")) FROM {rel} '
            f'WHERE trim("State") <> \'\''
        ).fetchone()[0],
        csv_path.name,
        "providers",
    )
    slim_rows = con.execute(f"SELECT {slim_sel} FROM {rel} ORDER BY {order}").fetchall()
    (public_data / "providers-slim.json").write_text(
        json.dumps({"columns": SLIM_COLUMNS, "rows": slim_rows}, ensure_ascii=False, separators=(",", ":")),
        encoding="utf-8",
    )


def check_count_drift(entries: list[dict], file_hashes: dict[str, str]) -> list[str]:
    """Did a headline count move without its source moving?

    A count and the bytes it was derived from travel together. If the
    bytes are identical and the count is not, nothing about CMS's data
    explains it, so this code explains it, and a pipeline whose whole
    product is fidelity has no business deploying that quietly.

    Each count is compared against the most recent earlier build that
    saw the same source file at the same hash -- not merely the previous
    build -- so an unrelated batch in between cannot hide a regression.
    In practice CMS stamps its filenames with the month, which means
    this is silent across a monthly refresh (new filename, nothing to
    compare) and loud across a code deploy on an unchanged batch, which
    is exactly the polarity wanted: the second case is the only one
    where the pipeline can be at fault.

    Returns the drifts allowed through by NH_ALLOW_COUNT_DRIFT, for the
    caller to write into the ledger entry."""
    defects: list[str] = []
    allowed: list[str] = []

    for name, cur in sorted(derived_counts.items()):
        src = cur.get("source_file")
        if not src or src not in file_hashes:
            continue
        now_hash = file_hashes[src]
        # Walk back to the newest build that read this exact file.
        for past in reversed(entries):
            prev_file = (past.get("files") or {}).get(src)
            if not prev_file or prev_file.get("sha256") != now_hash:
                continue
            was = (past.get("counts") or {}).get(name)
            if not was or was.get("value") == cur["value"]:
                break
            msg = (
                f"{name}: {was['value']:,} -> {cur['value']:,} while {src} is "
                f"byte-identical to the build of {past.get('generated_at')} "
                f"({now_hash[:12]})"
            )
            (allowed if COUNT_DRIFT_OVERRIDE else defects).append(msg)
            break

    # The blind spot, instrumented rather than papered over. CMS stamps
    # every filename with the month, so at a monthly refresh there is no
    # same-hash predecessor and the comparison above has nothing to say
    # -- which is to say the check is silent at the one moment the data
    # actually turns over. Discrimination is genuinely impossible there,
    # so this reports the movement and attaches no verdict. A maintainer
    # reading "named owners 62,077 -> 62,431" moves on; one reading
    # "62,077 -> 41,002" investigates. The human is the discriminator
    # because nothing else can be, and saying so is more honest than a
    # threshold pretending to be knowledge.
    for name, cur in sorted(derived_counts.items()):
        if any(name in d for d in defects + allowed):
            continue
        src = cur.get("source_file")
        if not src or src not in file_hashes:
            continue
        if any(
            (past.get("files") or {}).get(src, {}).get("sha256") == file_hashes[src]
            for past in entries
        ):
            continue  # same file seen before; the check above already spoke
        for past in reversed(entries):
            was = (past.get("counts") or {}).get(name)
            if not was:
                continue
            if was.get("value") != cur["value"]:
                warn(
                    f"batch change: {name.replace('_', ' ')} "
                    f"{was['value']:,} -> {cur['value']:,} "
                    f"({was.get('source_file')} -> {src}). A new source file, "
                    f"so this is CMS's change to read, not a defect; no check "
                    f"can tell a data change from a pipeline change here."
                )
            break

    for msg in allowed:
        warn(f"count drift allowed by NH_ALLOW_COUNT_DRIFT: {msg}")

    if defects:
        die(
            "a published count changed while its source file did not:\n    "
            + "\n    ".join(defects)
            + "\n  CMS cannot have caused this, so this pipeline did, and a "
            "count that moves for our reasons is a fidelity defect rather "
            "than a batch. Find the change. If it is genuinely intended, "
            "NH_ALLOW_COUNT_DRIFT=1 lets it through and records it in the "
            "ledger entry as a decision."
        )
    return allowed


def record_history(
    data_map: dict,
    source_zip: dict,
    tables: list[dict],
    file_hashes: dict[str, str],
    public_data: Path,
) -> None:
    """The integrity layer: drift notes against the previously served
    batch, and an append-only ledger of every served build. Both read
    carried state -- the deployed copy first, the committed copy in
    state/ second -- and fetch_state() stops the build rather than
    continue on neither, because a ledger that quietly restarts is worse
    than no ledger at all. The ledger proves this mirror's history, not
    CMS's."""
    prev_map = fetch_state("data-map.json")
    prev_ledger = fetch_state("ledger.json")

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

        # The zip's sha256 identifies the archive; the per-file hashes
        # identify the data. When the first moves and the second does
        # not, the build has to say which of the two happened, because
        # a ledger reader who takes the zip hash as the data's identity
        # will call it a rotation. CMS did exactly this on 2026-08-27:
        # regenerated the container, published nothing. And manifest.json
        # is not a mere envelope -- its per-dataset modified dates are
        # what the site displays -- so a manifest-only change is
        # reader-visible and gets named as its own mode.
        prev_zip = (entries[-1].get("source_zip") or {}).get("sha256")
        if prev_zip and prev_zip != source_zip["sha256"]:
            prev_names = set(prev_files)
            cur_names = set(file_hashes)
            identical = {
                f
                for f in cur_names & prev_names
                if (prev_files[f] or {}).get("sha256") == file_hashes[f]
            }
            if prev_names == cur_names and identical == cur_names:
                warn(
                    "the source zip was repackaged: its checksum changed "
                    f"while all {len(cur_names)} files inside are "
                    "byte-identical to the previous build. The archive is "
                    "new; the data is not."
                )
            elif (
                prev_names - {"manifest.json"} == cur_names - {"manifest.json"}
                and cur_names - {"manifest.json"} <= identical
            ):
                warn(
                    "catalog metadata revised: manifest.json changed while "
                    "every dataset file is byte-identical to the previous "
                    "build. The manifest carries the per-dataset modified "
                    "dates this site displays, so the displayed vintage "
                    "may have shifted while the data did not."
                )

    overrides = check_count_drift(entries, file_hashes)

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
            "counts": dict(derived_counts),
            **({"count_drift_override": overrides} if overrides else {}),
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
    global STATE_DIR
    STATE_DIR = root / "state"
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

    # Resolve the carried state before doing any work. fetch_state()
    # stops the build when a file is readable from neither source, and
    # finding that out now costs seconds rather than a whole transform.
    if STATE_BASE:
        for name in STATE_FILES:
            fetch_state(name)

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

    # Two files that classify to one table name would write the same
    # Parquet path and collapse to one data-map key, last one wins, with
    # every per-file row count still passing. The zip extractor already
    # refuses two entries that flatten to one filename; this is the same
    # guard one level up. It is not hypothetical: the SNF VBP patterns
    # match any fiscal year, so a zip published across a year boundary
    # carrying FY2026 and FY2027 would silently drop one.
    seen_tables: dict[str, str] = {}

    for csv_path in sorted(extract_dir.glob("*.csv")):
        table, label = classify(csv_path.name)
        if table in seen_tables:
            die(
                f"{seen_tables[table]!r} and {csv_path.name!r} both map to the "
                f"table {table!r}; one would silently overwrite the other. Give "
                f"them distinct entries in TABLE_PATTERNS."
            )
        seen_tables[table] = csv_path.name
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
        if table == "state_us_averages":
            export_state_averages(con, csv_path, meta, build_dir)

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

    # Second home for the carried state, so the only copy of this
    # mirror's history is never the mirror itself.
    save_state(public_data)

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
