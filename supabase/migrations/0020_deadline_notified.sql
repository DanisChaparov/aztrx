-- Track when a deadline notification was last sent for a project,
-- so cron can avoid duplicate notifications.
ALTER TABLE public.projects ADD COLUMN IF NOT EXISTS deadline_notified_at timestamptz;
