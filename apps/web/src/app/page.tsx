"use client";

import { useEffect, useRef, useState } from "react";
import Link from "next/link";
import { motion, useScroll, useTransform, AnimatePresence } from "framer-motion";
import { ArrowRight, Github, Moon, Sun, Zap, Shield, TrendingUp, Blocks } from "lucide-react";
import { Logo } from "@/components/Logo";
import { useTheme } from "@/components/ThemeProvider";

/* ── subtle noise overlay ─────────────────────────────────────── */
function Noise() {
  return (
    <div
      className="pointer-events-none fixed inset-0 z-50 opacity-[0.015]"
      style={{
        backgroundImage: `url("data:image/svg+xml,%3Csvg viewBox='0 0 256 256' xmlns='http://www.w3.org/2000/svg'%3E%3Cfilter id='n'%3E%3CfeTurbulence type='fractalNoise' baseFrequency='0.75' numOctaves='4' stitchTiles='stitch'/%3E%3C/filter%3E%3Crect width='100%25' height='100%25' filter='url(%23n)'/%3E%3C/svg%3E")`,
        backgroundSize: "200px 200px",
      }}
    />
  );
}

/* ── animated grid ────────────────────────────────────────────── */
function Grid() {
  return (
    <div className="pointer-events-none fixed inset-0 -z-10">
      <div
        className="absolute inset-0"
        style={{
          backgroundImage:
            "linear-gradient(rgba(255,255,255,0.02) 1px, transparent 1px), linear-gradient(90deg, rgba(255,255,255,0.02) 1px, transparent 1px)",
          backgroundSize: "64px 64px",
          maskImage: "radial-gradient(ellipse 80% 60% at 50% 0%, black 30%, transparent 70%)",
        }}
      />
      {/* Ambient glows */}
      <div className="absolute top-0 left-1/2 -translate-x-1/2 h-[600px] w-[800px] rounded-full bg-violet-600/5 blur-[150px]" />
      <div className="absolute bottom-0 right-0 h-[400px] w-[600px] rounded-full bg-emerald-500/4 blur-[120px]" />
    </div>
  );
}

/* ── section reveal ───────────────────────────────────────────── */
function Reveal({
  children,
  delay = 0,
  className = "",
}: {
  children: React.ReactNode;
  delay?: number;
  className?: string;
}) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 32 }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true, margin: "-80px" }}
      transition={{ duration: 0.7, delay, ease: [0.22, 1, 0.36, 1] }}
      className={className}
    >
      {children}
    </motion.div>
  );
}

/* ── feature card ─────────────────────────────────────────────── */
function FeatureCard({
  icon: Icon,
  title,
  desc,
  delay,
}: {
  icon: React.ElementType;
  title: string;
  desc: string;
  delay: number;
}) {
  const [hovered, setHovered] = useState(false);

  return (
    <motion.div
      initial={{ opacity: 0, y: 24 }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true, margin: "-60px" }}
      transition={{ duration: 0.5, delay, ease: [0.22, 1, 0.36, 1] }}
      onMouseEnter={() => setHovered(true)}
      onMouseLeave={() => setHovered(false)}
      className="group relative overflow-hidden rounded-2xl border border-white/[0.06] bg-white/[0.02] p-8 transition-all duration-500"
    >
      {/* hover glow */}
      <motion.div
        className="pointer-events-none absolute inset-0 rounded-2xl"
        animate={{
          boxShadow: hovered
            ? "inset 0 1px 0 rgba(255,255,255,0.08), 0 0 30px -10px rgba(139,92,246,0.15)"
            : "inset 0 1px 0 rgba(255,255,255,0.03)",
        }}
      />
      <div className="relative z-10 flex flex-col gap-4">
        <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-violet-500/10">
          <Icon size={20} className="text-violet-400" />
        </div>
        <h3 className="font-jakarta text-lg font-semibold text-white">{title}</h3>
        <p className="font-inter text-[15px] leading-relaxed text-zinc-400">{desc}</p>
      </div>
    </motion.div>
  );
}

/* ── page ─────────────────────────────────────────────────────── */
export default function LandingPage() {
  const { theme, toggle } = useTheme();
  const [scrolled, setScrolled] = useState(false);
  const [mobileOpen, setMobileOpen] = useState(false);

  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 20);
    window.addEventListener("scroll", onScroll, { passive: true });
    return () => window.removeEventListener("scroll", onScroll);
  }, []);

  return (
    <>
      <Noise />
      <Grid />

      {/* ── nav ──────────────────────────────────────────────── */}
      <motion.header
        initial={{ y: -60, opacity: 0 }}
        animate={{ y: 0, opacity: 1 }}
        transition={{ duration: 0.6, ease: [0.22, 1, 0.36, 1] }}
        className={`fixed inset-x-0 top-0 z-40 transition-all duration-300 ${
          scrolled
            ? "border-b border-white/[0.06] bg-black/80 backdrop-blur-xl"
            : ""
        }`}
      >
        <div className="mx-auto flex max-w-6xl items-center justify-between px-6 py-4">
          <Link href="/" className="flex items-center gap-2.5">
            <Logo size={24} />
            <span className="font-jakarta text-[16px] font-bold tracking-tight text-white">Upstream</span>
          </Link>

          <div className="hidden items-center gap-6 md:flex">
            <a href="#features" className="font-inter text-[14px] text-zinc-400 transition-colors hover:text-white">
              Features
            </a>
            <a href="#how" className="font-inter text-[14px] text-zinc-400 transition-colors hover:text-white">
              How it works
            </a>
            <button
              onClick={toggle}
              className="flex h-8 w-14 items-center rounded-full border border-white/[0.08] bg-white/[0.03] p-1 transition-colors hover:bg-white/[0.06]"
            >
              <motion.div
                animate={{ x: theme === "dark" ? 0 : 22 }}
                transition={{ type: "spring", stiffness: 400, damping: 25 }}
                className="flex h-6 w-6 items-center justify-center rounded-full bg-white/[0.12]"
              >
                {theme === "dark" ? <Moon size={12} className="text-zinc-300" /> : <Sun size={12} className="text-yellow-400" />}
              </motion.div>
            </button>
            <Link
              href="/login"
              className="rounded-lg px-4 py-2 font-inter text-[14px] text-zinc-300 transition-colors hover:text-white"
            >
              Sign in
            </Link>
            <Link
              href="/signup"
              className="rounded-lg bg-white px-4 py-2 font-inter text-[14px] font-medium text-black transition-all hover:bg-zinc-200 hover:shadow-[0_0_24px_-6px_rgba(255,255,255,0.15)]"
            >
              Get started
            </Link>
          </div>

          <button className="text-white md:hidden" onClick={() => setMobileOpen(true)}>
            <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <path d="M4 6h16M4 12h16M4 18h16" />
            </svg>
          </button>
        </div>
      </motion.header>

      {/* ── hero ──────────────────────────────────────────────── */}
      <section className="relative flex min-h-screen flex-col items-center justify-center px-6 pt-20 text-center">
        <motion.div
          initial={{ opacity: 0, y: 40 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.9, delay: 0.2, ease: [0.22, 1, 0.36, 1] }}
          className="flex flex-col items-center gap-6"
        >
          {/* Badge */}
          <motion.div
            initial={{ opacity: 0, scale: 0.9 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ duration: 0.5, delay: 0.4 }}
            className="flex items-center gap-2 rounded-full border border-violet-500/20 bg-violet-500/5 px-4 py-1.5"
          >
            <span className="h-1.5 w-1.5 rounded-full bg-violet-400" />
            <span className="font-inter text-[13px] text-violet-300">Now in public beta</span>
          </motion.div>

          {/* Headline */}
          <h1 className="max-w-[700px] font-jakarta text-[3.25rem] font-extrabold leading-[1.05] tracking-[-0.03em] text-white sm:text-[4.5rem] lg:text-[5.5rem]">
            Prove your
            <br />
            <span className="bg-gradient-to-r from-violet-400 via-violet-300 to-emerald-300 bg-clip-text text-transparent">
              focus is real
            </span>
          </h1>

          <motion.p
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ duration: 0.6, delay: 0.7 }}
            className="max-w-[520px] font-inter text-[17px] leading-relaxed text-zinc-400 sm:text-[19px]"
          >
            Upstream verifies every session against real commits and local activity. Block
            distractions, build streaks, and fund open source — all while you ship.
          </motion.p>

          {/* CTAs */}
          <motion.div
            initial={{ opacity: 0, y: 12 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5, delay: 0.9 }}
            className="mt-4 flex flex-col gap-3 sm:flex-row"
          >
            <Link
              href="/signup"
              className="inline-flex items-center gap-2 rounded-xl bg-white px-8 py-3.5 font-inter text-[16px] font-semibold text-black transition-all hover:bg-zinc-200 hover:shadow-[0_0_30px_-6px_rgba(255,255,255,0.2)] active:scale-[0.98]"
            >
              Get started free
              <ArrowRight size={18} />
            </Link>
            <a
              href="#features"
              className="inline-flex items-center gap-2 rounded-xl border border-white/[0.08] bg-white/[0.02] px-8 py-3.5 font-inter text-[16px] text-white transition-all hover:border-white/[0.15] hover:bg-white/[0.04]"
            >
              See how it works
            </a>
          </motion.div>
        </motion.div>

        {/* Scroll indicator */}
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 1.5, duration: 0.6 }}
          className="absolute bottom-10"
        >
          <motion.div
            animate={{ y: [0, 8, 0] }}
            transition={{ repeat: Infinity, duration: 2, ease: "easeInOut" }}
            className="h-10 w-6 rounded-full border border-white/[0.08]"
          >
            <motion.div
              animate={{ y: [2, 14, 2] }}
              transition={{ repeat: Infinity, duration: 1.5, ease: "easeInOut" }}
              className="mx-auto mt-1.5 h-1.5 w-1.5 rounded-full bg-white/30"
            />
          </motion.div>
        </motion.div>
      </section>

      {/* ── features ──────────────────────────────────────────── */}
      <section id="features" className="px-6 py-32">
        <div className="mx-auto max-w-6xl">
          <Reveal>
            <h2 className="mb-16 font-jakarta text-[2rem] font-extrabold tracking-[-0.02em] text-white sm:text-[2.75rem]">
              Everything a focus app
              <br />
              <span className="text-zinc-500">should have been</span>
            </h2>
          </Reveal>
          <div className="grid grid-cols-1 gap-5 sm:grid-cols-2">
            <FeatureCard
              icon={Shield}
              title="Verified, not just timed"
              desc="Sessions are cross-checked against real GitHub commits and local IDE activity. A locked screen can't fake it."
              delay={0}
            />
            <FeatureCard
              icon={TrendingUp}
              title="Streaks that mean something"
              desc="Every verified session extends your streak. Earn XP, unlock achievements, and watch your level grow."
              delay={0.1}
            />
            <FeatureCard
              icon={Blocks}
              title="Blocks real distractions"
              desc="Browser extension blocks sites mid-session. Desktop widget catches native apps the browser can't see."
              delay={0.2}
            />
            <FeatureCard
              icon={Zap}
              title="Funds open source"
              desc="Every session builds a simulated impact ledger, split across the dependencies your project actually uses."
              delay={0.3}
            />
          </div>
        </div>
      </section>

      {/* ── CTA ────────────────────────────────────────────────── */}
      <section className="px-6 pb-40">
        <Reveal className="mx-auto max-w-2xl rounded-3xl border border-white/[0.06] bg-white/[0.01] p-12 text-center">
          <h2 className="mb-4 font-jakarta text-[2rem] font-extrabold tracking-[-0.02em] text-white sm:text-[2.5rem]">
            Start your streak today
          </h2>
          <p className="mb-8 font-inter text-[17px] leading-relaxed text-zinc-400">
            Sign up with GitHub, Google, or email. Run your first verified session in under a minute.
          </p>
          <Link
            href="/signup"
            className="inline-flex items-center gap-2 rounded-xl bg-white px-8 py-3.5 font-inter text-[16px] font-semibold text-black transition-all hover:bg-zinc-200 hover:shadow-[0_0_30px_-6px_rgba(255,255,255,0.2)] active:scale-[0.98]"
          >
            Get started free
            <ArrowRight size={18} />
          </Link>
          <div className="mt-6 flex items-center justify-center gap-4">
            <Github size={18} className="text-zinc-500" />
            <span className="font-inter text-[13px] text-zinc-500">Google</span>
            <span className="font-inter text-[13px] text-zinc-500">Email</span>
          </div>
        </Reveal>
      </section>

      {/* ── footer ─────────────────────────────────────────────── */}
      <footer className="border-t border-white/[0.04] px-6 py-10">
        <div className="mx-auto flex max-w-6xl items-center justify-between">
          <div className="flex items-center gap-2.5">
            <Logo size={18} />
            <span className="font-jakarta text-[14px] font-semibold text-zinc-500">Upstream</span>
          </div>
          <button
            onClick={toggle}
            className="flex items-center gap-2 rounded-lg px-3 py-1.5 font-inter text-[13px] text-zinc-500 transition-colors hover:text-zinc-300"
          >
            {theme === "dark" ? <Sun size={14} /> : <Moon size={14} />}
            {theme === "dark" ? "Light mode" : "Dark mode"}
          </button>
        </div>
      </footer>
    </>
  );
}
