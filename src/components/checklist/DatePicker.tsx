import React from 'react';
import { Calendar, ChevronLeft, ChevronRight, RotateCcw } from 'lucide-react';
import { format, subDays, addDays, parseISO } from 'date-fns';
import { getTodayStr, formatDateStr, isToday } from '../../lib/dateUtils';

interface DatePickerProps {
  selectedDate: string; // "YYYY-MM-DD"
  onSelectDate: (dateStr: string) => void;
}

export const DatePicker: React.FC<DatePickerProps> = ({ selectedDate, onSelectDate }) => {
  const todayStr = getTodayStr();
  const currentDate = parseISO(selectedDate);

  const handlePrevDay = () => {
    const prev = subDays(currentDate, 1);
    onSelectDate(format(prev, 'yyyy-MM-dd'));
  };

  const handleNextDay = () => {
    const next = addDays(currentDate, 1);
    onSelectDate(format(next, 'yyyy-MM-dd'));
  };

  const handleTodayClick = () => {
    onSelectDate(todayStr);
  };

  return (
    <div className="flex flex-wrap items-center justify-between gap-3 rounded-xl border border-surface-border-dark bg-surface-dark p-3.5 shadow-sm">
      {/* Current Selected Date Display */}
      <div className="flex items-center gap-2">
        <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-surface-hover-dark text-streak border border-surface-border-dark">
          <Calendar className="w-5 h-5" />
        </div>
        <div>
          <div className="flex items-center gap-2">
            <span className="font-display font-bold text-sm text-text-primary-dark">
              {formatDateStr(selectedDate, 'EEEE, MMMM d, yyyy')}
            </span>
            {isToday(selectedDate) && (
              <span className="rounded-full bg-streak/20 px-2 py-0.5 text-[10px] font-mono font-semibold text-streak">
                TODAY
              </span>
            )}
          </div>
          <p className="text-xs font-mono text-text-muted-dark">
            {selectedDate === todayStr ? 'Logging for today' : selectedDate < todayStr ? 'Backfilling past date' : 'Planning future date'}
          </p>
        </div>
      </div>

      {/* Date Controls */}
      <div className="flex items-center gap-2">
        {!isToday(selectedDate) && (
          <button
            onClick={handleTodayClick}
            className="flex items-center gap-1 rounded-lg border border-surface-border-dark bg-surface-hover-dark px-3 py-1.5 font-mono text-xs text-text-primary-dark hover:border-streak/50 hover:text-streak transition-colors"
          >
            <RotateCcw className="w-3.5 h-3.5" />
            <span>Reset Today</span>
          </button>
        )}

        <button
          onClick={handlePrevDay}
          className="flex h-8 w-8 items-center justify-center rounded-lg border border-surface-border-dark bg-surface-hover-dark text-text-muted-dark hover:text-text-primary-dark hover:border-surface-border-dark transition-colors"
          title="Previous day"
        >
          <ChevronLeft className="w-4 h-4" />
        </button>

        {/* Native HTML Date Picker Input */}
        <input
          type="date"
          value={selectedDate}
          onChange={(e) => e.target.value && onSelectDate(e.target.value)}
          className="rounded-lg border border-surface-border-dark bg-surface-hover-dark px-2.5 py-1 font-mono text-xs text-text-primary-dark focus:border-streak focus:outline-none"
        />

        <button
          onClick={handleNextDay}
          className="flex h-8 w-8 items-center justify-center rounded-lg border border-surface-border-dark bg-surface-hover-dark text-text-muted-dark hover:text-text-primary-dark hover:border-surface-border-dark transition-colors"
          title="Next day"
        >
          <ChevronRight className="w-4 h-4" />
        </button>
      </div>
    </div>
  );
};
