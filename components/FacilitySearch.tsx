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

  // The dead end is not allowed to be the whole answer (ruled
  // 2026-09-11, from the first reader walk: "Life Care Center of
  // Bellingham" matched nothing while six Bellingham facilities and
  // seventeen Life Care names sat one query away, because every
  // token must match). When a multi-word search matches nothing as a
  // whole, show what the file contains for each word separately:
  // exact published values, counted in full, listed in the index's
  // own name order, labeled as partial matches. No merging, no
  // ranking, no guessing which word the reader meant.
  type Partial = {
    token: string;
    facCount: number;
    facs: Hit[];
    ownCount: number;
    owns: OwnerHit[];
  };
  const partials: Partial[] = useMemo(() => {
    if (!slim || !searching || hits.length > 0 || tokens.length < 2) return [];
    const out: Partial[] = [];
    const [ci, ni, cti, si, zi, ri] = [0, 1, 2, 3, 4, 5];
    for (const token of tokens) {
      if (token.length < 3) continue;
      let facCount = 0;
      const facs: Hit[] = [];
      for (const r of slim.rows) {
        const hay = `${r[ni]} ${r[cti]} ${r[ci]} ${r[zi]}`.toLowerCase();
        if (hay.includes(token)) {
          facCount++;
          if (facs.length < 4) {
            facs.push({
              ccn: r[ci] ?? "",
              name: r[ni] ?? "",
              city: r[cti] ?? "",
              state: r[si] ?? "",
              zip: r[zi] ?? "",
              rating: r[ri] ?? "",
            });
          }
        }
      }
      let ownCount = 0;
      const owns: OwnerHit[] = [];
      if (owners) {
        for (const r of owners.rows) {
          if ((r[0] ?? "").toLowerCase().includes(token)) {
            ownCount++;
            if (owns.length < 3) {
              owns.push({
                name: r[0] ?? "",
                types: r[1] ?? "",
                facilities: Number(r[2] ?? 0),
              });
            }
          }
        }
      }
      out.push({ token, facCount, facs, ownCount, owns });
    }
    return out;
  }, [slim, owners, searching, hits, tokens]);

  return (
    <div className="searchbox">
      <input
        type="search"
        value={q}
        onChange={(e) => setQ(e.target.value)}
        placeholder="Search all facilities by name, city, ZIP, CCN, or owner name"
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
          ) : partials.length > 0 ? (
            <>
              <p className="search-hint">
                No facility matches every word of that search together.
                What the file contains for each word separately, exact
                published values in name order:
              </p>
              {partials.map((p) => (
                <div key={p.token}>
                  {p.facCount === 0 && p.ownCount === 0 ? (
                    <p className="search-hint">
                      <span className="mono">{p.token}</span> appears in no
                      facility, city, or owner name in this batch.
                    </p>
                  ) : (
                    <>
                      {p.facCount > 0 && (
                        <>
                          <p className="search-hint">
                            <span className="mono">{p.token}</span>:{" "}
                            {p.facCount.toLocaleString()}{" "}
                            {p.facCount === 1 ? "facility" : "facilities"}
                            {p.facCount > p.facs.length
                              ? ` (first ${p.facs.length} by name)`
                              : ""}
                            :
                          </p>
                          <ul className="search-results">
                            {p.facs.map((h) => (
                              <li key={h.ccn}>
                                <a
                                  href={`${BP}/facility/${encodeURIComponent(h.ccn)}/`}
                                >
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
                        </>
                      )}
                      {p.ownCount > 0 && (
                        <>
                          <p className="search-hint">
                            <span className="mono">{p.token}</span>:{" "}
                            {p.ownCount.toLocaleString()} owner, officer, or
                            company{" "}
                            {p.ownCount === 1 ? "name" : "names"}
                            {p.ownCount > p.owns.length
                              ? ` (first ${p.owns.length} by name)`
                              : ""}
                            :
                          </p>
                          <ul className="search-results">
                            {p.owns.map((o) => (
                              <li key={o.name}>
                                <a
                                  href={`${BP}/owners/?name=${encodeURIComponent(o.name)}`}
                                >
                                  <span className="name">{o.name}</span>
                                  <span className="muted">{o.types}</span>
                                  <span className="mono muted">
                                    {o.facilities.toLocaleString()}{" "}
                                    {o.facilities === 1
                                      ? "facility"
                                      : "facilities"}
                                  </span>
                                </a>
                              </li>
                            ))}
                          </ul>
                        </>
                      )}
                    </>
                  )}
                </div>
              ))}
              <p className="search-hint">
                These are partial matches, shown because the full search
                found nothing. Nothing here says any of them is what you
                meant.
              </p>
            </>
          ) : (
            <p className="search-hint">
              No facilities match that search. Browse by state below, or
              search a person or company on the{" "}
              <a href={`${BP}/owners/`}>Ownership page</a>.
            </p>
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
