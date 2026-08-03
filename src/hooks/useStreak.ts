import { useMemo } from 'react';
import { useTaskStore } from '../store/useTaskStore';
import { useSettingsStore } from '../store/useSettingsStore';
import { calculateStreakStats, StreakStats } from '../lib/streakUtils';

export function useStreak(filterCategoryId?: string): StreakStats {
  const dayEntries = useTaskStore((state) => state.dayEntries);
  const categories = useTaskStore((state) => state.categories);
  const streakRule = useSettingsStore((state) => state.settings.streakRule);

  return useMemo(() => {
    return calculateStreakStats(dayEntries, categories, streakRule, filterCategoryId);
  }, [dayEntries, categories, streakRule, filterCategoryId]);
}
