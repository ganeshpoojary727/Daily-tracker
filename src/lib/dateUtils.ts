import {
  format,
  parseISO,
  eachDayOfInterval,
  startOfYear,
  endOfYear,
  endOfMonth,
  startOfWeek,
  endOfWeek,
  differenceInSeconds,
  isToday as isTodayFns,
  subDays,
} from 'date-fns';

export function getTodayStr(): string {
  return format(new Date(), 'yyyy-MM-dd');
}

export function formatDateStr(dateStr: string, formatPattern: string = 'MMM d, yyyy'): string {
  try {
    return format(parseISO(dateStr), formatPattern);
  } catch {
    return dateStr;
  }
}

export function isToday(dateStr: string): boolean {
  try {
    return isTodayFns(parseISO(dateStr));
  } catch {
    return false;
  }
}

export function isFuture(dateStr: string): boolean {
  try {
    const today = getTodayStr();
    return dateStr > today;
  } catch {
    return false;
  }
}

export interface CalendarDay {
  dateStr: string;
  date: Date;
  isCurrentYear: boolean;
  month: string;
  monthIndex: number;
  dayOfWeek: number;
}

export interface CalendarMonthBlock {
  monthName: string;
  monthIndex: number;
  weeks: (CalendarDay | null)[][];
}

/**
 * Returns full array of days for a calendar heatmap grid.
 * Grid includes lead-in days to start on weekStartsOn ('sunday' | 'monday').
 */
export function getCalendarGridDays(year: number = new Date().getFullYear(), weekStartsOn: 'sunday' | 'monday' = 'monday'): CalendarDay[] {
  const startDay = weekStartsOn === 'monday' ? 1 : 0;
  const yearStart = startOfYear(new Date(year, 0, 1));
  const yearEnd = endOfYear(new Date(year, 11, 31));

  const gridStart = startOfWeek(yearStart, { weekStartsOn: startDay });
  const gridEnd = endOfWeek(yearEnd, { weekStartsOn: startDay });

  const days = eachDayOfInterval({ start: gridStart, end: gridEnd });

  return days.map((d) => ({
    dateStr: format(d, 'yyyy-MM-dd'),
    date: d,
    isCurrentYear: d.getFullYear() === year,
    month: format(d, 'MMM'),
    monthIndex: d.getMonth(),
    dayOfWeek: d.getDay(),
  }));
}

/**
 * Returns 12 distinct month blocks (Jan - Dec) formatted like LeetCode's submission calendar.
 * Each month block contains its own week columns with null spacers for leading/trailing weekdays.
 */
export function getCalendarMonthBlocks(
  year: number = new Date().getFullYear(),
  weekStartsOn: 'sunday' | 'monday' = 'monday'
): CalendarMonthBlock[] {
  const blocks: CalendarMonthBlock[] = [];

  for (let monthIndex = 0; monthIndex < 12; monthIndex++) {
    const monthStart = new Date(year, monthIndex, 1);
    const monthEnd = endOfMonth(monthStart);
    const daysInMonth = eachDayOfInterval({ start: monthStart, end: monthEnd });

    // Calculate weekday offset (0..6) for the 1st of the month
    const firstDayOfWeek = monthStart.getDay(); // 0 (Sun) .. 6 (Sat)
    const leadingNulls =
      weekStartsOn === 'monday' ? (firstDayOfWeek + 6) % 7 : firstDayOfWeek;

    const slots: (CalendarDay | null)[] = [];
    for (let i = 0; i < leadingNulls; i++) {
      slots.push(null);
    }

    for (const d of daysInMonth) {
      slots.push({
        dateStr: format(d, 'yyyy-MM-dd'),
        date: d,
        isCurrentYear: true,
        month: format(d, 'MMM'),
        monthIndex,
        dayOfWeek: d.getDay(),
      });
    }

    while (slots.length % 7 !== 0) {
      slots.push(null);
    }

    const weeks: (CalendarDay | null)[][] = [];
    for (let i = 0; i < slots.length; i += 7) {
      weeks.push(slots.slice(i, i + 7));
    }

    blocks.push({
      monthName: format(monthStart, 'MMM'),
      monthIndex,
      weeks,
    });
  }

  return blocks;
}

export interface CountdownResult {
  days: number;
  hours: number;
  minutes: number;
  seconds: number;
  totalSeconds: number;
  isExpired: boolean;
  isNearDeadline: boolean; // < 24 hours
}

export function calculateCountdown(endDateISO: string): CountdownResult {
  const end = new Date(endDateISO);
  const now = new Date();
  const diffSec = differenceInSeconds(end, now);

  if (diffSec <= 0) {
    return {
      days: 0,
      hours: 0,
      minutes: 0,
      seconds: 0,
      totalSeconds: 0,
      isExpired: true,
      isNearDeadline: false,
    };
  }

  const days = Math.floor(diffSec / (3600 * 24));
  const hours = Math.floor((diffSec % (3600 * 24)) / 3600);
  const minutes = Math.floor((diffSec % 3600) / 60);
  const seconds = diffSec % 60;
  const isNearDeadline = diffSec <= 24 * 3600;

  return {
    days,
    hours,
    minutes,
    seconds,
    totalSeconds: diffSec,
    isExpired: false,
    isNearDeadline,
  };
}

export function getTrailingDates(daysCount: number): string[] {
  const result: string[] = [];
  const today = new Date();
  for (let i = daysCount - 1; i >= 0; i--) {
    result.push(format(subDays(today, i), 'yyyy-MM-dd'));
  }
  return result;
}
