export function KestrelMark({ className = "size-7" }: { className?: string }) {
  return (
    <svg viewBox="0 0 32 32" className={className} aria-hidden="true">
      <rect
        x="0.5"
        y="0.5"
        width="31"
        height="31"
        rx="6"
        className="fill-elevated stroke-hairline-strong"
      />
      <path d="M6 20 L16 8 L26 20 L20 17 L16 24 L12 17 Z" className="fill-gold" />
      <path d="M16 8 L16 24" className="stroke-background" strokeWidth="1" />
    </svg>
  );
}
