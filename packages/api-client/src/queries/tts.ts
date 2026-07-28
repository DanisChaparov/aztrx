import type { SupabaseClient } from "@supabase/supabase-js";
import type { AssistantTtsRow, AssistantTtsStatus, Database } from "../database.types";

export interface TtsRequest {
  id: string;
  userId: string;
  text: string;
  status: AssistantTtsStatus;
  audioBase64: string | null;
  error: string | null;
  createdAt: string;
  completedAt: string | null;
}

function toTtsRequest(row: AssistantTtsRow): TtsRequest {
  return {
    id: row.id,
    userId: row.user_id,
    text: row.text,
    status: row.status,
    audioBase64: row.audio_base64,
    error: row.error,
    createdAt: row.created_at,
    completedAt: row.completed_at,
  };
}

/** Called from /api/tts when no ElevenLabs key is configured — falls back to the
 *  desktop widget's local, free Kokoro TTS instead. */
export async function queueTtsRequest(
  client: SupabaseClient<Database>,
  input: { userId: string; text: string }
): Promise<TtsRequest> {
  const { data, error } = await client
    .from("assistant_tts")
    .insert({ user_id: input.userId, text: input.text })
    .select("*")
    .single();
  if (error) throw error;
  return toTtsRequest(data);
}

/** Polled by the desktop app. */
export async function getPendingTtsRequests(client: SupabaseClient<Database>): Promise<TtsRequest[]> {
  const { data, error } = await client
    .from("assistant_tts")
    .select("*")
    .eq("status", "pending")
    .order("created_at", { ascending: true });
  if (error) throw error;
  return (data ?? []).map(toTtsRequest);
}

export async function updateTtsStatus(
  client: SupabaseClient<Database>,
  ttsId: string,
  patch: { status: AssistantTtsStatus; audioBase64?: string | null; error?: string | null }
): Promise<void> {
  const { error } = await client
    .from("assistant_tts")
    .update({
      status: patch.status,
      audio_base64: patch.audioBase64 ?? null,
      error: patch.error ?? null,
      completed_at: patch.status === "pending" ? null : new Date().toISOString(),
    })
    .eq("id", ttsId);
  if (error) throw error;
}

/** Polled from the web /api/tts route while waiting on the desktop widget. */
export async function getTtsRequestById(client: SupabaseClient<Database>, ttsId: string): Promise<TtsRequest | null> {
  const { data, error } = await client.from("assistant_tts").select("*").eq("id", ttsId).maybeSingle();
  if (error) throw error;
  return data ? toTtsRequest(data) : null;
}
