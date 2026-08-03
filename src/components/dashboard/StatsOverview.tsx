import React from 'react';
import { Flame, Trophy, CheckSquare, TrendingUp } from 'lucide-react';
import { useStreak } from '../../hooks/useStreak';
import { useTaskStore } from '../../store/useTaskStore';
import { getTrailingDates } from '../../lib/dateUtils';
import { isDayCompleted } from '../../lib/streakUtils';

export const StatsOverview: React.FC = () => {
  const streakStats = useStreak();
  const categories = useTaskStore((state) => state.categories);
  const dayEntries = useTaskStore((state) => state.dayEntries);

  // Calculate this week's completion count (trailing 7 days)
  const trailing7 = getTrailingDates(7);
  let completedThisWeek = 0;
  trailing7.forEach((d) => {
    if (isDayCompleted(dayEntries[d], categories)) {
      completedThisWeek++;
    }
  });

  const weeklyPercentage = Math.round((completedThisWeek / 7) * 100);

  return (
    <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
      <div className="rounded-xl border border-surface-border-dark bg-surface-dark p-4 shadow-sm">
        <div className="flex items-center justify-between text-xs font-mono text-text-muted-dark mb-1">
          <span>CURRENT STREAK</span>
          <Flame className="w-4 h-4 text-streak" />
        </div>
        <p className="font-mono text-3xl font-extrabold text-streak">{streakStats.currentStreak} Days</p>
        <p className="text-[11px] font-mono text-text-muted-dark mt-1">Keep logging daily to hold your flame</p>
      </div>

      <div className="rounded-xl border border-surface-border-dark bg-surface-dark p-4 shadow-sm">
        <div className="flex items-center justify-between text-xs font-mono text-text-muted-dark mb-1">
          <span>LONGEST STREAK</span>
          <Trophy className="w-4 h-4 text-amber-400" />
        </div>
        <p className="font-mono text-3xl font-extrabold text-text-primary-dark">{streakStats.longestStreak} Days</p>
        <p className="text-[11px] font-mono text-text-muted-dark mt-1">All-time record high streak</p>
      </div>

      <div className="rounded-xl border border-surface-border-dark bg-surface-dark p-4 shadow-sm">
        <div className="flex items-center justify-between text-xs font-mono text-text-muted-dark mb-1">
          <span>THIS WEEK'S RATE</span>
          <TrendingUp className="w-4 h-4 text-emerald-400" />
        </div>
        <p className="font-mono text-3xl font-extrabold text-emerald-400">{weeklyPercentage}%</p>
        <p className="text-[11px] font-mono text-text-muted-dark mt-1">{completedThisWeek} / 7 days completed</p>
      </div>

      <div className="rounded-xl border border-surface-border-dark bg-surface-dark p-4 shadow-sm">
        <div className="flex items-center justify-between text-xs font-mono text-text-muted-dark mb-1">
          <span>TOTAL LOGGED DAYS</span>
          <CheckSquare className="w-4 h-4 text-blue-400" />
        </div>
        <p className="font-mono text-3xl font-extrabold text-text-primary-dark">{streakStats.totalCompletedDays} Days</p>
        <p className="text-[11px] font-mono text-text-muted-dark mt-1">Total days with recorded activity</p>
      </div>
    </div>
  );
};
