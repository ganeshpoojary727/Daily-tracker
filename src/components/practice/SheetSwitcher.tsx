import React from 'react';
import { Plus, Trash2, Layers } from 'lucide-react';
import { PracticeSheet, PracticeState } from '../../types';
import { computeSheetProgress } from '../../lib/problemUtils';

interface SheetSwitcherProps {
  sheets: Record<string, PracticeSheet>;
  activeSheetId: string;
  statesBySheet: Record<string, PracticeState>;
  onSelectSheet: (sheetId: string) => void;
  onOpenAddModal: () => void;
  onDeleteSheet: (sheetId: string) => void;
}

export const SheetSwitcher: React.FC<SheetSwitcherProps> = ({
  sheets,
  activeSheetId,
  statesBySheet,
  onSelectSheet,
  onOpenAddModal,
  onDeleteSheet,
}) => {
  const sheetList = Object.values(sheets);

  return (
    <div className="flex flex-wrap items-center gap-2 border-b border-surface-border-dark/60 pb-3">
      <div className="flex items-center gap-1.5 text-xs font-mono text-text-muted-dark mr-2">
        <Layers className="w-4 h-4 text-streak" />
        <span className="font-bold text-text-primary-dark">Practice Sheets:</span>
      </div>

      {sheetList.map((sheet) => {
        const isActive = sheet.id === activeSheetId;
        const sheetState = statesBySheet[sheet.id];
        const progress = computeSheetProgress(sheet, sheetState?.solves || {});

        return (
          <div
            key={sheet.id}
            className={`group relative flex items-center gap-2 rounded-xl border px-3 py-1.5 font-sans text-xs transition-all cursor-pointer ${
              isActive
                ? 'bg-streak border-streak text-white font-bold shadow-md shadow-streak/20'
                : 'bg-surface-dark border-surface-border-dark text-text-muted-dark hover:bg-surface-hover-dark hover:text-text-primary-dark'
            }`}
            onClick={() => onSelectSheet(sheet.id)}
          >
            <span>{sheet.meta.title}</span>
            <span
              className={`font-mono text-[10px] px-1.5 py-0.5 rounded-full ${
                isActive ? 'bg-white/20 text-white' : 'bg-surface-hover-dark text-text-muted-dark border border-surface-border-dark'
              }`}
            >
              {progress.solved}/{progress.total}
            </span>

            {/* Delete icon for custom uploaded sheets */}
            {!sheet.isBuiltIn && (
              <button
                type="button"
                onClick={(e) => {
                  e.stopPropagation();
                  if (window.confirm(`Are you sure you want to delete "${sheet.meta.title}"? Progress history will be removed from this sheet, but completed daily streak entries will remain.`)) {
                    onDeleteSheet(sheet.id);
                  }
                }}
                className={`p-1 rounded opacity-0 group-hover:opacity-100 transition-opacity hover:text-rose-400 ${
                  isActive ? 'text-white/80 hover:text-white hover:bg-white/10' : 'text-text-muted-dark hover:bg-surface-hover-dark'
                }`}
                title="Delete practice sheet"
              >
                <Trash2 className="w-3.5 h-3.5" />
              </button>
            )}
          </div>
        );
      })}

      {/* Add Sheet Action Pill */}
      <button
        onClick={onOpenAddModal}
        className="flex items-center gap-1.5 rounded-xl border border-dashed border-streak/60 bg-streak/5 px-3 py-1.5 font-display text-xs font-semibold text-streak hover:bg-streak/15 hover:border-streak transition-all"
      >
        <Plus className="w-3.5 h-3.5" />
        <span>Add Sheet</span>
      </button>
    </div>
  );
};
