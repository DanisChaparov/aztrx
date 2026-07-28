"use client";

import { motion } from "framer-motion";
import { Ban, HeartHandshake, ShieldCheck, Sparkles, type LucideIcon } from "lucide-react";
import { Hero } from "@/components/landing/Hero";
import { SiteBackground } from "@/components/SiteBackground";
import { WaterButton } from "@/components/WaterButton";

const FEATURES: { icon: LucideIcon; title: string; description: string }[] = [
  {
    icon: ShieldCheck,
    title: "Verified, not just timed",
    description:
      "Sessions are checked against real GitHub commits — a locked screen doesn't fake it, honest output does.",
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
  { title: "Connect GitHub", description: "Sign in and optionally link a repo so sessions can be verified against real commits." },
  { title: "Start a session", description: "Pick a duration from the web app, browser toolbar, or desktop widget — they all stay in sync." },
  { title: "Get verified & level up", description: "Honest sessions extend your streak, earn XP, unlock achievements, and grow your impact ledger." },
];

const container = {
  hidden: {},
  show: { transition: { staggerChildren: 0.12 } },
};

const fadeUp = {
  hidden: { opacity: 0, y: 24 },
  show: { opacity: 1, y: 0, transition: { duration: 0.6, ease: "easeOut" } },
};

export default function LandingPage() {
  return (
    <main className="flex flex-col bg-[#070b0a]">
      <Hero />

      <section id="features" className="mx-auto flex max-w-5xl flex-col gap-16 px-6 py-24">
        <motion.h2
          initial="hidden"
          whileInView="show"
          viewport={{ once: true }}
          variants={fadeUp}
          className="text-center font-instrument-serif text-4xl text-white"
        >
          Everything a focus app should have been
        </motion.h2>
        <motion.div
          initial="hidden"
          whileInView="show"
          viewport={{ once: true, margin: "-80px" }}
          variants={container}
          className="grid grid-cols-1 gap-6 sm:grid-cols-2"
        >
          {FEATURES.map((feature) => (
            <motion.div
              key={feature.title}
              variants={fadeUp}
              whileHover={{ y: -4 }}
              className="glass-panel flex flex-col gap-3 p-6"
            >
              <div className="flex h-11 w-11 items-center justify-center rounded-full bg-[#5ed29c]/15">
                <feature.icon size={20} className="text-[#5ed29c]" />
              </div>
              <h3 className="font-manrope text-lg font-medium text-white">{feature.title}</h3>
              <p className="font-inter text-sm text-neutral-400">{feature.description}</p>
            </motion.div>
          ))}
        </motion.div>
      </section>

      <section id="how-it-works" className="mx-auto flex max-w-3xl flex-col gap-12 px-6 py-24">
        <motion.h2
          initial="hidden"
          whileInView="show"
          viewport={{ once: true }}
          variants={fadeUp}
          className="text-center font-instrument-serif text-4xl text-white"
        >
          How it works
        </motion.h2>
        <motion.div
          initial="hidden"
          whileInView="show"
          viewport={{ once: true, margin: "-80px" }}
          variants={container}
          className="flex flex-col gap-8"
        >
          {STEPS.map((step, i) => (
            <motion.div key={step.title} variants={fadeUp} className="flex items-start gap-5">
              <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full border border-[#5ed29c]/40 bg-[#5ed29c]/10 font-manrope text-sm font-medium text-[#5ed29c]">
                {i + 1}
              </div>
              <div>
                <h4 className="font-manrope font-medium text-white">{step.title}</h4>
                <p className="font-inter text-sm text-neutral-400">{step.description}</p>
              </div>
            </motion.div>
          ))}
        </motion.div>
      </section>

      <section className="relative overflow-hidden px-6 py-32 text-center">
        <SiteBackground videoOpacity={0.4} />
        <motion.div
          initial="hidden"
          whileInView="show"
          viewport={{ once: true }}
          variants={container}
          className="relative z-10 mx-auto flex max-w-xl flex-col items-center gap-6"
        >
          <motion.h2 variants={fadeUp} className="font-instrument-serif text-4xl text-white">
            Start your streak today
          </motion.h2>
          <motion.div variants={fadeUp}>
            <WaterButton href="/login" variant="primary">
              Get started
            </WaterButton>
          </motion.div>
        </motion.div>
      </section>
    </main>
  );
}
