import { create } from 'zustand';
import { Goal } from '../types';
import { appStorage } from '../lib/storage';

const STORAGE_KEY_GOALS = 'dt_goals_v1';

const SEED_GOALS: Goal[] = [
  {
    id: 'goal-leetcode-30',
    title: 'Solve 30 LeetCode Problems',
    type: 'monthly',
    categoryId: 'leetcode',
    targetValue: 30,
    currentValue: 0,
    startDate: new Date().toISOString(),
    endDate: new Date(Date.now() + 14 * 24 * 60 * 60 * 1000).toISOString(), // 14 days from now
    status: 'active',
  },
  {
    id: 'goal-exercise-10',
    title: 'Complete 10 Exercise Sessions',
    type: 'weekly',
    categoryId: 'exercise',
    targetValue: 10,
    currentValue: 0,
    startDate: new Date().toISOString(),
    endDate: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString(), // 7 days from now
    status: 'active',
  },
];

interface GoalStoreState {
  goals: Goal[];
  addGoal: (goal: Omit<Goal, 'id' | 'status'>) => void;
  updateGoal: (id: string, updates: Partial<Goal>) => void;
  deleteGoal: (id: string) => void;
  updateGoalProgress: (id: string, currentValue: number) => void;
  checkAndSyncGoalsProgress: (dayEntries: Record<string, any>) => void;
  setGoals: (goals: Goal[]) => void;
}

export const useGoalStore = create<GoalStoreState>((set, get) => {
  const initialGoals = appStorage.getItem<Goal[]>(STORAGE_KEY_GOALS, SEED_GOALS);

  return {
    goals: initialGoals,

    addGoal: (goalData) => {
      const { goals } = get();
      const newGoal: Goal = {
        ...goalData,
        id: `goal-${Date.now()}`,
        status: 'active',
      };
      const newGoals = [...goals, newGoal];
      appStorage.setItem(STORAGE_KEY_GOALS, newGoals);
      set({ goals: newGoals });
    },

    updateGoal: (id, updates) => {
      const { goals } = get();
      const newGoals = goals.map((g) => {
        if (g.id !== id) return g;
        const updated = { ...g, ...updates };

        // Auto transition status
        if (updated.currentValue >= updated.targetValue) {
          updated.status = 'completed';
        } else if (new Date(updated.endDate).getTime() < Date.now() && updated.status === 'active') {
          updated.status = 'failed';
        }
        return updated;
      });

      appStorage.setItem(STORAGE_KEY_GOALS, newGoals);
      set({ goals: newGoals });
    },

    deleteGoal: (id) => {
      const { goals } = get();
      const newGoals = goals.filter((g) => g.id !== id);
      appStorage.setItem(STORAGE_KEY_GOALS, newGoals);
      set({ goals: newGoals });
    },

    updateGoalProgress: (id, currentValue) => {
      const { goals } = get();
      const newGoals = goals.map((g) => {
        if (g.id !== id) return g;
        const status = currentValue >= g.targetValue ? 'completed' : g.status;
        return { ...g, currentValue, status };
      });
      appStorage.setItem(STORAGE_KEY_GOALS, newGoals);
      set({ goals: newGoals });
    },

    checkAndSyncGoalsProgress: (dayEntries) => {
      const { goals } = get();
      let changed = false;

      const newGoals = goals.map((goal) => {
        if (!goal.categoryId || goal.status !== 'active') return goal;

        const startDate = new Date(goal.startDate).getTime();
        const endDate = new Date(goal.endDate).getTime();
        const now = Date.now();

        // Calculate accumulated count from dayEntries between startDate and endDate
        let totalCount = 0;
        Object.values(dayEntries).forEach((entry: any) => {
          const entryTime = new Date(entry.date).getTime();
          if (entryTime >= startDate && entryTime <= endDate) {
            const task = entry.tasks?.[goal.categoryId!];
            if (task?.done) {
              totalCount += task.count ?? 1;
            }
          }
        });

        let newStatus: Goal['status'] = goal.status;
        if (totalCount >= goal.targetValue) {
          newStatus = 'completed';
        } else if (now > endDate && goal.status === 'active') {
          newStatus = 'failed';
        }

        if (totalCount !== goal.currentValue || newStatus !== goal.status) {
          changed = true;
          return {
            ...goal,
            currentValue: totalCount,
            status: newStatus,
          };
        }

        return goal;
      });

      if (changed) {
        appStorage.setItem(STORAGE_KEY_GOALS, newGoals);
        set({ goals: newGoals });
      }
    },

    setGoals: (newGoals) => {
      appStorage.setItem(STORAGE_KEY_GOALS, newGoals);
      set({ goals: newGoals });
    },
  };
});
