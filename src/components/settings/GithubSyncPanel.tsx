import React, { useState } from 'react';
import {
  Github,
  RefreshCw,
  CheckCircle2,
  AlertCircle,
  ExternalLink,
  ShieldCheck,
  Download,
  LogOut,
  Sparkles,
} from 'lucide-react';
import { useSettingsStore } from '../../store/useSettingsStore';
import { useSyncStatusStore } from '../../store/useSyncStatusStore';
import {
  connectAndSeedCloud,
  disconnectCloud,
  syncNow,
  getCurrentSnapshot,
} from '../../lib/githubSyncEngine';
import { formatDateStr, getTodayStr } from '../../lib/dateUtils';

export const GithubSyncPanel: React.FC = () => {
  const syncSettings = useSettingsStore((state) => state.settings.githubSync);
  const syncStatus = useSyncStatusStore((state) => state.status);
  const errorMessage = useSyncStatusStore((state) => state.errorMessage);

  const [token, setToken] = useState(syncSettings?.token || '');
  const [gistId, setGistId] = useState(syncSettings?.gistId || '');
  const [loading, setLoading] = useState(false);
  const [localMessage, setLocalMessage] = useState<{
    type: 'success' | 'error';
    text: string;
  } | null>(null);

  const isConnected = Boolean(syncSettings?.enabled && syncSettings?.token && syncSettings?.gistId);

  const handleConnect = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!token.trim()) {
      setLocalMessage({
        type: 'error',
        text: 'Please enter your GitHub Personal Access Token.',
      });
      return;
    }

    setLoading(true);
    setLocalMessage(null);

    try {
      const { gistId: newGistId, username } = await connectAndSeedCloud(
        token.trim(),
        gistId.trim() || undefined
      );
      setGistId(newGistId);
      setLocalMessage({
        type: 'success',
        text: `Connected to GitHub as @${username}! All existing progress from this browser has been safely saved to your private Gist (${newGistId}).`,
      });
    } catch (err: any) {
      console.error(err);
      setLocalMessage({
        type: 'error',
        text: err?.message || 'Failed to connect to GitHub. Please check your token.',
      });
    } finally {
      setLoading(false);
    }
  };

  const handleManualSync = async () => {
    setLoading(true);
    setLocalMessage(null);
    try {
      await syncNow();
      setLocalMessage({
        type: 'success',
        text: 'Synchronized successfully with GitHub Cloud Gist!',
      });
    } catch (err: any) {
      setLocalMessage({
        type: 'error',
        text: err?.message || 'Sync failed.',
      });
    } finally {
      setLoading(false);
    }
  };

  const handleDisconnect = () => {
    if (
      window.confirm(
        'Disconnect GitHub Cloud Sync? Your local data will remain intact in this browser.'
      )
    ) {
      disconnectCloud();
      setLocalMessage({
        type: 'success',
        text: 'Cloud sync disconnected. Local data preserved.',
      });
    }
  };

  const downloadEmergencyBackup = () => {
    try {
      const data = getCurrentSnapshot();
      const jsonStr = JSON.stringify(data, null, 2);
      const blob = new Blob([jsonStr], { type: 'application/json' });
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `daily-tracker-backup-${getTodayStr()}.json`;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      URL.revokeObjectURL(url);
      setLocalMessage({
        type: 'success',
        text: 'Emergency backup downloaded to your computer!',
      });
    } catch (err: any) {
      setLocalMessage({
        type: 'error',
        text: 'Failed to download emergency backup.',
      });
    }
  };

  return (
    <div className="space-y-4">
      {/* Header Bar */}
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div className="flex items-center gap-2">
          <Github className="w-5 h-5 text-text-primary-dark" />
          <h4 className="font-display text-sm font-bold text-text-primary-dark">
            GitHub Cloud Backend Sync
          </h4>
        </div>
        <div className="flex items-center gap-2">
          <span
            className={`rounded-full px-3 py-1 font-mono text-xs font-semibold ${
              isConnected
                ? 'bg-emerald-500/20 text-emerald-400 border border-emerald-500/30'
                : 'bg-surface-hover-dark text-text-muted-dark border border-surface-border-dark'
            }`}
          >
            {isConnected ? '● Cloud Connected & Auto-Saving' : 'Offline / Local Only'}
          </span>
        </div>
      </div>

      {/* Safety Assurance Banner */}
      <div className="flex items-start gap-3 rounded-xl border border-emerald-500/20 bg-emerald-500/5 p-3.5 text-xs text-text-muted-dark">
        <ShieldCheck className="w-5 h-5 text-emerald-400 shrink-0 mt-0.5" />
        <div className="space-y-1">
          <p className="font-semibold text-text-primary-dark">
            Zero Data Loss Guarantee
          </p>
          <p className="leading-relaxed font-sans text-xs">
            Connecting this Chrome profile will <strong>preserve your current progress</strong>{' '}
            (including streaks, completed tasks, and solved DSA problems) and upload it as the
            cloud master snapshot into a private GitHub Gist.
          </p>
        </div>
      </div>

      {!isConnected ? (
        /* Setup Form */
        <form onSubmit={handleConnect} className="space-y-4 pt-1">
          <div>
            <div className="flex items-center justify-between mb-1.5">
              <label className="block text-xs font-mono text-text-muted-dark">
                GitHub Personal Access Token (PAT) *
              </label>
              <a
                href="https://github.com/settings/tokens/new?scopes=gist&description=Daily+Tracker+Cloud+Sync"
                target="_blank"
                rel="noopener noreferrer"
                className="flex items-center gap-1 text-[11px] font-mono text-streak hover:underline"
              >
                <span>Generate token with gist scope</span>
                <ExternalLink className="w-3 h-3" />
              </a>
            </div>
            <input
              type="password"
              value={token}
              onChange={(e) => setToken(e.target.value)}
              placeholder="ghp_xxxxxxxxxxxxxxxxxxxx"
              className="w-full rounded-lg border border-surface-border-dark bg-surface-hover-dark px-3 py-2 text-xs font-mono text-text-primary-dark focus:border-streak focus:outline-none"
              required
            />
          </div>

          <div>
            <label className="block text-xs font-mono text-text-muted-dark mb-1.5">
              Existing Gist ID (Optional — leave blank to auto-create a new private Gist)
            </label>
            <input
              type="text"
              value={gistId}
              onChange={(e) => setGistId(e.target.value)}
              placeholder="e.g. 7c9a8b1d... (leave empty if first time)"
              className="w-full rounded-lg border border-surface-border-dark bg-surface-hover-dark px-3 py-2 text-xs font-mono text-text-primary-dark focus:border-streak focus:outline-none"
            />
          </div>

          <div className="flex flex-wrap gap-2 pt-2">
            <button
              type="submit"
              disabled={loading}
              className="flex-1 flex items-center justify-center gap-2 rounded-lg bg-streak py-2.5 font-display text-xs font-bold text-white hover:bg-streak/90 disabled:opacity-50 shadow-md shadow-streak/25 transition-all"
            >
              {loading ? (
                <RefreshCw className="w-4 h-4 animate-spin" />
              ) : (
                <Sparkles className="w-4 h-4" />
              )}
              <span>Connect & Seed Cloud from Local Data</span>
            </button>

            <button
              type="button"
              onClick={downloadEmergencyBackup}
              title="Download local JSON copy before connecting"
              className="flex items-center justify-center gap-2 rounded-lg border border-surface-border-dark bg-surface-dark px-3 py-2.5 font-display text-xs font-semibold text-text-primary-dark hover:bg-surface-hover-dark transition-all"
            >
              <Download className="w-4 h-4 text-text-muted-dark" />
              <span>Download JSON Backup</span>
            </button>
          </div>
        </form>
      ) : (
        /* Connected Status View */
        <div className="space-y-4 pt-1">
          <div className="rounded-lg border border-surface-border-dark bg-surface-dark p-3.5 space-y-2 text-xs font-mono">
            <div className="flex items-center justify-between">
              <span className="text-text-muted-dark">Cloud Storage:</span>
              <span className="text-text-primary-dark font-semibold">Private GitHub Gist</span>
            </div>
            <div className="flex items-center justify-between">
              <span className="text-text-muted-dark">Gist ID:</span>
              <span className="text-streak font-bold">{gistId}</span>
            </div>
            {syncSettings?.lastSyncedAt && (
              <div className="flex items-center justify-between">
                <span className="text-text-muted-dark">Last Synced:</span>
                <span className="text-text-primary-dark">
                  {formatDateStr(syncSettings.lastSyncedAt, 'MMM d, yyyy HH:mm:ss')}
                </span>
              </div>
            )}
            <div className="flex items-center justify-between">
              <span className="text-text-muted-dark">Auto-Save on Changes:</span>
              <span className="text-emerald-400 font-semibold">Active (2.5s debounce)</span>
            </div>
          </div>

          <div className="flex flex-wrap gap-2 pt-1">
            <button
              onClick={handleManualSync}
              disabled={loading || syncStatus === 'syncing'}
              className="flex-1 flex items-center justify-center gap-2 rounded-lg bg-streak py-2 font-display text-xs font-bold text-white hover:bg-streak/90 disabled:opacity-50 transition-all"
            >
              <RefreshCw
                className={`w-3.5 h-3.5 ${
                  loading || syncStatus === 'syncing' ? 'animate-spin' : ''
                }`}
              />
              <span>Sync Now</span>
            </button>

            <button
              type="button"
              onClick={downloadEmergencyBackup}
              className="flex items-center justify-center gap-2 rounded-lg border border-surface-border-dark bg-surface-dark px-3 py-2 font-display text-xs font-semibold text-text-primary-dark hover:bg-surface-hover-dark transition-all"
            >
              <Download className="w-3.5 h-3.5 text-text-muted-dark" />
              <span>Export Backup JSON</span>
            </button>

            <button
              onClick={handleDisconnect}
              className="flex items-center justify-center gap-2 rounded-lg border border-surface-border-dark bg-surface-hover-dark/40 px-3 py-2 font-display text-xs font-semibold text-text-muted-dark hover:text-rose-400 transition-all"
            >
              <LogOut className="w-3.5 h-3.5" />
              <span>Disconnect</span>
            </button>
          </div>
        </div>
      )}

      {/* Status Messages */}
      {(localMessage || errorMessage) && (
        <div
          className={`flex items-start gap-2 rounded-lg p-3 text-xs font-mono border ${
            localMessage?.type === 'success'
              ? 'border-emerald-500/30 bg-emerald-500/10 text-emerald-400'
              : 'border-rose-500/30 bg-rose-500/10 text-rose-400'
          }`}
        >
          {localMessage?.type === 'success' ? (
            <CheckCircle2 className="w-4 h-4 shrink-0 mt-0.5" />
          ) : (
            <AlertCircle className="w-4 h-4 shrink-0 mt-0.5" />
          )}
          <span>{localMessage?.text || errorMessage}</span>
        </div>
      )}
    </div>
  );
};

