"use client";

import { useEffect, useState } from "react";

// Print-only self-authentication. A printed page is evidence someone
// attaches to a complaint, and evidence that cannot be traced to a
// dated source is not attachable to anything; the URL and retrieval
// date make the printout carry its own citation. Rendered as a client
// leaf so the server-rendered footer around it stays static; hidden
// on screen and shown by the print stylesheet. The retrieval date is
// the page-load date, which is what retrieval means. Two kinds of
// date sit near each other on paper, so each is labeled as what it
// is: the batch dates above belong to the data, this one to the
// printout.
export default function PrintProvenance() {
  const [info, setInfo] = useState<{ href: string; date: string } | null>(null);
  useEffect(() => {
    setInfo({
      href: window.location.href,
      date: new Date().toISOString().slice(0, 10),
    });
  }, []);
  if (!info) return null;
  return (
    <p className="print-provenance">
      Printed from {info.href}, retrieved {info.date}. The CMS dates above
      are the data&apos;s own; this date is the printout&apos;s.
    </p>
  );
}
