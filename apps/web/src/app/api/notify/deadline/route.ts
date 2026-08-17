import { NextResponse } from "next/server";
import { sendNotification, wrapHtml } from "@/lib/notify";
import { getServerSupabaseClient } from "@/lib/supabase/server";

/** Format remaining time for humans. */
function formatRemaining(ms: number): { label: string; urgency: "urgent" | "soon" | "normal" } {
  const totalMinutes = Math.max(1, Math.round(ms / (60 * 1000)));
  if (totalMinutes < 60) {
    return {
      label: `${totalMinutes} minute${totalMinutes === 1 ? "" : "s"}`,
      urgency: totalMinutes <= 5 ? "urgent" : "soon",
    };
  }
  const hours = Math.round(totalMinutes / 60);
  return {
    label: `${hours} hour${hours === 1 ? "" : "s"}`,
    urgency: hours <= 2 ? "urgent" : hours <= 12 ? "soon" : "normal",
  };
}

/** Pretty email HTML for a deadline notification. */
function deadlineEmailHtml(projectName: string, label: string, urgency: string, appUrl: string): string {
  const accentColor = urgency === "urgent" ? "#EF4444" : "#3B82F6";
  const emoji = urgency === "urgent" ? "🔴" : "⏰";

  return wrapHtml(`
    <h2 style="margin:0 0 12px;color:#ffffff;font-size:20px;font-weight:700">
      ${emoji} Deadline approaching
    </h2>
    <p style="margin:0 0 8px;color:#d4d4d8;font-size:15px">
      Your project <strong style="color:#ffffff">"${escapeHtml(projectName)}"</strong>
      is due in
      <span style="color:${accentColor};font-weight:600">${label}</span>.
    </p>
    <p style="margin:0 0 0;color:#a1a1aa;font-size:14px">
      Open Aztrx to check your progress or push the deadline back.
    </p>
    <a href="${appUrl}/projects"
       style="display:inline-block;margin-top:20px;padding:12px 28px;background:${accentColor};color:#ffffff;border-radius:8px;text-decoration:none;font-weight:600;font-size:14px">
      Open Aztrx →
    </a>
  `);
}

function escapeHtml(s: string): string {
  return s.replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;").replace(/"/g, "&quot;");
}

/**
 * POST /api/notify/deadline
 * Body: { projectName: "My App", deadline: "2026-08-09T17:32:00.000Z", projectId?: "uuid" }
 *
 * Sends an email notification about an approaching project deadline.
 * Tracks sent notifications in the projects table to avoid duplicates.
 */
export async function POST(request: Request) {
  const supabase = await getServerSupabaseClient();
  const { data: user } = await supabase.auth.getUser();
  if (!user.user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { projectName, deadline, projectId } = (await request.json()) as {
    projectName?: string;
    deadline?: string;
    projectId?: string;
  };

  if (!projectName) return NextResponse.json({ error: "Project name required." }, { status: 400 });

  // Skip if already notified in the last 5 hours (avoid duplicate notifications).
  if (projectId) {
    const { data: existing } = await supabase
      .from("projects")
      .select("deadline_notified_at")
      .eq("id", projectId)
      .single();

    if (existing?.deadline_notified_at) {
      const lastNotified = new Date(existing.deadline_notified_at).getTime();
      const hoursSinceLastNotify = (Date.now() - lastNotified) / (60 * 60 * 1000);
      if (hoursSinceLastNotify < 5) {
        return NextResponse.json({
          sent: false,
          to: user.user.email,
          message: "Already notified recently.",
        });
      }
    }
  }

  const email = user.user.email;
  if (!email) return NextResponse.json({ error: "No email on account." }, { status: 400 });

  // Compute precise remaining time.
  const remainingMs = deadline ? new Date(deadline).getTime() - Date.now() : 0;
  const { label, urgency } = formatRemaining(Math.max(0, remainingMs));

  const appUrl = process.env.NEXT_PUBLIC_SITE_URL || "https://aztrx.app";

  const result = await sendNotification({
    toEmail: email,
    title: `⏰ "${projectName}" due in ${label}`,
    body: [
      `Your project "${projectName}" is due in ${label}.`,
      "",
      "Open Aztrx to check your progress or update the deadline:",
      `${appUrl}/projects`,
      "",
      "— The Aztrx team",
    ].join("\n"),
    html: deadlineEmailHtml(projectName, label, urgency, appUrl),
  });

  // Track that we notified so cron and future page loads don't re-send.
  if (result.email === "sent" && projectId) {
    await supabase
      .from("projects")
      .update({ deadline_notified_at: new Date().toISOString() })
      .eq("id", projectId);
  }

  return NextResponse.json({
    sent: result.email === "sent",
    to: email,
    message: result.email === "sent"
      ? `Deadline alert sent to ${email}.`
      : "Email not configured.",
  });
}
