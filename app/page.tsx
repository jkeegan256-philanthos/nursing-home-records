import type { Metadata } from "next";
import { BP, SITE_NAME, SITE_TAGLINE } from "@/lib/config";
import { dataMap, listStates, ownershipRollup, providersTable } from "@/lib/data";
import { pageMetadata } from "@/lib/seo";

// The home page keeps the bare site name as its title (absolute, so
// the template does not double it) and gets a count-free description:
// counts cached in a search result go stale between batches.
export const metadata: Metadata = {
  ...pageMetadata({
    title: SITE_NAME,
    description:
      "Every Medicare and Medicaid certified nursing home in the United " +
      "States: CMS ratings, inspections, penalties, and ownership " +
      "disclosures, searchable and shown exactly as published.",
    path: "/",
  }),
  title: { absolute: SITE_NAME },
};
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
      <p className="count-line">Certified facilities per state.</p>
      <ul className="state-columns">
        {states.map((s) => (
          <li key={s.state}>
            <a href={`${BP}/state/${s.state}/`}>{s.state}</a>
            <span className="statecount">{s.count.toLocaleString()}</span>
          </li>
        ))}
      </ul>
      {providersInfo ? <Provenance info={providersInfo} /> : null}
    </>
  );
}
