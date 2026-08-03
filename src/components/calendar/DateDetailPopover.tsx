import React from 'react';
import { Check, X, Edit3 } from 'lucide-react';
import { Category, DayEntry } from '../../types';
import { formatDateStr } from '../../lib/dateUtils';

interface DateDetailPopoverProps {
  dateStr: string;
  dayEntry?: DayEntry;
  categories: Category[];
  onClose: () => void;
  onGoToDate: (dateStr: string) => void;
}

export const DateDetailPopover: React.FC<DateDetailPopoverProps> = ({
  dateStr,
  dayEntry,
  categories,
  onClose,
  onGoToDate,
}) => {
  const activeCategories = categories.filter((c) => !c.archived);
  const tasks = dayEntry?.tasks || {};

  return (
    <div className="absolute z-40 w-72 rounded-xl border border-surface-border-dark bg-surface-dark p-4 shadow-2xl backdrop-blur-md">
      <div className="flex items-center justify-between border-b border-surface-border-dark pb-2 mb-3">
        <h4 className="font-display font-bold text-xs text-text-primary-dark">
          {formatDateStr(dateStr, 'EEEE, MMM d, yyyy')}
        </h4>
        <button onClick={onClose} className="text-text-muted-dark hover:text-white">
          <X className="w-4 h-4" />
        </button>
      </div>

      <div className="space-y-2 mb-3 max-h-48 overflow-y-auto">
        {activeCategories.map((cat) => {
          const task = tasks[cat.id];
          const isDone = !!task?.done;
          return (
            <div key={cat.id} className="flex items-center justify-between text-xs">
              <div className="flex items-center gap-2">
                <span
                  className="h-2 w-2 rounded-full"
                  style={{ backgroundColor: cat.color }}
                />
                <span className="text-text-primary-dark font-medium">{cat.name}</span>
              </div>
              <div className="flex items-center gap-1">
                {isDone ? (
                  <span className="flex items-center gap-1 font-mono text-[10px] text-emerald-400 font-semibold">
                    <Check className="w-3 h-3" />
                    {task.count ? `${task.count} ${cat.unit || ''}` : 'Done'}
                  </span>
                ) : (
                  <span className="font-mono text-[10px] text-text-muted-dark">Not logged</span>
                )}
              </div>
            </div>
          );
        })}
      </div>

      <button
        onClick={() => onGoToDate(dateStr)}
        className="flex w-full items-center justify-center gap-2 rounded-lg bg-surface-hover-dark py-1.5 font-display text-xs font-semibold text-text-primary-dark hover:bg-streak hover:text-white transition-colors"
      >
        <Edit3 className="w-3.5 h-3.5" />
        <span>Log / Edit for this Date</span>
      </button>
    </div>
  );
};
