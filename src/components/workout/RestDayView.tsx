import React from 'react';
import { DayOfWeek, WorkoutDayRoutine } from '../../types/workout';
import { Moon, Footprints, Heart, Apple, Plus } from 'lucide-react';

interface RestDayViewProps {
  day: DayOfWeek;
  routine: WorkoutDayRoutine;
  date: string;
  onAddExercise: () => void;
}

export const RestDayView: React.FC<RestDayViewProps> = ({
  day,
  routine,
  onAddExercise,
}) => {

  // Specific guidance for each rest/recovery day
  const isWednesday = day === 'wednesday';
  const isSaturday = day === 'saturday';
  const isSunday = day === 'sunday';

  return (
    <div className="rounded-xl border border-surface-border-dark bg-surface-card-dark p-6 space-y-6">
      {/* Header Banner */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-surface-border-dark pb-5">
        <div className="flex items-center gap-3">
          <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-blue-500/10 text-blue-400">
            {isSunday ? <Moon className="h-6 w-6" /> : <Footprints className="h-6 w-6" />}
          </div>
          <div>
            <h3 className="font-display text-lg font-bold text-text-primary-dark">
              {routine.title}
            </h3>
            <p className="text-xs text-text-muted-dark">{routine.subtitle}</p>
          </div>
        </div>

        {/* Add custom workout anyway button */}
        <button
          onClick={onAddExercise}
          className="flex items-center gap-1.5 self-start sm:self-auto rounded-lg border border-surface-border-dark bg-surface-dark px-3 py-1.5 text-xs font-semibold text-text-muted-dark hover:text-emerald-400 hover:border-emerald-500/40 transition-colors"
        >
          <Plus className="h-3.5 w-3.5" />
          <span>Add Workout to this Day</span>
        </button>
      </div>

      {/* Main Recovery Card */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {/* Activity Guidance */}
        <div className="rounded-xl border border-surface-border-dark/60 bg-surface-dark/50 p-4 space-y-2">
          <div className="flex items-center gap-2 text-emerald-400 font-semibold text-xs uppercase tracking-wider">
            <Heart className="h-4 w-4" />
            <span>Today's Movement Protocol</span>
          </div>
          <p className="text-sm text-text-primary-dark leading-relaxed">
            {routine.activityNote || 'Active recovery and gentle mobility.'}
          </p>
          <div className="pt-2 text-[11px] text-text-muted-dark font-mono">
            {isWednesday && 'Walking increases blood flow to muscles without causing micro-tears.'}
            {isSaturday && 'Aerobic base work helps heart recovery and keeps you active.'}
            {isSunday && 'Complete nervous system deload. Do not do heavy calisthenics today.'}
          </div>
        </div>

        {/* Nutrition & Vegetarian Protein Reminder */}
        <div className="rounded-xl border border-surface-border-dark/60 bg-surface-dark/50 p-4 space-y-2">
          <div className="flex items-center gap-2 text-amber-400 font-semibold text-xs uppercase tracking-wider">
            <Apple className="h-4 w-4" />
            <span>Nutrition & Protein Targets (60 kg Target)</span>
          </div>
          <p className="text-sm text-text-primary-dark">
            Aim for <span className="text-amber-300 font-bold font-mono">90–110g protein</span> per day:
          </p>
          <ul className="text-xs text-text-muted-dark space-y-1 pt-1 list-disc list-inside">
            <li>Paneer / Tofu (20–25g protein per 100g)</li>
            <li>Soya chunks (50g protein per 100g raw)</li>
            <li>Lentils / Dal + Curd / Greek yogurt</li>
            <li>Sprouts, chickpea / chana, soaked almonds & seeds</li>
          </ul>
        </div>
      </div>
    </div>
  );
};
