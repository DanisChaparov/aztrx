import { NextResponse } from "next/server";
import { getChatById } from "@focus-forge/api-client";
import { getServerSupabaseClient } from "@/lib/supabase/server";

/** Polled from the chat panel while a chat request is being handled by the desktop widget. */
export async function GET(_request: Request, { params }: { params: Promise<{ chatId: string }> }) {
  const supabase = await getServerSupabaseClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { chatId } = await params;
  const chat = await getChatById(supabase, chatId);
  if (!chat || chat.userId !== user.id) {
    return NextResponse.json({ error: "Not found" }, { status: 404 });
  }

  return NextResponse.json({ status: chat.status, reply: chat.reply });
}
