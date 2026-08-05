"use client";

import { useState } from "react";
import { BP } from "@/lib/config";
import type { DataMap } from "@/lib/data";
import { queryParquet } from "@/lib/duckdb-client";

type State =
  | { status: "idle" }
  | { status: "loading" }
  | { status: "done"; fields: [string, string | null][] }
  | { status: "error" };

export default function FullRecord({ ccn }: { ccn: string }) {
  const [state, setState] = useState<State>({ status: "idle" });

  async function load() {
    if (state.status !== "idle") return;
    setState({ status: "loading" });
    try {
      const map: DataMap = await fetch(`${BP}/data/data-map.json`).then((r) => {
        if (!r.ok) throw new Error(String(r.status));
        return r.json();
      });
      const info = map.tables["providers"];
      if (!info?.ccn_column) throw new Error("no providers table");
      const url = new URL(`${BP}/${info.path}`, window.location.origin).toString();
      const res = await queryParquet(url, {
        column: info.ccn_column,
        equals: ccn,
      });
      if (res.rows.length === 0) throw new Error("not found");
      const row = res.rows[0];
      setState({
        status: "done",
        fields: res.cols.map((c, i) => [c, row[i]] as [string, string | null]),
      });
    } catch (err) {
      console.error("full record failed to load", err);
      setState({ status: "error" });
    }
  }

  return (
    <details className="fullrecord" onToggle={(e) => e.currentTarget.open && load()}>
      <summary>Full record as published</summary>
      {state.status === "loading" || state.status === "idle" ? (
        <p className="tab-status">Loading the full record&hellip;</p>
      ) : state.status === "error" ? (
        <p className="tab-status">
          The record could not be loaded. The original files are on the Data
          page.
        </p>
      ) : (
        <div className="tablewrap">
          <table>
            <tbody>
              {state.fields.map(([c, v]) => (
                <tr key={c}>
                  <th scope="row">{c}</th>
                  <td>
                    {(v ?? "").trim() || <span className="muted">&ndash;</span>}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </details>
  );
}
