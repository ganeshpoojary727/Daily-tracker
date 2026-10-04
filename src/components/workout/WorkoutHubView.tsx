import React, { useState } from 'react';
import {
  Dumbbell,
  Plus,
  RotateCcw,
  CheckCircle2,
  Layers,
  Check,
  ShieldAlert,
} from 'lucide-react';
import { useWorkoutStore, getDayOfWeekFromDate } from '../../store/useWorkoutStore';
import { ExerciseItem } from '../../types/workout';
import { WeeklyDayBar } from './WeeklyDayBar';
import { ExerciseCard } from './ExerciseCard';
import { ExerciseModal } from './ExerciseModal';
import { RestTimerWidget } from './RestTimerWidget';
import { ProgressionBanner } from './ProgressionBanner';
import { RestDayView } from './RestDayView';

export const WorkoutHubView: React.FC = () => {
  const {
    routine,
    logs,
    selectedDay,
    activeDate,
    setSelectedDay,
    addExercise,
    editExercise,
    deleteExercise,
    resetDayToDefault,
    resetEntireRoutineToDefault,
    autoSyncDailyChecklist,
    setAutoSyncDailyChecklist,
    syncWithDailyChecklist,
  } = useWorkoutStore();

  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingExercise, setEditingExercise] = useState<ExerciseItem | null>(null);
  const [showResetConfirm, setShowResetConfirm] = useState(false);
  const [workoutCompleteToast, setWorkoutCompleteToast] = useState(false);

  const currentDayRoutine = routine[selectedDay];
  const currentDayLog = logs[activeDate];

  // Group exercises by muscle group for neat organization
  const exercisesByGroup = React.useMemo(() => {
    const groups: Record<string, ExerciseItem[]> = {};
    if (!currentDayRoutine?.exercises) return groups;

    currentDayRoutine.exercises.forEach((ex) => {
      const groupName = ex.muscleGroup || 'General Exercises';
      if (!groups[groupName]) {
        groups[groupName] = [];
      }
      groups[groupName].push(ex);
    });
    return groups;
  }, [currentDayRoutine]);

  // Overall completion statistics for the active day
  const stats = React.useMemo(() => {
    if (!currentDayRoutine || currentDayRoutine.isRestDay) {
      return { totalSets: 0, completedSets: 0, percent: 100, isAllDone: true };
    }

    let total = 0;
    let completed = 0;

    currentDayRoutine.exercises.forEach((ex) => {
      total += ex.targetSets;
      const exLog = currentDayLog?.exercises[ex.id];
      if (exLog) {
        for (let i = 0; i < ex.targetSets; i++) {
          if (exLog.sets[i]?.completed) completed++;
        }
      }
    });

    const percent = total > 0 ? Math.round((completed / total) * 100) : 0;
    const isAllDone = total > 0 && completed >= total;

    return { totalSets: total, completedSets: completed, percent, isAllDone };
  }, [currentDayRoutine, currentDayLog]);

  const handleOpenAddModal = () => {
    setEditingExercise(null);
    setIsModalOpen(true);
  };

  const handleOpenEditModal = (ex: ExerciseItem) => {
    setEditingExercise(ex);
    setIsModalOpen(true);
  };

  const handleSaveModal = (data: Omit<ExerciseItem, 'id' | 'order'>) => {
    if (editingExercise) {
      editExercise(selectedDay, editingExercise.id, data);
    } else {
      addExercise(selectedDay, data);
    }
  };

  const handleFinishWorkout = () => {
    syncWithDailyChecklist(activeDate);
    setWorkoutCompleteToast(true);
    setTimeout(() => setWorkoutCompleteToast(false), 4000);
  };

  const dayLabel = selectedDay.charAt(0).toUpperCase() + selectedDay.slice(1);
  const isToday = getDayOfWeekFromDate(activeDate) === selectedDay;

  return (
    <div className="space-y-6 pb-12">
      {/* Top Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-surface-border-dark pb-4">
        <div>
          <div className="flex items-center gap-2.5">
            <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-emerald-500/10 text-emerald-400">
              <Dumbbell className="h-5 w-5" />
            </div>
            <div>
              <h1 className="font-display text-xl font-bold tracking-tight text-text-primary-dark">
                Workout & Calisthenics Hub
              </h1>
              <p className="text-xs text-text-muted-dark">
                8–12 Week Bodyweight Progression • 60 kg Lean Muscular & Abs Program
              </p>
            </div>
          </div>
        </div>

        {/* Global Action Buttons */}
        <div className="flex flex-wrap items-center gap-2">
          <button
            onClick={() => setShowResetConfirm(true)}
            className="flex items-center gap-1.5 rounded-lg border border-surface-border-dark bg-surface-card-dark px-3 py-1.5 text-xs font-semibold text-text-muted-dark hover:text-text-primary-dark hover:bg-surface-dark transition-colors"
            title="Reset current day or entire program to default"
          >
            <RotateCcw className="h-3.5 w-3.5" />
            <span>Reset Routine</span>
          </button>

          <button
            onClick={handleOpenAddModal}
            className="flex items-center gap-1.5 rounded-lg bg-emerald-500 px-3.5 py-1.5 text-xs font-bold text-slate-950 shadow-md shadow-emerald-500/20 hover:bg-emerald-400 transition-colors"
          >
            <Plus className="h-3.5 w-3.5" />
            <span>Add Exercise</span>
          </button>
        </div>
      </div>

      {/* Reset Confirmation Banner */}
      {showResetConfirm && (
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 rounded-xl border border-amber-500/30 bg-amber-500/10 p-3.5 text-xs text-amber-300">
          <div className="flex items-center gap-2">
            <ShieldAlert className="h-4 w-4 shrink-0 text-amber-400" />
            <span>Restore original 8–12 week calisthenics plan?</span>
          </div>
          <div className="flex items-center gap-2">
            <button
              onClick={() => setShowResetConfirm(false)}
              className="rounded px-2.5 py-1 text-text-muted-dark hover:text-text-primary-dark"
            >
              Cancel
            </button>
            <button
              onClick={() => {
                resetDayToDefault(selectedDay);
                setShowResetConfirm(false);
              }}
              className="rounded bg-amber-500/20 px-3 py-1 font-semibold text-amber-200 hover:bg-amber-500/30"
            >
              Reset {dayLabel} Only
            </button>
            <button
              onClick={() => {
                resetEntireRoutineToDefault();
                setShowResetConfirm(false);
              }}
              className="rounded bg-amber-500 px-3 py-1 font-bold text-slate-950 hover:bg-amber-400"
            >
              Reset All 7 Days
            </button>
          </div>
        </div>
      )}

      {/* Completion Toast Notification */}
      {workoutCompleteToast && (
        <div className="flex items-center justify-between rounded-xl border border-emerald-500/30 bg-emerald-500/20 p-3.5 text-xs text-emerald-300 shadow-lg animate-in fade-in duration-200">
          <div className="flex items-center gap-2">
            <CheckCircle2 className="h-4 w-4 text-emerald-400" />
            <span className="font-semibold">
              Workout Finished! Automatically synced and checked off on Daily Checklist.
            </span>
          </div>
          <button
            onClick={() => setWorkoutCompleteToast(false)}
            className="text-text-muted-dark hover:text-text-primary-dark"
          >
            ✕
          </button>
        </div>
      )}

      {/* 7-Day Day Selector Bar */}
      <WeeklyDayBar
        selectedDay={selectedDay}
        onSelectDay={setSelectedDay}
        activeDate={activeDate}
      />

      {/* Golden Progression Rule Banner */}
      <ProgressionBanner />

      {/* Main Workspace Layout */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Left Column: Exercises List (2 cols on large screens) */}
        <div className="lg:col-span-2 space-y-6">
          {/* Active Routine Header */}
          <div className="flex items-center justify-between gap-3 rounded-xl border border-surface-border-dark bg-surface-card-dark p-4">
            <div>
              <div className="flex items-center gap-2">
                <h2 className="font-display text-base font-bold text-text-primary-dark">
                  {dayLabel}: {currentDayRoutine.title}
                </h2>
                {isToday && (
                  <span className="rounded-full bg-emerald-500/20 px-2.5 py-0.5 text-[10px] font-bold text-emerald-400 border border-emerald-500/30">
                    Today's Session
                  </span>
                )}
              </div>
              <p className="text-xs text-text-muted-dark mt-0.5">
                {currentDayRoutine.subtitle} • Est. {currentDayRoutine.estimatedMinutes} min
              </p>
            </div>

            {/* Quick Finish Workout Button */}
            {!currentDayRoutine.isRestDay && (
              <button
                onClick={handleFinishWorkout}
                className="flex items-center gap-1.5 rounded-lg bg-emerald-500/10 border border-emerald-500/30 px-3 py-1.5 text-xs font-semibold text-emerald-400 hover:bg-emerald-500 hover:text-slate-950 transition-all shadow-sm"
              >
                <Check className="h-3.5 w-3.5 stroke-[2.5]" />
                <span>Finish & Sync</span>
              </button>
            )}
          </div>

          {/* Exercise List OR Rest Day View */}
          {currentDayRoutine.isRestDay && currentDayRoutine.exercises.length === 0 ? (
            <RestDayView
              day={selectedDay}
              routine={currentDayRoutine}
              date={activeDate}
              onAddExercise={handleOpenAddModal}
            />
          ) : (
            <div className="space-y-6">
              {Object.entries(exercisesByGroup).map(([groupName, exercises]) => (
                <div key={groupName} className="space-y-3">
                  <div className="flex items-center gap-2 text-xs font-mono uppercase tracking-wider text-text-muted-dark">
                    <Layers className="h-3.5 w-3.5 text-emerald-400" />
                    <span className="font-bold text-text-primary-dark">{groupName}</span>
                    <span className="text-[10px] text-text-muted-dark/70">
                      ({exercises.length} {exercises.length === 1 ? 'movement' : 'movements'})
                    </span>
                  </div>

                  <div className="grid grid-cols-1 gap-3">
                    {exercises.map((exercise) => (
                      <ExerciseCard
                        key={exercise.id}
                        exercise={exercise}
                        day={selectedDay}
                        date={activeDate}
                        log={currentDayLog?.exercises[exercise.id]}
                        onEdit={() => handleOpenEditModal(exercise)}
                        onDelete={() => deleteExercise(selectedDay, exercise.id)}
                      />
                    ))}
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Right Column: Rest Timer & Daily Progress Summary */}
        <div className="space-y-4">
          {/* Built-in Rest Timer Widget */}
          <RestTimerWidget />

          {/* Today's Session Progress Summary */}
          {!currentDayRoutine.isRestDay && (
            <div className="rounded-xl border border-surface-border-dark bg-surface-card-dark p-4 space-y-3">
              <div className="flex items-center justify-between">
                <span className="font-display text-xs font-semibold uppercase tracking-wider text-text-primary-dark">
                  Today's Set Progress
                </span>
                <span className="font-mono text-xs font-bold text-emerald-400">
                  {stats.completedSets} / {stats.totalSets} sets
                </span>
              </div>

              {/* Progress Bar */}
              <div className="h-2 w-full overflow-hidden rounded-full bg-surface-dark">
                <div
                  className="h-full bg-gradient-to-r from-emerald-500 to-teal-400 transition-all duration-300"
                  style={{ width: `${stats.percent}%` }}
                />
              </div>

              <div className="flex items-center justify-between text-[11px] text-text-muted-dark">
                <span>{stats.percent}% complete</span>
                {stats.isAllDone && (
                  <span className="text-emerald-400 font-semibold flex items-center gap-1">
                    <CheckCircle2 className="h-3 w-3" /> All sets complete!
                  </span>
                )}
              </div>
            </div>
          )}

          {/* Auto-Sync with Daily Checklist Setting */}
          <div className="rounded-xl border border-surface-border-dark bg-surface-card-dark p-4 space-y-2">
            <div className="flex items-center justify-between">
              <div>
                <h4 className="text-xs font-bold text-text-primary-dark">Daily Checklist Sync</h4>
                <p className="text-[10px] text-text-muted-dark">
                  Auto-ticks "Exercise" when today's workout finishes
                </p>
              </div>

              <label className="relative inline-flex cursor-pointer items-center">
                <input
                  type="checkbox"
                  checked={autoSyncDailyChecklist}
                  onChange={(e) => setAutoSyncDailyChecklist(e.target.checked)}
                  className="peer sr-only"
                />
                <div className="peer h-5 w-9 rounded-full bg-surface-dark after:absolute after:left-[2px] after:top-[2px] after:h-4 after:w-4 after:rounded-full after:bg-text-muted-dark after:transition-all after:content-[''] peer-checked:bg-emerald-500 peer-checked:after:translate-x-full peer-checked:after:bg-slate-950 peer-focus:outline-none"></div>
              </label>
            </div>
          </div>
        </div>
      </div>

      {/* Add / Edit Exercise Modal */}
      <ExerciseModal
        isOpen={isModalOpen}
        onClose={() => {
          setIsModalOpen(false);
          setEditingExercise(null);
        }}
        day={selectedDay}
        initialData={editingExercise}
        onSave={handleSaveModal}
      />
    </div>
  );
};
