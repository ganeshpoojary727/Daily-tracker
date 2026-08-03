import React, { useState } from 'react';
import { ChevronDown, ChevronRight, CheckCircle2, Video, Search, ExternalLink } from 'lucide-react';
import { CategorySeed, ProblemSolve } from '../../types';
import { getPatternProgress, getCategoryProgress } from '../../lib/problemUtils';
import { ProgressBar } from '../ui/ProgressBar';

interface PatternBrowserProps {
  categories: CategorySeed[];
  solves: Record<string, ProblemSolve>;
  currentKey: string | null;
  onSelectKey: (key: string) => void;
}

export const PatternBrowser: React.FC<PatternBrowserProps> = ({
  categories,
  solves,
  currentKey,
  onSelectKey,
}) => {
  const [expandedCategories, setExpandedCategories] = useState<Record<string, boolean>>({
    'two-pointer': true, // default first category expanded
  });
  const [expandedPatterns, setExpandedPatterns] = useState<Record<string, boolean>>({
    p1: true,
  });
  const [searchQuery, setSearchQuery] = useState('');

  const toggleCategory = (catId: string) => {
    setExpandedCategories((prev) => ({ ...prev, [catId]: !prev[catId] }));
  };

  const togglePattern = (patId: string) => {
    setExpandedPatterns((prev) => ({ ...prev, [patId]: !prev[patId] }));
  };

  return (
    <div className="rounded-xl border border-surface-border-dark bg-surface-dark p-5 shadow-sm space-y-4">
      {/* Header & Search */}
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between border-b border-surface-border-dark pb-4">
        <div>
          <h3 className="font-display font-bold text-base text-text-primary-dark">
            Pattern Sheet Browser
          </h3>
          <p className="text-xs font-mono text-text-muted-dark">
            15 Categories • 94 Patterns • 412 Problems
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
            return pat.problems.some((prob) => prob.title.toLowerCase().includes(q) || String(prob.number).includes(q));
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
                  <span className="font-mono text-xs font-bold text-streak">{category.roman}.</span>
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
                              Pattern #{pattern.number}: {pattern.name}
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
                              const key = `${pattern.id}:${prob.number}`;
                              const isSolved = !!solves[key];
                              const isCurrent = currentKey === key;

                              return (
                                <div
                                  key={key}
                                  onClick={() => onSelectKey(key)}
                                  className={`flex items-center justify-between p-2 rounded text-xs cursor-pointer transition-colors ${
                                    isCurrent
                                      ? 'bg-streak/20 border border-streak/40 text-white font-bold'
                                      : 'hover:bg-surface-hover-dark/60 text-text-primary-dark'
                                  }`}
                                >
                                  <div className="flex items-center gap-2 truncate">
                                    {isSolved ? (
                                      <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400 shrink-0" />
                                    ) : (
                                      <span className="w-3.5 h-3.5 rounded-full border border-surface-border-dark shrink-0" />
                                    )}
                                    <span className="font-mono text-text-muted-dark">#{prob.number}</span>
                                    <span className="truncate">{prob.title}</span>
                                  </div>

                                  <div className="flex items-center gap-2 shrink-0">
                                    <a
                                      href={prob.url}
                                      target="_blank"
                                      rel="noopener noreferrer"
                                      onClick={(e) => e.stopPropagation()}
                                      className="text-text-muted-dark hover:text-streak p-1"
                                      title="Open LeetCode link"
                                    >
                                      <ExternalLink className="w-3 h-3" />
                                    </a>
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
