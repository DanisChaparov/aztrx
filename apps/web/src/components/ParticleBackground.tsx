"use client";

import { useEffect, useRef } from "react";

/**
 * Cinematic blue wave — mimics the CloudFront background video.
 * Bright cyan/blue gradients with flowing particles. Instant, no video.
 */
export function ParticleBackground({ opacity = 1 }: { opacity?: number }) {
  const canvasRef = useRef<HTMLCanvasElement>(null);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    let running = true;
    let w = 0, h = 0;

    const particles: { x: number; y: number; r: number; vx: number; vy: number; a: number }[] = [];

    function resize() {
      w = window.innerWidth;
      h = window.innerHeight;
      canvas!.width = w;
      canvas!.height = h;
    }

    function spawn() {
      particles.length = 0;
      const count = Math.min(Math.floor((w * h) / 12000), 80);
      for (let i = 0; i < count; i++) {
        particles.push({
          x: Math.random() * w,
          y: Math.random() * h,
          r: Math.random() * 2 + 0.8,
          vx: (Math.random() - 0.5) * 0.25,
          vy: -(Math.random() * 0.4 + 0.2),
          a: Math.random() * 0.5 + 0.2,
        });
      }
    }

    resize();
    spawn();

    function draw(ts: number) {
      if (!running || !ctx) return;
      const t = ts * 0.001;

      // Dark deep base
      ctx.fillStyle = "#060d18";
      ctx.fillRect(0, 0, w, h);

      // Bright top glow — the "wave" light source
      const top = ctx.createRadialGradient(w * 0.5, h * 0.05, 0, w * 0.5, h * 0.5, h * 0.8);
      top.addColorStop(0, "rgba(100,180,240,0.09)");
      top.addColorStop(0.3, "rgba(40,100,200,0.05)");
      top.addColorStop(0.7, "rgba(5,20,60,0.02)");
      top.addColorStop(1, "rgba(0,0,0,0)");
      ctx.fillStyle = top;
      ctx.fillRect(0, 0, w, h);

      // Side cyan glow
      const side = ctx.createRadialGradient(w * 0.75, h * 0.4, 0, w * 0.5, h * 0.5, h * 0.7);
      side.addColorStop(0, "rgba(0,200,220,0.04)");
      side.addColorStop(0.5, "rgba(0,100,180,0.02)");
      side.addColorStop(1, "rgba(0,0,0,0)");
      ctx.fillStyle = side;
      ctx.fillRect(0, 0, w, h);

      // Flowing particles — white/cyan
      for (const p of particles) {
        p.x += p.vx + Math.sin(t * 0.4 + p.y * 0.008) * 0.25;
        p.y += p.vy;
        if (p.y < -20) { p.y = h + 20; p.x = Math.random() * w; }
        if (p.x < -20) p.x = w + 20;
        if (p.x > w + 20) p.x = -20;

        const glow = ctx.createRadialGradient(p.x, p.y, 0, p.x, p.y, p.r * 3.5);
        glow.addColorStop(0, `rgba(200,230,255,${p.a})`);
        glow.addColorStop(0.5, `rgba(140,200,240,${p.a * 0.4})`);
        glow.addColorStop(1, "rgba(0,0,0,0)");
        ctx.fillStyle = glow;
        ctx.fillRect(p.x - p.r * 3.5, p.y - p.r * 3.5, p.r * 7, p.r * 7);
      }

      requestAnimationFrame(draw);
    }

    requestAnimationFrame(draw);
    window.addEventListener("resize", () => { resize(); spawn(); }, { passive: true });
    return () => { running = false; };
  }, []);

  return <canvas ref={canvasRef} className="fixed inset-0 z-0 pointer-events-none" aria-hidden />;
}
