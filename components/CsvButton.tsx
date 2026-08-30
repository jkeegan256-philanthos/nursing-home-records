"use client";

import { useState } from "react";
import { downloadCsv } from "@/lib/csv";
import type { QueryResult } from "@/lib/duckdb-client";

// fetchAll supplies the complete record, never a capped slice: the
// engine-backed callers run their own uncapped query, and the state
// page passes its full server-rendered rows, which are already whole.
// Either way the file holds every row even where the visible table
// is truncated.
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
