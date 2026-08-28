import type { Metadata } from "next";
import { CMS_DATASET_URL } from "@/lib/config";
import { averagesFor, dataMap, facilitiesFor, listStates } from "@/lib/data";
import Provenance from "@/components/Provenance";
import StateTable from "@/components/StateTable";

export const dynamicParams = false;

export function generateStaticParams() {
  return listStates().map(({ state }) => ({ state }));
}

export async function generateMetadata({
  params,
}: {
  params: Promise<{ state: string }>;
}): Promise<Metadata> {
  const { state } = await params;
  return { title: `${state} nursing homes` };
}

// The slice shown in the compact block. A curated subset of the file's
// columns, like the facility page's key facts, and under the same rule
// that makes curation a convenience rather than a filter: the whole
// published row is one click below. This list is display vocabulary for
// this dataset; ADAPTATION.md touchpoint 3 covers it.
const AVERAGE_FACTS: [string, string][] = [
  ["Overall rating", "Overall Rating"],
  ["Health inspection rating", "Health Inspection Rating"],
  ["Quality measures rating", "QM Rating"],
  ["Staffing rating", "Staffing Rating"],
  ["Health deficiencies, cycle 1", "Cycle 1 Total Number of Health Deficiencies"],
];

// CMS's own state and national averages, beside this state's list.
// Context, not comparison: these are published values that answer "is
// that a lot?", and the side-by-side of facilities against each other
// remains Care Compare's question, not this page's.
function StateAverages({ state }: { state: string }) {
  const a = averagesFor(state);
  if (!a) return null;
  const cell = (row: (string | null)[] | null, col: string) => {
    if (!row) return null;
    const i = a.columns.indexOf(col);
    return i < 0 ? null : (row[i] ?? "").trim() || null;
  };
  const facts = AVERAGE_FACTS.map(([label, col]) => ({
    label,
    state: cell(a.stateRow, col),
    nation: cell(a.nationRow, col),
  })).filter((f) => f.state || f.nation);
  if (facts.length === 0) return null;

  return (
    <section className="averages">
      <h2>State and national averages, as published by CMS</h2>
      <div className="tablewrap">
        <table>
          <thead>
            <tr>
              <th>Measure</th>
              {a.stateRow ? <th className="num">{state} average</th> : null}
              {a.nationRow ? <th className="num">National average</th> : null}
            </tr>
          </thead>
          <tbody>
            {facts.map((f) => (
              <tr key={f.label}>
                <td>{f.label}</td>
                {a.stateRow ? (
                  <td className="num">
                    {f.state ?? <span className="muted">&ndash;</span>}
                  </td>
                ) : null}
                {a.nationRow ? (
                  <td className="num">
                    {f.nation ?? <span className="muted">&ndash;</span>}
                  </td>
                ) : null}
              </tr>
            ))}
          </tbody>
        </table>
      </div>
      {a.stateRow ? (
        <details className="fullrecord">
          <summary>Full {state} averages row as published</summary>
          <div className="tablewrap">
            <table>
              <tbody>
                {a.columns.map((c, i) => (
                  <tr key={c}>
                    <th scope="row">{c}</th>
                    <td>
                      {((a.stateRow as (string | null)[])[i] ?? "").trim() || (
                        <span className="muted">&ndash;</span>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </details>
      ) : null}
      <p className="prov">
        Source: {a.meta.dataset_name ?? "State and national averages"} · file{" "}
        <span className="mono">{a.meta.source_file}</span>
        {a.meta.dataset_id ? (
          <>
            {" "}· CMS dataset{" "}
            <a
              className="mono"
              href={CMS_DATASET_URL(a.meta.dataset_id)}
              rel="noopener noreferrer"
            >
              {a.meta.dataset_id}
            </a>
          </>
        ) : null}
        {a.meta.modified_date ? <> · last modified {a.meta.modified_date}</> : null}
        {" "}· averages computed and published by CMS, shown unmodified
      </p>
    </section>
  );
}

export default async function StatePage({
  params,
}: {
  params: Promise<{ state: string }>;
}) {
  const { state } = await params;
  const facilities = facilitiesFor(state);
  const providersInfo = dataMap().tables["providers"];
  const vintage =
    providersInfo?.modified_date?.slice(0, 7) ??
    dataMap().generated_at.slice(0, 7);

  return (
    <>
      <h1>{state} nursing homes</h1>
      <StateTable state={state} rows={facilities} vintage={vintage} />
      {providersInfo ? <Provenance info={providersInfo} /> : null}
      <StateAverages state={state} />
    </>
  );
}
