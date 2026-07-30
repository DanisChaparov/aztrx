/**
 * The Upstream mark: two stacked chevrons pointing up — flow moving upstream,
 * and progress. Chosen because it stays legible at 20px in the nav, where a
 * finer git-graph or wave motif turns to mush.
 *
 * Pure SVG, so it's sharp at any size and costs no network request.
 */
export function Logo({ size = 28 }: { size?: number }) {
  return (
    <svg width={size} height={size} viewBox="0 0 32 32" fill="none" aria-hidden>
      <defs>
        <linearGradient id="upstream-mark" x1="0" y1="0" x2="32" y2="32" gradientUnits="userSpaceOnUse">
          <stop stopColor="#8B6BFF" />
          <stop offset="1" stopColor="#5A36F0" />
        </linearGradient>
      </defs>
      <rect width="32" height="32" rx="9" fill="url(#upstream-mark)" />
      <g stroke="white" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round" fill="none">
        <path d="M9 15.5 16 8.5 23 15.5" />
        <path d="M9 23.5 16 16.5 23 23.5" opacity="0.45" />
      </g>
    </svg>
  );
}
