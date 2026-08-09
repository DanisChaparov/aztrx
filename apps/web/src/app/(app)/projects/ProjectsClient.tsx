"use client";

import { useState } from "react";
import { Github, Clock, AlertTriangle, FolderGit, Search, Edit, Archive } from "lucide-react";
import type { Project } from "@focus-forge/core";
import { DeadlineCountdown } from "@/components/DeadlineCountdown";
import { GrantPrivateRepoAccessButton } from "@/components/GrantPrivateRepoAccessButton";
import { NewProjectForm } from "@/components/NewProjectForm";
import { EditProjectModal } from "@/components/EditProjectModal";
import { DeadlineChecker } from "./DeadlineChecker";
import { ArchiveButton } from "./ArchiveButton";

/**
 * Client-side project list with search, inline edit, and archive toggle.
 * Receives server-fetched data as props so the page shell remains a server component.
 */
export function ProjectsClient({ projects }: { projects: Project[] }) {
  const [search, setSearch] = useState("");
  const [showArchived, setShowArchived] = useState(false);
  const [editingProject, setEditingProject] = useState<Project | null>(null);

  const active = projects.filter((p) => !p.archived);
  const archived = projects.filter((p) => p.archived);

  // Apply search filter
  const filteredActive = search.trim()
    ? active.filter((p) => p.name.toLowerCase().includes(search.toLowerCase()))
    : active;

  const overdue = filteredActive.filter(
    (p) => p.deadline && new Date(p.deadline) < new Date()
  );
  const approaching = filteredActive.filter((p) => {
    if (!p.deadline) return false;
    const days = Math.ceil(
      (new Date(p.deadline).getTime() - Date.now()) / (1000 * 60 * 60 * 24)
    );
    return days >= 0 && days <= 3;
  });

  return (
    <div className="flex flex-col gap-8 pt-8">
      <div className="flex items-center justify-between">
        <h1 className="font-instrument-serif text-3xl text-white">Projects</h1>
      </div>

      {/* Search */}
      {active.length > 0 && (
        <div className="relative">
          <Search
            size={15}
            className="absolute left-3.5 top-1/2 -translate-y-1/2 text-neutral-500"
          />
          <input
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Search projects…"
            className="w-full rounded-xl border border-white/10 bg-white/[0.03] py-2.5 pl-10 pr-4 font-inter text-sm text-white outline-none transition-colors focus:border-[#3B82F6] placeholder:text-neutral-500"
          />
        </div>
      )}

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
                <span className="text-neutral-500">
                  Archive it below or set a new deadline.
                </span>
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
                  We{"'"}ll notify you 24 hours before.
                </span>
              </li>
            ))}
          </ul>
        </div>
      )}

      {/* Deadline notification checker */}
      <DeadlineChecker projects={active} />

      {/* Active projects */}
      <div className="flex flex-col gap-2">
        {filteredActive.length === 0 && (
          <p className="font-inter text-sm text-neutral-500">
            {search.trim()
              ? "No projects match your search."
              : "No projects yet — create one below to start a focus session against it."}
          </p>
        )}
        {filteredActive.map((project) => (
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
                <button
                  type="button"
                  onClick={() => setEditingProject(project)}
                  className="truncate text-left hover:text-[#60A5FA] transition-colors"
                  title="Click to edit"
                >
                  {project.name}
                </button>
                {project.deadline && new Date(project.deadline) < new Date() && (
                  <span className="shrink-0 rounded-full bg-red-400/10 px-2 py-0.5 font-inter text-[10px] text-red-400">
                    overdue
                  </span>
                )}
              </div>
              <div className="mt-0.5 flex items-center gap-1.5 font-inter text-xs">
                {project.deadline && <DeadlineCountdown deadline={project.deadline} />}
                {project.deadline && <span className="text-neutral-600">·</span>}
                {project.githubRepoUrl ? (
                  <span className="flex items-center gap-1 text-[#60A5FA]">
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
              <button
                type="button"
                onClick={() => setEditingProject(project)}
                className="rounded-lg p-1.5 text-neutral-500 hover:text-white hover:bg-white/5 transition-colors"
                title="Edit project"
              >
                <Edit size={14} />
              </button>
              <ArchiveButton
                projectId={project.id}
                projectName={project.name}
                action="archive"
              />
              {project.deadline && new Date(project.deadline) < new Date() && (
                <ArchiveButton
                  projectId={project.id}
                  projectName={project.name}
                  action="delete"
                />
              )}
            </div>
          </div>
        ))}
      </div>

      {/* Archived projects toggle */}
      {archived.length > 0 && (
        <div>
          <button
            type="button"
            onClick={() => setShowArchived(!showArchived)}
            className="flex items-center gap-2 font-manrope text-sm text-neutral-400 hover:text-white transition-colors"
          >
            <Archive size={14} />
            {showArchived ? "Hide archived" : `Show archived (${archived.length})`}
          </button>
          {showArchived && (
            <div className="mt-3 flex flex-col gap-2">
              {archived.map((project) => (
                <div
                  key={project.id}
                  className="glass-panel flex items-center justify-between px-4 py-3 opacity-60"
                >
                  <div className="min-w-0 flex-1">
                    <div className="flex items-center gap-2">
                      <span className="font-manrope text-sm font-medium text-neutral-400 truncate">
                        {project.name}
                      </span>
                      <span className="shrink-0 rounded-full bg-neutral-500/10 px-2 py-0.5 font-inter text-[10px] text-neutral-500">
                        archived
                      </span>
                    </div>
                  </div>
                  <ArchiveButton
                    projectId={project.id}
                    projectName={project.name}
                    action="delete"
                  />
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      {/* New project form */}
      <div>
        <h2 className="mb-3 font-manrope text-sm font-medium text-neutral-400">
          New project
        </h2>
        <NewProjectForm />
      </div>

      <GrantPrivateRepoAccessButton />

      {/* Edit modal */}
      {editingProject && (
        <EditProjectModal
          project={editingProject}
          onClose={() => setEditingProject(null)}
        />
      )}
    </div>
  );
}
