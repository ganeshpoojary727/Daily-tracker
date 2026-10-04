# Architectural Design Specification: Workout & Exercise Hub

**Date:** 2026-10-04  
**Author:** Pair Programming Assistant (Google DeepMind Antigravity)  
**Status:** Under Review (User Approval Gate)  

---

## 1. Executive Summary

This specification outlines the addition of a first-class **Workout / Exercise Tracker** to the Daily Tracker web application. Tailored for the user's specific 8–12 week bodyweight calisthenics routine (60 kg, 165 cm, no equipment, vegetarian, lean muscular & abs goal), the hub introduces:
1. **Navigation Entry:** A dedicated "Workout" tab in `Sidebar.tsx` with a `Dumbbell` icon and clean route in `App.tsx`.
2. **Weekly Day Switcher:** Automatic selection of today's workout with one-click navigation between Monday–Sunday.
3. **Interactive Set-by-Set Logging:** Check off individual sets (`Set 1 [✓]`, `Set 2 [✓]...`), record actual reps achieved, and review tempo guidance.
4. **Built-in Rest Countdown Timer:** 60s, 90s, and 120s timer with audio/visual completion alerts and auto-trigger option.
5. **Full CRUD on Any Day:** Ability to Add, Edit, and Delete exercises on any day of the week, plus "Reset to Default Routine".
6. **Progression Tips & Daily Checklist Integration:** Displays progression rules and automatically marks the "Exercise" task completed on the Daily Checklist when today's routine is finished.

---

## 2. Architecture & Data Model

### 2.1 Types (`src/types/workout.ts` or `src/types/index.ts`)

```typescript
export type DayOfWeek = 'monday' | 'tuesday' | 'wednesday' | 'thursday' | 'friday' | 'saturday' | 'sunday';

export interface ExerciseItem {
  id: string; // e.g. "ex-mon-pushups"
  name: string; // e.g. "Push-ups"
  muscleGroup: string; // e.g. "Chest / Shoulders / Triceps"
  targetSets: number; // e.g. 4
  targetReps: string; // e.g. "8–15" or "20–40 sec" or "2 rounds"
  tempoNote?: string; // e.g. "3 seconds going down"
  order: number;
}

export interface WorkoutDayRoutine {
  day: DayOfWeek;
  title: string; // e.g. "Upper Body A + Abs"
  subtitle: string; // e.g. "Chest / Shoulders / Triceps + Back / Biceps + Abs"
  estimatedMinutes: number; // e.g. 45-55
  isRestDay: boolean;
  activityNote?: string; // e.g. "20–40 min walking + light stretching"
  exercises: ExerciseItem[];
}

export interface SetLog {
  completed: boolean;
  reps?: number | string;
  timestamp?: string;
}

export interface ExerciseLog {
  sets: Record<number, SetLog>; // set index 0..targetSets-1
}

export interface DayWorkoutLog {
  date: string; // "YYYY-MM-DD"
  dayOfWeek: DayOfWeek;
  exercises: Record<string, ExerciseLog>; // exerciseId -> ExerciseLog
  completedAll: boolean;
  completedAt?: string;
}
```

### 2.2 Store Architecture (`src/store/useWorkoutStore.ts`)

A dedicated Zustand store with LocalStorage persistence under key `'dt_workout_tracker_data'`:
- **State:**
  - `routine`: Record<DayOfWeek, WorkoutDayRoutine> (preloaded with user's 7-day routine)
  - `logs`: Record<string, DayWorkoutLog> (keyed by date string `YYYY-MM-DD`)
  - `selectedDay`: DayOfWeek (defaults to today's current day of the week)
  - `activeDate`: string (defaults to today `YYYY-MM-DD`)
  - `restTimer`: { duration: number; remaining: number; isRunning: boolean }
  - `autoSyncDailyChecklist`: boolean (defaults to `true`)
- **Actions:**
  - `setSelectedDay(day: DayOfWeek)`
  - `toggleSet(date: string, exerciseId: string, setIndex: number, reps?: string)`
  - `logReps(date: string, exerciseId: string, setIndex: number, reps: string)`
  - `markExerciseAllSets(date: string, exerciseId: string, targetSets: number, completed: boolean)`
  - `addExercise(day: DayOfWeek, exercise: Omit<ExerciseItem, 'id' | 'order'>)`
  - `editExercise(day: DayOfWeek, exerciseId: string, updates: Partial<ExerciseItem>)`
  - `deleteExercise(day: DayOfWeek, exerciseId: string)`
  - `reorderExercises(day: DayOfWeek, exercises: ExerciseItem[])`
  - `resetDayToDefault(day: DayOfWeek)`
  - `resetEntireRoutineToDefault()`
  - `startRestTimer(seconds: number)`
  - `pauseRestTimer()`
  - `resetRestTimer()`
  - `tickRestTimer()`

---

## 3. Component Hierarchy

```
src/components/workout/
├── WorkoutHubView.tsx            # Main workout screen container
├── WeeklyDayBar.tsx              # Mon-Sun pills with "Today" badge and progress dots
├── RestTimerWidget.tsx           # Floating or embedded 60s/90s/120s timer with progress ring
├── ExerciseGroupSection.tsx      # Grouping by muscle group (Chest, Back, Abs, etc.)
├── ExerciseCard.tsx              # Single exercise: target sets x reps, set check badges, tempo
├── ExerciseModal.tsx             # Reusable Add / Edit exercise modal form
├── ProgressionBanner.tsx         # Progression rule visual banner (Reps -> Tempo -> Variation)
└── RestDayView.tsx               # Dedicated clean view for Wed/Sat/Sun active recovery
```

---

## 4. UI/UX Flow & Key Interactions

1. **Automatic Today Detection:**
   When the user opens the "Workout" tab, it inspects today's day of week (e.g. Monday) and immediately loads the Monday schedule.
2. **Day Switching:**
   Clicking any day tab (e.g., "Thursday") allows the user to inspect what's coming, log a missed workout, or adjust Thursday's exercises in advance.
3. **Checking Off Sets:**
   Clicking `Set 1`, `Set 2`, etc. toggles the set checkmark with satisfying haptic/visual animation. If Rest Timer is active, it prompts or auto-starts the timer.
4. **Adding/Editing an Exercise:**
   Clicking "+ Add Exercise" or the pencil icon opens `ExerciseModal.tsx`. Supports specifying Muscle Group, Title, Target Sets, Target Rep Range, and Tempo Note.
5. **Deleting an Exercise:**
   Trash icon with confirmation prompt to prevent accidental deletions.
6. **Daily Checklist Sync:**
   Once all target exercises for today are checked off (or via a quick "Finish Workout" button), the store automatically calls `useTaskStore.getState().toggleTask(todayDate, 'exercise')` to mark the daily exercise habit as done!

---

## 5. Pre-Loaded Default Calisthenics Routine

- **Monday (Upper Body A + Abs):**
  - Push-ups (4 × 8–15)
  - Pike push-ups (3 × 6–12)
  - Diamond push-ups (3 × 6–12)
  - Slow push-ups [3s down] (2 × 8–12)
  - Prone Y-T-W (2 rounds × 8 each)
  - Self-resisted biceps curls (3 × 10–15/arm)
  - Reverse crunches (3 × 12–20)
  - Hollow-body hold (3 × 20–40 sec)
  - Plank (2 × 45–60 sec)
- **Tuesday (Legs + Core):**
  - Bulgarian split squats (4 × 8–15/leg)
  - Slow squats [3s down] (3 × 15–25)
  - Reverse lunges (3 × 10–15/leg)
  - Single-leg glute bridge (3 × 12–20/leg)
  - Single-leg calf raises (4 × 15–25/leg)
  - Leg raises (3 × 8–15)
  - Reverse crunches (3 × 12–20)
  - Side plank (2 × 30–45 sec/side)
- **Wednesday (Active Recovery / Rest):**
  - 20–40 min walking + light stretching
- **Thursday (Upper Body B + Abs):**
  - Decline push-ups (4 × 6–12)
  - Wide push-ups (3 × 10–15)
  - Pike push-ups (3 × 8–12)
  - Close-grip push-ups (3 × 8–15)
  - Reverse snow angels (3 × 10–15)
  - Superman hold (2 × 20–40 sec)
  - Self-resisted biceps curls (3 × 10–15/arm)
  - Bicycle crunches (3 × 16–24)
  - Leg raises (3 × 8–15)
  - Hollow hold (2 × 20–40 sec)
- **Friday (Legs + Abs):**
  - Bulgarian split squats (3 × 10–15/leg)
  - Tempo squats (3 × 15–25)
  - Reverse lunges (3 × 12/leg)
  - Single-leg glute bridges (3 × 15–20/leg)
  - Wall sit (2 × 45–90 sec)
  - Single-leg calf raises (4 × 15–25)
  - Core Finisher 3 Rounds: Mountain climbers × 20, Reverse crunches × 12, Plank × 30–45s, Bicycle crunches × 20 (60–90s rest)
- **Saturday (Light Activity):**
  - 30–45 min walking or 20–30 min easy cycling or sport
- **Sunday (Complete Rest):**
  - Full rest, high protein nutrition, recovery

---

## 6. Verification & Safety Plan

1. **TypeScript Verification:** Zero compilation errors (`npm run build`).
2. **Local Storage Integrity:** Verify routine customizations persist across reloads.
3. **Data Protection:** Include a "Reset to Default" button so user can always restore the original 8–12 week program.
4. **Responsive Layout:** Ensure workout cards and timer collapse gracefully on mobile screens.
