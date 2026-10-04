import React from 'react';
import { DayOfWeek } from '../../types/workout';
import { useWorkoutStore, getDayOfWeekFromDate } from '../../store/useWorkoutStore';
import { Check, Flame, Moon } from 'lucide-react';

interface WeeklyDayBarProps {
  selectedDay: DayOfWeek;
  onSelectDay: (day: DayOfWeek) => void;
  activeDate: string;
}

const DAYS_ORDER: { day: DayOfWeek; short: string; defaultFocus: string }[] = [
  { day: 'monday', short: 'Mon', defaultFocus: 'Upper A + Abs' },
  { day: 'tuesday', short: 'Tue', defaultFocus: 'Legs + Core' },
  { day: 'wednesday', short: 'Wed', defaultFocus: 'Rest / Walk' },
  { day: 'thursday', short: 'Thu', defaultFocus: 'Upper B + Abs' },
  { day: 'friday', short: 'Fri', defaultFocus: 'Legs + Finisher' },
  { day: 'saturday', short: 'Sat', defaultFocus: 'Light Activity' },
  { day: 'sunday', short: 'Sun', defaultFocus: 'Complete Rest' },
];

export const WeeklyDayBar: React.FC<WeeklyDayBarProps> = ({
  selectedDay,
  onSelectDay,
  activeDate,
}) => {
  const { routine, logs } = useWorkoutStore();
  const todayDayOfWeek = getDayOfWeekFromDate(activeDate);

  return (
    <div className="w-full overflow-x-auto pb-1 scrollbar-none">
      <div className="flex items-center gap-2 min-w-max">
        {DAYS_ORDER.map(({ day, short, defaultFocus }) => {
          const isSelected = selectedDay === day;
          const isToday = todayDayOfWeek === day;
          const dayRoutine = routine[day];
          const isRest = dayRoutine?.isRestDay;

          // Check if this day is completed in the current log
          const logForDay = logs[activeDate];
          const isCompleted = logForDay?.dayOfWeek === day && logForDay.completedAll;

          return (
            <button
              key={day}
              type="button"
              onClick={() => onSelectDay(day)}
              className={`group relative flex flex-col items-start rounded-xl border p-2.5 transition-all min-w-[120px] text-left ${
                isSelected
                  ? 'border-emerald-500 bg-emerald-500/10 shadow-md shadow-emerald-500/10 ring-1 ring-emerald-500/50'
                  : 'border-surface-border-dark bg-surface-card-dark hover:border-surface-border-dark/80 hover:bg-surface-dark'
              }`}
            >
              {/* Top Row: Short Name + Badges */}
              <div className="flex w-full items-center justify-between gap-1 mb-1">
                <div className="flex items-center gap-1.5">
                  <span
                    className={`font-display text-sm font-bold tracking-tight ${
                      isSelected
                        ? 'text-emerald-400'
                        : isToday
                        ? 'text-streak'
                        : 'text-text-primary-dark'
                    }`}
                  >
                    {short}
                  </span>

                  {isToday && (
                    <span className="rounded bg-streak/20 px-1 py-0.2 text-[9px] font-mono font-bold uppercase tracking-wider text-streak">
                      Today
                    </span>
                  )}
                </div>

                {/* Status Indicator */}
                {isCompleted ? (
                  <div className="flex h-4 w-4 items-center justify-center rounded-full bg-emerald-500 text-slate-950">
                    <Check className="h-2.5 w-2.5 stroke-[3]" />
                  </div>
                ) : isRest ? (
                  <Moon className="h-3.5 w-3.5 text-text-muted-dark/70" />
                ) : (
                  <Flame className="h-3.5 w-3.5 text-text-muted-dark/40 group-hover:text-emerald-400/80 transition-colors" />
                )}
              </div>

              {/* Focus Subtitle */}
              <span
                className={`truncate text-[11px] font-medium ${
                  isSelected
                    ? 'text-emerald-300'
                    : 'text-text-muted-dark group-hover:text-text-primary-dark'
                }`}
              >
                {dayRoutine?.title || defaultFocus}
              </span>

              {/* Bottom detail pill */}
              <span className="text-[10px] text-text-muted-dark/70 mt-0.5 font-mono">
                {isRest ? 'Recovery' : `${dayRoutine?.exercises?.length || 0} exercises`}
              </span>
            </button>
          );
        })}
      </div>
    </div>
  );
};
