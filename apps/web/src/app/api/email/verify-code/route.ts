import { NextResponse } from "next/server";

const codes: Map<string, { code: string; expires: number }> =
  (globalThis as any).__emailCodes || ((globalThis as any).__emailCodes = new Map());

/**
 * POST /api/email/verify-code
 * Body: { email: "someone@gmail.com", code: "123456" }
 */
export async function POST(request: Request) {
  const { email, code } = (await request.json()) as { email?: string; code?: string };
  if (!email || !code) {
    return NextResponse.json({ error: "Email and code required." }, { status: 400 });
  }

  const key = email.toLowerCase();
  const entry = codes.get(key);
  if (!entry) {
    return NextResponse.json({ verified: false, error: "No code requested. Send one first." });
  }
  if (entry.expires < Date.now()) {
    codes.delete(key);
    return NextResponse.json({ verified: false, error: "Code expired. Request a new one." });
  }
  if (entry.code !== code) {
    return NextResponse.json({ verified: false, error: "Wrong code." });
  }

  codes.delete(key);
  return NextResponse.json({ verified: true });
}
