// Forking? These identify this deployment and all default to it. See
// ADAPTATION.md touchpoints 9 and 10 -- and note that NH_STATE_URL, in
// .github/workflows/build-deploy.yml, needs the same treatment.
export const SITE_NAME = "Nursing Home Records";
export const SITE_TAGLINE =
  "Public data from the CMS Provider Data Catalog, presented exactly as published.";
export const BP = process.env.NEXT_PUBLIC_BASE_PATH ?? "";
// Absolute origin for sitemap/robots; override for forks or previews.
export const SITE_URL =
  process.env.NEXT_PUBLIC_SITE_URL ?? "https://nursinghomerecords.org";
// The repository, where the charter and its decision log live.
export const REPO_URL = "https://github.com/jkeegan256-philanthos/nursing-home-records";
// Bare host and path, for the footer line that shows the URL rather
// than hiding it behind link text. Derived so the two cannot diverge.
export const REPO_LABEL = REPO_URL.replace(/^https?:\/\//, "");
// The person accountable for this site. Empty is a valid state and the
// byline simply does not render; this deployment sets it, so a fork
// that copies this file inherits a real person's name unless it clears
// or replaces the value (ADAPTATION touchpoint 10).
export const SITE_AUTHOR = "Joseph Keegan";
// Stamped onto every CSV filename a reader downloads. Deployment
// identity, same hazard class as SITE_URL: a fork that keeps it ships
// files wearing this site's name.
export const CSV_PREFIX = "nursinghomerecords";
// Where readers can report an error. Point this anywhere you like.
export const CORRECTIONS_URL = `${REPO_URL}/issues`;
export const CORRECTIONS_EMAIL = "NursingHomeRecords.org@gmail.com";
export const CMS_DATASET_URL = (id: string) =>
  `https://data.cms.gov/provider-data/dataset/${id}`;
// CMS's own archive of month-end snapshots, linked from the Methods
// page. The page URL, never a guessed per-zip pattern: the zips behind
// it are served through a JavaScript-rendered index whose download
// URLs are not stable enough to hardcode.
export const CMS_ARCHIVE_URL =
  "https://data.cms.gov/provider-data/archived-data/nursing-homes";
