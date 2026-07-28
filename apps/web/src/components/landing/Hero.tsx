"use client";

import { useState } from "react";
import Link from "next/link";
import { AnimatePresence, motion } from "framer-motion";
import { ArrowRight, Menu, X } from "lucide-react";
import { SiteBackground } from "@/components/SiteBackground";
import { WaterButton } from "@/components/WaterButton";

const NAV_LINKS = [
  { label: "Features", href: "#features" },
  { label: "How it works", href: "#how-it-works" },
];

export function Hero() {
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const year = new Date().getFullYear();

  return (
    <section id="top" className="relative min-h-screen w-full overflow-hidden bg-[#070b0a]">
      <SiteBackground />

      <nav className="relative z-20 flex items-center justify-between px-6 py-5 md:px-[120px] md:py-6">
        <Link href="#top" className="flex flex-col leading-none">
          <span className="font-jakarta text-xl font-extrabold tracking-tight text-white">Upstream</span>
          <span className="mt-1 hidden font-jakarta text-[10px] font-semibold uppercase tracking-[0.22em] text-white/40 md:block">
            Verified Focus
          </span>
        </Link>

        <div className="hidden items-center gap-8 md:flex">
          {NAV_LINKS.map((link) => (
            <a
              key={link.label}
              href={link.href}
              className="font-inter text-[16px] uppercase tracking-wide text-white/80 transition-colors hover:text-[#5ed29c]"
            >
              {link.label}
            </a>
          ))}
        </div>

        <div className="hidden items-center gap-3 md:flex">
          <WaterButton href="/login" variant="glass" className="px-5 py-2.5 text-[12px]">
            Sign In
          </WaterButton>
          <WaterButton href="/login" variant="primary" className="px-5 py-2.5 text-[12px]">
            Get Started
            <ArrowRight size={14} />
          </WaterButton>
        </div>

        <button type="button" onClick={() => setMobileMenuOpen(true)} className="md:hidden" aria-label="Open menu">
          <Menu size={24} className="text-white" />
        </button>
      </nav>

      <AnimatePresence>
        {mobileMenuOpen && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-30 flex flex-col bg-[#070b0a] px-6 py-5 md:hidden"
          >
            <div className="flex items-center justify-between">
              <span className="font-jakarta text-xl font-extrabold text-white">Upstream</span>
              <button type="button" onClick={() => setMobileMenuOpen(false)} aria-label="Close menu">
                <X size={24} className="text-white" />
              </button>
            </div>
            <div className="mt-12 flex flex-col items-center gap-8">
              {NAV_LINKS.map((link) => (
                <a
                  key={link.label}
                  href={link.href}
                  onClick={() => setMobileMenuOpen(false)}
                  className="font-inter text-xl uppercase tracking-wide text-white"
                >
                  {link.label}
                </a>
              ))}
              <WaterButton href="/login" variant="glass" className="mt-4 w-full">
                Sign In
              </WaterButton>
              <WaterButton href="/login" variant="primary" className="w-full">
                Get Started
                <ArrowRight size={16} />
              </WaterButton>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      <div className="relative z-10 mt-12 flex flex-col items-center px-6 text-center md:mt-16">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6, ease: "easeOut" }}
          className="liquid-glass flex h-[200px] w-[200px] -translate-y-[50px] flex-col justify-between p-4"
        >
          <span className="font-jakarta text-[14px] font-medium text-white/70">[ {year} ]</span>
          <div>
            <p className="font-inter text-[18px] leading-snug text-white">
              Verified by <em className="font-instrument-serif italic text-[#5ed29c]">real</em> commits
            </p>
            <p className="mt-2 font-inter text-[11px] text-white/50">
              Every session checked against live GitHub activity — not a locked screen.
            </p>
          </div>
        </motion.div>

        <motion.p
          initial={{ opacity: 0, y: 12 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6, ease: "easeOut", delay: 0.1 }}
          className="-mt-2 font-jakarta text-[11px] font-bold uppercase tracking-[0.25em] text-[#5ed29c]"
        >
          Verified Focus, Real Impact
        </motion.p>

        <motion.h1
          initial={{ opacity: 0, y: 16 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6, ease: "easeOut", delay: 0.2 }}
          className="mt-4 max-w-4xl font-inter font-extrabold uppercase leading-[1.05] tracking-tight text-white text-[40px] sm:text-[56px] md:text-[72px]"
        >
          Prove your focus is real<span className="text-[#5ed29c]">.</span>
        </motion.h1>

        <motion.p
          initial={{ opacity: 0, y: 16 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6, ease: "easeOut", delay: 0.3 }}
          className="mt-6 max-w-[512px] font-inter text-[14px] text-white/70"
        >
          Master deep, verifiable focus. Track real sessions across web, browser, and desktop, build your streak,
          and fund the open-source dependencies your code actually relies on.
        </motion.p>

        <motion.div
          initial={{ opacity: 0, y: 16 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6, ease: "easeOut", delay: 0.4 }}
          className="mt-8 flex flex-col gap-4 sm:flex-row"
        >
          <WaterButton href="/login" variant="primary">
            Get Started
            <ArrowRight size={16} />
          </WaterButton>
          <WaterButton href="#how-it-works" variant="glass">
            See How It Works
          </WaterButton>
        </motion.div>
      </div>
    </section>
  );
}
