import React, { useState } from 'react';
import { TrendingUp, ChevronRight, ChevronDown, ChevronUp } from 'lucide-react';

export const ProgressionBanner: React.FC = () => {
  const [isExpanded, setIsExpanded] = useState(false);

  return (
    <div className="rounded-xl border border-emerald-500/20 bg-emerald-950/20 p-3.5 transition-all">
      <div className="flex items-center justify-between gap-3">
        <div className="flex items-center gap-2.5">
          <div className="flex h-7 w-7 shrink-0 items-center justify-center rounded-lg bg-emerald-500/20 text-emerald-400">
            <TrendingUp className="h-4 w-4" />
          </div>
          <div>
            <span className="font-display text-xs font-bold uppercase tracking-wider text-emerald-300">
              Golden Rule of Progression:
            </span>
            <div className="flex flex-wrap items-center gap-1.5 pt-0.5 text-xs text-text-primary-dark">
              <span className="font-semibold text-text-muted-dark">Normal Reps</span>
              <ChevronRight className="h-3 w-3 text-emerald-400" />
              <span className="font-semibold text-text-muted-dark">More Reps (top of range)</span>
              <ChevronRight className="h-3 w-3 text-emerald-400" />
              <span className="font-semibold text-amber-300">3s Slow Tempo</span>
              <ChevronRight className="h-3 w-3 text-emerald-400" />
              <span className="font-bold text-emerald-400">Harder Variation</span>
            </div>
          </div>
        </div>

        <button
          onClick={() => setIsExpanded(!isExpanded)}
          className="flex items-center gap-1 text-[11px] font-semibold text-emerald-400 hover:text-emerald-300 transition-colors shrink-0"
        >
          <span>{isExpanded ? 'Hide' : 'Details'}</span>
          {isExpanded ? <ChevronUp className="h-3.5 w-3.5" /> : <ChevronDown className="h-3.5 w-3.5" />}
        </button>
      </div>

      {isExpanded && (
        <div className="mt-3 border-t border-emerald-500/10 pt-3 text-xs text-text-muted-dark space-y-2">
          <p>
            The plan only works if you progress over the 8–12 weeks. Instead of endlessly doing 50 sloppy pushups, increase intensity:
          </p>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 text-[11px] font-mono">
            <div className="rounded-lg bg-surface-dark/70 p-2 border border-surface-border-dark">
              <span className="text-emerald-400 font-bold block mb-1">Upper Body Path:</span>
              Push-up (10-15 reps) → Slow Push-up (3s eccentric) → Decline Push-up → Diamond Push-up
            </div>
            <div className="rounded-lg bg-surface-dark/70 p-2 border border-surface-border-dark">
              <span className="text-emerald-400 font-bold block mb-1">Lower Body Path:</span>
              Bodyweight Squats (25 reps) → Slow Squats (3s down) → Bulgarian Split Squats
            </div>
          </div>
          <p className="text-[10px] text-text-muted-dark/80 pt-1">
            ⏱️ Workout target: 45–55 minutes | Rest: 60–90s normal sets, 90–120s for legs.
          </p>
        </div>
      )}
    </div>
  );
};
