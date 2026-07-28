import type { SupabaseClient } from "@supabase/supabase-js";
import type { AssistantChatRow, AssistantChatStatus, Database } from "../database.types";

export interface ChatTurn {
  role: "user" | "assistant";
  content: string;
}

export interface AssistantChat {
  id: string;
  userId: string;
  message: string;
  history: ChatTurn[];
  model: string | null;
  status: AssistantChatStatus;
  reply: string | null;
  createdAt: string;
  completedAt: string | null;
}

function toChat(row: AssistantChatRow): AssistantChat {
  return {
    id: row.id,
    userId: row.user_id,
    message: row.message,
    history: Array.isArray(row.history) ? (row.history as ChatTurn[]) : [],
    model: row.model,
    status: row.status,
    reply: row.reply,
    createdAt: row.created_at,
    completedAt: row.completed_at,
  };
}

/** Called by the web app's assistant route — never talks to Claude itself, just queues the turn. */
export async function queueAssistantChat(
  client: SupabaseClient<Database>,
  input: { userId: string; message: string; history: ChatTurn[]; model: string | null }
): Promise<AssistantChat> {
  const { data, error } = await client
    .from("assistant_chats")
    .insert({ user_id: input.userId, message: input.message, history: input.history, model: input.model })
    .select("*")
    .single();
  if (error) throw error;
  return toChat(data);
}

/** Polled by the desktop app, which runs the actual `claude` CLI. */
export async function getPendingChats(client: SupabaseClient<Database>): Promise<AssistantChat[]> {
  const { data, error } = await client
    .from("assistant_chats")
    .select("*")
    .eq("status", "pending")
    .order("created_at", { ascending: true });
  if (error) throw error;
  return (data ?? []).map(toChat);
}

export async function updateChatStatus(
  client: SupabaseClient<Database>,
  chatId: string,
  patch: { status: AssistantChatStatus; reply?: string | null }
): Promise<void> {
  const { error } = await client
    .from("assistant_chats")
    .update({
      status: patch.status,
      reply: patch.reply ?? null,
      completed_at: patch.status === "pending" ? null : new Date().toISOString(),
    })
    .eq("id", chatId);
  if (error) throw error;
}

/** Polled by the web app to reflect the desktop app's reply back into the chat UI. */
export async function getChatById(client: SupabaseClient<Database>, chatId: string): Promise<AssistantChat | null> {
  const { data, error } = await client.from("assistant_chats").select("*").eq("id", chatId).maybeSingle();
  if (error) throw error;
  return data ? toChat(data) : null;
}
