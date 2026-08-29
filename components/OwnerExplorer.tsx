"use client";

import { useEffect, useState } from "react";
import { BP, CMS_DATASET_URL } from "@/lib/config";
import type { DataMap, TableInfo } from "@/lib/data";
import {
  queryParquetAll,
  querySQL,
  sqlIdent,
  sqlLit,
  type QueryResult,
} from "@/lib/duckdb-client";
import { csvFilename } from "@/lib/csv";
import { termAnchor } from "@/lib/glossary";
import CsvButton from "@/components/CsvButton";
import CopyName from "@/components/CopyName";
import Stars from "@/components/Stars";

const NAMED =
  `"Owner Name" IS NOT NULL AND trim("Owner Name") <> '' AND "Owner Name" <> 'None'`;

// Headroom, not a live cap: sized far above any footprint a batch has
// produced, and deliberately not annotated with the current maximum,
// because that is a fact about one batch and this comment outlives
// batches. The header counts come from SQL over all rows either way,
// and the rendered notice says so if a batch ever exceeds this.
const DETAIL_ROW_LIMIT = 3000;

type Hit = { name: string; types: string; facilities: number };
type DetailRow = {
  ccn: string;
  facility: string;
  city: string;
  state: string;
  role: string;
  pct: string;
  since: string;
};
type Detail = {
  name: string;
  rows: DetailRow[];
  types: string[];
  roles: string[];
  facilities: number;
  states: number;
  // Distinct facilities per state, from SQL over all rows so it stays
  // right past any display cap. Counts only, ever: no rating or
  // quality measure joins this grouping, because a per-state quality
  // figure for one owner is portfolio scoring, which this site does
  // not do.
  byState: { st: string; n: number }[];
  totalRows: number;
  fallback: QueryResult | null;
};

function ownerHref(name: string): string {
  return `${BP}/owners/?name=${encodeURIComponent(name)}`;
}

export default function OwnerExplorer() {
  const [info, setInfo] = useState<TableInfo | null>(null);
  const [infoFailed, setInfoFailed] = useState(false);
  const [q, setQ] = useState("");
  const [hits, setHits] = useState<Hit[] | null>(null);
  const [searching, setSearching] = useState(false);
  const [searchError, setSearchError] = useState(false);
  const [selected, setSelected] = useState<string | null>(null);
  const [detail, setDetail] = useState<Detail | null>(null);
  const [detailState, setDetailState] = useState<"idle" | "loading" | "error">("idle");
  const [ratings, setRatings] = useState<Map<string, string> | null>(null);
  // Owner-name to slug map for the pre-rendered pages, fetched once and
  // only after a name is selected. A missing map just means no
  // permanent-page link is offered; the explorer stays whole.
  const [slugs, setSlugs] = useState<Record<string, string> | null>(null);

  useEffect(() => {
    let alive = true;
    fetch(`${BP}/data/data-map.json`)
      .then((r) => (r.ok ? r.json() : Promise.reject(new Error(String(r.status)))))
      .then((j: DataMap) => {
        if (!alive) return;
        const t = j.tables["ownership_all"];
        if (!t) throw new Error("missing");
        setInfo(t);
      })
      .catch((err) => {
        console.error("ownership index failed to load", err);
        if (alive) setInfoFailed(true);
      });
    const read = () => {
      const name = new URLSearchParams(window.location.search).get("name");
      setSelected(name && name.trim() ? name : null);
    };
    read();
    window.addEventListener("popstate", read);
    return () => {
      alive = false;
      window.removeEventListener("popstate", read);
    };
  }, []);

  useEffect(() => {
    if (!info || !selected) {
      setDetail(null);
      setDetailState("idle");
      return;
    }
    let alive = true;
    setDetailState("loading");
    const url = new URL(`${BP}/${info.path}`, window.location.origin).toString();
    (async () => {
      try {
        const res = await querySQL(
          `SELECT * FROM read_parquet(${sqlLit(url)}) WHERE "Owner Name" = ${sqlLit(selected)} LIMIT ${DETAIL_ROW_LIMIT}`
        );
        if (!alive) return;
        const need = [
          info.ccn_column ?? "CMS Certification Number (CCN)",
          "Provider Name",
          "City/Town",
          "State",
          "Role played by Owner or Manager in Facility",
          "Ownership Percentage",
          "Association Date",
          "Owner Type",
        ];
        const idx = need.map((c) => res.cols.indexOf(c));
        if (idx.slice(0, 5).some((i) => i < 0)) {
          setDetail({
            name: selected, rows: [], types: [], roles: [], byState: [],
            facilities: 0, states: 0, totalRows: res.rows.length, fallback: res,
          });
          setDetailState("idle");
          return;
        }
        // Counts over all rows in SQL, so the header agrees with the
        // search list even if the row table above is ever truncated.
        const counts = await querySQL(
          `SELECT count(*), count(DISTINCT ${sqlIdent(need[0])}), ` +
            `count(DISTINCT CASE WHEN "State" IS NOT NULL AND trim("State") <> '' THEN trim("State") END) ` +
            `FROM read_parquet(${sqlLit(url)}) WHERE "Owner Name" = ${sqlLit(selected)}`
        );
        if (!alive) return;
        const [totalRows, facilities, states] = (counts.rows[0] ?? []).map((v) =>
          Number(v ?? 0)
        );
        const perState = await querySQL(
          `SELECT trim("State"), count(DISTINCT ${sqlIdent(need[0])}) ` +
            `FROM read_parquet(${sqlLit(url)}) WHERE "Owner Name" = ${sqlLit(selected)} ` +
            `AND "State" IS NOT NULL AND trim("State") <> '' ` +
            `GROUP BY 1 ORDER BY 2 DESC, 1`
        );
        if (!alive) return;
        const byState = perState.rows.map((r) => ({
          st: r[0] ?? "",
          n: Number(r[1] ?? 0),
        }));
        const rows: DetailRow[] = res.rows.map((r) => ({
          ccn: r[idx[0]] ?? "",
          facility: r[idx[1]] ?? "",
          city: r[idx[2]] ?? "",
          state: r[idx[3]] ?? "",
          role: r[idx[4]] ?? "",
          pct: (idx[5] >= 0 ? r[idx[5]] : "") ?? "",
          since: (idx[6] >= 0 ? r[idx[6]] : "") ?? "",
        }));
        rows.sort(
          (a, b) =>
            a.state.localeCompare(b.state) ||
            a.city.localeCompare(b.city) ||
            a.facility.localeCompare(b.facility) ||
            a.role.localeCompare(b.role)
        );
        const types = [...new Set(res.rows.map((r) => (idx[7] >= 0 ? r[idx[7]] : null)).filter(Boolean) as string[])];
        const roles = [...new Set(rows.map((r) => r.role).filter(Boolean))];
        setDetail({
          name: selected,
          rows,
          types,
          roles,
          facilities,
          states,
          byState,
          totalRows,
          fallback: null,
        });
        setDetailState("idle");
      } catch (err) {
        console.error("owner detail query failed", err);
        if (alive) setDetailState("error");
      }
    })();
    return () => {
      alive = false;
    };
  }, [info, selected]);

  useEffect(() => {
    if (!selected || slugs) return;
    let alive = true;
    fetch(`${BP}/data/owner-slugs.json`)
      .then((r) => (r.ok ? r.json() : Promise.reject(new Error(String(r.status)))))
      .then((j: { slugs?: Record<string, string> }) => {
        if (alive) setSlugs(j.slugs ?? {});
      })
      .catch((err) => {
        console.error("owner slug map failed to load", err);
        if (alive) setSlugs({});
      });
    return () => {
      alive = false;
    };
  }, [selected, slugs]);

  useEffect(() => {
    if (!selected || ratings) return;
    let alive = true;
    fetch(`${BP}/data/providers-slim.json`)
      .then((r) => (r.ok ? r.json() : Promise.reject(new Error(String(r.status)))))
      .then((j: { rows: (string | null)[][] }) => {
        if (!alive) return;
        setRatings(new Map(j.rows.map((r) => [r[0] ?? "", r[5] ?? ""])));
      })
      .catch((err) => {
        console.error("ratings index failed to load", err);
        if (alive) setRatings(new Map());
      });
    return () => {
      alive = false;
    };
  }, [selected, ratings]);

  async function runSearch() {
    const needle = q.trim();
    if (!info || needle.length < 3) return;
    setSearching(true);
    setSearchError(false);
    setHits(null);
    try {
      const url = new URL(`${BP}/${info.path}`, window.location.origin).toString();
      const ccn = sqlIdent(info.ccn_column ?? "CMS Certification Number (CCN)");
      // Every word of the query must appear somewhere in the name, so
      // JOHN MITCHELL finds MITCHELL, JOHN. CMS publishes people as
      // LAST, FIRST and readers type FIRST LAST; the home page search
      // already matches this way, and two search boxes on one site must
      // not answer the same query differently. Exact strings still:
      // tokens split the query, never the published name.
      const match = needle
        .split(/\s+/)
        .filter(Boolean)
        .map((t) => `contains(upper("Owner Name"), upper(${sqlLit(t)}))`)
        .join(" AND ");
      const res = await querySQL(
        `SELECT "Owner Name", string_agg(DISTINCT coalesce("Owner Type", '')), ` +
          `count(DISTINCT ${ccn}) FROM read_parquet(${sqlLit(url)}) ` +
          `WHERE ${NAMED} AND ${match} ` +
          `GROUP BY 1 ORDER BY 3 DESC, 1 LIMIT 60`
      );
      setHits(
        res.rows.map((r) => ({
          name: r[0] ?? "",
          types: r[1] ?? "",
          facilities: Number(r[2] ?? 0),
        }))
      );
    } catch (err) {
      console.error("owner search failed", err);
      setSearchError(true);
    } finally {
      setSearching(false);
    }
  }

  function open(name: string) {
    window.history.pushState({}, "", ownerHref(name));
    setSelected(name);
  }

  if (infoFailed) {
    return (
      <p className="tab-status">
        The ownership index did not load, so this page cannot search or show
        owners. The original files are on the Data page.
      </p>
    );
  }

  return (
    <div>
      <div className="searchbox">
        <input
          type="search"
          value={q}
          onChange={(e) => setQ(e.target.value)}
          onKeyDown={(e) => e.key === "Enter" && runSearch()}
          placeholder="Search owner, officer, or company names"
          aria-label="Search owner names"
        />
        <p className="search-hint">
          Type at least three characters, then press Enter. Every word you
          type must appear in the name; word order does not matter. Names are
          shown exactly as CMS publishes them, usually LAST, FIRST for people.
        </p>
      </div>

      {searching && <p className="tab-status">Searching all owner names&hellip;</p>}
      {searchError && (
        <p className="tab-status">
          The search could not run. Reload the page and try again.
        </p>
      )}
      {hits && hits.length === 0 && (
        <p className="tab-status">No owner names contain that text.</p>
      )}
      {hits && hits.length > 0 && (
        <>
          <ul className="search-results">
            {hits.map((h) => (
              <li key={h.name}>
                <a
                  href={ownerHref(h.name)}
                  onClick={(e) => {
                    e.preventDefault();
                    open(h.name);
                  }}
                >
                  <span className="name">{h.name}</span>
                  <span className="muted">{h.types}</span>
                  <span className="mono muted">
                    {h.facilities.toLocaleString()}{" "}
                    {h.facilities === 1 ? "facility" : "facilities"}
                  </span>
                </a>
              </li>
            ))}
          </ul>
          <p className="search-hint">
            Showing up to 60 names, largest footprint first.
          </p>
        </>
      )}

      {selected && (
        <section className="record-head" style={{ marginTop: 20 }}>
          {detailState === "loading" && (
            <p className="tab-status">Loading records for {selected}&hellip;</p>
          )}
          {detailState === "error" && (
            <p className="tab-status">
              The records for this name could not be loaded. Reload the page to
              try again.
            </p>
          )}
          {detail && detail.fallback && (
            <>
              <h2 style={{ marginTop: 0 }}>{detail.name}</h2>
              <p className="muted">
                CMS changed this file&apos;s columns, so the plain rows are
                shown as published.
              </p>
              <div className="tablewrap">
                <table>
                  <thead>
                    <tr>
                      {detail.fallback.cols.map((c) => (
                        <th key={c}>{c}</th>
                      ))}
                    </tr>
                  </thead>
                  <tbody>
                    {detail.fallback.rows.map((r, i) => (
                      <tr key={i}>
                        {r.map((v, j) => (
                          <td key={j}>{v ?? <span className="muted">&ndash;</span>}</td>
                        ))}
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </>
          )}
          {detail && !detail.fallback && (
            <>
              <p className="muted mono" style={{ margin: 0 }}>
                Owner record, grouped by exact name
              </p>
              <h2 style={{ margin: "2px 0 8px", fontSize: 24 }}>{detail.name}</h2>
              <p style={{ margin: "0 0 10px" }}>
                {detail.types.map((t) => (
                  <span className="chip" key={t}>
                    {t}
                  </span>
                ))}
                {detail.roles.slice(0, 6).map((r) => (
                  <span className="chip" key={r}>
                    {r}
                  </span>
                ))}
                {detail.roles.length > 6 && (
                  <span className="muted">
                    and {detail.roles.length - 6} more roles
                  </span>
                )}
              </p>
              <p className="count-line has-button">
                <span>
                  {detail.facilities.toLocaleString()}{" "}
                  {detail.facilities === 1 ? "facility" : "facilities"} in{" "}
                  {detail.states} {detail.states === 1 ? "state" : "states"},{" "}
                  {detail.totalRows.toLocaleString()} disclosure rows
                  {detail.totalRows > detail.rows.length
                    ? ` (showing the first ${detail.rows.length.toLocaleString()})`
                    : ""}
                  . Same name can be more than one person; different spellings
                  of one person are listed separately.
                </span>
                {info ? (
                  <CsvButton
                    filename={csvFilename(
                      "ownership",
                      detail.name,
                      info.modified_date?.slice(0, 7) ?? "current"
                    )}
                    fetchAll={() =>
                      queryParquetAll(
                        new URL(`${BP}/${info.path}`, window.location.origin).toString(),
                        { column: "Owner Name", equals: detail.name }
                      )
                    }
                  />
                ) : null}
              </p>
              {detail.byState.length > 1 ? (
                <p className="count-line">
                  Facilities by state:{" "}
                  {detail.byState.map((s, i) => (
                    <span key={s.st}>
                      {i > 0 ? " · " : ""}
                      <span className="mono">
                        {s.st} {s.n.toLocaleString()}
                      </span>
                    </span>
                  ))}
                </p>
              ) : null}
              <CopyName name={detail.name} />
              <p className="search-hint">
                {slugs?.[detail.name] ? (
                  <>
                    <a href={`${BP}/owner/${slugs[detail.name]}/`}>
                      Permanent page for this name
                    </a>
                    , for citation and sharing.{" "}
                  </>
                ) : null}
                Researching this name further?{" "}
                <a href={`${BP}/about/`}>About</a> explains where public
                records continue, and why this site links to none of them
                by name.
              </p>
              <div className="tablewrap">
                <table>
                  <thead>
                    <tr>
                      <th>Facility</th>
                      <th>City</th>
                      <th>State</th>
                      <th>Role</th>
                      <th>Ownership percentage</th>
                      <th>Association date</th>
                      <th>Overall rating</th>
                    </tr>
                  </thead>
                  <tbody>
                    {detail.rows.map((r, i) => (
                      <tr key={i}>
                        <td>
                          <a href={`${BP}/facility/${encodeURIComponent(r.ccn)}/`}>
                            {r.facility || r.ccn}
                          </a>
                        </td>
                        <td>{r.city}</td>
                        <td>{r.state}</td>
                        <td className="longtext">
                          {r.role ? (
                            <a
                              className="quiet-link"
                              href={`${BP}/glossary/#${termAnchor(r.role)}`}
                            >
                              {r.role}
                            </a>
                          ) : (
                            <span className="muted">&ndash;</span>
                          )}
                        </td>
                        <td>{r.pct || <span className="muted">&ndash;</span>}</td>
                        <td>{r.since || <span className="muted">&ndash;</span>}</td>
                        <td>
                          <Stars value={ratings?.get(r.ccn) ?? ""} />
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
              <p className="prov">
                Roles, percentages, and dates: {info?.dataset_name ?? "Ownership"}
                {info?.dataset_id ? (
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
                {info?.modified_date ? (
                  <> · last modified {info.modified_date}</>
                ) : null}
                . Overall ratings shown from the Provider information dataset.
                Values are shown unmodified. CSV downloads carry the ownership
                file&apos;s own columns only, full rows with no joined
                ratings, checkable against the originals on the Data page.
              </p>
            </>
          )}
        </section>
      )}
    </div>
  );
}
