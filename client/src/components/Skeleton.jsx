export function GridSkeleton({ n = 8 }) {
  return (
    <div className="grid" aria-hidden="true">
      {Array.from({ length: n }, (_, i) => (
        <div className="pcard skel-card" key={i}><div className="skel skel-img" /><div className="skel skel-line" /><div className="skel skel-line short" /></div>
      ))}
    </div>
  );
}
