"use client";

import { useEffect, useMemo, useState } from "react";
import { BP } from "@/lib/config";
import Stars from "@/components/Stars";

type Slim = { columns: string[]; rows: (string | null)[][] };
type Hit = { ccn: string; name: string; city: string; state: string; zip: string; rating: string };
type OwnerHit = { name: string; types: string; facilities: number };

// Every token must appear somewhere in the haystack, so JOHN MITCHELL
// finds MITCHELL, JOHN. Exact strings still: tokens split the query,
// never the published name.
function tokenMatch(hay: string, tokens: string[]): boolean {
  return tokens.every((t) => hay.includes(t));
}

export default function FacilitySearch() {
  const [slim, setSlim] = useState<Slim | null>(null);
  const [failed, setFailed] = useState(false);
  const [owners, setOwners] = useState<Slim | null>(null);
  const [ownersFailed, setOwnersFailed] = useState(false);
  const [q, setQ] = useState("");

  useEffect(() => {
    let alive = true;
    fetch(`${BP}/data/providers-slim.json`)
      .then((r) => (r.ok ? r.json() : Promise.reject(new Error(String(r.status)))))
      .then((j) => alive && setSlim(j))
      .catch((err) => {
        console.error("search index failed to load", err);
        if (alive) setFailed(true);
      });
    return () => {
      alive = false;
    };
  }, []);

  // The owner index is ~60k names; fetch it once, and only after a
  // search actually starts.
  const wantOwners = q.trim().length >= 3;
  useEffect(() => {
    if (!wantOwners || owners || ownersFailed) return;
    let alive = true;
    fetch(`${BP}/data/owners-slim.json`)
      .then((r) => (r.ok ? r.json() : Promise.reject(new Error(String(r.status)))))
      .then((j) => alive && setOwners(j))
      .catch((err) => {
        console.error("owner search index failed to load", err);
        if (alive) setOwnersFailed(true);
      });
    return () => {
      alive = false;
    };
  }, [wantOwners, owners, ownersFailed]);

  const tokens = useMemo(
    () => q.trim().toLowerCase().split(/\s+/).filter(Boolean),
    [q]
  );

  const hits: Hit[] = useMemo(() => {
    if (!slim || tokens.length === 0 || q.trim().length < 2) return [];
    const [ci, ni, cti, si, zi, ri] = [0, 1, 2, 3, 4, 5];
    const out: Hit[] = [];
    for (const r of slim.rows) {
      const hay = `${r[ni]} ${r[cti]} ${r[ci]} ${r[zi]}`.toLowerCase();
      if (tokenMatch(hay, tokens)) {
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
  }, [slim, tokens, q]);

  const ownerHits: OwnerHit[] = useMemo(() => {
    if (!owners || !wantOwners || tokens.length === 0) return [];
    const out: OwnerHit[] = [];
    for (const r of owners.rows) {
      if (tokenMatch((r[0] ?? "").toLowerCase(), tokens)) {
        out.push({
          name: r[0] ?? "",
          types: r[1] ?? "",
          facilities: Number(r[2] ?? 0),
        });
        if (out.length >= 20) break;
      }
    }
    return out;
  }, [owners, wantOwners, tokens]);

  const searching = q.trim().length >= 2;

  return (
    <div className="searchbox">
      <input
        type="search"
        value={q}
        onChange={(e) => setQ(e.target.value)}
        placeholder="Search facilities by name, city, ZIP, or CCN — or owner names"
        aria-label="Search facilities and owner names"
      />
      {failed ? (
        <p className="search-hint">
          The search index did not load. Browse by state below instead.
        </p>
      ) : searching && slim ? (
        <>
          {hits.length ? (
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
                Showing the first {hits.length} facility matches.
              </p>
            </>
          ) : (
            <p className="search-hint">No facilities match that search.</p>
          )}
          {ownerHits.length > 0 && (
            <>
              <p className="search-hint">
                Owner, officer, and company names ({ownerHits.length} shown):
              </p>
              <ul className="search-results">
                {ownerHits.map((o) => (
                  <li key={o.name}>
                    <a href={`${BP}/owners/?name=${encodeURIComponent(o.name)}`}>
                      <span className="name">{o.name}</span>
                      <span className="muted">{o.types}</span>
                      <span className="mono muted">
                        {o.facilities.toLocaleString()}{" "}
                        {o.facilities === 1 ? "facility" : "facilities"}
                      </span>
                    </a>
                  </li>
                ))}
              </ul>
            </>
          )}
        </>
      ) : q ? (
        <p className="search-hint">Type at least two characters.</p>
      ) : null}
    </div>
  );
}
