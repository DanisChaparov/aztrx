"use client";

import { useState, type MouseEvent, type ReactNode } from "react";
import Link from "next/link";
import { AnimatePresence, motion } from "framer-motion";
import { playClick } from "@/lib/sounds";

interface RippleDot {
  id: number;
  x: number;
  y: number;
  size: number;
}

let rippleSeq = 0;

const VARIANTS = {
  primary: "bg-[#6744FF] text-white shadow-[0_4px_24px_-6px_rgba(103,68,255,0.5)] hover:bg-[#5a39f0]",
  glass: "liquid-glass text-white hover:bg-white/[0.05]",
  ghost: "border border-white/15 text-white hover:border-[#6744FF]/60 hover:text-[#8b74ff]",
} as const;

interface WaterButtonProps {
  children: ReactNode;
  variant?: keyof typeof VARIANTS;
  href?: string;
  onClick?: () => void;
  type?: "button" | "submit";
  disabled?: boolean;
  className?: string;
}

/** Primary interactive control: a "water" ripple spawns from the click point on every press. */
export function WaterButton({
  children,
  variant = "primary",
  href,
  onClick,
  type = "button",
  disabled,
  className = "",
}: WaterButtonProps) {
  const [ripples, setRipples] = useState<RippleDot[]>([]);

  function spawnRipple(e: MouseEvent<HTMLElement>) {
    if (disabled) return;
    playClick();
    const rect = e.currentTarget.getBoundingClientRect();
    const size = Math.max(rect.width, rect.height) * 2.2;
    const id = rippleSeq++;
    setRipples((prev) => [
      ...prev,
      { id, x: e.clientX - rect.left - size / 2, y: e.clientY - rect.top - size / 2, size },
    ]);
    setTimeout(() => setRipples((prev) => prev.filter((r) => r.id !== id)), 650);
  }

  const classes = `relative isolate inline-flex items-center justify-center gap-2 overflow-hidden rounded-full px-6 py-3 font-jakarta text-[13px] font-bold uppercase tracking-wide transition-colors duration-200 disabled:opacity-40 ${VARIANTS[variant]} ${className}`;

  const rippleLayer = (
    <span className="pointer-events-none absolute inset-0 overflow-hidden rounded-[inherit]">
      <AnimatePresence>
        {ripples.map((r) => (
          <motion.span
            key={r.id}
            initial={{ opacity: 0.45, scale: 0 }}
            animate={{ opacity: 0, scale: 1 }}
            transition={{ duration: 0.65, ease: "easeOut" }}
            className="absolute rounded-full bg-white/50"
            style={{ left: r.x, top: r.y, width: r.size, height: r.size }}
          />
        ))}
      </AnimatePresence>
    </span>
  );

  if (href) {
    return (
      <Link href={href} onMouseDown={spawnRipple} className={classes}>
        {rippleLayer}
        <span className="relative z-10 flex items-center gap-2">{children}</span>
      </Link>
    );
  }

  return (
    <button type={type} onMouseDown={spawnRipple} onClick={onClick} disabled={disabled} className={classes}>
      {rippleLayer}
      <span className="relative z-10 flex items-center gap-2">{children}</span>
    </button>
  );
}
