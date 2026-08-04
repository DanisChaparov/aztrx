import { GitCommitHorizontal } from "lucide-react";

export interface CommitListItem {
  sha: string;
  message: string;
  htmlUrl: string;
  additions: number | null;
  deletions: number | null;
  committedAt: string | null;
}

export function CommitList({ commits }: { commits: CommitListItem[] }) {
  if (commits.length === 0) return null;

  return (
    <ul className="flex w-full flex-col gap-1.5 text-left">
      {commits.map((commit) => (
        <li key={commit.sha}>
          <a
            href={commit.htmlUrl}
            target="_blank"
            rel="noreferrer"
            className="glass-panel flex items-center gap-2 px-3 py-2 transition-colors hover:bg-white/[0.06]"
          >
            <GitCommitHorizontal size={13} className="shrink-0 text-[#60A5FA]" />
            <span className="min-w-0 flex-1 truncate font-inter text-xs text-neutral-300">{commit.message}</span>
            {(commit.additions !== null || commit.deletions !== null) && (
              <span className="flex shrink-0 items-center gap-1.5 font-inter text-[11px] tabular-nums">
                {commit.additions !== null && <span className="text-[#60A5FA]">+{commit.additions}</span>}
                {commit.deletions !== null && <span className="text-red-400">-{commit.deletions}</span>}
              </span>
            )}
            <span className="shrink-0 font-inter text-[11px] text-neutral-500">{commit.sha.slice(0, 7)}</span>
          </a>
        </li>
      ))}
    </ul>
  );
}
