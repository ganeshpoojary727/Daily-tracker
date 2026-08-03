import React, { useState } from 'react';
import { Github, RefreshCw, CheckCircle2, AlertCircle } from 'lucide-react';
import { useSettingsStore } from '../../store/useSettingsStore';
import { useTaskStore } from '../../store/useTaskStore';
import { useGoalStore } from '../../store/useGoalStore';
import { usePracticeStore } from '../../store/usePracticeStore';
import { pushToGist, pullFromGist } from '../../lib/githubSync';
import { formatDateStr } from '../../lib/dateUtils';

export const GithubSyncPanel: React.FC = () => {
  const syncSettings = useSettingsStore((state) => state.settings.githubSync);
  const updateGithubSync = useSettingsStore((state) => state.updateGithubSync);

  const [token, setToken] = useState(syncSettings?.token || '');
  const [gistId, setGistId] = useState(syncSettings?.gistId || '');
  const [enabled, setEnabled] = useState(syncSettings?.enabled || false);
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState<{ type: 'success' | 'error'; text: string } | null>(null);

  const handlePush = async () => {
    if (!token) {
      setMessage({ type: 'error', text: 'GitHub Personal Access Token is required.' });
      return;
    }

    setLoading(true);
    setMessage(null);

    try {
      const dataToPush = {
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

      const newGistId = await pushToGist(token, gistId || undefined, dataToPush);
      const nowISO = new Date().toISOString();

      setGistId(newGistId);
      updateGithubSync({
        enabled: true,
        token,
        gistId: newGistId,
        lastSyncedAt: nowISO,
      });

      setMessage({ type: 'success', text: `Pushed to Gist successfully! Gist ID: ${newGistId}` });
    } catch (err: any) {
      console.error(err);
      setMessage({ type: 'error', text: err.message || 'Failed to push to GitHub Gist.' });
    } finally {
      setLoading(false);
    }
  };

  const handlePull = async () => {
    if (!token || !gistId) {
      setMessage({ type: 'error', text: 'Token and Gist ID are required to pull data.' });
      return;
    }

    setLoading(true);
    setMessage(null);

    try {
      const pulled = await pullFromGist(token, gistId);
      if (pulled.tasks) {
        useTaskStore.getState().setCategories((pulled.tasks as any).categories);
        useTaskStore.getState().setDayEntries((pulled.tasks as any).dayEntries);
      }
      if (pulled.goals) {
        useGoalStore.getState().setGoals(pulled.goals as any);
      }
      if (pulled.practice) {
        usePracticeStore.getState().setPracticeState(pulled.practice as any);
      }

      const nowISO = new Date().toISOString();
      updateGithubSync({
        enabled: true,
        token,
        gistId,
        lastSyncedAt: nowISO,
      });

      setMessage({ type: 'success', text: 'Pulled data from GitHub Gist successfully!' });
    } catch (err: any) {
      console.error(err);
      setMessage({ type: 'error', text: err.message || 'Failed to pull from GitHub Gist.' });
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <Github className="w-5 h-5 text-text-primary-dark" />
          <h4 className="font-display text-sm font-bold text-text-primary-dark">GitHub Gist Sync (Phase 2)</h4>
        </div>
        <button
          onClick={() => {
            const next = !enabled;
            setEnabled(next);
            updateGithubSync({ enabled: next });
          }}
          className={`rounded-full px-3 py-1 font-mono text-xs font-semibold transition-all ${
            enabled ? 'bg-emerald-500/20 text-emerald-400 border border-emerald-500/30' : 'bg-surface-hover-dark text-text-muted-dark'
          }`}
        >
          {enabled ? 'Enabled' : 'Disabled'}
        </button>
      </div>

      <p className="text-xs font-mono text-text-muted-dark">
        Sync state across devices via a private GitHub Gist directly from your browser. Token is stored strictly in your browser's local storage.
      </p>

      {enabled && (
        <div className="space-y-3 pt-2">
          <div>
            <label className="block text-xs font-mono text-text-muted-dark mb-1">GitHub Personal Access Token (gist scope)</label>
            <input
              type="password"
              value={token}
              onChange={(e) => setToken(e.target.value)}
              placeholder="ghp_..."
              className="w-full rounded-lg border border-surface-border-dark bg-surface-hover-dark px-3 py-2 text-xs font-mono text-text-primary-dark focus:border-streak focus:outline-none"
            />
          </div>

          <div>
            <label className="block text-xs font-mono text-text-muted-dark mb-1">Gist ID (optional for first push)</label>
            <input
              type="text"
              value={gistId}
              onChange={(e) => setGistId(e.target.value)}
              placeholder="e.g. a1b2c3d4e5f6..."
              className="w-full rounded-lg border border-surface-border-dark bg-surface-hover-dark px-3 py-2 text-xs font-mono text-text-primary-dark focus:border-streak focus:outline-none"
            />
          </div>

          {syncSettings?.lastSyncedAt && (
            <p className="text-[11px] font-mono text-text-muted-dark">
              Last synced: {formatDateStr(syncSettings.lastSyncedAt, 'MMM d, yyyy HH:mm:ss')}
            </p>
          )}

          <div className="flex gap-2 pt-2">
            <button
              onClick={handlePush}
              disabled={loading}
              className="flex-1 flex items-center justify-center gap-2 rounded-lg bg-streak py-2 font-display text-xs font-bold text-white disabled:opacity-50"
            >
              <RefreshCw className={`w-3.5 h-3.5 ${loading ? 'animate-spin' : ''}`} />
              <span>Push to Gist</span>
            </button>

            <button
              onClick={handlePull}
              disabled={loading || !gistId}
              className="flex-1 flex items-center justify-center gap-2 rounded-lg border border-surface-border-dark bg-surface-hover-dark py-2 font-display text-xs font-bold text-text-primary-dark hover:border-text-muted-dark disabled:opacity-50"
            >
              <RefreshCw className={`w-3.5 h-3.5 ${loading ? 'animate-spin' : ''}`} />
              <span>Pull from Gist</span>
            </button>
          </div>

          {message && (
            <div
              className={`flex items-center gap-2 rounded-lg p-2.5 text-xs font-mono border ${
                message.type === 'success' ? 'border-emerald-500/30 bg-emerald-500/10 text-emerald-400' : 'border-rose-500/30 bg-rose-500/10 text-rose-400'
              }`}
            >
              {message.type === 'success' ? <CheckCircle2 className="w-3.5 h-3.5" /> : <AlertCircle className="w-3.5 h-3.5" />}
              <span>{message.text}</span>
            </div>
          )}
        </div>
      )}
    </div>
  );
};
