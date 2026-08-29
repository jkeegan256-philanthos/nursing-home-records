"use client";

import { useEffect, useRef, useState } from "react";
import { BP, CMS_DATASET_URL } from "@/lib/config";
import type { DataMap, TableInfo } from "@/lib/data";
import {
  queryParquet,
  queryParquetAll,
  ROW_LIMIT,
  type QueryResult,
} from "@/lib/duckdb-client";
import { csvFilename } from "@/lib/csv";
import { termAnchor } from "@/lib/glossary";
import CsvButton from "@/components/CsvButton";

// The shard build_data.py writes for rows whose state column is blank
// or not a two-letter code. It is queried alongside the state shard,
// never instead of it.
const OTHER_SHARD = "_OTHER";

const GLOSSARY_COLUMNS = new Set([
  "Role played by Owner or Manager in Facility",
  "Owner Type",
]);

// Columns whose values run long enough to deserve a reading measure,
// chosen by measurement over the real batch rather than by eye:
// deficiency descriptions run to CMS's own cap on nearly every row,
// and roles and owner names run past a comfortable line. The measure
// wraps and never truncates; an ellipsis would hide a published
// value.
const LONG_TEXT_COLUMNS = new Set([
  "Deficiency Description",
  "Deficiency Category",
  "Role played by Owner or Manager in Facility",
  "Owner Name",
]);

// The subset whose values run to paragraph length, and so also get
// the reading measure as a floor, not only a cap: in a wide loaded
// table sitting at min-content width, a floor is the only bound that
// can act. Kept narrow deliberately -- a floor on a short-valued
// column would widen the table for nothing.
const PARAGRAPH_COLUMNS = new Set(["Deficiency Description"]);

// Columns that restate the facility's own identity, which the header
// record above the tabs already shows. A column collapses only when it
// is in this set AND every fetched row agrees on its value: the values
// render once in the identity line above the table, and a row that
// disagrees keeps its column, because a mismatch is information. The
// CSV download keeps every column either way; the provenance strip's
// sentence about full columns is what answers "where did a column go".
// Location is collapsed like the rest but also left off the identity
// line when it merely concatenates the address fields the line already
// carries, so it is the one column a reader sees only in the CSV.
const IDENTITY_COLUMNS = [
  "Provider Name",
  "Provider Address",
  "City/Town",
  "State",
  "ZIP Code",
  "Location",
];

const alnum = (s: string) => s.replace(/[^a-z0-9]/gi, "").toUpperCase();

function partitionIdentity(
  cols: string[],
  rows: (string | null)[][],
  ccnColumn: string
) {
  const identity = new Set([...IDENTITY_COLUMNS, ccnColumn]);
  const collapsed = new Map<string, string>();
  const keep: number[] = [];
  cols.forEach((c, i) => {
    if (!identity.has(c) || rows.length === 0) {
      keep.push(i);
      return;
    }
    const first = rows[0][i];
    if (rows.every((r) => r[i] === first)) {
      collapsed.set(c, first == null ? "" : String(first));
    } else {
      keep.push(i);
    }
  });
  const val = (c: string) => collapsed.get(c);
  const addr = [val("Provider Address"), val("City/Town"), val("State"), val("ZIP Code")]
    .filter(Boolean)
    .join(", ");
  const loc = val("Location");
  const locIsRestatement =
    !!loc &&
    !!val("Provider Address") &&
    !!val("City/Town") &&
    alnum(loc).includes(alnum(val("Provider Address")!)) &&
    alnum(loc).includes(alnum(val("City/Town")!));
  const pieces = [
    val("Provider Name"),
    addr || undefined,
    loc && !locIsRestatement ? loc : undefined,
    collapsed.has(ccnColumn) ? `CCN ${collapsed.get(ccnColumn)}` : undefined,
  ].filter((p): p is string => !!p);
  return { keep, collapsedCount: collapsed.size, line: pieces.join(" · ") };
}

// Default presentation order for the loaded tables: one published
// date column per dataset, newest first, disclosed in the count-line
// beside the row count. This is display vocabulary (ADAPTATION
// touchpoint 3): a default presentation order by one published
// column, disclosed, not reader-controlled sorting and not a
// judgment about which rows matter. A dataset not listed here, or
// whose column a future batch renames away, renders in engine order
// and makes no claim; the engine order was never file order to begin
// with, only whatever the scan emitted.
const SORT_COLUMNS: Record<string, string> = {
  penalties: "Penalty Date",
  health_citations: "Survey Date",
  fire_safety_citations: "Survey Date",
  survey_dates: "Survey Date",
};

function sortColumnFor(key: string, info: TableInfo): string | null {
  const c = SORT_COLUMNS[key];
  return c && info.columns.includes(c) ? c : null;
}

const PREFERRED_ORDER = [
  "health_citations",
  "fire_safety_citations",
  "penalties",
  "ownership",
  "survey_summary",
  "survey_dates",
  "quality_measures_mds",
  "quality_measures_claims",
  "snf_qrp_provider",
  "snf_vbp_facility",
  "swing_bed_snf",
];

type TabState =
  | { status: "idle" }
  | { status: "loading" }
  | { status: "done"; result: QueryResult }
  | { status: "empty" }
  | { status: "absent"; note: string }
  | { status: "error"; message: string };

export default function FacilityRecords({
  ccn,
  state,
}: {
  ccn: string;
  state: string;
}) {
  const [map, setMap] = useState<DataMap | null>(null);
  const [mapFailed, setMapFailed] = useState(false);
  const [active, setActive] = useState<string | null>(null);
  const [tabs, setTabs] = useState<Record<string, TabState>>({});
  // The fade at the tab strip's edges is a state, not a style: painted
  // only while pills actually sit beyond that edge, because a fade over
  // a fully visible strip signals content that is not there.
  const tablistRef = useRef<HTMLDivElement | null>(null);
  const [fade, setFade] = useState({ left: false, right: false });
  // The anchor column is a state by the same rule as the fades: it
  // exists only while the wrapper measurably overflows sideways, so
  // the attribute is set from measurement after rows render and on
  // resize, never painted unconditionally.
  const wrapRef = useRef<HTMLDivElement | null>(null);
  const [scrollable, setScrollable] = useState(false);

  function recalcFade() {
    const el = tablistRef.current;
    if (!el) return;
    setFade({
      left: el.scrollLeft > 2,
      right: el.scrollLeft + el.clientWidth < el.scrollWidth - 2,
    });
  }

  function recalcScrollable() {
    const el = wrapRef.current;
    setScrollable(el ? el.scrollWidth > el.clientWidth : false);
  }

  useEffect(() => {
    recalcFade();
    window.addEventListener("resize", recalcFade);
    return () => window.removeEventListener("resize", recalcFade);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [map]);

  useEffect(() => {
    recalcScrollable();
    window.addEventListener("resize", recalcScrollable);
    return () => window.removeEventListener("resize", recalcScrollable);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [tabs, active]);

  useEffect(() => {
    let alive = true;
    fetch(`${BP}/data/data-map.json`)
      .then((r) => (r.ok ? r.json() : Promise.reject(new Error(String(r.status)))))
      .then((j: DataMap) => {
        if (!alive) return;
        setMap(j);
        const keys = orderedKeys(j);
        // #<table> deep-links a tab so a citation can point at one dataset.
        const fromHash = decodeURIComponent(window.location.hash.slice(1));
        setActive(keys.includes(fromHash) ? fromHash : keys[0] ?? null);
      })
      .catch((err) => {
        console.error("dataset index failed to load", err);
        if (alive) setMapFailed(true);
      });
    return () => {
      alive = false;
    };
  }, []);

  useEffect(() => {
    if (!map || !active) return;
    if (tabs[active] && tabs[active].status !== "idle") return;
    const info = map.tables[active];
    load(active, info);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [map, active]);

  function orderedKeys(m: DataMap): string[] {
    const joinable = Object.entries(m.tables)
      .filter(([, t]) => t.facility_join)
      .map(([k]) => k);
    const ranked = PREFERRED_ORDER.filter((k) => joinable.includes(k));
    const rest = joinable.filter((k) => !ranked.includes(k)).sort();
    return [...ranked, ...rest];
  }

  const abs = (rel: string) =>
    new URL(`${BP}/${rel}`, window.location.origin).toString();

  // Every file that can hold this facility's rows. For a partitioned
  // table that is the state shard plus _OTHER, which holds the rows CMS
  // published with a blank or non-standard state. Those rows were
  // reachable from no page at all before: the record shown was short of
  // the record published, silently, on exactly the rows already flagged
  // as irregular.
  function urlsFor(info: TableInfo): string[] {
    if (info.mode !== "by_state") return [abs(info.path)];
    const urls: string[] = [];
    if (!info.states || info.states.includes(state)) {
      urls.push(abs(`${info.path}/${state}.parquet`));
    }
    if (info.states?.includes(OTHER_SHARD)) {
      urls.push(abs(`${info.path}/${OTHER_SHARD}.parquet`));
    }
    return urls;
  }

  function hasOtherShard(info: TableInfo): boolean {
    return info.mode === "by_state" && !!info.states?.includes(OTHER_SHARD);
  }

  async function load(key: string, info: TableInfo) {
    if (!info.ccn_column) return;
    const urls = urlsFor(info);
    if (urls.length === 0) {
      setTabs((t) => ({
        ...t,
        [key]: {
          status: "absent",
          note: `CMS published no ${info.label.toLowerCase()} rows for ${state} in this batch.`,
        },
      }));
      return;
    }
    setTabs((t) => ({ ...t, [key]: { status: "loading" } }));
    try {
      const sortCol = sortColumnFor(key, info);
      const result = await queryParquet(
        urls,
        { column: info.ccn_column, equals: ccn },
        ROW_LIMIT,
        sortCol ? { column: sortCol, direction: "DESC" } : undefined
      );
      setTabs((t) => ({
        ...t,
        [key]:
          result.rows.length === 0
            ? { status: "empty" }
            : { status: "done", result },
      }));
    } catch (err) {
      console.error(`records query failed for ${key}`, err);
      setTabs((t) => ({
        ...t,
        [key]: {
          status: "error",
          message:
            "The records file could not be read. Reload the page to try again, or use the original files on the Data page.",
        },
      }));
    }
  }

  if (mapFailed) {
    return (
      <p className="tab-status">
        The dataset index did not load, so per-facility records are unavailable.
        The original files are on the Data page.
      </p>
    );
  }
  if (!map) return <p className="tab-status">Loading dataset index&hellip;</p>;

  const keys = orderedKeys(map);
  if (keys.length === 0) return null;
  const info = active ? map.tables[active] : null;
  const tab = active ? tabs[active] : undefined;

  function selectTab(k: string) {
    setActive(k);
    window.history.replaceState(null, "", `#${encodeURIComponent(k)}`);
    document
      .getElementById(`tab-${k}`)
      ?.scrollIntoView({ block: "nearest", inline: "nearest" });
    recalcFade();
  }

  function onTabKeyDown(e: React.KeyboardEvent, k: string) {
    const i = keys.indexOf(k);
    let next: number | null = null;
    if (e.key === "ArrowRight") next = (i + 1) % keys.length;
    else if (e.key === "ArrowLeft") next = (i - 1 + keys.length) % keys.length;
    else if (e.key === "Home") next = 0;
    else if (e.key === "End") next = keys.length - 1;
    if (next != null) {
      e.preventDefault();
      selectTab(keys[next]);
      document.getElementById(`tab-${keys[next]}`)?.focus();
    }
  }

  return (
    <section>
      <h2>Records for this facility</h2>
      <div
        className="tabs-shell"
        data-fade-left={fade.left || undefined}
        data-fade-right={fade.right || undefined}
      >
      <div
        className="tabs"
        role="tablist"
        aria-label="Record datasets"
        ref={tablistRef}
        onScroll={recalcFade}
      >
        {keys.map((k) => (
          <button
            key={k}
            id={`tab-${k}`}
            role="tab"
            aria-selected={k === active}
            aria-controls="records-panel"
            tabIndex={k === active ? 0 : -1}
            onClick={() => selectTab(k)}
            onKeyDown={(e) => onTabKeyDown(e, k)}
          >
            {map.tables[k].label}
          </button>
        ))}
      </div>
      </div>

      {info && (
        <div
          id="records-panel"
          role="tabpanel"
          aria-labelledby={active ? `tab-${active}` : undefined}
        >
          {!tab || tab.status === "loading" || tab.status === "idle" ? (
            <p className="tab-status">Loading {info.label.toLowerCase()}&hellip;</p>
          ) : tab.status === "absent" ? (
            <p className="tab-status">{tab.note}</p>
          ) : tab.status === "empty" ? (
            <p className="tab-status">
              No rows for this facility in this dataset.
            </p>
          ) : tab.status === "error" ? (
            <p className="tab-status">{tab.message}</p>
          ) : (
            (() => {
              const part = partitionIdentity(
                tab.result.cols,
                tab.result.rows,
                info.ccn_column ?? ""
              );
              const shownCols = part.keep.map((i) => tab.result.cols[i]);
              return (
            <>
              <p className="count-line has-button">
                <span>
                  {tab.result.rows.length.toLocaleString()} row
                  {tab.result.rows.length === 1 ? "" : "s"}
                  {active && sortColumnFor(active, info)
                    ? `, newest first by ${sortColumnFor(active, info)}`
                    : ""}
                  {tab.result.rows.length >= ROW_LIMIT
                    ? ` (showing the first ${ROW_LIMIT.toLocaleString()})`
                    : ""}
                </span>
                {info.ccn_column ? (
                  <CsvButton
                    filename={csvFilename(
                      active ?? info.label,
                      ccn,
                      info.modified_date?.slice(0, 7) ??
                        map.generated_at.slice(0, 7)
                    )}
                    fetchAll={() => {
                      // The export runs its own uncapped query with the
                      // same order, never reusing what the screen holds.
                      const sortCol = active ? sortColumnFor(active, info) : null;
                      return queryParquetAll(
                        urlsFor(info),
                        { column: info.ccn_column as string, equals: ccn },
                        sortCol ? { column: sortCol, direction: "DESC" } : undefined
                      );
                    }}
                  />
                ) : null}
              </p>
              {part.line ? (
                <p className="identity-line muted">
                  Identical in every row shown: {part.line}.
                </p>
              ) : null}
              <div
                className="tablewrap zebra"
                ref={wrapRef}
                data-scrollable={scrollable ? "true" : undefined}
              >
                <table>
                  <thead>
                    <tr>
                      {shownCols.map((c, j) => (
                        <th key={c} className={j === 0 ? "anchor" : undefined}>
                          {c}
                        </th>
                      ))}
                    </tr>
                  </thead>
                  <tbody>
                    {tab.result.rows.map((r, i) => (
                      <tr key={i}>
                        {part.keep.map((idx, j) => {
                          const v = r[idx];
                          const col = shownCols[j];
                          const longtext = LONG_TEXT_COLUMNS.has(col)
                            ? PARAGRAPH_COLUMNS.has(col)
                              ? "longtext longform"
                              : "longtext"
                            : undefined;
                          return (
                          <td
                            key={j}
                            className={
                              j === 0
                                ? ["anchor", longtext].filter(Boolean).join(" ")
                                : longtext
                            }
                          >
                            {v == null || v === "" ? (
                              <span className="muted">&ndash;</span>
                            ) : col === "Owner Name" ? (
                              <a href={`${BP}/owners/?name=${encodeURIComponent(v)}`}>{v}</a>
                            ) : GLOSSARY_COLUMNS.has(col) ? (
                              <a
                                className="quiet-link"
                                href={`${BP}/glossary/#${termAnchor(v)}`}
                              >
                                {v}
                              </a>
                            ) : (
                              v
                            )}
                          </td>
                          );
                        })}
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </>
              );
            })()
          )}
          <p className="prov">
            Source: {info.dataset_name ?? info.label} · file{" "}
            <span className="mono">{info.source_file}</span>
            {info.dataset_id ? (
              <>
                {" "}· CMS dataset{" "}
                <a
                  className="mono"
                  href={CMS_DATASET_URL(info.dataset_id)}
                  rel="noopener noreferrer"
                >
                  {info.dataset_id}
                </a>
              </>
            ) : null}
            {info.modified_date ? <> · last modified {info.modified_date}</> : null}
            {" "}· shown unmodified
            {tab?.status === "done" &&
            tab.result.cols.some((c) => c.includes("Fine Amount"))
              ? " · fine amounts are dollars, as filed"
              : ""}
            {hasOtherShard(info)
              ? ", including rows CMS published without a usable state code"
              : ""}
            . CSV downloads carry this file&apos;s full columns and every
            matching row, checkable against the originals on the Data page.
          </p>
        </div>
      )}
    </section>
  );
}
