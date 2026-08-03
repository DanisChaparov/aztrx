import { Github, Clock, AlertTriangle, CheckCircle2, FolderGit } from "lucide-react";
import { listProjects } from "@focus-forge/api-client";
import { DeadlineCountdown } from "@/components/DeadlineCountdown";
import { GrantPrivateRepoAccessButton } from "@/components/GrantPrivateRepoAccessButton";
import { NewProjectForm } from "@/components/NewProjectForm";
import { DeadlineChecker } from "./DeadlineChecker";
import { ArchiveButton } from "./ArchiveButton";
import { getServerSupabaseClient } from "@/lib/supabase/server";

export default async function ProjectsPage() {
  const supabase = await getServerSupabaseClient();
  const projects = await listProjects(supabase);

  const active = projects.filter((p) => !p.archived);
  const overdue = active.filter((p) => p.deadline && new Date(p.deadline) < new Date());
  const approaching = active.filter((p) => {
    if (!p.deadline) return false;
    const days = Math.ceil((new Date(p.deadline).getTime() - Date.now()) / (1000 * 60 * 60 * 24));
    return days >= 0 && days <= 3;
  });

  return (
    <div className="flex flex-col gap-8 pt-8">
      <div className="flex items-center justify-between">
        <h1 className="font-instrument-serif text-3xl text-white">Projects</h1>
      </div>

      {/* Deadline warnings */}
      {overdue.length > 0 && (
        <div className="flex flex-col gap-2 rounded-2xl border border-red-400/20 bg-red-400/[0.04] p-4">
          <p className="flex items-center gap-2 font-manrope text-sm font-medium text-red-400">
            <AlertTriangle size={15} />
            Overdue ({overdue.length})
          </p>
          <ul className="flex flex-col gap-1">
            {overdue.map((p) => (
              <li key={p.id} className="font-inter text-sm text-[#A1A1AA]">
                <span className="font-medium text-white">{p.name}</span> — deadline was{" "}
                {new Date(p.deadline!).toLocaleDateString()}.{" "}
                <span className="text-neutral-500">Archive it below or set a new deadline.</span>
              </li>
            ))}
          </ul>
        </div>
      )}

      {overdue.length === 0 && approaching.length > 0 && (
        <div className="flex flex-col gap-2 rounded-2xl border border-amber-400/20 bg-amber-400/[0.04] p-4">
          <p className="flex items-center gap-2 font-manrope text-sm font-medium text-amber-400">
            <Clock size={15} />
            Approaching ({approaching.length})
          </p>
          <ul className="flex flex-col gap-1">
            {approaching.map((p) => (
              <li key={p.id} className="font-inter text-sm text-[#A1A1AA]">
                <span className="font-medium text-white">{p.name}</span> — due{" "}
                {new Date(p.deadline!).toLocaleDateString()}.{" "}
                <span className="text-amber-400/70">
                  We{"/'"}ll notify you 24 hours before.
                </span>
              </li>
            ))}
          </ul>
        </div>
      )}

      {/* Deadline notification checker — client component that sends push on deadline */}
      <DeadlineChecker projects={active} />

      {/* Active projects */}
      <div className="flex flex-col gap-2">
        {active.length === 0 && (
          <p className="font-inter text-sm text-neutral-500">
            No projects yet — create one below to start a focus session against it.
          </p>
        )}
        {active.map((project) => (
          <div
            key={project.id}
            className={`glass-panel flex items-center justify-between px-4 py-3 ${
              project.deadline && new Date(project.deadline) < new Date()
                ? "border-red-400/15"
                : ""
            }`}
          >
            <div className="min-w-0 flex-1">
              <div className="flex items-center gap-2 font-manrope text-sm font-medium text-neutral-100">
                <span className="truncate">{project.name}</span>
                {project.deadline && new Date(project.deadline) < new Date() && (
                  <span className="shrink-0 rounded-full bg-red-400/10 px-2 py-0.5 font-inter text-[10px] text-red-400">
                    overdue
                  </span>
                )}
              </div>
              <div className="mt-0.5 flex items-center gap-1.5 font-inter text-xs">
                {/* Live countdown timer */}
                {project.deadline && <DeadlineCountdown deadline={project.deadline} />}
                {project.deadline && <span className="text-neutral-600">·</span>}
                {project.githubRepoUrl ? (
                  <span className="flex items-center gap-1 text-[#8b74ff]">
                    <Github size={11} /> GitHub linked
                  </span>
                ) : (
                  <span className="text-neutral-500">No repo linked</span>
                )}
                {project.localPath && (
                  <>
                    <span className="text-neutral-600">·</span>
                    <span className="flex items-center gap-1 text-emerald-400/80">
                      <FolderGit size={11} /> Local verification
                    </span>
                  </>
                )}
              </div>
            </div>

            <div className="flex shrink-0 items-center gap-1">
              <ArchiveButton projectId={project.id} projectName={project.name} action="archive" />
              {project.deadline && new Date(project.deadline) < new Date() && (
                <ArchiveButton projectId={project.id} projectName={project.name} action="delete" />
              )}
            </div>
          </div>
        ))}
      </div>

      {/* New project form */}
      <div>
        <h2 className="mb-3 font-manrope text-sm font-medium text-neutral-400">New project</h2>
        <NewProjectForm />
      </div>

      <GrantPrivateRepoAccessButton />
    </div>
  );
}
