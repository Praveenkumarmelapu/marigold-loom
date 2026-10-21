export default function Logo({ size = 34 }) {
  return (
    <svg width={size} height={size} viewBox="0 0 64 64" aria-hidden="true" focusable="false">
      <rect width="64" height="64" fill="currentColor" />
      <path d="M32 12c-3.3 0-6 2.5-6 5.6 0 2.3 1.5 4.2 3.6 5.1L10 40.5c-1.6 1.3-.6 3.9 1.5 3.9h41c2.100 0 3.100-2.600 1.500-3.900L35 22.700v-1.200c3-.9 5-3.200 5-5.900C40 14 36 12 32 12z" fill="none" stroke="#fff" strokeWidth="3" strokeLinejoin="round" transform="translate(0 4)" />
    </svg>
  );
}
