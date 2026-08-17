import { NextResponse } from "next/server";
import { sendNotification, sendTelegramCode } from "@/lib/notify";

const codes: Map<string, { code: string; expires: number }> =
  (globalThis as any).__phoneCodes || ((globalThis as any).__phoneCodes = new Map());

/**
 * POST /api/phone/send-code
 * Body: { phone: "+7383927472" } or { telegram: "chat_id" }
 *
 * Sends a 6-digit verification code via:
 * 1. WhatsApp (if WHATSAPP_PHONE_NUMBER_ID is set) — goes directly to the phone
 * 2. Telegram (if TELEGRAM_BOT_TOKEN is set and chat_id provided)
 * 3. Falls back to returning the code in the response
 */
export async function POST(request: Request) {
  const body = (await request.json()) as {
    phone?: string;
    telegram?: string;
  };

  const phone = body.phone?.replace(/[^\d+]/g, "");
  const telegram = body.telegram;
  const target = phone || telegram;

  if (!target || target.length < 5) {
    return NextResponse.json({ error: "Phone number required." }, { status: 400 });
  }

  const code = String(Math.floor(100000 + Math.random() * 900000));
  codes.set(target, { code, expires: Date.now() + 10 * 60_000 });

  // Try WhatsApp (primary — free, goes directly to phone number).
  if (phone) {
    const r = await sendNotification({
      toPhone: phone,
      title: "Aztrx verification code",
      body: `Your code is: ${code}\n\nIt expires in 10 minutes.`,
    });

    if (r.whatsapp === "sent") {
      return NextResponse.json({ sent: true, channel: "whatsapp", message: "Code sent via WhatsApp." });
    }
  }

  // Try Telegram.
  if (telegram) {
    const r = await sendTelegramCode(telegram, code);
    if (r.sent) {
      return NextResponse.json({ sent: true, channel: "telegram", message: "Code sent via Telegram." });
    }
  }

  // Nothing configured — return code on-screen.
  const missing = [];
  if (!process.env.WHATSAPP_PHONE_NUMBER_ID) missing.push("WhatsApp");
  if (!process.env.TELEGRAM_BOT_TOKEN) missing.push("Telegram");

  return NextResponse.json({
    sent: false,
    code,
    message: `No channel configured (${missing.join(", ")}). Set WHATSAPP_PHONE_NUMBER_ID or TELEGRAM_BOT_TOKEN in .env.local.`,
  });
}
