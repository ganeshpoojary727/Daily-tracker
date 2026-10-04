/**
 * Centralized LocalStorage wrapper to abstract persistence operations.
 */

const memoryStore: Record<string, string> = {};

const isStorageAvailable = (): boolean => {
  try {
    return typeof window !== 'undefined' && typeof window.localStorage !== 'undefined';
  } catch {
    return false;
  }
};

export const appStorage = {
  getItem<T>(key: string, fallback: T): T {
    try {
      if (!isStorageAvailable()) {
        const memoryItem = memoryStore[key];
        return memoryItem !== undefined ? JSON.parse(memoryItem) : fallback;
      }
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
      const serialized = JSON.stringify(value);
      if (!isStorageAvailable()) {
        memoryStore[key] = serialized;
        return;
      }
      localStorage.setItem(key, serialized);
    } catch (error) {
      console.error(`[appStorage] Error writing key "${key}":`, error);
    }
  },

  removeItem(key: string): void {
    try {
      if (!isStorageAvailable()) {
        delete memoryStore[key];
        return;
      }
      localStorage.removeItem(key);
    } catch (error) {
      console.error(`[appStorage] Error removing key "${key}":`, error);
    }
  },

  clear(): void {
    try {
      if (!isStorageAvailable()) {
        Object.keys(memoryStore).forEach((k) => delete memoryStore[k]);
        return;
      }
      localStorage.clear();
    } catch (error) {
      console.error('[appStorage] Error clearing storage:', error);
    }
  },
};

