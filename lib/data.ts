import fs from "node:fs";
import path from "node:path";

export type Table = { columns: string[]; rows: (string | null)[][] };

export type TableInfo = {
  label: string;
  mode: "single" | "by_state";
  path: string;
  rows: number;
  columns: string[];
  ccn_column: string | null;
  state_column: string | null;
  states: string[] | null;
  dataset_name: string | null;
  dataset_id: string | null;
  modified_date: string | null;
  source_file: string;
  facility_join: boolean;
};

export type DataMap = { generated_at: string; tables: Record<string, TableInfo> };

const ROOT = process.cwd();
const readJson = (...p: string[]) =>
  JSON.parse(fs.readFileSync(path.join(ROOT, ...p), "utf8"));

let _providers: Table | null = null;
let _map: DataMap | null = null;
let _meta: Record<string, unknown> | null = null;

export function providersTable(): Table {
  return (_providers ??= readJson("build", "providers.json"));
}
export function dataMap(): DataMap {
  return (_map ??= readJson("public", "data", "data-map.json"));
}
export function siteMeta(): any {
  return (_meta ??= readJson("build", "site-meta.json"));
}

// The served-build ledger; missing file (first build) reads as empty.
export type LedgerEntry = {
  generated_at: string;
  trigger: string;
  commit: string;
  source_zip: { filename: string; bytes: number; sha256: string };
  files: Record<
    string,
    { sha256: string; rows: number | null; modified_date: string | null }
  >;
};
let _ledger: { entries: LedgerEntry[] } | null = null;
export function ledger(): LedgerEntry[] {
  try {
    return (_ledger ??= readJson("public", "data", "ledger.json")).entries;
  } catch {
    return [];
  }
}

// CMS's own state and national averages, passed through whole by the
// transform. Null when the batch carries no averages file, and the
// state pages simply omit the block.
export type StateAverages = {
  columns: string[];
  rows: (string | null)[][];
  dataset_name: string | null;
  dataset_id: string | null;
  modified_date: string | null;
  source_file: string | null;
};
let _averages: StateAverages | null = null;
export function stateAverages(): StateAverages | null {
  try {
    return (_averages ??= readJson("build", "state-averages.json"));
  } catch {
    return null;
  }
}

// The state's row and the national row, matched on the published
// "State or Nation" column. Either can be absent in a given batch;
// callers render what exists and omit what does not.
export function averagesFor(state: string): {
  columns: string[];
  stateRow: (string | null)[] | null;
  nationRow: (string | null)[] | null;
  meta: StateAverages;
} | null {
  const a = stateAverages();
  if (!a) return null;
  const key = a.columns.indexOf("State or Nation");
  if (key < 0) return null;
  const find = (want: string) =>
    a.rows.find((r) => (r[key] ?? "").trim().toUpperCase() === want) ?? null;
  const stateRow = find(state.trim().toUpperCase());
  const nationRow = find("NATION");
  if (!stateRow && !nationRow) return null;
  return { columns: a.columns, stateRow, nationRow, meta: a };
}

// The span of CMS's own modified dates across this batch's datasets,
// for the footer. A range rather than a single date on purpose: some
// datasets in the theme are annual, so one download routinely spans
// many months, and naming only the newest date would dress the whole
// batch in its freshest file, which is the processing-date problem
// with a different date. Null when no table carries a date, and the
// footer then says only when this site processed the batch.
export function cmsVintage(): { min: string; max: string } | null {
  const dates = Object.values(dataMap().tables)
    .map((t) => t.modified_date)
    .filter((d): d is string => !!d)
    .sort();
  if (dates.length === 0) return null;
  return { min: dates[0], max: dates[dates.length - 1] };
}

export type OwnersTop = {
  total_owners: number;
  blank_owner_rows: number;
  dataset_name: string | null;
  dataset_id: string | null;
  modified_date: string | null;
  source_file: string | null;
  top: { name: string; types: string; facilities: number; states: number }[];
};
let _owners: OwnersTop | null = null;
export function ownersTop(): OwnersTop | null {
  try {
    return (_owners ??= readJson("build", "owners-top.json"));
  } catch {
    return null;
  }
}

// Figures the Methods page teaches from, derived at build time from the
// batch being served. Null when the ownership file lacked a column the
// figure needs; zeroed when no name clears the threshold, which is the
// normal case on the synthetic fixture. Callers must treat both as
// "omit the figure" rather than as a number worth printing.
export type MethodsFigures = {
  capacity: {
    threshold: number;
    people: number;
    none_owning: number;
    some_owning: number;
    mixed: number;
    role_column: string;
    owner_type_column: string;
    ownership_marker: string;
  } | null;
  source_file: string | null;
  modified_date?: string | null;
};

let _methods: MethodsFigures | null = null;

export function methodsFigures(): MethodsFigures | null {
  try {
    return (_methods ??= readJson("build", "methods.json"));
  } catch {
    return null;
  }
}

// One place decides whether the capacity figure is publishable, so the
// page cannot accidentally print "0 individuals" as though it taught
// something. A figure that describes nobody teaches nothing.
export function capacityFigure() {
  const c = methodsFigures()?.capacity;
  if (!c || c.people < 1 || c.some_owning < 1) return null;
  return c;
}

// Pre-rendered owner pages. Row shape mirrors export_owner_pages():
// [ccn, facility, city, state, role, pct, since, type]
export type OwnerPage = {
  name: string;
  slug: string;
  types: string[];
  facilities: number;
  states: number;
  rows: (string | null)[][];
};
export type OwnerPages = { threshold: number; owners: OwnerPage[] };

let _ownerPages: OwnerPages | null = null;
let _ownerBySlug: Map<string, OwnerPage> | null = null;

export function ownerPages(): OwnerPages {
  try {
    return (_ownerPages ??= readJson("build", "owner-pages.json"));
  } catch {
    return { threshold: 0, owners: [] };
  }
}

export function getOwnerPage(slug: string): OwnerPage | null {
  _ownerBySlug ??= new Map(ownerPages().owners.map((o) => [o.slug, o]));
  return _ownerBySlug.get(slug) ?? null;
}

// Join-critical lookups (CCN, State, and the six columns build_data.py
// guards) use col() and stop the build. Every other ProviderInfo column
// the site reads goes through colOrNull()/field(): a CMS rename blanks
// the affected fields and surfaces in missingProviderColumns(), which
// the Data page prints as a processing note — a dented page, not a dead
// monthly refresh.
export function col(t: Table, name: string): number {
  const i = t.columns.indexOf(name);
  if (i < 0) throw new Error(`ProviderInfo column not found: ${name}`);
  return i;
}

export function colOrNull(t: Table, name: string): number | null {
  const i = t.columns.indexOf(name);
  return i < 0 ? null : i;
}

// Non-critical ProviderInfo columns the site displays. Kept in one place
// so missingProviderColumns() is complete; add here when a page starts
// reading a new column.
export const OPTIONAL_PROVIDER_COLUMNS = [
  "Ownership Type",
  "Number of Certified Beds",
  "Average Number of Residents per Day",
  "Provider Type",
  "Provider Resides in Hospital",
  "Date First Approved to Provide Medicare and Medicaid Services",
  "Chain Name",
  "Legal Business Name",
  "Health Inspection Rating",
  "QM Rating",
  "Staffing Rating",
  "Special Focus Status",
  "Abuse Icon",
  "Provider Address",
  "Telephone Number",
];

export function missingProviderColumns(): string[] {
  const have = new Set(providersTable().columns);
  return OPTIONAL_PROVIDER_COLUMNS.filter((c) => !have.has(c));
}

const CCN = "CMS Certification Number (CCN)";

export function ownershipRollup():
  | { forProfit: number; nonProfit: number; government: number; other: number }
  | null {
  try {
    const t = providersTable();
    const oi = colOrNull(t, "Ownership Type");
    if (oi == null) return null;
    const r = { forProfit: 0, nonProfit: 0, government: 0, other: 0 };
    for (const row of t.rows) {
      const v = (row[oi] ?? "").trim();
      if (v.startsWith("For profit")) r.forProfit++;
      else if (v.startsWith("Non profit")) r.nonProfit++;
      else if (v.startsWith("Government")) r.government++;
      else r.other++;
    }
    return r;
  } catch {
    return null;
  }
}

export function listStates(): { state: string; count: number }[] {
  const t = providersTable();
  const si = col(t, "State");
  const counts = new Map<string, number>();
  for (const r of t.rows) {
    const s = (r[si] ?? "").trim();
    if (s) counts.set(s, (counts.get(s) ?? 0) + 1);
  }
  return [...counts.entries()]
    .map(([state, count]) => ({ state, count }))
    .sort((a, b) => a.state.localeCompare(b.state));
}

export function facilitiesFor(state: string) {
  const t = providersTable();
  const idx = {
    ccn: col(t, CCN),
    name: col(t, "Provider Name"),
    city: col(t, "City/Town"),
    state: col(t, "State"),
    beds: colOrNull(t, "Number of Certified Beds"),
    rating: col(t, "Overall Rating"),
  };
  // listStates() groups on the trimmed value, so this must match it or
  // a facility whose State is " UT " is counted on the home page and
  // then missing from the UT table.
  return t.rows
    .filter((r) => (r[idx.state] ?? "").trim() === state)
    .map((r) => ({
      ccn: r[idx.ccn] ?? "",
      name: r[idx.name] ?? "",
      city: r[idx.city] ?? "",
      beds: (idx.beds == null ? "" : r[idx.beds]) ?? "",
      rating: r[idx.rating] ?? "",
    }));
}

export function allCCNs(): string[] {
  const t = providersTable();
  const ci = col(t, CCN);
  let ccns = t.rows.map((r) => r[ci] ?? "").filter(Boolean);
  const limit = Number(process.env.PAGES_LIMIT || 0);
  if (limit > 0) ccns = ccns.slice(0, limit);
  return ccns;
}

let _byCCN: Map<string, (string | null)[]> | null = null;

export function getFacility(ccn: string) {
  const t = providersTable();
  const ci = col(t, CCN);
  if (!_byCCN) {
    _byCCN = new Map(t.rows.map((r) => [r[ci] ?? "", r]));
  }
  const row = _byCCN.get(ccn);
  if (!row) return null;
  const get = (name: string) => {
    const i = colOrNull(t, name);
    return (i == null ? "" : row[i]) ?? "";
  };
  return { columns: t.columns, row, get };
}
