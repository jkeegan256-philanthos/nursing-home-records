import type { Metadata } from "next";
import {
  BP,
  CMS_DATASET_URL,
  CORRECTIONS_EMAIL,
  CORRECTIONS_URL,
  REPO_URL,
} from "@/lib/config";
import { ledger, missingProviderColumns, siteMeta } from "@/lib/data";

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

      {ledger().length > 0 && (
        <>
          <h2>Batch history</h2>
          <div className="tablewrap">
            <table>
              <thead>
                <tr>
                  <th>Served</th>
                  <th>Trigger</th>
                  <th>Commit</th>
                  <th>Source zip</th>
                  <th className="num">MB</th>
                </tr>
              </thead>
              <tbody>
                {[...ledger()].reverse().map((e, i) => (
                  <tr key={i}>
                    <td className="mono">
                      {e.generated_at.slice(0, 16).replace("T", " ")} UTC
                    </td>
                    <td>{e.trigger}</td>
                    <td className="mono">
                      {e.commit ? e.commit.slice(0, 7) : <span className="muted">&ndash;</span>}
                    </td>
                    <td className="mono">{e.source_zip.filename}</td>
                    <td className="num">
                      {(e.source_zip.bytes / 1_000_000).toFixed(1)}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
          <p className="prov">
            This ledger records what this site served and when. It proves the
            mirror&apos;s history, not CMS&apos;s; CMS does not publish stable
            archives of past batches to compare against. The chain is kept in
            two places, here and in the repository, and a build that can read
            neither stops rather than start a new chain over the old one.
            Each entry also records the counts this site derives from that
            batch beside the checksum of the file they came from, so a
            number that moves while its source has not is caught as a
            defect in this pipeline rather than reported as a change in
            CMS&apos;s data. Machine-readable:{" "}
            <a className="mono" href={`${BP}/data/ledger.json`}>
              ledger.json
            </a>
            .
          </p>
        </>
      )}

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
        or email{" "}
        <a href={`mailto:${CORRECTIONS_EMAIL}`}>{CORRECTIONS_EMAIL}</a> and it
        will be fixed.
      </p>
      <p>
        This site makes no third-party requests: the fonts, the query engine,
        and the engine&apos;s Parquet extension are all served from this
        domain, alongside the data. Every build loads the finished site in a
        browser, records every request it makes, and fails if any of them
        goes to another host. That check is why this sentence is here. It was
        here once before while it was untrue — the engine was fetching its
        Parquet reader from{" "}
        <span className="mono">extensions.duckdb.org</span> on every facility
        page, and the check at the time only searched the published files for
        known hostnames, which cannot see a URL that the engine assembles
        while it runs. Both the retraction and the return are dated in the{" "}
        <a href={`${REPO_URL}/blob/main/PROJECT.md`} rel="noopener noreferrer">
          decision log
        </a>
        .
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
