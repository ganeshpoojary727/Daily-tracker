import React from 'react';
import { ExternalLink, CheckCircle2, SkipForward, Shuffle, Sparkles, BookOpen, Bookmark } from 'lucide-react';
import { FlattenedProblem } from '../../lib/problemUtils';
import { ProblemSolve } from '../../types';
import { formatDateStr } from '../../lib/dateUtils';

interface CurrentProblemCardProps {
  currentProblem: FlattenedProblem | null;
  solve?: ProblemSolve | null;
  isReviewMode?: boolean;
  isRevisitTagged?: boolean;
  onMarkSolved: () => void;
  onSkip: () => void;
  onShuffle: () => void;
  onExitReview?: () => void;
  onTagRevisit?: () => void;
  onUntagRevisit?: () => void;
}

export const CurrentProblemCard: React.FC<CurrentProblemCardProps> = ({
  currentProblem,
  solve,
  isReviewMode = false,
  isRevisitTagged = false,
  onMarkSolved,
  onSkip,
  onShuffle,
  onExitReview,
  onTagRevisit,
  onUntagRevisit,
}) => {
  if (!currentProblem) {
    return (
      <div className="rounded-xl border border-surface-border-dark bg-surface-dark p-8 text-center">
        <Sparkles className="w-10 h-10 text-streak mx-auto mb-3" />
        <h3 className="font-display text-lg font-bold text-text-primary-dark">Queue Complete!</h3>
        <p className="text-xs font-mono text-text-muted-dark mt-1">
          You have solved all problems in the current queue.
        </p>
      </div>
    );
  }

  const { category, pattern, problem } = currentProblem;

  return (
    <div className={`relative overflow-hidden rounded-2xl border bg-gradient-to-b from-surface-dark to-bg-dark p-6 shadow-xl transition-all ${
      isReviewMode ? 'border-emerald-500/40 ring-1 ring-emerald-500/20' : 'border-streak/40'
    }`}>
      {/* Decorative accent background glow */}
      <div className={`absolute -top-16 -right-16 h-40 w-40 rounded-full blur-3xl pointer-events-none ${
        isReviewMode ? 'bg-emerald-500/10' : 'bg-streak/10'
      }`} />

      {/* Breadcrumb Tags */}
      <div className="flex flex-wrap items-center justify-between gap-2 mb-3">
        <div className="flex flex-wrap items-center gap-2">
          <span className="rounded-md bg-surface-hover-dark px-2.5 py-1 text-[11px] font-mono font-semibold text-text-muted-dark border border-surface-border-dark">
            {category.name} {category.roman ? `(${category.roman})` : ''}
          </span>
          <span className={`rounded-md px-2.5 py-1 text-[11px] font-mono font-bold border ${
            isReviewMode
              ? 'bg-emerald-500/15 text-emerald-400 border-emerald-500/30'
              : 'bg-streak/15 text-streak border border-streak/30'
          }`}>
            Pattern: {pattern.name}
          </span>
          {pattern.hasVideo && (
            <span className="rounded-md bg-purple-500/15 px-2 py-0.5 text-[10px] font-mono font-bold text-purple-400 border border-purple-500/30">
              VIDEO LESSON
            </span>
          )}
        </div>

        <div className="flex items-center gap-2">
          {isReviewMode && (
            <span className="flex items-center gap-1.5 rounded-full bg-emerald-500/15 border border-emerald-500/30 px-3 py-1 text-xs font-mono font-semibold text-emerald-400">
              <CheckCircle2 className="w-3.5 h-3.5" />
              <span>Finished on {solve?.solvedAt ? formatDateStr(solve.solvedAt, 'MMM d, yyyy') : 'Completed'}</span>
            </span>
          )}
          {isRevisitTagged && (
            <span className="flex items-center gap-1.5 rounded-full bg-amber-500/15 border border-amber-500/30 px-3 py-1 text-xs font-mono font-semibold text-amber-400">
              <Bookmark className="w-3.5 h-3.5 fill-amber-400" />
              <span>Revisit Later</span>
            </span>
          )}
        </div>
      </div>

      {/* Problem Title & Notes */}
      <div className="mb-6">
        {problem.number !== undefined && (
          <div className="flex items-center gap-2 text-xs font-mono text-text-muted-dark mb-1">
            <span>Problem #{problem.number}</span>
          </div>
        )}
        <h3 className="font-display text-2xl font-extrabold text-text-primary-dark tracking-tight">
          {problem.title}
        </h3>

        {/* Short Hint / Notes */}
        {problem.notes && (
          <div className="mt-3 flex items-start gap-2 rounded-xl border border-surface-border-dark/60 bg-surface-hover-dark/40 p-3 text-xs text-text-muted-dark font-mono">
            <BookOpen className="w-4 h-4 text-streak shrink-0 mt-0.5" />
            <div className="flex-1">
              <span className="font-semibold text-text-primary-dark block mb-0.5">Notes / Hint:</span>
              <span>{problem.notes}</span>
            </div>
          </div>
        )}
      </div>

      {/* Action Buttons */}
      <div className="flex flex-wrap items-center justify-between gap-3 pt-4 border-t border-surface-border-dark/60">
        {/* Left: External Link + Revisit Tag */}
        <div className="flex items-center gap-2">
          {problem.url && (
            <a
              href={problem.url}
              target="_blank"
              rel="noopener noreferrer"
              className="flex items-center gap-2 rounded-xl border border-surface-border-dark bg-surface-hover-dark px-4 py-2.5 font-display text-xs font-semibold text-text-primary-dark hover:border-streak hover:text-streak transition-all shadow-sm"
            >
              <span>Open Problem</span>
              <ExternalLink className="w-3.5 h-3.5" />
            </a>
          )}

          {/* Revisit Later Toggle */}
          {isRevisitTagged ? (
            <button
              type="button"
              onClick={onUntagRevisit}
              className="flex items-center gap-1.5 rounded-xl border border-amber-500/40 bg-amber-500/15 px-3 py-2.5 font-mono text-xs font-semibold text-amber-400 hover:bg-amber-500/25 transition-all"
              title="Remove revisit tag"
            >
              <Bookmark className="w-3.5 h-3.5 fill-amber-400" />
              <span>Remove Revisit</span>
            </button>
          ) : (
            <button
              type="button"
              onClick={onTagRevisit}
              className="flex items-center gap-1.5 rounded-xl border border-surface-border-dark bg-surface-hover-dark px-3 py-2.5 font-mono text-xs text-text-muted-dark hover:border-amber-500/40 hover:text-amber-400 transition-all"
              title="Tag this problem to revisit later"
            >
              <Bookmark className="w-3.5 h-3.5" />
              <span>Revisit Later</span>
            </button>
          )}
        </div>

        {/* Primary Action Buttons */}
        <div className="flex items-center gap-2">
          {isReviewMode ? (
            <button
              type="button"
              onClick={onExitReview}
              className="flex items-center gap-2 rounded-xl bg-surface-hover-dark px-4 py-2.5 font-display text-xs font-bold text-text-primary-dark border border-surface-border-dark hover:bg-streak hover:text-white transition-all shadow-sm"
            >
              <span>Back to Active Queue</span>
            </button>
          ) : (
            <>
              <button
                onClick={onSkip}
                className="flex items-center gap-1.5 rounded-xl border border-surface-border-dark bg-surface-hover-dark px-3 py-2.5 font-mono text-xs text-text-muted-dark hover:text-text-primary-dark transition-colors"
                title="Skip problem (moves to end of queue)"
              >
                <SkipForward className="w-3.5 h-3.5" />
                <span>Skip</span>
              </button>

              <button
                onClick={onShuffle}
                className="flex items-center gap-1.5 rounded-xl border border-surface-border-dark bg-surface-hover-dark px-3 py-2.5 font-mono text-xs text-text-muted-dark hover:text-text-primary-dark transition-colors"
                title="Shuffle remaining queue"
              >
                <Shuffle className="w-3.5 h-3.5" />
              </button>

              <button
                onClick={onMarkSolved}
                className="flex items-center gap-2 rounded-xl bg-streak px-5 py-2.5 font-display text-xs font-bold text-white shadow-lg shadow-streak/30 hover:bg-streak/90 transition-all transform active:scale-95"
              >
                <CheckCircle2 className="w-4 h-4" />
                <span>Mark Solved & Load Next</span>
              </button>
            </>
          )}
        </div>
      </div>
    </div>
  );
};

