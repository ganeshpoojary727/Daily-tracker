import React from 'react';
import { Category, DayEntry } from '../../types';
import { isToday } from '../../lib/dateUtils';

interface HeatmapCellProps {
  dateStr: string;
  dayEntry?: DayEntry;
  activeCategories: Category[];
  filterCategoryId?: string;
  isCurrentYear: boolean;
  onClick: (e: React.MouseEvent) => void;
}

export const HeatmapCell: React.FC<HeatmapCellProps> = ({
  dateStr,
  dayEntry,
  activeCategories,
  filterCategoryId,
  isCurrentYear,
  onClick,
}) => {
  const isTodayCell = isToday(dateStr);
  const tasks = dayEntry?.tasks || {};

  // If single category filter is selected
  if (filterCategoryId) {
    const singleCat = activeCategories.find((c) => c.id === filterCategoryId);
    const isDone = !!tasks[filterCategoryId]?.done;
    const catColor = singleCat?.color || '#E8590C';

    return (
      <button
        onClick={onClick}
        title={`${dateStr}: ${isDone ? 'Completed' : 'No activity'}`}
        className={`relative h-3.5 w-3.5 rounded-sm transition-all hover:scale-125 hover:z-10 ${
          !isCurrentYear ? 'opacity-20' : ''
        } ${isTodayCell ? 'ring-2 ring-streak ring-offset-1 ring-offset-bg-dark' : ''}`}
        style={{
          backgroundColor: isDone ? catColor : 'var(--cell-bg, rgba(255, 255, 255, 0.05))',
        }}
      />
    );
  }

  // Combined mode: Split-segment cell divided into up to 6 slivers (signature visual)
  const visibleCategories = activeCategories.slice(0, 6);

  return (
    <button
      onClick={onClick}
      className={`relative flex h-3.5 w-3.5 overflow-hidden rounded-sm border border-surface-border-dark/40 transition-all hover:scale-125 hover:z-10 ${
        !isCurrentYear ? 'opacity-25' : ''
      } ${isTodayCell ? 'ring-2 ring-streak ring-offset-1 ring-offset-bg-dark' : ''}`}
      style={{
        backgroundColor: 'rgba(255, 255, 255, 0.03)',
      }}
    >
      {visibleCategories.map((cat) => {
        const isDone = !!tasks[cat.id]?.done;
        return (
          <div
            key={cat.id}
            className="h-full flex-1 transition-colors duration-200"
            style={{
              backgroundColor: isDone ? cat.color : 'transparent',
            }}
          />
        );
      })}
    </button>
  );
};
