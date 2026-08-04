"use client";

import Link from "next/link";
import { motion } from "framer-motion";
import { Ban, HeartHandshake, ShieldCheck, Sparkles, type LucideIcon } from "lucide-react";
import { Hero } from "@/components/landing/Hero";

const FEATURES: { icon: LucideIcon; title: string; description: string }[] = [
  {
    icon: ShieldCheck,
    title: "Verified, not just timed",
    description:
      "Sessions are checked against real commits and local activity — a locked screen doesn't fake it, honest output does.",
  },
  {
    icon: HeartHandshake,
    title: "Funds the code you depend on",
    description:
      "Every verified session builds a simulated impact ledger, split across the open-source dependencies your project actually uses.",
  },
  {
    icon: Ban,
    title: "Blocks real distractions",
    description:
      "A browser extension blocks distracting sites mid-session; the desktop widget catches native apps the browser can't see.",
  },
  {
    icon: Sparkles,
    title: "Built to feel good",
    description: "Streaks, XP, levels, and achievements — progress you can actually see, not just a number on a page.",
  },
];

const STEPS = [
  {
    title: "Connect your accounts",
    description: "Sign in and optionally link a repo so sessions can be verified against real commits.",
  },
  {
    title: "Start a session",
    description:
      "Pick a duration from the web app, browser toolbar, or desktop widget — they all stay in sync.",
  },
  {
    title: "Get verified & level up",
    description:
      "Honest sessions extend your streak, earn XP, unlock achievements, and grow your impact ledger.",
  },
];

function GlassCard({ children, delay = 0 }: { children: React.ReactNode; delay?: number }) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true, margin: "-60px" }}
      transition={{ duration: 0.6, delay, ease: [0.22, 1, 0.36, 1] }}
      className="rounded-2xl border border-white/10 bg-white/[0.03] backdrop-blur-2xl shadow-[inset_0_1px_0_0_rgba(255,255,255,0.08)]"
    >
      {children}
    </motion.div>
  );
}

export default function LandingPage() {
  return (
    <div className="relative min-h-screen overflow-x-hidden bg-[#0c0c0c] text-white">
      <svg className="hidden">
        <filter id="c3-noise">
          <feTurbulence type="fractalNoise" baseFrequency="0.9" numOctaves="2" stitchTiles="stitch" />
          <feColorMatrix type="matrix" values="0 0 0 0 0  0 0 0 0 0  0 0 0 0 0  0 0 0 0.35 0" />
          <feComposite in2="SourceGraphic" operator="in" result="noise" />
          <feBlend in="SourceGraphic" in2="noise" mode="multiply" />
        </filter>
      </svg>

      <div className="hidden md:block pointer-events-none fixed inset-y-0 left-1/2 -translate-x-[calc(50%+36rem)] w-px bg-white/10 z-[5]" />
      <div className="hidden md:block pointer-events-none fixed inset-y-0 left-1/2 translate-x-[calc(-50%+36rem)] w-px bg-white/10 z-[5]" />

      <main className="flex flex-col">
        <Hero />

        <section id="features" className="relative z-10 px-6 py-28">
          <div className="mx-auto flex max-w-[1100px] flex-col gap-14">
            <motion.h2
              initial={{ opacity: 0, y: 15 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ duration: 0.6, ease: [0.22, 1, 0.36, 1] }}
              className="max-w-[20ch] font-inter text-[2rem] font-extrabold leading-[1.15] tracking-tight text-white sm:text-[2.75rem]"
            >
              Everything a focus app should have been
            </motion.h2>
            <div className="grid grid-cols-1 gap-6 sm:grid-cols-2">
              {FEATURES.map((feature, i) => (
                <GlassCard key={feature.title} delay={i * 0.08}>
                  <div className="flex h-full flex-col gap-3 p-7">
                    <div className="flex h-11 w-11 items-center justify-center rounded-full bg-[#6744FF]/15">
                      <feature.icon size={20} className="text-[#8b74ff]" />
                    </div>
                    <h3 className="font-inter text-lg font-semibold text-white">{feature.title}</h3>
                    <p className="font-inter text-[15px] leading-relaxed text-[#A1A1AA]">{feature.description}</p>
                  </div>
                </GlassCard>
              ))}
            </div>
          </div>
        </section>

        <section id="how-it-works" className="relative z-10 px-6 pb-28">
          <div className="mx-auto flex max-w-[1100px] flex-col gap-12">
            <motion.h2
              initial={{ opacity: 0, y: 15 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ duration: 0.6, ease: [0.22, 1, 0.36, 1] }}
              className="font-inter text-[2rem] font-extrabold leading-[1.15] tracking-tight text-white sm:text-[2.75rem]"
            >
              How it works
            </motion.h2>
            <div className="grid grid-cols-1 gap-6 md:grid-cols-3">
              {STEPS.map((step, i) => (
                <GlassCard key={step.title} delay={i * 0.08}>
                  <div className="flex h-full flex-col gap-3 p-7">
                    <div className="flex h-9 w-9 items-center justify-center rounded-full bg-[#6744FF] font-inter text-sm font-semibold text-white">
                      {i + 1}
                    </div>
                    <h3 className="font-inter text-lg font-semibold text-white">{step.title}</h3>
                    <p className="font-inter text-[15px] leading-relaxed text-[#A1A1AA]">{step.description}</p>
                  </div>
                </GlassCard>
              ))}
            </div>
          </div>
        </section>

        <section className="relative z-10 px-6 pb-32 text-center">
          <div className="mx-auto max-w-[720px] rounded-3xl border border-white/15 bg-white/[0.02] backdrop-blur-2xl shadow-[inset_0_1px_0_0_rgba(255,255,255,0.12)] px-8 py-16 relative overflow-hidden">
            <div className="absolute inset-0 pointer-events-none opacity-30" style={{ background: "radial-gradient(400px at 50% 0%, rgba(255,255,255,0.1), transparent 70%)" }} />
            <div className="relative z-10 flex flex-col items-center gap-7">
              <h2 className="font-inter text-[2rem] font-extrabold leading-[1.15] tracking-tight text-white sm:text-[2.5rem]">
                Start your streak today
              </h2>
              <p className="max-w-[520px] font-inter text-[17px] leading-relaxed text-[#A1A1AA]">
                Sign up with your preferred account and run your first verified session in under a minute.
              </p>
              <Link
                href="/signup"
                className="rounded-full bg-white text-black font-medium px-8 py-3.5 font-inter text-[16px] transition-all hover:bg-white/90 active:scale-[0.98]"
              >
                Get started
              </Link>
            </div>
          </div>
        </section>
      </main>
    </div>
  );
}
