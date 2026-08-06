// What the CMS data dictionary actually says about the ownership file,
// quoted verbatim from Table 13. The dictionary defines the columns and
// enumerates the role values; it does not define each role individually
// and does not expand the abbreviation ADP. This module reproduces
// exactly what it provides and nothing more.

export type GlossaryEntry = { term: string; definition: string };

// The dictionary edition these quotes were taken from, in its own words.
export const GLOSSARY_VINTAGE = "updated July 2026";

// Table 13, "Ownership file variables" — definitions verbatim.
export const COLUMN_DEFINITIONS: GlossaryEntry[] = [
  {
    term: "Role played by Owner or Manager in Facility",
    definition:
      "Role description; possible values are: 5% or greater direct ownership interest; DIRECT OWNERSHIP INTEREST; 5% or greater indirect ownership interest; INDIRECT OWNERSHIP INTEREST; 5% OR GREATER MORTGAGE INTEREST; 5% OR GREATER SECURITY INTEREST; MANAGING CONTROL - GOVERNING BODY; CONTRACTED MANAGING EMPLOYEE; W-2 MANAGING EMPLOYEE; CORPORATE DIRECTOR; CORPORATE OFFICER; OPERATIONAL/MANAGERIAL CONTROL; GENERAL PARTNERSHIP INTEREST; LIMITED PARTNERSHIP INTEREST; INDIVIDUAL IS AN OWNER, PARTNER OR TRUSTEE OF ANY ADP OF THE SNF; TRUSTEE OF THE SNF; ADP OF THE SNF",
  },
  {
    term: "Owner Type",
    definition:
      "Indicates if owner is an individual or organization (Individual or Organization)",
  },
  {
    term: "Owner Name",
    definition: "Name of Owner",
  },
  {
    term: "Ownership Percentage",
    definition:
      "Ownership percentage – value provided only for owners with role description of “5% or greater direct ownership interest” or “5% or greater indirect ownership interest”",
  },
  {
    term: "Association Date",
    definition:
      "Date when given owner/manager became associated with provider in this role",
  },
];

// The role values from the dictionary's list, one entry each so inline
// role cells can deep-link to the exact value.
export const ROLE_VALUES: string[] = [
  "5% or greater direct ownership interest",
  "DIRECT OWNERSHIP INTEREST",
  "5% or greater indirect ownership interest",
  "INDIRECT OWNERSHIP INTEREST",
  "5% OR GREATER MORTGAGE INTEREST",
  "5% OR GREATER SECURITY INTEREST",
  "MANAGING CONTROL - GOVERNING BODY",
  "CONTRACTED MANAGING EMPLOYEE",
  "W-2 MANAGING EMPLOYEE",
  "CORPORATE DIRECTOR",
  "CORPORATE OFFICER",
  "OPERATIONAL/MANAGERIAL CONTROL",
  "GENERAL PARTNERSHIP INTEREST",
  "LIMITED PARTNERSHIP INTEREST",
  "INDIVIDUAL IS AN OWNER, PARTNER OR TRUSTEE OF ANY ADP OF THE SNF",
  "TRUSTEE OF THE SNF",
  "ADP OF THE SNF",
];

/** Stable fragment id for a term, shared by the page and inline links. */
export function termAnchor(term: string): string {
  return term.toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/^-+|-+$/g, "");
}
