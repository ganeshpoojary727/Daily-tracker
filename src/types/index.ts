export interface Category {
  id: string;
  name: string;
  color: string; // hex
  icon: string; // lucide icon name
  dailyTarget?: number;
  unit?: string;
  archived: boolean;
  createdAt: string; // ISO date string
}

export interface DayTaskEntry {
  done: boolean;
  count?: number;
  note?: string;
}

export interface DayEntry {
  date: string; // YYYY-MM-DD
  tasks: Record<string, DayTaskEntry>;
}

export interface Goal {
  id: string;
  title: string;
  type: 'weekly' | 'monthly' | 'custom';
  categoryId?: string; // omit for manual-progress goals
  targetValue: number;
  currentValue: number;
  startDate: string; // ISO date string
  endDate: string; // ISO date string — drives countdown
  status: 'active' | 'completed' | 'failed';
}

export interface Settings {
  theme: 'light' | 'dark' | 'system';
  weekStartsOn: 'sunday' | 'monday';
  streakRule: 'any-category' | 'all-categories';
  dailyBatchSize: number; // default 5
  reminderTime?: string; // "HH:mm"
  githubSync?: {
    enabled: boolean;
    token?: string;
    gistId?: string;
    lastSyncedAt?: string;
  };
}

export interface SheetProblem {
  id: string; // unique within the sheet
  number?: number; // optional — LeetCode problem number, e.g. 11
  title: string;
  url?: string; // optional — hide "Open ↗" if absent
  notes?: string; // optional short hint/answer-context
}

export interface SheetPattern {
  id: string;
  number?: number;
  name: string; // e.g. "Converging" or "Profit & Loss"
  hasVideo?: boolean;
  problems: SheetProblem[];
}

export interface SheetCategory {
  id: string;
  roman?: string;
  name: string; // e.g. "Two Pointer Patterns" or "DBMS"
  patterns: SheetPattern[];
}

export interface PracticeSheet {
  id: string; // slug; generated from meta.title on import if not provided, must be unique across loaded sheets
  meta: {
    title: string;
    author?: string;
    source?: string;
    note?: string;
    totalCategories?: number;
    totalPatterns?: number;
    totalProblemEntries?: number;
    totalUniqueProblems?: number;
    [key: string]: unknown;
  };
  categories: SheetCategory[];
  linkedCategoryId: string; // daily task category ID, e.g. "leetcode" or "aptitude"
  isBuiltIn: boolean; // true for default DSA sheet; only non-built-in can be deleted
}

// Backward compatibility type aliases
export type ProblemSeed = SheetProblem;
export type PatternSeed = SheetPattern;
export type CategorySeed = SheetCategory;
export type ProblemsFile = PracticeSheet;

export interface ProblemSolve {
  patternId: string;
  problemId: string; // problem.id or problem.number as string
  problemNumber?: number; // optional numeric problem number if present
  solvedAt: string; // ISO date "YYYY-MM-DD"
}

export interface PracticeState {
  queueOrder: string[]; // ordered "patternId:problemId" keys
  queuePointer: number;
  todayBatchStart: number;
  lastBatchDate: string; // "YYYY-MM-DD"
  solves: Record<string, ProblemSolve>; // key: "patternId:problemId"
  skipped: string[];
}

export interface MultiSheetState {
  sheets: Record<string, PracticeSheet>; // keyed by sheet id
  activeSheetId: string; // currently active sheet ID
  statesBySheet: Record<string, PracticeState>; // independent progress per sheet
}

export type ViewTab = 'checklist' | 'calendar' | 'goals' | 'practice' | 'dashboard' | 'settings';

