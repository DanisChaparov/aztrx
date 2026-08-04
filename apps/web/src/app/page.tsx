"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { motion } from "framer-motion";
import { ArrowRight, Check, ChevronRight, Github, Menu, Moon, Search, Sparkles, Sun, X, Zap, Shield, TrendingUp, Blocks, Star, Clock, Bell } from "lucide-react";

/* ── globals ─────────────────────────────────────────────── */
const VIDEO_URL = "https://d8j0ntlcm91z4.cloudfront.net/user_38xzZboKViGWJOttwIXH07lWA1P/hf_20260508_064122_c4750c0e-7476-4b44-94a2-a85a65c63bf2.mp4";

const NAV = ["Features", "How it works", "Pricing", "Developers"];

const gradientStyle = {
  backgroundImage: "linear-gradient(to right, #091020 0%, #0B2551 12.5%, #A4F4FD 32.5%, #00d2ff 50%, #0B2551 67.5%, #091020 87.5%, #091020 100%)",
  backgroundSize: "200% auto",
  WebkitBackgroundClip: "text",
  backgroundClip: "text",
  color: "transparent",
  WebkitTextFillColor: "transparent",
  filter: "url(#c3-noise)",
};

/* ── primitives ──────────────────────────────────────────── */
function LogoMark({ className = "w-8 h-8" }: { className?: string }) {
  return (
    <svg viewBox="0 0 256 256" className={className} fill="white">
      <path d="M 0 128 C 70.692 128 128 185.308 128 256 L 64 256 C 64 220.654 35.346 192 0 192 Z M 256 192 C 220.654 192 192 220.654 192 256 L 128 256 C 128 185.308 185.308 128 256 128 Z M 128 0 C 128 70.692 70.692 128 0 128 L 0 64 C 35.346 64 64 35.346 64 0 Z M 192 0 C 192 35.346 220.654 64 256 64 L 256 128 C 185.308 128 128 70.692 128 0 Z" />
    </svg>
  );
}

function SectionEyebrow({ label, tag }: { label: string; tag?: string }) {
  return (
    <div className="flex items-center gap-3">
      <span className="w-1.5 h-1.5 rounded-full bg-white" />
      <span className="text-white/70 text-sm font-medium">{label}</span>
      {tag && <span className="px-2 py-0.5 rounded-full border border-white/10 text-white/50 text-xs">{tag}</span>}
    </div>
  );
}

function PillButton({ children, href, white = false }: { children: React.ReactNode; href: string; white?: boolean }) {
  return (
    <Link
      href={href}
      className={`group inline-flex items-center justify-center gap-2 rounded-full font-medium text-sm px-5 py-3 transition-all active:scale-[0.98] ${
        white
          ? "bg-white text-black hover:bg-white/90"
          : "border border-white/15 text-white hover:bg-white/5"
      }`}
    >
      {children}
      {white && <ChevronRight size={16} className="group-hover:translate-x-0.5 transition-transform" />}
    </Link>
  );
}

function Toggle({ on }: { on: boolean }) {
  return (
    <span className={`c3-toggle${on ? " active" : ""}`}>
      <span className="c3-toggle-knob" />
    </span>
  );
}

/* ── main page ───────────────────────────────────────────── */
export default function LandingPage() {
  const [scrolled, setScrolled] = useState(false);
  const [mobileOpen, setMobileOpen] = useState(false);
  const [yearly, setYearly] = useState(false);

  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 20);
    window.addEventListener("scroll", onScroll, { passive: true });
    return () => window.removeEventListener("scroll", onScroll);
  }, []);

  return (
    <div className="relative min-h-screen overflow-x-hidden bg-[#0c0c0c] text-white">
      {/* ── video ──────────────────────────────────────── */}
      <div className="fixed inset-0 z-0 pointer-events-none">
        <video autoPlay loop muted playsInline className="w-full h-full object-cover pointer-events-none" src={VIDEO_URL} />
      </div>

      {/* ── noise + guide lines ────────────────────────── */}
      <svg className="fixed inset-0 z-40 pointer-events-none" width="100%" height="100%">
        <filter id="c3-noise">
          <feTurbulence type="fractalNoise" baseFrequency="0.9" numOctaves="2" stitchTiles="stitch" />
          <feColorMatrix type="matrix" values="0 0 0 0 0  0 0 0 0 0  0 0 0 0 0  0 0 0 0.35 0" />
          <feComposite in2="SourceGraphic" operator="in" result="noise" />
          <feBlend in="SourceGraphic" in2="noise" mode="multiply" />
        </filter>
      </svg>
      <div className="hidden md:block pointer-events-none fixed inset-y-0 left-1/2 -translate-x-[calc(50%+36rem)] w-px bg-white/10 z-[5]" />
      <div className="hidden md:block pointer-events-none fixed inset-y-0 left-1/2 translate-x-[calc(-50%+36rem)] w-px bg-white/10 z-[5]" />

      {/* ── nav ────────────────────────────────────────── */}
      <motion.header
        initial={{ opacity: 0, y: -10 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.6, ease: "easeOut" }}
        className={`fixed inset-x-0 top-0 z-50 transition-all duration-300 ${
          scrolled ? "border-b border-white/10 bg-black/60 backdrop-blur-xl" : ""
        }`}
      >
        <div className="max-w-6xl mx-auto px-6 flex items-center justify-between h-16">
          <Link href="/" className="flex items-center gap-2.5">
            <LogoMark className="w-7 h-7" />
          </Link>
          <nav className="hidden md:flex items-center gap-8">
            {NAV.map((label, i) => (
              <motion.a
                key={label}
                href={`#${label.toLowerCase().replace(/ /g, "-")}`}
                initial={{ opacity: 0, y: -8 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.1 + i * 0.05 }}
                className="text-white/70 text-sm font-medium hover:text-white transition-colors"
              >
                {label}
              </motion.a>
            ))}
          </nav>
          <div className="hidden md:flex items-center gap-3">
            <Link href="/login" className="text-white/70 text-sm hover:text-white transition-colors">Sign in</Link>
            <Link href="/signup" className="group inline-flex items-center gap-2 rounded-full bg-white text-black font-medium text-sm px-5 py-2.5 transition-all hover:bg-white/90 active:scale-[0.98]">
              Get started <ChevronRight size={14} className="group-hover:translate-x-0.5 transition-transform" />
            </Link>
          </div>
          <button onClick={() => setMobileOpen(true)} className="md:hidden w-10 h-10 rounded-full border border-white/10 bg-white/5 flex items-center justify-center">
            <Menu size={18} />
          </button>
        </div>
      </motion.header>

      {/* ── hero ────────────────────────────────────────── */}
      <section className="relative z-10 pt-16 md:pt-28 pb-20 text-center flex flex-col items-center px-6">
        <motion.h1
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.3, duration: 0.8, ease: [0.22, 1, 0.36, 1] }}
          className="text-4xl md:text-7xl font-semibold tracking-tight leading-[0.9]"
        >
          <span className="text-white">Prove your focus</span>
          <br />
          <span className="animate-shiny" style={gradientStyle}>is real</span>
        </motion.h1>

        <motion.p
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.5 }}
          className="mt-8 text-white/60 max-w-md text-base leading-[1.5]"
        >
          Upstream verifies every session against real commits and local activity.
          Block distractions, build streaks, and fund open source — all while you ship.
        </motion.p>

        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.7 }}
          className="mt-8 flex flex-col sm:flex-row items-center gap-3"
        >
          <PillButton href="/signup" white>Start tracking free</PillButton>
          <PillButton href="#features">See how it works <ChevronRight size={14} /></PillButton>
        </motion.div>
      </section>

      {/* ── mac menu bar ────────────────────────────────── */}
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ delay: 0.9 }}
        className="relative z-10 h-10 bg-black/40 backdrop-blur-md border-t border-b border-white/10 flex items-center"
      >
        <div className="max-w-6xl mx-auto px-6 w-full flex items-center justify-between text-xs">
          <div className="flex items-center gap-4">
            <svg viewBox="0 0 384 512" className="w-3 h-3" fill="currentColor"><path d="M318.7 268.7c-.2-36.7 16.4-64.4 50-84.8-18.8-26.9-47.2-41.7-84.7-44.6-35.5-2.8-74.3 20.7-88.5 20.7-15 0-49.4-19.7-76.4-19.7C63.3 141.2 4 184.8 4 273.5q0 39.3 14.4 81.2c12.8 36.7 59 126.7 107.2 125.2 25.2-.6 43-17.9 75.8-17.9 31.8 0 48.3 17.9 76.4 17.9 48.6-.7 90.4-82.5 102.6-119.3-65.2-30.7-61.7-90-61.7-91.9zm-56.6-164.2c27.3-32.4 24.8-61.9 24-72.5-24.1 1.4-52 16.4-67.9 34.9-17.5 19.8-27.8 44.3-25.6 71.9 26.1 2 49.9-11.4 69.5-34.3z"/></svg>
            <span className="font-bold text-white">Upstream</span>
            {["File","Edit","View","Session","Tools","Help"].map((m, i) => (
              <span key={m} className={`text-white/60 ${i > 2 ? "hidden sm:inline" : ""} ${i > 3 ? "hidden md:inline" : ""}`}>{m}</span>
            ))}
          </div>
          <div className="flex items-center gap-3 text-white/60">
            <Search size={14} />
            <span>Mon Aug 4 2:09 PM</span>
          </div>
        </div>
      </motion.div>

      {/* ── dashboard mockup ────────────────────────────── */}
      <motion.div
        initial={{ opacity: 0, y: 40 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 1.1, duration: 0.8, ease: [0.22, 1, 0.36, 1] }}
        className="relative z-10 max-w-6xl mx-auto px-6 py-16 md:py-24"
      >
        <div className="relative rounded-2xl overflow-hidden border border-white/10 bg-[#0e1014]/90 backdrop-blur-2xl">
          {/* title bar */}
          <div className="flex items-center gap-2.5 px-4 py-3 border-b border-white/5 bg-black/30">
            <span className="w-3 h-3 rounded-full bg-[#ff5f57]" />
            <span className="w-3 h-3 rounded-full bg-[#febc2e]" />
            <span className="w-3 h-3 rounded-full bg-[#28c840]" />
            <span className="ml-3 text-xs text-white/50">Upstream — Dashboard</span>
          </div>
          {/* content */}
          <div className="grid grid-cols-12 h-[480px]">
            {/* sidebar */}
            <div className="col-span-3 border-r border-white/5 bg-black/20 p-4 flex flex-col gap-3">
              <button className="flex items-center gap-2 rounded-lg bg-white text-black text-xs font-semibold px-3 py-2">
                <Sparkles size={13} /> Start a session
              </button>
              {[
                { label: "Dashboard", count: null, active: true },
                { label: "Projects", count: 3, active: false },
                { label: "Focus", count: null, active: false },
                { label: "Screen Time", count: null, active: false },
                { label: "Profile", count: null, active: false },
                { label: "Settings", count: null, active: false },
              ].map((item) => (
                <div key={item.label} className={`flex items-center justify-between px-2 py-1.5 rounded-md text-xs cursor-pointer ${item.active ? "bg-white/10 text-white" : "text-white/60 hover:bg-white/5"}`}>
                  <span>{item.label}</span>
                  {item.count && <span className="text-white/40">{item.count}</span>}
                </div>
              ))}
            </div>
            {/* main */}
            <div className="col-span-6 border-r border-white/5 p-5">
              <div className="flex items-center justify-between mb-5">
                <h3 className="font-semibold text-sm text-white">Today's overview</h3>
                <span className="text-xs text-white/40">Mon, Aug 4</span>
              </div>
              {/* stat cards */}
              <div className="grid grid-cols-2 gap-3 mb-5">
                {[
                  { label: "Streak", value: "7 days", icon: Star },
                  { label: "Level", value: "12", icon: TrendingUp },
                  { label: "Today", value: "2.5 hrs", icon: Clock },
                  { label: "Verified", value: "100%", icon: Shield },
                ].map((stat) => (
                  <div key={stat.label} className="liquid-glass rounded-xl p-3">
                    <div className="flex items-center gap-2 text-white/50 text-xs mb-1"><stat.icon size={12} />{stat.label}</div>
                    <div className="text-lg font-bold text-white">{stat.value}</div>
                  </div>
                ))}
              </div>
              {/* activity */}
              <div className="liquid-glass rounded-xl p-4">
                <div className="flex items-center gap-2 mb-3"><Bell size={13} className="text-white/50" /><span className="text-xs font-medium text-white/70">Recent activity</span></div>
                {[
                  "Session verified — 50 min · 2:30 PM",
                  "GitHub commit pushed · 2:15 PM",
                  "Focus session started · 1:40 PM",
                  "Streak extended to 7 days · 12:00 AM",
                ].map((item, i) => (
                  <div key={i} className={`py-2 ${i < 3 ? "border-b border-white/5" : ""} text-xs text-white/50`}>{item}</div>
                ))}
              </div>
            </div>
            {/* right panel */}
            <div className="col-span-3 p-4">
              <div className="liquid-glass rounded-xl p-4 mb-3">
                <div className="flex items-center gap-2 mb-2"><Zap size={13} className="text-[#A4F4FD]" /><span className="text-xs font-medium text-white">AI Insights</span></div>
                <p className="text-xs text-white/50 leading-relaxed">Your peak focus hours are 9 AM–11 AM. Morning sessions are 40% more productive than afternoon ones.</p>
              </div>
              <div className="liquid-glass rounded-xl p-4">
                <div className="flex items-center gap-2 mb-2"><Blocks size={13} className="text-emerald-400" /><span className="text-xs font-medium text-white">OSS Impact</span></div>
                <div className="text-lg font-bold text-white mb-1">$12.40</div>
                <p className="text-xs text-white/50">Simulated funding generated this week</p>
              </div>
            </div>
          </div>
        </div>
      </motion.div>

      {/* ── features ─────────────────────────────────────── */}
      <section id="features" className="relative z-10 max-w-6xl mx-auto px-6 py-20 md:py-28">
        <div className="grid md:grid-cols-2 gap-10 md:gap-16 items-start">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true, margin: "-80px" }}
            transition={{ duration: 0.7 }}
          >
            <SectionEyebrow label="Verification" tag="AI-powered" />
            <h2 className="mt-5 text-3xl md:text-5xl font-semibold tracking-tight leading-[1.02]">
              Proof, not<br />promises.
            </h2>
            <p className="mt-6 text-white/60 text-base leading-[1.6] max-w-md">
              Upstream cross-references your GitHub commits and local IDE activity against every session.
              A timer can be gamed — real work can't. When you finish a session, it's verified or it's not.
            </p>
            <div className="flex flex-wrap gap-2 mt-5">
              {["GitHub commits", "IDE activity", "Desktop tracking", "Browser extension"].map((chip) => (
                <span key={chip} className="text-xs text-white/70 px-3 py-1.5 rounded-full border border-white/10 bg-white/[0.03]">{chip}</span>
              ))}
            </div>
          </motion.div>
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true, margin: "-80px" }}
            transition={{ duration: 0.7, delay: 0.15 }}
            className="liquid-glass rounded-2xl p-5"
          >
            <div className="text-xs text-white/50 mb-3">Today · 4 sessions tracked</div>
            {[
              { label: "Verified", count: 3, color: "#00d2ff" },
              { label: "In progress", count: 1, color: "#f59e0b" },
              { label: "Broken", count: 0, color: "#ef4444" },
              { label: "Planned", count: 2, color: "#a3a3a3" },
            ].map((row) => (
              <div key={row.label} className="liquid-glass rounded-lg p-3 flex items-center justify-between mb-2">
                <div className="flex items-center gap-2">
                  <span className="w-2 h-2 rounded-full" style={{ background: row.color }} />
                  <span className="text-sm text-white/80">{row.label}</span>
                </div>
                <span className="text-sm font-semibold text-white">{row.count}</span>
              </div>
            ))}
          </motion.div>
        </div>
      </section>

      {/* ── logos ────────────────────────────────────────── */}
      <section className="relative z-10 max-w-6xl mx-auto px-6 py-16 md:py-20 text-center">
        <p className="text-xs uppercase tracking-widest text-white/40 mb-10">Built for developers who ship</p>
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-6">
          {["Cursor","VS Code","GitHub","Claude","Supabase","Vercel","Docker","Notion"].map((name, i) => (
            <motion.div
              key={name}
              initial={{ opacity: 0 }}
              whileInView={{ opacity: 1 }}
              viewport={{ once: true }}
              transition={{ delay: i * 0.05 }}
              className="text-sm font-semibold tracking-tight text-white/50 hover:text-white transition-colors cursor-default"
            >
              {name}
            </motion.div>
          ))}
        </div>
      </section>

      {/* ── testimonials ─────────────────────────────────── */}
      <section className="relative z-10 max-w-6xl mx-auto px-6 py-20 md:py-28 border-t border-white/10">
        <div className="grid md:grid-cols-3 gap-6">
          {[
            { quote: "Upstream changed how I think about focus. Knowing my sessions are verified against real commits makes every minute count.", name: "Sarah Chen", role: "Senior Engineer", company: "VERCEL" },
            { quote: "The streak system is addictive in the best way. I've shipped more in the last month than the previous three combined.", name: "Marcus Webb", role: "Founder", company: "INDIE" },
            { quote: "Finally a focus app that understands developers. The GitHub integration means I don't have to manually log anything.", name: "David Lim", role: "Tech Lead", company: "STRIPE" },
          ].map((t, i) => (
            <motion.figure
              key={i}
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ delay: i * 0.1, duration: 0.6 }}
              className="liquid-glass rounded-2xl p-6"
            >
              <blockquote className="text-sm text-white/80 leading-[1.6]">"{t.quote}"</blockquote>
              <figcaption className="mt-6 pt-5 border-t border-white/10">
                <div className="text-sm font-semibold">{t.name}</div>
                <div className="text-xs text-white/50">{t.role}</div>
                <div className="text-xs text-white font-semibold tracking-wide mt-1">{t.company}</div>
              </figcaption>
            </motion.figure>
          ))}
        </div>
      </section>

      {/* ── pricing ──────────────────────────────────────── */}
      <section className="c3-pricing-section relative z-10">
        <svg width="0" height="0" className="absolute">
          <filter id="c3-noise-pricing">
            <feTurbulence type="fractalNoise" baseFrequency="0.5" numOctaves="2" stitchTiles="stitch" />
            <feComponentTransfer><feFuncA type="linear" slope="0.075" /></feComponentTransfer>
            <feComposite in2="SourceGraphic" operator="in" result="noise" />
            <feBlend in="SourceGraphic" in2="noise" mode="overlay" />
          </filter>
        </svg>

        <div className="c3-watermark-container">
          <div className="c3-watermark-main">
            <span className="c3-watermark-line-1">Choose your</span>
            <span className="c3-watermark-line-2">flow</span>
          </div>
        </div>

        <div className="c3-toggle-wrap">
          <span className="text-sm text-white/60">Monthly</span>
          <button onClick={() => setYearly(!yearly)} className={`c3-toggle${yearly ? " active" : ""}`}>
            <span className="c3-toggle-knob" />
          </button>
          <span className="text-sm text-white/60">Yearly</span>
        </div>

        <div className="c3-grid">
          {/* Free */}
          <div className="c3-card">
            <div className="c3-tier-small">Free</div>
            <div className="c3-tier-large">$0</div>
            <div className="c3-desc">Start tracking and verifying your focus sessions. No credit card required.</div>
            <ul className="c3-list">
              {["Up to 3 projects","Session verification","Basic streak tracking","Browser extension","Web dashboard"].map((f) => (
                <li key={f}><span className="c3-check"><svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="3"><path d="M20 6L9 17l-5-5"/></svg></span>{f}</li>
              ))}
            </ul>
            <Link href="/signup" className="c3-btn">Get started</Link>
          </div>
          {/* Pro */}
          <div className="c3-card c3-card-pro">
            <div className="c3-tier-small">Pro</div>
            <div className="c3-tier-large">{yearly ? "$4" : "$8"}<span className="text-lg text-white/40">/mo</span></div>
            <div className="c3-desc">Everything you need to ship consistently and prove your output.</div>
            <ul className="c3-list">
              {["Unlimited projects","AI developer twin","Desktop app + system tray","Advanced analytics","Priority support","Impact ledger & OSS funding"].map((f) => (
                <li key={f}><span className="c3-check"><svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="3"><path d="M20 6L9 17l-5-5"/></svg></span>{f}</li>
              ))}
            </ul>
            <Link href="/signup" className="c3-btn">Start Pro trial</Link>
          </div>
          {/* Team */}
          <div className="c3-card">
            <div className="c3-tier-small">Team</div>
            <div className="c3-tier-large">{yearly ? "$6" : "$12"}<span className="text-lg text-white/40">/seat</span></div>
            <div className="c3-desc">For engineering teams that want visibility into collective output.</div>
            <ul className="c3-list">
              {["Everything in Pro","Team dashboard","Shared projects","Manager reports","SSO & SAML","Dedicated support"].map((f) => (
                <li key={f}><span className="c3-check"><svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="3"><path d="M20 6L9 17l-5-5"/></svg></span>{f}</li>
              ))}
            </ul>
            <Link href="/signup" className="c3-btn">Contact us</Link>
          </div>
        </div>
      </section>

      {/* ── final CTA ────────────────────────────────────── */}
      <section className="relative z-10 max-w-6xl mx-auto px-6 py-20 md:py-32">
        <motion.div
          initial={{ opacity: 0, y: 30 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.8 }}
          className="liquid-glass relative overflow-hidden rounded-3xl px-8 py-16 md:py-24 text-center"
        >
          <div className="absolute inset-0 pointer-events-none opacity-30" style={{ background: "radial-gradient(600px circle at 50% 0%, rgba(255,255,255,0.15), transparent 70%)" }} />
          <h2 className="relative text-4xl md:text-6xl font-semibold tracking-tight leading-[1.02]">
            Ready to prove<br />your best work?
          </h2>
          <p className="relative mt-6 text-white/60 max-w-md mx-auto text-sm leading-[1.6]">
            Join thousands of developers who track, verify, and ship with intention. Start your first verified session in under a minute.
          </p>
          <div className="relative mt-8 flex flex-col sm:flex-row items-center justify-center gap-4">
            <PillButton href="/signup" white>Start tracking free</PillButton>
            <a href="#features" className="rounded-full border border-white/15 text-white text-sm font-medium px-5 py-3 hover:bg-white/5 transition-colors inline-flex items-center gap-2">
              See features <ChevronRight size={14} />
            </a>
          </div>
        </motion.div>
      </section>

      {/* ── footer ───────────────────────────────────────── */}
      <footer className="relative z-10 border-t border-white/10 px-6 py-10">
        <div className="max-w-6xl mx-auto flex items-center justify-between">
          <div className="flex items-center gap-2.5">
            <LogoMark className="w-5 h-5 opacity-50" />
            <span className="text-sm font-semibold text-white/40">Upstream</span>
          </div>
          <div className="flex items-center gap-6 text-xs text-white/40">
            <a href="#" className="hover:text-white/70">Privacy</a>
            <a href="#" className="hover:text-white/70">Terms</a>
            <a href="https://github.com/DanisChaparov/upstream-app" className="hover:text-white/70">GitHub</a>
          </div>
        </div>
      </footer>
    </div>
  );
}
