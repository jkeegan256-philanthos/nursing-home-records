// CSV downloads for on-screen result sets. Values go out exactly as
// published: quoting is the only transformation, and the UTF-8 BOM is
// there so Excel opens the file with the right encoding.

import type { QueryResult } from "@/lib/duckdb-client";

function field(v: string | null): string {
  const s = v ?? "";
  return /[",\r\n]/.test(s) ? `"${s.replace(/"/g, '""')}"` : s;
}

const BOM = "\uFEFF";

export function toCsv(result: QueryResult): string {
  const lines = [result.cols.map(field).join(",")];
  for (const row of result.rows) lines.push(row.map(field).join(","));
  return BOM + lines.join("\r\n") + "\r\n";
}

/** nursinghomerecords_<table>_<key>_<vintage>.csv */
export function csvFilename(table: string, key: string, vintage: string): string {
  const part = (s: string) =>
    s.replace(/[^A-Za-z0-9]+/g, "-").replace(/^-+|-+$/g, "") || "x";
  return `nursinghomerecords_${part(table)}_${part(key)}_${part(vintage)}.csv`;
}

export function downloadCsv(filename: string, result: QueryResult): void {
  const blob = new Blob([toCsv(result)], { type: "text/csv;charset=utf-8" });
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = filename;
  a.click();
  URL.revokeObjectURL(url);
}
