# How to use this file
Copy everything **below the divider** and paste it as your first message to Antigravity (or Claude Code / any agentic coding tool). It's written as a direct instruction to the agent, so don't edit the voice — just fill in the one placeholder (`YOUR_REPO_NAME`) before sending it.

**Also attach `problems.json`** (generated alongside this file) and tell the agent to save it at `src/data/problems.json` in the new repo. It's your actual pattern sheet — 15 categories, 94 patterns, 412 problem entries (389 unique LeetCode problems) — already parsed into the exact structure §3.8 and §6 expect, with a link to each problem generated for you. Don't ask the agent to re-transcribe the sheet from scratch; it'll introduce errors a hand-parsed file won't have.

---

# BUILD PROMPT: Personal Daily Progress Tracker (Static, GitHub Pages, No Backend)

## 1. Project Brief

Build a personal, single-user daily accountability tracker — a self-hosted, LeetCode-style progress dashboard. It must be a **fully static site** (HTML/CSS/JS bundle only) that runs entirely in the browser, with **no server, no database, no Vercel/Render/Netlify functions**. It will be deployed via **GitHub Pages**, built and published automatically by a **GitHub Actions** workflow.

All data (tasks, streaks, goals) lives client-side in the browser (`localStorage`), with JSON export/import for backup, and an optional GitHub Gist sync so data can follow the user across devices — still with zero custom backend code.

The core metaphor is LeetCode's/GitHub's contribution calendar: a full-year grid of cells, one per day, that fills in as the user logs their daily work, building a visible streak.

## 2. Default Daily Categories (seed data)

Seed the app with these six categories on first run (user can edit, disable, reorder, or add more later):

| id | name | daily target | unit |
|---|---|---|---|
| `leetcode` | LeetCode | 5 | problems |
| `java` | Java Concept | 1 | concept (thorough) |
| `aptitude` | Aptitude | 5 | questions |
| `personal-project` | Personal Project | 1 | session |
| `major-project` | Major Project | 1 | session |
| `exercise` | Exercise | 1 | session |

Each category gets its own accent color and icon (see Design Direction, §5).

## 3. Functional Requirements

### 3.1 Daily Checklist
- A "Today" view lists every active category as a card with a checkbox/toggle.
- Ticking a card marks that category `done` for the currently selected date, with an optional numeric count (e.g., "5 problems") and an optional short note.
- A date picker lets the user select **any past or future date** and log/edit entries for it — this is for backfilling missed days or planning ahead, not just "today."
- Un-ticking removes/reverts the entry for that date.
- Ability to add a brand-new category at any time (name, color, icon, optional daily target/unit), and to archive (not hard-delete) old ones so history isn't lost.

### 3.2 Streak Calendar (the centerpiece)
- A full-year, GitHub-contribution-style grid: one cell per day, scrollable/paginated by year.
- **Each cell is subdivided into up to 6 micro-segments — one per active category** — so a single glance shows *which* categories were done that day, not just a generic intensity color. (This is the app's signature visual; see §5.)
- Hovering/tapping a cell shows a tooltip/popover with the full breakdown for that date and a shortcut to edit it.
- A filter lets the user view the heatmap for a single category only (falls back to plain intensity shading in that mode) or the combined view.
- Compute and display: **current streak**, **longest streak ever**, and **completion rate** (e.g., trailing 30/90 days), same as LeetCode's stat line. Define "streak" clearly (e.g., a day counts if at least one category was completed, OR require all-categories — make this a togglable setting, default: at least one).

### 3.3 Goals + Sidebar Timers
- User can create **weekly** or **monthly** goals: title, optional linked category, target value, start date, end date (deadline).
- A **persistent sidebar widget** lists all active goals sorted by nearest deadline, each with a live-updating countdown (days/hours/minutes remaining) and a progress bar.
- Progress auto-updates when linked category entries accumulate (e.g., a "Solve 30 LeetCode problems this month" goal fills as `leetcode` counts are logged); unlinked goals can be updated manually.
- Goals auto-flip to `completed` when target is hit, and to `failed`/`missed` when the deadline passes incomplete (shown, not deleted — useful history).
- Visual/toast nudge when a goal is within 24 hours of deadline and still incomplete.

### 3.4 Dashboard / Stats
- Overview cards: current streak, longest streak, total completions, this week's completion %.
- A category breakdown chart (bar or radial) showing completion counts per category over a selectable range (7/30/90 days/all-time).
- A trend line chart of daily completion % over time.

### 3.5 Data Persistence & Sync
- **Primary storage:** `localStorage`, wrapped behind a small storage utility (so it can be swapped for `IndexedDB` later if data grows large — no UI code should call `localStorage` directly).
- **Backup:** "Export data" downloads a single JSON file with the entire state; "Import data" restores from that file (with a confirmation step, since it overwrites).
- **Optional cross-device sync (Phase 2, not required for MVP):** user can paste a GitHub Personal Access Token with `gist` scope in Settings; the app then pushes/pulls its state JSON to/from a private Gist via the GitHub REST API directly from the browser. The token is stored only in the user's own `localStorage` and is never sent anywhere except `api.github.com`. Make this clearly optional and off by default.

### 3.6 Settings
- Theme: light / dark / system, persisted.
- Week starts on Sunday or Monday.
- Streak rule toggle (any-category vs all-categories, see §3.2).
- Data export/import controls.
- Optional GitHub Gist sync controls (token entry, connect/disconnect, last-synced timestamp).

### 3.7 DSA Pattern Practice Queue (problem-by-problem runner)

This is what turns "solve 5 LeetCode problems" from a self-managed todo into a self-loading queue. It's built from the attached `problems.json` — the user's own pattern sheet, already parsed: 15 categories → 94 named patterns → 412 problem entries (389 unique LeetCode problems), each with a generated LeetCode URL. Ship that file as-is at `src/data/problems.json`; treat it as static seed data, never regenerate or re-transcribe it.

- **Current Problem card** — the main practice surface. Shows the pattern name + its category, the LeetCode problem number and title, a "Solve on LeetCode ↗" link (opens `url` from the data file in a new tab), and one primary action: **"Mark solved & load next."**
- **Auto-advance:** clicking that action records the solve (pattern id + problem number + today's date), increments today's `leetcode` category count/streak entry from §3.1, and immediately swaps in the next problem — no reload, no manual re-picking. This is what lets the user keep going past their daily 5 if they're on a roll, instead of stopping dead at the quota.
- **Daily batch, not a hard stop:** surface the day's suggested batch (default size 5, editable in Settings) but don't lock the UI after it's done — a "Keep going" control pulls further from the same queue. The batch size only decides what's *suggested*; it never caps how many problems can be solved and counted in a day.
- **Ordering:** default queue order follows the sheet's own order (category → pattern → problem, i.e. the order already in `problems.json`). Also support: jump straight to a chosen pattern/category from the Pattern Browser below, skip a problem (sends it to the back of the queue, doesn't drop it), and a "shuffle remaining" toggle for variety.
- **Pattern Browser (secondary view):** a collapsible tree — category → pattern → problems — each problem row shows a checkmark once solved and a small "video" badge when the pattern's `hasVideo` flag is true; clicking a problem jumps the queue pointer to it.
- **Progress rollups:** an overall "X / 389 unique problems solved" stat, plus a slim progress bar per pattern in the browser (e.g. "Kadane's Algorithm — 3/5 solved").
- **Repeat problems across patterns:** a handful of problems intentionally appear under more than one pattern in the sheet (e.g. #200 Number of Islands shows up under both DFS and Union-Find, since the point is practicing it with a different technique). Track "solved" per `(patternId, problemNumber)` pair for queue/checkmark purposes, but dedupe by problem number for the headline "unique problems solved" stat so it isn't inflated.
- Persist queue position, solved set, and skipped list the same way as everything else — through the storage utility in §3.5, included in export/import.

### 3.8 Phase 2 / Nice-to-Have (implement if time allows, don't let these block MVP)
- Achievement badges (7-day streak, 30-day streak, 100 total problems, etc.).
- Daily browser notification reminder at a user-set time (`Notification` API), with graceful no-op if permission denied.
- A short optional note/journal field per day.
- Keyboard shortcuts (e.g., digits 1–6 toggle the six default categories for today).
- PWA manifest + service worker so it's installable and works fully offline.
- Weekly auto-generated summary ("This week: 4/7 days, 22 problems, 1 goal completed").

## 4. Tech Stack (use exactly this unless there's a strong reason not to)

- **Build tool:** Vite
- **Framework:** React 18 + TypeScript
- **Styling:** Tailwind CSS (utility-first, fast to keep consistent)
- **State management:** Zustand, with its `persist` middleware wired to the storage utility from §3.5
- **Icons:** `lucide-react`
- **Dates:** `date-fns`
- **Animation:** Framer Motion — used sparingly (see §5)
- **Charts:** a lightweight library (`recharts` is fine) for the trend/breakdown charts in §3.4
- **Heatmap:** hand-built SVG/CSS grid component (don't pull in a heavy calendar-heatmap dependency — the split-segment cells in §3.2 are custom anyway)
- **Routing:** none needed — keep this a single-page app with in-memory tab/view state (Dashboard / Calendar / Goals / Settings). This avoids GitHub Pages' client-side-routing 404 problem entirely; don't add `react-router` unless the app grows enough to need shareable URLs.
- **Deployment:** GitHub Actions → GitHub Pages (official `actions/deploy-pages`, not a `gh-pages` branch push)

## 5. Design Direction

Don't default to generic AI-template looks (cream + terracotta serif, near-black + acid-green, or a hairline-rule broadsheet layout). This is a developer's personal tool, so ground the identity in that world — precise, technical, a little "terminal" — without being a plain GitHub clone.

**Color tokens:**
| token | hex | use |
|---|---|---|
| `bg` | `#0F1419` | app background (ink navy, not pure black) |
| `surface` | `#161B22` | cards/panels |
| `text-primary` | `#E6EDF3` | main text |
| `text-muted` | `#8B949E` | secondary text |
| `accent-streak` | `#E8590C` | streak flame/highlight, "today" marker |
| category hues | `#4C9AFF` leetcode · `#9F7AEA` java · `#F6AD55` aptitude · `#48BB78` personal-project · `#F56565` major-project · `#38B2AC` exercise |

Light theme: invert to a warm-white `#F6F7F9` background with `#1A1F26` text, keep the same accent/category hues (check contrast, adjust lightness ~10% if needed for AA contrast).

**Typography:**
- Display/headings: **Space Grotesk** — geometric, slightly technical, distinct from generic Inter-everywhere UIs.
- Body/UI text: **Inter**.
- Numbers, dates, countdown timers, streak counts: **JetBrains Mono** — reinforces the "coding tracker" identity and makes stats feel precise.

**Layout:** fixed left sidebar (nav + goals/timers) + scrollable main content. The streak calendar is the hero of the Dashboard — full-width, above the fold, larger than a typical GitHub embed.

```
┌──────────────────────────────────────────────┐
│ Header: wordmark · streak flame · theme toggle│
├───────────┬────────────────────────────────────┤
│ Sidebar   │  Today's Checklist (6 cards)        │
│ - Nav     │  ────────────────────────────────  │
│ - Active  │  Streak Calendar (hero, full-width, │
│   goals + │   split-segment cells)              │
│   live    │  ────────────────────────────────  │
│   timers  │  Stats row + charts                 │
└───────────┴────────────────────────────────────┘
```

**Signature element:** the split-segment streak cell described in §3.2 — each day's square divides into up to 6 slivers, one per category, lighting up in that category's hue only when done. This is the one place to spend visual boldness; keep everything else (cards, buttons, spacing) quiet and disciplined.

**Motion:** restrained. A cell segment fills with a quick eased transition on check; goal progress bars animate on value change; card hover gets a subtle elevation. No scroll gimmicks — this is a daily-use utility, not a landing page. Respect `prefers-reduced-motion`.

**Quality floor:** responsive down to mobile (sidebar collapses to a bottom sheet or drawer), visible keyboard focus states everywhere, don't rely on color alone to distinguish categories (pair with icon/label), AA contrast on all text/background pairs.

**Copy voice:** active voice, plain verbs, no filler. Buttons say what they do ("Mark done," "Add goal," "Export backup"). Empty states invite action, e.g. *"No entry for Aug 3 yet — tap a category to log it."* Errors state what happened and how to fix it, without apologizing.

## 6. Data Model

```typescript
export interface Category {
  id: string;
  name: string;
  color: string;        // hex
  icon: string;          // lucide-react icon name
  dailyTarget?: number;  // e.g. 5
  unit?: string;         // "problems", "questions", "session"
  archived: boolean;
  createdAt: string;     // ISO date
}

export interface DayEntry {
  date: string; // "YYYY-MM-DD"
  tasks: {
    [categoryId: string]: {
      done: boolean;
      count?: number;
      note?: string;
    };
  };
}

export interface Goal {
  id: string;
  title: string;
  type: "weekly" | "monthly" | "custom";
  categoryId?: string;    // omit for manual-progress goals
  targetValue: number;
  currentValue: number;
  startDate: string;      // ISO date
  endDate: string;        // ISO date — drives the sidebar countdown
  status: "active" | "completed" | "failed";
}

export interface Settings {
  theme: "light" | "dark" | "system";
  weekStartsOn: "sunday" | "monday";
  streakRule: "any-category" | "all-categories";
  dailyBatchSize: number;  // default 5, see §3.7
  reminderTime?: string;  // "HH:mm"
  githubSync?: {
    enabled: boolean;
    gistId?: string;
  };
}

// --- §3.7 practice queue, backed by src/data/problems.json (read-only seed data) ---

export interface ProblemSeed {
  id: string;       // e.g. "p31-53"  ({patternId}-{problemNumber})
  number: number;   // LeetCode problem number, e.g. 53
  title: string;
  slug: string;
  url: string;
}

export interface PatternSeed {
  id: string;        // e.g. "p31"
  number: number;
  name: string;
  hasVideo: boolean;
  problems: ProblemSeed[];
}

export interface CategorySeed {
  id: string;         // e.g. "dynamic-programming"
  roman: string;       // "V"
  name: string;
  patterns: PatternSeed[];
}

export interface ProblemsFile {
  meta: { title: string; author: string; totalPatterns: number; totalUniqueProblems: number; [k: string]: unknown };
  categories: CategorySeed[];
}

export interface ProblemSolve {
  patternId: string;      // e.g. "p31"
  problemNumber: number;  // e.g. 53
  solvedAt: string;       // ISO date "YYYY-MM-DD"
}

export interface PracticeState {
  queueOrder: string[];       // ordered "patternId:problemNumber" keys, built once from problems.json on load
  queuePointer: number;        // index of the current problem in queueOrder
  todayBatchStart: number;     // index where today's suggested batch began; resets on a new day
  solves: Record<string, ProblemSolve>;  // keyed by "patternId:problemNumber"
  skipped: string[];           // keys sent to the back of the queue
}
```

## 7. File / Folder Architecture

```
YOUR_REPO_NAME/
├── .github/
│   └── workflows/
│       └── deploy.yml          # build + publish to GitHub Pages
├── public/
│   ├── favicon.svg
│   └── manifest.json           # PWA manifest (Phase 2)
├── src/
│   ├── main.tsx                # React root
│   ├── App.tsx                 # top-level layout + view switcher (no router)
│   ├── index.css                # Tailwind entry + font imports + CSS vars for tokens
│   ├── data/
│   │   └── problems.json        # attached, provided — the parsed pattern sheet (§3.7). Copy as-is.
│   ├── types/
│   │   └── index.ts             # Category, DayEntry, Goal, Settings, ProblemsFile, PracticeState (§6)
│   ├── store/
│   │   ├── useTaskStore.ts      # categories + dayEntries, Zustand + persist
│   │   ├── useGoalStore.ts      # goals CRUD + progress derivation
│   │   ├── useSettingsStore.ts  # theme, streak rule, batch size, sync settings
│   │   └── usePracticeStore.ts  # queue pointer, solves, skipped — reads data/problems.json (§3.7)
│   ├── lib/
│   │   ├── storage.ts           # localStorage wrapper all stores go through
│   │   ├── streakUtils.ts       # current/longest streak, completion % calc
│   │   ├── dateUtils.ts         # date-fns helpers, week/month range builders
│   │   ├── githubSync.ts        # optional Gist push/pull (Phase 2)
│   │   └── problemUtils.ts      # flatten problems.json -> queueOrder, getNext(), skip(), pattern progress %, dedupe-by-number stat
│   ├── hooks/
│   │   ├── useCountdown.ts      # live-updating time-remaining for a goal
│   │   └── useStreak.ts         # derived streak stats for a category or overall
│   ├── components/
│   │   ├── layout/
│   │   │   ├── Header.tsx
│   │   │   ├── Sidebar.tsx
│   │   │   └── Layout.tsx
│   │   ├── checklist/
│   │   │   ├── DailyChecklist.tsx
│   │   │   ├── TaskCard.tsx
│   │   │   ├── DatePicker.tsx
│   │   │   └── AddCategoryModal.tsx
│   │   ├── calendar/
│   │   │   ├── StreakHeatmap.tsx
│   │   │   ├── HeatmapCell.tsx      # split-segment cell (§5 signature)
│   │   │   └── DateDetailPopover.tsx
│   │   ├── goals/
│   │   │   ├── GoalList.tsx
│   │   │   ├── GoalCard.tsx
│   │   │   ├── GoalTimer.tsx        # sidebar countdown widget
│   │   │   └── AddGoalModal.tsx
│   │   ├── practice/
│   │   │   ├── CurrentProblemCard.tsx   # §3.7 hero: current problem + "Mark solved & load next"
│   │   │   ├── DailyBatchPanel.tsx      # today's batch progress + "Keep going" control
│   │   │   └── PatternBrowser.tsx       # collapsible category -> pattern -> problem tree, jump-to
│   │   ├── dashboard/
│   │   │   ├── StatsOverview.tsx
│   │   │   ├── CategoryChart.tsx
│   │   │   └── TrendChart.tsx
│   │   ├── settings/
│   │   │   ├── SettingsPanel.tsx
│   │   │   ├── ThemeToggle.tsx
│   │   │   ├── DataBackup.tsx       # export/import JSON
│   │   │   └── GithubSyncPanel.tsx  # Phase 2
│   │   └── ui/                      # shared Button, Modal, Card, ProgressBar, Toast
│   └── vite-env.d.ts
├── index.html
├── vite.config.ts               # set base: '/YOUR_REPO_NAME/'
├── tailwind.config.js            # register color tokens + fonts from §5
├── tsconfig.json
├── package.json
└── README.md                     # what it is, how to run locally, how it's deployed
```

## 8. Deployment (GitHub Pages via Actions)

`vite.config.ts` must set the base path to the repo name:

```typescript
export default defineConfig({
  base: '/YOUR_REPO_NAME/',
  plugins: [react()],
});
```

`.github/workflows/deploy.yml`:

```yaml
name: Deploy to GitHub Pages

on:
  push:
    branches: [main]
  workflow_dispatch:

permissions:
  contents: read
  pages: write
  id-token: write

concurrency:
  group: pages
  cancel-in-progress: true

jobs:
  build:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v4
      - uses: actions/setup-node@v4
        with:
          node-version: 20
          cache: npm
      - run: npm ci
      - run: npm run build
      - uses: actions/configure-pages@v5
      - uses: actions/upload-pages-artifact@v3
        with:
          path: ./dist

  deploy:
    needs: build
    runs-on: ubuntu-latest
    environment:
      name: github-pages
      url: ${{ steps.deployment.outputs.page_url }}
    steps:
      - id: deployment
        uses: actions/deploy-pages@v4
```

After the first push, enable Pages in the repo's Settings → Pages → Source: "GitHub Actions."

## 9. Build Order

1. Scaffold: Vite + React + TS + Tailwind; commit the workflow above; confirm an empty page deploys and loads at the Pages URL before writing any features.
2. Data layer: types, Zustand stores + `persist`, storage wrapper, seed the six default categories on first load.
3. Daily Checklist view, including the date picker for backfilling past/future dates.
4. Streak Calendar with split-segment cells, tooltip, category filter, streak/longest-streak/completion-% calculations.
5. Goals system + sidebar `GoalTimer` (live countdown via `setInterval`, cleaned up on unmount).
6. Practice Queue: load `data/problems.json`, build `problemUtils.ts` (flatten to `queueOrder`, `getNext`, `skip`, pattern progress), `usePracticeStore`, `CurrentProblemCard`, `DailyBatchPanel`, `PatternBrowser`. Wire "Mark solved & load next" to also write a `leetcode` entry into `useTaskStore` for today so it shows up on the streak calendar.
7. Dashboard stats + charts.
8. Settings: theme, streak rule, daily batch size, export/import.
9. Polish: Framer Motion micro-animations, responsive/mobile layout, keyboard focus states, empty states, `prefers-reduced-motion`.
10. (Optional) GitHub Gist sync, notifications, badges, PWA manifest.
11. QA on the actual deployed Pages URL: reload persistence, backfilling a random past date, countdown accuracy across a goal deadline, solving 8+ problems in a row past the daily batch of 5, mobile viewport, light/dark toggle.

## 10. Definition of Done

- [ ] Deploys clean via the Actions workflow to a working GitHub Pages URL
- [ ] All 6 default categories seeded; user can add/archive/edit categories
- [ ] Can tick today AND backfill any past/future date
- [ ] Heatmap shows a full year, split-segment per category, correct streak/longest-streak/completion %
- [ ] Weekly and monthly goals can be created, linked to a category, and show a live countdown in the sidebar
- [ ] `data/problems.json` loads correctly; Current Problem card shows pattern + number + title and advances automatically on "Mark solved & load next," with no cap at the daily batch size
- [ ] Solving a problem also logs a `leetcode` entry for today, visible on the streak calendar
- [ ] Pattern Browser lets you jump the queue to any pattern and shows accurate per-pattern progress
- [ ] All data survives a page reload (localStorage) and can be exported/imported as JSON
- [ ] Light/dark theme, responsive on mobile, visible keyboard focus, reduced-motion respected
- [ ] No calls to any backend other than optional direct GitHub API calls for Gist sync
