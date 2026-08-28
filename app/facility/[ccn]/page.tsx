import type { Metadata } from "next";
import { BP } from "@/lib/config";
import { allCCNs, dataMap, getFacility } from "@/lib/data";
import { CMS_DATASET_URL } from "@/lib/config";
import { facilityDescription, pageMetadata } from "@/lib/seo";
import FacilityRecords from "@/components/FacilityRecords";
import FullRecord from "@/components/FullRecord";
import Stars from "@/components/Stars";

export const dynamicParams = false;

export function generateStaticParams() {
  return allCCNs().map((ccn) => ({ ccn }));
}

// The title carries the published city and state beside the name:
// searchers type places, and franchise names repeat across states, so
// the qualifier is what makes fourteen thousand titles distinct. The
// h1 stays the provider name alone; the address line under it already
// shows the reader the same values.
export async function generateMetadata({
  params,
}: {
  params: Promise<{ ccn: string }>;
}): Promise<Metadata> {
  const { ccn: raw } = await params;
  const ccn = decodeURIComponent(raw);
  const f = getFacility(ccn);
  if (!f) return { title: "Facility" };
  const name = f.get("Provider Name").trim();
  const city = f.get("City/Town").trim();
  const state = f.get("State").trim();
  return pageMetadata({
    title: `${name} · ${city}, ${state}`,
    description: facilityDescription(name, city, state, ccn),
    path: `/facility/${encodeURIComponent(ccn)}/`,
  });
}

const KEY_FACTS: [string, string][] = [
  ["Ownership type", "Ownership Type"],
  ["Certified beds", "Number of Certified Beds"],
  ["Average residents per day", "Average Number of Residents per Day"],
  ["Provider type", "Provider Type"],
  ["In a hospital", "Provider Resides in Hospital"],
  // Displayed for every facility, whatever they say. Showing these only
  // when they carry the alarming value made absence the carrier of every
  // other value, and a reader could not tell "CMS published N" from "CMS
  // published nothing" -- different facts. The chips below stay as
  // emphasis on text that is now present regardless.
  ["Abuse icon", "Abuse Icon"],
  ["Special focus status", "Special Focus Status"],
  ["First certified", "Date First Approved to Provide Medicare and Medicaid Services"],
  ["Chain", "Chain Name"],
  ["Legal business name", "Legal Business Name"],
];

const RATINGS: [string, string][] = [
  ["Overall", "Overall Rating"],
  ["Health inspection", "Health Inspection Rating"],
  ["Quality measures", "QM Rating"],
  ["Staffing", "Staffing Rating"],
];

export default async function FacilityPage({
  params,
}: {
  params: Promise<{ ccn: string }>;
}) {
  const { ccn: raw } = await params;
  const ccn = decodeURIComponent(raw);
  const f = getFacility(ccn);
  if (!f) return <p>Facility not found in the current data batch.</p>;

  // Trimmed to match listStates() and the Parquet partition names; the
  // displayed row values stay exactly as CMS published them.
  const state = f.get("State").trim();
  const specialFocus = f.get("Special Focus Status").trim();
  const abuse = f.get("Abuse Icon").trim().toUpperCase() === "Y";
  const ownType = f.get("Ownership Type").trim();

  return (
    <>
      <div className="record-head">
        <p className="muted mono" style={{ margin: 0 }}>
          CCN {ccn}
        </p>
        <h1>{f.get("Provider Name")}</h1>
        <p className="record-sub">
          {f.get("Provider Address")}, {f.get("City/Town")}, {state}{" "}
          {f.get("ZIP Code")} · {f.get("Telephone Number")} ·{" "}
          <a href={`${BP}/state/${state}/`}>All {state} facilities</a>
        </p>

        {(ownType || specialFocus || abuse) && (
          <p style={{ margin: "0 0 10px" }}>
            {ownType && <span className="chip">{ownType}</span>}
            {abuse && <span className="chip chip-warn">Abuse icon: Y</span>}
            {specialFocus && (
              <span className="chip chip-warn">{specialFocus}</span>
            )}
          </p>
        )}

        <div className="factgrid">
          {RATINGS.map(([label, colName]) => (
            <dl className="fact" key={colName}>
              <dt>{label} rating</dt>
              <dd>
                <Stars value={f.get(colName)} />
              </dd>
            </dl>
          ))}
          {KEY_FACTS.map(([label, colName]) => {
            const v = f.get(colName).trim();
            return (
              <dl className="fact" key={colName}>
                <dt>{label}</dt>
                <dd>{v || <span className="muted">&ndash;</span>}</dd>
              </dl>
            );
          })}
        </div>

        {(() => {
          const src = dataMap().tables["providers"];
          return src ? (
            <p className="prov">
              Header facts: {src.dataset_name ?? "Provider information"} · file{" "}
              <span className="mono">{src.source_file}</span>
              {src.dataset_id ? (
                <>
                  {" "}· CMS dataset{" "}
                  <a
                    className="mono"
                    href={CMS_DATASET_URL(src.dataset_id)}
                    rel="noopener noreferrer"
                  >
                    {src.dataset_id}
                  </a>
                </>
              ) : null}
              {src.modified_date ? <> · last modified {src.modified_date}</> : null}
              {" "}· shown unmodified
            </p>
          ) : null;
        })()}

        <FullRecord ccn={ccn} />
      </div>

      <FacilityRecords ccn={ccn} state={state} />
    </>
  );
}
