import { create } from 'zustand';
import { PracticeSheet, PracticeState, ProblemSolve, SheetCategory } from '../types';
import { appStorage } from '../lib/storage';
import { flattenProblems, getNextUnsolvedIndex } from '../lib/problemUtils';
import { getTodayStr } from '../lib/dateUtils';
import rawProblemsData from '../data/problems.json';
import { useTaskStore } from './useTaskStore';

const STORAGE_KEY_PRACTICE = 'dt_practice_v1';

// Shipped default DSA pattern sheet
export const builtInDsaSheet: PracticeSheet = {
  id: 'dsa-pattern-sheet',
  meta: rawProblemsData.meta,
  categories: rawProblemsData.categories as unknown as SheetCategory[],
  linkedCategoryId: 'leetcode',
  isBuiltIn: true,
};

const defaultFlattened = flattenProblems(builtInDsaSheet);
const defaultQueueOrder = defaultFlattened.map((item) => item.key);

export const DEFAULT_PRACTICE_STATE: PracticeState = {
  queueOrder: defaultQueueOrder,
  queuePointer: 0,
  todayBatchStart: 0,
  lastBatchDate: getTodayStr(),
  solves: {},
  skipped: [],
};

interface MultiSheetStorageData {
  sheets: Record<string, PracticeSheet>;
  activeSheetId: string;
  statesBySheet: Record<string, PracticeState>;
}

interface PracticeStoreState extends MultiSheetStorageData {
  // Actions
  setActiveSheetId: (sheetId: string) => void;
  addSheet: (sheet: PracticeSheet) => void;
  deleteSheet: (sheetId: string) => void;

  toggleSolved: (sheetId: string, patternId: string, problemId: string, dateStr?: string) => void;
  markCurrentSolved: (dateStr?: string) => string | null;
  skipCurrent: () => void;
  jumpToKey: (key: string) => void;
  shuffleRemaining: () => void;
  resetQueue: (sheetId?: string) => void;
  checkBatchReset: () => void;
  setPracticeState: (state: any) => void;
}

// Helper to initialize or migrate storage
function loadInitialStoreData(): MultiSheetStorageData {
  const rawStored = appStorage.getItem<any>(STORAGE_KEY_PRACTICE, null);

  // Default empty state fallback
  const defaultMultiState: MultiSheetStorageData = {
    sheets: { [builtInDsaSheet.id]: builtInDsaSheet },
    activeSheetId: builtInDsaSheet.id,
    statesBySheet: { [builtInDsaSheet.id]: { ...DEFAULT_PRACTICE_STATE } },
  };

  if (!rawStored) {
    return defaultMultiState;
  }

  // Detect existing multi-sheet shape vs legacy flat shape
  if (rawStored.sheets && rawStored.statesBySheet && rawStored.activeSheetId) {
    // Multi-sheet format exists
    const sheets = { ...rawStored.sheets, [builtInDsaSheet.id]: builtInDsaSheet };
    const activeSheetId = sheets[rawStored.activeSheetId] ? rawStored.activeSheetId : builtInDsaSheet.id;
    
    // Ensure all sheets have a PracticeState
    const statesBySheet: Record<string, PracticeState> = {};
    for (const sId of Object.keys(sheets)) {
      statesBySheet[sId] = rawStored.statesBySheet[sId] || {
        queueOrder: flattenProblems(sheets[sId]).map((item) => item.key),
        queuePointer: 0,
        todayBatchStart: 0,
        lastBatchDate: getTodayStr(),
        solves: {},
        skipped: [],
      };
    }

    return { sheets, activeSheetId, statesBySheet };
  }

  // Legacy flat PracticeState exists in storage -> Migrate it!
  const legacyQueueOrder = rawStored.queueOrder && rawStored.queueOrder.length > 0 ? rawStored.queueOrder : defaultQueueOrder;
  const migratedState: MultiSheetStorageData = {
    sheets: { [builtInDsaSheet.id]: builtInDsaSheet },
    activeSheetId: builtInDsaSheet.id,
    statesBySheet: {
      [builtInDsaSheet.id]: {
        queueOrder: legacyQueueOrder,
        queuePointer: typeof rawStored.queuePointer === 'number' ? rawStored.queuePointer : 0,
        todayBatchStart: typeof rawStored.todayBatchStart === 'number' ? rawStored.todayBatchStart : 0,
        lastBatchDate: rawStored.lastBatchDate || getTodayStr(),
        solves: rawStored.solves || {},
        skipped: rawStored.skipped || [],
      },
    },
  };

  // Save migrated state immediately back to storage
  appStorage.setItem(STORAGE_KEY_PRACTICE, migratedState);
  return migratedState;
}

export const usePracticeStore = create<PracticeStoreState>((set, get) => {
  const initialStore = loadInitialStoreData();

  const persist = (nextState: MultiSheetStorageData) => {
    appStorage.setItem(STORAGE_KEY_PRACTICE, nextState);
  };

  return {
    ...initialStore,

    setActiveSheetId: (sheetId: string) => {
      const { sheets } = get();
      if (sheets[sheetId]) {
        const next = { ...get(), activeSheetId: sheetId };
        set({ activeSheetId: sheetId });
        persist({ sheets: next.sheets, activeSheetId: next.activeSheetId, statesBySheet: next.statesBySheet });
      }
    },

    addSheet: (newSheet: PracticeSheet) => {
      const { sheets, statesBySheet } = get();
      const initialQueueOrder = flattenProblems(newSheet).map((item) => item.key);

      const newPracticeState: PracticeState = {
        queueOrder: initialQueueOrder,
        queuePointer: 0,
        todayBatchStart: 0,
        lastBatchDate: getTodayStr(),
        solves: {},
        skipped: [],
      };

      const updatedSheets = { ...sheets, [newSheet.id]: newSheet };
      const updatedStates = { ...statesBySheet, [newSheet.id]: newPracticeState };
      const activeSheetId = newSheet.id;

      set({ sheets: updatedSheets, statesBySheet: updatedStates, activeSheetId });
      persist({ sheets: updatedSheets, activeSheetId, statesBySheet: updatedStates });
    },

    deleteSheet: (sheetId: string) => {
      const { sheets, statesBySheet, activeSheetId } = get();
      if (!sheets[sheetId] || sheets[sheetId].isBuiltIn) return;

      const updatedSheets = { ...sheets };
      delete updatedSheets[sheetId];

      const updatedStates = { ...statesBySheet };
      delete updatedStates[sheetId];

      const nextActiveId = activeSheetId === sheetId ? builtInDsaSheet.id : activeSheetId;

      set({ sheets: updatedSheets, statesBySheet: updatedStates, activeSheetId: nextActiveId });
      persist({ sheets: updatedSheets, activeSheetId: nextActiveId, statesBySheet: updatedStates });
    },

    toggleSolved: (sheetId: string, patternId: string, problemId: string, dateStr?: string) => {
      const { sheets, statesBySheet } = get();
      const sheet = sheets[sheetId];
      const sheetState = statesBySheet[sheetId];
      if (!sheet || !sheetState) return;

      const key = `${patternId}:${problemId}`;
      const existingSolve = sheetState.solves[key];
      const newSolves = { ...sheetState.solves };

      if (existingSolve) {
        // UN-SOLVING: reverse the original day's contribution
        const originalDate = existingSolve.solvedAt;
        delete newSolves[key];

        // Decrement task count on original solvedAt date in useTaskStore
        useTaskStore.getState().decrementTaskCount(originalDate, sheet.linkedCategoryId, 1);
      } else {
        // MARKING SOLVED: log under today's date (or passed dateStr)
        const solvedAt = dateStr || getTodayStr();
        newSolves[key] = {
          patternId,
          problemId,
          solvedAt,
        };

        // Increment today's linked-category count in useTaskStore
        useTaskStore.getState().incrementTaskCount(solvedAt, sheet.linkedCategoryId, 1);
      }

      // Auto-advance pointer if current pointer was on this problem and it got solved
      let nextPointer = sheetState.queuePointer;
      if (!existingSolve) {
        nextPointer = getNextUnsolvedIndex(sheetState.queueOrder, nextPointer, newSolves);
      }

      const updatedStateForSheet: PracticeState = {
        ...sheetState,
        solves: newSolves,
        queuePointer: nextPointer,
      };

      const updatedStates = {
        ...statesBySheet,
        [sheetId]: updatedStateForSheet,
      };

      set({ statesBySheet: updatedStates });
      persist({ sheets, activeSheetId: get().activeSheetId, statesBySheet: updatedStates });
    },

    markCurrentSolved: (dateStr?: string) => {
      const { sheets, statesBySheet, activeSheetId } = get();
      const sheet = sheets[activeSheetId];
      const sheetState = statesBySheet[activeSheetId];
      if (!sheet || !sheetState) return null;

      const { queueOrder, queuePointer, solves } = sheetState;
      const validPointer = getNextUnsolvedIndex(queueOrder, queuePointer, solves);

      if (validPointer >= queueOrder.length) return null;

      const solvedKey = queueOrder[validPointer];
      const [patternId, problemId] = solvedKey.split(':');
      const solvedAt = dateStr || getTodayStr();

      const newSolves: Record<string, ProblemSolve> = {
        ...solves,
        [solvedKey]: {
          patternId,
          problemId,
          solvedAt,
        },
      };

      // Increment linked category count
      useTaskStore.getState().incrementTaskCount(solvedAt, sheet.linkedCategoryId, 1);

      // Advance pointer to next unsolved problem
      const nextPointer = getNextUnsolvedIndex(queueOrder, validPointer + 1, newSolves);

      const updatedSheetState: PracticeState = {
        ...sheetState,
        solves: newSolves,
        queuePointer: nextPointer,
      };

      const updatedStates = {
        ...statesBySheet,
        [activeSheetId]: updatedSheetState,
      };

      set({ statesBySheet: updatedStates });
      persist({ sheets, activeSheetId, statesBySheet: updatedStates });

      return solvedKey;
    },

    skipCurrent: () => {
      const { sheets, statesBySheet, activeSheetId } = get();
      const sheetState = statesBySheet[activeSheetId];
      if (!sheetState) return;

      const { queueOrder, queuePointer, solves, skipped } = sheetState;
      const validPointer = getNextUnsolvedIndex(queueOrder, queuePointer, solves);

      if (validPointer >= queueOrder.length) return;

      const currentKey = queueOrder[validPointer];
      const newQueueOrder = [...queueOrder, currentKey];
      const newSkipped = [...skipped, currentKey];
      const nextPointer = getNextUnsolvedIndex(newQueueOrder, validPointer + 1, solves);

      const updatedSheetState: PracticeState = {
        ...sheetState,
        queueOrder: newQueueOrder,
        queuePointer: nextPointer,
        skipped: newSkipped,
      };

      const updatedStates = {
        ...statesBySheet,
        [activeSheetId]: updatedSheetState,
      };

      set({ statesBySheet: updatedStates });
      persist({ sheets, activeSheetId, statesBySheet: updatedStates });
    },

    jumpToKey: (key: string) => {
      const { sheets, statesBySheet, activeSheetId } = get();
      const sheetState = statesBySheet[activeSheetId];
      if (!sheetState) return;

      const { queueOrder } = sheetState;
      let index = queueOrder.indexOf(key);

      let newQueueOrder = queueOrder;
      if (index === -1) {
        index = sheetState.queuePointer;
        newQueueOrder = [...queueOrder];
        newQueueOrder.splice(index, 0, key);
      }

      const updatedSheetState: PracticeState = {
        ...sheetState,
        queueOrder: newQueueOrder,
        queuePointer: index,
      };

      const updatedStates = {
        ...statesBySheet,
        [activeSheetId]: updatedSheetState,
      };

      set({ statesBySheet: updatedStates });
      persist({ sheets, activeSheetId, statesBySheet: updatedStates });
    },

    shuffleRemaining: () => {
      const { sheets, statesBySheet, activeSheetId } = get();
      const sheetState = statesBySheet[activeSheetId];
      if (!sheetState) return;

      const { queueOrder, queuePointer } = sheetState;
      const donePortion = queueOrder.slice(0, queuePointer);
      const remainingPortion = queueOrder.slice(queuePointer);

      for (let i = remainingPortion.length - 1; i > 0; i--) {
        const j = Math.floor(Math.random() * (i + 1));
        [remainingPortion[i], remainingPortion[j]] = [remainingPortion[j], remainingPortion[i]];
      }

      const newQueueOrder = [...donePortion, ...remainingPortion];

      const updatedSheetState: PracticeState = {
        ...sheetState,
        queueOrder: newQueueOrder,
      };

      const updatedStates = {
        ...statesBySheet,
        [activeSheetId]: updatedSheetState,
      };

      set({ statesBySheet: updatedStates });
      persist({ sheets, activeSheetId, statesBySheet: updatedStates });
    },

    resetQueue: (sheetId?: string) => {
      const targetId = sheetId || get().activeSheetId;
      const { sheets, statesBySheet } = get();
      const sheet = sheets[targetId];
      if (!sheet) return;

      const initialQueueOrder = flattenProblems(sheet).map((item) => item.key);
      const resetState: PracticeState = {
        queueOrder: initialQueueOrder,
        queuePointer: 0,
        todayBatchStart: 0,
        lastBatchDate: getTodayStr(),
        solves: {},
        skipped: [],
      };

      const updatedStates = {
        ...statesBySheet,
        [targetId]: resetState,
      };

      set({ statesBySheet: updatedStates });
      persist({ sheets, activeSheetId: get().activeSheetId, statesBySheet: updatedStates });
    },

    checkBatchReset: () => {
      const { activeSheetId, statesBySheet, sheets } = get();
      const sheetState = statesBySheet[activeSheetId];
      if (!sheetState) return;

      const today = getTodayStr();
      if (sheetState.lastBatchDate !== today) {
        const updatedSheetState: PracticeState = {
          ...sheetState,
          lastBatchDate: today,
          todayBatchStart: sheetState.queuePointer,
        };

        const updatedStates = {
          ...statesBySheet,
          [activeSheetId]: updatedSheetState,
        };

        set({ statesBySheet: updatedStates });
        persist({ sheets, activeSheetId, statesBySheet: updatedStates });
      }
    },

    setPracticeState: (incoming: any) => {
      if (!incoming) return;

      if (incoming.sheets && incoming.statesBySheet && incoming.activeSheetId) {
        set({
          sheets: incoming.sheets,
          activeSheetId: incoming.activeSheetId,
          statesBySheet: incoming.statesBySheet,
        });
        persist(incoming);
      } else if (incoming.queueOrder && incoming.solves) {
        // Fallback flat state import
        const migrated: MultiSheetStorageData = {
          sheets: { [builtInDsaSheet.id]: builtInDsaSheet },
          activeSheetId: builtInDsaSheet.id,
          statesBySheet: {
            [builtInDsaSheet.id]: {
              queueOrder: incoming.queueOrder,
              queuePointer: incoming.queuePointer || 0,
              todayBatchStart: incoming.todayBatchStart || 0,
              lastBatchDate: incoming.lastBatchDate || getTodayStr(),
              solves: incoming.solves || {},
              skipped: incoming.skipped || [],
            },
          },
        };
        set(migrated);
        persist(migrated);
      }
    },
  };
});

