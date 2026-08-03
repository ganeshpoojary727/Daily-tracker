import {
  format,
  parseISO,
  eachDayOfInterval,
  startOfYear,
  endOfYear,
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

/**
 * Returns full array of days for a calendar heatmap grid.
 * Grid includes lead-in days to start on weekStartsOn ('sunday' | 'monday').
 */
export function getCalendarGridDays(year: number = new Date().getFullYear(), weekStartsOn: 'sunday' | 'monday' = 'monday') {
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
