import type { Metadata } from "next";
import {
  BP,
  CORRECTIONS_EMAIL,
  CORRECTIONS_URL,
  REPO_URL,
  SITE_AUTHOR,
} from "@/lib/config";

export const metadata: Metadata = { title: "About" };

export default function AboutPage() {
  return (
    <>
      <h1>About this site</h1>
      <p className="lede">
        Nursing Home Records republishes the ownership and inspection data
        CMS already makes public, exactly as CMS publishes it, in a form
        built to be searched, read, and cited.
      </p>

      <h2>Why it exists</h2>
      <p>
        Most people assume nursing homes are government institutions. The
        federal data says otherwise: roughly three in four are operated for
        profit, and every facility in the file holds Medicare or Medicaid
        certification. Federal law requires them to disclose their owners,
        officers, directors, and managing employees.
      </p>
      <p>
        Those disclosures are public records. But public is only meaningful
        if people can find and read them, and today they arrive as a zip
        file of wide CSVs. This site exists to close that gap and nothing
        more.
      </p>

      {/* A reader who has just been told why the site exists asks who
          made it next. The byline renders only when SITE_AUTHOR is set;
          the repository link is unconditional, because the source is
          the part of the answer that does not depend on a name. */}
      <h2>Who built this</h2>
      {SITE_AUTHOR ? <p>{SITE_AUTHOR} built and maintains this site.</p> : null}
      <p>
        This site is an independent project, not affiliated with CMS or
        with any facility, owner, or operator named in the data. All of it
        is open: the{" "}
        <a href={REPO_URL} rel="noopener noreferrer">
          source repository
        </a>{" "}
        holds the pages, the transform that builds them, the checks that
        run on every deploy, and the decision log that records every
        choice and every reversal.
      </p>

      <h2>What the data is</h2>
      <p>
        These are disclosures filed by the facilities and their parties
        themselves. CMS publishes them as filed and does not independently
        verify them. Gaps and layered structures in the filings appear here
        as gaps and layered structures. That is worth knowing before
        quoting any number on this site.
      </p>
      <p>
        The checksums on the <a href={`${BP}/data/`}>Data page</a> prove
        this site matches what CMS published; they say nothing about
        whether a filing matches reality. The batch history goes one step
        further. It is an append-only ledger of every build this mirror
        has served, with per-file checksums, so the site&apos;s own history
        is provable even though CMS&apos;s is not.
      </p>

      <h2>Who this serves</h2>
      <p>
        This is a professional tool that happens to be free and public:
        discharge planners, state agencies vetting owners, reporters,
        researchers, and workers deciding where to work.
      </p>
      <p>
        Families are welcome, and it is worth being plain about what they
        will find. This site publishes the same CMS star ratings and
        inspection records a family would see on Care Compare, shown as
        CMS files them. What it does not do is compare, rank, or
        recommend. Care Compare puts facilities side by side, which is
        what choosing between them requires; this site answers a narrower
        question, who stands behind a given building, in what disclosed
        role, since when, and it answers that without interpreting. That
        is a different question rather than a smaller version of the same
        one, and it stays different however polished this site gets.
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
        <li>
          <strong>A claim ships with the check that earns it.</strong>{" "}
          Anything this site says about how it behaves is checked by
          software that actually runs it, every build. Where that check
          cannot be built, the claim comes down until it can.
        </li>
      </ul>
      <p>
        When one of these rules catches a feature this site already
        shipped, the feature is reversed and the reversal is written
        down. The{" "}
        <a
          href={`${REPO_URL}/blob/main/PROJECT.md`}
          rel="noopener noreferrer"
        >
          public decision log
        </a>{" "}
        records every correction at full length, next to the rule that
        forced it, including the corrections that were embarrassing.
      </p>

      <h2>What this site does not do</h2>
      <p>
        No money flows, cost reports, or margins. No entity resolution or
        name merging of our own. No editorial layer: no adjectives, no
        verdicts, no &quot;worst of&quot; lists. If a fact here seems
        significant, that significance comes from the public record itself.
      </p>

      <h2>Researching a name further</h2>
      <p>
        Researchers who need more than these filings typically consult
        other public records: court dockets, corporate and securities
        filings, and government enforcement and exclusion databases, each
        maintained by the court or agency that creates it. This site links
        to none of them and attaches none of them to any name, because a
        matching name string is not a matching person.
      </p>
      <p>
        Many names in the disclosure file are common. Some of those
        databases exist only to record wrongdoing, so a coincidental hit
        reads as a verdict. And the official verification steps for the
        most consequential of them require identifiers the public does not
        hold. The copy button under each name does the one part a website
        can do honestly: it preserves the exact filed spelling for wherever
        the reader&apos;s own judgment takes it.
      </p>

      <h2>Limitations</h2>
      <p>
        The per-facility record tables and the live owner search run a
        database engine inside your browser. On a network or browser that
        blocks it, those views show an error message rather than failing
        silently, and every one of them links to the untouched source files
        on the <a href={`${BP}/data/`}>Data page</a>. The engine and
        everything it needs come from this domain, so no third party&apos;s
        availability decides whether the record can be read.
      </p>
      <p>
        The pre-rendered owner pages and every facility, state, and
        download page work without the engine at all. That is the designed
        floor: when the interactive layer cannot run, the record is still
        there, just less convenient.
      </p>

      <h2>Continuity</h2>
      <p>
        This site is built to outlive attention. The code is MIT-licensed,
        the data is public and re-fetchable from CMS, the pipeline is
        documented for adaptation, and the hosting has no bill that can
        lapse. Every page carries its data batch&apos;s date, so if this
        mirror ever goes unmaintained it degrades into a labeled archive
        rather than a silent lie. Anyone can fork the repository, run the
        monthly workflow, and have a current copy serving again.
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
