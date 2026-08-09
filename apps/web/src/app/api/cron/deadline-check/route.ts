import { NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";
import { sendNotification, wrapHtml } from "@/lib/notify";

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
function deadlineEmailHtml(projectName: string, label: string, urgency: string): string {
  const accentColor = urgency === "urgent" ? "#EF4444" : "#3B82F6";
  const emoji = urgency === "urgent" ? "🔴" : "⏰";

  const appUrl = process.env.NEXT_PUBLIC_SITE_URL || "https://stt-opal.vercel.app";

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
      Open Upstream to check your progress or push the deadline back.
    </p>
    <a href="${appUrl}/projects"
       style="display:inline-block;margin-top:20px;padding:12px 28px;background:${accentColor};color:#ffffff;border-radius:8px;text-decoration:none;font-weight:600;font-size:14px">
      Open Upstream →
    </a>
  `);
}

function escapeHtml(s: string): string {
  return s.replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;").replace(/"/g, "&quot;");
}

/**
 * GET /api/cron/deadline-check
 *
 * Vercel Cron endpoint — checks all users' projects for approaching deadlines
 * and sends email notifications. Runs every 30 minutes.
 *
 * Security: requires CRON_SECRET in Authorization header.
 * Uses the Supabase service-role key to bypass RLS (cron runs for all users).
 *
 * To set up in Vercel:
 *   vercel.json: { "crons": [{ "path": "/api/cron/deadline-check?secret=...", "schedule": "every 30 minutes" }] }
 */
export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const secret = searchParams.get("secret");

  // Require a shared secret so random people can't trigger this.
  const expected = process.env.CRON_SECRET;
  if (!expected || secret !== expected) {
    // Also accept Authorization: Bearer <secret> for Vercel Cron compatibility.
    const authHeader = request.headers.get("authorization") ?? "";
    const bearer = authHeader.startsWith("Bearer ") ? authHeader.slice(7) : "";
    if (!expected || bearer !== expected) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }
  }

  const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY;
  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
  if (!serviceRoleKey || !supabaseUrl) {
    return NextResponse.json({ error: "Supabase config missing" }, { status: 500 });
  }

  const supabase = createClient(supabaseUrl, serviceRoleKey);

  const now = new Date();
  const in24h = new Date(now.getTime() + 24 * 60 * 60 * 1000);

  // Find projects with deadlines within the next 24 hours that haven't been
  // notified recently (or at all).
  const { data: projects, error } = await supabase
    .from("projects")
    .select("id, name, deadline, user_id")
    .not("deadline", "is", null)
    .gt("deadline", now.toISOString())
    .lte("deadline", in24h.toISOString())
    .or(
      `deadline_notified_at.is.null,deadline_notified_at.lte.${new Date(now.getTime() - 5 * 60 * 60 * 1000).toISOString()}`
    );

  if (error) {
    console.error("[cron:deadline] Query error:", error.message);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  if (!projects || projects.length === 0) {
    return NextResponse.json({ notified: 0, message: "No upcoming deadlines." });
  }

  const results: { project: string; email: string; status: string }[] = [];

  for (const project of projects) {
    // Check notification preference for this user.
    const { data: profile } = await supabase
      .from("profiles")
      .select("notify_deadline")
      .eq("id", project.user_id)
      .single();

    if (profile && !profile.notify_deadline) {
      results.push({ project: project.name, email: "(opted out)", status: "opted-out" });
      continue;
    }

    // Get the user's email from Supabase Auth (service role can read auth.users).
    const { data: authUser } = await supabase.auth.admin.getUserById(project.user_id);
    const email = authUser?.user?.email;
    if (!email) {
      results.push({ project: project.name, email: "(none)", status: "no-email" });
      continue;
    }

    const deadlineDate = new Date(project.deadline);
    const remainingMs = deadlineDate.getTime() - now.getTime();
    const { label, urgency } = formatRemaining(Math.max(0, remainingMs));

    const notificationResult = await sendNotification({
      toEmail: email,
      title: `⏰ "${project.name}" due in ${label}`,
      body: [
        `Your project "${project.name}" is due in ${label}.`,
        "",
        "Open Upstream to check your progress or update the deadline:",
        `${process.env.NEXT_PUBLIC_SITE_URL || "https://stt-opal.vercel.app"}/projects`,
        "",
        "— The Upstream team",
      ].join("\n"),
      html: deadlineEmailHtml(project.name, label, urgency),
    });

    // Mark as notified so we don't spam.
    if (notificationResult.email === "sent") {
      await supabase
        .from("projects")
        .update({ deadline_notified_at: now.toISOString() })
        .eq("id", project.id);
    }

    results.push({ project: project.name, email, status: notificationResult.email });
  }

  const sent = results.filter((r) => r.status === "sent").length;
  const failed = results.filter((r) => r.status !== "sent").length;

  return NextResponse.json({
    notified: sent,
    failed,
    message: `Sent ${sent} deadline notification(s)${failed > 0 ? `, ${failed} failed` : ""}.`,
    results,
  });
}
