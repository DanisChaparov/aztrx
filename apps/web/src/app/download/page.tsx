import Link from "next/link";
import { Apple, Monitor, Shield, Zap } from "lucide-react";

export const metadata = { title: "Download — Upstream" };

export default function DownloadPage() {
  return (
    <main className="min-h-screen bg-[#0c0c0c] text-white flex items-center justify-center px-6 py-20">
      <div className="max-w-2xl w-full flex flex-col items-center text-center gap-10">
        <div>
          <h1 className="font-inter text-4xl font-extrabold tracking-tight text-white">Download Upstream</h1>
          <p className="mt-3 font-inter text-[17px] leading-relaxed text-[#A1A1AA]">
            The desktop app tracks your real work. The web dashboard shows you the results.
          </p>
        </div>

        <div className="flex flex-col sm:flex-row gap-4 w-full max-w-md">
          <a
            href="https://github.com/DanisChaparov/upstream-releases/releases"
            target="_blank"
            rel="noopener noreferrer"
            className="flex-1 flex items-center justify-center gap-3 rounded-xl bg-white text-black font-medium text-base px-6 py-4 transition-all hover:bg-white/90 active:scale-[0.98]"
          >
            <Apple size={20} />
            macOS
          </a>
          <a
            href="https://github.com/DanisChaparov/upstream-releases/releases"
            target="_blank"
            rel="noopener noreferrer"
            className="flex-1 flex items-center justify-center gap-3 rounded-xl border border-white/15 bg-white/[0.04] text-white font-medium text-base px-6 py-4 transition-all hover:bg-white/[0.08] active:scale-[0.98]"
          >
            <Monitor size={20} />
            Windows
          </a>
        </div>

        <p className="font-inter text-sm text-[#A1A1AA]">
          Also available on{" "}
          <a href="https://github.com/DanisChaparov/upstream-releases" target="_blank" rel="noopener" className="text-[#3B82F6] underline">GitHub Releases</a>
          {" "}— source code and binaries.
        </p>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 w-full max-w-lg">
          {[
            { icon: Shield, title: "Verified tracking", desc: "Cross-references GitHub commits and IDE activity" },
            { icon: Zap, title: "Block distractions", desc: "Blocks sites and apps during focus sessions" },
          ].map((f) => (
            <div key={f.title} className="rounded-xl border border-white/[0.06] bg-white/[0.02] p-4 text-left">
              <f.icon size={18} className="text-[#3B82F6] mb-2" />
              <h3 className="font-inter text-sm font-semibold text-white">{f.title}</h3>
              <p className="mt-1 font-inter text-xs text-[#A1A1AA]">{f.desc}</p>
            </div>
          ))}
        </div>

        <Link href="/" className="font-inter text-sm text-[#A1A1AA] hover:text-white transition-colors">
          ← Back to Upstream
        </Link>
      </div>
    </main>
  );
}
