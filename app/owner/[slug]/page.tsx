import type { Metadata } from "next";
import { BP, CMS_DATASET_URL } from "@/lib/config";
import { dataMap, getOwnerPage, ownerPages } from "@/lib/data";
import { termAnchor } from "@/lib/glossary";
import { ownerDescription, pageMetadata } from "@/lib/seo";
import CopyName from "@/components/CopyName";

export const dynamicParams = false;

export function generateStaticParams() {
  return ownerPages().owners.map(({ slug }) => ({ slug }));
}

export async function generateMetadata({
  params,
}: {
  params: Promise<{ slug: string }>;
}): Promise<Metadata> {
  const { slug } = await params;
  const o = getOwnerPage(slug);
  if (!o) return { title: "Owner" };
  return pageMetadata({
    title: `${o.name} · ownership record`,
    description: ownerDescription(o.name, o.facilities, o.states),
    path: `/owner/${slug}/`,
  });
}

export default async function OwnerPage({
  params,
}: {
  params: Promise<{ slug: string }>;
}) {
  const { slug } = await params;
  const o = getOwnerPage(slug);
  if (!o) return <p>Name not found in the current data batch.</p>;
  const info = dataMap().tables["ownership_all"];
  const threshold = ownerPages().threshold;

  // Distinct facilities per state, so a large footprint has a shape
  // before it has a scroll. Counts only, ever: no rating or quality
  // measure joins this grouping, because a per-state quality figure
  // for one owner is portfolio scoring, which this site does not do.
  const byState = new Map<string, Set<string>>();
  for (const r of o.rows) {
    const st = ((r[3] ?? "") + "").trim();
    if (!st) continue;
    if (!byState.has(st)) byState.set(st, new Set());
    byState.get(st)!.add((r[0] ?? "") + "");
  }
  const stateCounts = [...byState.entries()]
    .map(([st, ccns]) => ({ st, n: ccns.size }))
    .sort((a, b) => b.n - a.n || a.st.localeCompare(b.st));

  return (
    <div className="record-head">
      <p className="muted mono" style={{ margin: 0 }}>
        Owner record, grouped by exact name
      </p>
      <h1 style={{ margin: "2px 0 8px" }}>{o.name}</h1>
      <p style={{ margin: "0 0 10px" }}>
        {o.types.map((t) => (
          <span className="chip" key={t}>
            {t}
          </span>
        ))}
      </p>
      <p className="count-line">
        {o.facilities.toLocaleString()}{" "}
        {o.facilities === 1 ? "facility" : "facilities"} in {o.states}{" "}
        {o.states === 1 ? "state" : "states"}, {o.rows.length.toLocaleString()}{" "}
        disclosure rows. Same name can be more than one person; different
        spellings of one person are listed separately.{" "}
        <a href={`${BP}/owners/?name=${encodeURIComponent(o.name)}`}>
          Open in the live explorer
        </a>{" "}
        for ratings and CSV download.
      </p>
      {stateCounts.length > 1 ? (
        <p className="count-line">
          Facilities by state:{" "}
          {stateCounts.map((s, i) => (
            <span key={s.st}>
              {i > 0 ? " · " : ""}
              <span className="mono">
                {s.st} {s.n.toLocaleString()}
              </span>
            </span>
          ))}
        </p>
      ) : null}
      <CopyName name={o.name} />
      <p className="search-hint">
        Researching this name further? <a href={`${BP}/about/`}>About</a>{" "}
        explains where public records continue, and why this site links
        to none of them by name.
      </p>
      <div className="tablewrap">
        <table>
          <thead>
            <tr>
              <th>Facility</th>
              <th>City</th>
              <th>State</th>
              <th>Role</th>
              <th>Ownership percentage</th>
              <th>Association date</th>
            </tr>
          </thead>
          <tbody>
            {o.rows.map((r, i) => (
              <tr key={i}>
                <td>
                  <a href={`${BP}/facility/${encodeURIComponent(r[0] ?? "")}/`}>
                    {r[1] || r[0]}
                  </a>
                </td>
                <td>{r[2]}</td>
                <td>{r[3]}</td>
                <td>
                  {r[4] ? (
                    <a
                      className="quiet-link"
                      href={`${BP}/glossary/#${termAnchor(r[4])}`}
                    >
                      {r[4]}
                    </a>
                  ) : (
                    <span className="muted">&ndash;</span>
                  )}
                </td>
                <td>{r[5] || <span className="muted">&ndash;</span>}</td>
                <td>{r[6] || <span className="muted">&ndash;</span>}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
      <p className="prov">
        Source: {info?.dataset_name ?? "Ownership"}
        {info?.dataset_id ? (
          <>
            {" "}· CMS dataset{" "}
            <a
              className="mono"
              href={CMS_DATASET_URL(info.dataset_id)}
              rel="noopener noreferrer"
            >
              {info.dataset_id}
            </a>
          </>
        ) : null}
        {info?.modified_date ? <> · last modified {info.modified_date}</> : null}
        . Values are shown unmodified. A page exists for every name connected
        to {threshold} or more facilities by the same rule; every other name
        is searchable on the{" "}
        <a href={`${BP}/owners/`}>Ownership page</a>.
      </p>
    </div>
  );
}
