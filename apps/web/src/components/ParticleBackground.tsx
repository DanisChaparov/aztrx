"use client";

import { useEffect, useRef } from "react";

/**
 * Dark nebula + black hole particle field.
 * Particles orbit a central gravitational well with glowing trails.
 * 60fps canvas, <2ms per frame.
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
    let cx = 0;
    let cy = 0;
    let time = 0;

    interface Particle {
      x: number; y: number;
      r: number;
      angle: number; dist: number; speed: number;
      hue: number; alpha: number;
      trail: { x: number; y: number }[];
    }

    const particles: Particle[] = [];

    function resize() {
      w = window.innerWidth;
      h = window.innerHeight;
      cx = w / 2;
      cy = h / 2;
      canvas!.width = w;
      canvas!.height = h;
    }

    function spawn() {
      particles.length = 0;
      const count = Math.min(Math.floor((w * h) / 12000), 100);
      for (let i = 0; i < count; i++) {
        const angle = Math.random() * Math.PI * 2;
        const dist = Math.random() * Math.max(w, h) * 0.7 + 50;
        particles.push({
          x: cx + Math.cos(angle) * dist,
          y: cy + Math.sin(angle) * dist,
          r: Math.random() * 2 + 0.8,
          angle,
          dist,
          speed: (Math.random() * 0.3 + 0.1) * (Math.random() > 0.5 ? 1 : -1),
          hue: Math.random() > 0.5 ? 240 + Math.random() * 40 : 200 + Math.random() * 30,
          alpha: Math.random() * 0.6 + 0.2,
          trail: [],
        });
      }
    }

    resize();
    spawn();

    function draw(ts: number) {
      if (!running || !ctx) return;
      time = ts * 0.001;

      // Dark void background
      ctx.fillStyle = "#0c0c0c";
      ctx.fillRect(0, 0, w, h);

      // Nebula glow layers
      const nebula1 = ctx.createRadialGradient(cx - w * 0.15, cy - h * 0.1, 0, cx, cy, Math.max(w, h) * 0.6);
      nebula1.addColorStop(0, "rgba(60,30,120,0.08)");
      nebula1.addColorStop(0.4, "rgba(20,40,100,0.04)");
      nebula1.addColorStop(0.7, "rgba(5,10,40,0.02)");
      nebula1.addColorStop(1, "rgba(0,0,0,0)");
      ctx.fillStyle = nebula1;
      ctx.fillRect(0, 0, w, h);

      const nebula2 = ctx.createRadialGradient(cx + w * 0.2, cy - h * 0.2, 0, cx, cy, Math.max(w, h) * 0.5);
      nebula2.addColorStop(0, "rgba(20,60,100,0.06)");
      nebula2.addColorStop(0.5, "rgba(10,20,60,0.03)");
      nebula2.addColorStop(1, "rgba(0,0,0,0)");
      ctx.fillStyle = nebula2;
      ctx.fillRect(0, 0, w, h);

      // Black hole core (subtle)
      const core = ctx.createRadialGradient(cx, cy, 0, cx, cy, 300);
      core.addColorStop(0, "rgba(0,0,0,0.6)");
      core.addColorStop(0.5, "rgba(10,5,30,0.15)");
      core.addColorStop(1, "rgba(0,0,0,0)");
      ctx.fillStyle = core;
      ctx.fillRect(0, 0, w, h);

      // Accretion ring glow
      ctx.save();
      ctx.translate(cx, cy);
      ctx.rotate(time * 0.05);
      const ring = ctx.createRadialGradient(0, 0, 80, 0, 0, 250);
      ring.addColorStop(0, "rgba(255,255,255,0)");
      ring.addColorStop(0.3, "rgba(100,140,255,0.04)");
      ring.addColorStop(0.5, "rgba(140,100,255,0.06)");
      ring.addColorStop(0.7, "rgba(60,80,200,0.02)");
      ring.addColorStop(1, "rgba(0,0,0,0)");
      ctx.fillStyle = ring;
      ctx.fillRect(-250, -250, 500, 500);
      ctx.restore();

      // Particles with gravitational orbit
      const G = 0.03;
      for (const p of particles) {
        // Gravitational pull toward center
        const dx = cx - p.x;
        const dy = cy - p.y;
        const d = Math.sqrt(dx * dx + dy * dy) + 1;
        const fx = (dx / d) * G * (200 / Math.max(d, 50));
        const fy = (dy / d) * G * (200 / Math.max(d, 50));

        // Orbital velocity (perpendicular to radius)
        const orbitSpeed = p.speed * (100 / Math.max(d, 80));
        const perpX = -dy / d;
        const perpY = dx / d;

        // Apply forces
        p.x += fx + perpX * orbitSpeed;
        p.y += fy + perpY * orbitSpeed;

        // Drift correction — keep particles from escaping
        if (d > Math.max(w, h) * 0.6) {
          p.x += dx / d * 0.5;
          p.y += dy / d * 0.5;
        }

        // Trail
        p.trail.push({ x: p.x, y: p.y });
        if (p.trail.length > 8) p.trail.shift();

        // Draw trail
        if (p.trail.length > 1) {
          ctx.beginPath();
          ctx.moveTo(p.trail[0].x, p.trail[0].y);
          for (let i = 1; i < p.trail.length; i++) {
            ctx.lineTo(p.trail[i].x, p.trail[i].y);
          }
          ctx.strokeStyle = `hsla(${p.hue},60%,70%,${p.alpha * 0.3})`;
          ctx.lineWidth = p.r * 0.7;
          ctx.stroke();
        }

        // Draw particle
        const glow = ctx.createRadialGradient(p.x, p.y, 0, p.x, p.y, p.r * 3);
        glow.addColorStop(0, `hsla(${p.hue},80%,80%,${p.alpha})`);
        glow.addColorStop(0.5, `hsla(${p.hue},60%,60%,${p.alpha * 0.3})`);
        glow.addColorStop(1, `hsla(${p.hue},40%,40%,0)`);
        ctx.fillStyle = glow;
        ctx.fillRect(p.x - p.r * 3, p.y - p.r * 3, p.r * 6, p.r * 6);
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
