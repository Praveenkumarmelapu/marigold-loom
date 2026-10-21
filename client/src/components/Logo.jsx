export default function Logo({ size = 34 }) {
  return (
    <svg width={size} height={size} viewBox="0 0 64 64" aria-hidden="true" focusable="false">
      <rect width="64" height="64" rx="14" fill="#1F2A44" />
      <g fill="#E8A33D">
        <circle cx="32" cy="32" r="7" />
        <ellipse cx="32" cy="15" rx="5" ry="9" />
        <ellipse cx="32" cy="49" rx="5" ry="9" />
        <ellipse cx="15" cy="32" rx="9" ry="5" />
        <ellipse cx="49" cy="32" rx="9" ry="5" />
      </g>
    </svg>
  );
}
