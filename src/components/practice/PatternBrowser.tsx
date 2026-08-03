import React, { useState } from 'react';
import { ChevronDown, ChevronRight, Check, Video, Search, ExternalLink } from 'lucide-react';
import { PracticeSheet, ProblemSolve } from '../../types';
import { getPatternProgress, getCategoryProgress, getProblemKey } from '../../lib/problemUtils';
import { ProgressBar } from '../ui/ProgressBar';
import { formatDateStr } from '../../lib/dateUtils';

interface PatternBrowserProps {
  sheet: PracticeSheet;
  solves: Record<string, ProblemSolve>;
  currentKey: string | null;
  onSelectKey: (key: string) => void;
  onToggleSolved: (patternId: string, problemId: string) => void;
}

export const PatternBrowser: React.FC<PatternBrowserProps> = ({
  sheet,
  solves,
  currentKey,
  onSelectKey,
  onToggleSolved,
}) => {
  const categories = sheet.categories;
  const [expandedCategories, setExpandedCategories] = useState<Record<string, boolean>>({
    [categories[0]?.id || '']: true,
  });
  const [expandedPatterns, setExpandedPatterns] = useState<Record<string, boolean>>({
    [categories[0]?.patterns[0]?.id || '']: true,
  });
  const [searchQuery, setSearchQuery] = useState('');

  const toggleCategory = (catId: string) => {
    setExpandedCategories((prev) => ({ ...prev, [catId]: !prev[catId] }));
  };

  const togglePattern = (patId: string) => {
    setExpandedPatterns((prev) => ({ ...prev, [patId]: !prev[patId] }));
  };

  // Compute total categories, patterns, and problems for header subtitle
  let totalPatternsCount = 0;
  let totalProblemsCount = 0;
  for (const cat of categories) {
    totalPatternsCount += cat.patterns.length;
    for (const pat of cat.patterns) {
      totalProblemsCount += pat.problems.length;
    }
  }

  return (
    <div className="rounded-xl border border-surface-border-dark bg-surface-dark p-5 shadow-sm space-y-4">
      {/* Header & Search */}
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between border-b border-surface-border-dark pb-4">
        <div>
          <h3 className="font-display font-bold text-base text-text-primary-dark">
            {sheet.meta.title || 'Pattern Sheet Browser'}
          </h3>
          <p className="text-xs font-mono text-text-muted-dark">
            {categories.length} Categories • {totalPatternsCount} Patterns • {totalProblemsCount} Problems
          </p>
        </div>

        {/* Search Bar */}
        <div className="relative w-full sm:w-64">
          <Search className="absolute left-3 top-2.5 h-3.5 w-3.5 text-text-muted-dark" />
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Search problem, pattern..."
            className="w-full rounded-lg border border-surface-border-dark bg-surface-hover-dark pl-9 pr-3 py-1.5 font-sans text-xs text-text-primary-dark focus:border-streak focus:outline-none"
          />
        </div>
      </div>

      {/* Tree View */}
      <div className="space-y-3">
        {categories.map((category) => {
          const catProgress = getCategoryProgress(category, solves);
          const isCatExpanded = !!expandedCategories[category.id] || searchQuery.length > 0;

          // Filter by search query if present
          const matchingPatterns = category.patterns.filter((pat) => {
            if (!searchQuery) return true;
            const q = searchQuery.toLowerCase();
            if (pat.name.toLowerCase().includes(q)) return true;
            return pat.problems.some(
              (prob) =>
                prob.title.toLowerCase().includes(q) ||
                (prob.number !== undefined && String(prob.number).includes(q))
            );
          });

          if (searchQuery && matchingPatterns.length === 0) return null;

          return (
            <div key={category.id} className="rounded-lg border border-surface-border-dark/60 bg-surface-dark/60 overflow-hidden">
              {/* Category Header Row */}
              <button
                onClick={() => toggleCategory(category.id)}
                className="flex w-full items-center justify-between p-3 text-left hover:bg-surface-hover-dark/40 transition-colors"
              >
                <div className="flex items-center gap-2">
                  {isCatExpanded ? (
                    <ChevronDown className="w-4 h-4 text-text-muted-dark shrink-0" />
                  ) : (
                    <ChevronRight className="w-4 h-4 text-text-muted-dark shrink-0" />
                  )}
                  {category.roman && <span className="font-mono text-xs font-bold text-streak">{category.roman}.</span>}
                  <span className="font-display font-bold text-xs text-text-primary-dark">{category.name}</span>
                </div>

                <div className="flex items-center gap-3">
                  <span className="font-mono text-[11px] text-text-muted-dark">
                    {catProgress.solved} / {catProgress.total} Solved
                  </span>
                  <div className="w-20 hidden sm:block">
                    <ProgressBar value={catProgress.solved} max={catProgress.total} heightClass="h-1.5" />
                  </div>
                </div>
              </button>

              {/* Patterns Tree */}
              {isCatExpanded && (
                <div className="border-t border-surface-border-dark/40 bg-bg-dark/40 p-2 space-y-2">
                  {matchingPatterns.map((pattern) => {
                    const patProgress = getPatternProgress(pattern, solves);
                    const isPatExpanded = !!expandedPatterns[pattern.id] || searchQuery.length > 0;

                    return (
                      <div key={pattern.id} className="rounded-md border border-surface-border-dark/40 bg-surface-dark/40">
                        {/* Pattern Header Row */}
                        <button
                          onClick={() => togglePattern(pattern.id)}
                          className="flex w-full items-center justify-between p-2 text-left hover:bg-surface-hover-dark/40 transition-colors"
                        >
                          <div className="flex items-center gap-2">
                            {isPatExpanded ? (
                              <ChevronDown className="w-3.5 h-3.5 text-text-muted-dark shrink-0" />
                            ) : (
                              <ChevronRight className="w-3.5 h-3.5 text-text-muted-dark shrink-0" />
                            )}
                            <span className="font-mono text-xs font-semibold text-text-primary-dark">
                              {pattern.number !== undefined ? `Pattern #${pattern.number}: ` : ''}{pattern.name}
                            </span>
                            {pattern.hasVideo && (
                              <span className="flex items-center gap-0.5 rounded bg-purple-500/20 px-1.5 py-0.2 text-[9px] font-mono font-bold text-purple-400">
                                <Video className="w-2.5 h-2.5" /> VIDEO
                              </span>
                            )}
                          </div>

                          <span className="font-mono text-[10px] text-text-muted-dark">
                            {patProgress.solved} / {patProgress.total}
                          </span>
                        </button>

                        {/* Problems List */}
                        {isPatExpanded && (
                          <div className="border-t border-surface-border-dark/30 p-1 divide-y divide-surface-border-dark/20">
                            {pattern.problems.map((prob) => {
                              const probId = prob.id || (prob.number !== undefined ? String(prob.number) : prob.title);
                              const key = getProblemKey(pattern.id, prob);
                              const solve = solves[key];
                              const isSolved = !!solve;
                              const isCurrent = currentKey === key;

                              return (
                                <div
                                  key={key}
                                  className={`flex items-center justify-between p-2 rounded text-xs transition-colors ${
                                    isCurrent
                                      ? 'bg-streak/20 border border-streak/40 text-white font-bold'
                                      : 'hover:bg-surface-hover-dark/60 text-text-primary-dark'
                                  }`}
                                >
                                  {/* Left side: Interactive circular checkbox + Title */}
                                  <div className="flex items-center gap-2.5 min-w-0 flex-1 pr-2">
                                    {/* Circular Checkbox Toggle */}
                                    <button
                                      type="button"
                                      onClick={(e) => {
                                        e.stopPropagation();
                                        onToggleSolved(pattern.id, probId);
                                      }}
                                      className="shrink-0 group p-0.5 focus:outline-none"
                                      title={isSolved ? 'Mark as unsolved' : 'Mark as solved'}
                                    >
                                      {isSolved ? (
                                        <span className="flex w-4 h-4 rounded-full bg-emerald-500 text-bg-dark items-center justify-center shadow-sm group-hover:bg-emerald-400 transition-colors">
                                          <Check className="w-3 h-3 stroke-[3]" />
                                        </span>
                                      ) : (
                                        <span className="block w-4 h-4 rounded-full border-2 border-surface-border-dark group-hover:border-streak transition-colors" />
                                      )}
                                    </button>

                                    {/* Problem Title & Practice Again Affordance */}
                                    <div
                                      onClick={() => onSelectKey(key)}
                                      className="cursor-pointer truncate flex-1 min-w-0"
                                      title="Click title to practice again (jump queue without toggling solve status)"
                                    >
                                      <div className="flex items-center gap-1.5 truncate">
                                        {prob.number !== undefined && (
                                          <span className="font-mono text-text-muted-dark shrink-0">#{prob.number}</span>
                                        )}
                                        <span
                                          className={`truncate ${
                                            isSolved ? 'text-text-muted-dark font-normal' : ''
                                          }`}
                                        >
                                          {prob.title}
                                        </span>
                                      </div>
                                      {prob.notes && (
                                        <p className="text-[11px] font-sans text-text-muted-dark/80 italic truncate font-normal mt-0.5">
                                          {prob.notes}
                                        </p>
                                      )}
                                    </div>
                                  </div>

                                  {/* Right side: Solved Date or Link Icon */}
                                  <div className="flex items-center gap-2 shrink-0">
                                    {isSolved ? (
                                      <span className="font-mono text-[10px] text-emerald-400/90 font-medium px-1.5 py-0.5 rounded bg-emerald-500/10 border border-emerald-500/20">
                                        Solved {formatDateStr(solve.solvedAt, 'MMM d')}
                                      </span>
                                    ) : prob.url ? (
                                      <a
                                        href={prob.url}
                                        target="_blank"
                                        rel="noopener noreferrer"
                                        onClick={(e) => e.stopPropagation()}
                                        className="text-text-muted-dark hover:text-streak p-1 transition-colors"
                                        title="Open problem link"
                                      >
                                        <ExternalLink className="w-3.5 h-3.5" />
                                      </a>
                                    ) : null}
                                  </div>
                                </div>
                              );
                            })}
                          </div>
                        )}
                      </div>
                    );
                  })}
                </div>
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
};

