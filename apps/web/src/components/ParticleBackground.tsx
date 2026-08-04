"use client";

import { useEffect, useRef } from "react";

/**
 * Cinematic blue wave particle field — like the CloudFront video but instant.
 * Layered flowing particles with deep blues, cyans, and soft whites.
 * 60fps canvas, zero bandwidth, zero lag.
 */
export function ParticleBackground() {
  const canvasRef = useRef<HTMLCanvasElement>(null);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    let running = true;
    let w = 0;
    let h = 0;

    interface Particle {
      x: number; y: number;
      r: number; alpha: number;
      vx: number; vy: number;
      hue: number;
    }

    const particles: Particle[] = [];

    function resize() {
      w = window.innerWidth;
      h = window.innerHeight;
      canvas!.width = w;
      canvas!.height = h;
    }

    function spawn() {
      particles.length = 0;
      const count = Math.min(Math.floor((w * h) / 10000), 100);
      for (let i = 0; i < count; i++) {
        particles.push({
          x: Math.random() * w,
          y: Math.random() * h,
          r: Math.random() * 2.5 + 1,
          alpha: Math.random() * 0.5 + 0.15,
          vx: (Math.random() - 0.5) * 0.3,
          vy: (Math.random() - 0.5) * 0.25 - 0.15,
          hue: 190 + Math.random() * 50,
        });
      }
    }

    resize();
    spawn();

    function draw(ts: number) {
      if (!running || !ctx) return;
      const t = ts * 0.001;

      // Deep dark base
      ctx.fillStyle = "#080c14";
      ctx.fillRect(0, 0, w, h);

      // Ambient glow layers — deep blue tones
      const g1 = ctx.createRadialGradient(w * 0.3, h * 0.2, 0, w * 0.5, h * 0.5, Math.max(w, h) * 0.7);
      g1.addColorStop(0, "rgba(20,60,130,0.08)");
      g1.addColorStop(0.5, "rgba(5,20,60,0.04)");
      g1.addColorStop(1, "rgba(0,0,0,0)");
      ctx.fillStyle = g1;
      ctx.fillRect(0, 0, w, h);

      const g2 = ctx.createRadialGradient(w * 0.7, h * 0.6, 0, w * 0.5, h * 0.5, Math.max(w, h) * 0.6);
      g2.addColorStop(0, "rgba(0,180,220,0.05)");
      g2.addColorStop(0.6, "rgba(0,80,160,0.02)");
      g2.addColorStop(1, "rgba(0,0,0,0)");
      ctx.fillStyle = g2;
      ctx.fillRect(0, 0, w, h);

      // Top bright area — like the cloudfront video's upper glow
      const topGlow = ctx.createRadialGradient(w * 0.5, h * 0.05, 0, w * 0.5, h * 0.3, h * 0.6);
      topGlow.addColorStop(0, "rgba(140,200,255,0.07)");
      topGlow.addColorStop(0.5, "rgba(60,120,200,0.03)");
      topGlow.addColorStop(1, "rgba(0,0,0,0)");
      ctx.fillStyle = topGlow;
      ctx.fillRect(0, 0, w, h);

      // Particles with gentle wave motion
      for (const p of particles) {
        p.x += p.vx + Math.sin(t * 0.5 + p.y * 0.01) * 0.2;
        p.y += p.vy;

        if (p.y < -20) { p.y = h + 20; p.x = Math.random() * w; }
        if (p.x < -20) p.x = w + 20;
        if (p.x > w + 20) p.x = -20;

        // Soft glow around each particle
        const glow = ctx.createRadialGradient(p.x, p.y, 0, p.x, p.y, p.r * 4);
        glow.addColorStop(0, `hsla(${p.hue},70%,80%,${p.alpha})`);
        glow.addColorStop(0.4, `hsla(${p.hue},60%,60%,${p.alpha * 0.4})`);
        glow.addColorStop(1, "rgba(0,0,0,0)");
        ctx.fillStyle = glow;
        ctx.fillRect(p.x - p.r * 4, p.y - p.r * 4, p.r * 8, p.r * 8);
      }

      requestAnimationFrame(draw);
    }

    requestAnimationFrame(draw);
    window.addEventListener("resize", () => { resize(); spawn(); }, { passive: true });

    return () => { running = false; };
  }, []);

  return (
    <canvas
      ref={canvasRef}
      className="fixed inset-0 z-0 pointer-events-none"
      aria-hidden
    />
  );
}
