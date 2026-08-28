import type { MetadataRoute } from "next";
import { allCCNs, dataMap, listStates, ownerPages } from "@/lib/data";
import { pageUrl } from "@/lib/seo";

export const dynamic = "force-static";

// Every page the batch generates, stamped with the batch date. Counts
// stay well under the 50,000-URL sitemap limit. URLs go through the
// same pageUrl() the canonicals use, so the sitemap and a page's own
// stated address are the same string by construction.
export default function sitemap(): MetadataRoute.Sitemap {
  const lastModified = new Date(dataMap().generated_at);
  const page = (path: string) => ({ url: pageUrl(path), lastModified });
  return [
    page("/"),
    page("/owners/"),
    page("/data/"),
    page("/about/"),
    page("/glossary/"),
    page("/methods/"),
    ...listStates().map(({ state }) => page(`/state/${state}/`)),
    ...allCCNs().map((ccn) => page(`/facility/${encodeURIComponent(ccn)}/`)),
    ...ownerPages().owners.map((o) => page(`/owner/${o.slug}/`)),
  ];
}
