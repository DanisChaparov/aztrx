import { NextResponse } from "next/server";
import { queueAssistantChat, type ChatTurn } from "@focus-forge/api-client";
import { getServerSupabaseClient } from "@/lib/supabase/server";
import { getPlan } from "@focus-forge/api-client";
import { getLocalDayStart } from "@focus-forge/core";

const FREE_DAILY_LIMIT = 5;

/**
 * POST /api/assistant
 *
 * Upstream AI — your personal developer assistant.
 *
 * Two backends, tried in order:
 * 1. Desktop Claude CLI (full power — 11 MCP tools, real-time computer awareness)
 * 2. Direct Anthropic API (fallback — works without desktop app installed)
 *
 * If neither is available, returns a helpful message.
 *
 * Free users get 5 interactions/day. Pro users get 15/day.
 * Users who bring their own API key bypass the limit entirely.
 */
export async function POST(request: Request) {
  const supabase = await getServerSupabaseClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { message, history, timezoneOffset } = (await request.json()) as {
    message: string;
    history?: ChatTurn[];
    timezoneOffset?: number;
  };
  if (!message || typeof message !== "string") {
    return NextResponse.json({ error: "message is required" }, { status: 400 });
  }

  // Check if user provided their own API key.
  const { data: profile } = await supabase
    .from("profiles")
    .select("anthropic_api_key, plan")
    .eq("id", user.id)
    .single();
  const userApiKey = profile?.anthropic_api_key;

  // User has their own key — call Anthropic directly. Upstream pays nothing.
  if (userApiKey) {
    try {
      const reply = await callAnthropic(message, history ?? [], userApiKey);
      return NextResponse.json({ chatId: "direct", reply, mode: "user-key" });
    } catch (err: any) {
      console.error("[assistant] User API failed:", err.message);
      return NextResponse.json({
        chatId: "error",
        reply: `Your API key didn't work: ${err.message}. Check it in Settings → API Key.`,
        mode: "error",
      });
    }
  }

  // No API key — check daily limit for free users.
  const plan = await getPlan(supabase);
  if (plan === "free") {
    const tz = timezoneOffset ?? 0;
    const dayStart = getLocalDayStart(new Date(), tz);
    const { count } = await supabase
      .from("assistant_chats")
      .select("*", { count: "exact", head: true })
      .eq("user_id", user.id)
      .gte("created_at", dayStart.toISOString());

    if ((count ?? 0) >= FREE_DAILY_LIMIT) {
      return NextResponse.json({
        chatId: "limit",
        reply: `You've used all ${FREE_DAILY_LIMIT} free AI interactions today. Upgrade to Pro for 15/day, or add your own Anthropic API key in Settings for unlimited use.`,
        mode: "offline",
      });
    }
  }

  // Try desktop Claude CLI (user's Claude Code subscription).
  try {
    const chat = await queueAssistantChat(supabase, {
      userId: user.id,
      message,
      history: history ?? [],
      model: null,
    });
    return NextResponse.json({ chatId: chat.id, mode: "desktop" });
  } catch {
    // Nothing available — tell user how to connect.
    return NextResponse.json({
      chatId: "offline",
      reply: "To unlock unlimited AI:\n\n1. Add your OpenAI, Anthropic, or Gemini API key in Settings — stored in your browser only, never on our servers.\n\n2. Or install the Upstream desktop app — it uses your local Claude Code installation at no extra cost.",
      mode: "offline",
    });
  }
}

async function callAnthropic(message: string, history: ChatTurn[], apiKey: string): Promise<string> {
  const systemPrompt =
    "You are Upstream AI, the assistant built into Upstream — a focus and productivity app for developers. " +
    "Be concise, friendly, and sound like you're speaking. Short, natural sentences over lists. " +
    "The user may ask about their coding stats, focus sessions, projects, or ask you to start/end a session. " +
    "If you don't have access to their real-time data (sessions, tools, computer state), be honest about it " +
    "and suggest they install the Upstream desktop app for full awareness of their computer. " +
    "Never pretend to know something you can't actually see.";

  const messages = [
    { role: "system" as const, content: systemPrompt },
    ...history.map((t) => ({
      role: (t.role === "assistant" ? "assistant" : "user") as "assistant" | "user",
      content: t.content,
    })),
    { role: "user" as const, content: message },
  ];

  const res = await fetch("https://api.anthropic.com/v1/messages", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      "x-api-key": apiKey,
      "anthropic-version": "2023-06-01",
    },
    body: JSON.stringify({
      model: "claude-haiku-4-5-20251001",
      max_tokens: 500,
      messages: messages.filter(m => m.role !== "system" || messages.indexOf(m) === 0),
      system: systemPrompt,
    }),
  });

  if (!res.ok) {
    const err = await res.json().catch(() => ({}));
    throw new Error((err as any)?.error?.message || `API error ${res.status}`);
  }

  const data = await res.json() as any;
  return data?.content?.[0]?.text || "I received your message but couldn't formulate a response.";
}
