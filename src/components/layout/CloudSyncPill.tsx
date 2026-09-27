import React from 'react';
import { Cloud, RefreshCw, AlertCircle } from 'lucide-react';
import { useSyncStatusStore } from '../../store/useSyncStatusStore';
import { useSettingsStore } from '../../store/useSettingsStore';
import { syncNow } from '../../lib/githubSyncEngine';
import { formatDateStr } from '../../lib/dateUtils';

interface CloudSyncPillProps {
  onOpenSettings?: () => void;
}

export const CloudSyncPill: React.FC<CloudSyncPillProps> = ({ onOpenSettings }) => {
  const status = useSyncStatusStore((state) => state.status);
  const lastSyncedAt = useSyncStatusStore((state) => state.lastSyncedAt);
  const errorMessage = useSyncStatusStore((state) => state.errorMessage);
  const githubSync = useSettingsStore((state) => state.settings.githubSync);

  const formattedTime = lastSyncedAt
    ? formatDateStr(lastSyncedAt, 'HH:mm:ss')
    : githubSync?.lastSyncedAt
    ? formatDateStr(githubSync.lastSyncedAt, 'HH:mm:ss')
    : null;

  if (!githubSync?.enabled || status === 'disabled') {
    return (
      <button
        onClick={onOpenSettings}
        title="Connect GitHub Gist to enable auto-cloud saving across devices"
        className="hidden sm:flex items-center gap-1.5 rounded-full border border-surface-border-dark bg-surface-dark px-3 py-1 font-mono text-xs text-text-muted-dark hover:border-streak/50 hover:text-text-primary-dark transition-all"
      >
        <Cloud className="w-3.5 h-3.5 text-text-muted-dark" />
        <span>Cloud Off</span>
      </button>
    );
  }

  if (status === 'syncing') {
    return (
      <div
        title="Auto-saving changes to your private GitHub Gist..."
        className="flex items-center gap-1.5 rounded-full border border-amber-500/30 bg-amber-500/10 px-3 py-1 font-mono text-xs font-semibold text-amber-400 shadow-sm"
      >
        <RefreshCw className="w-3.5 h-3.5 animate-spin" />
        <span>Syncing...</span>
      </div>
    );
  }

  if (status === 'error') {
    return (
      <button
        onClick={() => syncNow()}
        title={`${errorMessage || 'Cloud sync error'} — Click to retry`}
        className="flex items-center gap-1.5 rounded-full border border-rose-500/40 bg-rose-500/15 px-3 py-1 font-mono text-xs font-semibold text-rose-400 hover:bg-rose-500/25 transition-all shadow-sm"
      >
        <AlertCircle className="w-3.5 h-3.5" />
        <span>Sync Error (Retry)</span>
      </button>
    );
  }

  // Synced state
  return (
    <button
      onClick={() => syncNow()}
      title={
        formattedTime
          ? `All changes saved to your private GitHub Gist (Last synced: ${formattedTime}) • Click to sync now`
          : 'All changes saved to your private GitHub Gist • Click to sync now'
      }
      className="flex items-center gap-1.5 rounded-full border border-emerald-500/30 bg-emerald-500/10 px-3 py-1 font-mono text-xs font-semibold text-emerald-400 hover:bg-emerald-500/20 transition-all shadow-sm"
    >
      <span className="relative flex h-2 w-2">
        <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-60"></span>
        <span className="relative inline-flex rounded-full h-2 w-2 bg-emerald-500"></span>
      </span>
      <span className="hidden md:inline">Saved</span>
      <span className="md:hidden">Synced</span>
    </button>
  );
};
