import { listProjects } from "@aztrx/api-client";
import { getServerSupabaseClient } from "@/lib/supabase/server";
import { ProjectsClient } from "./ProjectsClient";

export default async function ProjectsPage() {
  const supabase = await getServerSupabaseClient();
  const projects = await listProjects(supabase);

  return <ProjectsClient projects={projects} />;
}
