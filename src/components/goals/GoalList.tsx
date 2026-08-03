import React, { useState } from 'react';
import { Plus, Target } from 'lucide-react';
import { useGoalStore } from '../../store/useGoalStore';
import { useTaskStore } from '../../store/useTaskStore';
import { GoalCard } from './GoalCard';
import { AddGoalModal } from './AddGoalModal';

export const GoalList: React.FC = () => {
  const [filterStatus, setFilterStatus] = useState<'all' | 'active' | 'completed' | 'failed'>('all');
  const [isAddModalOpen, setIsAddModalOpen] = useState(false);

  const goals = useGoalStore((state) => state.goals);
  const addGoal = useGoalStore((state) => state.addGoal);
  const deleteGoal = useGoalStore((state) => state.deleteGoal);
  const updateGoalProgress = useGoalStore((state) => state.updateGoalProgress);

  const categories = useTaskStore((state) => state.categories);

  const filteredGoals = goals.filter((g) => {
    if (filterStatus === 'all') return true;
    return g.status === filterStatus;
  });

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h2 className="font-display text-xl font-bold tracking-tight text-text-primary-dark">
            Accountability Goals & Timers
          </h2>
          <p className="text-xs font-mono text-text-muted-dark">
            Track deadline-driven targets with live updating countdown timers.
          </p>
        </div>

        <button
          onClick={() => setIsAddModalOpen(true)}
          className="flex items-center gap-2 rounded-xl bg-streak px-4 py-2.5 font-display text-xs font-bold text-white shadow-lg shadow-streak/25 hover:bg-streak/90 transition-all self-start sm:self-auto"
        >
          <Plus className="w-4 h-4" />
          <span>New Goal</span>
        </button>
      </div>

      {/* Filter Tabs */}
      <div className="flex items-center gap-2 border-b border-surface-border-dark pb-3">
        {(['all', 'active', 'completed', 'failed'] as const).map((status) => (
          <button
            key={status}
            onClick={() => setFilterStatus(status)}
            className={`rounded-lg px-3 py-1.5 font-display text-xs font-semibold capitalize transition-all ${
              filterStatus === status
                ? 'bg-streak text-white shadow-sm'
                : 'text-text-muted-dark hover:bg-surface-dark hover:text-text-primary-dark'
            }`}
          >
            {status} ({goals.filter((g) => (status === 'all' ? true : g.status === status)).length})
          </button>
        ))}
      </div>

      {/* Goals Grid */}
      {filteredGoals.length === 0 ? (
        <div className="flex flex-col items-center justify-center rounded-xl border border-dashed border-surface-border-dark p-12 text-center">
          <Target className="w-10 h-10 text-text-muted-dark mb-3 stroke-[1.5]" />
          <h3 className="font-display text-sm font-bold text-text-primary-dark">No goals found</h3>
          <p className="text-xs font-mono text-text-muted-dark mt-1">
            Create a weekly or monthly goal to start tracking progress against live countdown timers.
          </p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {filteredGoals.map((goal) => (
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

      {/* Modal */}
      <AddGoalModal
        isOpen={isAddModalOpen}
        onClose={() => setIsAddModalOpen(false)}
        categories={categories}
        onAddGoal={addGoal}
      />
    </div>
  );
};
