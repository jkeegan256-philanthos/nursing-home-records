import type { Metadata } from "next";
import { BP } from "@/lib/config";
import {
  GLOSSARY_VINTAGE,
  OWNER_TYPE_DEFINITIONS,
  ROLE_DEFINITIONS,
  termAnchor,
} from "@/lib/glossary";

export const metadata: Metadata = { title: "Role definitions" };

function Section({
  title,
  entries,
}: {
  title: string;
  entries: { term: string; definition: string }[];
}) {
  return (
    <>
      <h2>{title}</h2>
      <dl className="glossary">
        {entries.map((e) => (
          <div key={e.term} id={termAnchor(e.term)} className="glossary-entry">
            <dt>{e.term}</dt>
            <dd>{e.definition}</dd>
          </div>
        ))}
      </dl>
    </>
  );
}

export default function GlossaryPage() {
  return (
    <>
      <h1>Role definitions</h1>
      <p className="lede">
        The ownership file discloses many kinds of parties, not just
        owners — lenders, consultants, and accounting firms are required
        filings too. These are CMS&apos;s own definitions for every role and
        owner type, quoted verbatim from the data dictionary published with
        the data.
      </p>

      <Section
        title="Role played by owner or manager in facility"
        entries={ROLE_DEFINITIONS}
      />
      <Section title="Owner type" entries={OWNER_TYPE_DEFINITIONS} />

      <p className="prov">
        Definitions quoted verbatim from the CMS data dictionary as of{" "}
        {GLOSSARY_VINTAGE}. The complete dictionary is republished
        untouched:{" "}
        <a className="mono" href={`${BP}/data/downloads/NH_Data_Dictionary.pdf`}>
          NH_Data_Dictionary.pdf
        </a>
        . If CMS revises a definition, the next monthly batch carries the
        revision and this page&apos;s date moves with it.
      </p>
    </>
  );
}
