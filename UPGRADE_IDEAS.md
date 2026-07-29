# Upgrade Ideas

Concrete next steps grounded in the current codebase, not generic advice. Ordered roughly by how much they change the product's story vs. how much they cost to build.

## 1. Weight the impact split by real usage, not an even split

`packages/core/src/impact.ts` currently splits a session's simulated funding evenly across every dependency a linked repo has (`computeImpactSplit`). That's fine for a demo, but it's the single easiest thing to make more honest: parse the actual `import`/`require` statements in the repo (or at minimum weight by each dependency's declared version pinning / `package.json` position) so a project's most-relied-on package gets funded more than an unused devDependency. This is the difference between "we fund your dependencies" and "we fund the dependencies you *actually lean on*" — a much stronger pitch, and the parsing infrastructure (reading a repo's `package.json`) already has to exist for `dependency_snapshots` to work at all.

## 2. Use `projects.local_path` for verification, not just dev commands

The `local_path` field (added to `projects` this session) is currently only used by `run_dev_command`/`run_shell_command` in the assistant. But `apps/desktop` already has real filesystem access to that folder — it could compute a real `git diff --stat` for the session window as a *second* verification signal alongside the GitHub API check in `supabase/functions/verify-session/index.ts`. Right now verification is 100% dependent on commits having landed and been pushed during the session; a lot of real focused work (refactoring, debugging, writing tests that don't pass yet) never becomes a commit in that exact window. Local diff activity would catch genuine work that GitHub-only verification currently misses — directly answering the "more things than just GitHub" ask.

## 3. Proactive nudges from the desktop widget, not just passive tracking

`apps/desktop/src/activityMonitor.ts` now tracks IDE/AI-tool usage (Cursor, Claude Code CLI, etc.) even outside an active focus session — but that data is currently pure telemetry with no product behavior attached to it. The highest-leverage "Jarvis" upgrade: if the widget notices sustained activity in a tracked tool (say, 20+ minutes in Cursor) with no focus session running, fire a native notification offering to start one and backfill the elapsed time. This turns the monitoring that already exists into the thing that makes the app feel alive without the user opening it — which is the actual "Tony Stark, ten monitors" pitch from the original product idea, not just a UI screen with numbers on it.

## 4. Real payouts (Stripe Connect), scoped as an explicit opt-in tier

The impact ledger is intentionally simulated for v1 — the honest next step isn't "make it real everywhere," it's a narrow, explicit "Sponsor for real" toggle per project: Stripe Connect onboarding for the maintainer (pulled from the repo's `FUNDING.yml` or GitHub Sponsors listing if one exists), and a monthly cap the user sets. Keep the simulated ledger as the default free experience; real money is a deliberate, separate action a user opts into per-project, not a blanket migration. This avoids the compliance surface area of KYC-for-all-users while still making the core promise real for anyone who wants it.

## 5. A second, lighter voice for the assistant depending on context

Kokoro TTS is wired up now, but every reply uses the same voice at the same pace regardless of what's being said. A one-line status update ("streak's at 2 days") reads very differently from a longer explanation. Worth trying: a shorter/faster synthesis pass for single-fact replies (under ~15 words) versus the current full pass for longer ones — cheap to add given the pipeline already exists, and it's the difference between the assistant feeling like a voice assistant versus a text-to-speech reader bolted onto a chat log.
