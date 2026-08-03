# Personal Daily Progress Tracker

A developer-focused, single-user daily accountability dashboard — built as a **fully static web application** with zero custom backend dependencies. Runs entirely in the browser using `localStorage`, with optional GitHub Gist sync for cross-device state management.

![Build & Deploy](https://github.com/your-username/your-repo-name/actions/workflows/deploy.yml/badge.svg)

---

## Key Features

- **LeetCode Contribution Heatmap**: Full-year 365-day streak calendar with signature **split-segment cells**, dividing each day square into up to 6 micro-segments (one per active category) to show *which* categories were completed.
- **Daily Checklist & Backfilling**: Log completed daily targets, enter notes/counts, and select any past or future date via the DatePicker to backfill missed days or plan ahead.
- **DSA Pattern Practice Queue Runner**: Interactive queue runner backed by `src/data/problems.json` (15 categories, 94 patterns, 412 problem entries / 389 unique LeetCode problems). Includes a **"Mark solved & load next"** flow that automatically increments your daily LeetCode completion count, a daily suggested batch indicator (default 5), and a collapsible Pattern Browser with video badges.
- **Accountability Goals & Live Timers**: Create weekly/monthly/custom goals linked to categories with real-time updating countdown timers (`days:hours:minutes:seconds`) displayed in a persistent sidebar widget.
- **Analytics & Dashboard**: View summary metrics (current streak, longest streak, trailing 30/90-day completion rates) and interactive Recharts category distribution & trend line charts.
- **Data Export/Import & Sync**: Download single-file JSON backups, restore anytime, or connect a GitHub Personal Access Token (`gist` scope) for browser-direct private Gist sync.

---

## Tech Stack

- **Framework**: React 18 + TypeScript + Vite
- **Styling**: Tailwind CSS
- **State Management**: Zustand (`persist`)
- **Icons**: `lucide-react`
- **Dates**: `date-fns`
- **Animations**: `framer-motion`
- **Charts**: `recharts`
- **Deployment**: GitHub Actions → GitHub Pages (`actions/deploy-pages`)

---

## Local Development

```bash
# Install dependencies
npm install

# Start Vite dev server
npm run dev

# Build production bundle
npm run build
```

---

## Deploying to GitHub Pages

1. Push your repository to GitHub.
2. Ensure GitHub Pages is enabled in **Settings → Pages → Source: GitHub Actions**.
3. The `.github/workflows/deploy.yml` workflow will automatically build and publish the static bundle on every push to `main`.
