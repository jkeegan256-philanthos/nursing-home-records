import type { Metadata } from "next";
import "./globals.css";
import { BP, REPO_LABEL, REPO_URL, SITE_NAME, SITE_TAGLINE } from "@/lib/config";
import { cmsVintage, dataMap } from "@/lib/data";
import CitePage from "@/components/CitePage";

export const metadata: Metadata = {
  title: { default: SITE_NAME, template: `%s · ${SITE_NAME}` },
  description: SITE_TAGLINE,
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  const generated = dataMap().generated_at.slice(0, 10);
  const vintage = cmsVintage();
  return (
    <html lang="en">
      <head>
        {/* Self-hosted variable fonts, vendored by scripts/vendor-assets.mjs.
            Declared here rather than in globals.css so the paths can carry
            the base path. OFL license texts sit beside the files. */}
        <style>{`
          @font-face {
            font-family: "Public Sans";
            src: url("${BP}/fonts/public-sans-latin-wght-normal.woff2") format("woff2-variations");
            font-weight: 100 900;
            font-style: normal;
            font-display: swap;
          }
          @font-face {
            font-family: "Source Serif 4";
            src: url("${BP}/fonts/source-serif-4-latin-opsz-normal.woff2") format("woff2-variations");
            font-weight: 200 900;
            font-style: normal;
            font-display: swap;
          }
          @font-face {
            font-family: "Spline Sans Mono";
            src: url("${BP}/fonts/spline-sans-mono-latin-wght-normal.woff2") format("woff2-variations");
            font-weight: 300 700;
            font-style: normal;
            font-display: swap;
          }
        `}</style>
      </head>
      <body>
        <header className="site-header">
          <div className="container">
            <a className="wordmark" href={`${BP}/`}>
              Nursing Home <span>Records</span>
            </a>
            <nav className="site-nav" aria-label="Site">
              <a href={`${BP}/`}>Facilities</a>
              <a href={`${BP}/owners/`}>Ownership</a>
              <a href={`${BP}/methods/`}>Methods</a>
              <a href={`${BP}/data/`}>Data &amp; downloads</a>
              <a href={`${BP}/about/`}>About</a>
            </nav>
          </div>
        </header>
        <main className="container">{children}</main>
        <footer className="site-footer">
          <div className="container">
            <p>
              An independent presentation of public data from the CMS Provider
              Data Catalog. Not affiliated with CMS. Figures are shown exactly
              as published, with no edits, computations, or filtering.
            </p>
            {/* Two dates because they answer different questions and only
                one was being answered. The processing date says when this
                mirror last rebuilt, and it advances on every code merge
                whether or not CMS published anything, so alone it reads as
                freshness the data may not have. CMS's own dates are shown
                as a range, never as the newest alone: some datasets in the
                theme are annual, so a batch legitimately spans many
                months, and the widest honest claim is both ends of it.
                The word "to" rather than a dash, because a dash between
                two hyphenated ISO dates is unreadable. */}
            <p>
              {vintage
                ? vintage.min === vintage.max
                  ? `CMS files in this batch are dated ${vintage.max}; last processed ${generated}.`
                  : `CMS files in this batch are dated ${vintage.min} to ${vintage.max}; last processed ${generated}.`
                : `Current data batch processed ${generated}.`}{" "}
              <CitePage vintage={generated} />
            </p>
            {/* Every page says how it was made; until now no page said
                where. The URL is shown rather than hidden behind link
                text, so a printed or pasted page carries it too. */}
            <p>
              Source code and method:{" "}
              <a href={REPO_URL} rel="noopener noreferrer">
                {REPO_LABEL}
              </a>
            </p>
          </div>
        </footer>
      </body>
    </html>
  );
}
