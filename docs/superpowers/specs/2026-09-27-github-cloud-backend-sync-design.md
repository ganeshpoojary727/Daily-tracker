# GitHub Cloud Backend Sync Specification (Zero Data Loss)

## 1. Objective
Enable Daily Tracker to function as a cloud-synced application using GitHub Gists as a zero-cost, private serverless backend, while strictly preserving all existing local progress (streaks, completed tasks, DSA progress, custom categories) across browser profiles.

---

## 2. Existing Data Safety & Chrome Profile Migration

### Problem:
The user has their active progress (4-day streak, 35 completed tasks, 22 active days, solved DSA problems) stored in `localStorage` in their primary Chrome profile (`ganeshpoojary727.github.io/Daily-tracker/`).

### Solution (Zero Data Loss Guarantee):
1. **Initial Cloud Seed**:
   - When the user opens the updated app in that Chrome profile and enters their GitHub token, clicking **"Connect & Seed Cloud from Local Data"** takes the exact current `localStorage` state (categories, day entries, goals, DSA sheet states) and creates the private Gist initialized with that data.
2. **Non-Destructive Union Merge**:
   - The sync engine never performs a destructive overwrite if the remote data is missing dates that exist locally.
   - For `dayEntries`, dates and tasks are merged: any day entry that exists in either local or remote is preserved.
3. **Emergency Snapshot Button**:
   - An immediate "Download JSON Backup" button on the sync panel allows downloading an offline copy in one click before connecting.

---

## 3. System Architecture & Components

```mermaid
flowchart TD
    subgraph UI ["User Interface"]
        HeaderSync["Header Cloud Pill<br/>(☁️ Synced / 🔄 Syncing / ⚠️ Error)"]
        SettingsSync["GithubSyncPanel.tsx<br/>(1-Click Connect, Token, Gist ID, Auto-Sync toggle)"]
        MainApp["Daily Checklist / DSA Runner / Calendar"]
    end

    subgraph Store ["Zustand Stores (Offline-First LocalStorage Cache)"]
        TaskStore["useTaskStore"]
        GoalStore["useGoalStore"]
        PracticeStore["usePracticeStore"]
        SettingsStore["useSettingsStore"]
    end

    subgraph SyncService ["Sync Engine (src/lib/githubSyncEngine.ts)"]
        Debouncer["Debounced Auto-Save (2.5s)"]
        MergeLogic["Non-Destructive Union Merge"]
        GistAPI["GitHub Gist REST API"]
    end

    subgraph Cloud ["GitHub Private Backend"]
        PrivateGist[("Secret Gist<br/>daily-tracker-data.json<br/>(Git Commits per Save)")]
    end

    MainApp -->|Actions| Store
    Store -->|Store Change Subscription| Debouncer
    Debouncer -->|Trigger Background Save| GistAPI
    GistAPI -->|PATCH daily-tracker-data.json| PrivateGist
    Debouncer -->|Sync State (idle / syncing / error)| HeaderSync
    
    AppStart["App Startup / Focus"] -->|Check Remote Gist| GistAPI
    GistAPI -->|Fetch remote JSON| MergeLogic
    MergeLogic -->|Union Merge if Remote Newer| Store
```

---

## 4. Detailed Component Specifications

### 4.1 Sync Status State Machine (`useSyncStatusStore`)
Tracks:
- `status`: `'idle' | 'syncing' | 'synced' | 'error' | 'disabled'`
- `lastSyncedAt`: string (ISO date)
- `errorMessage`: string | null
- `pendingChanges`: boolean

### 4.2 Auto-Save Debounce Engine (`githubSyncEngine.ts`)
- Listens to store updates across `useTaskStore`, `useGoalStore`, `usePracticeStore`, and `useSettingsStore`.
- Debounces save by 2.5 seconds to avoid exceeding GitHub API rate limits (GitHub allows 5,000 requests/hour for authenticated users, which is more than 80 saves/minute).
- Updates the header sync indicator to `Syncing...` while uploading, and `Saved to GitHub` on success.

### 4.3 Safe Startup Pull & Union Merge
- When the app mounts or tab regains focus, if `githubSync.enabled` is `true`:
  - Fetches the Gist's `updatedAt`.
  - If remote `updatedAt` > local `lastSyncedAt`:
    - Merges remote day entries with local day entries.
    - Merges categories by `id`.
    - Merges solved DSA problem IDs in `usePracticeStore`.
    - Updates local stores without resetting in-progress form inputs.

### 4.4 Header Cloud Sync Pill (`src/components/layout/Header.tsx`)
- Placed next to the streak badge in the top header.
- Shows:
  - If sync disabled: subtle `☁️ Cloud Sync (Off)` button that opens Settings.
  - If syncing: `🔄 Syncing...` with spinning icon.
  - If synced: `☁️ Saved` (emerald badge) with tooltip showing last sync time.
  - If error: `⚠️ Sync Error` (rose badge) with click-to-retry and error popover.

### 4.5 Improved 1-Click Connect UI (`GithubSyncPanel.tsx`)
- Explains clearly: *"Your current local progress (streaks, tasks, DSA solved) will be securely uploaded and kept safe."*
- One-click button: **"Connect & Backup to GitHub"** (auto-creates private Gist with current progress).
- Disconnect option (preserves local data, just stops cloud sync).
- Direct link to generate a GitHub token with `gist` scope checked.

---

## 5. Verification Plan
1. Test unit merge logic with sample conflicting and non-conflicting day entries and categories.
2. Test Gist creation with mock and live token.
3. Test debounced auto-save when checking tasks in Daily Checklist.
4. Verify TypeScript build and bundle with `npm run build`.
