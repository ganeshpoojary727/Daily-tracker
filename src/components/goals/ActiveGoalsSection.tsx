import React, { useState } from 'react';
import { Target, Plus, ArrowRight } from 'lucide-react';
import { useGoalStore } from '../../store/useGoalStore';
import { useTaskStore } from '../../store/useTaskStore';
import { GoalCard } from './GoalCard';
import { AddGoalModal } from './AddGoalModal';

interface ActiveGoalsSectionProps {
  onNavigateToGoals?: () => void;
}

export const ActiveGoalsSection: React.FC<ActiveGoalsSectionProps> = ({ onNavigateToGoals }) => {
  const [isAddModalOpen, setIsAddModalOpen] = useState(false);

  const goals = useGoalStore((state) => state.goals);
  const addGoal = useGoalStore((state) => state.addGoal);
  const deleteGoal = useGoalStore((state) => state.deleteGoal);
  const updateGoalProgress = useGoalStore((state) => state.updateGoalProgress);
  const checkAndSyncGoalsProgress = useGoalStore((state) => state.checkAndSyncGoalsProgress);

  const categories = useTaskStore((state) => state.categories);
  const dayEntries = useTaskStore((state) => state.dayEntries);

  const activeGoals = goals.filter((g) => g.status === 'active');

  const handleAddGoal = (newGoalData: Parameters<typeof addGoal>[0]) => {
    addGoal(newGoalData);
    // Immediately calculate progress from existing dayEntries
    setTimeout(() => {
      checkAndSyncGoalsProgress(dayEntries);
    }, 50);
  };

  return (
    <div className="pt-6 border-t border-surface-border-dark space-y-4">
      {/* Section Header */}
      <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
        <div className="flex items-center gap-2.5">
          <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-streak/15 border border-streak/30 text-streak">
            <Target className="w-4 h-4" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h3 className="font-display text-base font-bold tracking-tight text-text-primary-dark">
                Active Goals & Deadlines
              </h3>
              <span className="rounded-full bg-streak/15 border border-streak/30 px-2 py-0.5 text-[10px] font-mono font-bold text-streak">
                {activeGoals.length} {activeGoals.length === 1 ? 'Target' : 'Targets'}
              </span>
            </div>
            <p className="text-[11px] font-mono text-text-muted-dark">
              Higher-level targets driven by daily task logging with live deadline countdowns.
            </p>
          </div>
        </div>

        {/* Action Buttons */}
        <div className="flex items-center gap-2 self-start sm:self-auto">
          {onNavigateToGoals && (
            <button
              type="button"
              onClick={onNavigateToGoals}
              className="flex items-center gap-1.5 rounded-lg border border-surface-border-dark bg-surface-dark px-3 py-1.5 font-display text-xs font-semibold text-text-muted-dark hover:border-streak hover:text-text-primary-dark transition-all"
            >
              <span>All Goals</span>
              <ArrowRight className="w-3.5 h-3.5" />
            </button>
          )}

          <button
            type="button"
            onClick={() => setIsAddModalOpen(true)}
            className="flex items-center gap-1.5 rounded-lg bg-streak px-3.5 py-1.5 font-display text-xs font-bold text-white shadow-md shadow-streak/20 hover:bg-streak/90 transition-all active:scale-95"
          >
            <Plus className="w-3.5 h-3.5" />
            <span>Create Goal</span>
          </button>
        </div>
      </div>

      {/* Goals Cards Grid */}
      {activeGoals.length === 0 ? (
        <div className="rounded-xl border border-dashed border-surface-border-dark bg-surface-dark/40 p-8 text-center">
          <Target className="w-8 h-8 text-text-muted-dark mx-auto mb-2 opacity-60" />
          <h4 className="font-display text-sm font-bold text-text-primary-dark">No Active Goals Set</h4>
          <p className="text-xs font-mono text-text-muted-dark max-w-md mx-auto mt-1 mb-4">
            Connect your daily checkboxes to weekly or monthly targets (like solving 30 LeetCode problems or attending 10 workouts) with live countdown timers.
          </p>
          <button
            type="button"
            onClick={() => setIsAddModalOpen(true)}
            className="inline-flex items-center gap-1.5 rounded-lg bg-surface-hover-dark border border-surface-border-dark px-4 py-2 font-display text-xs font-bold text-text-primary-dark hover:border-streak hover:text-streak transition-all"
          >
            <Plus className="w-3.5 h-3.5" />
            <span>Set Your First Goal</span>
          </button>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {activeGoals.map((goal) => (
            <GoalCard
              key={goal.id}
              goal={goal}
              category={categories.find((c) => c.id === goal.categoryId)}
              onUpdateProgress={updateGoalProgress}
              onDelete={deleteGoal}
            />
          ))}
        </div>
      )}

      {/* Add Goal Modal */}
      <AddGoalModal
        isOpen={isAddModalOpen}
        onClose={() => setIsAddModalOpen(false)}
        categories={categories}
        onAddGoal={handleAddGoal}
      />
    </div>
  );
};
