import type { MetadataRoute } from "next";
import { BP, SITE_URL } from "@/lib/config";
import { allCCNs, dataMap, listStates, ownerPages } from "@/lib/data";

export const dynamic = "force-static";

// Every page the batch generates, stamped with the batch date. Counts
// stay well under the 50,000-URL sitemap limit.
export default function sitemap(): MetadataRoute.Sitemap {
  const base = `${SITE_URL}${BP}`;
  const lastModified = new Date(dataMap().generated_at);
  const page = (path: string) => ({ url: `${base}${path}`, lastModified });
  return [
    page("/"),
    page("/owners/"),
    page("/data/"),
    page("/about/"),
    page("/glossary/"),
    ...listStates().map(({ state }) => page(`/state/${state}/`)),
    ...allCCNs().map((ccn) => page(`/facility/${encodeURIComponent(ccn)}/`)),
    ...ownerPages().owners.map((o) => page(`/owner/${o.slug}/`)),
  ];
}
