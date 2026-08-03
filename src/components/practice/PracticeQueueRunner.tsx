import React, { useMemo } from 'react';
import { usePracticeStore } from '../../store/usePracticeStore';
import { useTaskStore } from '../../store/useTaskStore';
import { useSettingsStore } from '../../store/useSettingsStore';
import { buildProblemMap, getUniqueProblemsCount } from '../../lib/problemUtils';
import { CurrentProblemCard } from './CurrentProblemCard';
import { DailyBatchPanel } from './DailyBatchPanel';
import { PatternBrowser } from './PatternBrowser';
import { getTodayStr } from '../../lib/dateUtils';

export const PracticeQueueRunner: React.FC = () => {
  const problemsData = usePracticeStore((state) => state.problemsData);
  const queueOrder = usePracticeStore((state) => state.queueOrder);
  const queuePointer = usePracticeStore((state) => state.queuePointer);
  const solves = usePracticeStore((state) => state.solves);
  
  const markCurrentSolved = usePracticeStore((state) => state.markCurrentSolved);
  const skipCurrent = usePracticeStore((state) => state.skipCurrent);
  const jumpToKey = usePracticeStore((state) => state.jumpToKey);
  const shuffleRemaining = usePracticeStore((state) => state.shuffleRemaining);
  const checkBatchReset = usePracticeStore((state) => state.checkBatchReset);

  const incrementTaskCount = useTaskStore((state) => state.incrementTaskCount);
  const dailyBatchSize = useSettingsStore((state) => state.settings.dailyBatchSize);

  // Check if today is a new batch date
  React.useEffect(() => {
    checkBatchReset();
  }, [checkBatchReset]);

  // Build problem map
  const problemMap = useMemo(() => buildProblemMap(problemsData), [problemsData]);

  // Current problem key & data
  const currentKey = queuePointer < queueOrder.length ? queueOrder[queuePointer] : null;
  const currentProblem = currentKey ? problemMap.get(currentKey) || null : null;

  // Stats calculation
  const totalUniqueSolved = getUniqueProblemsCount(solves);
  const totalUniqueProblems = problemsData.meta.totalUniqueProblems || 389;

  // Count solves recorded today
  const todayStr = getTodayStr();
  const todaySolvesCount = Object.values(solves).filter((s) => s.solvedAt === todayStr).length;

  const handleMarkSolved = () => {
    const solvedKey = markCurrentSolved();
    if (solvedKey) {
      // Auto-increment today's LeetCode category count in useTaskStore
      incrementTaskCount(todayStr, 'leetcode', 1);
    }
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <h2 className="font-display text-xl font-bold tracking-tight text-text-primary-dark">
          DSA Pattern Practice Queue
        </h2>
        <p className="text-xs font-mono text-text-muted-dark">
          Self-loading problem-by-problem runner backed by 15-category pattern sheet.
        </p>
      </div>

      {/* Hero Current Problem Card */}
      <CurrentProblemCard
        currentProblem={currentProblem}
        onMarkSolved={handleMarkSolved}
        onSkip={skipCurrent}
        onShuffle={shuffleRemaining}
      />

      {/* Today's Batch Progress Bar Panel */}
      <DailyBatchPanel
        todaySolvesCount={todaySolvesCount}
        dailyBatchSize={dailyBatchSize}
        totalUniqueSolved={totalUniqueSolved}
        totalUniqueProblems={totalUniqueProblems}
      />

      {/* Collapsible Pattern Browser Tree */}
      <PatternBrowser
        categories={problemsData.categories}
        solves={solves}
        currentKey={currentKey}
        onSelectKey={jumpToKey}
      />
    </div>
  );
};
