"use client";

import { useState } from "react";
import { downloadCsv } from "@/lib/csv";
import type { QueryResult } from "@/lib/duckdb-client";

// The button never exports what's on screen: fetchAll runs its own
// uncapped query for the same key, so the file holds every row even if
// the visible table is truncated.
export default function CsvButton({
  filename,
  fetchAll,
}: {
  filename: string;
  fetchAll: () => Promise<QueryResult>;
}) {
  const [state, setState] = useState<"idle" | "busy" | "error">("idle");

  async function run() {
    if (state === "busy") return;
    setState("busy");
    try {
      downloadCsv(filename, await fetchAll());
      setState("idle");
    } catch (err) {
      console.error("csv export failed", err);
      setState("error");
    }
  }

  return (
    <button type="button" className="csv-button" onClick={run} disabled={state === "busy"}>
      {state === "busy"
        ? "Preparing…"
        : state === "error"
          ? "Export failed – retry"
          : "Download CSV"}
    </button>
  );
}
