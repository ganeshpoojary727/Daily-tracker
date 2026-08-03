import { format, subDays, parseISO, isBefore, isEqual } from 'date-fns';
import { Category, DayEntry } from '../types';
import { getTodayStr } from './dateUtils';

export interface StreakStats {
  currentStreak: number;
  longestStreak: number;
  completionRate30: number; // percentage 0 - 100
  completionRate90: number; // percentage 0 - 100
  totalCompletedDays: number;
}

/**
 * Checks if a day entry counts as completed based on the category filter or global streak rule.
 */
export function isDayCompleted(
  dayEntry: DayEntry | undefined,
  activeCategories: Category[],
  streakRule: 'any-category' | 'all-categories' = 'any-category',
  filterCategoryId?: string
): boolean {
  if (!dayEntry || !dayEntry.tasks) return false;

  const validCategories = activeCategories.filter((c) => !c.archived);
  if (validCategories.length === 0) return false;

  if (filterCategoryId) {
    return !!dayEntry.tasks[filterCategoryId]?.done;
  }

  if (streakRule === 'all-categories') {
    return validCategories.every((cat) => dayEntry.tasks[cat.id]?.done);
  }

  // default 'any-category'
  return validCategories.some((cat) => dayEntry.tasks[cat.id]?.done);
}

export function calculateStreakStats(
  dayEntries: Record<string, DayEntry>,
  activeCategories: Category[],
  streakRule: 'any-category' | 'all-categories' = 'any-category',
  filterCategoryId?: string
): StreakStats {
  const todayStr = getTodayStr();
  const sortedDates = Object.keys(dayEntries).sort();

  if (sortedDates.length === 0) {
    return {
      currentStreak: 0,
      longestStreak: 0,
      completionRate30: 0,
      completionRate90: 0,
      totalCompletedDays: 0,
    };
  }

  // Map of completed dates
  const completedDateMap = new Set<string>();
  Object.values(dayEntries).forEach((entry) => {
    if (isDayCompleted(entry, activeCategories, streakRule, filterCategoryId)) {
      completedDateMap.add(entry.date);
    }
  });

  // Calculate current streak
  let currentStreak = 0;
  let checkDate = new Date();

  // If today isn't completed yet, check if yesterday was completed to keep current streak active
  const todayCompleted = completedDateMap.has(todayStr);
  if (!todayCompleted) {
    checkDate = subDays(checkDate, 1);
  }

  while (true) {
    const dStr = format(checkDate, 'yyyy-MM-dd');
    if (completedDateMap.has(dStr)) {
      currentStreak++;
      checkDate = subDays(checkDate, 1);
    } else {
      break;
    }
  }

  // Calculate longest streak
  let longestStreak = 0;
  let tempStreak = 0;

  // Find range of dates from earliest entry to today
  if (sortedDates.length > 0) {
    const earliestDate = parseISO(sortedDates[0]);
    const latestDate = new Date();
    let currentCursor = earliestDate;

    while (isBefore(currentCursor, latestDate) || isEqual(currentCursor, latestDate)) {
      const dStr = format(currentCursor, 'yyyy-MM-dd');
      if (completedDateMap.has(dStr)) {
        tempStreak++;
        if (tempStreak > longestStreak) {
          longestStreak = tempStreak;
        }
      } else {
        tempStreak = 0;
      }
      currentCursor = subDays(currentCursor, -1); // +1 day
    }
  }

  // Calculate trailing 30 and 90 day completion rates
  let completedIn30 = 0;
  let completedIn90 = 0;
  const now = new Date();

  for (let i = 0; i < 30; i++) {
    const dStr = format(subDays(now, i), 'yyyy-MM-dd');
    if (completedDateMap.has(dStr)) completedIn30++;
  }

  for (let i = 0; i < 90; i++) {
    const dStr = format(subDays(now, i), 'yyyy-MM-dd');
    if (completedDateMap.has(dStr)) completedIn90++;
  }

  return {
    currentStreak,
    longestStreak,
    completionRate30: Math.round((completedIn30 / 30) * 100),
    completionRate90: Math.round((completedIn90 / 90) * 100),
    totalCompletedDays: completedDateMap.size,
  };
}
