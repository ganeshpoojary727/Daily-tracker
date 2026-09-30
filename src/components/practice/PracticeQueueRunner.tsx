import React, { useMemo, useState } from 'react';
import { usePracticeStore } from '../../store/usePracticeStore';
import { useSettingsStore } from '../../store/useSettingsStore';
import { buildProblemMap, computeSheetProgress, getNextUnsolvedIndex } from '../../lib/problemUtils';
import { CurrentProblemCard } from './CurrentProblemCard';
import { DailyBatchPanel } from './DailyBatchPanel';
import { PatternBrowser } from './PatternBrowser';
import { SheetSwitcher } from './SheetSwitcher';
import { AddSheetModal } from './AddSheetModal';
import { getTodayStr } from '../../lib/dateUtils';
import { CheckCircle2 } from 'lucide-react';

export const PracticeQueueRunner: React.FC = () => {
  const sheets = usePracticeStore((state) => state.sheets);
  const activeSheetId = usePracticeStore((state) => state.activeSheetId);
  const statesBySheet = usePracticeStore((state) => state.statesBySheet);

  const setActiveSheetId = usePracticeStore((state) => state.setActiveSheetId);
  const addSheet = usePracticeStore((state) => state.addSheet);
  const deleteSheet = usePracticeStore((state) => state.deleteSheet);
  const toggleSolved = usePracticeStore((state) => state.toggleSolved);
  const markCurrentSolved = usePracticeStore((state) => state.markCurrentSolved);
  const skipCurrent = usePracticeStore((state) => state.skipCurrent);
  const jumpToKey = usePracticeStore((state) => state.jumpToKey);
  const shuffleRemaining = usePracticeStore((state) => state.shuffleRemaining);
  const checkBatchReset = usePracticeStore((state) => state.checkBatchReset);
  const tagRevisit = usePracticeStore((state) => state.tagRevisit);
  const untagRevisit = usePracticeStore((state) => state.untagRevisit);

  const dailyBatchSize = useSettingsStore((state) => state.settings.dailyBatchSize);
  const [isAddModalOpen, setIsAddModalOpen] = useState(false);
  const [reviewProblemKey, setReviewProblemKey] = useState<string | null>(null);

  // Active sheet & state
  const activeSheet = sheets[activeSheetId] || Object.values(sheets)[0];
  const activeState = statesBySheet[activeSheet?.id] || {
    queueOrder: [],
    queuePointer: 0,
    todayBatchStart: 0,
    lastBatchDate: getTodayStr(),
    solves: {},
    skipped: [],
    revisitKeys: {},
  };

  // Check batch reset on load/switch and clear review problem on sheet switch
  React.useEffect(() => {
    checkBatchReset();
    setReviewProblemKey(null);
  }, [checkBatchReset, activeSheetId]);

  // Map of problems in active sheet
  const problemMap = useMemo(() => (activeSheet ? buildProblemMap(activeSheet) : new Map()), [activeSheet]);

  // Current problem key & data (automatically skipping already-solved problems)
  const currentPointer = getNextUnsolvedIndex(activeState.queueOrder, activeState.queuePointer, activeState.solves);
  const queueKey = currentPointer < activeState.queueOrder.length ? activeState.queueOrder[currentPointer] : null;

  // Selected problem: if user clicked a solved problem, show in review mode; otherwise show active queue head
  const effectiveKey = reviewProblemKey || queueKey;
  const displayedProblem = effectiveKey ? problemMap.get(effectiveKey) || null : null;
  const isReviewMode = Boolean(reviewProblemKey && effectiveKey && activeState.solves[effectiveKey]);
  const solveData = effectiveKey ? activeState.solves[effectiveKey] || null : null;
  const isRevisitTagged = Boolean(effectiveKey && (activeState.revisitKeys || {})[effectiveKey]);

  const handleSelectKey = (key: string) => {
    if (activeState.solves[key]) {
      // Solved problem clicked: open in review mode without disrupting queue position or solve date
      setReviewProblemKey(key);
      window.scrollTo({ top: 0, behavior: 'smooth' });
    } else {
      // Unsolved problem: jump queue pointer and clear review mode
      setReviewProblemKey(null);
      jumpToKey(key);
      window.scrollTo({ top: 0, behavior: 'smooth' });
    }
  };

  // Active sheet progress
  const activeSheetProgress = computeSheetProgress(activeSheet, activeState.solves);

  // Combined stats across ALL sheets
  const combinedStats = useMemo(() => {
    let totalSolvedAll = 0;
    let totalProblemsAll = 0;
    const sheetBreakdowns: { title: string; solved: number; total: number }[] = [];

    for (const sheet of Object.values(sheets)) {
      const st = statesBySheet[sheet.id];
      const prog = computeSheetProgress(sheet, st?.solves || {});
      totalSolvedAll += prog.solved;
      totalProblemsAll += prog.total;
      sheetBreakdowns.push({
        title: sheet.meta.title,
        solved: prog.solved,
        total: prog.total,
      });
    }

    return { totalSolvedAll, totalProblemsAll, sheetBreakdowns };
  }, [sheets, statesBySheet]);

  // Solves count recorded today on active sheet
  const todayStr = getTodayStr();
  const todaySolvesCount = Object.values(activeState.solves).filter((s) => s.solvedAt === todayStr).length;

  return (
    <div className="space-y-6">
      {/* Page Header */}
      <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h2 className="font-display text-xl font-bold tracking-tight text-text-primary-dark">
            Practice Queue
          </h2>
          <p className="text-xs font-mono text-text-muted-dark">
            Multi-sheet problem runner with independent queues and progress tracking.
          </p>
        </div>

        {/* Combined Stats Badge Card */}
        <div className="flex items-center gap-3 rounded-xl border border-surface-border-dark bg-surface-dark px-4 py-2 text-xs font-mono">
          <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0" />
          <div>
            <div className="font-bold text-text-primary-dark">
              {combinedStats.totalSolvedAll} / {combinedStats.totalProblemsAll} Solved Across All Sheets
            </div>
            <div className="text-[11px] text-text-muted-dark truncate max-w-xs">
              {combinedStats.sheetBreakdowns.map((b) => `${b.title}: ${b.solved}/${b.total}`).join(' · ')}
            </div>
          </div>
        </div>
      </div>

      {/* Sheet Switcher Tabs */}
      <SheetSwitcher
        sheets={sheets}
        activeSheetId={activeSheetId}
        statesBySheet={statesBySheet}
        onSelectSheet={setActiveSheetId}
        onOpenAddModal={() => setIsAddModalOpen(true)}
        onDeleteSheet={deleteSheet}
      />

      {/* Hero Current Problem Card */}
      <CurrentProblemCard
        currentProblem={displayedProblem}
        solve={solveData}
        isReviewMode={isReviewMode}
        isRevisitTagged={isRevisitTagged}
        onMarkSolved={() => {
          setReviewProblemKey(null);
          markCurrentSolved();
        }}
        onSkip={() => {
          setReviewProblemKey(null);
          skipCurrent();
        }}
        onShuffle={shuffleRemaining}
        onExitReview={() => setReviewProblemKey(null)}
        onTagRevisit={() => {
          if (effectiveKey) tagRevisit(activeSheetId, effectiveKey);
        }}
        onUntagRevisit={() => {
          if (effectiveKey) untagRevisit(activeSheetId, effectiveKey);
        }}
      />

      {/* Today's Batch & Sheet Progress Panel */}
      <DailyBatchPanel
        todaySolvesCount={todaySolvesCount}
        dailyBatchSize={dailyBatchSize}
        totalUniqueSolved={activeSheetProgress.solved}
        totalUniqueProblems={activeSheetProgress.total}
      />

      {/* Collapsible Pattern Browser Tree */}
      {activeSheet && (
        <PatternBrowser
          key={activeSheet.id}
          sheet={activeSheet}
          solves={activeState.solves}
          revisitKeys={activeState.revisitKeys || {}}
          currentKey={effectiveKey}
          onSelectKey={handleSelectKey}
          onToggleSolved={(patternId, problemId) => {
            if (reviewProblemKey) {
              const currentProbKey = effectiveKey;
              if (currentProbKey && currentProbKey.endsWith(`:${problemId}`)) {
                setReviewProblemKey(null);
              }
            }
            toggleSolved(activeSheetId, patternId, problemId);
          }}
        />
      )}

      {/* Add Sheet Modal */}
      <AddSheetModal
        isOpen={isAddModalOpen}
        onClose={() => setIsAddModalOpen(false)}
        onAddSheet={(sheet) => addSheet(sheet)}
      />
    </div>
  );
};

