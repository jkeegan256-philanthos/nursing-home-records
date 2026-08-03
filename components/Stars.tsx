export default function Stars({ value }: { value: string | null | undefined }) {
  const v = (value ?? "").trim();
  if (!/^[1-5]$/.test(v)) {
    return <span className="muted" aria-label="Not rated">&ndash;</span>;
  }
  const n = Number(v);
  return (
    <span className="stars" role="img" aria-label={`${n} of 5 stars`}>
      {"★".repeat(n)}
      <span className="off">{"★".repeat(5 - n)}</span>
    </span>
  );
}
