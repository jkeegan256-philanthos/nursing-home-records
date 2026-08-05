import type { Metadata } from "next";
import { BP, CORRECTIONS_EMAIL, CORRECTIONS_URL } from "@/lib/config";

export const metadata: Metadata = { title: "About" };

export default function AboutPage() {
  return (
    <>
      <h1>About this site</h1>
      <p className="lede">
        Nursing Home Records republishes the ownership and inspection data
        that CMS already makes public, exactly as CMS publishes it, in a form
        anyone can read in seconds.
      </p>

      <h2>Why it exists</h2>
      <p>
        Most people assume nursing homes are government institutions. The
        federal data says otherwise: roughly three in four are operated for
        profit, and every facility in the file holds Medicare or Medicaid
        certification. Federal law requires these facilities to disclose
        their owners, officers, directors, and managing employees. Those
        disclosures are public records, but public is only meaningful if
        people can actually find and read them. This site exists to close
        that gap — nothing more.
      </p>

      <h2>The rules this site follows</h2>
      <ul>
        <li>
          <strong>Display, never calculate.</strong> Every value is CMS&apos;s
          own, shown as published. No derived scores, no rankings by
          judgment, no edited values.
        </li>
        <li>
          <strong>Exact strings.</strong> Names are grouped by the exact
          published spelling. The site never matches, merges, or claims two
          names are the same person or company.
        </li>
        <li>
          <strong>Roles first.</strong> The disclosure file includes lenders,
          accountants, consultants, and managers as well as owners. A name is
          never shown without its disclosed role.
        </li>
        <li>
          <strong>Uniform rules, no targets.</strong> Every name gets the
          identical layout under the identical rules. The site never singles
          anyone out; whatever pattern exists reveals itself to anyone who
          looks.
        </li>
        <li>
          <strong>Radical provenance.</strong> Every table names its source
          file, CMS dataset, and modified date. The untouched originals are
          republished with a checksum on the{" "}
          <a href={`${BP}/data/`}>Data page</a>.
        </li>
        <li>
          <strong>The full record, one click away.</strong> Summaries never
          replace access to the complete published record.
        </li>
      </ul>

      <h2>What this site does not do</h2>
      <p>
        No money flows, cost reports, or margins. No entity resolution or
        name merging of our own. No editorial layer: no adjectives, no
        verdicts, no &quot;worst of&quot; lists. If a fact on this site seems
        significant, that significance comes from the public record itself.
      </p>

      <h2>Corrections</h2>
      <p>
        If anything here does not match the CMS source files, that is a bug:{" "}
        <a href={CORRECTIONS_URL} rel="noopener noreferrer">
          report it on GitHub
        </a>{" "}
        or email <a href={`mailto:${CORRECTIONS_EMAIL}`}>{CORRECTIONS_EMAIL}</a>{" "}
        and it will be fixed. Corrections to the underlying records belong
        with CMS, which publishes its own correction process on each dataset
        page.
      </p>
    </>
  );
}
