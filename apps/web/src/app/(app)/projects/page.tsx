import { Github } from "lucide-react";
import { listProjects } from "@focus-forge/api-client";
import { GrantPrivateRepoAccessButton } from "@/components/GrantPrivateRepoAccessButton";
import { NewProjectForm } from "@/components/NewProjectForm";
import { getServerSupabaseClient } from "@/lib/supabase/server";

function formatDeadline(deadline: string | null): string {
  if (!deadline) return "No deadline";
  const days = Math.ceil((new Date(deadline).getTime() - Date.now()) / (1000 * 60 * 60 * 24));
  if (days < 0) return `Overdue by ${Math.abs(days)}d`;
  if (days === 0) return "Due today";
  return `${days}d left`;
}

export default async function ProjectsPage() {
  const supabase = await getServerSupabaseClient();
  const projects = await listProjects(supabase);

  return (
    <div className="flex flex-col gap-8 pt-8">
      <h1 className="font-instrument-serif text-3xl text-white">Projects</h1>

      <div className="flex flex-col gap-2">
        {projects.length === 0 && (
          <p className="font-inter text-sm text-neutral-500">
            No projects yet — create one below to start a focus session against it.
          </p>
        )}
        {projects.map((project) => (
          <div key={project.id} className="glass-panel flex items-center justify-between px-4 py-3">
            <div>
              <div className="font-manrope text-sm font-medium text-neutral-100">{project.name}</div>
              <div className="mt-0.5 flex items-center gap-1.5 font-inter text-xs text-neutral-500">
                <span>{formatDeadline(project.deadline)}</span>
                <span>·</span>
                {project.githubRepoUrl ? (
                  <span className="flex items-center gap-1 text-[#8b74ff]">
                    <Github size={12} /> GitHub linked
                  </span>
                ) : (
                  <span>No repo linked</span>
                )}
              </div>
            </div>
          </div>
        ))}
      </div>

      <div>
        <h2 className="mb-3 font-manrope text-sm font-medium text-neutral-400">New project</h2>
        <NewProjectForm />
      </div>

      <GrantPrivateRepoAccessButton />
    </div>
  );
}
