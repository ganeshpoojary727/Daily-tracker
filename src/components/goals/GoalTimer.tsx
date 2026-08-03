import React from 'react';
import { Clock, AlertTriangle, CheckCircle2 } from 'lucide-react';
import { Goal } from '../../types';
import { useCountdown } from '../../hooks/useCountdown';
import { ProgressBar } from '../ui/ProgressBar';

interface GoalTimerItemProps {
  goal: Goal;
}

const GoalTimerItem: React.FC<GoalTimerItemProps> = ({ goal }) => {
  const countdown = useCountdown(goal.endDate);

  return (
    <div
      className={`rounded-lg border p-3 transition-colors ${
        countdown.isNearDeadline && goal.status === 'active'
          ? 'border-amber-500/50 bg-amber-500/10'
          : 'border-surface-border-dark bg-surface-hover-dark/40'
      }`}
    >
      <div className="flex items-center justify-between gap-2 mb-1.5">
        <h4 className="text-xs font-semibold text-text-primary-dark truncate" title={goal.title}>
          {goal.title}
        </h4>
        {goal.status === 'completed' && <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400 shrink-0" />}
      </div>

      {/* Countdown Timer */}
      <div className="flex items-center justify-between text-[11px] font-mono mb-2">
        <div className="flex items-center gap-1 text-text-muted-dark">
          <Clock className="w-3 h-3 text-streak" />
          <span>Deadline:</span>
        </div>
        {countdown.isExpired ? (
          <span className="text-rose-400 font-semibold uppercase">EXPIRED</span>
        ) : (
          <span className={`font-semibold ${countdown.isNearDeadline ? 'text-amber-400 animate-pulse' : 'text-streak'}`}>
            {countdown.days > 0 && `${countdown.days}d `}
            {String(countdown.hours).padStart(2, '0')}:{String(countdown.minutes).padStart(2, '0')}:
            {String(countdown.seconds).padStart(2, '0')}
          </span>
        )}
      </div>

      {/* Near deadline alert warning */}
      {countdown.isNearDeadline && !countdown.isExpired && goal.status === 'active' && (
        <div className="flex items-center gap-1 text-[10px] text-amber-400 font-mono mb-1.5">
          <AlertTriangle className="w-3 h-3 shrink-0" />
          <span>Less than 24 hours left!</span>
        </div>
      )}

      {/* Goal Progress Bar */}
      <ProgressBar value={goal.currentValue} max={goal.targetValue} heightClass="h-1.5" showText={true} />
    </div>
  );
};

interface GoalTimerSidebarWidgetProps {
  goals: Goal[];
  onOpenGoalsTab: () => void;
}

export const GoalTimerSidebarWidget: React.FC<GoalTimerSidebarWidgetProps> = ({ goals, onOpenGoalsTab }) => {
  const activeGoals = goals
    .filter((g) => g.status === 'active')
    .sort((a, b) => new Date(a.endDate).getTime() - new Date(b.endDate).getTime());

  return (
    <div className="flex flex-col gap-2 rounded-xl border border-surface-border-dark bg-surface-dark p-3">
      <div className="flex items-center justify-between border-b border-surface-border-dark pb-2">
        <div className="flex items-center gap-1.5 font-display text-xs font-bold text-text-primary-dark uppercase tracking-wider">
          <Clock className="w-3.5 h-3.5 text-streak" />
          <span>Active Countdowns</span>
        </div>
        <button
          onClick={onOpenGoalsTab}
          className="text-[10px] font-mono text-streak hover:underline"
        >
          View All ({activeGoals.length})
        </button>
      </div>

      {activeGoals.length === 0 ? (
        <p className="text-[11px] font-mono text-text-muted-dark text-center py-2">
          No active goals. Add one in Goals tab.
        </p>
      ) : (
        <div className="flex flex-col gap-2 max-h-60 overflow-y-auto pr-1">
          {activeGoals.slice(0, 3).map((goal) => (
            <GoalTimerItem key={goal.id} goal={goal} />
          ))}
        </div>
      )}
    </div>
  );
};
