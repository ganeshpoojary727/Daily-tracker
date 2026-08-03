import { ProblemsFile, CategorySeed, PatternSeed, ProblemSeed, ProblemSolve } from '../types';

export interface FlattenedProblem {
  key: string; // "patternId:problemNumber"
  category: CategorySeed;
  pattern: PatternSeed;
  problem: ProblemSeed;
}

export function flattenProblems(problemsFile: ProblemsFile): FlattenedProblem[] {
  const result: FlattenedProblem[] = [];

  for (const cat of problemsFile.categories) {
    for (const pat of cat.patterns) {
      for (const prob of pat.problems) {
        const key = `${pat.id}:${prob.number}`;
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

export function buildProblemMap(problemsFile: ProblemsFile): Map<string, FlattenedProblem> {
  const map = new Map<string, FlattenedProblem>();
  const list = flattenProblems(problemsFile);
  for (const item of list) {
    map.set(item.key, item);
  }
  return map;
}

export function getUniqueProblemsCount(solves: Record<string, ProblemSolve>): number {
  const solvedProblemNumbers = new Set<number>();
  for (const solve of Object.values(solves)) {
    solvedProblemNumbers.add(solve.problemNumber);
  }
  return solvedProblemNumbers.size;
}

export function getPatternProgress(
  pattern: PatternSeed,
  solves: Record<string, ProblemSolve>
): { solved: number; total: number; percentage: number } {
  const total = pattern.problems.length;
  if (total === 0) return { solved: 0, total: 0, percentage: 0 };

  let solved = 0;
  for (const prob of pattern.problems) {
    const key = `${pattern.id}:${prob.number}`;
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
  category: CategorySeed,
  solves: Record<string, ProblemSolve>
): { solved: number; total: number; percentage: number } {
  let total = 0;
  let solved = 0;

  for (const pat of category.patterns) {
    for (const prob of pat.problems) {
      total++;
      const key = `${pat.id}:${prob.number}`;
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
