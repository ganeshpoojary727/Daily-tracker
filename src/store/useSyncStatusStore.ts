import { create } from 'zustand';

export type SyncStatus = 'idle' | 'syncing' | 'synced' | 'error' | 'disabled';

interface SyncStatusState {
  status: SyncStatus;
  lastSyncedAt: string | null;
  errorMessage: string | null;
  isInitialPullDone: boolean;

  setSyncStatus: (
    status: SyncStatus,
    errorMessage?: string | null,
    lastSyncedAt?: string | null
  ) => void;
  setInitialPullDone: (done: boolean) => void;
  clearError: () => void;
}

export const useSyncStatusStore = create<SyncStatusState>((set) => ({
  status: 'idle',
  lastSyncedAt: null,
  errorMessage: null,
  isInitialPullDone: false,

  setSyncStatus: (status, errorMessage = null, lastSyncedAt = null) =>
    set((state) => ({
      status,
      errorMessage: errorMessage !== undefined ? errorMessage : state.errorMessage,
      lastSyncedAt: lastSyncedAt !== null && lastSyncedAt !== undefined ? lastSyncedAt : state.lastSyncedAt,
    })),

  setInitialPullDone: (done) => set({ isInitialPullDone: done }),

  clearError: () => set({ errorMessage: null }),
}));
