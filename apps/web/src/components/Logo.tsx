/**
 * Upstream mark — a stylized "U" formed by flowing water that curves upward.
 * Clean geometric lines. Reads at any size from favicon to hero.
 */
export function Logo({ size = 28 }: { size?: number }) {
  return (
    <svg width={size} height={size} viewBox="0 0 32 32" fill="none" aria-hidden="true">
      <defs>
        <linearGradient id="logo-grad" x1="4" y1="4" x2="28" y2="28" gradientUnits="userSpaceOnUse">
          <stop stopColor="#A78BFA" />
          <stop offset="0.5" stopColor="#8B5CF6" />
          <stop offset="1" stopColor="#7C3AED" />
        </linearGradient>
        <linearGradient id="logo-glow" x1="16" y1="0" x2="16" y2="32" gradientUnits="userSpaceOnUse">
          <stop stopColor="#A78BFA" stopOpacity="0.3" />
          <stop offset="1" stopColor="#7C3AED" stopOpacity="0" />
        </linearGradient>
      </defs>
      {/* Background glow */}
      <circle cx="16" cy="16" r="14" fill="url(#logo-glow)" />
      {/* Rounded square background */}
      <rect x="2" y="2" width="28" height="28" rx="8" fill="#0F0F15" stroke="url(#logo-grad)" strokeWidth="1.5" />
      {/* Water flow mark — two rising strokes */}
      <g stroke="url(#logo-grad)" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" fill="none">
        {/* Left rising stroke */}
        <path d="M10 22 C10 16, 14 12, 16 10 C18 8, 18 8, 18 10 C18 12, 14 16, 10 20" />
        {/* Right rising stroke */}
        <path d="M22 22 C22 14, 18 10, 16 8" opacity="0.6" />
      </g>
    </svg>
  );
}
