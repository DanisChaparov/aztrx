/**
 * The video/gradient/glow backdrop shared by login and the in-app shell, so
 * every screen after the landing page keeps the same look.
 *
 * Deliberately the same plain mp4 the hero uses, not an HLS stream: it means
 * signing in continues the exact backdrop you were just looking at, and it
 * keeps hls.js out of every authenticated route's bundle. No "use client"
 * needed either — a bare <video> with autoplay attributes needs no JS.
 */
export const SITE_VIDEO_URL =
  "https://cdn.sceneai.art/Hero%20Section%20Video/973fa3f6-7715-4e73-9cfd-100ee86285b5.mp4";

export function SiteBackground({ videoOpacity = 0.6 }: { videoOpacity?: number }) {
  return (
    <div className="pointer-events-none absolute inset-0 overflow-hidden" aria-hidden>
      <video
        className="absolute inset-0 h-full w-full object-cover"
        style={{ opacity: videoOpacity }}
        src={SITE_VIDEO_URL}
        autoPlay
        muted
        loop
        playsInline
        preload="auto"
        disablePictureInPicture
      />

      {/* Darkened toward the left, where the content sits, so text stays
          readable over the brighter frames of the loop. */}
      <div
        className="absolute inset-0"
        style={{ background: "linear-gradient(90deg, #0b0c10 0%, rgba(11,12,16,0.55) 45%, rgba(11,12,16,0.2) 100%)" }}
      />
      <div
        className="absolute inset-0"
        style={{ background: "linear-gradient(to top, #0b0c10 0%, transparent 45%)" }}
      />

      <svg
        className="absolute left-1/2 top-0 h-[440px] w-[960px] -translate-x-1/2 -translate-y-1/4 opacity-70"
        viewBox="0 0 960 440"
        fill="none"
      >
        <defs>
          <filter id="site-glow-blur" x="-50%" y="-50%" width="200%" height="200%">
            <feGaussianBlur stdDeviation="25" />
          </filter>
          <radialGradient id="site-glow-grad" cx="50%" cy="50%" r="50%">
            <stop offset="0%" stopColor="#a996ff" stopOpacity="0.5" />
            <stop offset="55%" stopColor="#5A36F0" stopOpacity="0.28" />
            <stop offset="100%" stopColor="#0b0c10" stopOpacity="0" />
          </radialGradient>
        </defs>
        <ellipse cx="480" cy="160" rx="400" ry="150" fill="url(#site-glow-grad)" filter="url(#site-glow-blur)" />
      </svg>
    </div>
  );
}
