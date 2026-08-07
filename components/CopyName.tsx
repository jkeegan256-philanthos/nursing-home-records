"use client";

import { useState } from "react";

// The same button under every name, no exceptions: it puts the exact
// published string — LAST, FIRST and all — on the clipboard, and
// nothing more. It formalizes what a reader retyping the name was
// already doing by hand; where the name goes next is the reader's
// act, on the reader's judgment, and this site's pages stay silent
// about it.
export default function CopyName({ name }: { name: string }) {
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

  return (
    <p className="copy-row">
      <button type="button" className="csv-button" onClick={copy}>
        {copied ? "Name copied" : "Copy name"}
      </button>
      <span className="muted"> Copies the name exactly as filed.</span>
    </p>
  );
}
