import { BP, SITE_TAGLINE } from "@/lib/config";
import { dataMap, listStates, ownershipRollup, providersTable } from "@/lib/data";
import FacilitySearch from "@/components/FacilitySearch";
import Provenance from "@/components/Provenance";

function OwnershipLine({ total }: { total: number }) {
  const r = ownershipRollup();
  if (!r) return null;
  return (
    <p className="count-line">
      Of the {total.toLocaleString()} certified facilities in this batch,{" "}
      {r.forProfit.toLocaleString()} are operated for profit,{" "}
      {r.nonProfit.toLocaleString()} by non-profits, and{" "}
      {r.government.toLocaleString()} by governments
      {r.other ? `, with ${r.other.toLocaleString()} listed otherwise` : ""}.
      Every facility here is certified to receive Medicare or Medicaid.
    </p>
  );
}

export default function Home() {
  const states = listStates();
  const total = providersTable().rows.length;
  const providersInfo = dataMap().tables["providers"];

  return (
    <>
      <h1>Every Medicare and Medicaid certified nursing home, on the record.</h1>
      <p className="lede">
        {SITE_TAGLINE} Search {total.toLocaleString()} facilities, or browse by
        state. Every table links back to the CMS dataset it came from, and the
        untouched source files are free to download.
      </p>

      <OwnershipLine total={total} />

      <FacilitySearch />

      <h2>Browse by state</h2>
      <div className="tablewrap">
        <table className="state-table">
          <thead>
            <tr>
              <th>State</th>
              <th className="num">Facilities</th>
            </tr>
          </thead>
          <tbody>
            {states.map((s) => (
              <tr key={s.state}>
                <td>
                  <a href={`${BP}/state/${s.state}/`}>{s.state}</a>
                </td>
                <td className="num">{s.count.toLocaleString()}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
      {providersInfo ? <Provenance info={providersInfo} /> : null}
    </>
  );
}
