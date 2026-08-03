import React, { useState } from 'react';
import { Modal } from '../ui/Modal';
import { Goal, Category } from '../../types';

interface AddGoalModalProps {
  isOpen: boolean;
  onClose: () => void;
  categories: Category[];
  onAddGoal: (goal: Omit<Goal, 'id' | 'status'>) => void;
}

export const AddGoalModal: React.FC<AddGoalModalProps> = ({
  isOpen,
  onClose,
  categories,
  onAddGoal,
}) => {
  const [title, setTitle] = useState('');
  const [type, setType] = useState<'weekly' | 'monthly' | 'custom'>('weekly');
  const [categoryId, setCategoryId] = useState<string>('');
  const [targetValue, setTargetValue] = useState<number>(10);
  const [durationDays, setDurationDays] = useState<number>(7);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!title.trim()) return;

    const startDate = new Date().toISOString();
    const endDate = new Date(Date.now() + durationDays * 24 * 60 * 60 * 1000).toISOString();

    onAddGoal({
      title: title.trim(),
      type,
      categoryId: categoryId || undefined,
      targetValue: Number(targetValue),
      currentValue: 0,
      startDate,
      endDate,
    });

    setTitle('');
    setType('weekly');
    setCategoryId('');
    setTargetValue(10);
    setDurationDays(7);
    onClose();
  };

  const handleTypeChange = (newType: 'weekly' | 'monthly' | 'custom') => {
    setType(newType);
    if (newType === 'weekly') {
      setDurationDays(7);
    } else if (newType === 'monthly') {
      setDurationDays(30);
    }
  };

  return (
    <Modal isOpen={isOpen} onClose={onClose} title="Create Accountability Goal">
      <form onSubmit={handleSubmit} className="space-y-4">
        {/* Goal Title */}
        <div>
          <label className="block text-xs font-mono text-text-muted-dark mb-1">Goal Title *</label>
          <input
            type="text"
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            placeholder="e.g. Solve 30 LeetCode Problems, Run 10 Sessions..."
            className="w-full rounded-lg border border-surface-border-dark bg-surface-hover-dark px-3 py-2 text-sm text-text-primary-dark focus:border-streak focus:outline-none"
            required
          />
        </div>

        {/* Goal Type */}
        <div>
          <label className="block text-xs font-mono text-text-muted-dark mb-1.5">Goal Period</label>
          <div className="grid grid-cols-3 gap-2">
            {(['weekly', 'monthly', 'custom'] as const).map((t) => (
              <button
                key={t}
                type="button"
                onClick={() => handleTypeChange(t)}
                className={`rounded-lg border py-1.5 font-display text-xs font-semibold capitalize transition-all ${
                  type === t
                    ? 'border-streak bg-streak/20 text-streak'
                    : 'border-surface-border-dark bg-surface-hover-dark text-text-muted-dark hover:text-text-primary-dark'
                }`}
              >
                {t}
              </button>
            ))}
          </div>
        </div>

        {/* Category Link (Optional) */}
        <div>
          <label className="block text-xs font-mono text-text-muted-dark mb-1">Linked Category (Auto-accumulate)</label>
          <select
            value={categoryId}
            onChange={(e) => setCategoryId(e.target.value)}
            className="w-full rounded-lg border border-surface-border-dark bg-surface-hover-dark px-3 py-2 text-sm text-text-primary-dark focus:border-streak focus:outline-none"
          >
            <option value="">None (Manual progress)</option>
            {categories
              .filter((c) => !c.archived)
              .map((c) => (
                <option key={c.id} value={c.id}>
                  {c.name} ({c.unit || 'units'})
                </option>
              ))}
          </select>
          <p className="text-[11px] font-mono text-text-muted-dark mt-1">
            Linked goals automatically update progress when checklist items are logged.
          </p>
        </div>

        {/* Target Value & Duration */}
        <div className="grid grid-cols-2 gap-3">
          <div>
            <label className="block text-xs font-mono text-text-muted-dark mb-1">Target Quantity *</label>
            <input
              type="number"
              min="1"
              value={targetValue}
              onChange={(e) => setTargetValue(Number(e.target.value))}
              className="w-full rounded-lg border border-surface-border-dark bg-surface-hover-dark px-3 py-2 text-sm text-text-primary-dark focus:border-streak focus:outline-none"
              required
            />
          </div>
          <div>
            <label className="block text-xs font-mono text-text-muted-dark mb-1">Time Horizon (Days)</label>
            <input
              type="number"
              min="1"
              value={durationDays}
              onChange={(e) => setDurationDays(Number(e.target.value))}
              className="w-full rounded-lg border border-surface-border-dark bg-surface-hover-dark px-3 py-2 text-sm text-text-primary-dark focus:border-streak focus:outline-none"
              required
            />
          </div>
        </div>

        {/* Action Buttons */}
        <div className="flex justify-end gap-2 pt-3 border-t border-surface-border-dark">
          <button
            type="button"
            onClick={onClose}
            className="rounded-lg px-4 py-2 text-xs font-semibold text-text-muted-dark hover:text-text-primary-dark"
          >
            Cancel
          </button>
          <button
            type="submit"
            className="rounded-lg bg-streak px-4 py-2 font-display text-xs font-bold text-white shadow-md hover:bg-streak/90"
          >
            Create Goal
          </button>
        </div>
      </form>
    </Modal>
  );
};
