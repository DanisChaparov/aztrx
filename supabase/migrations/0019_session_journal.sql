-- Session journal: notes + tags so users can reflect on what they built.
-- Weekly goals: a simple session-count target that resets Mondays.

ALTER TABLE focus_sessions ADD COLUMN IF NOT EXISTS notes text;
ALTER TABLE focus_sessions ADD COLUMN IF NOT EXISTS tags text[];

ALTER TABLE profiles ADD COLUMN IF NOT EXISTS weekly_goal_sessions integer;
