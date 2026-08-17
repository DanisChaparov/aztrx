import { ImageResponse } from "next/og";
import { NextRequest } from "next/server";
import { getServerSupabaseClient } from "@/lib/supabase/server";
import { calculateStreak, calculateXp, getLevelInfo } from "@aztrx/core";

export const runtime = "edge";

/**
 * GET /api/og/share?type=stats|twin|report
 *
 * Generates a shareable OG card image. Dark hacker aesthetic.
 * Used for Twitter/X, LinkedIn, and general social sharing.
 */
export async function GET(request: NextRequest) {
  const type = request.nextUrl.searchParams.get("type") ?? "stats";
  const supabase = await getServerSupabaseClient();

  // Load font
  const [manropeBold, manropeReg, interReg] = await Promise.all([
    fetch(new URL("https://fonts.gstatic.com/s/manrope/v15/xn7_YHE41ni1AdIRqAuZuw1Bx9mbZk79FN_M-bnTfc7AGI8.ttf")).then(r => r.arrayBuffer()),
    fetch(new URL("https://fonts.gstatic.com/s/manrope/v15/xn7_YHE41ni1AdIRqAuZuw1Bx9mbZk7jFN_M-bnTfc7AGI8.ttf")).then(r => r.arrayBuffer()),
    fetch(new URL("https://fonts.gstatic.com/s/inter/v18/UcCO3FwrK3iLTeHuS_nVMrMxCp50SjIw2boKoduKmMEVuLyfMZs.ttf")).then(r => r.arrayBuffer()),
  ]);

  if (type === "stats") {
    const { data: user } = await supabase.auth.getUser();
    if (!user.user) return statsFallback(manropeBold, manropeReg, interReg);

    const { data: sessions } = await supabase
      .from("focus_sessions")
      .select("*")
      .eq("user_id", user.user.id)
      .order("started_at", { ascending: false })
      .limit(500);

    const { data: toolUsage } = await supabase
      .from("session_app_usage")
      .select("app_name, seconds_active");

    const verified = (sessions ?? []).filter((s: any) => s.verified);
    const streak = calculateStreak(verified.map((s: any) => ({
      id: s.id, userId: s.user_id, projectId: s.project_id,
      startedAt: s.started_at, endedAt: s.ended_at,
      plannedDurationMin: s.planned_duration_min,
      status: s.status, verified: s.verified, notes: (s as any).notes ?? null, tags: (s as any).tags ?? null,
    })));
    const xp = calculateXp(verified.map((s: any) => ({
      id: s.id, userId: s.user_id, projectId: s.project_id,
      startedAt: s.started_at, endedAt: s.ended_at,
      plannedDurationMin: s.planned_duration_min,
      status: s.status, verified: s.verified, notes: (s as any).notes ?? null, tags: (s as any).tags ?? null,
    })));
    const level = getLevelInfo(xp);

    // Top 3 tools
    const toolTotals = new Map<string, number>();
    for (const row of (toolUsage ?? [])) {
      toolTotals.set(row.app_name, (toolTotals.get(row.app_name) ?? 0) + row.seconds_active);
    }
    const topTools = Array.from(toolTotals.entries())
      .sort((a, b) => b[1] - a[1])
      .slice(0, 3)
      .map(([name]) => name);

    // Dev type
    const peakHour = 14; // simplified
    const devType = streak >= 30 ? "Iron Will" : streak >= 7 ? "Week Warrior" : verified.length >= 10 ? "Steady Craftsman" : "Rising Developer";

    return new ImageResponse(
      (
        <div style={{
          width: 1200, height: 630,
          background: "linear-gradient(135deg, #0b0c10 0%, #1a1040 50%, #0b0c10 100%)",
          display: "flex", flexDirection: "column",
          padding: 60, fontFamily: "Inter",
        }}>
          {/* Header */}
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start" }}>
            <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
              <span style={{ color: "#60A5FA", fontSize: 18, fontWeight: 700, fontFamily: "Manrope", letterSpacing: "0.15em", textTransform: "uppercase" }}>
                Aztrx
              </span>
              <span style={{ color: "#A1A1AA", fontSize: 24, fontFamily: "Manrope" }}>
                {user.user.user_metadata?.user_name ?? "Developer"}
              </span>
            </div>
            <span style={{
              color: "#60A5FA", fontSize: 16, fontWeight: 600,
              border: "1px solid rgba(139,116,255,0.3)", borderRadius: 999,
              padding: "8px 20px", fontFamily: "Manrope",
            }}>
              {devType}
            </span>
          </div>

          {/* Main stats */}
          <div style={{ display: "flex", gap: 40, marginTop: 60 }}>
            <StatBox label="Streak" value={`${streak}d`} color="#60A5FA" />
            <StatBox label="Level" value={String(level.level)} color="#a78bfa" />
            <StatBox label="Sessions" value={String(verified.length)} color="#c4b5fd" />
            <StatBox label="XP" value={String(xp)} color="#ddd6fe" />
          </div>

          {/* Tools */}
          <div style={{ display: "flex", gap: 16, marginTop: 50, alignItems: "center" }}>
            <span style={{ color: "#A1A1AA", fontSize: 16, fontFamily: "Manrope" }}>Top tools</span>
            {topTools.length > 0 ? topTools.map((tool) => (
              <span key={tool} style={{
                color: "#fff", fontSize: 16, fontWeight: 600,
                background: "rgba(139,116,255,0.15)", borderRadius: 999,
                padding: "8px 20px", fontFamily: "Manrope",
              }}>
                {tool}
              </span>
            )) : (
              <span style={{ color: "#fff", fontSize: 16, background: "rgba(255,255,255,0.05)", borderRadius: 999, padding: "8px 20px", fontFamily: "Manrope" }}>
                Start coding
              </span>
            )}
          </div>

          {/* Watermark */}
          <div style={{ marginTop: "auto", display: "flex", justifyContent: "center" }}>
            <span style={{ color: "rgba(255,255,255,0.15)", fontSize: 14, fontFamily: "Manrope" }}>
              aztrx.app · Productive Focus for Developers
            </span>
          </div>
        </div>
      ),
      { width: 1200, height: 630, fonts: [
        { name: "Manrope", data: manropeBold, weight: 700 },
        { name: "Manrope", data: manropeReg, weight: 400 },
        { name: "Inter", data: interReg, weight: 400 },
      ]}
    );
  }

  return statsFallback(manropeBold, manropeReg, interReg);
}

function StatBox({ label, value, color }: { label: string; value: string; color: string }) {
  return (
    <div style={{ display: "flex", flexDirection: "column", alignItems: "center", gap: 8, flex: 1 }}>
      <span style={{ color, fontSize: 56, fontWeight: 700, fontFamily: "Manrope" }}>{value}</span>
      <span style={{ color: "#71717A", fontSize: 18, fontFamily: "Manrope", textTransform: "uppercase", letterSpacing: "0.1em" }}>{label}</span>
    </div>
  );
}

function statsFallback(bold: ArrayBuffer, reg: ArrayBuffer, inter: ArrayBuffer) {
  return new ImageResponse(
    (
      <div style={{
        width: 1200, height: 630,
        background: "linear-gradient(135deg, #0b0c10 0%, #1a1040 50%, #0b0c10 100%)",
        display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center",
        padding: 60, gap: 24,
      }}>
        <span style={{ color: "#60A5FA", fontSize: 48, fontWeight: 700, fontFamily: "Manrope" }}>
          Aztrx
        </span>
        <span style={{ color: "#A1A1AA", fontSize: 28, fontFamily: "Manrope" }}>
          Productive Focus for Developers
        </span>
        <span style={{ color: "rgba(255,255,255,0.3)", fontSize: 18, fontFamily: "Inter", marginTop: 16 }}>
          Track · Focus · Verify · Grow
        </span>
      </div>
    ),
    { width: 1200, height: 630, fonts: [
      { name: "Manrope", data: bold, weight: 700 },
      { name: "Manrope", data: reg, weight: 400 },
      { name: "Inter", data: inter, weight: 400 },
    ]}
  );
}
