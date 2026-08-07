export const SITE_NAME = "Nursing Home Records";
export const SITE_TAGLINE =
  "Public data from the CMS Provider Data Catalog, presented exactly as published.";
export const BP = process.env.NEXT_PUBLIC_BASE_PATH ?? "";
// Absolute origin for sitemap/robots; override for forks or previews.
export const SITE_URL =
  process.env.NEXT_PUBLIC_SITE_URL ?? "https://nursinghomerecords.org";
// The repository, where the charter and its decision log live.
export const REPO_URL = "https://github.com/jkeegan256-philanthos/nursing-home-records";
// Where readers can report an error. Point this anywhere you like.
export const CORRECTIONS_URL = `${REPO_URL}/issues`;
export const CORRECTIONS_EMAIL = "NursingHomeRecords.org@gmail.com";
export const CMS_DATASET_URL = (id: string) =>
  `https://data.cms.gov/provider-data/dataset/${id}`;
