import { create } from 'zustand';
import {
  DayOfWeek,
  ExerciseItem,
  WorkoutDayRoutine,
  DayWorkoutLog,
} from '../types/workout';
import { DEFAULT_WORKOUT_ROUTINE } from '../data/defaultWorkoutRoutine';
import { appStorage } from '../lib/storage';
import { useTaskStore } from './useTaskStore';

const STORAGE_KEY_ROUTINE = 'dt_workout_routine_v1';
const STORAGE_KEY_LOGS = 'dt_workout_logs_v1';
const STORAGE_KEY_SYNC = 'dt_workout_auto_sync_v1';

export function getDayOfWeekFromDate(dateStr?: string): DayOfWeek {
  const d = dateStr ? new Date(`${dateStr}T12:00:00`) : new Date();
  const dayIndex = d.getDay();
  const map: Record<number, DayOfWeek> = {
    0: 'sunday',
    1: 'monday',
    2: 'tuesday',
    3: 'wednesday',
    4: 'thursday',
    5: 'friday',
    6: 'saturday',
  };
  return map[dayIndex] || 'monday';
}

export function getTodayDateString(): string {
  const now = new Date();
  const year = now.getFullYear();
  const month = String(now.getMonth() + 1).padStart(2, '0');
  const day = String(now.getDate()).padStart(2, '0');
  return `${year}-${month}-${day}`;
}

interface RestTimerState {
  durationSeconds: number;
  remainingSeconds: number;
  isRunning: boolean;
}

interface WorkoutStoreState {
  routine: Record<DayOfWeek, WorkoutDayRoutine>;
  logs: Record<string, DayWorkoutLog>; // keyed by "YYYY-MM-DD"
  selectedDay: DayOfWeek;
  activeDate: string;
  autoSyncDailyChecklist: boolean;
  restTimer: RestTimerState;

  // Actions
  setSelectedDay: (day: DayOfWeek) => void;
  setActiveDate: (date: string) => void;
  toggleSet: (
    date: string,
    day: DayOfWeek,
    exerciseId: string,
    setIndex: number,
    reps?: string
  ) => void;
  logReps: (
    date: string,
    day: DayOfWeek,
    exerciseId: string,
    setIndex: number,
    reps: string
  ) => void;
  markExerciseAllSets: (
    date: string,
    day: DayOfWeek,
    exerciseId: string,
    targetSets: number,
    completed: boolean
  ) => void;
  addExercise: (
    day: DayOfWeek,
    exercise: Omit<ExerciseItem, 'id' | 'order'>
  ) => void;
  editExercise: (
    day: DayOfWeek,
    exerciseId: string,
    updates: Partial<ExerciseItem>
  ) => void;
  deleteExercise: (day: DayOfWeek, exerciseId: string) => void;
  resetDayToDefault: (day: DayOfWeek) => void;
  resetEntireRoutineToDefault: () => void;

  // Rest Timer Actions
  startRestTimer: (seconds?: number) => void;
  pauseRestTimer: () => void;
  resetRestTimer: () => void;
  tickRestTimer: () => void;

  // Daily Checklist Sync
  setAutoSyncDailyChecklist: (enabled: boolean) => void;
  syncWithDailyChecklist: (date: string) => void;
}

export const useWorkoutStore = create<WorkoutStoreState>((set, get) => {
  const initialRoutine = appStorage.getItem<Record<DayOfWeek, WorkoutDayRoutine>>(
    STORAGE_KEY_ROUTINE,
    DEFAULT_WORKOUT_ROUTINE
  );
  const initialLogs = appStorage.getItem<Record<string, DayWorkoutLog>>(
    STORAGE_KEY_LOGS,
    {}
  );
  const initialAutoSync = appStorage.getItem<boolean>(STORAGE_KEY_SYNC, true);
  const todayDate = getTodayDateString();
  const todayDayOfWeek = getDayOfWeekFromDate(todayDate);

  return {
    routine: initialRoutine,
    logs: initialLogs,
    selectedDay: todayDayOfWeek,
    activeDate: todayDate,
    autoSyncDailyChecklist: initialAutoSync,
    restTimer: {
      durationSeconds: 60,
      remainingSeconds: 60,
      isRunning: false,
    },

    setSelectedDay: (day) => {
      set({ selectedDay: day });
    },

    setActiveDate: (date) => {
      const day = getDayOfWeekFromDate(date);
      set({ activeDate: date, selectedDay: day });
    },

    toggleSet: (date, day, exerciseId, setIndex, reps) => {
      const { logs, routine, autoSyncDailyChecklist } = get();
      const currentLog: DayWorkoutLog = logs[date] || {
        date,
        dayOfWeek: day,
        exercises: {},
        completedAll: false,
      };

      const currentExLog = currentLog.exercises[exerciseId] || { sets: {} };
      const currentSetLog = currentExLog.sets[setIndex] || { completed: false };
      const nextCompleted = !currentSetLog.completed;

      const updatedSets = {
        ...currentExLog.sets,
        [setIndex]: {
          completed: nextCompleted,
          reps: reps !== undefined ? reps : currentSetLog.reps,
          timestamp: nextCompleted ? new Date().toISOString() : undefined,
        },
      };

      const updatedExercises = {
        ...currentLog.exercises,
        [exerciseId]: {
          ...currentExLog,
          sets: updatedSets,
        },
      };

      // Check if all exercises for this day are completed
      const dayRoutine = routine[day];
      let allDone = false;
      if (dayRoutine && dayRoutine.exercises.length > 0) {
        allDone = dayRoutine.exercises.every((ex) => {
          const exLog = updatedExercises[ex.id];
          if (!exLog) return false;
          let doneSets = 0;
          for (let i = 0; i < ex.targetSets; i++) {
            if (exLog.sets[i]?.completed) doneSets++;
          }
          return doneSets >= ex.targetSets;
        });
      }

      const updatedLog: DayWorkoutLog = {
        ...currentLog,
        exercises: updatedExercises,
        completedAll: allDone,
        completedAt: allDone ? new Date().toISOString() : undefined,
      };

      const newLogs = {
        ...logs,
        [date]: updatedLog,
      };

      appStorage.setItem(STORAGE_KEY_LOGS, newLogs);
      set({ logs: newLogs });

      // Automatically sync with daily checklist if configured
      if (autoSyncDailyChecklist && allDone) {
        get().syncWithDailyChecklist(date);
      }
    },

    logReps: (date, day, exerciseId, setIndex, reps) => {
      const { logs } = get();
      const currentLog: DayWorkoutLog = logs[date] || {
        date,
        dayOfWeek: day,
        exercises: {},
        completedAll: false,
      };
      const currentExLog = currentLog.exercises[exerciseId] || { sets: {} };
      const currentSetLog = currentExLog.sets[setIndex] || { completed: true };

      const updatedSets = {
        ...currentExLog.sets,
        [setIndex]: {
          ...currentSetLog,
          reps,
        },
      };

      const updatedExercises = {
        ...currentLog.exercises,
        [exerciseId]: {
          ...currentExLog,
          sets: updatedSets,
        },
      };

      const updatedLog: DayWorkoutLog = {
        ...currentLog,
        exercises: updatedExercises,
      };

      const newLogs = { ...logs, [date]: updatedLog };
      appStorage.setItem(STORAGE_KEY_LOGS, newLogs);
      set({ logs: newLogs });
    },

    markExerciseAllSets: (date, day, exerciseId, targetSets, completed) => {
      const { logs, routine, autoSyncDailyChecklist } = get();
      const currentLog: DayWorkoutLog = logs[date] || {
        date,
        dayOfWeek: day,
        exercises: {},
        completedAll: false,
      };

      const currentExLog = currentLog.exercises[exerciseId] || { sets: {} };
      const updatedSets = { ...currentExLog.sets };

      for (let i = 0; i < targetSets; i++) {
        updatedSets[i] = {
          completed,
          reps: updatedSets[i]?.reps,
          timestamp: completed ? new Date().toISOString() : undefined,
        };
      }

      const updatedExercises = {
        ...currentLog.exercises,
        [exerciseId]: {
          ...currentExLog,
          sets: updatedSets,
        },
      };

      const dayRoutine = routine[day];
      let allDone = false;
      if (dayRoutine && dayRoutine.exercises.length > 0) {
        allDone = dayRoutine.exercises.every((ex) => {
          const exLog = updatedExercises[ex.id];
          if (!exLog) return false;
          let doneSets = 0;
          for (let i = 0; i < ex.targetSets; i++) {
            if (exLog.sets[i]?.completed) doneSets++;
          }
          return doneSets >= ex.targetSets;
        });
      }

      const updatedLog: DayWorkoutLog = {
        ...currentLog,
        exercises: updatedExercises,
        completedAll: allDone,
        completedAt: allDone ? new Date().toISOString() : undefined,
      };

      const newLogs = { ...logs, [date]: updatedLog };
      appStorage.setItem(STORAGE_KEY_LOGS, newLogs);
      set({ logs: newLogs });

      if (autoSyncDailyChecklist && allDone) {
        get().syncWithDailyChecklist(date);
      }
    },

    addExercise: (day, exerciseData) => {
      const { routine } = get();
      const currentDayRoutine = routine[day];
      const maxOrder = currentDayRoutine.exercises.reduce(
        (max, e) => Math.max(max, e.order),
        0
      );

      const newExercise: ExerciseItem = {
        ...exerciseData,
        id: `ex-${day}-${Date.now()}`,
        order: maxOrder + 1,
      };

      const updatedDayRoutine: WorkoutDayRoutine = {
        ...currentDayRoutine,
        isRestDay: false,
        exercises: [...currentDayRoutine.exercises, newExercise],
      };

      const newRoutine = {
        ...routine,
        [day]: updatedDayRoutine,
      };

      appStorage.setItem(STORAGE_KEY_ROUTINE, newRoutine);
      set({ routine: newRoutine });
    },

    editExercise: (day, exerciseId, updates) => {
      const { routine } = get();
      const currentDayRoutine = routine[day];
      const updatedExercises = currentDayRoutine.exercises.map((ex) =>
        ex.id === exerciseId ? { ...ex, ...updates } : ex
      );

      const newRoutine = {
        ...routine,
        [day]: {
          ...currentDayRoutine,
          exercises: updatedExercises,
        },
      };

      appStorage.setItem(STORAGE_KEY_ROUTINE, newRoutine);
      set({ routine: newRoutine });
    },

    deleteExercise: (day, exerciseId) => {
      const { routine } = get();
      const currentDayRoutine = routine[day];
      const updatedExercises = currentDayRoutine.exercises.filter(
        (ex) => ex.id !== exerciseId
      );

      const newRoutine = {
        ...routine,
        [day]: {
          ...currentDayRoutine,
          exercises: updatedExercises,
        },
      };

      appStorage.setItem(STORAGE_KEY_ROUTINE, newRoutine);
      set({ routine: newRoutine });
    },

    resetDayToDefault: (day) => {
      const { routine } = get();
      const defaultDayRoutine = DEFAULT_WORKOUT_ROUTINE[day];
      const newRoutine = {
        ...routine,
        [day]: JSON.parse(JSON.stringify(defaultDayRoutine)),
      };
      appStorage.setItem(STORAGE_KEY_ROUTINE, newRoutine);
      set({ routine: newRoutine });
    },

    resetEntireRoutineToDefault: () => {
      const clonedDefault = JSON.parse(JSON.stringify(DEFAULT_WORKOUT_ROUTINE));
      appStorage.setItem(STORAGE_KEY_ROUTINE, clonedDefault);
      set({ routine: clonedDefault });
    },

    // Rest Timer
    startRestTimer: (seconds) => {
      set((state) => {
        const duration = seconds ?? state.restTimer.durationSeconds;
        return {
          restTimer: {
            durationSeconds: duration,
            remainingSeconds: duration,
            isRunning: true,
          },
        };
      });
    },

    pauseRestTimer: () => {
      set((state) => ({
        restTimer: {
          ...state.restTimer,
          isRunning: !state.restTimer.isRunning,
        },
      }));
    },

    resetRestTimer: () => {
      set((state) => ({
        restTimer: {
          ...state.restTimer,
          remainingSeconds: state.restTimer.durationSeconds,
          isRunning: false,
        },
      }));
    },

    tickRestTimer: () => {
      set((state) => {
        if (!state.restTimer.isRunning) return state;
        if (state.restTimer.remainingSeconds <= 1) {
          return {
            restTimer: {
              ...state.restTimer,
              remainingSeconds: 0,
              isRunning: false,
            },
          };
        }
        return {
          restTimer: {
            ...state.restTimer,
            remainingSeconds: state.restTimer.remainingSeconds - 1,
          },
        };
      });
    },

    setAutoSyncDailyChecklist: (enabled) => {
      appStorage.setItem(STORAGE_KEY_SYNC, enabled);
      set({ autoSyncDailyChecklist: enabled });
    },

    syncWithDailyChecklist: (date) => {
      try {
        const taskState = useTaskStore.getState();
        const currentEntry = taskState.dayEntries[date];
        const exerciseTask = currentEntry?.tasks?.['exercise'];

        if (!exerciseTask?.done) {
          taskState.toggleTask(date, 'exercise');
        }
      } catch (err) {
        console.warn('Could not auto-sync exercise with daily checklist:', err);
      }
    },
  };
});
