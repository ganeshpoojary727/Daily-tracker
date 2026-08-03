# Daily Tracker — Accountability System

A static, local-first daily progress tracker with a GitHub-style streak calendar, weekly/monthly goals, and a multi-sheet DSA pattern practice queue. No backend — all data lives in your browser via localStorage.

**Live app:** https://ganeshpoojary727.github.io/Daily-tracker/

---

## Run locally

```bash
npm install
npm run dev
```

---

## Deploy

Pushes to `main` auto-deploy via the GitHub Actions workflow in `.github/workflows/deploy.yml`. Enable it once in the repo: **Settings → Pages → Source → GitHub Actions.**

---

## Data & privacy

All data is stored in your browser's localStorage — nothing leaves your device unless you explicitly enable the optional GitHub Gist sync in Settings. Use Settings → Export to back up your data as a JSON file.

---

## Key Features

- **LeetCode Contribution Heatmap**: Full-year 365-day streak calendar with split-segment cells dividing each day square into micro-segments to show which categories were completed.
- **Daily Checklist & Backfilling**: Log completed daily targets, enter notes/counts, and select any past or future date via the DatePicker to backfill missed days or plan ahead.
- **Multi-Sheet Practice Queue**: Problem-by-problem runner supporting multiple practice sheets (built-in DSA patterns, TCS technical questions, aptitude sheets). Toggling solved status updates streaks, automatically skips solved problems, and tracks independent sheet progress.
- **Accountability Goals & Live Timers**: Create weekly/monthly/custom goals linked to categories with real-time updating countdown timers displayed in a persistent widget.
- **Analytics & Dashboard**: View summary metrics (current streak, longest streak, trailing completion rates) and interactive Recharts category distribution & trend line charts.
- **Data Export/Import & Sync**: Download single-file JSON backups, restore anytime, or connect a GitHub Personal Access Token (`gist` scope) for browser-direct private Gist sync.
