import React, { useState } from 'react';
import { Flame, Trophy, Calendar, Filter, ChevronLeft, ChevronRight } from 'lucide-react';
import { useTaskStore } from '../../store/useTaskStore';
import { useSettingsStore } from '../../store/useSettingsStore';
import { getCalendarGridDays } from '../../lib/dateUtils';
import { calculateStreakStats } from '../../lib/streakUtils';
import { HeatmapCell } from './HeatmapCell';
import { DateDetailPopover } from './DateDetailPopover';

interface StreakHeatmapProps {
  onSelectDateToLog?: (dateStr: string) => void;
}

export const StreakHeatmap: React.FC<StreakHeatmapProps> = ({ onSelectDateToLog }) => {
  const [selectedYear, setSelectedYear] = useState<number>(new Date().getFullYear());
  const [filterCategoryId, setFilterCategoryId] = useState<string | undefined>(undefined);
  const [activePopoverDate, setActivePopoverDate] = useState<string | null>(null);

  const categories = useTaskStore((state) => state.categories);
  const dayEntries = useTaskStore((state) => state.dayEntries);
  const streakRule = useSettingsStore((state) => state.settings.streakRule);
  const weekStartsOn = useSettingsStore((state) => state.settings.weekStartsOn);

  const activeCategories = categories.filter((c) => !c.archived);

  // Compute streak stats
  const streakStats = calculateStreakStats(dayEntries, categories, streakRule, filterCategoryId);

  // Grid days
  const gridDays = getCalendarGridDays(selectedYear, weekStartsOn);

  // Group days into columns of 7 days (weeks)
  const weeks: (typeof gridDays)[] = [];
  for (let i = 0; i < gridDays.length; i += 7) {
    weeks.push(gridDays.slice(i, i + 7));
  }

  // Find month header placement (first appearance of each month)
  const monthLabels: { month: string; colIndex: number }[] = [];
  let currentMonth = '';
  weeks.forEach((week, colIdx) => {
    const firstDayInWeek = week[0];
    if (firstDayInWeek && firstDayInWeek.month !== currentMonth && firstDayInWeek.isCurrentYear) {
      currentMonth = firstDayInWeek.month;
      monthLabels.push({ month: currentMonth, colIndex: colIdx });
    }
  });

  const dayLabels = weekStartsOn === 'monday' ? ['Mon', '', 'Wed', '', 'Fri', '', 'Sun'] : ['Sun', '', 'Tue', '', 'Thu', '', 'Sat'];

  return (
    <div className="space-y-6">
      {/* Header & Controls */}
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h2 className="font-display text-xl font-bold tracking-tight text-text-primary-dark">
            Streak Contribution Calendar
          </h2>
          <p className="text-xs font-mono text-text-muted-dark">
            Split-segment heatmap showing daily category completions across the year.
          </p>
        </div>

        {/* Filters & Year Switcher */}
        <div className="flex flex-wrap items-center gap-2">
          {/* Category Filter dropdown */}
          <div className="flex items-center gap-1.5 rounded-xl border border-surface-border-dark bg-surface-dark px-3 py-1.5 font-mono text-xs text-text-primary-dark">
            <Filter className="w-3.5 h-3.5 text-streak" />
            <select
              value={filterCategoryId || ''}
              onChange={(e) => setFilterCategoryId(e.target.value || undefined)}
              aria-label="Filter heatmap by category"
              className="bg-transparent text-text-primary-dark focus:outline-none cursor-pointer"
            >
              <option value="" className="bg-surface-dark">Combined All Categories</option>
              {activeCategories.map((cat) => (
                <option key={cat.id} value={cat.id} className="bg-surface-dark">
                  {cat.name}
                </option>
              ))}
            </select>
          </div>

          {/* Year Switcher */}
          <div className="flex items-center rounded-xl border border-surface-border-dark bg-surface-dark px-2 py-1 font-mono text-xs">
            <button
              onClick={() => setSelectedYear(selectedYear - 1)}
              className="p-1 text-text-muted-dark hover:text-text-primary-dark"
              title="Previous year"
            >
              <ChevronLeft className="w-3.5 h-3.5" />
            </button>
            <span className="px-2 font-bold text-text-primary-dark">{selectedYear}</span>
            <button
              onClick={() => setSelectedYear(selectedYear + 1)}
              className="p-1 text-text-muted-dark hover:text-text-primary-dark"
              title="Next year"
            >
              <ChevronRight className="w-3.5 h-3.5" />
            </button>
          </div>
        </div>
      </div>

      {/* Streak Headline Stats Bar */}
      <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
        <div className="rounded-xl border border-surface-border-dark bg-surface-dark p-3.5 shadow-sm">
          <div className="flex items-center gap-1.5 text-xs font-mono text-text-muted-dark mb-1">
            <Flame className="w-4 h-4 text-streak" />
            <span>CURRENT STREAK</span>
          </div>
          <p className="font-mono text-2xl font-bold text-streak">{streakStats.currentStreak} Days</p>
        </div>

        <div className="rounded-xl border border-surface-border-dark bg-surface-dark p-3.5 shadow-sm">
          <div className="flex items-center gap-1.5 text-xs font-mono text-text-muted-dark mb-1">
            <Trophy className="w-4 h-4 text-amber-400" />
            <span>LONGEST STREAK</span>
          </div>
          <p className="font-mono text-2xl font-bold text-text-primary-dark">{streakStats.longestStreak} Days</p>
        </div>

        <div className="rounded-xl border border-surface-border-dark bg-surface-dark p-3.5 shadow-sm">
          <div className="flex items-center gap-1.5 text-xs font-mono text-text-muted-dark mb-1">
            <Calendar className="w-4 h-4 text-blue-400" />
            <span>30-DAY RATE</span>
          </div>
          <p className="font-mono text-2xl font-bold text-text-primary-dark">{streakStats.completionRate30}%</p>
        </div>

        <div className="rounded-xl border border-surface-border-dark bg-surface-dark p-3.5 shadow-sm">
          <div className="flex items-center gap-1.5 text-xs font-mono text-text-muted-dark mb-1">
            <Calendar className="w-4 h-4 text-purple-400" />
            <span>90-DAY RATE</span>
          </div>
          <p className="font-mono text-2xl font-bold text-text-primary-dark">{streakStats.completionRate90}%</p>
        </div>
      </div>

      {/* Heatmap Grid Container */}
      <div className="relative overflow-x-auto rounded-xl border border-surface-border-dark bg-surface-dark p-5 shadow-md">
        <div className="min-w-[760px]">
          {/* Month Headers */}
          <div className="flex mb-2 text-[10px] font-mono text-text-muted-dark pl-8 relative h-4">
            {monthLabels.map((lbl, idx) => (
              <span
                key={`${lbl.month}-${idx}`}
                className="absolute"
                style={{ left: `${lbl.colIndex * 15.5 + 32}px` }}
              >
                {lbl.month}
              </span>
            ))}
          </div>

          {/* Grid Layout: Row of Day Labels + Grid Columns */}
          <div className="flex gap-1.5 items-start">
            {/* Day of Week Labels */}
            <div className="flex flex-col gap-1 pr-2 text-[10px] font-mono text-text-muted-dark h-[112px] justify-between">
              {dayLabels.map((lbl, i) => (
                <span key={i} className="h-3.5 leading-3">
                  {lbl}
                </span>
              ))}
            </div>

            {/* Weeks Columns */}
            <div className="flex gap-1.5">
              {weeks.map((week, weekIdx) => (
                <div key={weekIdx} className="flex flex-col gap-1">
                  {week.map((day) => (
                    <HeatmapCell
                      key={day.dateStr}
                      dateStr={day.dateStr}
                      dayEntry={dayEntries[day.dateStr]}
                      activeCategories={activeCategories}
                      filterCategoryId={filterCategoryId}
                      isCurrentYear={day.isCurrentYear}
                      onClick={() => setActivePopoverDate(activePopoverDate === day.dateStr ? null : day.dateStr)}
                    />
                  ))}
                </div>
              ))}
            </div>
          </div>

          {/* Active Date Popover */}
          {activePopoverDate && (
            <DateDetailPopover
              dateStr={activePopoverDate}
              dayEntry={dayEntries[activePopoverDate]}
              categories={categories}
              onClose={() => setActivePopoverDate(null)}
              onGoToDate={(date) => {
                setActivePopoverDate(null);
                if (onSelectDateToLog) onSelectDateToLog(date);
              }}
            />
          )}
        </div>

        {/* Legend */}
        <div className="mt-4 pt-3 border-t border-surface-border-dark flex flex-wrap items-center justify-between text-xs font-mono text-text-muted-dark">
          <span>Cell slivers represent category completions</span>
          <div className="flex flex-wrap items-center gap-3">
            {activeCategories.map((c) => (
              <div key={c.id} className="flex items-center gap-1.5">
                <span className="h-2.5 w-2.5 rounded-sm" style={{ backgroundColor: c.color }} />
                <span className="text-[11px] text-text-primary-dark">{c.name}</span>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
};
