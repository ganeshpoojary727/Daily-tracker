export type DayOfWeek =
  | 'monday'
  | 'tuesday'
  | 'wednesday'
  | 'thursday'
  | 'friday'
  | 'saturday'
  | 'sunday';

export interface ExerciseItem {
  id: string;
  name: string;
  muscleGroup: string;
  targetSets: number;
  targetReps: string;
  tempoNote?: string;
  order: number;
}

export interface WorkoutDayRoutine {
  day: DayOfWeek;
  title: string;
  subtitle: string;
  estimatedMinutes: number;
  isRestDay: boolean;
  activityNote?: string;
  exercises: ExerciseItem[];
}

export interface SetLog {
  completed: boolean;
  reps?: string;
  timestamp?: string;
}

export interface ExerciseLog {
  sets: Record<number, SetLog>;
}

export interface DayWorkoutLog {
  date: string; // YYYY-MM-DD
  dayOfWeek: DayOfWeek;
  exercises: Record<string, ExerciseLog>;
  completedAll: boolean;
  completedAt?: string;
}
