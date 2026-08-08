// Predefined session tags. Users pick from these when completing a session.
// Designed to cover both traditional devs and vibe coders.

export const SESSION_TAGS = [
  { value: "frontend", label: "Frontend", emoji: "🎨" },
  { value: "backend", label: "Backend", emoji: "⚙️" },
  { value: "devops", label: "DevOps", emoji: "🚀" },
  { value: "bugfix", label: "Bug fix", emoji: "🐛" },
  { value: "learning", label: "Learning", emoji: "📚" },
  { value: "design", label: "Design", emoji: "🎯" },
  { value: "writing", label: "Writing", emoji: "✍️" },
  { value: "meeting", label: "Meeting", emoji: "💬" },
  { value: "review", label: "Code review", emoji: "🔍" },
  { value: "ai-prompting", label: "AI prompting", emoji: "🤖" },
  { value: "refactor", label: "Refactor", emoji: "♻️" },
  { value: "testing", label: "Testing", emoji: "🧪" },
] as const;

export type SessionTag = (typeof SESSION_TAGS)[number]["value"];
