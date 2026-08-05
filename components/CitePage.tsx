"use client";

import { useState } from "react";
import { SITE_NAME } from "@/lib/config";

// One citation format everywhere, carrying the batch vintage so a
// quoted number can always be traced to the batch it came from.
export default function CitePage({ vintage }: { vintage: string }) {
  const [copied, setCopied] = useState(false);

  async function copy() {
    const text =
      `${document.title}. ${SITE_NAME}, presenting CMS Provider Data ` +
      `Catalog data, batch processed ${vintage}. ${window.location.href}. ` +
      `Accessed ${new Date().toISOString().slice(0, 10)}.`;
    try {
      await navigator.clipboard.writeText(text);
      setCopied(true);
      setTimeout(() => setCopied(false), 2500);
    } catch (err) {
      console.error("clipboard write failed", err);
      window.prompt("Copy this citation:", text);
    }
  }

  return (
    <button type="button" className="csv-button" onClick={copy}>
      {copied ? "Citation copied" : "Cite this page"}
    </button>
  );
}
