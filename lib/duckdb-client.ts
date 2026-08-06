import * as duckdb from "@duckdb/duckdb-wasm";
import { BP } from "@/lib/config";

let dbPromise: Promise<duckdb.AsyncDuckDB> | null = null;

// If the engine can't come up in this long, surface the friendly error
// (every catch site points readers at the Data page downloads) instead
// of an infinite "Loading".
const INIT_TIMEOUT_MS = 30_000;

function withTimeout<T>(p: Promise<T>, ms: number, what: string): Promise<T> {
  return new Promise<T>((resolve, reject) => {
    const t = setTimeout(() => reject(new Error(`${what} timed out after ${ms}ms`)), ms);
    p.then(
      (v) => (clearTimeout(t), resolve(v)),
      (e) => (clearTimeout(t), reject(e))
    );
  });
}

async function init(): Promise<duckdb.AsyncDuckDB> {
  // Engine files are vendored into public/duckdb by
  // scripts/vendor-assets.mjs — same origin, so the worker loads
  // directly and no CDN is ever contacted.
  const bundle = await duckdb.selectBundle({
    mvp: {
      mainModule: `${BP}/duckdb/duckdb-mvp.wasm`,
      mainWorker: `${BP}/duckdb/duckdb-browser-mvp.worker.js`,
    },
    eh: {
      mainModule: `${BP}/duckdb/duckdb-eh.wasm`,
      mainWorker: `${BP}/duckdb/duckdb-browser-eh.worker.js`,
    },
  });
  const worker = new Worker(bundle.mainWorker!);
  const db = new duckdb.AsyncDuckDB(new duckdb.VoidLogger(), worker);
  await db.instantiate(bundle.mainModule, bundle.pthreadWorker);
  return db;
}

export function getDB(): Promise<duckdb.AsyncDuckDB> {
  dbPromise ??= withTimeout(init(), INIT_TIMEOUT_MS, "DuckDB startup").catch(
    (e) => {
      dbPromise = null; // let the next interaction retry from scratch
      throw e;
    }
  );
  return dbPromise;
}

export type QueryResult = { cols: string[]; rows: (string | null)[][] };

export function sqlIdent(name: string): string {
  return `"${name.replace(/"/g, '""')}"`;
}
export function sqlLit(value: string): string {
  return `'${value.replace(/'/g, "''")}'`;
}

/** Run one SQL statement and return plain strings. */
export async function querySQL(sql: string): Promise<QueryResult> {
  const db = await getDB();
  const conn = await db.connect();
  try {
    const res = await conn.query(sql);
    const cols = res.schema.fields.map((f) => f.name);
    const rows: (string | null)[][] = res
      .toArray()
      .map((r: any) => cols.map((c) => (r[c] == null ? null : String(r[c]))));
    return { cols, rows };
  } finally {
    await conn.close();
  }
}

/** Rows a table query returns at most; the UI's truncation notices use the same number. */
export const ROW_LIMIT = 2000;

/** Run one SELECT against a Parquet file over HTTP, filtered by equality. */
export async function queryParquet(
  url: string,
  where: { column: string; equals: string },
  limit = ROW_LIMIT
): Promise<QueryResult> {
  return querySQL(
    `SELECT * FROM read_parquet(${sqlLit(url)}) WHERE ${sqlIdent(where.column)} = ${sqlLit(where.equals)} LIMIT ${Math.max(0, Math.floor(limit))}`
  );
}

/** Same filter, no cap: CSV exports must contain every row, not the screen. */
export async function queryParquetAll(
  url: string,
  where: { column: string; equals: string }
): Promise<QueryResult> {
  return querySQL(
    `SELECT * FROM read_parquet(${sqlLit(url)}) WHERE ${sqlIdent(where.column)} = ${sqlLit(where.equals)}`
  );
}
