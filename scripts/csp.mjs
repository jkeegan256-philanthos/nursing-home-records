// The Content-Security-Policy this site publishes, defined once and
// consumed twice: scripts/apply_csp.mjs writes it into every exported
// page, and scripts/check_no_third_party.mjs asserts every exported page
// carries exactly this and that a browser running under it reports no
// violation. Two consumers, one definition, so the policy the gate
// checks is the policy the pages carry.
//
// WHAT THIS IS FOR, stated narrowly on purpose. The site's claim is that
// it makes no third-party requests. That claim is verified at build time
// by a browser gate covering a sample of pages and a declared list of
// interactions. This policy asks the reader's own browser to enforce the
// same-origin rule on every page instead, including pages the gate never
// opens.
//
// WHAT IT DOES NOT COVER, and this is the part worth reading before
// trusting it. A dedicated worker takes its policy from the response
// headers of its own script, not from the document that created it;
// inheritance happens only for blob: and data: workers. This site is
// served by GitHub Pages, which sends no headers we control, so
// public/duckdb/duckdb-browser-*.worker.js cannot be given a policy at
// all. The DuckDB engine runs inside that worker and issues every
// read_parquet and every extension load from there. The one incident
// this project has actually had, the engine fetching its Parquet
// extension from another host in every reader's browser, would not have
// been stopped by this policy.
//
// So scripts/check_no_third_party.mjs is not made redundant by this
// file. It remains the only thing standing between a reader and an
// off-origin engine fetch, and it stays load-bearing.
//
// 'unsafe-inline' on script-src is required: a Next.js static export
// puts the RSC payload in inline <script> blocks on every page. It
// permits inline code, never another host, so the origin property above
// is unaffected. This is an origin policy, not an XSS defence, and it
// should not be described as one.
//
// 'wasm-unsafe-eval' is retained for browser coverage, not because the
// document needs it in the browser it was measured in. In Chromium the
// main thread only ever calls WebAssembly.validate, which the wasm
// gate does not cover, and the engine's compilation happens in the
// worker, outside this policy. But both of those are single-browser
// measurements: a browser that gates validate, or one that applies a
// document's policy to its workers (which the spec forbids and some
// have done anyway), would kill the engine with no visible violation
// and no error beyond the site's own fallback message. The directive
// permits no host, so retaining it costs the origin property nothing.
// The measurement, and the version it was taken against, are in the
// 2026-08-27 entry in DECISIONS.md rather than here, because a figure
// in a comment is a figure nothing will re-check.
//
// frame-ancestors, report-uri and sandbox are absent because a browser
// ignores them when the policy arrives in a meta tag, and a directive
// that cannot fire reads to the next person as protection that exists.
// object-src and form-action are present although the export has
// neither element: those constrain what may be added later, which is a
// different thing from a directive the parser discards.
export const CSP = [
  "default-src 'self'",
  "script-src 'self' 'unsafe-inline' 'wasm-unsafe-eval'",
  "style-src 'self' 'unsafe-inline'",
  "img-src 'self' data:",
  "font-src 'self'",
  "connect-src 'self'",
  "worker-src 'self'",
  "object-src 'none'",
  "base-uri 'self'",
  "form-action 'none'",
].join("; ");

// The policy goes into an HTML attribute quoted with ", so it must not
// contain one. Asserted rather than assumed, because the failure mode is
// a truncated policy that still parses and silently permits everything
// after the quote.
if (CSP.includes('"')) {
  throw new Error("the policy contains a double quote and cannot be written into an HTML attribute");
}

export const CSP_META = `<meta http-equiv="Content-Security-Policy" content="${CSP}">`;
