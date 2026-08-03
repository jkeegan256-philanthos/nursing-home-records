export const SITE_NAME = "Nursing Home Records";
export const SITE_TAGLINE =
  "Public data from the CMS Provider Data Catalog, presented exactly as published.";
export const BP = process.env.NEXT_PUBLIC_BASE_PATH ?? "";
// Where readers can report an error. Point this anywhere you like.
export const CORRECTIONS_URL = "https://github.com/jkeegan256/philanthos/issues";
export const CMS_DATASET_URL = (id: string) =>
  `https://data.cms.gov/provider-data/dataset/${id}`;
