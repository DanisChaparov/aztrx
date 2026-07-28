export type SessionStatus = "active" | "completed" | "broken";

export type DistractionSource = "extension" | "desktop";

export interface Project {
  id: string;
  userId: string;
  name: string;
  deadline: string | null;
  githubRepoUrl: string | null;
  localPath: string | null;
  createdAt: string;
}

export interface FocusSession {
  id: string;
  userId: string;
  projectId: string | null;
  startedAt: string;
  endedAt: string | null;
  plannedDurationMin: number;
  status: SessionStatus;
  verified: boolean;
}

export interface DistractionEvent {
  id: string;
  sessionId: string;
  source: DistractionSource;
  domainOrApp: string;
  occurredAt: string;
}

export type DependencyEcosystem = "npm";

export interface DependencySnapshot {
  id: string;
  projectId: string;
  name: string;
  ecosystem: DependencyEcosystem;
}

export interface ImpactLedgerEntry {
  id: string;
  userId: string;
  sessionId: string;
  dependencyId: string;
  simulatedAmount: number;
}
