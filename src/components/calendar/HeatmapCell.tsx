import React from 'react';
import { Category, DayEntry } from '../../types';
import { formatDateStr, isToday } from '../../lib/dateUtils';

export const LEETCODE_INTENSITY_PALETTE = [
  {
    level: 0,
    label: '0 tasks completed',
    bg: 'rgba(255, 255, 255, 0.07)',
    border: 'rgba(255, 255, 255, 0.06)',
    shadow: 'none',
  },
  {
    level: 1,
    label: '1 task completed (Light)',
    bg: '#14532d', // Light / soft forest emerald
    border: 'rgba(34, 197, 94, 0.35)',
    shadow: 'none',
  },
  {
    level: 2,
    label: '2 tasks completed (Medium)',
    bg: '#15803d', // Medium green
    border: 'rgba(34, 197, 94, 0.5)',
    shadow: 'none',
  },
  {
    level: 3,
    label: '3–4 tasks completed (Bright)',
    bg: '#22c55e', // Bright green
    border: 'rgba(74, 222, 128, 0.65)',
    shadow: '0 0 4px rgba(34, 197, 94, 0.3)',
  },
  {
    level: 4,
    label: '5+ tasks completed (Max Vibrant)',
    bg: '#4ade80', // Ultra vibrant neon green
    border: '#86efac',
    shadow: '0 0 8px rgba(74, 222, 128, 0.55)',
  },
];

interface HeatmapCellProps {
  dateStr: string;
  dayEntry?: DayEntry;
  activeCategories: Category[];
  filterCategoryId?: string;
  isCurrentYear: boolean;
  onClick: (e: React.MouseEvent) => void;
}

function hexToRgba(hex: string, alpha: number): string {
  const clean = hex.replace('#', '');
  if (clean.length !== 6) return hex;
  const r = parseInt(clean.substring(0, 2), 16);
  const g = parseInt(clean.substring(2, 4), 16);
  const b = parseInt(clean.substring(4, 6), 16);
  return `rgba(${r}, ${g}, ${b}, ${alpha})`;
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
  const formattedDate = formatDateStr(dateStr, 'MMM d, yyyy');

  // Single category filter mode: scale vibrancy of that category's color
  if (filterCategoryId) {
    const singleCat = activeCategories.find((c) => c.id === filterCategoryId);
    const taskData = tasks[filterCategoryId];
    const isDone = !!taskData?.done;
    const count = taskData?.count ?? (isDone ? 1 : 0);
    const target = singleCat?.dailyTarget || 1;
    const catColor = singleCat?.color || '#22c55e';

    let bg = LEETCODE_INTENSITY_PALETTE[0].bg;
    let border = LEETCODE_INTENSITY_PALETTE[0].border;
    let shadow = 'none';

    if (isDone) {
      const ratio = count / target;
      if (ratio < 0.5) {
        bg = hexToRgba(catColor, 0.38);
        border = hexToRgba(catColor, 0.5);
      } else if (ratio < 1) {
        bg = hexToRgba(catColor, 0.68);
        border = hexToRgba(catColor, 0.8);
      } else if (ratio === 1) {
        bg = catColor;
        border = hexToRgba(catColor, 0.95);
      } else {
        bg = catColor;
        border = '#ffffff99';
        shadow = `0 0 8px ${hexToRgba(catColor, 0.6)}`;
      }
    }

    return (
      <button
        type="button"
        onClick={onClick}
        title={`${formattedDate} • ${singleCat?.name || 'Category'}: ${
          isDone ? `${count} ${singleCat?.unit || 'completed'}` : 'No activity'
        }`}
        className={`relative h-3.5 w-3.5 rounded-[3px] transition-all duration-150 hover:scale-125 hover:z-10 ${
          !isCurrentYear ? 'opacity-20' : ''
        } ${isTodayCell ? 'ring-2 ring-streak ring-offset-1 ring-offset-bg-dark' : ''}`}
        style={{
          backgroundColor: bg,
          border: `1px solid ${border}`,
          boxShadow: shadow,
        }}
      />
    );
  }

  // Combined LeetCode mode: vibrancy scales with number of completed categories/tasks
  const completedCategories = activeCategories.filter((cat) => !!tasks[cat.id]?.done);
  const completedCount = completedCategories.length;
  const totalCategories = Math.max(activeCategories.length, 1);

  let intensityLevel = 0;
  if (completedCount === 0) {
    intensityLevel = 0;
  } else if (completedCount === 1) {
    intensityLevel = 1;
  } else if (completedCount === 2) {
    intensityLevel = 2;
  } else if (completedCount >= totalCategories || completedCount >= 5) {
    intensityLevel = 4;
  } else {
    intensityLevel = 3;
  }

  const stylePreset = LEETCODE_INTENSITY_PALETTE[intensityLevel];
  const completedNames = completedCategories.map((c) => c.name).join(', ');
  const tooltipText =
    completedCount > 0
      ? `${formattedDate} — ${completedCount} / ${totalCategories} tasks completed (${completedNames})`
      : `${formattedDate} — No tasks completed`;

  return (
    <button
      type="button"
      onClick={onClick}
      title={tooltipText}
      className={`relative h-3.5 w-3.5 rounded-[3px] transition-all duration-150 hover:scale-125 hover:z-10 ${
        !isCurrentYear ? 'opacity-25' : ''
      } ${isTodayCell ? 'ring-2 ring-streak ring-offset-1 ring-offset-bg-dark' : ''}`}
      style={{
        backgroundColor: stylePreset.bg,
        border: `1px solid ${stylePreset.border}`,
        boxShadow: stylePreset.shadow,
      }}
    />
  );
};
