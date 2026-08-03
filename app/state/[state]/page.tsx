import type { Metadata } from "next";
import { BP } from "@/lib/config";
import { dataMap, facilitiesFor, listStates } from "@/lib/data";
import Provenance from "@/components/Provenance";
import Stars from "@/components/Stars";

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

export default async function StatePage({
  params,
}: {
  params: Promise<{ state: string }>;
}) {
  const { state } = await params;
  const facilities = facilitiesFor(state);
  const providersInfo = dataMap().tables["providers"];

  return (
    <>
      <h1>{state} nursing homes</h1>
      <p className="count-line">
        {facilities.length.toLocaleString()} certified facilities, sorted by
        name.
      </p>
      <div className="tablewrap">
        <table>
          <thead>
            <tr>
              <th>Facility</th>
              <th>City</th>
              <th>CCN</th>
              <th className="num">Certified beds</th>
              <th>Overall rating</th>
            </tr>
          </thead>
          <tbody>
            {facilities.map((f) => (
              <tr key={f.ccn}>
                <td>
                  <a href={`${BP}/facility/${encodeURIComponent(f.ccn)}/`}>
                    {f.name}
                  </a>
                </td>
                <td>{f.city}</td>
                <td className="mono">{f.ccn}</td>
                <td className="num">{f.beds}</td>
                <td>
                  <Stars value={f.rating} />
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
      {providersInfo ? <Provenance info={providersInfo} /> : null}
    </>
  );
}
