// CMS's own definitions for the ownership file's role and owner-type
// values, quoted verbatim from the data dictionary the site already
// republishes. Nothing here is paraphrased; if CMS revises a
// definition, GLOSSARY_VINTAGE dates the drift.

export type GlossaryEntry = { term: string; definition: string };

// The data dictionary edition these quotes were taken from.
export const GLOSSARY_VINTAGE = "PENDING";

export const ROLE_DEFINITIONS: GlossaryEntry[] = [];

export const OWNER_TYPE_DEFINITIONS: GlossaryEntry[] = [];

/** Stable fragment id for a term, shared by the page and inline links. */
export function termAnchor(term: string): string {
  return term.toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/^-+|-+$/g, "");
}
