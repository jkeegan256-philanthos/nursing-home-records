import type { MetadataRoute } from "next";
import { allCCNs, contentDates, dataMap, listStates, ownerPages } from "@/lib/data";
import { pageUrl } from "@/lib/seo";

export const dynamic = "force-static";

// Every page the batch generates. Counts stay well under the
// 50,000-URL sitemap limit. URLs go through the same pageUrl() the
// canonicals use, so the sitemap and a page's own stated address are
// the same string by construction. Record pages are dated by their
// content's own CMS modified date, via contentDates(); the processing
// date belongs only to the pages that genuinely change every build,
// the prose pages and the Data page, whose ledger grows each batch.
export default function sitemap(): MetadataRoute.Sitemap {
  const generated = dataMap().generated_at.slice(0, 10);
  const dates = contentDates();
  const page = (path: string, lastModified: string = generated) => ({
    url: pageUrl(path),
    lastModified,
  });
  return [
    page("/", dates.facility),
    page("/owners/", dates.owner),
    page("/data/"),
    page("/about/"),
    page("/glossary/"),
    page("/methods/"),
    ...listStates().map(({ state }) => page(`/state/${state}/`, dates.state)),
    ...allCCNs().map((ccn) =>
      page(`/facility/${encodeURIComponent(ccn)}/`, dates.facility)
    ),
    ...ownerPages().owners.map((o) => page(`/owner/${o.slug}/`, dates.owner)),
  ];
}
