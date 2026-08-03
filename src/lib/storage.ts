/**
 * Centralized LocalStorage wrapper to abstract persistence operations.
 */

export const appStorage = {
  getItem<T>(key: string, fallback: T): T {
    try {
      const item = localStorage.getItem(key);
      if (item === null) return fallback;
      return JSON.parse(item) as T;
    } catch (error) {
      console.error(`[appStorage] Error reading key "${key}":`, error);
      return fallback;
    }
  },

  setItem<T>(key: string, value: T): void {
    try {
      localStorage.setItem(key, JSON.stringify(value));
    } catch (error) {
      console.error(`[appStorage] Error writing key "${key}":`, error);
    }
  },

  removeItem(key: string): void {
    try {
      localStorage.removeItem(key);
    } catch (error) {
      console.error(`[appStorage] Error removing key "${key}":`, error);
    }
  },

  clear(): void {
    try {
      localStorage.clear();
    } catch (error) {
      console.error('[appStorage] Error clearing storage:', error);
    }
  },
};
