import { Category, Course, CourseChapter, DayEntry, DayTaskEntry, Goal, PracticeState } from '../types';
import { GistSyncData } from './githubSync';

/**
 * Merges local and remote day entries non-destructively.
 * - Dates unique to local or remote are preserved.
 * - Dates present in both union tasks by categoryId.
 * - Done status is true if marked done on either side.
 * - Count is the maximum count or falls back to 1 if done.
 * - Notes prefer local, falling back to remote.
 */
export function mergeDayEntries(
  local: Record<string, DayEntry>,
  remote: Record<string, DayEntry>
): Record<string, DayEntry> {
  const merged: Record<string, DayEntry> = {};
  const allDates = new Set([...Object.keys(local || {}), ...Object.keys(remote || {})]);

  for (const date of allDates) {
    const localEntry = local?.[date];
    const remoteEntry = remote?.[date];

    if (localEntry && !remoteEntry) {
      merged[date] = { ...localEntry, tasks: { ...localEntry.tasks } };
      continue;
    }

    if (!localEntry && remoteEntry) {
      merged[date] = { ...remoteEntry, tasks: { ...remoteEntry.tasks } };
      continue;
    }

    if (localEntry && remoteEntry) {
      const mergedTasks: Record<string, DayTaskEntry> = {};
      const allCategoryIds = new Set([
        ...Object.keys(localEntry.tasks || {}),
        ...Object.keys(remoteEntry.tasks || {}),
      ]);

      for (const catId of allCategoryIds) {
        const localTask = localEntry.tasks?.[catId];
        const remoteTask = remoteEntry.tasks?.[catId];

        if (localTask && !remoteTask) {
          mergedTasks[catId] = { ...localTask };
        } else if (!localTask && remoteTask) {
          mergedTasks[catId] = { ...remoteTask };
        } else if (localTask && remoteTask) {
          const done = Boolean(localTask.done || remoteTask.done);
          const maxCount = Math.max(localTask.count || 0, remoteTask.count || 0);
          const count = maxCount || (done ? 1 : undefined);
          const note = localTask.note || remoteTask.note || undefined;

          mergedTasks[catId] = {
            done,
            ...(count !== undefined ? { count } : {}),
            ...(note !== undefined ? { note } : {}),
          };
        }
      }

      merged[date] = {
        date,
        tasks: mergedTasks,
      };
    }
  }

  return merged;
}

/**
 * Merges local and remote categories.
 * - Preserves local order.
 * - Appends categories present in remote but not in local.
 * - For categories in both, preserves local properties.
 */
export function mergeCategories(local: Category[], remote: Category[]): Category[] {
  const localList = Array.isArray(local) ? local : [];
  const remoteList = Array.isArray(remote) ? remote : [];

  const localIds = new Set(localList.map((c) => c.id));
  const result: Category[] = localList.map((c) => ({ ...c }));

  for (const cat of remoteList) {
    if (!localIds.has(cat.id)) {
      result.push({ ...cat });
      localIds.add(cat.id);
    }
  }

  return result;
}

/**
 * Chooses the winning goal when a goal exists on both sides.
 * Prioritizes completed status, higher currentValue, then progression status.
 */
function chooseGoal(localGoal: Goal, remoteGoal: Goal): Goal {
  if (localGoal.status === 'completed' && remoteGoal.status !== 'completed') {
    return { ...localGoal };
  }
  if (remoteGoal.status === 'completed' && localGoal.status !== 'completed') {
    return { ...remoteGoal };
  }

  if (remoteGoal.currentValue > localGoal.currentValue) {
    return { ...remoteGoal };
  }
  if (localGoal.currentValue > remoteGoal.currentValue) {
    return { ...localGoal };
  }

  const statusRank: Record<Goal['status'], number> = {
    completed: 2,
    failed: 1,
    active: 0,
  };

  const remoteRank = statusRank[remoteGoal.status] ?? 0;
  const localRank = statusRank[localGoal.status] ?? 0;

  if (remoteRank > localRank) {
    return { ...remoteGoal };
  }

  return { ...localGoal };
}

/**
 * Merges local and remote goals.
 * - Unions by goal id.
 * - If both exist, chooses the one with higher currentValue or latest status.
 * - Preserves local goal order and appends remote-only goals.
 */
export function mergeGoals(local: Goal[], remote: Goal[]): Goal[] {
  const localList = Array.isArray(local) ? local : [];
  const remoteList = Array.isArray(remote) ? remote : [];

  const remoteMap = new Map<string, Goal>(remoteList.map((g) => [g.id, g]));
  const seenIds = new Set<string>();
  const result: Goal[] = [];

  for (const localGoal of localList) {
    seenIds.add(localGoal.id);
    const remoteGoal = remoteMap.get(localGoal.id);
    if (remoteGoal) {
      result.push(chooseGoal(localGoal, remoteGoal));
    } else {
      result.push({ ...localGoal });
    }
  }

  for (const remoteGoal of remoteList) {
    if (!seenIds.has(remoteGoal.id)) {
      result.push({ ...remoteGoal });
      seenIds.add(remoteGoal.id);
    }
  }

  return result;
}

/**
 * Merges practice states per sheet.
 * - Unions solves dictionary across both sides.
 * - Preserves the furthest queuePointer.
 * - Unions skipped problems.
 */
export function mergePracticeStates(
  local: Record<string, PracticeState>,
  remote: Record<string, PracticeState>
): Record<string, PracticeState> {
  const merged: Record<string, PracticeState> = {};
  const allSheetIds = new Set([
    ...Object.keys(local || {}),
    ...Object.keys(remote || {}),
  ]);

  for (const sheetId of allSheetIds) {
    const localState = local?.[sheetId];
    const remoteState = remote?.[sheetId];

    if (localState && !remoteState) {
      merged[sheetId] = {
        ...localState,
        solves: { ...localState.solves },
        skipped: [...(localState.skipped || [])],
        queueOrder: [...(localState.queueOrder || [])],
      };
      continue;
    }

    if (!localState && remoteState) {
      merged[sheetId] = {
        ...remoteState,
        solves: { ...remoteState.solves },
        skipped: [...(remoteState.skipped || [])],
        queueOrder: [...(remoteState.queueOrder || [])],
      };
      continue;
    }

    if (localState && remoteState) {
      const mergedSolves = {
        ...remoteState.solves,
        ...localState.solves,
      };

      const queuePointer = Math.max(localState.queuePointer || 0, remoteState.queuePointer || 0);

      const skipped = Array.from(
        new Set([...(localState.skipped || []), ...(remoteState.skipped || [])])
      );

      const queueOrder =
        localState.queueOrder && localState.queueOrder.length > 0
          ? [...localState.queueOrder]
          : [...(remoteState.queueOrder || [])];

      const isRemoteDateNewer = (remoteState.lastBatchDate || '') > (localState.lastBatchDate || '');
      const lastBatchDate = isRemoteDateNewer
        ? remoteState.lastBatchDate
        : localState.lastBatchDate || remoteState.lastBatchDate;
      const todayBatchStart = isRemoteDateNewer
        ? remoteState.todayBatchStart
        : localState.todayBatchStart ?? remoteState.todayBatchStart ?? 0;

      // Merge revisitKeys (union of both sides)
      const localRevisit = localState.revisitKeys || {};
      const remoteRevisit = remoteState.revisitKeys || {};
      const mergedRevisit: Record<string, { taggedAt: string; note?: string }> = { ...localRevisit };
      for (const [rKey, rTag] of Object.entries(remoteRevisit)) {
        if (!mergedRevisit[rKey]) {
          mergedRevisit[rKey] = rTag;
        }
        // If both sides tagged, keep the one already there (local wins)
      }

      merged[sheetId] = {
        queueOrder,
        queuePointer,
        todayBatchStart,
        lastBatchDate,
        solves: mergedSolves,
        skipped,
        revisitKeys: mergedRevisit,
      };
    }
  }

  return merged;
}

function extractTaskParts(tasks: unknown): {
  categories: Category[];
  dayEntries: Record<string, DayEntry>;
} {
  if (!tasks || typeof tasks !== 'object') {
    return { categories: [], dayEntries: {} };
  }
  const t = tasks as Record<string, any>;
  if ('categories' in t || 'dayEntries' in t) {
    return {
      categories: Array.isArray(t.categories) ? t.categories : [],
      dayEntries: t.dayEntries && typeof t.dayEntries === 'object' ? t.dayEntries : {},
    };
  }
  return {
    categories: [],
    dayEntries: t as Record<string, DayEntry>,
  };
}

function extractPracticeParts(practice: unknown): {
  sheets: Record<string, any>;
  activeSheetId: string;
  statesBySheet: Record<string, PracticeState>;
} {
  if (!practice || typeof practice !== 'object') {
    return { sheets: {}, activeSheetId: 'dsa-pattern-sheet', statesBySheet: {} };
  }
  const p = practice as Record<string, any>;
  if ('statesBySheet' in p && typeof p.statesBySheet === 'object' && p.statesBySheet !== null) {
    return {
      sheets: p.sheets && typeof p.sheets === 'object' ? p.sheets : {},
      activeSheetId: p.activeSheetId || 'dsa-pattern-sheet',
      statesBySheet: p.statesBySheet as Record<string, PracticeState>,
    };
  }
  if ('solves' in p || 'queueOrder' in p) {
    return {
      sheets: {},
      activeSheetId: 'dsa-pattern-sheet',
      statesBySheet: {
        'dsa-pattern-sheet': p as PracticeState,
      },
    };
  }
  return {
    sheets: {},
    activeSheetId: 'dsa-pattern-sheet',
    statesBySheet: {},
  };
}

function mergeSettings(localSettings: unknown, remoteSettings: unknown): unknown {
  const localObj = (localSettings && typeof localSettings === 'object' ? localSettings : {}) as Record<string, any>;
  const remoteObj = (remoteSettings && typeof remoteSettings === 'object' ? remoteSettings : {}) as Record<string, any>;

  return {
    ...remoteObj,
    ...localObj,
    githubSync: {
      ...(remoteObj.githubSync || {}),
      ...(localObj.githubSync || {}),
    },
  };
}

/**
 * Orchestrates full merging of GistSyncData snapshots.
 * Returns merged sync data with a fresh updatedAt timestamp.
 */
export function mergeSyncData(local: GistSyncData, remote: GistSyncData): GistSyncData {
  const localTaskParts = extractTaskParts(local?.tasks);
  const remoteTaskParts = extractTaskParts(remote?.tasks);

  const mergedCategories = mergeCategories(localTaskParts.categories, remoteTaskParts.categories);
  const mergedDayEntries = mergeDayEntries(localTaskParts.dayEntries, remoteTaskParts.dayEntries);

  const localGoals: Goal[] = Array.isArray(local?.goals) ? local.goals : [];
  const remoteGoals: Goal[] = Array.isArray(remote?.goals) ? remote.goals : [];
  const mergedGoals = mergeGoals(localGoals, remoteGoals);

  const localPractice = extractPracticeParts(local?.practice);
  const remotePractice = extractPracticeParts(remote?.practice);

  const mergedSheets = {
    ...remotePractice.sheets,
    ...localPractice.sheets,
  };
  const mergedStatesBySheet = mergePracticeStates(
    localPractice.statesBySheet,
    remotePractice.statesBySheet
  );
  const activeSheetId = localPractice.activeSheetId || remotePractice.activeSheetId || 'dsa-pattern-sheet';

  const mergedPractice = {
    sheets: mergedSheets,
    activeSheetId,
    statesBySheet: mergedStatesBySheet,
  };

  const mergedSettings = mergeSettings(local?.settings, remote?.settings);
  const mergedCourses = mergeCourses(local?.courses, remote?.courses);

  return {
    tasks: {
      categories: mergedCategories,
      dayEntries: mergedDayEntries,
    },
    goals: mergedGoals,
    practice: mergedPractice,
    courses: mergedCourses,
    settings: mergedSettings,
    updatedAt: new Date().toISOString(),
  };
}

function extractCourseParts(coursesData: unknown): {
  courses: Record<string, Course>;
  activeCourseId: string;
  courseOrder: string[];
} {
  if (!coursesData || typeof coursesData !== 'object') {
    return { courses: {}, activeCourseId: '', courseOrder: [] };
  }
  const c = coursesData as any;
  return {
    courses: c.courses && typeof c.courses === 'object' ? c.courses : {},
    activeCourseId: c.activeCourseId || '',
    courseOrder: Array.isArray(c.courseOrder) ? c.courseOrder : [],
  };
}

export function mergeCourses(
  localCoursesData: unknown,
  remoteCoursesData: unknown
): { courses: Record<string, Course>; activeCourseId: string; courseOrder: string[] } {
  const local = extractCourseParts(localCoursesData);
  const remote = extractCourseParts(remoteCoursesData);

  const mergedCourses: Record<string, Course> = {};
  const allIds = new Set([...Object.keys(local.courses), ...Object.keys(remote.courses)]);

  for (const id of allIds) {
    const l = local.courses[id];
    const r = remote.courses[id];
    if (l && !r) {
      mergedCourses[id] = { ...l };
    } else if (!l && r) {
      mergedCourses[id] = { ...r };
    } else if (l && r) {
      // Pick higher watch progress
      const lastWatchedSeconds = Math.max(l.lastWatchedSeconds || 0, r.lastWatchedSeconds || 0);

      // Union chapters
      const chapterMap = new Map<string, CourseChapter>();
      (r.chapters || []).forEach((ch) => chapterMap.set(ch.id, { ...ch }));
      (l.chapters || []).forEach((ch) => {
        const existing = chapterMap.get(ch.id);
        if (existing) {
          chapterMap.set(ch.id, {
            ...existing,
            ...ch,
            completed: Boolean(existing.completed || ch.completed),
            notes: ch.notes || existing.notes,
          });
        } else {
          chapterMap.set(ch.id, { ...ch });
        }
      });

      mergedCourses[id] = {
        ...r,
        ...l,
        lastWatchedSeconds,
        chapters: Array.from(chapterMap.values()),
        notes: l.notes || r.notes,
      };
    }
  }

  const courseOrder = Array.from(new Set([...local.courseOrder, ...remote.courseOrder])).filter(
    (id) => mergedCourses[id]
  );
  const activeCourseId =
    local.activeCourseId && mergedCourses[local.activeCourseId]
      ? local.activeCourseId
      : remote.activeCourseId && mergedCourses[remote.activeCourseId]
      ? remote.activeCourseId
      : courseOrder[0] || '';

  return { courses: mergedCourses, activeCourseId, courseOrder };
}

