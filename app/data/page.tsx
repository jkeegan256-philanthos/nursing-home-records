import type { Metadata } from "next";
import { BP, CMS_DATASET_URL, CORRECTIONS_URL } from "@/lib/config";
import { missingProviderColumns, siteMeta } from "@/lib/data";

export const metadata: Metadata = { title: "Data & downloads" };

export default function DataPage() {
  const meta = siteMeta();
  const src = meta.source_zip;
  const notes: string[] = [
    ...(meta.warnings ?? []),
    ...missingProviderColumns().map(
      (c) =>
        `Provider information column "${c}" is not in this batch; fields that display it are blank.`
    ),
  ];

  return (
    <>
      <h1>Data &amp; downloads</h1>
      <p className="lede">
        Everything on this site comes from one monthly download of the CMS
        Provider Data Catalog nursing home theme. The files below are the
        originals, byte for byte. For display, each CSV is converted to
        Parquet; values are never edited, computed, or filtered.
      </p>

      <h2>Source batch</h2>
      <p>
        <span className="mono">{src.filename}</span> ·{" "}
        {(src.bytes / 1_000_000).toFixed(1)} MB · processed{" "}
        {String(meta.generated_at).slice(0, 10)}
        <br />
        <span className="muted">SHA-256</span>{" "}
        <span className="mono" style={{ wordBreak: "break-all" }}>
          {src.sha256}
        </span>
      </p>

      <h2>Original files</h2>
      <ul className="dl-list">
        {meta.downloads.map((name: string) => (
          <li key={name}>
            <a className="mono" href={`${BP}/data/downloads/${name}`} download>
              {name}
            </a>
          </li>
        ))}
      </ul>

      <h2>Datasets in this batch</h2>
      <div className="tablewrap">
        <table>
          <thead>
            <tr>
              <th>Dataset</th>
              <th>Source file</th>
              <th>CMS dataset</th>
              <th>Last modified</th>
              <th className="num">Rows</th>
            </tr>
          </thead>
          <tbody>
            {meta.tables.map((t: any) => (
              <tr key={t.table}>
                <td>{t.label}</td>
                <td className="mono">{t.source_file}</td>
                <td className="mono">
                  {t.dataset_id ? (
                    <a href={CMS_DATASET_URL(t.dataset_id)} rel="noopener noreferrer">
                      {t.dataset_id}
                    </a>
                  ) : (
                    <span className="muted">&ndash;</span>
                  )}
                </td>
                <td>{t.modified_date ?? <span className="muted">&ndash;</span>}</td>
                <td className="num">{t.rows.toLocaleString()}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
      <p className="prov">
        Datasets carry their own refresh dates. Files in one theme download can
        differ in vintage; the dates above are CMS&apos;s, not ours.
      </p>

      <h2>Method and corrections</h2>
      <p>
        The pipeline reads every column as text so leading zeros and codes
        survive, converts each CSV to Parquet for delivery, verifies row
        counts match exactly, and publishes the untouched originals above.
        Values are never edited, computed, or filtered, and every name gets
        the same layout by the same rules. If something here does not match
        the CMS source files, that is a bug:{" "}
        <a href={CORRECTIONS_URL} rel="noopener noreferrer">
          report it
        </a>{" "}
        and it will be fixed.
      </p>

      {notes.length ? (
        <>
          <h2>Processing notes</h2>
          <ul>
            {notes.map((w: string, i: number) => (
              <li key={i}>{w}</li>
            ))}
          </ul>
        </>
      ) : null}
    </>
  );
}
