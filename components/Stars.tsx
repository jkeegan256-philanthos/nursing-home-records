// The unearned stars are a different character, not the same character in
// a paler colour.
//
// They were the same character. Colour lives only in a browser, so the
// moment a page left the screen -- copied to a clipboard, scraped, saved
// as text, read by anything that does not paint CSS -- a facility rated
// one came out as five filled stars, identical to a facility rated five.
// The site's own footer says figures are shown exactly as published; that
// sentence was false for every rating below five, on every page carrying
// a rating. Colour is decoration and must never be the only thing
// carrying a published value.
export default function Stars({ value }: { value: string | null | undefined }) {
  const v = (value ?? "").trim();
  if (!/^[1-5]$/.test(v)) {
    // A published value we do not recognise is shown as published. The
    // dash means CMS published nothing, and must not stand in for
    // something CMS did publish.
    return v ? (
      <span className="muted">{v}</span>
    ) : (
      <span className="muted" aria-label="Not rated">
        &ndash;
      </span>
    );
  }
  const n = Number(v);
  return (
    <span className="stars" role="img" aria-label={`${n} of 5 stars`}>
      {"★".repeat(n)}
      <span className="off">{"☆".repeat(5 - n)}</span>
      {/* The number itself, in the text and out of the layout: a reader
          that never sees the glyphs -- a scraper, a clipboard, a screen
          reader, a model -- still gets the published value, not a shape
          it has to count. */}
      <span className="sr-only"> ({n} of 5)</span>
    </span>
  );
}
