import type { Metadata } from "next";
import { BP } from "@/lib/config";
import {
  COLUMN_DEFINITIONS,
  GLOSSARY_VINTAGE,
  ROLE_VALUES,
  termAnchor,
} from "@/lib/glossary";
import { pageMetadata } from "@/lib/seo";

export const metadata: Metadata = pageMetadata({
  title: "Role definitions",
  description:
    "The CMS data dictionary's definitions for the ownership file, " +
    "verbatim: every column and every disclosed role value, as published.",
  path: "/glossary/",
});

export default function GlossaryPage() {
  return (
    <div className="prose">
      <h1>Role definitions</h1>
      <p className="lede">
        The ownership file discloses many kinds of parties, not just owners.
        Lenders, consultants, and accounting firms are required filings too.
        This page reproduces exactly what the CMS data dictionary says about
        that file: the column definitions verbatim, and the complete list of
        role values.
      </p>

      <h2>What the columns mean, in CMS&apos;s words</h2>
      <dl className="glossary">
        {COLUMN_DEFINITIONS.map((e) => (
          <div key={e.term} id={termAnchor(e.term)} className="glossary-entry">
            <dt>{e.term}</dt>
            <dd>{e.definition}</dd>
          </div>
        ))}
      </dl>

      <h2>The role values</h2>
      <p>
        Every value the dictionary lists for &quot;Role played by Owner or
        Manager in Facility&quot;, exactly as printed:
      </p>
      <ul className="glossary-values">
        {ROLE_VALUES.map((v) => (
          <li key={v} id={termAnchor(v)} className="mono">
            {v}
          </li>
        ))}
      </ul>

      <h2>What the dictionary does not say</h2>
      <p>
        CMS&apos;s dictionary lists these role values without defining each
        one individually, and it does not expand the abbreviation ADP. That
        ambiguity is in the published source, not introduced here. In federal
        regulation the term behind ADP is &quot;additional disclosable
        party&quot;, defined at 42 CFR 424.502, which sets out the disclosure
        requirements these filings satisfy, including parties who lease or
        operate the facility, lend to it, or manage it under contract. For
        what a specific filing means, the role string and the regulation are
        the record; this site does not interpret them.
      </p>

      <p className="prov">
        Definitions quoted verbatim from the CMS Nursing Home Data
        Dictionary, {GLOSSARY_VINTAGE}. The complete dictionary is
        republished untouched:{" "}
        <a className="mono" href={`${BP}/data/downloads/NH_Data_Dictionary.pdf`}>
          NH_Data_Dictionary.pdf
        </a>
        . If CMS revises a definition, the next monthly batch carries the
        revision, and a build check compares every quote on this page
        against that batch&apos;s dictionary: the site does not publish
        until this page matches it. The dictionary&apos;s own revision
        table (its Table 16) dates every change to the role list.
      </p>
    </div>
  );
}
