"use client";

import { HlsVideo } from "@/components/HlsVideo";

export const SITE_VIDEO_URL = "https://stream.mux.com/tLkHO1qZoaaQOUeVWo8hEBeGQfySP02EPS02BmnNFyXys.m3u8";

/**
 * The same video/grid/glow backdrop used behind the landing hero, reused
 * across login and the in-app shell so every page shares one look.
 */
export function SiteBackground({ videoOpacity = 0.6 }: { videoOpacity?: number }) {
  return (
    <div className="pointer-events-none absolute inset-0 overflow-hidden" aria-hidden>
      <HlsVideo
        src={SITE_VIDEO_URL}
        className="absolute inset-0 h-full w-full object-cover"
        style={{ opacity: videoOpacity }}
      />

      <div
        className="absolute inset-0"
        style={{ background: "linear-gradient(90deg, #070b0a 0%, rgba(7,11,10,0.35) 45%, transparent 75%)" }}
      />
      <div
        className="absolute inset-0"
        style={{ background: "linear-gradient(to top, #070b0a 0%, transparent 45%)" }}
      />

      <div className="absolute inset-0 hidden md:block">
        <div className="absolute inset-y-0 left-1/4 w-px bg-white/10" />
        <div className="absolute inset-y-0 left-1/2 w-px bg-white/10" />
        <div className="absolute inset-y-0 left-3/4 w-px bg-white/10" />
      </div>

      <svg
        className="absolute left-1/2 top-0 h-[440px] w-[960px] -translate-x-1/2 -translate-y-1/4 opacity-80"
        viewBox="0 0 960 440"
        fill="none"
      >
        <defs>
          <filter id="site-glow-blur" x="-50%" y="-50%" width="200%" height="200%">
            <feGaussianBlur stdDeviation="25" />
          </filter>
          <radialGradient id="site-glow-grad" cx="50%" cy="50%" r="50%">
            <stop offset="0%" stopColor="#8ff7d3" stopOpacity="0.55" />
            <stop offset="55%" stopColor="#1f8f6b" stopOpacity="0.3" />
            <stop offset="100%" stopColor="#070b0a" stopOpacity="0" />
          </radialGradient>
        </defs>
        <ellipse cx="480" cy="160" rx="400" ry="150" fill="url(#site-glow-grad)" filter="url(#site-glow-blur)" />
      </svg>
    </div>
  );
}
