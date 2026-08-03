import { NextResponse } from "next/server";

// Same in-memory store as send-code. In production, share via Redis or DB.
// For now, this works within the same Node.js process.
declare global {
  var __phoneCodes: Map<string, { code: string; expires: number }> | undefined;
}

// Reuse the same map across route modules in dev.
const codes: Map<string, { code: string; expires: number }> =
  (globalThis as any).__phoneCodes || ((globalThis as any).__phoneCodes = new Map());

/**
 * POST /api/phone/verify-code
 * Body: { phone: "+7383927472", code: "123456" }
 */
export async function POST(request: Request) {
  const { phone, code } = (await request.json()) as { phone?: string; code?: string };
  if (!phone || !code) {
    return NextResponse.json({ error: "Phone and code required." }, { status: 400 });
  }

  const entry = codes.get(phone);
  if (!entry) {
    return NextResponse.json({ verified: false, error: "No code requested for this number." }, { status: 400 });
  }

  if (entry.expires < Date.now()) {
    codes.delete(phone);
    return NextResponse.json({ verified: false, error: "Code expired. Request a new one." }, { status: 400 });
  }

  if (entry.code !== code) {
    return NextResponse.json({ verified: false, error: "Wrong code." }, { status: 400 });
  }

  codes.delete(phone);
  return NextResponse.json({ verified: true });
}
