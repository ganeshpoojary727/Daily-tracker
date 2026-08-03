import React, { useState } from 'react';
import { Modal } from '../ui/Modal';
import { Category } from '../../types';
import { IconRenderer } from '../ui/IconRenderer';

interface AddCategoryModalProps {
  isOpen: boolean;
  onClose: () => void;
  onAddCategory: (category: Omit<Category, 'id' | 'archived' | 'createdAt'>) => void;
}

const PRESET_COLORS = [
  '#4C9AFF', // LeetCode blue
  '#9F7AEA', // Java purple
  '#F6AD55', // Aptitude orange
  '#48BB78', // Personal Project green
  '#F56565', // Major Project red
  '#38B2AC', // Exercise teal
  '#ED64A6', // Pink
  '#ECC94B', // Yellow
  '#667EEA', // Indigo
  '#E8590C', // Flame streak
];

const PRESET_ICONS = [
  'Code2',
  'BookOpen',
  'Brain',
  'FolderGit2',
  'Layers',
  'Activity',
  'Target',
  'Sparkles',
  'Coffee',
  'Flame',
  'Dumbbell',
  'Cpu',
  'Globe',
  'PenTool',
];

export const AddCategoryModal: React.FC<AddCategoryModalProps> = ({
  isOpen,
  onClose,
  onAddCategory,
}) => {
  const [name, setName] = useState('');
  const [color, setColor] = useState(PRESET_COLORS[0]);
  const [icon, setIcon] = useState(PRESET_ICONS[0]);
  const [dailyTarget, setDailyTarget] = useState<number | undefined>(1);
  const [unit, setUnit] = useState('session');

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim()) return;

    onAddCategory({
      name: name.trim(),
      color,
      icon,
      dailyTarget: dailyTarget ? Number(dailyTarget) : undefined,
      unit: unit.trim() || 'session',
    });

    // Reset & Close
    setName('');
    setColor(PRESET_COLORS[0]);
    setIcon(PRESET_ICONS[0]);
    setDailyTarget(1);
    setUnit('session');
    onClose();
  };

  return (
    <Modal isOpen={isOpen} onClose={onClose} title="Add New Accountability Category">
      <form onSubmit={handleSubmit} className="space-y-4">
        {/* Category Name */}
        <div>
          <label className="block text-xs font-mono text-text-muted-dark mb-1">Category Name *</label>
          <input
            type="text"
            value={name}
            onChange={(e) => setName(e.target.value)}
            placeholder="e.g. System Design, System Admin..."
            className="w-full rounded-lg border border-surface-border-dark bg-surface-hover-dark px-3 py-2 text-sm text-text-primary-dark focus:border-streak focus:outline-none"
            required
          />
        </div>

        {/* Color Selector */}
        <div>
          <label className="block text-xs font-mono text-text-muted-dark mb-1.5">Accent Hue</label>
          <div className="flex flex-wrap gap-2">
            {PRESET_COLORS.map((c) => (
              <button
                key={c}
                type="button"
                onClick={() => setColor(c)}
                className={`h-7 w-7 rounded-lg transition-transform ${
                  color === c ? 'scale-110 ring-2 ring-white ring-offset-2 ring-offset-surface-dark' : 'hover:scale-105'
                }`}
                style={{ backgroundColor: c }}
              />
            ))}
          </div>
        </div>

        {/* Icon Selector */}
        <div>
          <label className="block text-xs font-mono text-text-muted-dark mb-1.5">Icon</label>
          <div className="grid grid-cols-7 gap-2">
            {PRESET_ICONS.map((i) => (
              <button
                key={i}
                type="button"
                onClick={() => setIcon(i)}
                className={`flex h-9 w-9 items-center justify-center rounded-lg border transition-all ${
                  icon === i
                    ? 'border-streak bg-streak/20 text-streak'
                    : 'border-surface-border-dark bg-surface-hover-dark text-text-muted-dark hover:text-text-primary-dark'
                }`}
              >
                <IconRenderer name={i} className="w-4 h-4" />
              </button>
            ))}
          </div>
        </div>

        {/* Target & Unit */}
        <div className="grid grid-cols-2 gap-3">
          <div>
            <label className="block text-xs font-mono text-text-muted-dark mb-1">Daily Target</label>
            <input
              type="number"
              min="1"
              value={dailyTarget || ''}
              onChange={(e) => setDailyTarget(e.target.value ? Number(e.target.value) : undefined)}
              placeholder="e.g. 5"
              className="w-full rounded-lg border border-surface-border-dark bg-surface-hover-dark px-3 py-2 text-sm text-text-primary-dark focus:border-streak focus:outline-none"
            />
          </div>
          <div>
            <label className="block text-xs font-mono text-text-muted-dark mb-1">Unit</label>
            <input
              type="text"
              value={unit}
              onChange={(e) => setUnit(e.target.value)}
              placeholder="e.g. problems, sessions"
              className="w-full rounded-lg border border-surface-border-dark bg-surface-hover-dark px-3 py-2 text-sm text-text-primary-dark focus:border-streak focus:outline-none"
            />
          </div>
        </div>

        {/* Submit */}
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
            Create Category
          </button>
        </div>
      </form>
    </Modal>
  );
};
