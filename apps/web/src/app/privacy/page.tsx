import Link from "next/link";
import { Shield, Lock, Eye, Github, Server, Cpu } from "lucide-react";

export const metadata = { title: "Privacy — Upstream", description: "How Upstream handles your data — transparent, local-first, and under your control." };

const SECTIONS = [
  {
    icon: Cpu,
    title: "Your data stays on your machine",
    body: "Upstream's desktop app processes all activity data locally. App names, window titles, and focus time are computed on your device. Nothing is uploaded until it's anonymized and aggregated into hourly buckets.",
  },
  {
    icon: Eye,
    title: "We never see your screen",
    body: "Upstream does not take screenshots, record keystrokes, or capture any content from your windows. We only record which app you're using (e.g. 'VS Code') and whether you're focused — not what's inside it.",
  },
  {
    icon: Server,
    title: "What we store in the cloud",
    body: "Your Supabase database stores: your email (from sign-in), your project names, session durations, verified/unverified status, distraction domains you've blocked, and hourly-bucketed app usage summaries. That's it. No raw window titles, no file contents, no code.",
  },
  {
    icon: Github,
    title: "Open source, verifiable",
    body: "The entire Upstream codebase is open source at github.com/DanisChaparov/upstream-app. You can audit exactly what the desktop app monitors, what data it sends, and how the backend processes it. No black boxes. No hidden telemetry.",
  },
  {
    icon: Lock,
    title: "Row-Level Security on all data",
    body: "Every database table is protected by Supabase RLS policies. User A cannot read User B's data — not even accidentally. The only exception is the public Developer Twin, which is an explicit opt-in setting you control.",
  },
  {
    icon: Shield,
    title: "You can delete everything",
    body: "Delete your account at any time from Settings. All your sessions, projects, and profile data are permanently removed from the database. The desktop app stores nothing — it's a thin client.",
  },
];

export default function PrivacyPage() {
  return (
    <main className="min-h-screen bg-[#0c0c0c] text-white px-6 py-20">
      <div className="max-w-3xl mx-auto flex flex-col gap-12">
        <div className="flex flex-col gap-3">
          <h1 className="font-inter text-3xl font-extrabold tracking-tight text-white sm:text-4xl">Privacy</h1>
          <p className="font-inter text-[17px] leading-relaxed text-[#A1A1AA] max-w-xl">
            Upstream is a focus tracker, not a surveillance tool. Here's exactly what we collect, what we don't, and why you can trust us.
          </p>
        </div>

        <div className="grid gap-5">
          {SECTIONS.map((s) => (
            <div key={s.title} className="rounded-2xl border border-white/[0.06] bg-white/[0.02] p-6">
              <div className="flex items-start gap-4">
                <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-[#3B82F6]/10">
                  <s.icon size={18} className="text-[#3B82F6]" />
                </div>
                <div>
                  <h2 className="font-inter text-lg font-semibold text-white">{s.title}</h2>
                  <p className="mt-2 font-inter text-[15px] leading-relaxed text-[#A1A1AA]">{s.body}</p>
                </div>
              </div>
            </div>
          ))}
        </div>

        <div className="rounded-2xl border border-white/[0.06] bg-white/[0.02] p-6 text-center">
          <p className="font-inter text-sm text-[#A1A1AA]">
            Questions?{" "}
            <a href="https://github.com/DanisChaparov/upstream-app" className="text-[#3B82F6] underline">Open an issue on GitHub</a>.
          </p>
        </div>
      </div>
    </main>
  );
}
