import React from 'react';
import { Shield, Sliders, Database } from 'lucide-react';
import { useSettingsStore } from '../../store/useSettingsStore';
import { ThemeToggle } from './ThemeToggle';
import { DataBackup } from './DataBackup';
import { GithubSyncPanel } from './GithubSyncPanel';

export const SettingsPanel: React.FC = () => {
  const { streakRule, weekStartsOn, dailyBatchSize } = useSettingsStore((state) => state.settings);
  const setStreakRule = useSettingsStore((state) => state.setStreakRule);
  const setWeekStartsOn = useSettingsStore((state) => state.setWeekStartsOn);
  const setDailyBatchSize = useSettingsStore((state) => state.setDailyBatchSize);

  return (
    <div className="space-y-6 max-w-4xl">
      <div>
        <h2 className="font-display text-xl font-bold tracking-tight text-text-primary-dark">
          App Settings & Data Management
        </h2>
        <p className="text-xs font-mono text-text-muted-dark">
          Configure visual themes, streak rules, batch sizes, and data backups.
        </p>
      </div>

      {/* Theme Settings */}
      <div className="rounded-xl border border-surface-border-dark bg-surface-dark p-5 shadow-sm space-y-3">
        <div className="flex items-center gap-2">
          <Sliders className="w-4 h-4 text-streak" />
          <h3 className="font-display text-sm font-bold text-text-primary-dark">Appearance & Theme</h3>
        </div>
        <ThemeToggle />
      </div>

      {/* Preferences & Streak Rules */}
      <div className="rounded-xl border border-surface-border-dark bg-surface-dark p-5 shadow-sm space-y-4">
        <div className="flex items-center gap-2">
          <Shield className="w-4 h-4 text-streak" />
          <h3 className="font-display text-sm font-bold text-text-primary-dark">Tracker Preferences</h3>
        </div>

        {/* Streak Rule Toggle */}
        <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between pt-2 border-t border-surface-border-dark">
          <div>
            <h4 className="text-xs font-bold font-display text-text-primary-dark">Streak Calculation Rule</h4>
            <p className="text-[11px] font-mono text-text-muted-dark">
              Define what constitutes a completed day for streak calculations.
            </p>
          </div>
          <div className="flex items-center rounded-lg border border-surface-border-dark bg-surface-hover-dark/60 p-1 font-mono text-xs">
            <button
              onClick={() => setStreakRule('any-category')}
              className={`rounded-md px-3 py-1 font-semibold transition-colors ${
                streakRule === 'any-category' ? 'bg-streak text-white' : 'text-text-muted-dark hover:text-text-primary-dark'
              }`}
            >
              At Least 1 Category
            </button>
            <button
              onClick={() => setStreakRule('all-categories')}
              className={`rounded-md px-3 py-1 font-semibold transition-colors ${
                streakRule === 'all-categories' ? 'bg-streak text-white' : 'text-text-muted-dark hover:text-text-primary-dark'
              }`}
            >
              All Categories
            </button>
          </div>
        </div>

        {/* Week Starts On */}
        <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between pt-3 border-t border-surface-border-dark">
          <div>
            <h4 className="text-xs font-bold font-display text-text-primary-dark">First Day of the Week</h4>
            <p className="text-[11px] font-mono text-text-muted-dark">
              Adjust contribution calendar grid alignment.
            </p>
          </div>
          <div className="flex items-center rounded-lg border border-surface-border-dark bg-surface-hover-dark/60 p-1 font-mono text-xs">
            <button
              onClick={() => setWeekStartsOn('monday')}
              className={`rounded-md px-3 py-1 font-semibold transition-colors ${
                weekStartsOn === 'monday' ? 'bg-streak text-white' : 'text-text-muted-dark hover:text-text-primary-dark'
              }`}
            >
              Monday
            </button>
            <button
              onClick={() => setWeekStartsOn('sunday')}
              className={`rounded-md px-3 py-1 font-semibold transition-colors ${
                weekStartsOn === 'sunday' ? 'bg-streak text-white' : 'text-text-muted-dark hover:text-text-primary-dark'
              }`}
            >
              Sunday
            </button>
          </div>
        </div>

        {/* Daily Batch Size */}
        <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between pt-3 border-t border-surface-border-dark">
          <div>
            <h4 className="text-xs font-bold font-display text-text-primary-dark">Suggested DSA Batch Size</h4>
            <p className="text-[11px] font-mono text-text-muted-dark">
              Suggested daily problem quota for queue progress indicator (never locks runner).
            </p>
          </div>
          <div className="flex items-center gap-2 font-mono text-xs">
            <input
              type="number"
              min="1"
              max="50"
              value={dailyBatchSize}
              onChange={(e) => setDailyBatchSize(Math.max(1, Number(e.target.value)))}
              className="w-20 rounded-lg border border-surface-border-dark bg-surface-hover-dark px-3 py-1.5 text-center text-text-primary-dark focus:border-streak focus:outline-none"
            />
            <span className="text-text-muted-dark">problems/day</span>
          </div>
        </div>
      </div>

      {/* Data Backup & Restore */}
      <div className="rounded-xl border border-surface-border-dark bg-surface-dark p-5 shadow-sm space-y-3">
        <div className="flex items-center gap-2">
          <Database className="w-4 h-4 text-streak" />
          <h3 className="font-display text-sm font-bold text-text-primary-dark">Data Backup & Restore</h3>
        </div>
        <DataBackup />
      </div>

      {/* GitHub Sync */}
      <div className="rounded-xl border border-surface-border-dark bg-surface-dark p-5 shadow-sm">
        <GithubSyncPanel />
      </div>
    </div>
  );
};
