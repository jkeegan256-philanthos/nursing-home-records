import type { Metadata } from "next";
import { BP } from "@/lib/config";

// Without this file, Next's built-in not-found page adds a second
// <title> after the site's own, and the first one wins, so every
// missing address announced itself with the homepage's identity. No
// canonical and no description: an error page is not an address.
export const metadata: Metadata = { title: "Page not found" };

export default function NotFound() {
  return (
    <>
      <h1>Page not found</h1>
      <p className="lede">
        There is no page at this address. If a link brought you here, the
        record it pointed at may have left CMS&apos;s current batch: this
        site holds only the batch CMS is serving now, and a facility whose
        certification ends leaves the file.
      </p>
      <p>
        <a href={`${BP}/`}>Search from the home page</a>, browse{" "}
        <a href={`${BP}/owners/`}>the ownership records</a>, or see{" "}
        <a href={`${BP}/data/`}>the Data page</a> for where earlier batches
        live.
      </p>
    </>
  );
}
