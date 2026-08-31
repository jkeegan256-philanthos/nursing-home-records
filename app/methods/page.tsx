import type { Metadata } from "next";
import { BP, CMS_ARCHIVE_URL } from "@/lib/config";
import { capacityFigure, dataMap, ownersTop } from "@/lib/data";
import { pageMetadata } from "@/lib/seo";

export const metadata: Metadata = pageMetadata({
  title: "How to read these records",
  // De-counted like the heading it describes: the page teaches "ways
  // these records are misread", and a count here went stale the day a
  // fifth trap was added.
  description:
    "How the CMS ownership disclosures are structured, the ways readers " +
    "most often misread them, and what the file does not say.",
  path: "/methods/",
});

// Figures come from the batch this build serves, never from a previous
// one and never from prose. CMS rotates the file monthly and the numbers
// move with it: one rotation moved the facility count by three and one
// firm's footprint by one, inside a day. A figure typed into this page
// would be a claim about a batch that is no longer the batch on it.
// Counts of one are not hypothetical: the fixture produces them, and a
// real batch could too. A figure that reads "1 name strings ... 1 hold"
// undermines the sentence it appears in, so agreement is computed
// rather than assumed.
const plural = (n: number, one: string, many: string) => (n === 1 ? one : many);
const verb = (n: number) => (n === 1 ? "holds" : "hold");

function footprint(name: string) {
  const row = ownersTop()?.top.find((t) => t.name === name);
  return row ? { facilities: row.facilities, states: row.states } : null;
}

export default function MethodsPage() {
  const batch = dataMap().generated_at.slice(0, 10);
  const capacity = capacityFigure();

  // Named because they are properties of the file rather than of a
  // moment: an accounting firm, a bank, and a cluster of near-identical
  // corporate spellings. If a rotation drops one out of the derived set,
  // its example is omitted rather than shown from memory.
  const forvis = footprint("FORVIS MAZARS LLP");
  const cibc = footprint("CIBC BANK USA");
  const genesis = [
    "GEN OPERATIONS I LLC",
    "GEN OPERATIONS II LLC",
    "GENESIS HEALTHCARE LLC",
    "GENESIS HEALTHCARE INC",
  ]
    .map((n) => ({ name: n, f: footprint(n) }))
    .filter((x) => x.f !== null) as { name: string; f: { facilities: number; states: number } }[];

  return (
    <div className="prose">
      <h1>How to read these records</h1>
      <p className="lede">
        The ownership file is a disclosure form, not a summary of who owns
        what. Reading it correctly takes a few minutes and avoids the
        mistakes that experienced readers make regularly.
      </p>
      <p className="prov">
        Figures on this page are derived from the batch processed{" "}
        <span className="mono">{batch}</span>, the same batch every other
        page on this site is built from. They move when CMS publishes a
        new one.
      </p>

      <h2>Ways these records are misread</h2>

      <h3>1. A role is not an ownership stake</h3>
      <p>
        Federal law requires a facility to disclose its owners, its
        officers and directors, its managing employees, and the parties
        it contracts with. Lenders, accounting firms, and management
        companies are all disclosable, and they appear in the same column
        as equity holders. The role column is the only thing that
        separates them.
      </p>
      {forvis || cibc ? (
        <p>
          Two of the largest footprints in the current batch make the
          point.{" "}
          {forvis ? (
            <>
              FORVIS MAZARS LLP, an accounting firm, appears at{" "}
              {forvis.facilities.toLocaleString()} facilities in{" "}
              {forvis.states} states.{" "}
            </>
          ) : null}
          {cibc ? (
            <>
              CIBC BANK USA appears at {cibc.facilities.toLocaleString()}{" "}
              facilities in {cibc.states} states.{" "}
            </>
          ) : null}
          Neither figure describes a nursing home operator. Sorting the
          ownership file by how often a name appears produces a list of
          the most frequently disclosed parties, which is a different
          question from who operates the most facilities.
        </p>
      ) : null}

      <h3>2. Names are exact strings, not entities</h3>
      <p>
        Names on this site group by the exact characters CMS published.
        Related filings often arrive under several spellings, and nothing
        here merges them, because merging would assert that two filings
        describe one entity. The file does not say that, so this site
        does not either.
      </p>
      {genesis.length > 1 ? (
        <>
          <p>
            In the current batch these four names are filed separately:
          </p>
          <div className="tablewrap">
            <table>
              <thead>
                <tr>
                  <th>Name as published</th>
                  <th className="num">Facilities</th>
                  <th className="num">States</th>
                </tr>
              </thead>
              <tbody>
                {genesis.map((g) => (
                  <tr key={g.name}>
                    <td className="mono">{g.name}</td>
                    <td className="num">{g.f.facilities.toLocaleString()}</td>
                    <td className="num">{g.f.states}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
          <p>
            Whether they are one organization is a question this file does
            not answer. Adding their facility counts together assumes an
            answer. Reading each as filed does not.
          </p>
        </>
      ) : null}

      <h3>3. Capacity varies facility by facility</h3>
      <p>
        A name is not disclosed once. It is disclosed once per facility,
        with a role each time, and the roles differ. The same person can
        hold an ownership interest at a handful of facilities and be a
        managing employee at a hundred others. There is no such thing as
        a correct label for the person, only a correct label for the
        person at a facility.
      </p>
      {capacity ? (
        <p>
          In the current batch, of the{" "}
          {capacity.people.toLocaleString()} distinct{" "}
          {plural(capacity.people, "name string", "name strings")} filed
          with owner type Individual and disclosed at {capacity.threshold}{" "}
          or more facilities, {capacity.none_owning.toLocaleString()}{" "}
          {verb(capacity.none_owning)} no role whose published description
          contains the words{" "}
          <span className="mono">{capacity.ownership_marker.toLowerCase()}</span>{" "}
          anywhere in the file. Of the{" "}
          {capacity.some_owning.toLocaleString()} that {verb(capacity.some_owning)}{" "}
          such a role somewhere, {capacity.mixed.toLocaleString()}{" "}
          {verb(capacity.mixed)} it at only some of their facilities. A
          single label applied to any of them would be wrong at some of
          the buildings the name is attached to. These are counts of
          exact published names, not of people.
        </p>
      ) : null}
      <p>
        This site takes the role from the row, so a name shown on a
        facility page carries the role disclosed at that facility. The{" "}
        <a href={`${BP}/glossary/`}>glossary</a> lists every role value
        CMS defines.
      </p>

      <h3>4. These are filings, not findings</h3>
      <p>
        CMS publishes what facilities and their disclosed parties filed.
        It does not independently verify them. A gap in the file is a gap
        in what was filed, and a layered structure is the structure as
        disclosed. The checksums on the{" "}
        <a href={`${BP}/data/`}>Data page</a> prove this site matches what
        CMS published. They say nothing about whether a filing matches
        the world.
      </p>

      <h3>5. The record is a snapshot, not a history</h3>
      <p>
        This site serves the current batch and nothing older. CMS
        overwrites the published file each month, so the record you read
        today is the record as filed now, not as it stood on the date an
        event happened. The monthly history exists, kept by CMS itself:
        an archive of month-end snapshots, one download per month, at{" "}
        <a href={CMS_ARCHIVE_URL} rel="noopener noreferrer">
          data.cms.gov/provider-data/archived-data/nursing-homes
        </a>
        . A month-end snapshot is the file as it stood when the month
        closed, which is not the same as its state on a particular day.
        The batch history on the <a href={`${BP}/data/`}>Data page</a>{" "}
        answers a different question: it proves what this site served and
        when, not what CMS published.
      </p>

      <h2>Five questions, and where each is answered</h2>
      <dl className="glossary">
        <div className="glossary-entry">
          <dt>Who is connected to this facility?</dt>
          <dd>
            The facility page lists every disclosed party with the role
            filed for it, and the full record tabs carry the citation,
            penalty, and survey rows as published. It does not say which
            party controls the facility.
          </dd>
        </div>
        <div className="glossary-entry">
          <dt>Where else does this name appear?</dt>
          <dd>
            The <a href={`${BP}/owners/`}>Ownership</a> search finds a name
            by its exact published spelling and lists every facility it is
            disclosed at. It does not find related spellings, and it does
            not tell you whether two spellings are the same party.
          </dd>
        </div>
        <div className="glossary-entry">
          <dt>What does my state look like?</dt>
          <dd>
            Each state page lists its certified facilities with the
            ratings CMS published. It does not rank them beyond the sort
            you choose, and the sort keys are the published columns.
          </dd>
        </div>
        <div className="glossary-entry">
          <dt>Does this record match what I was told?</dt>
          <dd>
            Every table names its source file, CMS dataset, and modified
            date, so a figure can be traced to the file it came from. It
            cannot tell you which account is correct when they differ.
          </dd>
        </div>
        <div className="glossary-entry">
          <dt>Give me the underlying data.</dt>
          <dd>
            The <a href={`${BP}/data/`}>Data page</a> publishes the
            original CMS files unmodified, with checksums and the batch
            history. Nothing on this site is derived in a way the
            originals cannot reproduce.
          </dd>
        </div>
      </dl>

      <h2>What the record cannot tell you</h2>
      <p>
        The <a href={`${BP}/about/`}>About page</a> covers the limits of
        this site. These are limits of the file itself, and they hold no
        matter who republishes it.
      </p>
      <ul>
        <li>
          <strong>It does not say who owns the building.</strong> The
          operator and the property owner are frequently different
          parties, and the disclosure covers the operator side.
        </li>
        <li>
          <strong>It does not say what anyone was paid.</strong> No
          amounts, no cost reports, no margins appear in this file.
        </li>
        <li>
          <strong>It does not say whether two similar names are
          related.</strong> That is the same boundary as trap two, stated
          as a property of the record rather than of this site.
        </li>
      </ul>
      <p>
        Where this file stops, other public records continue. Property
        ownership is recorded by the county that assesses it, and
        corporate registration by the state that grants it. Those are
        separate records maintained by separate offices, and reaching
        them is a step a reader takes deliberately, about a question they
        already have. This site links to none of them and attaches none
        of them to any name, for the reason given on{" "}
        <a href={`${BP}/about/`}>About</a>: a matching name string is not
        a matching party.
      </p>
    </div>
  );
}
