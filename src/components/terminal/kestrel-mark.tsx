/**
 * The Kestrel glyph: a sovereign-gold kite mark with a glassy inner edge.
 * Kept intentionally container-agnostic — the header supplies the glass tile.
 */
export function KestrelMark({ className = "size-7" }: { className?: string }) {
  return (
    <svg viewBox="0 0 32 32" className={className} aria-hidden="true">
      <defs>
        <linearGradient
          id="kestrel-gold"
          x1="6"
          y1="6"
          x2="26"
          y2="26"
          gradientUnits="userSpaceOnUse"
        >
          <stop offset="0%" stopColor="oklch(0.92 0.1 96)" />
          <stop offset="55%" stopColor="oklch(0.8 0.13 90)" />
          <stop offset="100%" stopColor="oklch(0.68 0.12 82)" />
        </linearGradient>
      </defs>
      <g filter="drop-shadow(0 0 6px oklch(0.85 0.13 92 / 45%))">
        <path d="M5 21 L16 6.5 L27 21 L20 17.6 L16 25.5 L12 17.6 Z" fill="url(#kestrel-gold)" />
        <path
          d="M16 6.5 L16 25.5"
          className="stroke-background/70"
          strokeWidth="1"
          strokeLinecap="round"
        />
      </g>
    </svg>
  );
}
