# Upstream — Product Overview

## What is it?

**Upstream is a verified focus tracker for developers.** It proves you actually worked — not just that a timer was running. Sessions are cross-checked against real GitHub commits and local IDE activity. Distractions are blocked across browser and desktop. And your honest work generates simulated funding for the open-source dependencies your projects rely on.

Think **RescueTime meets Open Collective meets a focus app** — but one that actually verifies, not just measures.

---

## What's built and working right now

### Core product

| Feature | Status | Detail |
|---------|--------|--------|
| **Verified focus sessions** | ✅ Live | Start 25/50/90-min sessions. Verified against GitHub commits + local IDE activity. |
| **Multi-platform** | ✅ Live | Web app, Chrome extension, and Electron desktop app. All stay in sync. |
| **Distraction blocking** | ✅ Live | Extension blocks sites mid-session. Desktop catches native apps the browser can't see. |
| **Streaks & gamification** | ✅ Live | Daily streaks, XP, levels, and achievements. Real game design, not a number on a page. |
| **Impact ledger** | ✅ Live | Every verified session simulates funding split across your project's npm dependencies. |
| **Developer twin** | ✅ Live | AI-reads your GitHub history and builds a public profile: strengths, weaknesses, habits, peak coding hours. Opt-in sharing. |
| **AI assistant** | ✅ Live | Built-in chat that can read your session history, projects, and ambient activity. Desktop version talks through the Claude CLI. |
| **Weekly insights** | ✅ Live | Analyzes your week: focus patterns, distraction trends, completion rate. |
| **Pro plan / trial** | ✅ Live | Free tier + Pro trial. Billing not live yet — everyone gets full access. |
| **Landing page** | ✅ Live | Hero video, feature grid, animated text, mobile-responsive. |

### Auth & onboarding

| Feature | Status | Detail |
|---------|--------|--------|
| **Email/password sign-up & sign-in** | ✅ Live | Works on deployed site. Confirmation-aware redirects. |
| **OAuth: GitHub, Google, X, Facebook** | ⚠️ Code ready | Buttons render. Needs OAuth app credentials in Supabase dashboard (3 min each). |
| **Onboarding flow** | ✅ Live | Post-signup name + email verification. Progressive disclosure. |
| **Profile system** | ✅ Live | Display name, avatar, notification prefs, plan tier, public profile toggle. |
| **Desktop app pairing** | ✅ Live | `?desktop=1` flow hands session from web to Electron app via custom protocol. |

### Notifications

| Channel | Status | Detail |
|---------|--------|--------|
| **Email** | ✅ Live | Resend API (primary) + Gmail SMTP (fallback). Free tier: 100/day. |
| **Telegram** | ✅ Code ready | Unlimited, free. Just needs bot token. |
| **WhatsApp** | ✅ Code ready | 1,000 msg/month free tier. Just needs Meta app setup. |
| **Web push** | ✅ Live | Browser native. VAPID keys needed for production. |
| **SMS (Twilio)** | 🗑️ Removed | Paid. Not priority. |

### Pages (39 routes deployed)

| Page | Path | Purpose |
|------|------|---------|
| Landing | `/` | Hero, features, how-it-works, CTA |
| Sign up | `/signup` | 4 social buttons + email form |
| Sign in | `/login` | 4 social buttons + email form |
| Dashboard | `/dashboard` | Greeting, streak, level, XP, onboarding, weekly insight, developer twin, live activity |
| Focus session | `/session` | Start/stop timer, project selection |
| Projects | `/projects` | CRUD, GitHub linking, deadline tracking |
| Profile | `/profile` | Avatar, stats, public twin link |
| Settings | `/settings` | Notification preferences, API keys |
| Plans | `/plans` | Free vs Pro comparison, trial management |
| Screen time | `/screen-time` | App usage analytics |
| Report | `/report/[period]` | Session reports |
| Share | `/share` | Shareable stats card |
| Public twin | `/u/[username]` | Opt-in developer profile from GitHub |
| Admin | `/admin` | DB check, test email, quick session tools |

---

## Technical architecture

```
┌─────────────────────────────────────────────────┐
│                  Upstream                        │
├────────────┬──────────────┬─────────────────────┤
│  apps/web  │apps/extension│  apps/desktop       │
│  Next.js   │  Chrome MV3  │  Electron           │
│  15.5      │  TypeScript  │  TypeScript         │
├────────────┴──────────────┴─────────────────────┤
│  packages/                                      │
│  ├── api-client    Supabase queries + types     │
│  ├── core          Business logic, gamification  │
│  └── ui            Shared React components       │
├─────────────────────────────────────────────────┤
│  supabase/                                      │
│  ├── Postgres      All data (17 migrations)      │
│  ├── Auth          Multi-provider OAuth + email  │
│  ├── Edge Functions Session verification (Deno)  │
│  └── RLS           Row-level security on all data│
└─────────────────────────────────────────────────┘
```

- **Frontend:** Next.js 15, React 18, Tailwind CSS, Framer Motion
- **Backend:** Supabase (Postgres + Auth + Edge Functions + RLS)
- **Desktop:** Electron with system tray, activity monitor, mascot
- **Extension:** Chrome Manifest V3, Supabase via chrome.storage
- **Deployment:** Vercel (production at stt-opal.vercel.app)
- **Monorepo:** npm workspaces, 106 files in last commit

### Database (17 migrations, fully normalized)

- `projects` — user projects with deadlines, GitHub URLs
- `focus_sessions` — sessions with status, verification, duration
- `distraction_events` — blocked sites/apps per session
- `dependency_snapshots` — npm deps per project
- `impact_ledger` — simulated funding per dep per session
- `profiles` — multi-provider auth, display names, plans, notifications
- `push_subscriptions` — web push endpoints
- `session_commits` — GitHub commits per session
- `ambient_activity` — hourly-bucketed app usage (session-less)
- `assistant_chats/commands/tts` — AI assistant history
- RLS on every table — users only see their own data

---

## What's at the live URL

**https://stt-opal.vercel.app** — deployed, production, SSL, global CDN.

- Landing page renders ✅
- Sign up / sign in pages render ✅
- Email/password auth works ✅
- Dashboard behind auth wall ✅
- All 39 routes deployed and passing ✅

---

## What needs 30 minutes to complete

1. **OAuth credentials in Supabase** — Create GitHub OAuth app, paste Client ID + Secret into Supabase dashboard. Google/X/Facebook are the same process. Code is ready, buttons render, just needs credentials.
2. **Redirect URLs** — Add `stt-opal.vercel.app` to Supabase auth URL config.
3. **Custom domain** — Buy `vigor.so` or any preferred domain (~$10/yr), add to Vercel.

---

## Competitive positioning

| | Upstream | RescueTime | Forest | Toggl Track | WakaTime |
|--|----------|------------|--------|-------------|----------|
| **Verification** | ✅ GitHub + local | ❌ | ❌ | ❌ | ✅ GitHub |
| **Distraction blocking** | ✅ Browser + desktop | ❌ | ✅ Phone only | ❌ | ❌ |
| **OSS funding** | ✅ Simulated ledger | ❌ | ❌ | ❌ | ❌ |
| **Developer twin (AI)** | ✅ Public profile | ❌ | ❌ | ❌ | ❌ |
| **Streaks + gamification** | ✅ | ❌ | ✅ Tree planting | ❌ | ❌ |
| **Multi-platform** | ✅ Web+Ext+Desktop | ✅ Desktop | 📱 Phone | ✅ Web+Desktop | 📊 IDE plugins |
| **Price** | Free (Pro coming) | $12/mo | $4 one-time | $10/mo | Free |

**The gap Upstream fills:** Nobody verifies that focus time was *real work*. Timers can be gamed. Upstream cross-references GitHub commits + local IDE activity to prove you actually shipped code.

---

## The brand

- **Name:** Upstream
- **Tagline:** "Prove your focus is real, fund the code you build on."
- **Package namespace:** `@focus-forge`
- **GitHub:** `DanisChaparov/upstream-app`
- **Live:** `stt-opal.vercel.app`
- **Supabase:** `cexmcxpdkdxlaqjwrxni.supabase.co`
