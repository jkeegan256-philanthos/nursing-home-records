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
        <link rel="preconnect" href="https://fonts.googleapis.com" />
        <link rel="preconnect" href="https://fonts.gstatic.com" crossOrigin="anonymous" />
        <link
          href="https://fonts.googleapis.com/css2?family=Public+Sans:wght@400;600;700&family=Source+Serif+4:opsz,wght@8..60,600;8..60,700&family=Spline+Sans+Mono:wght@400;500&display=swap"
          rel="stylesheet"
        />
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
