"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { motion } from "framer-motion";
import { Menu, X } from "lucide-react";
import { Logo } from "@/components/Logo";
import { AnimatedText } from "@/components/landing/AnimatedText";
import { DashboardPreview } from "@/components/landing/DashboardPreview";
const NAV_LINKS = [
  { label: "Product", href: "#features" },
  { label: "How it works", href: "#how-it-works" },
  { label: "Download", href: "/download" },
];

const HEADLINE_LINE_ONE = "Prove your focus is real";
const HEADLINE_LINE_TWO = "fund the code you build on.";
const SUBHEAD =
  "Upstream verifies every session against real commits and local activity, stays in sync across web, browser and desktop, and turns honest work into funding for the open source you depend on.";

const HEADLINE_ONE_WORDS = HEADLINE_LINE_ONE.split(" ").length;

export function Hero() {
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [scrolled, setScrolled] = useState(false);

  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 12);
    onScroll();
    window.addEventListener("scroll", onScroll, { passive: true });
    return () => window.removeEventListener("scroll", onScroll);
  }, []);

  return (
    <>
      {/* macOS frosted menu bar */}
      <motion.header
        initial={{ opacity: 0, y: -12 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5, ease: [0.22, 1, 0.36, 1] }}
        className="fixed inset-x-0 top-0 z-40"
      >
        <div className="mx-auto flex max-w-[1400px] items-center justify-between px-6 py-4 md:py-5">
          <Link href="#top" className="flex items-center gap-2.5">
            <Logo size={26} />
            <span className="font-inter text-[20px] font-bold tracking-tight text-white">Upstream</span>
          </Link>

          <nav className="hidden items-center gap-8 md:flex">
            {NAV_LINKS.map((link) => (
              <a
                key={link.label}
                href={link.href}
                className="font-inter text-[14px] font-medium text-[#A1A1AA] transition-colors hover:text-white"
              >
                {link.label}
              </a>
            ))}
          </nav>

          <Link
            href="/login"
            className="hidden rounded-full border border-white/15 bg-white/[0.06] px-5 py-2 font-inter text-[14px] font-medium text-white transition-all hover:bg-white/[0.10] hover:border-white/25 active:scale-[0.98] md:block"
          >
            Sign in
          </Link>

          <button
            type="button"
            onClick={() => setMobileMenuOpen(true)}
            className="text-white md:hidden"
            aria-label="Open menu"
          >
            <Menu size={24} />
          </button>
        </div>
      </motion.header>

      {mobileMenuOpen && (
        <div className="fixed inset-0 z-50 flex flex-col bg-[#0b0c10] px-6 py-4 md:hidden">
          <div className="flex items-center justify-between">
            <span className="flex items-center gap-2.5">
              <Logo size={26} />
              <span className="font-inter text-[20px] font-bold text-white">Upstream</span>
            </span>
            <button type="button" onClick={() => setMobileMenuOpen(false)} aria-label="Close menu">
              <X size={24} className="text-white" />
            </button>
          </div>
          <div className="mt-14 flex flex-col gap-7">
            {NAV_LINKS.map((link) => (
              <a
                key={link.label}
                href={link.href}
                onClick={() => setMobileMenuOpen(false)}
                className="font-inter text-[18px] font-medium text-[#A1A1AA]"
              >
                {link.label}
              </a>
            ))}
            <Link
              href="/login"
              className="mt-2 rounded-lg border border-white/10 bg-[#1c1d22] px-5 py-3 text-center font-inter text-[15px] text-white"
            >
              Sign in
            </Link>
          </div>
        </div>
      )}

      <section
        id="top"
        className="relative z-10 mx-auto w-full max-w-[1400px] px-6 pt-[140px] lg:pt-[180px]"
      >
        <motion.h1
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.7, delay: 0.2, ease: [0.22, 1, 0.36, 1] }}
          className="font-inter text-[2.5rem] font-extrabold leading-[1.1] tracking-tight text-white sm:text-[3.5rem] lg:text-[4.5rem]"
        >
          <AnimatedText text={HEADLINE_LINE_ONE} startDelay={0.35} />
          <br />
          <AnimatedText text={HEADLINE_LINE_TWO} startDelay={0.35} startIndex={HEADLINE_ONE_WORDS} />
        </motion.h1>

        <AnimatedText
          text={SUBHEAD}
          startDelay={1.25}
          step={0.025}
          className="mt-7 block max-w-[650px] font-inter text-[17px] leading-relaxed text-[#A1A1AA] sm:text-[20px]"
        />

        <motion.div
          initial={{ opacity: 0, y: 12 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5, delay: 0.8, ease: [0.22, 1, 0.36, 1] }}
          className="mt-10 flex flex-col gap-4 sm:flex-row"
        >
          <Link
            href="/signup"
            className="rounded-full bg-white text-black font-medium px-8 py-3.5 text-center font-inter text-[16px] transition-all hover:bg-white/90 active:scale-[0.98]"
          >
            Get started
          </Link>
          <a
            href="#how-it-works"
            className="rounded-full border border-white/10 bg-[#1c1d22] px-8 py-3.5 text-center font-inter text-[16px] font-medium text-white transition-all hover:bg-[#26272e] active:scale-[0.98]"
          >
            How it works
          </a>
        </motion.div>

        {/* Trust bar */}
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ duration: 0.5, delay: 1.0 }}
          className="mt-8 flex flex-wrap items-center gap-3 text-[#A1A1AA]/70 font-inter text-[13px]"
        >
          <span className="flex items-center gap-1.5">
            <span className="w-1.5 h-1.5 rounded-full bg-[#28c840]" />
            Activity processed on your device
          </span>
          <span className="text-neutral-700">·</span>
          <span>Open source</span>
          <span className="text-neutral-700">·</span>
          <span>Never sells data</span>
          <span className="text-neutral-700">·</span>
          <span>GitHub read-only</span>
        </motion.div>

        {/* Dashboard preview window with macOS traffic lights */}
        <motion.div
          initial={{ opacity: 0, y: 30 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.8, delay: 1.0, ease: [0.22, 1, 0.36, 1] }}
          className="mx-auto mt-[100px] w-full max-w-[1200px] overflow-hidden rounded-t-[24px] border border-white/10 bg-[#0e0f14]/80 backdrop-blur-2xl"
        >
          {/* macOS window title bar */}
          <div className="flex items-center gap-2 px-4 py-3 border-b border-white/5 bg-black/20">
            <span className="w-3 h-3 rounded-full bg-[#ff5f57]" />
            <span className="w-3 h-3 rounded-full bg-[#febc2e]" />
            <span className="w-3 h-3 rounded-full bg-[#28c840]" />
          </div>
          <div className="overflow-x-auto">
            <DashboardPreview />
          </div>
        </motion.div>
      </section>
    </>
  );
}
