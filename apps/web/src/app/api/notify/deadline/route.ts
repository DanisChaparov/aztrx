import { NextResponse } from "next/server";
import { sendNotification } from "@/lib/notify";
import { getServerSupabaseClient } from "@/lib/supabase/server";

/**
 * POST /api/notify/deadline
 * Body: { projectName: "My App", deadline: "2025-08-15", hoursLeft: 24 }
 *
 * Sends an email notification about an approaching project deadline.
 * Uses the user's verified email from localStorage or their GitHub email.
 */
export async function POST(request: Request) {
  const supabase = await getServerSupabaseClient();
  const { data: user } = await supabase.auth.getUser();
  if (!user.user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { projectName, deadline, hoursLeft } = (await request.json()) as {
    projectName?: string;
    deadline?: string;
    hoursLeft?: number;
  };

  if (!projectName) return NextResponse.json({ error: "Project name required." }, { status: 400 });

  const email = user.user.email;
  if (!email) return NextResponse.json({ error: "No email on account." }, { status: 400 });

  const dueDate = deadline ? new Date(deadline).toLocaleDateString("en-US", { month: "long", day: "numeric" }) : "soon";
  const urgency = hoursLeft && hoursLeft <= 1
    ? "URGENT: less than 1 hour remaining"
    : hoursLeft && hoursLeft <= 24
      ? `${hoursLeft} hours remaining`
      : `Due ${dueDate}`;

  const result = await sendNotification({
    toEmail: email,
    title: `⏰ Deadline: "${projectName}" — ${urgency}`,
    body: [
      `Your project "${projectName}" is due ${dueDate}.`,
      hoursLeft ? `Time remaining: ${hoursLeft} hours.` : "",
      "",
      "Open Upstream to check your progress or update the deadline.",
      "— The Upstream team",
    ].filter(Boolean).join("\n"),
  });

  return NextResponse.json({
    sent: result.email === "sent",
    to: email,
    message: result.email === "sent"
      ? `Deadline alert sent to ${email}.`
      : "Email not configured.",
  });
}
