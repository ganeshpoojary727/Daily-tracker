import { create } from 'zustand';
import { Course, CourseStoreState } from '../types';
import { appStorage } from '../lib/storage';
import { getTodayStr } from '../lib/dateUtils';
import defaultCourseData from '../data/defaultCourse.json';
import { useTaskStore } from './useTaskStore';
import { parseTimestampsFromDescription } from '../lib/courseUtils';

const STORAGE_KEY_COURSES = 'dt_courses_v1';

const defaultCourse = defaultCourseData as Course;

interface StorageState {
  courses: Record<string, Course>;
  activeCourseId: string;
  courseOrder: string[];
}

function loadInitialCourseData(): StorageState {
  const stored = appStorage.getItem<StorageState | null>(STORAGE_KEY_COURSES, null);
  if (!stored || !stored.courses || Object.keys(stored.courses).length === 0) {
    return {
      courses: { [defaultCourse.id]: defaultCourse },
      activeCourseId: defaultCourse.id,
      courseOrder: [defaultCourse.id],
    };
  }

  // Ensure default course has the latest official syllabus while preserving user progress
  const existingDefault = stored.courses[defaultCourse.id];
  let mergedDefault = defaultCourse;
  if (existingDefault) {
    const completedMap = new Map(
      (existingDefault.chapters || []).map((ch) => [
        ch.id,
        { completed: ch.completed, completedAt: ch.completedAt, notes: ch.notes },
      ])
    );
    mergedDefault = {
      ...defaultCourse,
      lastWatchedSeconds: existingDefault.lastWatchedSeconds || defaultCourse.lastWatchedSeconds,
      chapters: defaultCourse.chapters.map((ch) => {
        const prev = completedMap.get(ch.id);
        return prev
          ? { ...ch, completed: prev.completed, completedAt: prev.completedAt, notes: prev.notes || ch.notes }
          : ch;
      }),
      updatedAt: defaultCourse.updatedAt,
    };
  }

  const mergedCourses = {
    ...stored.courses,
    [defaultCourse.id]: mergedDefault,
  };

  return {
    courses: mergedCourses,
    activeCourseId: stored.activeCourseId || defaultCourse.id,
    courseOrder:
      stored.courseOrder && stored.courseOrder.length > 0
        ? Array.from(new Set([defaultCourse.id, ...stored.courseOrder]))
        : [defaultCourse.id],
  };
}

export const useCourseStore = create<CourseStoreState>((set, get) => {
  const initial = loadInitialCourseData();

  const persist = (next: StorageState) => {
    appStorage.setItem(STORAGE_KEY_COURSES, next);
  };

  return {
    courses: initial.courses,
    activeCourseId: initial.activeCourseId,
    courseOrder: initial.courseOrder,

    setActiveCourseId: (courseId: string) => {
      const { courses, courseOrder } = get();
      if (!courses[courseId]) return;
      set({ activeCourseId: courseId });
      persist({ courses, activeCourseId: courseId, courseOrder });
    },

    addCourse: (course: Course) => {
      const { courses, courseOrder } = get();
      const updatedCourses = { ...courses, [course.id]: course };
      const updatedOrder = [course.id, ...courseOrder.filter((id) => id !== course.id)];
      set({ courses: updatedCourses, activeCourseId: course.id, courseOrder: updatedOrder });
      persist({ courses: updatedCourses, activeCourseId: course.id, courseOrder: updatedOrder });
    },

    updateCourse: (courseId: string, updates: Partial<Course>) => {
      const { courses, activeCourseId, courseOrder } = get();
      if (!courses[courseId]) return;
      const updatedCourse = { ...courses[courseId], ...updates, updatedAt: new Date().toISOString() };
      const updatedCourses = { ...courses, [courseId]: updatedCourse };
      set({ courses: updatedCourses });
      persist({ courses: updatedCourses, activeCourseId, courseOrder });
    },

    deleteCourse: (courseId: string) => {
      const { courses, activeCourseId, courseOrder } = get();
      const remainingOrder = courseOrder.filter((id) => id !== courseId);
      const remainingCourses = { ...courses };
      delete remainingCourses[courseId];

      const nextActiveId = activeCourseId === courseId ? remainingOrder[0] || '' : activeCourseId;
      set({ courses: remainingCourses, activeCourseId: nextActiveId, courseOrder: remainingOrder });
      persist({ courses: remainingCourses, activeCourseId: nextActiveId, courseOrder: remainingOrder });
    },

    updatePlaybackProgress: (courseId: string, seconds: number, totalDurationSeconds?: number) => {
      const { courses, activeCourseId, courseOrder } = get();
      const course = courses[courseId];
      if (!course) return;

      const updated: Course = {
        ...course,
        lastWatchedSeconds: Math.floor(seconds),
        totalDurationSeconds:
          totalDurationSeconds && totalDurationSeconds > 0
            ? Math.floor(totalDurationSeconds)
            : course.totalDurationSeconds,
        updatedAt: new Date().toISOString(),
      };
      const updatedCourses = { ...courses, [courseId]: updated };
      set({ courses: updatedCourses });
      persist({ courses: updatedCourses, activeCourseId, courseOrder });
    },

    toggleChapterCompleted: (courseId: string, chapterId: string, dateStr?: string) => {
      const { courses, activeCourseId, courseOrder } = get();
      const course = courses[courseId];
      if (!course) return;

      const today = dateStr || getTodayStr();
      let justCompleted = false;

      const updatedChapters = course.chapters.map((ch) => {
        if (ch.id === chapterId) {
          const nextCompleted = !ch.completed;
          if (nextCompleted) justCompleted = true;
          return {
            ...ch,
            completed: nextCompleted,
            completedAt: nextCompleted ? today : undefined,
          };
        }
        return ch;
      });

      if (justCompleted && course.linkedCategoryId) {
        useTaskStore.getState().incrementTaskCount(today, course.linkedCategoryId, 1);
      }

      const updatedCourse: Course = {
        ...course,
        chapters: updatedChapters,
        updatedAt: new Date().toISOString(),
      };

      const updatedCourses = { ...courses, [courseId]: updatedCourse };
      set({ courses: updatedCourses });
      persist({ courses: updatedCourses, activeCourseId, courseOrder });
    },

    markChapterCompleted: (courseId: string, chapterId: string, dateStr?: string) => {
      const { courses, activeCourseId, courseOrder } = get();
      const course = courses[courseId];
      if (!course) return;

      const target = course.chapters.find((ch) => ch.id === chapterId);
      if (!target || target.completed) return;

      const today = dateStr || getTodayStr();
      const updatedChapters = course.chapters.map((ch) => {
        if (ch.id === chapterId) {
          return {
            ...ch,
            completed: true,
            completedAt: today,
          };
        }
        return ch;
      });

      if (course.linkedCategoryId) {
        useTaskStore.getState().incrementTaskCount(today, course.linkedCategoryId, 1);
      }

      const updatedCourse: Course = {
        ...course,
        chapters: updatedChapters,
        updatedAt: new Date().toISOString(),
      };

      const updatedCourses = { ...courses, [courseId]: updatedCourse };
      set({ courses: updatedCourses });
      persist({ courses: updatedCourses, activeCourseId, courseOrder });
    },

    importChaptersFromText: (courseId: string, rawText: string) => {
      const { courses, activeCourseId, courseOrder } = get();
      const course = courses[courseId];
      if (!course) return;

      const parsed = parseTimestampsFromDescription(rawText);
      if (parsed.length === 0) return;

      const updatedCourse: Course = {
        ...course,
        chapters: parsed,
        updatedAt: new Date().toISOString(),
      };

      const updatedCourses = { ...courses, [courseId]: updatedCourse };
      set({ courses: updatedCourses });
      persist({ courses: updatedCourses, activeCourseId, courseOrder });
    },

    setCourseNotes: (courseId: string, notes: string) => {
      const { courses, activeCourseId, courseOrder } = get();
      const course = courses[courseId];
      if (!course) return;

      const updatedCourse: Course = {
        ...course,
        notes,
        updatedAt: new Date().toISOString(),
      };

      const updatedCourses = { ...courses, [courseId]: updatedCourse };
      set({ courses: updatedCourses });
      persist({ courses: updatedCourses, activeCourseId, courseOrder });
    },

    resetCourseToOfficial: (courseId: string) => {
      const { courses, activeCourseId, courseOrder } = get();
      if (courseId === defaultCourse.id) {
        const existing = courses[courseId];
        const completedMap = new Map(
          (existing?.chapters || []).map((ch) => [
            ch.id,
            { completed: ch.completed, completedAt: ch.completedAt, notes: ch.notes },
          ])
        );
        const refreshed: Course = {
          ...defaultCourse,
          lastWatchedSeconds: existing?.lastWatchedSeconds || 0,
          chapters: defaultCourse.chapters.map((ch) => {
            const prev = completedMap.get(ch.id);
            return prev
              ? { ...ch, completed: prev.completed, completedAt: prev.completedAt, notes: prev.notes || ch.notes }
              : ch;
          }),
          updatedAt: new Date().toISOString(),
        };
        const updatedCourses = { ...courses, [courseId]: refreshed };
        set({ courses: updatedCourses });
        persist({ courses: updatedCourses, activeCourseId, courseOrder });
      }
    },
  };
});
