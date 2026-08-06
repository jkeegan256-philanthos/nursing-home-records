import type { Metadata } from "next";
import "./globals.css";
import { BP, SITE_NAME, SITE_TAGLINE } from "@/lib/config";
import { dataMap } from "@/lib/data";
import CitePage from "@/components/CitePage";

export const metadata: Metadata = {
  title: { default: SITE_NAME, template: `%s · ${SITE_NAME}` },
  description: SITE_TAGLINE,
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  const generated = dataMap().generated_at.slice(0, 10);
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
            <p>
              Current data batch processed {generated}.{" "}
              <CitePage vintage={generated} />
            </p>
          </div>
        </footer>
      </body>
    </html>
  );
}
