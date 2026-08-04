"use client";

import { useEffect, useRef } from "react";

/**
 * Minimalist animated background — subtle geometric shapes drifting slowly.
 * Rendered on a canvas for GPU compositing. Zero DOM thrash, zero layout cost.
 *
 * Design: a dark void with occasional soft-glowing orbs and thin connecting
 * lines. Like looking at deep water at night with faint bioluminescence.
 */
export function AnimatedBackground() {
  const canvasRef = useRef<HTMLCanvasElement>(null);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    let running = true;
    let width = 0;
    let height = 0;

    // ── particles ──────────────────────────────────────────
    const PARTICLE_COUNT = 18;
    interface Particle {
      x: number;
      y: number;
      vx: number;
      vy: number;
      r: number;
      alpha: number;
      pulse: number; // phase offset for breathing
    }

    let particles: Particle[] = [];

    function init() {
      width = window.innerWidth;
      height = window.innerHeight;
      canvas!.width = width;
      canvas!.height = height;
    }

    function spawnParticles() {
      particles = [];
      for (let i = 0; i < PARTICLE_COUNT; i++) {
        particles.push({
          x: Math.random() * width,
          y: Math.random() * height,
          vx: (Math.random() - 0.5) * 0.15,
          vy: (Math.random() - 0.5) * 0.12 - 0.08, // slight upward drift
          r: Math.random() * 80 + 30,
          alpha: Math.random() * 0.04 + 0.02,
          pulse: Math.random() * Math.PI * 2,
        });
      }
    }

    init();
    spawnParticles();

    // ── draw ────────────────────────────────────────────────
    function draw(timestamp: number) {
      if (!running) return;

      ctx!.clearRect(0, 0, width, height);

      // Soft dark background with subtle radial vignette
      const vignette = ctx!.createRadialGradient(
        width / 2, height / 2, height * 0.3,
        width / 2, height / 2, height * 1.2
      );
      vignette.addColorStop(0, "#0b0c10");
      vignette.addColorStop(1, "#060709");
      ctx!.fillStyle = vignette;
      ctx!.fillRect(0, 0, width, height);

      const t = timestamp * 0.001; // seconds

      // ── orbs ──────────────────────────────────────────
      for (const p of particles) {
        // Move
        p.x += p.vx;
        p.y += p.vy;

        // Wrap around edges with padding
        if (p.x < -p.r) p.x = width + p.r;
        if (p.x > width + p.r) p.x = -p.r;
        if (p.y < -p.r) p.y = height + p.r;
        if (p.y > height + p.r) p.y = -p.r;

        // Breathing glow
        const breathe = Math.sin(t * 0.4 + p.pulse) * 0.5 + 0.5;
        const glow = p.alpha * (0.6 + breathe * 0.4);

        // Radial gradient for each orb
        const gradient = ctx!.createRadialGradient(p.x, p.y, 0, p.x, p.y, p.r);
        gradient.addColorStop(0, `rgba(139, 107, 255, ${glow * 1.5})`);
        gradient.addColorStop(0.4, `rgba(103, 68, 255, ${glow})`);
        gradient.addColorStop(1, "rgba(103, 68, 255, 0)");

        ctx!.fillStyle = gradient;
        ctx!.fillRect(p.x - p.r, p.y - p.r, p.r * 2, p.r * 2);
      }

      // ── subtle grid lines ──────────────────────────────
      const gridAlpha = 0.015;
      ctx!.strokeStyle = `rgba(255, 255, 255, ${gridAlpha})`;
      ctx!.lineWidth = 0.5;
      const gridSize = 120;
      for (let x = gridSize; x < width; x += gridSize) {
        ctx!.beginPath();
        ctx!.moveTo(x, 0);
        ctx!.lineTo(x, height);
        ctx!.stroke();
      }
      for (let y = gridSize; y < height; y += gridSize) {
        ctx!.beginPath();
        ctx!.moveTo(0, y);
        ctx!.lineTo(width, y);
        ctx!.stroke();
      }

      requestAnimationFrame(draw);
    }

    // ── resize ────────────────────────────────────────────
    function onResize() {
      init();
      spawnParticles();
    }

    window.addEventListener("resize", onResize, { passive: true });
    requestAnimationFrame(draw);

    return () => {
      running = false;
      window.removeEventListener("resize", onResize);
    };
  }, []);

  return (
    <canvas
      ref={canvasRef}
      aria-hidden="true"
      className="fixed inset-0 -z-10"
      style={{ pointerEvents: "none" }}
    />
  );
}
