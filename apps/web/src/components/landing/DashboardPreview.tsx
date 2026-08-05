import { Flame, FolderKanban, LayoutDashboard, Timer } from "lucide-react";
import { Logo } from "@/components/Logo";

/**
 * A hand-built mockup of the real Upstream dashboard for the landing hero.
 *
 * Deliberately markup rather than a screenshot: it stays sharp on every
 * display, costs no image bytes on the page we most need to load fast, follows
 * the site's theme automatically, and shows no real user's stats.
 *
 * The numbers are illustrative, but every section mirrors one that actually
 * exists on /dashboard — streak, level, activity heatmap, tools used, impact
 * ledger, recent sessions.
 */

const NAV = [
  { label: "Dashboard", icon: LayoutDashboard, active: true },
  { label: "Projects", icon: FolderKanban, active: false },
  { label: "Focus", icon: Timer, active: false },
];

const TOOLS = [
  { name: "VS Code", time: "14h 20m", pct: 100 },
  { name: "Cursor", time: "6h 05m", pct: 43 },
  { name: "Terminal", time: "3h 40m", pct: 26 },
  { name: "Claude Code", time: "2h 15m", pct: 16 },
];

const LEDGER = [
  { name: "react", amount: "$4.80" },
  { name: "next", amount: "$3.60" },
  { name: "zod", amount: "$2.40" },
  { name: "tailwindcss", amount: "$1.90" },
];

const SESSIONS = [
  { project: "upstream-app", duration: "90 min", sha: "8db3c7c", verified: true },
  { project: "upstream-app", duration: "50 min", sha: "b4e7e39", verified: true },
  { project: "api-gateway", duration: "50 min", sha: "0a93193", verified: true },
  { project: "portfolio", duration: "25 min", sha: null, verified: false },
];

const HEATMAP_WEEKS = 38;
const HEATMAP_DAYS = 7;

/**
 * A fixed, seeded pattern rather than Math.random — the page is prerendered, so
 * a random fill would differ between the server and client HTML and hydrate
 * with a mismatch warning.
 */
function heatLevel(week: number, day: number): number {
  const n = (week * 7 + day) * 2654435761;
  return (n >>> 24) % 5;
}

const HEAT_FILL = [
  "bg-white/[0.06]",
  "bg-[#3B82F6]/25",
  "bg-[#3B82F6]/45",
  "bg-[#3B82F6]/70",
  "bg-[#3B82F6]",
];

function Panel({
  title,
  children,
  className,
}: {
  title: string;
  children: React.ReactNode;
  className?: string;
}) {
  return (
    <section className={`flex flex-col gap-2.5 ${className ?? ""}`}>
      <h3 className="font-inter text-[11px] font-medium text-[#A1A1AA]">{title}</h3>
      <div className="rounded-xl border border-white/[0.07] bg-white/[0.02] p-3">{children}</div>
    </section>
  );
}

export function DashboardPreview() {
  return (
    // `zoom` (not `transform: scale`) so the shrunk preview also takes up less
    // vertical space on phones instead of leaving a tall empty gap below it.
    <div
      className="w-[760px] select-none font-inter text-white [zoom:0.5] sm:[zoom:0.78] lg:w-full lg:[zoom:1]"
      aria-hidden
    >
      {/* Top bar — mirrors the real in-app nav */}
      <div className="flex items-center justify-between border-b border-white/[0.07] px-5 py-3">
        <div className="flex items-center gap-2">
          <Logo size={20} />
          <span className="text-[13px] font-bold tracking-tight">Upstream</span>
        </div>
        <div className="flex items-center gap-1">
          {NAV.map((item) => (
            <span
              key={item.label}
              className={`flex items-center gap-1.5 rounded-full px-3 py-1.5 text-[12px] font-medium ${
                item.active ? "bg-[#3B82F6]/20 text-white" : "text-[#A1A1AA]"
              }`}
            >
              <item.icon size={13} />
              {item.label}
            </span>
          ))}
        </div>
        <div className="h-6 w-6 rounded-full bg-white/10" />
      </div>

      <div className="flex flex-col gap-5 p-5">
        <div className="flex items-center justify-between">
          <h2 className="text-[20px] font-bold tracking-tight">Dashboard</h2>
          <span className="rounded-lg bg-[#3B82F6] px-3.5 py-1.5 text-[12px] font-medium">Start a session</span>
        </div>

        {/* Streak + level */}
        <div className="flex flex-wrap items-center gap-3">
          <span className="flex items-center gap-2 rounded-full border border-white/10 bg-white/[0.03] px-3.5 py-1.5 text-[12px]">
            <Flame size={14} className="text-[#60A5FA]" />
            <strong className="font-semibold">12</strong>
            <span className="text-[#A1A1AA]">day streak</span>
          </span>
          <span className="flex items-center gap-2.5 rounded-full border border-white/10 bg-white/[0.03] px-3.5 py-1.5 text-[12px]">
            <span className="font-semibold">Level 7</span>
            <span className="h-1.5 w-24 overflow-hidden rounded-full bg-white/10">
              <span className="block h-full w-[68%] rounded-full bg-[#3B82F6]" />
            </span>
            <span className="text-[#A1A1AA]">3,240 XP</span>
          </span>
        </div>

        {/* Activity gets two thirds so the heatmap fills its panel instead of
            hugging the left edge of a very wide empty box. */}
        <div className="grid grid-cols-3 gap-5">
          <Panel title="Activity" className="col-span-2">
            <div className="flex gap-[3px]">
              {Array.from({ length: HEATMAP_WEEKS }, (_, week) => (
                <div key={week} className="flex flex-1 flex-col gap-[3px]">
                  {Array.from({ length: HEATMAP_DAYS }, (_, day) => (
                    <span
                      key={day}
                      className={`aspect-square w-full rounded-[3px] ${HEAT_FILL[heatLevel(week, day)]}`}
                    />
                  ))}
                </div>
              ))}
            </div>
          </Panel>

          <Panel title="Impact ledger">
            <div className="flex flex-col divide-y divide-white/[0.06]">
              {LEDGER.map((dep) => (
                <div key={dep.name} className="flex items-center justify-between py-2 text-[12px] first:pt-0 last:pb-0">
                  <span className="font-mono text-[#A1A1AA]">{dep.name}</span>
                  <span className="font-medium text-[#60A5FA]">{dep.amount}</span>
                </div>
              ))}
            </div>
          </Panel>
        </div>

        <div className="grid grid-cols-3 gap-5">
          <Panel title="Tools used">
            <div className="flex flex-col gap-2.5">
              {TOOLS.map((tool) => (
                <div key={tool.name} className="flex flex-col gap-1">
                  <div className="flex items-center justify-between text-[12px]">
                    <span>{tool.name}</span>
                    <span className="text-[#A1A1AA]">{tool.time}</span>
                  </div>
                  <span className="h-1.5 w-full overflow-hidden rounded-full bg-white/[0.06]">
                    <span className="block h-full rounded-full bg-[#3B82F6]/70" style={{ width: `${tool.pct}%` }} />
                  </span>
                </div>
              ))}
            </div>
          </Panel>

          <Panel title="Recent sessions" className="col-span-2">
            <div className="flex flex-col divide-y divide-white/[0.06]">
              {SESSIONS.map((session) => (
                <div
                  key={session.sha ?? session.project + session.duration}
                  className="flex items-center justify-between py-2.5 text-[12px] first:pt-0 last:pb-0"
                >
                  <div className="flex items-center gap-2.5">
                    <span className="font-medium">{session.project}</span>
                    <span className="text-[#A1A1AA]">{session.duration}</span>
                  </div>
                  <div className="flex items-center gap-2.5">
                    {session.sha && <span className="font-mono text-[11px] text-[#A1A1AA]">{session.sha}</span>}
                    <span
                      className={`rounded-full px-2.5 py-0.5 text-[11px] font-medium ${
                        session.verified ? "bg-[#3B82F6]/20 text-[#93C5FD]" : "bg-white/[0.06] text-[#A1A1AA]"
                      }`}
                    >
                      {session.verified ? "Verified" : "Unverified"}
                    </span>
                  </div>
                </div>
              ))}
            </div>
          </Panel>
        </div>
      </div>
    </div>
  );
}
