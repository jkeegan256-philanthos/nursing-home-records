"use client";

import { useState } from "react";

// The same row under every name, no exceptions: links that carry the
// reader's question to official primary-source searches, pre-filled
// with the exact published string where the destination allows it.
// The site asserts nothing, fetches nothing, and displays nothing
// from these sources — the identity judgment stays with the reader.
export default function RecordLookup({ name }: { name: string }) {
  const [copied, setCopied] = useState(false);

  async function copy() {
    try {
      await navigator.clipboard.writeText(name);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch (err) {
      console.error("copy failed", err);
      window.prompt("Copy this name:", name);
    }
  }

  const q = encodeURIComponent(name);

  return (
    <p className="lookup-row">
      <span className="muted">Look up this name in public records:</span>{" "}
      <a
        href="https://exclusions.oig.hhs.gov/"
        rel="noopener noreferrer"
        target="_blank"
      >
        OIG exclusions
      </a>{" "}
      <span className="muted">(paste the name)</span> ·{" "}
      <a
        href={`https://www.sec.gov/edgar/search/#/q=${q}`}
        rel="noopener noreferrer"
        target="_blank"
      >
        SEC EDGAR
      </a>{" "}
      ·{" "}
      <a
        href={`https://www.courtlistener.com/?type=r&q=${q}`}
        rel="noopener noreferrer"
        target="_blank"
      >
        CourtListener dockets
      </a>{" "}
      <button type="button" className="csv-button" onClick={copy}>
        {copied ? "Name copied" : "Copy name"}
      </button>
      <span className="muted">
        {" "}
        Each link runs the government&apos;s or court&apos;s own search in
        your browser, on the name exactly as filed. A common name will match
        strangers; the records, not the match, are the answer.
      </span>
    </p>
  );
}
