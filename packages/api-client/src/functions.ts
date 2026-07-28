import type { SupabaseClient } from "@supabase/supabase-js";
import type { Database } from "./database.types";

export interface VerifySessionResult {
  verified: boolean;
  distractionEventCount: number;
  githubActivityDetected: boolean | null;
  impactEntries: { dependencyId: string; simulatedAmount: number }[];
  commits: {
    sha: string;
    message: string;
    htmlUrl: string;
    additions: number | null;
    deletions: number | null;
    committedAt: string | null;
  }[];
}

/** Invokes the verify-session Edge Function, which does the GitHub check server-side. */
export async function verifySession(
  client: SupabaseClient<Database>,
  sessionId: string
): Promise<VerifySessionResult> {
  const { data, error } = await client.functions.invoke<VerifySessionResult>("verify-session", {
    body: { sessionId },
  });
  if (error) throw error;
  if (!data || typeof data.verified !== "boolean") {
    // The function returned a non-2xx body that invoke() didn't classify as
    // an error (e.g. its own caught-exception JSON), or something else
    // shaped unexpectedly. Surface it as a real error instead of crashing
    // the UI on `.impactEntries.length` of an undefined field.
    const message = (data as unknown as { error?: string })?.error ?? "verify-session returned an unexpected response";
    throw new Error(message);
  }
  return { ...data, impactEntries: data.impactEntries ?? [], commits: data.commits ?? [] };
}
