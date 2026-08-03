import { create } from 'zustand';
import { Category, DayEntry } from '../types';
import { appStorage } from '../lib/storage';

const DEFAULT_CATEGORIES: Category[] = [
  {
    id: 'leetcode',
    name: 'LeetCode',
    color: '#4C9AFF',
    icon: 'Code2',
    dailyTarget: 5,
    unit: 'problems',
    archived: false,
    createdAt: new Date().toISOString(),
  },
  {
    id: 'java',
    name: 'Java Concept',
    color: '#9F7AEA',
    icon: 'BookOpen',
    dailyTarget: 1,
    unit: 'concept',
    archived: false,
    createdAt: new Date().toISOString(),
  },
  {
    id: 'aptitude',
    name: 'Aptitude',
    color: '#F6AD55',
    icon: 'Brain',
    dailyTarget: 5,
    unit: 'questions',
    archived: false,
    createdAt: new Date().toISOString(),
  },
  {
    id: 'personal-project',
    name: 'Personal Project',
    color: '#48BB78',
    icon: 'FolderGit2',
    dailyTarget: 1,
    unit: 'session',
    archived: false,
    createdAt: new Date().toISOString(),
  },
  {
    id: 'major-project',
    name: 'Major Project',
    color: '#F56565',
    icon: 'Layers',
    dailyTarget: 1,
    unit: 'session',
    archived: false,
    createdAt: new Date().toISOString(),
  },
  {
    id: 'exercise',
    name: 'Exercise',
    color: '#38B2AC',
    icon: 'Activity',
    dailyTarget: 1,
    unit: 'session',
    archived: false,
    createdAt: new Date().toISOString(),
  },
];

const STORAGE_KEY_CATEGORIES = 'dt_categories_v1';
const STORAGE_KEY_DAY_ENTRIES = 'dt_day_entries_v1';

interface TaskStoreState {
  categories: Category[];
  dayEntries: Record<string, DayEntry>; // key "YYYY-MM-DD"
  
  // Actions
  toggleTask: (date: string, categoryId: string, count?: number, note?: string) => void;
  updateTaskCount: (date: string, categoryId: string, count: number) => void;
  incrementTaskCount: (date: string, categoryId: string, incrementBy?: number) => void;
  decrementTaskCount: (date: string, categoryId: string, decrementBy?: number) => void;
  updateTaskNote: (date: string, categoryId: string, note: string) => void;
  
  addCategory: (category: Omit<Category, 'id' | 'archived' | 'createdAt'>) => void;
  updateCategory: (id: string, updates: Partial<Category>) => void;
  archiveCategory: (id: string) => void;
  unarchiveCategory: (id: string) => void;
  reorderCategories: (categories: Category[]) => void;

  setDayEntries: (entries: Record<string, DayEntry>) => void;
  setCategories: (categories: Category[]) => void;
}

export const useTaskStore = create<TaskStoreState>((set, get) => {
  // Initial storage retrieval with default fallback
  const initialCategories = appStorage.getItem<Category[]>(STORAGE_KEY_CATEGORIES, DEFAULT_CATEGORIES);
  const initialDayEntries = appStorage.getItem<Record<string, DayEntry>>(STORAGE_KEY_DAY_ENTRIES, {});

  return {
    categories: initialCategories,
    dayEntries: initialDayEntries,

    toggleTask: (date: string, categoryId: string, count?: number, note?: string) => {
      const { dayEntries, categories } = get();
      const currentEntry = dayEntries[date] || { date, tasks: {} };
      const currentTask = currentEntry.tasks[categoryId] || { done: false };

      const category = categories.find((c) => c.id === categoryId);
      const defaultTarget = category?.dailyTarget || 1;

      const newDone = !currentTask.done;
      const newCount = newDone ? count ?? currentTask.count ?? defaultTarget : undefined;

      const updatedEntry: DayEntry = {
        ...currentEntry,
        tasks: {
          ...currentEntry.tasks,
          [categoryId]: {
            done: newDone,
            count: newCount,
            note: note ?? currentTask.note,
          },
        },
      };

      const newDayEntries = {
        ...dayEntries,
        [date]: updatedEntry,
      };

      appStorage.setItem(STORAGE_KEY_DAY_ENTRIES, newDayEntries);
      set({ dayEntries: newDayEntries });
    },

    updateTaskCount: (date: string, categoryId: string, count: number) => {
      const { dayEntries } = get();
      const currentEntry = dayEntries[date] || { date, tasks: {} };
      const currentTask = currentEntry.tasks[categoryId] || { done: true };

      const updatedEntry: DayEntry = {
        ...currentEntry,
        tasks: {
          ...currentEntry.tasks,
          [categoryId]: {
            ...currentTask,
            done: count > 0 ? true : currentTask.done,
            count: count >= 0 ? count : 0,
          },
        },
      };

      const newDayEntries = {
        ...dayEntries,
        [date]: updatedEntry,
      };

      appStorage.setItem(STORAGE_KEY_DAY_ENTRIES, newDayEntries);
      set({ dayEntries: newDayEntries });
    },

    incrementTaskCount: (date: string, categoryId: string, incrementBy = 1) => {
      const { dayEntries } = get();
      const currentEntry = dayEntries[date] || { date, tasks: {} };
      const currentTask = currentEntry.tasks[categoryId] || { done: false, count: 0 };

      const existingCount = currentTask.count || 0;
      const newCount = existingCount + incrementBy;

      const updatedEntry: DayEntry = {
        ...currentEntry,
        tasks: {
          ...currentEntry.tasks,
          [categoryId]: {
            ...currentTask,
            done: true,
            count: newCount,
          },
        },
      };

      const newDayEntries = {
        ...dayEntries,
        [date]: updatedEntry,
      };

      appStorage.setItem(STORAGE_KEY_DAY_ENTRIES, newDayEntries);
      set({ dayEntries: newDayEntries });
    },

    decrementTaskCount: (date: string, categoryId: string, decrementBy = 1) => {
      const { dayEntries } = get();
      const currentEntry = dayEntries[date] || { date, tasks: {} };
      const currentTask = currentEntry.tasks[categoryId] || { done: false, count: 0 };

      const existingCount = currentTask.count || 0;
      const newCount = Math.max(0, existingCount - decrementBy);

      const updatedEntry: DayEntry = {
        ...currentEntry,
        tasks: {
          ...currentEntry.tasks,
          [categoryId]: {
            ...currentTask,
            done: newCount > 0,
            count: newCount,
          },
        },
      };

      const newDayEntries = {
        ...dayEntries,
        [date]: updatedEntry,
      };

      appStorage.setItem(STORAGE_KEY_DAY_ENTRIES, newDayEntries);
      set({ dayEntries: newDayEntries });
    },

    updateTaskNote: (date: string, categoryId: string, note: string) => {
      const { dayEntries } = get();
      const currentEntry = dayEntries[date] || { date, tasks: {} };
      const currentTask = currentEntry.tasks[categoryId] || { done: false };

      const updatedEntry: DayEntry = {
        ...currentEntry,
        tasks: {
          ...currentEntry.tasks,
          [categoryId]: {
            ...currentTask,
            note,
          },
        },
      };

      const newDayEntries = {
        ...dayEntries,
        [date]: updatedEntry,
      };

      appStorage.setItem(STORAGE_KEY_DAY_ENTRIES, newDayEntries);
      set({ dayEntries: newDayEntries });
    },

    addCategory: (catData) => {
      const { categories } = get();
      const id = catData.name.toLowerCase().replace(/[^a-z0-9]+/g, '-');
      const newCategory: Category = {
        ...catData,
        id: categories.some((c) => c.id === id) ? `${id}-${Date.now()}` : id,
        archived: false,
        createdAt: new Date().toISOString(),
      };

      const newCategories = [...categories, newCategory];
      appStorage.setItem(STORAGE_KEY_CATEGORIES, newCategories);
      set({ categories: newCategories });
    },

    updateCategory: (id, updates) => {
      const { categories } = get();
      const newCategories = categories.map((c) => (c.id === id ? { ...c, ...updates } : c));
      appStorage.setItem(STORAGE_KEY_CATEGORIES, newCategories);
      set({ categories: newCategories });
    },

    archiveCategory: (id) => {
      const { categories } = get();
      const newCategories = categories.map((c) => (c.id === id ? { ...c, archived: true } : c));
      appStorage.setItem(STORAGE_KEY_CATEGORIES, newCategories);
      set({ categories: newCategories });
    },

    unarchiveCategory: (id) => {
      const { categories } = get();
      const newCategories = categories.map((c) => (c.id === id ? { ...c, archived: false } : c));
      appStorage.setItem(STORAGE_KEY_CATEGORIES, newCategories);
      set({ categories: newCategories });
    },

    reorderCategories: (newCategories) => {
      appStorage.setItem(STORAGE_KEY_CATEGORIES, newCategories);
      set({ categories: newCategories });
    },

    setDayEntries: (newDayEntries) => {
      appStorage.setItem(STORAGE_KEY_DAY_ENTRIES, newDayEntries);
      set({ dayEntries: newDayEntries });
    },

    setCategories: (newCategories) => {
      appStorage.setItem(STORAGE_KEY_CATEGORIES, newCategories);
      set({ categories: newCategories });
    },
  };
});
