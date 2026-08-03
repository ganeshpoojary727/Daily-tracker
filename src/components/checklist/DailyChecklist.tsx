import React, { useState } from 'react';
import { Plus, Archive, CheckCircle2 } from 'lucide-react';
import { useTaskStore } from '../../store/useTaskStore';
import { useGoalStore } from '../../store/useGoalStore';
import { DatePicker } from './DatePicker';
import { TaskCard } from './TaskCard';
import { AddCategoryModal } from './AddCategoryModal';
import { getTodayStr } from '../../lib/dateUtils';
import { ProgressBar } from '../ui/ProgressBar';

interface DailyChecklistProps {
  initialDate?: string | null;
}

export const DailyChecklist: React.FC<DailyChecklistProps> = ({ initialDate }) => {
  const [selectedDate, setSelectedDate] = useState<string>(initialDate || getTodayStr());
  const [isAddModalOpen, setIsAddModalOpen] = useState(false);
  const [showArchived, setShowArchived] = useState(false);

  const categories = useTaskStore((state) => state.categories);
  const dayEntries = useTaskStore((state) => state.dayEntries);
  const toggleTask = useTaskStore((state) => state.toggleTask);
  const updateTaskCount = useTaskStore((state) => state.updateTaskCount);
  const updateTaskNote = useTaskStore((state) => state.updateTaskNote);
  const addCategory = useTaskStore((state) => state.addCategory);
  const unarchiveCategory = useTaskStore((state) => state.unarchiveCategory);

  const checkAndSyncGoalsProgress = useGoalStore((state) => state.checkAndSyncGoalsProgress);

  const activeCategories = categories.filter((c) => !c.archived);
  const archivedCategories = categories.filter((c) => c.archived);
  const currentEntry = dayEntries[selectedDate] || { date: selectedDate, tasks: {} };

  // Calculate day completion count
  const completedCount = activeCategories.filter((c) => currentEntry.tasks[c.id]?.done).length;

  const handleToggle = (categoryId: string, count?: number, note?: string) => {
    toggleTask(selectedDate, categoryId, count, note);
    // Sync goals after updating task
    setTimeout(() => {
      checkAndSyncGoalsProgress(useTaskStore.getState().dayEntries);
    }, 50);
  };

  const handleCountUpdate = (categoryId: string, count: number) => {
    updateTaskCount(selectedDate, categoryId, count);
    setTimeout(() => {
      checkAndSyncGoalsProgress(useTaskStore.getState().dayEntries);
    }, 50);
  };

  return (
    <div className="space-y-6">
      {/* Header & Date Picker */}
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h2 className="font-display text-xl font-bold tracking-tight text-text-primary-dark">
            Daily Checklist
          </h2>
          <p className="text-xs font-mono text-text-muted-dark">
            Track daily targets, backfill missed days, or plan ahead.
          </p>
        </div>

        <button
          onClick={() => setIsAddModalOpen(true)}
          className="flex items-center gap-2 rounded-xl bg-streak px-4 py-2.5 font-display text-xs font-bold text-white shadow-lg shadow-streak/25 hover:bg-streak/90 transition-all self-start sm:self-auto"
        >
          <Plus className="w-4 h-4" />
          <span>Add Category</span>
        </button>
      </div>

      {/* Date Picker Banner */}
      <DatePicker selectedDate={selectedDate} onSelectDate={setSelectedDate} />

      {/* Daily Progress Banner */}
      <div className="rounded-xl border border-surface-border-dark bg-surface-dark p-4 shadow-sm">
        <div className="flex flex-wrap items-center justify-between gap-3 mb-2">
          <div className="flex items-center gap-2">
            <CheckCircle2 className="w-4 h-4 text-streak" />
            <span className="font-display text-xs font-bold text-text-primary-dark">
              Completion Rate for {selectedDate}
            </span>
          </div>
          <span className="font-mono text-xs text-streak font-semibold">
            {completedCount} / {activeCategories.length} Completed
          </span>
        </div>
        <ProgressBar value={completedCount} max={activeCategories.length} heightClass="h-2" />
      </div>

      {/* Checklist Cards Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {activeCategories.map((category) => (
          <TaskCard
            key={category.id}
            category={category}
            taskEntry={currentEntry.tasks[category.id]}
            onToggle={(count, note) => handleToggle(category.id, count, note)}
            onUpdateCount={(count) => handleCountUpdate(category.id, count)}
            onUpdateNote={(note) => updateTaskNote(selectedDate, category.id, note)}
          />
        ))}
      </div>

      {/* Archived Categories Section */}
      {archivedCategories.length > 0 && (
        <div className="pt-6 border-t border-surface-border-dark">
          <button
            onClick={() => setShowArchived(!showArchived)}
            className="flex items-center gap-2 text-xs font-mono text-text-muted-dark hover:text-text-primary-dark mb-3"
          >
            <Archive className="w-3.5 h-3.5" />
            <span>{showArchived ? 'Hide' : 'Show'} Archived Categories ({archivedCategories.length})</span>
          </button>

          {showArchived && (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
              {archivedCategories.map((c) => (
                <div
                  key={c.id}
                  className="flex items-center justify-between rounded-lg border border-surface-border-dark bg-surface-hover-dark/30 p-3 opacity-60"
                >
                  <span className="text-xs font-display font-semibold text-text-muted-dark">{c.name}</span>
                  <button
                    onClick={() => unarchiveCategory(c.id)}
                    className="text-[11px] font-mono text-streak hover:underline"
                  >
                    Restore
                  </button>
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      {/* Modal */}
      <AddCategoryModal
        isOpen={isAddModalOpen}
        onClose={() => setIsAddModalOpen(false)}
        onAddCategory={addCategory}
      />
    </div>
  );
};
