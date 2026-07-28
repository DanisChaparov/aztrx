"use client";

import { useEffect, useRef } from "react";

export function HlsVideo({
  src,
  className,
  style,
}: {
  src: string;
  className?: string;
  style?: React.CSSProperties;
}) {
  const videoRef = useRef<HTMLVideoElement>(null);

  useEffect(() => {
    const video = videoRef.current;
    if (!video) return;

    let hls: { destroy: () => void } | null = null;
    let cancelled = false;

    if (video.canPlayType("application/vnd.apple.mpegurl")) {
      video.src = src;
    } else {
      import("hls.js").then(({ default: Hls }) => {
        if (cancelled) return;
        if (Hls.isSupported()) {
          const instance = new Hls({ enableWorker: false });
          instance.loadSource(src);
          instance.attachMedia(video);
          hls = instance;
        }
      });
    }

    return () => {
      cancelled = true;
      hls?.destroy();
    };
  }, [src]);

  return <video ref={videoRef} autoPlay loop muted playsInline className={className} style={style} />;
}
