// Hand-written types mirroring supabase/migrations/*.sql. Keep in sync manually;
// regenerate with `supabase gen types typescript` once the project has a linked
// remote instance and this can be automated.
//
// These MUST be `type` aliases, not `interface`s: postgrest-js constrains Row
// to `Record<string, unknown>`, and TypeScript only treats plain object type
// literals (not interfaces) as assignable to an index-signature type like that.

export type ProjectRow = {
  id: string;
  user_id: string;
  name: string;
  deadline: string | null;
  github_repo_url: string | null;
  local_path: string | null;
  archived: boolean;
  created_at: string;
};

export type FocusSessionRow = {
  id: string;
  user_id: string;
  project_id: string | null;
  started_at: string;
  ended_at: string | null;
  planned_duration_min: number;
  status: "active" | "completed" | "broken";
  verified: boolean;
};

export type DistractionEventRow = {
  id: string;
  session_id: string;
  source: "extension" | "desktop";
  domain_or_app: string;
  occurred_at: string;
};

export type DependencySnapshotRow = {
  id: string;
  project_id: string;
  name: string;
  ecosystem: "npm";
  created_at: string;
};

export type ImpactLedgerRow = {
  id: string;
  user_id: string;
  session_id: string;
  dependency_id: string;
  simulated_amount: number;
  created_at: string;
};

export type SessionCommitRow = {
  id: string;
  session_id: string;
  sha: string;
  message: string;
  html_url: string;
  additions: number | null;
  deletions: number | null;
  committed_at: string | null;
  created_at: string;
};

export type SessionAppUsageRow = {
  id: string;
  session_id: string;
  app_name: string;
  seconds_active: number;
  created_at: string;
};

export type AssistantCommandType = "launch_app" | "run_dev_command" | "run_shell" | "type_text";
export type AssistantCommandStatus = "pending" | "approved" | "rejected" | "completed" | "failed";

export type AssistantCommandRow = {
  id: string;
  user_id: string;
  type: AssistantCommandType;
  payload: Record<string, unknown>;
  status: AssistantCommandStatus;
  result: string | null;
  created_at: string;
  completed_at: string | null;
};

export type AssistantChatStatus = "pending" | "completed" | "failed";

export type AssistantChatRow = {
  id: string;
  user_id: string;
  message: string;
  history: unknown;
  model: string | null;
  status: AssistantChatStatus;
  reply: string | null;
  created_at: string;
  completed_at: string | null;
};

export type AssistantTtsStatus = "pending" | "completed" | "failed";

export type AssistantTtsRow = {
  id: string;
  user_id: string;
  text: string;
  status: AssistantTtsStatus;
  audio_base64: string | null;
  error: string | null;
  created_at: string;
  completed_at: string | null;
};

export type ProfileRow = {
  id: string;
  github_access_token: string | null;
  github_username: string | null;
  /** User-provided Anthropic API key for free-tier AI features. */
  anthropic_api_key: string | null;
  /** Mirrors migration 0010. Only the service role can change it. */
  plan: "free" | "pro";
  plan_since: string | null;
  /** Opt-in flag for the shareable developer twin at /u/<username>. */
  public_profile: boolean;
  /** Free trial end date — set when user starts a trial, null otherwise. */
  trial_ends_at: string | null;
  /** Whether the user has already used their trial (prevents second trial). */
  trial_used: boolean;
  /** User's preferred display name. */
  display_name: string | null;
  /** Phone number for SMS notifications. */
  phone: string | null;
  /** Notification preferences. */
  notify_session_complete: boolean;
  notify_deadline: boolean;
  notify_achievement: boolean;
  notify_streak_risk: boolean;
  /** Which OAuth provider was used to sign up (github, google, facebook, twitter, email). Added in 0017. */
  auth_provider: string | null;
  /** Profile picture URL from the auth provider. Added in 0017. */
  avatar_url: string | null;
  updated_at: string;
};

export type AmbientActivityRow = {
  id: string;
  user_id: string;
  app_name: string;
  window_title: string | null;
  tracked_tool: string | null;
  is_ai_assisted: boolean;
  bucket_hour: string;
  seconds_focused: number;
  session_id: string | null;
  created_at: string;
};

export type PushSubscriptionRow = {
  id: string;
  user_id: string;
  endpoint: string;
  p256dh: string;
  auth: string;
  created_at: string;
};

export type Database = {
  public: {
    Tables: {
      projects: {
        Row: ProjectRow;
        Insert: Partial<ProjectRow> & { name: string; user_id: string };
        Update: Partial<ProjectRow>;
        Relationships: [];
      };
      focus_sessions: {
        Row: FocusSessionRow;
        Insert: Partial<FocusSessionRow> & { user_id: string; planned_duration_min: number };
        Update: Partial<FocusSessionRow>;
        Relationships: [
          {
            foreignKeyName: "focus_sessions_project_id_fkey";
            columns: ["project_id"];
            isOneToOne: false;
            referencedRelation: "projects";
            referencedColumns: ["id"];
          }
        ];
      };
      distraction_events: {
        Row: DistractionEventRow;
        Insert: Partial<DistractionEventRow> & { session_id: string; source: string; domain_or_app: string };
        Update: Partial<DistractionEventRow>;
        Relationships: [
          {
            foreignKeyName: "distraction_events_session_id_fkey";
            columns: ["session_id"];
            isOneToOne: false;
            referencedRelation: "focus_sessions";
            referencedColumns: ["id"];
          }
        ];
      };
      dependency_snapshots: {
        Row: DependencySnapshotRow;
        Insert: Partial<DependencySnapshotRow> & { project_id: string; name: string };
        Update: Partial<DependencySnapshotRow>;
        Relationships: [
          {
            foreignKeyName: "dependency_snapshots_project_id_fkey";
            columns: ["project_id"];
            isOneToOne: false;
            referencedRelation: "projects";
            referencedColumns: ["id"];
          }
        ];
      };
      impact_ledger: {
        Row: ImpactLedgerRow;
        Insert: Partial<ImpactLedgerRow> & {
          user_id: string;
          session_id: string;
          dependency_id: string;
          simulated_amount: number;
        };
        Update: Partial<ImpactLedgerRow>;
        Relationships: [
          {
            foreignKeyName: "impact_ledger_session_id_fkey";
            columns: ["session_id"];
            isOneToOne: false;
            referencedRelation: "focus_sessions";
            referencedColumns: ["id"];
          },
          {
            foreignKeyName: "impact_ledger_dependency_id_fkey";
            columns: ["dependency_id"];
            isOneToOne: false;
            referencedRelation: "dependency_snapshots";
            referencedColumns: ["id"];
          }
        ];
      };
      session_commits: {
        Row: SessionCommitRow;
        Insert: Partial<SessionCommitRow> & { session_id: string; sha: string; message: string; html_url: string };
        Update: Partial<SessionCommitRow>;
        Relationships: [
          {
            foreignKeyName: "session_commits_session_id_fkey";
            columns: ["session_id"];
            isOneToOne: false;
            referencedRelation: "focus_sessions";
            referencedColumns: ["id"];
          }
        ];
      };
      session_app_usage: {
        Row: SessionAppUsageRow;
        Insert: Partial<SessionAppUsageRow> & { session_id: string; app_name: string; seconds_active: number };
        Update: Partial<SessionAppUsageRow>;
        Relationships: [
          {
            foreignKeyName: "session_app_usage_session_id_fkey";
            columns: ["session_id"];
            isOneToOne: false;
            referencedRelation: "focus_sessions";
            referencedColumns: ["id"];
          }
        ];
      };
      assistant_commands: {
        Row: AssistantCommandRow;
        Insert: Partial<AssistantCommandRow> & {
          user_id: string;
          type: AssistantCommandType;
          payload: Record<string, unknown>;
        };
        Update: Partial<AssistantCommandRow>;
        Relationships: [];
      };
      assistant_chats: {
        Row: AssistantChatRow;
        Insert: Partial<AssistantChatRow> & { user_id: string; message: string };
        Update: Partial<AssistantChatRow>;
        Relationships: [];
      };
      assistant_tts: {
        Row: AssistantTtsRow;
        Insert: Partial<AssistantTtsRow> & { user_id: string; text: string };
        Update: Partial<AssistantTtsRow>;
        Relationships: [];
      };
      profiles: {
        Row: ProfileRow;
        Insert: Partial<ProfileRow> & { id: string };
        Update: Partial<ProfileRow>;
        Relationships: [];
      };
      push_subscriptions: {
        Row: PushSubscriptionRow;
        Insert: Partial<PushSubscriptionRow> & { user_id: string; endpoint: string; p256dh: string; auth: string };
        Update: Partial<PushSubscriptionRow>;
        Relationships: [];
      };
      ambient_activity: {
        Row: AmbientActivityRow;
        Insert: Partial<AmbientActivityRow> & { user_id: string; app_name: string; bucket_hour: string };
        Update: Partial<AmbientActivityRow>;
        Relationships: [
          {
            foreignKeyName: "ambient_activity_session_id_fkey";
            columns: ["session_id"];
            isOneToOne: false;
            referencedRelation: "focus_sessions";
            referencedColumns: ["id"];
          }
        ];
      };
    };
    Views: Record<string, never>;
    Functions: {
      // Security-definer lookup used by the public profile page. Exists so that
      // `profiles` — which holds GitHub tokens — never needs anonymous select.
      get_public_profile: {
        Args: { lookup_username: string };
        Returns: { github_username: string }[];
      };
    };
  };
};
