// A non-executed data block: search engines read it, browsers never
// run it, the CSP does not apply to it, and the origin gate sees no
// request from it. The schema.org context string is an identifier,
// not a fetch.
//
// This is the one place a published value enters a script element, so
// every "<" is escaped to its JSON unicode form: a name containing a
// literal closing script tag would otherwise end the block early and
// spill the rest of it into the page as text. The fixture plants
// exactly that name and the rendered-values gate asserts the round
// trip, proven by watching the unescaped form fail first.
export default function JsonLd({ data }: { data: unknown }) {
  return (
    <script
      type="application/ld+json"
      dangerouslySetInnerHTML={{
        __html: JSON.stringify(data).replace(/</g, "\\u003c"),
      }}
    />
  );
}
