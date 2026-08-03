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
  date: string; // "YYYY-MM-DD"
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

export interface ProblemSeed {
  id: string; // e.g. "p1-11"
  number: number; // LeetCode problem number, e.g. 11
  title: string;
  slug: string;
  url: string;
}

export interface PatternSeed {
  id: string; // e.g. "p1"
  number: number;
  name: string;
  hasVideo: boolean;
  problems: ProblemSeed[];
}

export interface CategorySeed {
  id: string; // e.g. "two-pointer"
  roman: string; // "I"
  name: string;
  patterns: PatternSeed[];
}

export interface ProblemsFile {
  meta: {
    title: string;
    author: string;
    totalCategories: number;
    totalPatterns: number;
    totalProblemEntries: number;
    totalUniqueProblems: number;
    [key: string]: unknown;
  };
  categories: CategorySeed[];
}

export interface ProblemSolve {
  patternId: string; // e.g. "p1"
  problemNumber: number; // e.g. 11
  solvedAt: string; // ISO date "YYYY-MM-DD"
}

export interface PracticeState {
  queueOrder: string[]; // ordered "patternId:problemNumber" keys
  queuePointer: number; // current problem index
  todayBatchStart: number; // batch start index for today
  lastBatchDate: string; // "YYYY-MM-DD"
  solves: Record<string, ProblemSolve>; // key: "patternId:problemNumber"
  skipped: string[]; // skipped keys sent to back of queue
}

export type ViewTab = 'checklist' | 'calendar' | 'goals' | 'practice' | 'dashboard' | 'settings';
