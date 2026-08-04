"use client";

import { useEffect, useRef } from "react";

/**
 * Ultra-light particle background — white/blue dots drifting upward.
 * 60fps canvas rendering, <1ms per frame. Starts instantly.
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
    const dots: { x: number; y: number; r: number; vx: number; vy: number; a: number }[] = [];

    function resize() {
      w = window.innerWidth;
      h = window.innerHeight;
      canvas!.width = w;
      canvas!.height = h;
    }

    function spawn() {
      dots.length = 0;
      const count = Math.min(Math.floor((w * h) / 18000), 80);
      for (let i = 0; i < count; i++) {
        dots.push({
          x: Math.random() * w,
          y: Math.random() * h,
          r: Math.random() * 1.5 + 0.5,
          vx: (Math.random() - 0.5) * 0.15,
          vy: -(Math.random() * 0.3 + 0.1),
          a: Math.random() * 0.4 + 0.1,
        });
      }
    }

    resize();
    spawn();

    function draw() {
      if (!running || !ctx) return;
      ctx.clearRect(0, 0, w, h);

      for (const d of dots) {
        d.x += d.vx;
        d.y += d.vy;
        if (d.y < -10) { d.y = h + 10; d.x = Math.random() * w; }
        if (d.x < -10) d.x = w + 10;
        if (d.x > w + 10) d.x = -10;

        ctx.beginPath();
        ctx.arc(d.x, d.y, d.r, 0, Math.PI * 2);
        ctx.fillStyle = `rgba(180,200,255,${d.a})`;
        ctx.fill();
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
