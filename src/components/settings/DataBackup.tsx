import React, { useRef, useState } from 'react';
import { Download, Upload, AlertTriangle, CheckCircle2 } from 'lucide-react';
import { useTaskStore } from '../../store/useTaskStore';
import { useGoalStore } from '../../store/useGoalStore';
import { useSettingsStore } from '../../store/useSettingsStore';
import { usePracticeStore } from '../../store/usePracticeStore';
import { getTodayStr } from '../../lib/dateUtils';

export const DataBackup: React.FC = () => {
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [statusMsg, setStatusMsg] = useState<{ type: 'success' | 'error'; text: string } | null>(null);

  const exportBackup = () => {
    try {
      const backupData = {
        version: '1.0.0',
        exportedAt: new Date().toISOString(),
        categories: useTaskStore.getState().categories,
        dayEntries: useTaskStore.getState().dayEntries,
        goals: useGoalStore.getState().goals,
        settings: useSettingsStore.getState().settings,
        practice: {
          queueOrder: usePracticeStore.getState().queueOrder,
          queuePointer: usePracticeStore.getState().queuePointer,
          todayBatchStart: usePracticeStore.getState().todayBatchStart,
          lastBatchDate: usePracticeStore.getState().lastBatchDate,
          solves: usePracticeStore.getState().solves,
          skipped: usePracticeStore.getState().skipped,
        },
      };

      const jsonStr = JSON.stringify(backupData, null, 2);
      const blob = new Blob([jsonStr], { type: 'application/json' });
      const url = URL.createObjectURL(blob);

      const a = document.createElement('a');
      a.href = url;
      a.download = `daily-tracker-backup-${getTodayStr()}.json`;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      URL.revokeObjectURL(url);

      setStatusMsg({ type: 'success', text: 'Backup exported successfully!' });
    } catch (err) {
      console.error(err);
      setStatusMsg({ type: 'error', text: 'Failed to export backup.' });
    }
  };

  const handleImportFile = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = (event) => {
      try {
        const json = JSON.parse(event.target?.result as string);
        if (!json.categories || !json.dayEntries) {
          throw new Error('Invalid backup file format: missing categories or dayEntries.');
        }

        if (window.confirm('Are you sure you want to import data? This will overwrite your current local data!')) {
          if (json.categories) useTaskStore.getState().setCategories(json.categories);
          if (json.dayEntries) useTaskStore.getState().setDayEntries(json.dayEntries);
          if (json.goals) useGoalStore.getState().setGoals(json.goals);
          if (json.settings) useSettingsStore.getState().setSettings(json.settings);
          if (json.practice) usePracticeStore.getState().setPracticeState(json.practice);

          setStatusMsg({ type: 'success', text: 'Data imported and restored successfully!' });
        }
      } catch (err: any) {
        console.error(err);
        setStatusMsg({ type: 'error', text: err.message || 'Invalid JSON backup file.' });
      }
    };
    reader.readAsText(file);
    // Reset file input
    e.target.value = '';
  };

  return (
    <div className="space-y-4">
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
        {/* Export Action */}
        <button
          onClick={exportBackup}
          className="flex items-center justify-center gap-2 rounded-xl border border-surface-border-dark bg-surface-hover-dark/60 p-3.5 font-display text-xs font-bold text-text-primary-dark hover:border-streak hover:text-streak transition-all"
        >
          <Download className="w-4 h-4 text-streak" />
          <span>Export Backup JSON</span>
        </button>

        {/* Import Action */}
        <button
          onClick={() => fileInputRef.current?.click()}
          className="flex items-center justify-center gap-2 rounded-xl border border-surface-border-dark bg-surface-hover-dark/60 p-3.5 font-display text-xs font-bold text-text-primary-dark hover:border-blue-400 hover:text-blue-400 transition-all"
        >
          <Upload className="w-4 h-4 text-blue-400" />
          <span>Import Restore JSON</span>
        </button>
        <input
          ref={fileInputRef}
          type="file"
          accept=".json"
          onChange={handleImportFile}
          className="hidden"
        />
      </div>

      {statusMsg && (
        <div
          className={`flex items-center gap-2 rounded-lg p-3 text-xs font-mono border ${
            statusMsg.type === 'success'
              ? 'border-emerald-500/30 bg-emerald-500/10 text-emerald-400'
              : 'border-rose-500/30 bg-rose-500/10 text-rose-400'
          }`}
        >
          {statusMsg.type === 'success' ? <CheckCircle2 className="w-4 h-4" /> : <AlertTriangle className="w-4 h-4" />}
          <span>{statusMsg.text}</span>
        </div>
      )}
    </div>
  );
};
