/**
 * Aztrx's mascot — a small round creature that reacts to what's actually
 * happening rather than looping one idle animation.
 *
 * Drawn as inline SVG with CSS keyframes: no image assets to bundle, sharp at
 * any size, and the whole thing animates on the compositor so a widget sitting
 * open all day costs nothing.
 */

export type MascotMood =
  /** Signed out, or no session — dozing. */
  | "asleep"
  /** Session running, going well. */
  | "focused"
  /** A distraction was caught. */
  | "alarmed"
  /** Session verified. */
  | "celebrating";

const MOOD_COLOR: Record<MascotMood, string> = {
  asleep: "#4b4b63",
  focused: "#6744FF",
  alarmed: "#f5a524",
  celebrating: "#8b74ff",
};

/**
 * Eyes carry almost all of the expression — the body barely changes shape
 * between moods, so keeping them distinct is what makes each state readable at
 * 72px.
 */
function eyes(mood: MascotMood): string {
  if (mood === "asleep") {
    // Closed: two soft arcs.
    return `
      <path d="M26 40 q6 5 12 0" stroke="#0b0c10" stroke-width="3" stroke-linecap="round" fill="none"/>
      <path d="M62 40 q6 5 12 0" stroke="#0b0c10" stroke-width="3" stroke-linecap="round" fill="none"/>`;
  }
  if (mood === "alarmed") {
    // Wide, with raised brows.
    return `
      <circle cx="32" cy="40" r="7" fill="#0b0c10"/>
      <circle cx="68" cy="40" r="7" fill="#0b0c10"/>
      <circle cx="34" cy="37" r="2.5" fill="white"/>
      <circle cx="70" cy="37" r="2.5" fill="white"/>
      <path d="M24 27 l14 4" stroke="#0b0c10" stroke-width="3" stroke-linecap="round"/>
      <path d="M76 27 l-14 4" stroke="#0b0c10" stroke-width="3" stroke-linecap="round"/>`;
  }
  if (mood === "celebrating") {
    // Happy closed arcs, curving up.
    return `
      <path d="M25 42 q7 -8 14 0" stroke="#0b0c10" stroke-width="3.5" stroke-linecap="round" fill="none"/>
      <path d="M61 42 q7 -8 14 0" stroke="#0b0c10" stroke-width="3.5" stroke-linecap="round" fill="none"/>`;
  }
  // Focused: narrowed, determined, with a blink on a long loop.
  return `
    <g class="mascot-blink">
      <ellipse cx="32" cy="40" rx="5.5" ry="6.5" fill="#0b0c10"/>
      <ellipse cx="68" cy="40" rx="5.5" ry="6.5" fill="#0b0c10"/>
      <circle cx="34" cy="37.5" r="2" fill="white"/>
      <circle cx="70" cy="37.5" r="2" fill="white"/>
    </g>`;
}

function mouth(mood: MascotMood): string {
  switch (mood) {
    case "asleep":
      return `<ellipse cx="50" cy="58" rx="4" ry="5" fill="#0b0c10" opacity="0.55"/>`;
    case "alarmed":
      return `<ellipse cx="50" cy="59" rx="7" ry="8" fill="#0b0c10"/>`;
    case "celebrating":
      return `<path d="M36 55 q14 16 28 0" stroke="#0b0c10" stroke-width="3.5" stroke-linecap="round" fill="none"/>`;
    default:
      return `<path d="M40 58 q10 7 20 0" stroke="#0b0c10" stroke-width="3.5" stroke-linecap="round" fill="none"/>`;
  }
}

/** The little touch that sells each state — Zs, a spark, confetti. */
function decoration(mood: MascotMood): string {
  if (mood === "asleep") {
    return `
      <g class="mascot-zzz" fill="#8b74ff" font-family="system-ui, sans-serif" font-weight="700">
        <text x="78" y="26" font-size="13">z</text>
        <text x="88" y="16" font-size="10" opacity="0.6">z</text>
      </g>`;
  }
  if (mood === "celebrating") {
    return `
      <g class="mascot-confetti">
        <rect x="14" y="14" width="5" height="5" rx="1" fill="#a996ff" transform="rotate(20 16 16)"/>
        <rect x="80" y="18" width="5" height="5" rx="1" fill="#6744FF" transform="rotate(-25 82 20)"/>
        <rect x="70" y="8" width="4" height="4" rx="1" fill="#a996ff"/>
      </g>`;
  }
  if (mood === "alarmed") {
    return `<text x="76" y="24" font-size="22" font-family="system-ui, sans-serif" font-weight="800" fill="#f5a524" class="mascot-bang">!</text>`;
  }
  return "";
}

export function mascotSvg(mood: MascotMood, size = 84): string {
  return `
  <svg class="mascot mascot-${mood}" width="${size}" height="${size}" viewBox="0 0 100 100" aria-hidden="true">
    <ellipse class="mascot-shadow" cx="50" cy="93" rx="24" ry="4" fill="#000" opacity="0.35"/>
    <g class="mascot-body">
      <circle cx="50" cy="52" r="38" fill="${MOOD_COLOR[mood]}"/>
      <circle cx="50" cy="52" r="38" fill="url(#mascot-sheen)"/>
      ${eyes(mood)}
      ${mouth(mood)}
    </g>
    ${decoration(mood)}
    <defs>
      <radialGradient id="mascot-sheen" cx="35%" cy="28%" r="65%">
        <stop offset="0%" stop-color="#fff" stop-opacity="0.28"/>
        <stop offset="100%" stop-color="#fff" stop-opacity="0"/>
      </radialGradient>
    </defs>
  </svg>`;
}

/** Injected once into the widget's document. */
export const MASCOT_STYLES = `
.mascot { display: block; }
.mascot-body { transform-origin: 50px 90px; }

/* Every mood breathes; the rate is the tell. */
@keyframes mascot-breathe {
  0%, 100% { transform: scale(1, 1) translateY(0); }
  50%      { transform: scale(1.03, 0.97) translateY(2px); }
}
@keyframes mascot-bounce {
  0%, 100% { transform: translateY(0) scale(1, 1); }
  30%      { transform: translateY(-9px) scale(0.97, 1.03); }
  55%      { transform: translateY(0) scale(1.06, 0.94); }
}
@keyframes mascot-shake {
  0%, 100% { transform: translateX(0) rotate(0); }
  25%      { transform: translateX(-3px) rotate(-4deg); }
  75%      { transform: translateX(3px) rotate(4deg); }
}
@keyframes mascot-blink {
  0%, 92%, 100% { transform: scaleY(1); }
  96%           { transform: scaleY(0.1); }
}
@keyframes mascot-zzz {
  0%   { opacity: 0; transform: translate(0, 4px); }
  40%  { opacity: 1; }
  100% { opacity: 0; transform: translate(5px, -10px); }
}
@keyframes mascot-confetti {
  0%   { opacity: 0; transform: translateY(8px); }
  30%  { opacity: 1; }
  100% { opacity: 0; transform: translateY(-14px) rotate(35deg); }
}
@keyframes mascot-bang {
  0%, 100% { transform: scale(1); opacity: 0.85; }
  50%      { transform: scale(1.25); opacity: 1; }
}

.mascot-asleep      .mascot-body { animation: mascot-breathe 4.5s ease-in-out infinite; }
.mascot-focused     .mascot-body { animation: mascot-breathe 2.6s ease-in-out infinite; }
.mascot-alarmed     .mascot-body { animation: mascot-shake 0.45s ease-in-out infinite; }
.mascot-celebrating .mascot-body { animation: mascot-bounce 0.85s ease-in-out infinite; }

.mascot-blink    { animation: mascot-blink 6s ease-in-out infinite; transform-origin: 50px 40px; }
.mascot-zzz      { animation: mascot-zzz 3s ease-out infinite; }
.mascot-confetti { animation: mascot-confetti 1.1s ease-out infinite; }
.mascot-bang     { animation: mascot-bang 0.6s ease-in-out infinite; transform-origin: 80px 18px; }

/* Anyone who asked their OS for less motion gets a still mascot. */
@media (prefers-reduced-motion: reduce) {
  .mascot * { animation: none !important; }
}
`;
