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

// Where the engine looks for extensions. DuckDB appends
// /<version>/<platform>/<name>.duckdb_extension.wasm to this, and
// scripts/vendor-assets.mjs writes the matching tree under
// public/duckdb/extensions at build time.
//
// Setting this is not a nicety. Left at its default the engine fetches
// the Parquet reader from extensions.duckdb.org the first time any page
// runs a query — which it did, on every facility page, for the first
// three weeks this site was live. Serving duckdb-*.wasm from your own
// origin does not prevent that; only redirecting the repository does.
function extensionRepository(): string {
  return new URL(`${BP}/duckdb/extensions`, window.location.origin).toString();
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

  // Point the engine at this origin, then load Parquet up front so a
  // failure surfaces here — where every caller already shows the
  // "use the original files on the Data page" message — instead of
  // halfway through a reader's first query.
  //
  // Each statement is best-effort on purpose. A future DuckDB that
  // renames one of these settings would otherwise throw here and take
  // the whole interactive layer down with it, which is a worse outcome
  // than the one being prevented. What keeps that tolerance honest is
  // scripts/check_no_third_party.mjs: if these ever stop redirecting
  // the engine, the build fails before anyone is served.
  const repo = extensionRepository();
  const conn = await db.connect();
  try {
    for (const sql of [
      `SET custom_extension_repository = '${repo}'`,
      `SET autoinstall_extension_repository = '${repo}'`,
      "INSTALL parquet",
      "LOAD parquet",
    ]) {
      try {
        await conn.query(sql);
      } catch (err) {
        console.error(`DuckDB setup step failed: ${sql}`, err);
      }
    }
  } finally {
    await conn.close();
  }
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

/** One or more Parquet files, read as a single relation. Several files
 * appear when a state-partitioned table also has an _OTHER shard: the
 * rows CMS published without a usable state code live there, and a page
 * that queried only <ST>.parquet would show a record that is short of
 * the published one without saying so. */
function parquetSource(url: string | string[]): string {
  const urls = Array.isArray(url) ? url : [url];
  return `read_parquet([${urls.map(sqlLit).join(", ")}])`;
}

/* A caller that sorts must sort here, in the query, never after the
 * fetch: post-fetch sorting orders only the rows that survived LIMIT,
 * which would present an arbitrary scan slice as "newest first" and
 * put a disclosure clause on a false claim. NULLS LAST is stated
 * rather than inherited, so rows without a value in the sort column
 * land at the end wherever the engine's default might put them. */
export type OrderBy = { column: string; direction: "ASC" | "DESC" };

function orderClause(orderBy?: OrderBy): string {
  if (!orderBy) return "";
  return ` ORDER BY ${sqlIdent(orderBy.column)} ${orderBy.direction} NULLS LAST`;
}

/** Run one SELECT against Parquet over HTTP, filtered by equality. */
export async function queryParquet(
  url: string | string[],
  where: { column: string; equals: string },
  limit = ROW_LIMIT,
  orderBy?: OrderBy
): Promise<QueryResult> {
  return querySQL(
    `SELECT * FROM ${parquetSource(url)} WHERE ${sqlIdent(where.column)} = ${sqlLit(where.equals)}${orderClause(orderBy)} LIMIT ${Math.max(0, Math.floor(limit))}`
  );
}

/** Same filter, no cap: CSV exports must contain every row, not the screen. */
export async function queryParquetAll(
  url: string | string[],
  where: { column: string; equals: string },
  orderBy?: OrderBy
): Promise<QueryResult> {
  return querySQL(
    `SELECT * FROM ${parquetSource(url)} WHERE ${sqlIdent(where.column)} = ${sqlLit(where.equals)}${orderClause(orderBy)}`
  );
}
