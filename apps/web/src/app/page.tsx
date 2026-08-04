"use client";

import Link from "next/link";
import { motion } from "framer-motion";
import { ArrowRight, Ban, ChevronRight, HeartHandshake, ShieldCheck, Sparkles, type LucideIcon } from "lucide-react";
import { Hero } from "@/components/landing/Hero";

const FEATURES: { icon: LucideIcon; title: string; description: string }[] = [
  { icon: ShieldCheck, title: "Verified, not just timed", description: "Sessions are checked against real commits and local activity — a locked screen doesn't fake it, honest output does." },
  { icon: HeartHandshake, title: "Funds the code you depend on", description: "Every verified session builds a simulated impact ledger, split across the open-source dependencies your project actually uses." },
  { icon: Ban, title: "Blocks real distractions", description: "A browser extension blocks distracting sites mid-session; the desktop widget catches native apps the browser can't see." },
  { icon: Sparkles, title: "Built to feel good", description: "Streaks, XP, levels, and achievements — progress you can actually see, not just a number on a page." },
];

const STEPS = [
  { title: "Connect your accounts", description: "Sign in and optionally link a repo so sessions can be verified against real commits." },
  { title: "Start a session", description: "Pick a duration from the web app, browser toolbar, or desktop widget — they all stay in sync." },
  { title: "Get verified & level up", description: "Honest sessions extend your streak, earn XP, unlock achievements, and grow your impact ledger." },
];

const LOGOS = ["Cursor","VS Code","GitHub","Claude","Codex","Linear","Docker","Notion"];

const gradientStyle = {
  backgroundImage: "linear-gradient(to right, #091020 0%, #0B2551 12.5%, #A4F4FD 32.5%, #00d2ff 50%, #0B2551 67.5%, #091020 87.5%, #091020 100%)",
  backgroundSize: "200% auto",
  WebkitBackgroundClip: "text", backgroundClip: "text", color: "transparent", WebkitTextFillColor: "transparent",
  filter: "url(#c3-noise)",
};

export default function LandingPage() {
  return (
    <div className="relative min-h-screen overflow-x-hidden bg-[#0c0c0c] text-white">

      {/* Video background */}
      <div className="fixed inset-0 z-0 pointer-events-none">
        <video autoPlay loop muted playsInline preload="auto"
          className="w-full h-full object-cover pointer-events-none opacity-50"
          src="https://d8j0ntlcm91z4.cloudfront.net/user_38xzZboKViGWJOttwIXH07lWA1P/hf_20260508_064122_c4750c0e-7476-4b44-94a2-a85a65c63bf2.mp4" />
      </div>

      {/* Guide lines */}
      <div className="hidden md:block pointer-events-none fixed inset-y-0 left-1/2 -translate-x-[calc(50%+36rem)] w-px bg-white/10 z-[5]" />
      <div className="hidden md:block pointer-events-none fixed inset-y-0 left-1/2 translate-x-[calc(-50%+36rem)] w-px bg-white/10 z-[5]" />

      {/* Noise filter */}
      <svg className="hidden"><filter id="c3-noise"><feTurbulence type="fractalNoise" baseFrequency="0.9" numOctaves="2" stitchTiles="stitch" /><feColorMatrix type="matrix" values="0 0 0 0 0  0 0 0 0 0  0 0 0 0 0  0 0 0 0.35 0" /><feComposite in2="SourceGraphic" operator="in" result="noise" /><feBlend in="SourceGraphic" in2="noise" mode="multiply" /></filter></svg>

      <main className="flex flex-col">
        <Hero />

        {/* Features */}
        <section id="features" className="relative z-10 px-6 py-20 md:py-28">
          <div className="max-w-6xl mx-auto grid md:grid-cols-2 gap-10 md:gap-16 items-start">
            <motion.div initial={{ opacity:0,y:20 }} whileInView={{ opacity:1,y:0 }} viewport={{ once:true }} transition={{ duration:0.7 }}>
              <div className="flex items-center gap-3 mb-5"><span className="w-1.5 h-1.5 rounded-full bg-white" /><span className="text-white/70 text-sm font-medium">Verification</span><span className="px-2 py-0.5 rounded-full border border-white/10 text-white/50 text-xs">AI-powered</span></div>
              <h2 className="text-3xl md:text-5xl font-semibold tracking-tight leading-[1.02]">Proof, not<br />promises.</h2>
              <p className="mt-6 text-white/60 text-base leading-[1.6] max-w-md">Upstream cross-references your GitHub commits and local IDE activity against every session. A timer can be gamed — real work can't.</p>
              <div className="flex flex-wrap gap-2 mt-5">
                {["GitHub commits","IDE activity","Desktop tracking","Browser extension"].map(c => (
                  <span key={c} className="text-xs text-white/70 px-3 py-1.5 rounded-full border border-white/10 bg-white/[0.03]">{c}</span>
                ))}
              </div>
            </motion.div>
            <motion.div initial={{ opacity:0,y:20 }} whileInView={{ opacity:1,y:0 }} viewport={{ once:true }} transition={{ duration:0.7, delay:0.15 }}
              className="liquid-glass rounded-2xl p-5">
              <div className="text-xs text-white/50 mb-3">Today · 4 sessions tracked</div>
              {[{label:"Verified",count:3,color:"#00d2ff"},{label:"In progress",count:1,color:"#f59e0b"},{label:"Broken",count:0,color:"#ef4444"},{label:"Planned",count:2,color:"#a3a3a3"}].map(r => (
                <div key={r.label} className="liquid-glass rounded-lg p-3 flex items-center justify-between mb-2">
                  <div className="flex items-center gap-2"><span className="w-2 h-2 rounded-full" style={{background:r.color}} /><span className="text-sm text-white/80">{r.label}</span></div>
                  <span className="text-sm font-semibold text-white">{r.count}</span>
                </div>
              ))}
            </motion.div>
          </div>
        </section>

        {/* How it works */}
        <section id="how-it-works" className="relative z-10 px-6 pb-20">
          <div className="max-w-6xl mx-auto flex flex-col gap-10">
            <motion.h2 initial={{ opacity:0,y:15 }} whileInView={{ opacity:1,y:0 }} viewport={{ once:true }} transition={{ duration:0.6 }}
              className="font-inter text-[2rem] font-extrabold leading-[1.15] tracking-tight text-white sm:text-[2.75rem]">How it works</motion.h2>
            <div className="grid grid-cols-1 gap-6 md:grid-cols-3">
              {STEPS.map((step,i) => (
                <motion.div key={step.title} initial={{ opacity:0,y:15 }} whileInView={{ opacity:1,y:0 }} viewport={{ once:true }} transition={{ duration:0.6, delay:i*0.08 }}
                  className="liquid-glass rounded-2xl flex flex-col gap-3 p-7">
                  <div className="flex h-9 w-9 items-center justify-center rounded-full bg-[#3B82F6] font-inter text-sm font-semibold text-white">{i+1}</div>
                  <h3 className="font-inter text-lg font-semibold text-white">{step.title}</h3>
                  <p className="font-inter text-[15px] leading-relaxed text-[#A1A1AA]">{step.description}</p>
                </motion.div>
              ))}
            </div>
          </div>
        </section>

        {/* Logos */}
        <section className="relative z-10 max-w-6xl mx-auto px-6 py-16 text-center border-t border-white/10">
          <p className="text-xs uppercase tracking-widest text-white/40 mb-10">Built for developers who ship</p>
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-6">
            {LOGOS.map((name,i) => (
              <motion.div key={name} initial={{ opacity:0 }} whileInView={{ opacity:1 }} viewport={{ once:true }} transition={{ delay:i*0.05 }}
                className="text-sm font-semibold tracking-tight text-white/50 hover:text-white transition-colors cursor-default">{name}</motion.div>
            ))}
          </div>
        </section>

        {/* Final CTA */}
        <section className="relative z-10 max-w-6xl mx-auto px-6 py-20 md:py-32">
          <motion.div initial={{ opacity:0,y:30 }} whileInView={{ opacity:1,y:0 }} viewport={{ once:true }} transition={{ duration:0.8 }}
            className="liquid-glass relative overflow-hidden rounded-3xl px-8 py-16 md:py-24 text-center">
            <div className="absolute inset-0 pointer-events-none opacity-30" style={{background:"radial-gradient(600px circle at 50% 0%, rgba(255,255,255,0.15), transparent 70%)"}} />
            <h2 className="relative text-4xl md:text-6xl font-semibold tracking-tight leading-[1.02]">Ready to prove<br />your best work?</h2>
            <p className="relative mt-6 text-white/60 max-w-md mx-auto text-sm leading-[1.6]">Join thousands of developers who track, verify, and ship with intention. Start your first verified session in under a minute.</p>
            <div className="relative mt-8 flex flex-col sm:flex-row items-center justify-center gap-4">
              <Link href="/signup" className="group inline-flex items-center gap-2 rounded-full bg-white text-black font-medium text-sm px-5 py-3 transition-all hover:bg-white/90 active:scale-[0.98]">Start tracking free<ChevronRight size={14} className="group-hover:translate-x-0.5 transition-transform" /></Link>
            </div>
          </motion.div>
        </section>

        {/* Footer */}
        <footer className="relative z-10 border-t border-white/10 px-6 py-10">
          <div className="max-w-6xl mx-auto flex items-center justify-between">
            <div className="flex items-center gap-2.5"><span className="text-sm font-semibold text-white/40">Upstream</span></div>
            <div className="flex items-center gap-6 text-xs text-white/40">
              <Link href="/privacy" className="hover:text-white/70">Privacy</Link>
              <a href="https://github.com/DanisChaparov/upstream-app" className="hover:text-white/70">GitHub</a>
            </div>
          </div>
        </footer>
      </main>
    </div>
  );
}
