import React, { useState, useEffect } from 'react';
import { Modal } from '../ui/Modal';
import { ExerciseItem, DayOfWeek } from '../../types/workout';
import { Dumbbell, Target, Layers, Clock, AlertCircle } from 'lucide-react';

interface ExerciseModalProps {
  isOpen: boolean;
  onClose: () => void;
  day: DayOfWeek;
  initialData?: ExerciseItem | null;
  onSave: (data: Omit<ExerciseItem, 'id' | 'order'>) => void;
}

const MUSCLE_GROUP_SUGGESTIONS = [
  'Chest / Shoulders / Triceps',
  'Back / Biceps',
  'Legs',
  'Abs',
  'Core',
  'Core Finisher',
  'Cardio / Conditioning',
  'Full Body',
];

const REP_PRESETS = ['8–12', '8–15', '10–15', '15–25', '20–40 sec', '45–60 sec'];

export const ExerciseModal: React.FC<ExerciseModalProps> = ({
  isOpen,
  onClose,
  day,
  initialData,
  onSave,
}) => {
  const [name, setName] = useState('');
  const [muscleGroup, setMuscleGroup] = useState('Chest / Shoulders / Triceps');
  const [targetSets, setTargetSets] = useState(3);
  const [targetReps, setTargetReps] = useState('8–15');
  const [tempoNote, setTempoNote] = useState('');
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (initialData) {
      setName(initialData.name);
      setMuscleGroup(initialData.muscleGroup);
      setTargetSets(initialData.targetSets);
      setTargetReps(initialData.targetReps);
      setTempoNote(initialData.tempoNote || '');
    } else {
      setName('');
      setMuscleGroup('Chest / Shoulders / Triceps');
      setTargetSets(3);
      setTargetReps('8–15');
      setTempoNote('');
    }
    setError(null);
  }, [initialData, isOpen]);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim()) {
      setError('Please enter an exercise name');
      return;
    }
    if (targetSets < 1 || targetSets > 10) {
      setError('Target sets must be between 1 and 10');
      return;
    }
    if (!targetReps.trim()) {
      setError('Please provide a target rep range or duration');
      return;
    }

    onSave({
      name: name.trim(),
      muscleGroup: muscleGroup.trim(),
      targetSets: Number(targetSets),
      targetReps: targetReps.trim(),
      tempoNote: tempoNote.trim() ? tempoNote.trim() : undefined,
    });

    onClose();
  };

  const dayLabel = day.charAt(0).toUpperCase() + day.slice(1);

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title={initialData ? `Edit Exercise (${dayLabel})` : `Add Exercise to ${dayLabel}`}
    >
      <form onSubmit={handleSubmit} className="space-y-4">
        {error && (
          <div className="flex items-center gap-2 rounded-lg bg-red-500/10 border border-red-500/20 p-3 text-xs text-red-400">
            <AlertCircle className="h-4 w-4 shrink-0" />
            <span>{error}</span>
          </div>
        )}

        {/* Exercise Name */}
        <div>
          <label className="block text-xs font-semibold uppercase tracking-wider text-text-muted-dark mb-1">
            Exercise Name *
          </label>
          <div className="relative">
            <input
              type="text"
              value={name}
              onChange={(e) => {
                setName(e.target.value);
                if (error) setError(null);
              }}
              placeholder="e.g. Archer Push-ups, Pistol Squats..."
              className="w-full rounded-lg border border-surface-border-dark bg-surface-card-dark px-3.5 py-2.5 text-sm text-text-primary-dark placeholder-text-muted-dark/50 focus:border-emerald-500 focus:outline-none focus:ring-1 focus:ring-emerald-500"
              autoFocus
            />
            <Dumbbell className="absolute right-3 top-3 h-4 w-4 text-text-muted-dark/60 pointer-events-none" />
          </div>
        </div>

        {/* Muscle Group */}
        <div>
          <label className="block text-xs font-semibold uppercase tracking-wider text-text-muted-dark mb-1">
            Muscle Focus / Group *
          </label>
          <div className="relative">
            <input
              type="text"
              list="muscle-suggestions"
              value={muscleGroup}
              onChange={(e) => setMuscleGroup(e.target.value)}
              placeholder="e.g. Chest / Shoulders / Triceps"
              className="w-full rounded-lg border border-surface-border-dark bg-surface-card-dark px-3.5 py-2 text-sm text-text-primary-dark focus:border-emerald-500 focus:outline-none focus:ring-1 focus:ring-emerald-500"
            />
            <Layers className="absolute right-3 top-2.5 h-4 w-4 text-text-muted-dark/60 pointer-events-none" />
          </div>
          <datalist id="muscle-suggestions">
            {MUSCLE_GROUP_SUGGESTIONS.map((item) => (
              <option key={item} value={item} />
            ))}
          </datalist>
          <div className="flex flex-wrap gap-1 mt-1.5">
            {['Chest', 'Back/Biceps', 'Legs', 'Abs', 'Finisher'].map((quick) => (
              <button
                type="button"
                key={quick}
                onClick={() => {
                  if (quick === 'Chest') setMuscleGroup('Chest / Shoulders / Triceps');
                  else if (quick === 'Back/Biceps') setMuscleGroup('Back / Biceps');
                  else if (quick === 'Legs') setMuscleGroup('Legs');
                  else if (quick === 'Abs') setMuscleGroup('Abs');
                  else if (quick === 'Finisher') setMuscleGroup('Core Finisher');
                }}
                className="rounded bg-surface-card-dark/80 px-2 py-0.5 text-[10px] text-text-muted-dark hover:text-emerald-400 hover:bg-surface-border-dark transition-colors"
              >
                {quick}
              </button>
            ))}
          </div>
        </div>

        {/* Sets and Reps */}
        <div className="grid grid-cols-2 gap-3">
          <div>
            <label className="block text-xs font-semibold uppercase tracking-wider text-text-muted-dark mb-1">
              Target Sets *
            </label>
            <div className="flex items-center gap-2">
              <input
                type="number"
                min={1}
                max={10}
                value={targetSets}
                onChange={(e) => setTargetSets(parseInt(e.target.value, 10) || 1)}
                className="w-full rounded-lg border border-surface-border-dark bg-surface-card-dark px-3 py-2 text-sm text-text-primary-dark focus:border-emerald-500 focus:outline-none focus:ring-1 focus:ring-emerald-500"
              />
            </div>
          </div>

          <div>
            <label className="block text-xs font-semibold uppercase tracking-wider text-text-muted-dark mb-1">
              Target Reps / Time *
            </label>
            <div className="relative">
              <input
                type="text"
                value={targetReps}
                onChange={(e) => setTargetReps(e.target.value)}
                placeholder="e.g. 8–15 or 30 sec"
                className="w-full rounded-lg border border-surface-border-dark bg-surface-card-dark px-3 py-2 text-sm text-text-primary-dark focus:border-emerald-500 focus:outline-none focus:ring-1 focus:ring-emerald-500"
              />
              <Target className="absolute right-3 top-2.5 h-4 w-4 text-text-muted-dark/60 pointer-events-none" />
            </div>
          </div>
        </div>

        {/* Quick Rep Range Pills */}
        <div className="flex flex-wrap items-center gap-1.5 pt-0.5">
          <span className="text-[10px] text-text-muted-dark">Quick Reps:</span>
          {REP_PRESETS.map((preset) => (
            <button
              type="button"
              key={preset}
              onClick={() => setTargetReps(preset)}
              className={`rounded px-2 py-0.5 text-[10px] transition-colors ${
                targetReps === preset
                  ? 'bg-emerald-500/20 text-emerald-400 border border-emerald-500/30'
                  : 'bg-surface-card-dark text-text-muted-dark hover:text-text-primary-dark'
              }`}
            >
              {preset}
            </button>
          ))}
        </div>

        {/* Tempo Note */}
        <div>
          <label className="block text-xs font-semibold uppercase tracking-wider text-text-muted-dark mb-1">
            Tempo / Form Cue <span className="text-text-muted-dark/60 lowercase">(optional)</span>
          </label>
          <div className="relative">
            <input
              type="text"
              value={tempoNote}
              onChange={(e) => setTempoNote(e.target.value)}
              placeholder="e.g. 3s eccentric down, pause 1s at top"
              className="w-full rounded-lg border border-surface-border-dark bg-surface-card-dark px-3 py-2 text-sm text-text-primary-dark focus:border-emerald-500 focus:outline-none focus:ring-1 focus:ring-emerald-500"
            />
            <Clock className="absolute right-3 top-2.5 h-4 w-4 text-text-muted-dark/60 pointer-events-none" />
          </div>
        </div>

        {/* Actions */}
        <div className="flex items-center justify-end gap-2 pt-3 border-t border-surface-border-dark">
          <button
            type="button"
            onClick={onClose}
            className="rounded-lg px-4 py-2 text-xs font-semibold text-text-muted-dark hover:bg-surface-card-dark hover:text-text-primary-dark transition-colors"
          >
            Cancel
          </button>
          <button
            type="submit"
            className="rounded-lg bg-emerald-500 px-5 py-2 text-xs font-bold text-slate-950 shadow-md shadow-emerald-500/20 hover:bg-emerald-400 transition-colors"
          >
            {initialData ? 'Save Changes' : 'Add Exercise'}
          </button>
        </div>
      </form>
    </Modal>
  );
};
