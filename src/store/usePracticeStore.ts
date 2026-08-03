import { create } from 'zustand';
import { PracticeState, ProblemSolve, ProblemsFile } from '../types';
import { appStorage } from '../lib/storage';
import { flattenProblems } from '../lib/problemUtils';
import { getTodayStr } from '../lib/dateUtils';
import rawProblemsData from '../data/problems.json';

const STORAGE_KEY_PRACTICE = 'dt_practice_v1';
const problemsData = rawProblemsData as unknown as ProblemsFile;

// Build default initial queue order from problems.json
const defaultFlattened = flattenProblems(problemsData);
const defaultQueueOrder = defaultFlattened.map((item) => item.key);

const DEFAULT_PRACTICE_STATE: PracticeState = {
  queueOrder: defaultQueueOrder,
  queuePointer: 0,
  todayBatchStart: 0,
  lastBatchDate: getTodayStr(),
  solves: {},
  skipped: [],
};

interface PracticeStoreState extends PracticeState {
  problemsData: ProblemsFile;
  markCurrentSolved: (dateStr?: string) => string | null; // returns solved key
  skipCurrent: () => void;
  jumpToKey: (key: string) => void;
  shuffleRemaining: () => void;
  resetQueue: () => void;
  checkBatchReset: () => void;
  setPracticeState: (state: PracticeState) => void;
}

export const usePracticeStore = create<PracticeStoreState>((set, get) => {
  const storedState = appStorage.getItem<PracticeState>(STORAGE_KEY_PRACTICE, DEFAULT_PRACTICE_STATE);
  
  // Ensure queue order contains all keys from problems.json if schema updated
  let validQueueOrder = storedState.queueOrder || defaultQueueOrder;
  if (!validQueueOrder || validQueueOrder.length === 0) {
    validQueueOrder = defaultQueueOrder;
  }

  const initialState: PracticeState = {
    ...DEFAULT_PRACTICE_STATE,
    ...storedState,
    queueOrder: validQueueOrder,
  };

  return {
    ...initialState,
    problemsData,

    checkBatchReset: () => {
      const { lastBatchDate, queuePointer } = get();
      const today = getTodayStr();
      if (lastBatchDate !== today) {
        const updated = {
          lastBatchDate: today,
          todayBatchStart: queuePointer,
        };
        set(updated);
        appStorage.setItem(STORAGE_KEY_PRACTICE, { ...get(), ...updated });
      }
    },

    markCurrentSolved: (dateStr) => {
      const { queueOrder, queuePointer, solves } = get();
      if (queuePointer >= queueOrder.length) return null;

      const solvedKey = queueOrder[queuePointer];
      const [patternId, problemNumStr] = solvedKey.split(':');
      const problemNumber = parseInt(problemNumStr, 10);
      const solvedAt = dateStr || getTodayStr();

      const newSolves: Record<string, ProblemSolve> = {
        ...solves,
        [solvedKey]: {
          patternId,
          problemNumber,
          solvedAt,
        },
      };

      const nextPointer = queuePointer + 1;

      const newState = {
        solves: newSolves,
        queuePointer: nextPointer,
      };

      set(newState);
      const fullState = {
        queueOrder: get().queueOrder,
        queuePointer: nextPointer,
        todayBatchStart: get().todayBatchStart,
        lastBatchDate: get().lastBatchDate,
        solves: newSolves,
        skipped: get().skipped,
      };
      appStorage.setItem(STORAGE_KEY_PRACTICE, fullState);

      return solvedKey;
    },

    skipCurrent: () => {
      const { queueOrder, queuePointer, skipped } = get();
      if (queuePointer >= queueOrder.length) return;

      const currentKey = queueOrder[queuePointer];
      // Append current key to back of queue
      const newQueueOrder = [...queueOrder, currentKey];
      const newSkipped = [...skipped, currentKey];
      const nextPointer = queuePointer + 1;

      const newState = {
        queueOrder: newQueueOrder,
        queuePointer: nextPointer,
        skipped: newSkipped,
      };

      set(newState);
      appStorage.setItem(STORAGE_KEY_PRACTICE, {
        queueOrder: newQueueOrder,
        queuePointer: nextPointer,
        todayBatchStart: get().todayBatchStart,
        lastBatchDate: get().lastBatchDate,
        solves: get().solves,
        skipped: newSkipped,
      });
    },

    jumpToKey: (key: string) => {
      const { queueOrder } = get();
      let index = queueOrder.indexOf(key);

      // If key is not in queueOrder (e.g. already solved in past or skipped), insert it at current position
      if (index === -1) {
        index = get().queuePointer;
        const newQueueOrder = [...queueOrder];
        newQueueOrder.splice(index, 0, key);
        set({ queueOrder: newQueueOrder, queuePointer: index });
        appStorage.setItem(STORAGE_KEY_PRACTICE, {
          queueOrder: newQueueOrder,
          queuePointer: index,
          todayBatchStart: get().todayBatchStart,
          lastBatchDate: get().lastBatchDate,
          solves: get().solves,
          skipped: get().skipped,
        });
        return;
      }

      set({ queuePointer: index });
      appStorage.setItem(STORAGE_KEY_PRACTICE, { ...get(), queuePointer: index });
    },

    shuffleRemaining: () => {
      const { queueOrder, queuePointer } = get();
      const donePortion = queueOrder.slice(0, queuePointer);
      const remainingPortion = queueOrder.slice(queuePointer);

      // Fisher-Yates shuffle remaining
      for (let i = remainingPortion.length - 1; i > 0; i--) {
        const j = Math.floor(Math.random() * (i + 1));
        [remainingPortion[i], remainingPortion[j]] = [remainingPortion[j], remainingPortion[i]];
      }

      const newQueueOrder = [...donePortion, ...remainingPortion];
      set({ queueOrder: newQueueOrder });
      appStorage.setItem(STORAGE_KEY_PRACTICE, { ...get(), queueOrder: newQueueOrder });
    },

    resetQueue: () => {
      const resetState: PracticeState = {
        queueOrder: defaultQueueOrder,
        queuePointer: 0,
        todayBatchStart: 0,
        lastBatchDate: getTodayStr(),
        solves: {},
        skipped: [],
      };
      set(resetState);
      appStorage.setItem(STORAGE_KEY_PRACTICE, resetState);
    },

    setPracticeState: (newState: PracticeState) => {
      set(newState);
      appStorage.setItem(STORAGE_KEY_PRACTICE, newState);
    },
  };
});
