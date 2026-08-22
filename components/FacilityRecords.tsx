"use client";

import { useEffect, useState } from "react";
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
      const result = await queryParquet(urls, {
        column: info.ccn_column,
        equals: ccn,
      });
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
      <div className="tabs" role="tablist" aria-label="Record datasets">
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
            <>
              <p className="count-line has-button">
                <span>
                  {tab.result.rows.length.toLocaleString()} row
                  {tab.result.rows.length === 1 ? "" : "s"}
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
                    fetchAll={() =>
                      queryParquetAll(urlsFor(info), {
                        column: info.ccn_column as string,
                        equals: ccn,
                      })
                    }
                  />
                ) : null}
              </p>
              <div className="tablewrap">
                <table>
                  <thead>
                    <tr>
                      {tab.result.cols.map((c) => (
                        <th key={c}>{c}</th>
                      ))}
                    </tr>
                  </thead>
                  <tbody>
                    {tab.result.rows.map((r, i) => (
                      <tr key={i}>
                        {r.map((v, j) => (
                          <td key={j}>
                            {v == null || v === "" ? (
                              <span className="muted">&ndash;</span>
                            ) : tab.result.cols[j] === "Owner Name" ? (
                              <a href={`${BP}/owners/?name=${encodeURIComponent(v)}`}>{v}</a>
                            ) : GLOSSARY_COLUMNS.has(tab.result.cols[j]) ? (
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
                        ))}
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </>
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
