import { getActiveSession, listProjects } from "@aztrx/api-client";
import { SessionRunner } from "@/components/SessionRunner";
import { getServerSupabaseClient } from "@/lib/supabase/server";

export default async function SessionPage() {
  const supabase = await getServerSupabaseClient();
  const [projects, activeSession] = await Promise.all([listProjects(supabase), getActiveSession(supabase)]);

  return (
    <div className="flex flex-col gap-6 pt-8">
      <h1 className="font-instrument-serif text-3xl text-white">Focus session</h1>
      <SessionRunner projects={projects} initialActiveSession={activeSession} />
    </div>
  );
}
