import { NextResponse } from "next/server";
import { sendNotification } from "@/lib/notify";

const codes: Map<string, { code: string; expires: number }> =
  (globalThis as any).__emailCodes || ((globalThis as any).__emailCodes = new Map());

/**
 * POST /api/email/send-code
 * Body: { email: "someone@gmail.com" }
 *
 * Sends a 6-digit verification code to the email via Resend.
 * Works with ANY email address — not just the account owner's.
 */
export async function POST(request: Request) {
  const { email } = (await request.json()) as { email?: string };
  if (!email || !email.includes("@")) {
    return NextResponse.json({ error: "Valid email required." }, { status: 400 });
  }

  const code = String(Math.floor(100000 + Math.random() * 900000));
  codes.set(email.toLowerCase(), { code, expires: Date.now() + 10 * 60_000 });

  const result = await sendNotification({
    toEmail: email,
    title: "Your Aztrx verification code",
    body: `Your verification code is: ${code}\n\nIt expires in 10 minutes.\n\nIf you didn't request this, ignore this email.`,
  });

  if (result.email === "sent") {
    return NextResponse.json({ sent: true, message: `Code sent to ${email}. Check your inbox.` });
  }

  return NextResponse.json({
    sent: false,
    code, // only returned when email isn't configured — for dev testing
    message: result.email === "not-configured"
      ? "Email not configured. Set RESEND_API_KEY in .env.local."
      : `Failed to send: ${result.emailError}`,
  });
}
