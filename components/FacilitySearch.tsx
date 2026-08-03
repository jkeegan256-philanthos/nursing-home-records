"use client";

import { useEffect, useMemo, useState } from "react";
import { BP } from "@/lib/config";
import Stars from "@/components/Stars";

type Slim = { columns: string[]; rows: (string | null)[][] };
type Hit = { ccn: string; name: string; city: string; state: string; zip: string; rating: string };

export default function FacilitySearch() {
  const [slim, setSlim] = useState<Slim | null>(null);
  const [failed, setFailed] = useState(false);
  const [q, setQ] = useState("");

  useEffect(() => {
    let alive = true;
    fetch(`${BP}/data/providers-slim.json`)
      .then((r) => (r.ok ? r.json() : Promise.reject(new Error(String(r.status)))))
      .then((j) => alive && setSlim(j))
      .catch(() => alive && setFailed(true));
    return () => {
      alive = false;
    };
  }, []);

  const hits: Hit[] = useMemo(() => {
    if (!slim) return [];
    const needle = q.trim().toLowerCase();
    if (needle.length < 2) return [];
    const [ci, ni, cti, si, zi, ri] = [0, 1, 2, 3, 4, 5];
    const out: Hit[] = [];
    for (const r of slim.rows) {
      const hay = `${r[ni]} ${r[cti]} ${r[ci]} ${r[zi]}`.toLowerCase();
      if (hay.includes(needle)) {
        out.push({
          ccn: r[ci] ?? "",
          name: r[ni] ?? "",
          city: r[cti] ?? "",
          state: r[si] ?? "",
          zip: r[zi] ?? "",
          rating: r[ri] ?? "",
        });
        if (out.length >= 40) break;
      }
    }
    return out;
  }, [slim, q]);

  return (
    <div className="searchbox">
      <input
        type="search"
        value={q}
        onChange={(e) => setQ(e.target.value)}
        placeholder="Search by facility name, city, ZIP, or CCN"
        aria-label="Search facilities"
      />
      {failed ? (
        <p className="search-hint">
          The search index did not load. Browse by state below instead.
        </p>
      ) : q.trim().length >= 2 && slim ? (
        hits.length ? (
          <>
            <ul className="search-results">
              {hits.map((h) => (
                <li key={h.ccn}>
                  <a href={`${BP}/facility/${encodeURIComponent(h.ccn)}/`}>
                    <span className="name">{h.name}</span>
                    <span className="muted">
                      {h.city}, {h.state} {h.zip}
                    </span>
                    <span className="mono muted">{h.ccn}</span>
                    <Stars value={h.rating} />
                  </a>
                </li>
              ))}
            </ul>
            <p className="search-hint">
              Showing the first {hits.length} matches.
            </p>
          </>
        ) : (
          <p className="search-hint">No facilities match that search.</p>
        )
      ) : q ? (
        <p className="search-hint">Type at least two characters.</p>
      ) : null}
    </div>
  );
}
