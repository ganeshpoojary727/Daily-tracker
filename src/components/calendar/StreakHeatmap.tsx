import React, { useState } from 'react';
import { Flame, Trophy, Calendar, Filter, ChevronLeft, ChevronRight, CheckCircle2 } from 'lucide-react';
import { useTaskStore } from '../../store/useTaskStore';
import { useSettingsStore } from '../../store/useSettingsStore';
import { getCalendarMonthBlocks } from '../../lib/dateUtils';
import { calculateStreakStats } from '../../lib/streakUtils';
import { HeatmapCell, LEETCODE_INTENSITY_PALETTE } from './HeatmapCell';
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

  // Month-separated blocks like LeetCode's submission calendar
  const monthBlocks = getCalendarMonthBlocks(selectedYear, weekStartsOn);

  // Calculate yearly LeetCode-style totals
  let totalTasksInYear = 0;
  let activeDaysInYear = 0;

  Object.entries(dayEntries).forEach(([dateStr, entry]) => {
    if (!dateStr.startsWith(`${selectedYear}-`) || !entry?.tasks) return;
    const completedForDay = activeCategories.filter((cat) => {
      if (filterCategoryId && cat.id !== filterCategoryId) return false;
      return !!entry.tasks[cat.id]?.done;
    }).length;

    if (completedForDay > 0) {
      totalTasksInYear += completedForDay;
      activeDaysInYear += 1;
    }
  });

  const dayLabels =
    weekStartsOn === 'monday'
      ? ['Mon', '', 'Wed', '', 'Fri', '', 'Sun']
      : ['Sun', '', 'Tue', '', 'Thu', '', 'Sat'];

  return (
    <div className="space-y-6">
      {/* Header & Controls */}
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h2 className="font-display text-xl font-bold tracking-tight text-text-primary-dark">
            Streak Contribution Calendar
          </h2>
          <p className="text-xs font-mono text-text-muted-dark">
            LeetCode-style activity heatmap — completing more daily tasks unlocks brighter, more vibrant greens.
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

      {/* LeetCode-Formatted Heatmap Card */}
      <div className="relative overflow-x-auto rounded-xl border border-surface-border-dark bg-surface-dark p-5 shadow-md">
        {/* Top LeetCode Summary Header inside card */}
        <div className="mb-4 flex flex-wrap items-center justify-between gap-3 border-b border-surface-border-dark/70 pb-3">
          <div className="flex items-center gap-2">
            <CheckCircle2 className="h-4 w-4 text-emerald-400" />
            <span className="font-display text-sm font-bold text-text-primary-dark">
              {totalTasksInYear} {totalTasksInYear === 1 ? 'task' : 'tasks'} completed in {selectedYear}
            </span>
          </div>
          <div className="flex items-center gap-4 text-xs font-mono text-text-muted-dark">
            <span>
              Total active days: <strong className="text-text-primary-dark">{activeDaysInYear}</strong>
            </span>
            <span>
              Max streak: <strong className="text-text-primary-dark">{streakStats.longestStreak}</strong>
            </span>
          </div>
        </div>

        <div className="min-w-[880px]">
          {/* Grid Layout: Day of Week Labels + 12 Separated Month Blocks */}
          <div className="flex items-start gap-3">
            {/* Day of Week Labels */}
            <div className="flex flex-col gap-1 pt-6 pr-1 text-[10px] font-mono text-text-muted-dark select-none">
              {dayLabels.map((lbl, i) => (
                <div key={i} className="flex h-3.5 items-center leading-none">
                  {lbl}
                </div>
              ))}
            </div>

            {/* 12 Month Blocks (LeetCode-style grouped months) */}
            <div className="flex flex-1 items-start justify-between gap-3">
              {monthBlocks.map((monthBlock) => (
                <div key={monthBlock.monthName} className="flex flex-col items-center">
                  {/* Month Header Centered Above Month Block */}
                  <span className="mb-2 text-[11px] font-mono font-semibold tracking-wide text-text-muted-dark">
                    {monthBlock.monthName}
                  </span>

                  {/* Week Columns for this Month */}
                  <div className="flex gap-1">
                    {monthBlock.weeks.map((week, weekIdx) => (
                      <div key={weekIdx} className="flex flex-col gap-1">
                        {week.map((day, dayIdx) =>
                          day ? (
                            <HeatmapCell
                              key={day.dateStr}
                              dateStr={day.dateStr}
                              dayEntry={dayEntries[day.dateStr]}
                              activeCategories={activeCategories}
                              filterCategoryId={filterCategoryId}
                              isCurrentYear={day.isCurrentYear}
                              onClick={() =>
                                setActivePopoverDate(activePopoverDate === day.dateStr ? null : day.dateStr)
                              }
                            />
                          ) : (
                            <div
                              key={`empty-${monthBlock.monthIndex}-${weekIdx}-${dayIdx}`}
                              className="h-3.5 w-3.5 rounded-[3px] opacity-0 pointer-events-none"
                            />
                          )
                        )}
                      </div>
                    ))}
                  </div>
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

        {/* Bottom Legend: LeetCode Intensity Scale + Interactive Category Filter Pills */}
        <div className="mt-5 pt-3.5 border-t border-surface-border-dark flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between text-xs font-mono text-text-muted-dark">
          {/* LeetCode Color Vibrancy Scale */}
          <div className="flex items-center gap-2">
            <span className="text-[11px] text-text-muted-dark">Less</span>
            <div className="flex items-center gap-1">
              {LEETCODE_INTENSITY_PALETTE.map((item) => (
                <span
                  key={item.level}
                  title={item.label}
                  className="h-3.5 w-3.5 rounded-[3px] inline-block transition-transform hover:scale-125"
                  style={{
                    backgroundColor: item.bg,
                    border: `1px solid ${item.border}`,
                    boxShadow: item.shadow,
                  }}
                />
              ))}
            </div>
            <span className="text-[11px] text-text-muted-dark">More</span>
            <span className="ml-2 hidden md:inline text-[11px] text-text-muted-dark/80">
              (1 task = light green → 5+ tasks = vibrant green)
            </span>
          </div>

          {/* Tracked Categories Pills (click to filter) */}
          <div className="flex flex-wrap items-center gap-2">
            {activeCategories.map((c) => {
              const isSelected = filterCategoryId === c.id;
              return (
                <button
                  key={c.id}
                  type="button"
                  onClick={() => setFilterCategoryId(isSelected ? undefined : c.id)}
                  title={`Click to filter calendar by ${c.name}`}
                  className={`flex items-center gap-1.5 rounded-lg border px-2 py-1 transition-all ${
                    isSelected
                      ? 'border-streak bg-streak/15 text-white'
                      : 'border-surface-border-dark/60 bg-surface-hover-dark/40 text-text-primary-dark hover:border-surface-border-dark'
                  }`}
                >
                  <span className="h-2.5 w-2.5 rounded-sm" style={{ backgroundColor: c.color }} />
                  <span className="text-[11px]">{c.name}</span>
                </button>
              );
            })}
          </div>
        </div>
      </div>
    </div>
  );
};
