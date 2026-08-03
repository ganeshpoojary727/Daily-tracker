import React, { useState } from 'react';
import { motion } from 'framer-motion';
import { Check, MessageSquare, Plus, Minus } from 'lucide-react';
import { Category, DayTaskEntry } from '../../types';
import { IconRenderer } from '../ui/IconRenderer';

interface TaskCardProps {
  category: Category;
  taskEntry?: DayTaskEntry;
  onToggle: (count?: number, note?: string) => void;
  onUpdateCount: (count: number) => void;
  onUpdateNote: (note: string) => void;
}

export const TaskCard: React.FC<TaskCardProps> = ({
  category,
  taskEntry,
  onToggle,
  onUpdateCount,
  onUpdateNote,
}) => {
  const isDone = !!taskEntry?.done;
  const count = taskEntry?.count ?? (isDone ? category.dailyTarget || 1 : 0);
  const note = taskEntry?.note || '';

  const [isEditingNote, setIsEditingNote] = useState(false);
  const [noteInput, setNoteInput] = useState(note);

  const handleNoteSave = () => {
    onUpdateNote(noteInput);
    setIsEditingNote(false);
  };

  return (
    <motion.div
      whileHover={{ y: -2 }}
      transition={{ duration: 0.15 }}
      className={`relative overflow-hidden rounded-xl border transition-all ${isDone
          ? 'border-surface-border-dark bg-surface-dark/90 shadow-md'
          : 'border-surface-border-dark/60 bg-surface-dark/40 hover:border-surface-border-dark hover:bg-surface-dark/70'
        }`}
    >
      {/* Category Hue Top Border Accent Bar */}
      <div
        className="h-1 w-full transition-opacity duration-300"
        style={{
          backgroundColor: category.color,
          opacity: isDone ? 1 : 0.3,
        }}
      />

      <div className="p-4">
        <div className="flex items-start justify-between gap-3">
          {/* Category Icon + Title */}
          <div className="flex items-center gap-3">
            <button
              onClick={() => onToggle()}
              className={`flex h-10 w-10 shrink-0 items-center justify-center rounded-xl border transition-all ${isDone
                  ? 'border-transparent text-white shadow-lg'
                  : 'border-surface-border-dark bg-surface-hover-dark text-text-muted-dark hover:border-text-muted-dark'
                }`}
              style={{
                backgroundColor: isDone ? category.color : undefined,
                boxShadow: isDone ? `0 4px 14px ${category.color}40` : undefined,
              }}
            >
              {isDone ? <Check className="w-5 h-5 stroke-[3]" /> : <IconRenderer name={category.icon} className="w-5 h-5" />}
            </button>

            <div>
              <div className="flex items-center gap-2">
                <h3
                  className={`font-display text-sm font-bold transition-colors ${isDone ? 'text-text-primary-dark line-through decoration-text-muted-dark/50' : 'text-text-primary-dark'
                    }`}
                >
                  {category.name}
                </h3>
              </div>
              {category.dailyTarget && (
                <p className="text-xs font-mono text-text-muted-dark">
                  Target: {category.dailyTarget} {category.unit || 'units'}
                </p>
              )}
            </div>
          </div>

          {/* Complete Toggle Action */}
          <button
            onClick={() => onToggle()}
            className={`rounded-lg px-3 py-1.5 font-display text-xs font-semibold transition-colors ${isDone
                ? 'bg-surface-hover-dark text-text-muted-dark hover:text-rose-400'
                : 'bg-streak/10 text-streak border border-streak/30 hover:bg-streak hover:text-white'
              }`}
          >
            {isDone ? 'Undo' : 'Mark Done'}
          </button>
        </div>

        {/* Count & Note Controls (visible when done or editing) */}
        {isDone && (
          <div className="mt-4 pt-3 border-t border-surface-border-dark/60 flex flex-wrap items-center justify-between gap-2">
            {/* Numeric Count Adjuster */}
            <div className="flex items-center gap-2">
              <span className="text-[11px] font-mono text-text-muted-dark uppercase">Logged:</span>
              <div className="flex items-center rounded-lg border border-surface-border-dark bg-surface-hover-dark/60">
                <button
                  onClick={() => onUpdateCount(Math.max(1, count - 1))}
                  className="px-2 py-1 text-text-muted-dark hover:text-text-primary-dark"
                >
                  <Minus className="w-3 h-3" />
                </button>
                <span className="px-2 font-mono text-xs font-bold text-text-primary-dark">{count}</span>
                <button
                  onClick={() => onUpdateCount(count + 1)}
                  className="px-2 py-1 text-text-muted-dark hover:text-text-primary-dark"
                >
                  <Plus className="w-3 h-3" />
                </button>
              </div>
              <span className="text-xs font-mono text-text-muted-dark">{category.unit || 'units'}</span>
            </div>

            {/* Note toggle */}
            {!isEditingNote && (
              <button
                onClick={() => setIsEditingNote(true)}
                className="flex items-center gap-1 text-[11px] font-mono text-text-muted-dark hover:text-text-primary-dark"
              >
                <MessageSquare className="w-3 h-3" />
                <span>{note ? 'Edit Note' : '+ Note'}</span>
              </button>
            )}
          </div>
        )}

        {/* Note Editor */}
        {isEditingNote && (
          <div className="mt-3 flex items-center gap-2">
            <input
              type="text"
              value={noteInput}
              onChange={(e) => setNoteInput(e.target.value)}
              placeholder="Add short note (e.g., solved 5 DP problems)..."
              className="flex-1 rounded-lg border border-surface-border-dark bg-surface-hover-dark px-3 py-1 text-xs font-sans text-text-primary-dark focus:border-streak focus:outline-none"
              onKeyDown={(e) => e.key === 'Enter' && handleNoteSave()}
              autoFocus
            />
            <button
              onClick={handleNoteSave}
              className="rounded-lg bg-streak px-3 py-1 font-display text-xs font-semibold text-white"
            >
              Save
            </button>
          </div>
        )}

        {/* Saved Note Display */}
        {note && !isEditingNote && isDone && (
          <p className="mt-2 text-xs font-sans text-text-muted-dark italic bg-surface-hover-dark/30 rounded p-1.5 border border-surface-border-dark/40">
            "{note}"
          </p>
        )}
      </div>
    </motion.div>
  );
};
