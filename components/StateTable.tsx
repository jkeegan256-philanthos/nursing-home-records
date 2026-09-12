"use client";

import { useMemo, useState } from "react";
import { BP } from "@/lib/config";
import { csvFilename } from "@/lib/csv";
import CsvButton from "@/components/CsvButton";
import Stars from "@/components/Stars";

type Row = { ccn: string; name: string; city: string; beds: string; rating: string };
type SortKey = "name" | "city" | "ccn" | "beds" | "rating";

// CSV headers use CMS's exact column names for the fields shown.
const CSV_COLS = [
  "CMS Certification Number (CCN)",
  "Provider Name",
  "City/Town",
  "Number of Certified Beds",
  "Overall Rating",
];

export default function StateTable({
  state,
  rows,
  vintage,
}: {
  state: string;
  rows: Row[];
  vintage: string;
}) {
  const [q, setQ] = useState("");
  const [sortKey, setSortKey] = useState<SortKey>("name");
  const [desc, setDesc] = useState(false);

  const shown = useMemo(() => {
    const needle = q.trim().toLowerCase();
    const out = needle
      ? rows.filter((r) =>
          `${r.name} ${r.city} ${r.ccn}`.toLowerCase().includes(needle)
        )
      : [...rows];
    const numeric = sortKey === "beds" || sortKey === "rating";
    out.sort((a, b) => {
      let c: number;
      if (numeric) {
        // blanks sort last in both directions; values as published otherwise
        const an = a[sortKey] === "" ? NaN : Number(a[sortKey]);
        const bn = b[sortKey] === "" ? NaN : Number(b[sortKey]);
        if (Number.isNaN(an) && Number.isNaN(bn)) c = 0;
        else if (Number.isNaN(an)) return 1;
        else if (Number.isNaN(bn)) return -1;
        else c = an - bn;
      } else {
        c = a[sortKey].localeCompare(b[sortKey]);
      }
      return desc ? -c : c;
    });
    return out;
  }, [rows, q, sortKey, desc]);

  function header(key: SortKey, label: string, num = false, cls = "") {
    const active = sortKey === key;
    return (
      <th
        className={[num ? "num" : "", cls].filter(Boolean).join(" ") || undefined}
        aria-sort={active ? (desc ? "descending" : "ascending") : undefined}
      >
        <button
          type="button"
          className="th-sort"
          onClick={() => {
            if (active) setDesc(!desc);
            else {
              setSortKey(key);
              setDesc(false);
            }
          }}
        >
          {label}
          {active ? (desc ? " ↓" : " ↑") : ""}
        </button>
      </th>
    );
  }

  return (
    <>
      <div className="searchbox">
        <input
          type="search"
          value={q}
          onChange={(e) => setQ(e.target.value)}
          // Shortened like the home placeholder (pass 1): the longer
          // form clipped at "or CC" at 390px, the same class of bug.
          placeholder="Filter this table by name, city, or CCN"
          aria-label={`Filter ${state} facilities`}
        />
      </div>
      <p className="count-line has-button">
        <span>
          {shown.length === rows.length
            ? `${rows.length.toLocaleString()} certified facilities`
            : `${shown.length.toLocaleString()} of ${rows.length.toLocaleString()} facilities shown`}
          , sorted by published fields only. The CSV holds all{" "}
          {rows.length.toLocaleString()} rows regardless of the filter.
        </span>
        <CsvButton
          filename={csvFilename("state-facilities", state, vintage)}
          fetchAll={() =>
            Promise.resolve({
              cols: CSV_COLS,
              rows: rows.map((r) => [r.ccn, r.name, r.city, r.beds, r.rating]),
            })
          }
        />
      </p>
      <div className="tablewrap">
        {/* At phone width the City, CCN, and Certified-beds columns
            yield and their values ride a meta line under the name
            (ruled 2026-09-11 under the #51 precedent, extended in
            visual series pass 3): the production measurement showed
            the name column at ~175px wrapping 43-character names to
            three lines, and the realistic lever was giving the name
            more of the row. Every published value stays on the row;
            what the phone loses is the beds column's sort button,
            disclosed here and in entry 81, the same trade as the
            anchor column. CCN stays filterable, on the facility page,
            and in the CSV export. */}
        <table className="state-table">
          <thead>
            <tr>
              {header("name", "Facility")}
              {header("city", "City", false, "col-city")}
              {header("ccn", "CCN", false, "col-ccn")}
              {header("beds", "Certified beds", true, "col-beds")}
              {header("rating", "Overall rating")}
            </tr>
          </thead>
          <tbody>
            {shown.map((f) => (
              <tr key={f.ccn}>
                <td>
                  <a href={`${BP}/facility/${encodeURIComponent(f.ccn)}/`}>
                    {f.name}
                  </a>
                  <span className="row-city">
                    {f.city}
                    {f.beds ? <> · {f.beds} beds</> : null}
                  </span>
                </td>
                <td className="col-city">{f.city}</td>
                <td className="mono col-ccn">{f.ccn}</td>
                <td className="num col-beds">{f.beds}</td>
                <td>
                  <Stars value={f.rating} />
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </>
  );
}
