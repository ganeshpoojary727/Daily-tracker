import { create } from 'zustand';
import { Settings } from '../types';
import { appStorage } from '../lib/storage';

const STORAGE_KEY_SETTINGS = 'dt_settings_v1';

const DEFAULT_SETTINGS: Settings = {
  theme: 'dark',
  weekStartsOn: 'monday',
  streakRule: 'any-category',
  dailyBatchSize: 5,
  reminderTime: '20:00',
  githubSync: {
    enabled: false,
    token: '',
    gistId: '',
  },
};

interface SettingsStoreState {
  settings: Settings;
  updateSettings: (updates: Partial<Settings>) => void;
  setTheme: (theme: 'light' | 'dark' | 'system') => void;
  setStreakRule: (rule: 'any-category' | 'all-categories') => void;
  setWeekStartsOn: (day: 'sunday' | 'monday') => void;
  setDailyBatchSize: (size: number) => void;
  updateGithubSync: (sync: Partial<NonNullable<Settings['githubSync']>>) => void;
  setSettings: (settings: Settings) => void;
}

export const useSettingsStore = create<SettingsStoreState>((set, get) => {
  const initialSettings = appStorage.getItem<Settings>(STORAGE_KEY_SETTINGS, DEFAULT_SETTINGS);

  return {
    settings: initialSettings,

    updateSettings: (updates) => {
      const { settings } = get();
      const newSettings = { ...settings, ...updates };
      appStorage.setItem(STORAGE_KEY_SETTINGS, newSettings);
      set({ settings: newSettings });
    },

    setTheme: (theme) => {
      const { settings } = get();
      const newSettings = { ...settings, theme };
      appStorage.setItem(STORAGE_KEY_SETTINGS, newSettings);
      set({ settings: newSettings });
    },

    setStreakRule: (streakRule) => {
      const { settings } = get();
      const newSettings = { ...settings, streakRule };
      appStorage.setItem(STORAGE_KEY_SETTINGS, newSettings);
      set({ settings: newSettings });
    },

    setWeekStartsOn: (weekStartsOn) => {
      const { settings } = get();
      const newSettings = { ...settings, weekStartsOn };
      appStorage.setItem(STORAGE_KEY_SETTINGS, newSettings);
      set({ settings: newSettings });
    },

    setDailyBatchSize: (dailyBatchSize) => {
      const { settings } = get();
      const newSettings = { ...settings, dailyBatchSize };
      appStorage.setItem(STORAGE_KEY_SETTINGS, newSettings);
      set({ settings: newSettings });
    },

    updateGithubSync: (syncUpdates) => {
      const { settings } = get();
      const currentSync = settings.githubSync || { enabled: false };
      const newSync = { ...currentSync, ...syncUpdates };
      const newSettings = { ...settings, githubSync: newSync };
      appStorage.setItem(STORAGE_KEY_SETTINGS, newSettings);
      set({ settings: newSettings });
    },

    setSettings: (newSettings) => {
      appStorage.setItem(STORAGE_KEY_SETTINGS, newSettings);
      set({ settings: newSettings });
    },
  };
});
