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

export interface RevisitTag {
  taggedAt: string; // ISO date "YYYY-MM-DD"
  note?: string; // optional user note about why it was hard
}

export interface PracticeState {
  queueOrder: string[]; // ordered "patternId:problemId" keys
  queuePointer: number;
  todayBatchStart: number;
  lastBatchDate: string; // "YYYY-MM-DD"
  solves: Record<string, ProblemSolve>; // key: "patternId:problemId"
  skipped: string[];
  revisitKeys: Record<string, RevisitTag>; // key: "patternId:problemId"
}

export interface MultiSheetState {
  sheets: Record<string, PracticeSheet>; // keyed by sheet id
  activeSheetId: string; // currently active sheet ID
  statesBySheet: Record<string, PracticeState>; // independent progress per sheet
}

export type ViewTab = 'checklist' | 'calendar' | 'goals' | 'practice' | 'courses' | 'dashboard' | 'settings';

export type CoursePlatform = 'youtube-video' | 'youtube-playlist' | 'udemy' | 'coursera' | 'custom';

export interface CourseChapter {
  id: string; // unique chapter id e.g. "ch-1"
  title: string;
  category?: string; // module/section e.g. "1. CORE JAVA"
  description?: string; // what is taught in this section
  importance?: string; // e.g. "⭐ High", "🟡 Medium", "🔗 Prerequisite", "⭐ High 🎯"
  timestampSeconds: number; // start time in seconds
  durationSeconds?: number;
  completed: boolean;
  completedAt?: string; // YYYY-MM-DD
  notes?: string;
}

export interface CourseStudyGuide {
  mustWatch?: { range: string; topic: string; note: string }[];
  prerequisiteChain?: string;
  springBootRelevance?: Record<string, string>;
  canWatchQuickly?: { topic: string; timestamp: string; reason: string }[];
  recommendedOrder?: string[];
  topConcepts?: { topic: string; timestamp: string; note: string }[];
}

export interface Course {
  id: string; // unique slug
  title: string;
  instructor?: string;
  platform: CoursePlatform;
  url: string;
  videoId?: string; // YouTube 11-char ID
  playlistId?: string; // YouTube playlist ID
  thumbnail?: string;
  lastWatchedSeconds: number;
  totalDurationSeconds: number;
  linkedCategoryId: string; // daily checklist category to log progress to
  chapters: CourseChapter[];
  notes?: string;
  studyGuide?: CourseStudyGuide;
  createdAt: string; // ISO date
  updatedAt: string; // ISO date
}

export interface CourseStoreState {
  courses: Record<string, Course>;
  activeCourseId: string;
  courseOrder: string[];

  // Actions
  setActiveCourseId: (courseId: string) => void;
  addCourse: (course: Course) => void;
  updateCourse: (courseId: string, updates: Partial<Course>) => void;
  deleteCourse: (courseId: string) => void;
  updatePlaybackProgress: (courseId: string, seconds: number, totalDurationSeconds?: number) => void;
  toggleChapterCompleted: (courseId: string, chapterId: string, dateStr?: string) => void;
  markChapterCompleted: (courseId: string, chapterId: string, dateStr?: string) => void;
  importChaptersFromText: (courseId: string, rawText: string) => void;
  setCourseNotes: (courseId: string, notes: string) => void;
  resetCourseToOfficial: (courseId: string) => void;
}

