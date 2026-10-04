import React, { useState } from 'react';
import {
  Check,
  Edit2,
  Trash2,
  Clock,
  Sparkles,
  CheckCircle2,
  ChevronDown,
} from 'lucide-react';
import { ExerciseItem, DayOfWeek, ExerciseLog } from '../../types/workout';
import { useWorkoutStore } from '../../store/useWorkoutStore';

interface ExerciseCardProps {
  exercise: ExerciseItem;
  day: DayOfWeek;
  date: string;
  log?: ExerciseLog;
  onEdit: () => void;
  onDelete: () => void;
}

export const ExerciseCard: React.FC<ExerciseCardProps> = ({
  exercise,
  day,
  date,
  log,
  onEdit,
  onDelete,
}) => {
  const { toggleSet, logReps, markExerciseAllSets, startRestTimer } =
    useWorkoutStore();

  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);
  const [activeSetInputIndex, setActiveSetInputIndex] = useState<number | null>(null);
  const [customRepInput, setCustomRepInput] = useState('');

  // Calculate completed set count
  const setsState = log?.sets || {};
  let completedSetsCount = 0;
  for (let i = 0; i < exercise.targetSets; i++) {
    if (setsState[i]?.completed) {
      completedSetsCount++;
    }
  }
  const isFullyCompleted =
    exercise.targetSets > 0 && completedSetsCount >= exercise.targetSets;

  const handleToggleSet = (index: number) => {
    const isCurrentlyDone = !!setsState[index]?.completed;
    toggleSet(date, day, exercise.id, index);

    // If marking as done and not already done, start rest timer
    if (!isCurrentlyDone) {
      startRestTimer();
    }
  };

  const handleSaveRepInput = (index: number) => {
    if (customRepInput.trim()) {
      logReps(date, day, exercise.id, index, customRepInput.trim());
    }
    setActiveSetInputIndex(null);
    setCustomRepInput('');
  };

  const handleToggleAll = () => {
    markExerciseAllSets(
      date,
      day,
      exercise.id,
      exercise.targetSets,
      !isFullyCompleted
    );
  };

  return (
    <div
      className={`group relative rounded-xl border p-4 transition-all ${
        isFullyCompleted
          ? 'border-emerald-500/30 bg-emerald-950/10 shadow-sm'
          : 'border-surface-border-dark bg-surface-card-dark hover:border-surface-border-dark/80'
      }`}
    >
      {/* Top Header */}
      <div className="flex items-start justify-between gap-3">
        <div className="flex-1 min-w-0">
          <div className="flex flex-wrap items-center gap-2">
            <h4
              className={`font-display text-sm font-bold tracking-tight ${
                isFullyCompleted
                  ? 'text-emerald-300'
                  : 'text-text-primary-dark group-hover:text-emerald-400'
              }`}
            >
              {exercise.name}
            </h4>

            {/* Target Sets x Reps Badge */}
            <span className="inline-flex items-center rounded-md bg-surface-dark px-2 py-0.5 text-xs font-mono font-semibold text-emerald-400 border border-surface-border-dark">
              {exercise.targetSets} × {exercise.targetReps}
            </span>

            {/* Completion Status Pill */}
            {isFullyCompleted && (
              <span className="inline-flex items-center gap-1 rounded-full bg-emerald-500/20 px-2 py-0.5 text-[10px] font-semibold text-emerald-300">
                <CheckCircle2 className="h-3 w-3" />
                Done
              </span>
            )}
          </div>

          {/* Tempo & Form cues */}
          {exercise.tempoNote && (
            <div className="mt-1 flex items-center gap-1 text-[11px] text-amber-300/90 font-mono">
              <Clock className="h-3 w-3 shrink-0" />
              <span>{exercise.tempoNote}</span>
            </div>
          )}
        </div>

        {/* Action icons */}
        <div className="flex items-center gap-1 shrink-0">
          <button
            onClick={handleToggleAll}
            title={isFullyCompleted ? 'Mark all sets incomplete' : 'Mark all sets done'}
            className={`rounded-lg p-1.5 transition-colors ${
              isFullyCompleted
                ? 'bg-emerald-500/20 text-emerald-300'
                : 'text-text-muted-dark hover:bg-surface-dark hover:text-emerald-400'
            }`}
          >
            <Sparkles className="h-3.5 w-3.5" />
          </button>

          <button
            onClick={onEdit}
            title="Edit exercise"
            className="rounded-lg p-1.5 text-text-muted-dark hover:bg-surface-dark hover:text-text-primary-dark transition-colors"
          >
            <Edit2 className="h-3.5 w-3.5" />
          </button>

          <button
            onClick={() => setShowDeleteConfirm(true)}
            title="Delete exercise"
            className="rounded-lg p-1.5 text-text-muted-dark hover:bg-red-500/10 hover:text-red-400 transition-colors"
          >
            <Trash2 className="h-3.5 w-3.5" />
          </button>
        </div>
      </div>

      {/* Delete Confirmation Overlay */}
      {showDeleteConfirm && (
        <div className="mt-3 flex items-center justify-between rounded-lg bg-red-500/10 border border-red-500/20 p-2.5 text-xs text-red-300">
          <span>Remove "{exercise.name}" from {day}?</span>
          <div className="flex items-center gap-2">
            <button
              onClick={() => setShowDeleteConfirm(false)}
              className="rounded px-2 py-1 text-[11px] text-text-muted-dark hover:text-text-primary-dark"
            >
              Cancel
            </button>
            <button
              onClick={() => {
                onDelete();
                setShowDeleteConfirm(false);
              }}
              className="rounded bg-red-500/30 px-2.5 py-1 text-[11px] font-bold text-red-200 hover:bg-red-500/50"
            >
              Delete
            </button>
          </div>
        </div>
      )}

      {/* Sets Ticking Grid */}
      <div className="mt-3.5 flex flex-wrap items-center gap-2">
        {Array.from({ length: exercise.targetSets }).map((_, idx) => {
          const isDone = !!setsState[idx]?.completed;
          const loggedReps = setsState[idx]?.reps;
          const isEditingRep = activeSetInputIndex === idx;

          return (
            <div key={idx} className="relative flex items-center">
              <button
                type="button"
                onClick={() => handleToggleSet(idx)}
                className={`group/set flex items-center gap-1.5 rounded-lg border px-2.5 py-1.5 text-xs font-semibold transition-all ${
                  isDone
                    ? 'border-emerald-500/40 bg-emerald-500/20 text-emerald-300 shadow-sm'
                    : 'border-surface-border-dark bg-surface-dark text-text-muted-dark hover:border-emerald-500/40 hover:text-text-primary-dark'
                }`}
              >
                <div
                  className={`flex h-4 w-4 items-center justify-center rounded border transition-colors ${
                    isDone
                      ? 'border-emerald-400 bg-emerald-400 text-slate-950'
                      : 'border-surface-border-dark bg-surface-card-dark group-hover/set:border-emerald-500/60'
                  }`}
                >
                  {isDone && <Check className="h-3 w-3 stroke-[3]" />}
                </div>
                <span>Set {idx + 1}</span>
              </button>

              {/* Rep Logger Mini Badge */}
              <button
                type="button"
                onClick={() => {
                  setActiveSetInputIndex(isEditingRep ? null : idx);
                  setCustomRepInput(loggedReps || '');
                }}
                title={loggedReps ? `Logged: ${loggedReps} reps (click to edit)` : 'Log actual reps'}
                className={`ml-1 flex items-center gap-0.5 rounded px-1.5 py-1 font-mono text-[10px] transition-colors ${
                  loggedReps
                    ? 'bg-emerald-500/10 text-emerald-400 hover:bg-emerald-500/20'
                    : 'bg-surface-dark/80 text-text-muted-dark hover:text-text-primary-dark hover:bg-surface-border-dark'
                }`}
              >
                <span>{loggedReps ? `${loggedReps}r` : '+rep'}</span>
                <ChevronDown className="h-2.5 w-2.5 opacity-60" />
              </button>

              {/* Inline Rep Input Popover */}
              {isEditingRep && (
                <div className="absolute left-0 top-full z-20 mt-1 flex items-center gap-1 rounded-lg border border-surface-border-dark bg-surface-card-dark p-1.5 shadow-xl">
                  <input
                    type="text"
                    value={customRepInput}
                    onChange={(e) => setCustomRepInput(e.target.value)}
                    placeholder="e.g. 12"
                    className="w-14 rounded border border-surface-border-dark bg-surface-dark px-1.5 py-0.5 font-mono text-xs text-text-primary-dark focus:border-emerald-500 focus:outline-none"
                    autoFocus
                    onKeyDown={(e) => {
                      if (e.key === 'Enter') handleSaveRepInput(idx);
                      if (e.key === 'Escape') setActiveSetInputIndex(null);
                    }}
                  />
                  <button
                    onClick={() => handleSaveRepInput(idx)}
                    className="rounded bg-emerald-500 px-1.5 py-0.5 text-[10px] font-bold text-slate-950 hover:bg-emerald-400"
                  >
                    Save
                  </button>
                </div>
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
};
