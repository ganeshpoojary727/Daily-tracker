import React from 'react';
import { Target, Flame, CheckCircle2 } from 'lucide-react';
import { ProgressBar } from '../ui/ProgressBar';

interface DailyBatchPanelProps {
  todaySolvesCount: number;
  dailyBatchSize: number;
  totalUniqueSolved: number;
  totalUniqueProblems: number;
}

export const DailyBatchPanel: React.FC<DailyBatchPanelProps> = ({
  todaySolvesCount,
  dailyBatchSize,
  totalUniqueSolved,
  totalUniqueProblems,
}) => {
  const isBatchCompleted = todaySolvesCount >= dailyBatchSize;

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
      {/* Today's Suggested Batch Card */}
      <div className="rounded-xl border border-surface-border-dark bg-surface-dark p-4 shadow-sm">
        <div className="flex items-center justify-between mb-2">
          <div className="flex items-center gap-2">
            <Target className="w-4 h-4 text-streak" />
            <span className="font-display text-xs font-bold text-text-primary-dark">
              Today's Suggested Practice Batch
            </span>
          </div>
          <span className="font-mono text-xs font-bold text-streak">
            {todaySolvesCount} / {dailyBatchSize} Problems
          </span>
        </div>

        <ProgressBar
          value={todaySolvesCount}
          max={dailyBatchSize}
          color="#E8590C"
          heightClass="h-2"
        />

        {isBatchCompleted ? (
          <p className="text-[11px] font-mono text-emerald-400 mt-2 flex items-center gap-1">
            <CheckCircle2 className="w-3 h-3" />
            <span>Quota hit! Keep going as much as you want — queue never locks!</span>
          </p>
        ) : (
          <p className="text-[11px] font-mono text-text-muted-dark mt-2">
            Suggested batch size: {dailyBatchSize}. Solve more anytime!
          </p>
        )}
      </div>

      {/* Headline Overall Progress Card */}
      <div className="rounded-xl border border-surface-border-dark bg-surface-dark p-4 shadow-sm">
        <div className="flex items-center justify-between mb-2">
          <div className="flex items-center gap-2">
            <Flame className="w-4 h-4 text-purple-400" />
            <span className="font-display text-xs font-bold text-text-primary-dark">
              Unique LeetCode Solved
            </span>
          </div>
          <span className="font-mono text-xs font-bold text-purple-400">
            {totalUniqueSolved} / {totalUniqueProblems} Unique
          </span>
        </div>

        <ProgressBar
          value={totalUniqueSolved}
          max={totalUniqueProblems}
          color="#9F7AEA"
          heightClass="h-2"
        />

        <p className="text-[11px] font-mono text-text-muted-dark mt-2">
          {Math.round((totalUniqueSolved / totalUniqueProblems) * 100)}% of full 15-category pattern sheet completed
        </p>
      </div>
    </div>
  );
};
