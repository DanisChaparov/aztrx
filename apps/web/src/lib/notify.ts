/**
 * Notification dispatch — Email, Telegram, Push.
 * All channels have free tiers. No paid services required.
 *
 * ── Email (FREE — 100/day) ────────────────────────────────────
 * Resend (resend.com) — free tier: 100 emails/day.
 *   Sign up at resend.com → API Keys → copy key.
 *   Add to .env.local: RESEND_API_KEY=re_xxxxxxxx
 *   Verified domain recommended but not required for testing.
 *
 * ── Telegram (FREE — unlimited) ───────────────────────────────
 * Telegram Bot API — no rate limits, no cost.
 *   1. Chat with @BotFather on Telegram, create a bot, get the token.
 *   2. Add to .env.local: TELEGRAM_BOT_TOKEN=123:abc
 *   3. Users chat with your bot to get their chat_id.
 *   4. Bot sends verification codes and notifications.
 *
 * ── Push (FREE — unlimited) ───────────────────────────────────
 * Web Push API — browser native, already built at /api/push/notify.
 */

import { Resend } from "resend";
import nodemailer from "nodemailer";

// ── Email: Resend (primary) or Gmail SMTP (fallback) ──────────

let resendClient: Resend | null = null;
function getResend(): Resend | null {
  if (resendClient) return resendClient;
  if (process.env.RESEND_API_KEY) {
    resendClient = new Resend(process.env.RESEND_API_KEY);
    console.log("[notify] Email via Resend");
  }
  return resendClient;
}

let gmailTransport: nodemailer.Transporter | null = null;
function getGmail() {
  if (gmailTransport) return gmailTransport;
  const user = process.env.EMAIL_FROM;
  const pass = (process.env.EMAIL_APP_PASSWORD || "").replace(/\s+/g, ""); // strip spaces
  if (user && pass) {
    gmailTransport = nodemailer.createTransport({
      service: "gmail",
      auth: { user, pass },
    });
    console.log("[notify] Email via Gmail SMTP");
  }
  return gmailTransport;
}

// ── HTML email wrapper ─────────────────────────────────────────

export function wrapHtml(body: string): string {
  return `<!doctype html>
<html lang="en">
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
</head>
<body style="margin:0;padding:0;background-color:#0c0c0c;font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',Roboto,sans-serif">
  <table width="100%" cellpadding="0" cellspacing="0" style="background-color:#0c0c0c;padding:40px 0">
    <tr>
      <td align="center">
        <table width="560" cellpadding="0" cellspacing="0" style="background:linear-gradient(135deg,#0e0f14 0%,#13151a 100%);border:1px solid rgba(255,255,255,0.08);border-radius:16px;overflow:hidden">
          <!-- Header -->
          <tr>
            <td style="padding:32px 40px 0">
              <div style="display:flex;align-items:center;gap:10px">
                <span style="font-size:22px">⬆️</span>
                <span style="color:#ffffff;font-size:18px;font-weight:700;letter-spacing:-0.3px">Upstream</span>
              </div>
            </td>
          </tr>
          <!-- Body -->
          <tr>
            <td style="padding:24px 40px 32px;color:#d4d4d8;font-size:15px;line-height:1.6">
              ${body}
            </td>
          </tr>
          <!-- Footer -->
          <tr>
            <td style="padding:20px 40px;border-top:1px solid rgba(255,255,255,0.06);color:#71717a;font-size:12px">
              Sent by Upstream &mdash; your focus companion.
            </td>
          </tr>
        </table>
      </td>
    </tr>
  </table>
</body>
</html>`;
}

async function sendEmail(to: string, subject: string, text: string, html?: string): Promise<"sent" | "error" | "not-configured"> {
  // Try Gmail SMTP first — shows the sender's real Gmail profile photo as avatar.
  const gmail = getGmail();
  if (gmail) {
    try {
      await gmail.sendMail({ from: `Upstream <${process.env.EMAIL_FROM}>`, to, subject, text, html });
      console.log(`[notify] Gmail sent to ${to}`);
      return "sent";
    } catch (err: any) {
      console.error("[notify] Gmail failed:", err.message);
    }
  }

  // Fallback: Resend (free tier — 100/day, no custom avatar on free plan).
  const resend = getResend();
  if (resend) {
    try {
      const response = await resend.emails.send({
        from: "Upstream <onboarding@resend.dev>",
        to,
        subject,
        text,
        html,
      });
      if (response.error) {
        console.error("[notify] Resend error:", response.error.message);
      } else {
        console.log(`[notify] Resend sent to ${to}`);
        return "sent";
      }
    } catch (err: any) {
      console.error("[notify] Resend failed:", err.message);
    }
  }

  return "not-configured";
}

// ── WhatsApp Cloud API (FREE — 1,000 msg/month) ──────────────

async function sendWhatsApp(to: string, text: string): Promise<boolean> {
  const phoneNumberId = process.env.WHATSAPP_PHONE_NUMBER_ID;
  const token = process.env.WHATSAPP_ACCESS_TOKEN;
  if (!phoneNumberId || !token) return false;

  try {
    const res = await fetch(`https://graph.facebook.com/v21.0/${phoneNumberId}/messages`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${token}`,
      },
      body: JSON.stringify({
        messaging_product: "whatsapp",
        to,
        type: "text",
        text: { body: text },
      }),
    });
    return res.ok;
  } catch {
    return false;
  }
}

// ── Telegram (FREE — unlimited) ───────────────────────────────

async function sendTelegram(chatId: string, text: string): Promise<boolean> {
  const token = process.env.TELEGRAM_BOT_TOKEN;
  if (!token) return false;

  try {
    const res = await fetch(`https://api.telegram.org/bot${token}/sendMessage`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ chat_id: chatId, text }),
    });
    return res.ok;
  } catch {
    return false;
  }
}

// ── public API ─────────────────────────────────────────────────

export interface NotificationPayload {
  toEmail?: string;
  toPhone?: string;      // WhatsApp (+SMS fallback)
  toTelegram?: string;   // Telegram chat_id
  title: string;
  body: string;
  html?: string;         // HTML email body (falls back to plain-text body)
}

export interface NotificationResult {
  email: "sent" | "not-configured" | "error";
  whatsapp: "sent" | "not-configured" | "error";
  telegram: "sent" | "not-configured" | "error";
  sms: "sent" | "not-configured" | "error";
  emailError?: string;
  whatsappError?: string;
}

export async function sendNotification(payload: NotificationPayload): Promise<NotificationResult> {
  const result: NotificationResult = {
    email: "not-configured", whatsapp: "not-configured",
    telegram: "not-configured", sms: "not-configured",
  };

  // Email.
  if (payload.toEmail) {
    result.email = await sendEmail(payload.toEmail, payload.title, payload.body, payload.html);
  }

  // WhatsApp (primary for phone numbers — free, 1,000/month).
  if (payload.toPhone && process.env.WHATSAPP_PHONE_NUMBER_ID) {
    const ok = await sendWhatsApp(payload.toPhone, `${payload.title}\n\n${payload.body}`);
    result.whatsapp = ok ? "sent" : "error";
    if (!ok) result.whatsappError = "WhatsApp send failed";
  }

  // Telegram.
  if (payload.toTelegram) {
    const token = process.env.TELEGRAM_BOT_TOKEN;
    if (token) {
      const ok = await sendTelegram(payload.toTelegram, `${payload.title}\n\n${payload.body}`);
      result.telegram = ok ? "sent" : "error";
    }
  }

  // SMS not yet wired — would use Twilio here.
  // Free channels (email, WhatsApp, Telegram) cover all current use cases.

  return result;
}

/**
 * Send a verification code to a user via Telegram.
 * Returns the chat_id the user should message to link their account.
 */
export async function sendTelegramCode(
  chatId: string,
  code: string
): Promise<{ sent: boolean; error?: string }> {
  const ok = await sendTelegram(
    chatId,
    `🔐 Your Upstream verification code: ${code}\n\nIt expires in 10 minutes.`
  );
  return ok ? { sent: true } : { sent: false, error: "Could not send. Check TELEGRAM_BOT_TOKEN." };
}

/**
 * Get info about the configured Telegram bot. Returns null if not configured.
 */
export function getTelegramBotInfo(): { username: string } | null {
  // We'll resolve the username on first message — for now just check if configured.
  if (process.env.TELEGRAM_BOT_TOKEN) {
    return { username: "(configured)" };
  }
  return null;
}
