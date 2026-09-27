# GitHub Cloud Backend Sync Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Turn GitHub into a private, zero-cost cloud backend for Daily Tracker with automated background saving, non-destructive startup pull, and live header status, ensuring 100% preservation of all existing progress in the user's Chrome profile.

**Architecture:** A non-destructive merge engine combines local and remote Gist snapshots without deleting days or tasks. A debounced sync engine watches Zustand stores and automatically saves changes to a secret GitHub Gist (`daily-tracker-data.json`), while a Header Cloud Pill reflects live sync state (`☁️ Saved`, `🔄 Syncing...`, `⚠️ Error`).

**Architecture Diagram:**

```mermaid
graph TD
    subgraph UI ["User Interface Layer"]
        App["App.tsx / Layout"]
        Header["Header.tsx / CloudSyncPill.tsx"]
        Panel["GithubSyncPanel.tsx"]
    end

    subgraph Stores ["Zustand State Stores"]
        SyncStatus["useSyncStatusStore"]
        TaskStore["useTaskStore"]
        GoalStore["useGoalStore"]
        PracticeStore["usePracticeStore"]
        SettingsStore["useSettingsStore"]
    end

    subgraph Engine ["Background Sync Engine"]
        SyncEngine["githubSyncEngine.ts"]
        MergeUtils["githubSyncMerge.ts"]
        GistAPI["githubSync.ts (REST API)"]
    end

    subgraph Cloud ["GitHub Gist Backend"]
        Gist[("Secret Gist: daily-tracker-data.json")]
    end

    App -->|Initialize on Mount| SyncEngine
    TaskStore -->|Store Changes| SyncEngine
    GoalStore -->|Store Changes| SyncEngine
    PracticeStore -->|Store Changes| SyncEngine
    
    SyncEngine -->|Update Status| SyncStatus
    SyncStatus -->|Render Status| Header
    Panel -->|Connect / Test Token| SyncEngine
    
    SyncEngine -->|Fetch & Union Merge| MergeUtils
    MergeUtils -->|Update Stores safely| Stores
    SyncEngine -->|Debounced Push (2.5s)| GistAPI
    GistAPI --> Gist
```

**Tech Stack:** React 18, TypeScript, Zustand, Lucide React, Tailwind CSS, GitHub Gists REST API.

**Spec:** [`docs/superpowers/specs/2026-09-27-github-cloud-backend-sync-design.md`](file:///c:/Users/ganes/OneDrive/Desktop/Daily-tracker/docs/superpowers/specs/2026-09-27-github-cloud-backend-sync-design.md)

## Global Constraints
- Must NEVER overwrite local streak days or completed tasks if remote is empty or partial.
- Must upload the user's active Chrome profile progress on initial connection so no data is lost.
- Debounce background pushes by 2.5 seconds to respect GitHub API rate limits.
- Must compile cleanly with `tsc && vite build`.

---

### Task 1: Non-Destructive Union Merge Engine (`githubSyncMerge.ts`)

**Files:**
- Create: [`src/lib/githubSyncMerge.ts`](file:///c:/Users/ganes/OneDrive/Desktop/Daily-tracker/src/lib/githubSyncMerge.ts)

**Interfaces:**
- `mergeDayEntries(local: Record<string, DayEntry>, remote: Record<string, DayEntry>): Record<string, DayEntry>`
- `mergeCategories(local: Category[], remote: Category[]): Category[]`
- `mergeSyncData(local: GistSyncData, remote: GistSyncData): GistSyncData`

- [ ] **Step 1: Create `src/lib/githubSyncMerge.ts` with union merge logic**
  - Implement `mergeDayEntries`: for each date, merge task dictionaries so any task marked `done` locally or remotely is kept `done`, with the higher completion count preserved.
  - Implement `mergeCategories`: union categories by `id`, preferring local updates for existing categories while retaining any categories added remotely.
  - Implement `mergePracticeState`: union completed problem IDs so solved problems from both profiles are kept.

- [ ] **Step 2: Verify TypeScript compilation**
  Run: `npm run build`

- [ ] **Step 3: Commit**
  ```bash
  git add src/lib/githubSyncMerge.ts
  git commit -m "feat(sync): add non-destructive union merge engine"
  ```

---

### Task 2: Sync Status Store (`useSyncStatusStore.ts`)

**Files:**
- Create: [`src/store/useSyncStatusStore.ts`](file:///c:/Users/ganes/OneDrive/Desktop/Daily-tracker/src/store/useSyncStatusStore.ts)

**Interfaces:**
- Produces: `useSyncStatusStore` with `status: 'idle' | 'syncing' | 'synced' | 'error' | 'disabled'`, `lastSyncedAt: string | null`, `errorMessage: string | null`, `setSyncStatus(status, error?, syncedAt?)`.

- [ ] **Step 1: Create `src/store/useSyncStatusStore.ts`**
  - Setup Zustand store for ephemeral sync status indicator across header and settings.

- [ ] **Step 2: Verify TypeScript compilation**
  Run: `npm run build`

- [ ] **Step 3: Commit**
  ```bash
  git add src/store/useSyncStatusStore.ts
  git commit -m "feat(sync): create sync status zustand store"
  ```

---

### Task 3: Automatic Background Sync Engine (`githubSyncEngine.ts`)

**Files:**
- Create: [`src/lib/githubSyncEngine.ts`](file:///c:/Users/ganes/OneDrive/Desktop/Daily-tracker/src/lib/githubSyncEngine.ts)
- Modify: [`src/lib/githubSync.ts`](file:///c:/Users/ganes/OneDrive/Desktop/Daily-tracker/src/lib/githubSync.ts)

**Interfaces:**
- `initGithubSyncEngine(): () => void` (returns unsubscribe cleanup)
- `syncNow(): Promise<void>`
- `connectAndSeedCloud(token: string, existingGistId?: string): Promise<{ gistId: string }>`

- [ ] **Step 1: Enhance `src/lib/githubSync.ts`**
  - Add helper to verify token scopes (`GET /user`) and create secret Gist if no `gistId` is provided.
- [ ] **Step 2: Implement `src/lib/githubSyncEngine.ts`**
  - Debounced auto-save listener on `useTaskStore`, `useGoalStore`, and `usePracticeStore`.
  - Auto-pull on app startup with `mergeSyncData`.
  - Connect & Seed helper that uploads current local progress immediately when user connects their token.

- [ ] **Step 3: Verify TypeScript compilation**
  Run: `npm run build`

- [ ] **Step 4: Commit**
  ```bash
  git add src/lib/githubSync.ts src/lib/githubSyncEngine.ts
  git commit -m "feat(sync): implement debounced background sync engine"
  ```

---

### Task 4: Header Cloud Sync Pill (`CloudSyncPill.tsx` & `Header.tsx`)

**Files:**
- Create: [`src/components/layout/CloudSyncPill.tsx`](file:///c:/Users/ganes/OneDrive/Desktop/Daily-tracker/src/components/layout/CloudSyncPill.tsx)
- Modify: [`src/components/layout/Header.tsx`](file:///c:/Users/ganes/OneDrive/Desktop/Daily-tracker/src/components/layout/Header.tsx)

- [ ] **Step 1: Create `CloudSyncPill.tsx`**
  - Renders live state:
    - `☁️ Saved` (emerald badge) with "Last synced at HH:mm" tooltip and manual refresh on click.
    - `🔄 Syncing...` (amber pulse + spin).
    - `⚠️ Sync Error` (rose badge) with retry button and error details.
    - If disabled: subtle muted cloud button that opens settings.
- [ ] **Step 2: Add `CloudSyncPill` into `Header.tsx`**
  - Position alongside the streak flame badge in the top-right toolbar.

- [ ] **Step 3: Verify TypeScript compilation**
  Run: `npm run build`

- [ ] **Step 4: Commit**
  ```bash
  git add src/components/layout/CloudSyncPill.tsx src/components/layout/Header.tsx
  git commit -m "feat(ui): add cloud sync status pill to header"
  ```

---

### Task 5: Upgraded 1-Click Connect Panel (`GithubSyncPanel.tsx`)

**Files:**
- Modify: [`src/components/settings/GithubSyncPanel.tsx`](file:///c:/Users/ganes/OneDrive/Desktop/Daily-tracker/src/components/settings/GithubSyncPanel.tsx)

- [ ] **Step 1: Update `GithubSyncPanel.tsx`**
  - Add explicit message: *"Your existing progress (streaks, tasks, solved DSA) will be safely uploaded to your private GitHub Gist."*
  - Add **"Connect & Backup to GitHub"** button that automatically validates the token, seeds the Gist with current progress, and turns on Auto-Sync.
  - Add **"Download Emergency JSON Backup"** button right next to it for instant peace of mind.
  - Add **"Disconnect"** button to safely unlink cloud sync without touching local data.

- [ ] **Step 2: Verify TypeScript compilation**
  Run: `npm run build`

- [ ] **Step 3: Commit**
  ```bash
  git add src/components/settings/GithubSyncPanel.tsx
  git commit -m "feat(settings): add 1-click cloud connect and backup panel"
  ```

---

### Task 6: App Mount Integration & End-to-End Build Verification

**Files:**
- Modify: [`src/App.tsx`](file:///c:/Users/ganes/OneDrive/Desktop/Daily-tracker/src/App.tsx)

- [ ] **Step 1: Initialize sync engine in `App.tsx` on mount**
  - Call `initGithubSyncEngine()` inside `useEffect` with proper cleanup.
- [ ] **Step 2: Run full build and bundle check**
  Run: `npm run build`
  Expected: Clean build (`dist/`) with 0 errors.

- [ ] **Step 3: Commit**
  ```bash
  git add src/App.tsx
  git commit -m "feat: wire background sync engine on app initialization"
  ```
