"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { Menu, X } from "lucide-react";
import { Logo } from "@/components/Logo";
import { AnimatedText } from "@/components/landing/AnimatedText";
import { DashboardPreview } from "@/components/landing/DashboardPreview";

const NAV_LINKS = [
  { label: "Product", href: "#features" },
  { label: "How it works", href: "#how-it-works" },
  { label: "Verification", href: "#features" },
  { label: "Impact", href: "#features" },
];

const HERO_VIDEO_URL =
  "https://cdn.sceneai.art/Hero%20Section%20Video/973fa3f6-7715-4e73-9cfd-100ee86285b5.mp4";

const HEADLINE_LINE_ONE = "Prove your focus is real,";
const HEADLINE_LINE_TWO = "fund the code you build on.";
const SUBHEAD =
  "Upstream checks every session against your real GitHub commits, stays in sync across web, browser and desktop, and turns honest work into funding for the open source you depend on.";

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
      {/* Fixed behind the entire page. Sections below the hero carry their own
          solid background, so the video only shows through up top. */}
      <video
        className="fixed inset-0 z-0 h-full w-full object-cover"
        src={HERO_VIDEO_URL}
        autoPlay
        muted
        loop
        playsInline
        preload="auto"
        disablePictureInPicture
        aria-hidden
      />

      <header
        className={`fixed inset-x-0 top-0 z-40 animate-fade-in-down transition-colors duration-300 ${
          scrolled ? "border-b border-white/5 bg-[#0e0f14]/90 backdrop-blur-md" : ""
        }`}
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
            className="hidden rounded-lg border border-white/10 bg-[#1c1d22] px-5 py-2 font-inter text-[14px] text-white transition-colors hover:bg-[#26272e] md:block"
          >
            Log in
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
      </header>

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
              Log in
            </Link>
          </div>
        </div>
      )}

      {/* w-full matters: `mx-auto` on a column-flex child opts it out of
          stretching, so without it the section sizes to its widest child (the
          dashboard preview) and drags the whole page into a sideways scroll. */}
      <section
        id="top"
        className="relative z-10 mx-auto w-full max-w-[1400px] px-6 pt-[140px] lg:pt-[180px]"
      >
        {/* No max-width: the two lines are set explicitly by the <br>, and a
            character cap would re-wrap them into four ragged ones. */}
        <h1 className="font-inter text-[2.5rem] font-extrabold leading-[1.1] tracking-tight text-white sm:text-[3.5rem] lg:text-[4.5rem]">
          <AnimatedText text={HEADLINE_LINE_ONE} startDelay={0.35} />
          <br />
          <AnimatedText text={HEADLINE_LINE_TWO} startDelay={0.35} startIndex={HEADLINE_ONE_WORDS} />
        </h1>

        <AnimatedText
          text={SUBHEAD}
          startDelay={1.25}
          step={0.025}
          className="mt-7 block max-w-[650px] font-inter text-[17px] leading-relaxed text-[#A1A1AA] sm:text-[20px]"
        />

        <div
          className="animate-fade-in-up mt-10 flex flex-col gap-4 sm:flex-row"
          style={{ animationDelay: "2.2s" }}
        >
          <Link
            href="/login"
            className="rounded-xl bg-[#6744FF] px-8 py-3.5 text-center font-inter text-[16px] font-medium text-white transition-colors hover:bg-[#5a39f0]"
          >
            Get started
          </Link>
          <a
            href="#how-it-works"
            className="rounded-xl border border-white/10 bg-[#1c1d22] px-8 py-3.5 text-center font-inter text-[16px] font-medium text-white transition-colors hover:bg-[#26272e]"
          >
            How it works
          </a>
        </div>

        <div
          className="animate-fade-in-scale mx-auto mt-[100px] w-full max-w-[1200px] overflow-hidden rounded-t-[24px] border border-white/10 bg-[#0e0f14]"
          style={{ animationDelay: "2.8s" }}
        >
          {/* The preview is wider than a phone, so let it scroll sideways in
              place rather than squashing the layout it is meant to show off. */}
          <div className="overflow-x-auto">
            <DashboardPreview />
          </div>
        </div>
      </section>
    </>
  );
}
