import { NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";
import { sendNotification } from "@/lib/notify";

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
      `deadline_notified_at.is.null,deadline_notified_at.lte.${new Date(now.getTime() - 23 * 60 * 60 * 1000).toISOString()}`
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
    const hoursLeft = Math.max(1, Math.ceil((deadlineDate.getTime() - now.getTime()) / (60 * 60 * 1000)));
    const urgency =
      hoursLeft <= 1
        ? "URGENT: less than 1 hour remaining"
        : hoursLeft <= 24
          ? `${hoursLeft} hours remaining`
          : `Due ${deadlineDate.toLocaleDateString("en-US", { month: "long", day: "numeric" })}`;

    const notificationResult = await sendNotification({
      toEmail: email,
      title: `⏰ Deadline: "${project.name}" — ${urgency}`,
      body: [
        `Your project "${project.name}" is due ${deadlineDate.toLocaleDateString("en-US", { month: "long", day: "numeric" })}.`,
        hoursLeft ? `Time remaining: about ${hoursLeft} hours.` : "",
        "",
        "Open Upstream to check your progress or update the deadline.",
        "— The Upstream team",
      ]
        .filter(Boolean)
        .join("\n"),
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
