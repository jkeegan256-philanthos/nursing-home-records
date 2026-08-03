import type { Metadata } from "next";
import { BP, CMS_DATASET_URL } from "@/lib/config";
import { ownersTop } from "@/lib/data";
import OwnerExplorer from "@/components/OwnerExplorer";

export const metadata: Metadata = { title: "Ownership" };

export default function OwnersPage() {
  const owners = ownersTop();

  return (
    <>
      <h1>Who is behind each facility</h1>
      <p className="lede">
        Federal law requires nursing homes to disclose their owners, officers,
        directors, managing employees, and other parties. CMS publishes those
        disclosures, and this page regroups them by name: search any of the{" "}
        {owners ? owners.total_owners.toLocaleString() : "sixty thousand"}{" "}
        names to see every facility it is connected to, in what role, and
        since when.
      </p>
      <p className="lede">
        Read the role column carefully. The list includes lenders,
        consultants, and accounting firms as well as owners, because CMS
        requires all of them to be disclosed. Names are grouped exactly as
        published: one person can appear under several spellings, and common
        names can belong to more than one person. Role definitions are in the{" "}
        <a href={`${BP}/data/downloads/NH_Data_Dictionary.pdf`}>
          CMS data dictionary
        </a>
        .
      </p>

      <OwnerExplorer />

      {owners && owners.top.length > 0 && (
        <>
          <h2>Largest footprints in this batch</h2>
          <p className="count-line">
            The 100 names connected to the most facilities. Counts are
            distinct facilities; a name may hold different roles at each.
          </p>
          <div className="tablewrap">
            <table>
              <thead>
                <tr>
                  <th>Name</th>
                  <th>Type</th>
                  <th className="num">Facilities</th>
                  <th className="num">States</th>
                </tr>
              </thead>
              <tbody>
                {owners.top.slice(0, 100).map((o) => (
                  <tr key={o.name}>
                    <td>
                      <a href={`${BP}/owners/?name=${encodeURIComponent(o.name)}`}>
                        {o.name}
                      </a>
                    </td>
                    <td>{o.types}</td>
                    <td className="num">{o.facilities.toLocaleString()}</td>
                    <td className="num">{o.states.toLocaleString()}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
          <p className="prov">
            Source: {owners.dataset_name ?? "Ownership"} · file{" "}
            <span className="mono">{owners.source_file}</span>
            {owners.dataset_id ? (
              <>
                {" "}· CMS dataset{" "}
                <a
                  className="mono"
                  href={CMS_DATASET_URL(owners.dataset_id)}
                  rel="noopener noreferrer"
                >
                  {owners.dataset_id}
                </a>
              </>
            ) : null}
            {owners.modified_date ? (
              <> · last modified {owners.modified_date}</>
            ) : null}
            {" "}· grouped by exact name, otherwise unmodified
            {owners.blank_owner_rows
              ? ` · ${owners.blank_owner_rows.toLocaleString()} rows with a blank name are omitted here but appear on facility pages`
              : ""}
          </p>
        </>
      )}
    </>
  );
}
