export interface TutorialEntry {
  what: string;
  how: string;
  status: "live" | "coming-soon";
}

export const TUTORIALS: Record<string, TutorialEntry> = {
  "Focus sessions & verification": {
    what: "Start a timed focus session and verify that you were actually working — not just a locked screen, but real code written and committed.",
    how: "1. Click \"Start a session\" from your dashboard\n2. Pick a project and a duration (25, 50, or 90 minutes)\n3. Work in your editor — the desktop app tracks your tools\n4. Click \"I'm done\" when time's up — we check commits and local git activity to verify you worked",
    status: "live",
  },
  "GitHub commit verification": {
    what: "Your sessions are verified against real commits that landed on your linked GitHub repo during the session window. A Pomodoro timer that only checks the clock can be gamed — commits can't.",
    how: "1. Link a GitHub repo when creating a project (or edit an existing one)\n2. Push commits to that repo during your focus session\n3. When you end the session, the verify-session function checks the GitHub API for commits authored by you in that time window\n4. If commits are found, the session is verified and contributes to your streak",
    status: "live",
  },
  "Distraction blocking (desktop + extension)": {
    what: "The desktop app monitors every visible window on your machine. The browser extension blocks distracting sites. Together they catch what the other misses — native apps and browser tabs.",
    how: "1. Install the desktop app from the Settings page\n2. Install the browser extension from the Chrome Web Store\n3. Start a focus session — the desktop app polls every 5 seconds and will break the session if it detects a distracting app or site open for more than 10 seconds\n4. The extension syncs with your session via ExtensionBridge so you don't need to log in twice",
    status: "live",
  },
  "Coding streaks & heatmap": {
    what: "Every day you complete at least one verified session extends your streak. A 12-week heatmap shows your activity patterns — a contribution graph, but for focused work sessions.",
    how: "1. Complete verified sessions — each day with at least one verified session extends your streak\n2. Your streak and heatmap appear automatically on your dashboard\n3. Streaks reset if you miss a day — the heatmap keeps your history",
    status: "live",
  },
  "Developer Twin (private + public share)": {
    what: "Analyzes your public GitHub repos to build a portrait of how you code — which languages you use, what time of day you commit, how many projects you finish, and whether you write tests and docs.",
    how: "1. Sign in — if you connect GitHub we'll read your public repo metadata (no code access needed)\n2. Visit your dashboard — your Twin appears automatically\n3. Optionally enable your public profile in Settings to share a card with your coding stats\n4. Your public profile is at /u/your-username",
    status: "live",
  },
  "AI assistant via your Claude Code": {
    what: "Chat with an AI that can see your session history, streaks, tool usage, and impact ledger. Uses your own Claude subscription or Anthropic API key — we don't charge you for your own AI usage.",
    how: "1. Install Claude Code on your machine, or add your Anthropic API key in Settings\n2. The assistant panel appears in the bottom-right of every page\n3. Ask questions like: \"How productive was I last week?\" or \"What tools did I use most this month?\"\n4. The assistant has access to your session data, commits, tools, and achievements",
    status: "live",
  },
  "5 built-in AI mentor interactions/day": {
    what: "Even without your own API key, you get 5 AI interactions per day — enough to check your progress, ask about your patterns, or get a nudge.",
    how: "1. Click the assistant panel in the bottom-right\n2. Ask anything about your work data — the first 5 interactions each day are free\n3. Pro users get 15/day. Or bring your own API key for unlimited access.",
    status: "live",
  },
  "3 active projects": {
    what: "Track up to 3 projects with optional GitHub repos, deadlines, and local folders for verification. Each project gets its own focus sessions, impact ledger contributions, and deadline alerts.",
    how: "1. Visit the Projects page and click \"Create project\"\n2. Give it a name, optionally add a GitHub repo URL, deadline, and local folder path\n3. Active projects appear in the session runner's project selector\n4. Archive old projects to free up slots — archived projects keep their history",
    status: "live",
  },
  "90-day history": {
    what: "Your dashboard shows the last 90 days of sessions, heatmap activity, and trends. Pro unlocks infinite history so you can look back at your entire journey.",
    how: "1. Your history is visible automatically on the dashboard\n2. The heatmap shows the last 12 weeks\n3. Recent sessions are listed below — click \"Show all\" to expand\n4. Upgrade to Pro for unlimited history and yearly comparisons",
    status: "live",
  },
  "Private repo verification": {
    what: "Verify focus sessions against private GitHub repositories, not just public ones. Requires granting the Aztrx GitHub app access to your private repos.",
    how: "1. Upgrade to Pro (or start a trial)\n2. Link a private GitHub repo to a project\n3. Click \"Grant private repo access\" on the Projects page\n4. Complete a session — verification checks the private repo's commits just like a public one",
    status: "live",
  },
  "Exportable proof of hours": {
    what: "Export a signed, cryptographically verifiable record of your verified focus hours — designed for freelancers who need to bill clients with proof of work.",
    how: "",
    status: "coming-soon",
  },
  "Ambient activity tracking": {
    what: "The desktop app monitors your editor and AI-tool usage even when you don't have a focus session running. This builds a complete picture of your work patterns — the data foundation for the AI mentor's insights.",
    how: "1. Upgrade to Pro (or start a trial)\n2. Keep the desktop app running in the background\n3. Ambient data is collected automatically — no manual start/stop needed\n4. View your hourly activity timeline on the dashboard (Pro feature)",
    status: "live",
  },
  "Developer Profile (strengths/weaknesses)": {
    what: "AI-powered analysis of your coding patterns — identifies your strengths (consistency, polyglot skills, deep work habits) and weaknesses (low testing, too many unfinished projects) with concrete growth recommendations.",
    how: "1. Upgrade to Pro (or start a trial)\n2. Complete several verified sessions — the more data, the better the profile\n3. Your Developer Profile card appears on the dashboard automatically\n4. It updates as you accumulate more sessions — your strengths and growth path evolve with you",
    status: "live",
  },
  'Monthly "Wrapped" reports': {
    what: "A \"Spotify Wrapped\" for your code — each month you get a shareable report with your total sessions, focus minutes, developer type (Night Builder, Morning Architect, Polyglot Explorer, etc.), achievements, and highlights.",
    how: "1. Upgrade to Pro (or start a trial)\n2. Complete verified sessions throughout the month\n3. Visit /report/monthly to see your report\n4. The report is purely data-driven — no AI generation, so it's always accurate",
    status: "live",
  },
  "Yearly report with growth trajectory": {
    what: "Your year in code — month-by-month session counts, total focus hours, language evolution, and a growth trajectory that shows how you've changed as a developer over 12 months.",
    how: "1. Upgrade to Pro (or start a trial)\n2. Complete verified sessions over the year\n3. Visit /report/yearly to see your year-in-review\n4. Month-by-month bars show your activity trends",
    status: "live",
  },
  "Skill graph & learning path": {
    what: "A visual progression graph showing your language and technology skills over time, with a recommended learning path based on your current stack and goals.",
    how: "",
    status: "coming-soon",
  },
  "15 AI mentor interactions/day": {
    what: "Pro users get 15 AI mentor interactions per day — roughly 10 contextual nudges based on your activity patterns plus 5 deep-dive analyses you can trigger by asking questions.",
    how: "1. Upgrade to Pro — the limit increases from 5 to 15 automatically\n2. Use the assistant panel as you normally would\n3. The counter resets daily — you'll never be locked out of your data",
    status: "live",
  },
  "Ambient timeline": {
    what: "An hourly breakdown of your activity throughout the day, showing when you're most productive, which tools you use at different times, and your natural work rhythm.",
    how: "1. Upgrade to Pro (or start a trial)\n2. Keep the desktop app running — it collects activity data hourly\n3. The timeline appears on your dashboard automatically\n4. Use it to find your peak productivity hours and schedule deep work accordingly",
    status: "live",
  },
};
