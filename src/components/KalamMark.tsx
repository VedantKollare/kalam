/**
 * The Kalam logo: a fountain-pen nib on an ink tile. Below 48px the
 * breather hole is dropped and the line thickens so it stays crisp.
 * `draw` animates the strokes in (used by the splash).
 */
export default function KalamMark({ size = 32, draw = false, className = '' }: {
  size?: number;
  draw?: boolean;
  className?: string;
}) {
  const detailed = size >= 48;
  const p = draw ? { pathLength: 1, className: 'kmark__draw' } : {};
  return (
    <span className={`kmark ${className}`} style={{ width: size, height: size, borderRadius: size * 0.23 }} aria-hidden="true">
      <svg width={size * 0.74} height={size * 0.74} viewBox="0 0 64 64" fill="none" stroke="currentColor"
        strokeWidth={detailed ? 2.8 : 4} strokeLinecap="round" strokeLinejoin="round">
        <path {...p} d="M32 11c4 8 10 14 10 23v6H22v-6c0-9 6-15 10-23z" />
        <path {...p} d="M32 11v16" />
        {detailed && <circle {...p} cx="32" cy="30" r="2.2" />}
        <rect {...p} x="20" y="40" width="24" height="5" rx="1.5" />
        <path {...p} d="M23 45l2 8h14l2-8" />
      </svg>
    </span>
  );
}
