import * as duckdb from "@duckdb/duckdb-wasm";

let dbPromise: Promise<duckdb.AsyncDuckDB> | null = null;

async function init(): Promise<duckdb.AsyncDuckDB> {
  const bundles = duckdb.getJsDelivrBundles();
  const bundle = await duckdb.selectBundle(bundles);
  const workerUrl = URL.createObjectURL(
    new Blob([`importScripts("${bundle.mainWorker}");`], {
      type: "text/javascript",
    })
  );
  const worker = new Worker(workerUrl);
  const db = new duckdb.AsyncDuckDB(new duckdb.VoidLogger(), worker);
  await db.instantiate(bundle.mainModule, bundle.pthreadWorker);
  URL.revokeObjectURL(workerUrl);
  return db;
}

export function getDB(): Promise<duckdb.AsyncDuckDB> {
  return (dbPromise ??= init());
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

/** Run one SELECT against a Parquet file over HTTP, filtered by equality. */
export async function queryParquet(
  url: string,
  where: { column: string; equals: string },
  limit = 2000
): Promise<QueryResult> {
  return querySQL(
    `SELECT * FROM read_parquet('${url}') WHERE ${sqlIdent(where.column)} = ${sqlLit(where.equals)} LIMIT ${limit}`
  );
}
