import { useTaskStore } from '../store/useTaskStore';
import { useGoalStore } from '../store/useGoalStore';
import { usePracticeStore } from '../store/usePracticeStore';
import { useSettingsStore } from '../store/useSettingsStore';
import { useSyncStatusStore } from '../store/useSyncStatusStore';
import {
  GistSyncData,
  pullFromGist,
  pushToGist,
  createSecretGist,
  validateGithubToken,
} from './githubSync';
import { mergeSyncData } from './githubSyncMerge';

const AUTO_SAVE_DEBOUNCE_MS = 2500;
let debounceTimer: ReturnType<typeof setTimeout> | null = null;
let isSyncing = false;
let hasPendingChanges = false;

/**
 * Returns current snapshot of all local data in the active browser profile.
 */
export function getCurrentSnapshot(): GistSyncData {
  return {
    tasks: {
      categories: useTaskStore.getState().categories,
      dayEntries: useTaskStore.getState().dayEntries,
    },
    goals: useGoalStore.getState().goals,
    settings: useSettingsStore.getState().settings,
    practice: {
      sheets: usePracticeStore.getState().sheets,
      activeSheetId: usePracticeStore.getState().activeSheetId,
      statesBySheet: usePracticeStore.getState().statesBySheet,
    },
    updatedAt: new Date().toISOString(),
  };
}

/**
 * Applies a snapshot to local stores safely without resetting cloud sync credentials.
 */
export function applySnapshotToStores(data: GistSyncData): void {
  if (data.tasks) {
    const t = data.tasks as any;
    if (t.categories) useTaskStore.getState().setCategories(t.categories);
    if (t.dayEntries) useTaskStore.getState().setDayEntries(t.dayEntries);
  }
  if (data.goals) {
    useGoalStore.getState().setGoals(data.goals as any);
  }
  if (data.practice) {
    usePracticeStore.getState().setPracticeState(data.practice as any);
  }
}

/**
 * 1-Click Connect & Seed:
 * Validates token, uploads current browser profile progress to a secret Gist (or merges with existing Gist),
 * and activates background auto-sync.
 */
export async function connectAndSeedCloud(
  token: string,
  existingGistId?: string
): Promise<{ gistId: string; username: string }> {
  const syncStore = useSyncStatusStore.getState();
  syncStore.setSyncStatus('syncing');

  try {
    const { username } = await validateGithubToken(token);
    const localSnapshot = getCurrentSnapshot();
    let targetGistId = existingGistId?.trim() || '';

    if (targetGistId) {
      // Pull existing remote data and merge non-destructively
      try {
        const remoteData = await pullFromGist(token, targetGistId);
        const mergedData = mergeSyncData(localSnapshot, remoteData);
        await pushToGist(token, targetGistId, mergedData);
        applySnapshotToStores(mergedData);
      } catch (err) {
        // If gist doesn't have the file yet, push local snapshot directly
        await pushToGist(token, targetGistId, localSnapshot);
      }
    } else {
      // Create new secret Gist seeded with this Chrome profile's active progress
      targetGistId = await createSecretGist(token, localSnapshot);
    }

    const nowISO = new Date().toISOString();
    useSettingsStore.getState().updateGithubSync({
      enabled: true,
      token,
      gistId: targetGistId,
      lastSyncedAt: nowISO,
    });

    syncStore.setSyncStatus('synced', null, nowISO);
    syncStore.setInitialPullDone(true);

    return { gistId: targetGistId, username };
  } catch (err: any) {
    const errorMsg = err?.message || 'Failed to connect to GitHub Cloud';
    syncStore.setSyncStatus('error', errorMsg);
    throw err;
  }
}

/**
 * Disconnects cloud sync without altering any local progress.
 */
export function disconnectCloud(): void {
  useSettingsStore.getState().updateGithubSync({ enabled: false });
  useSyncStatusStore.getState().setSyncStatus('disabled');
}

/**
 * Executes a sync cycle:
 * 1. Pulls remote snapshot.
 * 2. Merges local and remote non-destructively.
 * 3. Saves merged result to Gist and updates local stores.
 */
export async function syncNow(): Promise<void> {
  const { githubSync } = useSettingsStore.getState().settings;
  const token = githubSync?.token;
  const gistId = githubSync?.gistId;
  const enabled = githubSync?.enabled;

  if (!enabled || !token || !gistId) {
    useSyncStatusStore.getState().setSyncStatus('disabled');
    return;
  }

  if (isSyncing) {
    hasPendingChanges = true;
    return;
  }

  isSyncing = true;
  useSyncStatusStore.getState().setSyncStatus('syncing');

  try {
    const localSnapshot = getCurrentSnapshot();
    const remoteData = await pullFromGist(token, gistId);
    const mergedData = mergeSyncData(localSnapshot, remoteData);

    // Push merged state to cloud
    await pushToGist(token, gistId, mergedData);

    // Apply merged state locally
    applySnapshotToStores(mergedData);

    const nowISO = new Date().toISOString();
    useSettingsStore.getState().updateGithubSync({ lastSyncedAt: nowISO });
    useSyncStatusStore.getState().setSyncStatus('synced', null, nowISO);
    useSyncStatusStore.getState().setInitialPullDone(true);
  } catch (err: any) {
    console.error('GitHub sync error:', err);
    useSyncStatusStore.getState().setSyncStatus('error', err?.message || 'Sync failed');
  } finally {
    isSyncing = false;
    if (hasPendingChanges) {
      hasPendingChanges = false;
      scheduleAutoSave();
    }
  }
}

/**
 * Debounced push when local stores change.
 */
export function scheduleAutoSave(): void {
  const { githubSync } = useSettingsStore.getState().settings;
  if (!githubSync?.enabled || !githubSync?.token || !githubSync?.gistId) {
    return;
  }

  if (debounceTimer) {
    clearTimeout(debounceTimer);
  }

  useSyncStatusStore.getState().setSyncStatus('syncing');

  debounceTimer = setTimeout(async () => {
    debounceTimer = null;
    const { githubSync: currentSync } = useSettingsStore.getState().settings;
    if (!currentSync?.enabled || !currentSync?.token || !currentSync?.gistId) return;

    if (isSyncing) {
      hasPendingChanges = true;
      return;
    }

    isSyncing = true;
    try {
      const localSnapshot = getCurrentSnapshot();
      await pushToGist(currentSync.token, currentSync.gistId, localSnapshot);

      const nowISO = new Date().toISOString();
      useSettingsStore.getState().updateGithubSync({ lastSyncedAt: nowISO });
      useSyncStatusStore.getState().setSyncStatus('synced', null, nowISO);
    } catch (err: any) {
      console.error('GitHub auto-save error:', err);
      useSyncStatusStore.getState().setSyncStatus('error', err?.message || 'Auto-save failed');
    } finally {
      isSyncing = false;
      if (hasPendingChanges) {
        hasPendingChanges = false;
        scheduleAutoSave();
      }
    }
  }, AUTO_SAVE_DEBOUNCE_MS);
}

/**
 * Initializes the background sync engine:
 * 1. Performs initial pull & union-merge on startup if enabled.
 * 2. Subscribes to local Zustand store changes for debounced auto-saving.
 * 3. Listens to window online event to auto-retry.
 */
export function initGithubSyncEngine(): () => void {
  const { githubSync } = useSettingsStore.getState().settings;

  if (githubSync?.enabled && githubSync?.token && githubSync?.gistId) {
    useSyncStatusStore.getState().setSyncStatus('syncing');
    syncNow();
  } else {
    useSyncStatusStore.getState().setSyncStatus(githubSync?.enabled ? 'idle' : 'disabled');
    useSyncStatusStore.getState().setInitialPullDone(true);
  }

  // Subscribe to changes in task, goal, and practice stores
  const unsubTasks = useTaskStore.subscribe((state, prevState) => {
    if (state.dayEntries !== prevState.dayEntries || state.categories !== prevState.categories) {
      if (useSyncStatusStore.getState().isInitialPullDone) {
        scheduleAutoSave();
      }
    }
  });

  const unsubGoals = useGoalStore.subscribe((state, prevState) => {
    if (state.goals !== prevState.goals) {
      if (useSyncStatusStore.getState().isInitialPullDone) {
        scheduleAutoSave();
      }
    }
  });

  const unsubPractice = usePracticeStore.subscribe((state, prevState) => {
    if (
      state.statesBySheet !== prevState.statesBySheet ||
      state.sheets !== prevState.sheets
    ) {
      if (useSyncStatusStore.getState().isInitialPullDone) {
        scheduleAutoSave();
      }
    }
  });

  const handleOnline = () => {
    const { githubSync: sync } = useSettingsStore.getState().settings;
    if (sync?.enabled && sync?.token && sync?.gistId) {
      syncNow();
    }
  };

  window.addEventListener('online', handleOnline);

  return () => {
    if (debounceTimer) clearTimeout(debounceTimer);
    unsubTasks();
    unsubGoals();
    unsubPractice();
    window.removeEventListener('online', handleOnline);
  };
}
