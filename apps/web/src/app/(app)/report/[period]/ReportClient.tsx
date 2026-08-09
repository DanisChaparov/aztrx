"use client";

import { useState } from "react";
import Link from "next/link";
import { useRouter, usePathname } from "next/navigation";
import { motion } from "framer-motion";
import { Share2, Check } from "lucide-react";
import type { DeveloperReport } from "@focus-forge/core";

const XIcon = (props: React.SVGProps<SVGSVGElement>) => (
  <svg viewBox="0 0 24 24" fill="currentColor" {...props}>
    <path d="M18.244 2.25h3.308l-7.227 8.26 8.502 11.24H16.17l-5.214-6.817L4.99 21.75H1.68l7.73-8.835L1.254 2.25H8.08l4.713 6.231zm-1.161 17.52h1.833L7.084 4.126H5.117z" />
  </svg>
);

const stagger = {
  animate: { transition: { staggerChildren: 0.08 } },
};

const fadeUp = {
  initial: { opacity: 0, y: 16 },
  animate: { opacity: 1, y: 0, transition: { duration: 0.45, ease: "easeOut" } },
};

const PERIODS = [
  { key: "weekly", label: "Week" },
  { key: "monthly", label: "Month" },
  { key: "yearly", label: "Year" },
] as const;

export function ReportClient({ report, maxMinutes }: { report: DeveloperReport; maxMinutes: number }) {
  const [copied, setCopied] = useState(false);
  const router = useRouter();
  const pathname = usePathname();

  function goToPeriod(period: string) {
    router.push(`/report/${period}`);
  }

  function handleShare() {
    const url = window.location.href;
    navigator.clipboard.writeText(url).then(() => {
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    }).catch(() => {});
  }

  function handleShareX() {
    const text = `My ${report.period.label.toLowerCase()} developer report on @UpstreamApp: ${report.headline}`;
    const url = window.location.href;
    window.open(
      `https://twitter.com/intent/tweet?text=${encodeURIComponent(text)}&url=${encodeURIComponent(url)}`,
      "_blank"
    );
  }

  const currentPeriod = pathname.split("/").pop() || "weekly";

  return (
    <main className="min-h-screen bg-[#0b0c10] px-6 py-16">
      <div className="mx-auto flex max-w-2xl flex-col gap-12">
        {/* Period selector */}
        <div className="flex justify-center">
          <div className="inline-flex rounded-full border border-white/10 bg-[#0e0f14] p-1">
            {PERIODS.map((p) => (
              <button
                key={p.key}
                type="button"
                onClick={() => goToPeriod(p.key)}
                className={`rounded-full px-5 py-1.5 font-manrope text-sm font-medium transition-all ${
                  currentPeriod === p.key
                    ? "bg-[#3B82F6] text-white shadow-sm"
                    : "text-neutral-400 hover:text-white"
                }`}
              >
                {p.label}
              </button>
            ))}
          </div>
        </div>

        {/* Header */}
        <motion.div
          className="flex flex-col items-center gap-4 text-center"
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5 }}
        >
          <motion.div
            className="rounded-full bg-[#3B82F6]/10 px-4 py-1.5"
            initial={{ scale: 0.9, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            transition={{ delay: 0.1, duration: 0.4 }}
          >
            <span className="font-manrope text-[11px] font-semibold uppercase tracking-widest text-[#60A5FA]">
              {report.period.label}
            </span>
          </motion.div>
          <motion.h1
            className="font-instrument-serif text-5xl font-bold tracking-tight text-white sm:text-6xl"
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.2, duration: 0.5 }}
          >
            {report.headline}
          </motion.h1>

          {/* Developer type card */}
          <motion.div
            className="rounded-2xl border border-[#3B82F6]/20 bg-[#3B82F6]/[0.04] px-6 py-4"
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ delay: 0.35, duration: 0.4 }}
          >
            <p className="font-manrope text-sm font-semibold text-[#60A5FA]">{report.developerType.name}</p>
            <p className="mt-1 font-inter text-sm leading-relaxed text-[#A1A1AA]">
              {report.developerType.description}
            </p>
          </motion.div>
        </motion.div>

        {/* Stats grid */}
        <motion.div
          className="grid grid-cols-2 gap-4 sm:grid-cols-4"
          variants={stagger}
          initial="initial"
          animate="animate"
        >
          {report.stats.slice(0, 4).map((stat) => (
            <motion.div
              key={stat.label}
              variants={fadeUp}
              className="flex flex-col items-center gap-1 rounded-2xl border border-white/10 bg-[#0e0f14] p-5 text-center"
              whileHover={{ y: -2, borderColor: "rgba(59,130,246,0.3)" }}
              transition={{ duration: 0.2 }}
            >
              <span className="font-manrope text-3xl font-bold text-white">{stat.value}</span>
              <span className="font-inter text-xs text-[#A1A1AA]">{stat.label}</span>
              {stat.comparison && (
                <span className="font-mono text-[11px] text-[#60A5FA]">{stat.comparison}</span>
              )}
            </motion.div>
          ))}
        </motion.div>

        {/* Highlights */}
        {report.highlights.length > 0 && (
          <motion.div
            className="flex flex-col gap-3 rounded-2xl border border-white/10 bg-[#0e0f14] p-6"
            initial={{ opacity: 0, y: 16 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.4, duration: 0.4 }}
          >
            <h2 className="font-manrope text-sm font-medium text-neutral-400">Highlights</h2>
            <ul className="flex flex-col gap-2">
              {report.highlights.map((h, i) => (
                <motion.li
                  key={h}
                  className="flex items-center gap-2.5 font-inter text-sm text-white"
                  initial={{ opacity: 0, x: -8 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ delay: 0.5 + i * 0.08, duration: 0.3 }}
                >
                  <span className="text-[#60A5FA]">✦</span> {h}
                </motion.li>
              ))}
            </ul>
          </motion.div>
        )}

        {/* Year progress bars */}
        {report.yearProgress && (
          <motion.div
            className="flex flex-col gap-3 rounded-2xl border border-white/10 bg-[#0e0f14] p-6"
            initial={{ opacity: 0, y: 16 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.5, duration: 0.4 }}
          >
            <h2 className="font-manrope text-sm font-medium text-neutral-400">Month by month</h2>
            <div className="flex items-end gap-1.5" style={{ height: 120 }}>
              {report.yearProgress.map((bar, i) => (
                <div key={bar.month} className="flex flex-1 flex-col items-center gap-1.5">
                  <div className="flex w-full flex-col justify-end" style={{ height: 100 }}>
                    <motion.div
                      className="w-full rounded-t-sm bg-[#3B82F6]/60 hover:bg-[#3B82F6] transition-colors"
                      initial={{ height: 0 }}
                      animate={{ height: `${Math.max(2, (bar.minutes / maxMinutes) * 100)}%` }}
                      transition={{ delay: 0.6 + i * 0.03, duration: 0.4, ease: "easeOut" }}
                      title={`${bar.month}: ${bar.sessions} sessions, ${bar.minutes} min`}
                    />
                  </div>
                  <span className="font-mono text-[10px] text-neutral-500">{bar.month}</span>
                </div>
              ))}
            </div>
          </motion.div>
        )}

        {/* Achievements */}
        {report.achievements.length > 0 && (
          <motion.div
            className="flex flex-col gap-3 rounded-2xl border border-white/10 bg-[#0e0f14] p-6"
            initial={{ opacity: 0, y: 16 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.6, duration: 0.4 }}
          >
            <h2 className="font-manrope text-sm font-medium text-neutral-400">Achievements earned</h2>
            <div className="flex flex-wrap gap-2">
              {report.achievements.map((name) => (
                <span
                  key={name}
                  className="rounded-full border border-[#3B82F6]/30 bg-[#3B82F6]/[0.08] px-3 py-1 font-inter text-xs text-[#60A5FA]"
                >
                  {name}
                </span>
              ))}
            </div>
          </motion.div>
        )}

        {/* Share + footer */}
        <motion.div
          className="flex flex-col items-center gap-4 border-t border-white/[0.07] pt-8 text-center"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.7, duration: 0.4 }}
        >
          <div className="flex items-center gap-3">
            <button
              type="button"
              onClick={handleShare}
              className="inline-flex items-center gap-2 rounded-xl border border-[#3B82F6]/30 bg-[#3B82F6]/10 px-5 py-2.5 font-manrope text-sm font-medium text-[#60A5FA] transition-colors hover:bg-[#3B82F6]/20"
            >
              {copied ? (
                <>
                  <Check size={15} />
                  Copied!
                </>
              ) : (
                <>
                  <Share2 size={15} />
                  Copy link
                </>
              )}
            </button>
            <button
              type="button"
              onClick={handleShareX}
              className="inline-flex items-center gap-2 rounded-xl border border-white/10 bg-white/[0.03] px-5 py-2.5 font-manrope text-sm font-medium text-white transition-colors hover:bg-white/[0.08]"
            >
              <XIcon className="h-[15px] w-[15px]" />
              Share on X
            </button>
          </div>

          <p className="font-inter text-sm text-[#A1A1AA]">
            Generated by{" "}
            <Link href="/" className="font-semibold text-white underline underline-offset-2">
              Upstream
            </Link>
          </p>
          <Link
            href="/dashboard"
            className="rounded-lg border border-white/10 bg-white/[0.03] px-5 py-2.5 font-inter text-sm text-white transition-colors hover:bg-white/[0.08]"
          >
            Back to dashboard
          </Link>
        </motion.div>
      </div>
    </main>
  );
}
