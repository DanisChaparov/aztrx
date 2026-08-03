import { NextResponse } from "next/server";
import { sendNotification } from "@/lib/notify";
import { getServerSupabaseClient } from "@/lib/supabase/server";

export async function POST() {
  const supabase = await getServerSupabaseClient();
  const { data: user } = await supabase.auth.getUser();
  if (!user.user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const email = user.user.email;
  if (!email) return NextResponse.json({ error: "No email on account" }, { status: 400 });

  const emailConfigured = !!(process.env.EMAIL_FROM && process.env.EMAIL_APP_PASSWORD);

  const result = await sendNotification({
    toEmail: email,
    title: "Upstream — test notification",
    body: "This is a test email from Upstream. If you received this, email notifications are working!",
  });

  return NextResponse.json({
    to: email,
    result,
    message: result.email === "sent"
      ? `Email sent to ${email}. Check your inbox (and spam folder).`
      : result.email === "error"
        ? `Failed to send: ${result.emailError}. Check your EMAIL_FROM and EMAIL_APP_PASSWORD in .env.local.`
        : "Email not configured. Add EMAIL_FROM and EMAIL_APP_PASSWORD to apps/web/.env.local.",
  });
}
