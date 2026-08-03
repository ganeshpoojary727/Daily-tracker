import { PracticeSheet, SheetCategory, SheetPattern, SheetProblem, ProblemSolve } from '../types';

export interface FlattenedProblem {
  key: string; // "patternId:problemId"
  category: SheetCategory;
  pattern: SheetPattern;
  problem: SheetProblem;
}

export function getProblemKey(patternId: string, problem: SheetProblem): string {
  const probId = problem.id || (problem.number !== undefined ? String(problem.number) : problem.title);
  return `${patternId}:${probId}`;
}

export function flattenProblems(sheetOrCategories: PracticeSheet | SheetCategory[]): FlattenedProblem[] {
  const categories = Array.isArray(sheetOrCategories) ? sheetOrCategories : sheetOrCategories.categories;
  const result: FlattenedProblem[] = [];

  for (const cat of categories) {
    for (const pat of cat.patterns) {
      for (const prob of pat.problems) {
        const key = getProblemKey(pat.id, prob);
        result.push({
          key,
          category: cat,
          pattern: pat,
          problem: prob,
        });
      }
    }
  }

  return result;
}

export function buildProblemMap(sheetOrCategories: PracticeSheet | SheetCategory[]): Map<string, FlattenedProblem> {
  const map = new Map<string, FlattenedProblem>();
  const list = flattenProblems(sheetOrCategories);
  for (const item of list) {
    map.set(item.key, item);
  }
  return map;
}

export function getUniqueProblemsCount(solves: Record<string, ProblemSolve>): number {
  return Object.keys(solves).length;
}

export function getPatternProgress(
  pattern: SheetPattern,
  solves: Record<string, ProblemSolve>
): { solved: number; total: number; percentage: number } {
  const total = pattern.problems.length;
  if (total === 0) return { solved: 0, total: 0, percentage: 0 };

  let solved = 0;
  for (const prob of pattern.problems) {
    const key = getProblemKey(pattern.id, prob);
    if (solves[key]) {
      solved++;
    }
  }

  return {
    solved,
    total,
    percentage: Math.round((solved / total) * 100),
  };
}

export function getCategoryProgress(
  category: SheetCategory,
  solves: Record<string, ProblemSolve>
): { solved: number; total: number; percentage: number } {
  let total = 0;
  let solved = 0;

  for (const pat of category.patterns) {
    for (const prob of pat.problems) {
      total++;
      const key = getProblemKey(pat.id, prob);
      if (solves[key]) {
        solved++;
      }
    }
  }

  if (total === 0) return { solved: 0, total: 0, percentage: 0 };
  return {
    solved,
    total,
    percentage: Math.round((solved / total) * 100),
  };
}

export function computeSheetProgress(
  sheet: PracticeSheet,
  solves: Record<string, ProblemSolve>
): { solved: number; total: number; percentage: number } {
  let total = 0;
  let solved = 0;

  for (const cat of sheet.categories) {
    for (const pat of cat.patterns) {
      for (const prob of pat.problems) {
        total++;
        const key = getProblemKey(pat.id, prob);
        if (solves[key]) {
          solved++;
        }
      }
    }
  }

  if (total === 0) return { solved: 0, total: 0, percentage: 0 };
  return {
    solved,
    total,
    percentage: Math.round((solved / total) * 100),
  };
}

/**
 * Returns the next index in queueOrder starting from startIndex (inclusive) that is NOT solved.
 * If all remaining problems are solved, returns queueOrder.length.
 */
export function getNextUnsolvedIndex(
  queueOrder: string[],
  startIndex: number,
  solves: Record<string, ProblemSolve>
): number {
  let idx = Math.max(0, startIndex);
  while (idx < queueOrder.length) {
    const key = queueOrder[idx];
    if (!solves[key]) {
      return idx;
    }
    idx++;
  }
  return queueOrder.length; // Queue complete
}

/**
 * Validates and imports raw JSON into a typed PracticeSheet.
 * Throws descriptive Error if JSON structure is invalid.
 */
export function importSheet(
  jsonString: string,
  linkedCategoryId: string,
  customTitle?: string
): PracticeSheet {
  let raw: any;
  try {
    raw = JSON.parse(jsonString);
  } catch {
    throw new Error('Invalid JSON format. Please ensure the file contains valid JSON.');
  }

  if (!raw || typeof raw !== 'object') {
    throw new Error('Invalid file structure. Expected a JSON object.');
  }

  if (!Array.isArray(raw.categories) || raw.categories.length === 0) {
    throw new Error('This file is missing a categories array or it is empty — see the format guide below.');
  }

  const rawTitle = customTitle?.trim() || raw.meta?.title || raw.title || 'Untitled Sheet';
  const slug = rawTitle
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-|-$/g, '') || `sheet-${Date.now()}`;

  const sheetId = `${slug}-${Date.now()}`;

  const categories: SheetCategory[] = raw.categories.map((cat: any, catIdx: number) => {
    const catId = cat.id || `cat-${catIdx + 1}`;
    const patterns: SheetPattern[] = (cat.patterns || []).map((pat: any, patIdx: number) => {
      const patId = pat.id || `${catId}-p${patIdx + 1}`;
      const problems: SheetProblem[] = (pat.problems || []).map((prob: any, probIdx: number) => {
        const probId = prob.id || (prob.number !== undefined ? String(prob.number) : `${patId}-${probIdx + 1}`);
        return {
          id: String(probId),
          number: typeof prob.number === 'number' ? prob.number : undefined,
          title: prob.title || `Problem ${probIdx + 1}`,
          url: typeof prob.url === 'string' ? prob.url : undefined,
          notes: typeof prob.notes === 'string' ? prob.notes : undefined,
        };
      });

      return {
        id: String(patId),
        number: typeof pat.number === 'number' ? pat.number : undefined,
        name: pat.name || `Pattern ${patIdx + 1}`,
        hasVideo: !!pat.hasVideo,
        problems,
      };
    });

    return {
      id: String(catId),
      roman: cat.roman,
      name: cat.name || `Category ${catIdx + 1}`,
      patterns,
    };
  });

  const sheet: PracticeSheet = {
    id: sheetId,
    meta: {
      title: rawTitle,
      author: raw.meta?.author,
      source: raw.meta?.source,
      note: raw.meta?.note,
    },
    categories,
    linkedCategoryId,
    isBuiltIn: false,
  };

  return sheet;
}

