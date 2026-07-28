import type { SupabaseClient } from "@supabase/supabase-js";
import type { AssistantCommandRow, AssistantCommandStatus, AssistantCommandType, Database } from "../database.types";

export interface AssistantCommand {
  id: string;
  userId: string;
  type: AssistantCommandType;
  payload: Record<string, unknown>;
  status: AssistantCommandStatus;
  result: string | null;
  createdAt: string;
  completedAt: string | null;
}

function toCommand(row: AssistantCommandRow): AssistantCommand {
  return {
    id: row.id,
    userId: row.user_id,
    type: row.type,
    payload: row.payload,
    status: row.status,
    result: row.result,
    createdAt: row.created_at,
    completedAt: row.completed_at,
  };
}

/** Called from the assistant's tools — never executes anything itself, just queues work for the desktop app. */
export async function queueAssistantCommand(
  client: SupabaseClient<Database>,
  input: { userId: string; type: AssistantCommandType; payload: Record<string, unknown> }
): Promise<AssistantCommand> {
  const { data, error } = await client
    .from("assistant_commands")
    .insert({ user_id: input.userId, type: input.type, payload: input.payload })
    .select("*")
    .single();
  if (error) throw error;
  return toCommand(data);
}

/** Polled by the desktop app. */
export async function getPendingCommands(client: SupabaseClient<Database>): Promise<AssistantCommand[]> {
  const { data, error } = await client
    .from("assistant_commands")
    .select("*")
    .eq("status", "pending")
    .order("created_at", { ascending: true });
  if (error) throw error;
  return (data ?? []).map(toCommand);
}

export async function updateCommandStatus(
  client: SupabaseClient<Database>,
  commandId: string,
  patch: { status: AssistantCommandStatus; result?: string | null }
): Promise<void> {
  const { error } = await client
    .from("assistant_commands")
    .update({
      status: patch.status,
      result: patch.result ?? null,
      completed_at: patch.status === "completed" || patch.status === "failed" || patch.status === "rejected"
        ? new Date().toISOString()
        : null,
    })
    .eq("id", commandId);
  if (error) throw error;
}

/** Polled from the web chat panel to reflect a command's outcome back to the user. */
export async function getCommandById(
  client: SupabaseClient<Database>,
  commandId: string
): Promise<AssistantCommand | null> {
  const { data, error } = await client.from("assistant_commands").select("*").eq("id", commandId).maybeSingle();
  if (error) throw error;
  return data ? toCommand(data) : null;
}
