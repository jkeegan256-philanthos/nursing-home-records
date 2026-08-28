import type { Metadata } from "next";
import { BP, SITE_NAME, SITE_URL } from "./config";

// One module owns the head's identity claims, so a page's canonical
// address, description, and share tags cannot disagree with each other
// or with the sitemap, which builds its URLs through the same function.
// Descriptions are factual statements of what a page holds, carrying
// published values verbatim: a long provider name may push a
// description past what search engines display, and they elide, we do
// not truncate, because shortening a published name is closer to
// editing it than an overlength description is.

export function pageUrl(path: string): string {
  if (!path.startsWith("/") || !path.endsWith("/")) {
    throw new Error(`page path must start and end with "/": ${path}`);
  }
  return `${SITE_URL}${BP}${path}`;
}

export function pageMetadata({
  title,
  description,
  path,
}: {
  title: string;
  description: string;
  path: string;
}): Metadata {
  const url = pageUrl(path);
  return {
    title,
    description,
    alternates: { canonical: url },
    openGraph: {
      title,
      description,
      url,
      siteName: SITE_NAME,
      type: "website",
      locale: "en_US",
    },
    twitter: { card: "summary", title, description },
  };
}

export function facilityDescription(
  name: string,
  city: string,
  state: string,
  ccn: string
): string {
  return (
    `CMS records for ${name} in ${city}, ${state}, CCN ${ccn}: ratings, ` +
    `health and fire safety citations, penalties, and ownership, shown ` +
    `exactly as published.`
  );
}

export function stateDescription(
  fullName: string,
  code: string,
  count: number
): string {
  const place = fullName === code ? code : `${fullName} (${code})`;
  return (
    `${count.toLocaleString("en-US")} Medicare and Medicaid certified ` +
    `nursing homes in ${place}, with CMS ratings and CMS state and ` +
    `national averages, shown as published.`
  );
}

// Structured-data builders. Values verbatim from the published row;
// empty fields are omitted rather than serialized as empty claims.
// No rating ever appears here: a regulator's rating expressed as
// review vocabulary (aggregateRating, Review) misstates provenance,
// and the rendered-values gate enforces the absence.
const CMS_ORG = {
  "@type": "GovernmentOrganization",
  name: "Centers for Medicare & Medicaid Services",
};

export function facilityJsonLd(f: {
  name: string;
  street: string;
  city: string;
  state: string;
  zip: string;
  phone: string;
  ccn: string;
  path: string;
}) {
  return {
    "@context": "https://schema.org",
    "@type": "MedicalOrganization",
    name: f.name,
    ...(f.phone ? { telephone: f.phone } : {}),
    address: {
      "@type": "PostalAddress",
      ...(f.street ? { streetAddress: f.street } : {}),
      ...(f.city ? { addressLocality: f.city } : {}),
      ...(f.state ? { addressRegion: f.state } : {}),
      ...(f.zip ? { postalCode: f.zip } : {}),
      addressCountry: "US",
    },
    identifier: { "@type": "PropertyValue", name: "CCN", value: f.ccn },
    url: pageUrl(f.path),
  };
}

export function breadcrumbJsonLd(items: { name: string; path: string }[]) {
  return {
    "@context": "https://schema.org",
    "@type": "BreadcrumbList",
    itemListElement: items.map((it, i) => ({
      "@type": "ListItem",
      position: i + 1,
      name: it.name,
      item: pageUrl(it.path),
    })),
  };
}

export function dataCatalogJsonLd(
  tables: {
    label: string;
    dataset_id: string | null;
    modified_date: string | null;
    source_file: string;
  }[],
  downloadable: Set<string>,
  cmsDatasetUrl: (id: string) => string
) {
  return {
    "@context": "https://schema.org",
    "@type": "DataCatalog",
    name: `${SITE_NAME} source data`,
    url: pageUrl("/data/"),
    dataset: tables.map((t) => ({
      "@type": "Dataset",
      name: t.label,
      creator: CMS_ORG,
      ...(t.dataset_id
        ? { identifier: t.dataset_id, sameAs: cmsDatasetUrl(t.dataset_id) }
        : {}),
      ...(t.modified_date ? { dateModified: t.modified_date } : {}),
      ...(downloadable.has(t.source_file)
        ? {
            distribution: {
              "@type": "DataDownload",
              encodingFormat: "text/csv",
              contentUrl: `${pageUrl("/data/")}downloads/${encodeURIComponent(t.source_file)}`,
            },
          }
        : {}),
    })),
  };
}

export function ownerDescription(
  name: string,
  facilities: number,
  states: number
): string {
  const f = facilities === 1 ? "facility" : "facilities";
  const s = states === 1 ? "state" : "states";
  return (
    `${name} in CMS nursing home ownership disclosures: ` +
    `${facilities.toLocaleString("en-US")} ${f} in ${states} ${s}, with ` +
    `role, ownership percentage, and association date as filed.`
  );
}
