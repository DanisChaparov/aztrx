"use client";

import { useEffect, useState, useCallback } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Sparkles, X } from "lucide-react";

/**
 * Full-screen celebration overlay shown after a successful subscription.
 *
 * Triggered when the user lands on /plans?subscribed=1 after Polar.sh
 * checkout. Renders a burst of animated particles around a central
 * "Welcome to Pro" card. Auto-dismisses after 6 seconds or on click/tap.
 */

const PARTICLE_COLORS = [
  "#3B82F6", // brand blue
  "#60A5FA", // lighter blue
  "#A78BFA", // violet
  "#F59E0B", // amber
  "#34D399", // emerald
  "#F472B6", // pink
];

const PARTICLE_SHAPES = ["✦", "◆", "●", "▲", "★", "⬥"];

interface Particle {
  id: number;
  x: number;
  y: number;
  rotation: number;
  scale: number;
  color: string;
  shape: string;
  delay: number;
}

function generateParticles(count: number): Particle[] {
  return Array.from({ length: count }, (_, i) => ({
    id: i,
    // Random position in a rough circle around center, biased outward
    x: (Math.random() - 0.5) * 600 + (Math.random() > 0.5 ? 1 : -1) * 200,
    y: (Math.random() - 0.5) * 500 + (Math.random() > 0.5 ? 1 : -1) * 150,
    rotation: Math.random() * 720 - 360,
    scale: 0.3 + Math.random() * 1.2,
    color: PARTICLE_COLORS[Math.floor(Math.random() * PARTICLE_COLORS.length)],
    shape: PARTICLE_SHAPES[Math.floor(Math.random() * PARTICLE_SHAPES.length)],
    delay: Math.random() * 0.4,
  }));
}

export function SubscriptionCelebration({
  onDismiss,
}: {
  onDismiss: () => void;
}) {
  // Start with empty particles during SSR to avoid hydration mismatch.
  // Math.random() produces different values on server vs client.
  const [particles, setParticles] = useState<Particle[]>([]);
  const [visible, setVisible] = useState(true);

  useEffect(() => {
    setParticles(generateParticles(40));
  }, []);

  const dismiss = useCallback(() => {
    setVisible(false);
    // Let exit animation play before removing from DOM
    setTimeout(onDismiss, 400);
  }, [onDismiss]);

  useEffect(() => {
    const timer = setTimeout(dismiss, 6000);
    return () => clearTimeout(timer);
  }, [dismiss]);

  // Dismiss on Escape key
  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") dismiss();
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [dismiss]);

  return (
    <AnimatePresence>
      {visible && (
        <motion.div
          className="fixed inset-0 z-50 flex items-center justify-center"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          transition={{ duration: 0.3 }}
          onClick={dismiss}
        >
          {/* Backdrop */}
          <motion.div
            className="absolute inset-0 bg-black/70 backdrop-blur-sm"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
          />

          {/* Particles */}
          <div className="absolute inset-0 overflow-hidden pointer-events-none flex items-center justify-center">
            {particles.map((p) => (
              <motion.span
                key={p.id}
                className="absolute left-1/2 top-1/2 inline-block font-mono"
                style={{ color: p.color }}
                initial={{
                  opacity: 0,
                  x: 0,
                  y: 0,
                  rotate: 0,
                  scale: 0,
                }}
                animate={{
                  opacity: [0, 1, 0],
                  x: p.x,
                  y: p.y,
                  rotate: p.rotation,
                  scale: [0, p.scale, 0],
                }}
                transition={{
                  duration: 2.5 + Math.random() * 1.5,
                  delay: p.delay,
                  ease: "easeOut",
                  times: [0, 0.15, 1],
                }}
              >
                {p.shape}
              </motion.span>
            ))}
          </div>

          {/* Card */}
          <motion.div
            className="relative z-10 mx-4 w-full max-w-sm rounded-2xl border border-[#3B82F6]/20 bg-[#0e0f14] p-8 shadow-2xl shadow-[#3B82F6]/10"
            initial={{ scale: 0.8, opacity: 0, y: 20 }}
            animate={{ scale: 1, opacity: 1, y: 0 }}
            exit={{ scale: 0.9, opacity: 0, y: 10 }}
            transition={{ type: "spring", stiffness: 300, damping: 25, delay: 0.1 }}
            onClick={(e) => e.stopPropagation()}
          >
            {/* Shimmer accent line at top */}
            <motion.div
              className="absolute top-0 left-4 right-4 h-[1px]"
              initial={{ scaleX: 0 }}
              animate={{ scaleX: 1 }}
              transition={{ delay: 0.4, duration: 0.6, ease: "easeOut" }}
              style={{
                background:
                  "linear-gradient(90deg, transparent, #3B82F6, #A78BFA, #3B82F6, transparent)",
              }}
            />

            <div className="flex flex-col items-center gap-4 text-center">
              {/* Icon with pulse ring */}
              <motion.div
                className="relative flex h-16 w-16 items-center justify-center rounded-full bg-[#3B82F6]/10"
                initial={{ scale: 0 }}
                animate={{ scale: 1 }}
                transition={{
                  type: "spring",
                  stiffness: 400,
                  damping: 15,
                  delay: 0.25,
                }}
              >
                <motion.div
                  className="absolute inset-0 rounded-full border border-[#3B82F6]/30"
                  animate={{ scale: [1, 1.4, 1], opacity: [0.6, 0, 0.6] }}
                  transition={{ duration: 2, repeat: Infinity, ease: "easeInOut" }}
                />
                <Sparkles size={28} className="text-[#60A5FA]" />
              </motion.div>

              {/* Heading */}
              <motion.div
                initial={{ opacity: 0, y: 8 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.4, duration: 0.4 }}
              >
                <h2 className="font-instrument-serif text-2xl text-white">
                  Welcome to Pro
                </h2>
                <p className="mt-1 font-inter text-sm text-[#A1A1AA]">
                  Your personal AI mentor is ready. Let's build.
                </p>
              </motion.div>

              {/* Dismiss button */}
              <motion.button
                type="button"
                onClick={dismiss}
                className="mt-2 inline-flex items-center gap-2 rounded-xl bg-[#3B82F6] px-5 py-2.5 font-manrope text-sm font-semibold text-white transition-colors hover:bg-[#3B82F6]/90"
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                transition={{ delay: 0.7, duration: 0.3 }}
              >
                Let's go
                <Sparkles size={13} />
              </motion.button>
            </div>

            {/* Close X */}
            <button
              type="button"
              onClick={dismiss}
              className="absolute top-3 right-3 rounded-lg p-1 text-neutral-600 transition-colors hover:text-neutral-400"
              aria-label="Close"
            >
              <X size={16} />
            </button>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
