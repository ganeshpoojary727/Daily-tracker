import React from 'react';
import { Clock, Trash2, CheckCircle2, AlertCircle, Plus, Minus } from 'lucide-react';
import { Goal, Category } from '../../types';
import { useCountdown } from '../../hooks/useCountdown';
import { ProgressBar } from '../ui/ProgressBar';

interface GoalCardProps {
  goal: Goal;
  category?: Category;
  onUpdateProgress: (id: string, value: number) => void;
  onDelete: (id: string) => void;
}

export const GoalCard: React.FC<GoalCardProps> = ({
  goal,
  category,
  onUpdateProgress,
  onDelete,
}) => {
  const countdown = useCountdown(goal.endDate);

  const getStatusBadge = () => {
    if (goal.status === 'completed') {
      return (
        <span className="flex items-center gap-1 rounded-full bg-emerald-500/20 px-2.5 py-0.5 font-mono text-[10px] font-bold text-emerald-400 border border-emerald-500/30">
          <CheckCircle2 className="w-3 h-3" />
          COMPLETED
        </span>
      );
    }
    if (goal.status === 'failed' || countdown.isExpired) {
      return (
        <span className="flex items-center gap-1 rounded-full bg-rose-500/20 px-2.5 py-0.5 font-mono text-[10px] font-bold text-rose-400 border border-rose-500/30">
          <AlertCircle className="w-3 h-3" />
          MISSED
        </span>
      );
    }
    return (
      <span className="flex items-center gap-1 rounded-full bg-streak/20 px-2.5 py-0.5 font-mono text-[10px] font-bold text-streak border border-streak/30">
        <Clock className="w-3 h-3" />
        ACTIVE
      </span>
    );
  };

  return (
    <div className="flex flex-col justify-between rounded-xl border border-surface-border-dark bg-surface-dark p-4 shadow-sm hover:border-surface-border-dark/80 transition-all">
      <div>
        {/* Header & Badges */}
        <div className="flex items-start justify-between gap-2 mb-2">
          <div>
            <div className="flex items-center gap-2 mb-1">
              {getStatusBadge()}
              {category && (
                <span
                  className="rounded-full px-2 py-0.5 text-[10px] font-mono font-semibold"
                  style={{ backgroundColor: `${category.color}20`, color: category.color }}
                >
                  {category.name}
                </span>
              )}
            </div>
            <h3 className="font-display font-bold text-base text-text-primary-dark">{goal.title}</h3>
          </div>

          <button
            onClick={() => onDelete(goal.id)}
            className="rounded-lg p-1.5 text-text-muted-dark hover:bg-surface-hover-dark hover:text-rose-400 transition-colors"
            title="Delete goal"
          >
            <Trash2 className="w-4 h-4" />
          </button>
        </div>

        {/* Live Countdown Display */}
        <div className="my-3 rounded-lg border border-surface-border-dark bg-surface-hover-dark/40 p-2.5 flex items-center justify-between font-mono text-xs">
          <span className="text-text-muted-dark">Deadline Countdown:</span>
          {countdown.isExpired ? (
            <span className="font-bold text-rose-400">Deadline Passed</span>
          ) : (
            <span className={`font-bold ${countdown.isNearDeadline ? 'text-amber-400 animate-pulse' : 'text-streak'}`}>
              {countdown.days}d {String(countdown.hours).padStart(2, '0')}h {String(countdown.minutes).padStart(2, '0')}m {String(countdown.seconds).padStart(2, '0')}s
            </span>
          )}
        </div>

        {/* Progress Bar */}
        <div className="mt-4 space-y-1.5">
          <ProgressBar
            value={goal.currentValue}
            max={goal.targetValue}
            color={category?.color || '#E8590C'}
            heightClass="h-2.5"
            showText={true}
          />
        </div>
      </div>

      {/* Manual Progress Increment Control if unlinked */}
      {!goal.categoryId && goal.status === 'active' && (
        <div className="mt-4 pt-3 border-t border-surface-border-dark flex items-center justify-between">
          <span className="text-xs font-mono text-text-muted-dark">Manual Progress:</span>
          <div className="flex items-center rounded-lg border border-surface-border-dark bg-surface-hover-dark">
            <button
              onClick={() => onUpdateProgress(goal.id, Math.max(0, goal.currentValue - 1))}
              className="px-2 py-1 text-text-muted-dark hover:text-white"
            >
              <Minus className="w-3 h-3" />
            </button>
            <span className="px-2 font-mono text-xs font-bold text-text-primary-dark">{goal.currentValue}</span>
            <button
              onClick={() => onUpdateProgress(goal.id, goal.currentValue + 1)}
              className="px-2 py-1 text-text-muted-dark hover:text-white"
            >
              <Plus className="w-3 h-3" />
            </button>
          </div>
        </div>
      )}
    </div>
  );
};
