import { NextResponse } from "next/server";
import { queueAssistantChat, type ChatTurn } from "@focus-forge/api-client";
import { getServerSupabaseClient } from "@/lib/supabase/server";

export async function POST(request: Request) {
  const supabase = await getServerSupabaseClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { message, history } = (await request.json()) as { message: string; history?: ChatTurn[] };
  if (!message || typeof message !== "string") {
    return NextResponse.json({ error: "message is required" }, { status: 400 });
  }

  // No model call happens here — this just hands the turn off to the user's
  // desktop widget, which runs it through their own `claude` CLI login. See
  // apps/desktop/src/chatRunner.ts for the side that actually talks to Claude.
  const chat = await queueAssistantChat(supabase, {
    userId: user.id,
    message,
    history: history ?? [],
    model: null,
  });

  return NextResponse.json({ chatId: chat.id });
}
