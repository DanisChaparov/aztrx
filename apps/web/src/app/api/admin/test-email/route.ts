import { NextResponse } from "next/server";
import { sendNotification } from "@/lib/notify";
import { getAdminUser } from "@/lib/admin";

export async function POST() {
  const user = await getAdminUser();
  if (!user) return NextResponse.json({ error: "Forbidden" }, { status: 403 });

  const email = user.email;
  if (!email) return NextResponse.json({ error: "No email on account" }, { status: 400 });

  const emailConfigured = !!(process.env.EMAIL_FROM && process.env.EMAIL_APP_PASSWORD);

  const result = await sendNotification({
    toEmail: email,
    title: "Aztrx — test notification",
    body: "This is a test email from Aztrx. If you received this, email notifications are working!",
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
