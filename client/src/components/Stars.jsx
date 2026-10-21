export default function Stars({ value = 0, count, size = 16 }) {
  const pct = Math.max(0, Math.min(5, value)) / 5 * 100;
  return (
    <span className="stars" role="img" aria-label={`Rated ${value.toFixed(1)} out of 5${count !== undefined ? `, ${count} reviews` : ''}`}>
      <span className="stars-bg" style={{ fontSize: size }}>★★★★★</span>
      <span className="stars-fg" style={{ width: `${pct}%`, fontSize: size }}>★★★★★</span>
    </span>
  );
}
