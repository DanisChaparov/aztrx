import Link from "next/link";
import { Ban, HeartHandshake, ShieldCheck, Sparkles, type LucideIcon } from "lucide-react";
import { Hero } from "@/components/landing/Hero";
import { Reveal } from "@/components/landing/Reveal";

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

export default function LandingPage() {
  return (
    <div className="relative min-h-screen overflow-x-hidden bg-[#0c0c0c] text-white">

      {/* Фоновое видео */}
      <div className="fixed inset-0 z-0 pointer-events-none">
        <video
          autoPlay
          loop
          muted
          playsInline
          className="w-full h-full object-cover pointer-events-none opacity-50"
          src="https://d8j0ntlcm91z4.cloudfront.net/user_38xzZboKViGWJOttwIXH07lWA1P/hf_20260508_064122_c4750c0e-7476-4b44-94a2-a85a65c63bf2.mp4"
        />
      </div>

      {/* Направляющие линии */}
      <div className="hidden md:block pointer-events-none fixed inset-y-0 left-1/2 -translate-x-[calc(50%+36rem)] w-px bg-white/10 z-[5]" />
      <div className="hidden md:block pointer-events-none fixed inset-y-0 left-1/2 translate-x-[calc(-50%+36rem)] w-px bg-white/10 z-[5]" />

      {/* SVG-фильтры шума */}
      <svg className="hidden">
        <filter id="c3-noise">
          <feTurbulence type="fractalNoise" baseFrequency="0.9" numOctaves="2" stitchTiles="stitch" />
          <feColorMatrix type="matrix" values="0 0 0 0 0  0 0 0 0 0  0 0 0 0 0  0 0 0 0.35 0" />
          <feComposite in2="SourceGraphic" operator="in" result="noise" />
          <feBlend in="SourceGraphic" in2="noise" mode="multiply" />
        </filter>
      </svg>

      {/* Оригинальный контент */}
      <main className="flex flex-col">
        <Hero />

        <section id="features" className="relative z-10 bg-[#0b0c10] px-6 py-28">
          <div className="mx-auto flex max-w-[1100px] flex-col gap-14">
            <Reveal>
              <h2 className="max-w-[20ch] font-inter text-[2rem] font-extrabold leading-[1.15] tracking-tight text-white sm:text-[2.75rem]">
                Everything a focus app should have been
              </h2>
            </Reveal>
            <div className="grid grid-cols-1 gap-6 sm:grid-cols-2">
              {FEATURES.map((feature, i) => (
                <Reveal key={feature.title} delay={i * 0.08}>
                  <div className="liquid-glass rounded-2xl flex h-full flex-col gap-3 p-7">
                    <div className="flex h-11 w-11 items-center justify-center rounded-full bg-[#6744FF]/15">
                      <feature.icon size={20} className="text-[#8b74ff]" />
                    </div>
                    <h3 className="font-inter text-lg font-semibold text-white">{feature.title}</h3>
                    <p className="font-inter text-[15px] leading-relaxed text-[#A1A1AA]">{feature.description}</p>
                  </div>
                </Reveal>
              ))}
            </div>
          </div>
        </section>

        <section id="how-it-works" className="relative z-10 bg-[#0b0c10] px-6 pb-28">
          <div className="mx-auto flex max-w-[1100px] flex-col gap-12">
            <Reveal>
              <h2 className="font-inter text-[2rem] font-extrabold leading-[1.15] tracking-tight text-white sm:text-[2.75rem]">
                How it works
              </h2>
            </Reveal>
            <div className="grid grid-cols-1 gap-6 md:grid-cols-3">
              {STEPS.map((step, i) => (
                <Reveal key={step.title} delay={i * 0.08}>
                  <div className="liquid-glass rounded-2xl flex h-full flex-col gap-3 p-7">
                    <div className="flex h-9 w-9 items-center justify-center rounded-full bg-[#6744FF] font-inter text-sm font-semibold text-white">
                      {i + 1}
                    </div>
                    <h3 className="font-inter text-lg font-semibold text-white">{step.title}</h3>
                    <p className="font-inter text-[15px] leading-relaxed text-[#A1A1AA]">{step.description}</p>
                  </div>
                </Reveal>
              ))}
            </div>
          </div>
        </section>

        <section className="relative z-10 bg-[#0b0c10] px-6 pb-32 text-center">
          <Reveal className="mx-auto flex max-w-[720px] flex-col items-center gap-7 rounded-3xl border border-white/10 bg-[#0e0f14] px-8 py-16">
            <h2 className="font-inter text-[2rem] font-extrabold leading-[1.15] tracking-tight text-white sm:text-[2.5rem]">
              Start your streak today
            </h2>
            <p className="max-w-[520px] font-inter text-[17px] leading-relaxed text-[#A1A1AA]">
              Sign up with your preferred account and run your first verified session in under a minute.
            </p>
            <Link
              href="/signup"
              className="rounded-xl bg-[#6744FF] px-8 py-3.5 font-inter text-[16px] font-medium text-white transition-colors hover:bg-[#5a39f0]"
            >
              Get started
            </Link>
          </Reveal>
        </section>
      </main>
    </div>
  );
}
