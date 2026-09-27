import { test, describe } from 'node:test';
import assert from 'node:assert/strict';
import {
  mergeDayEntries,
  mergeCategories,
  mergeGoals,
  mergePracticeStates,
  mergeSyncData,
} from './githubSyncMerge.ts';
import { Category, DayEntry, Goal, PracticeState } from '../types';
import { GistSyncData } from './githubSync';

describe('mergeDayEntries', () => {
  test('handles empty objects safely', () => {
    assert.deepEqual(mergeDayEntries({}, {}), {});
    const localOnly: Record<string, DayEntry> = {
      '2026-09-20': { date: '2026-09-20', tasks: { t1: { done: true } } },
    };
    assert.deepEqual(mergeDayEntries(localOnly, {}), localOnly);
    const remoteOnly: Record<string, DayEntry> = {
      '2026-09-21': { date: '2026-09-21', tasks: { t2: { done: false } } },
    };
    assert.deepEqual(mergeDayEntries({}, remoteOnly), remoteOnly);
  });

  test('unions non-overlapping dates from local and remote', () => {
    const local: Record<string, DayEntry> = {
      '2026-09-20': {
        date: '2026-09-20',
        tasks: { leetcode: { done: true, count: 5 } },
      },
    };
    const remote: Record<string, DayEntry> = {
      '2026-09-21': {
        date: '2026-09-21',
        tasks: { aptitude: { done: true, count: 3 } },
      },
    };

    const merged = mergeDayEntries(local, remote);
    assert.deepEqual(Object.keys(merged).sort(), ['2026-09-20', '2026-09-21']);
    assert.equal(merged['2026-09-20'].tasks['leetcode'].count, 5);
    assert.equal(merged['2026-09-21'].tasks['aptitude'].count, 3);
  });

  test('merges tasks on same date: unions categories and resolves conflict correctly', () => {
    const local: Record<string, DayEntry> = {
      '2026-09-25': {
        date: '2026-09-25',
        tasks: {
          leetcode: { done: false, count: 2, note: 'local note' },
          exercise: { done: true, count: 1 },
        },
      },
    };
    const remote: Record<string, DayEntry> = {
      '2026-09-25': {
        date: '2026-09-25',
        tasks: {
          leetcode: { done: true, count: 4, note: 'remote note' },
          aptitude: { done: true, count: 5, note: 'remote note' },
        },
      },
    };

    const merged = mergeDayEntries(local, remote);
    const day = merged['2026-09-25'];
    assert.ok(day);

    // leetcode in both: done = true (false || true), count = max(2,4)=4, note prefers local ('local note')
    assert.equal(day.tasks['leetcode'].done, true);
    assert.equal(day.tasks['leetcode'].count, 4);
    assert.equal(day.tasks['leetcode'].note, 'local note');

    // exercise in local only
    assert.equal(day.tasks['exercise'].done, true);
    assert.equal(day.tasks['exercise'].count, 1);

    // aptitude in remote only
    assert.equal(day.tasks['aptitude'].done, true);
    assert.equal(day.tasks['aptitude'].count, 5);
    assert.equal(day.tasks['aptitude'].note, 'remote note');
  });

  test('falls back count to 1 if done is true and count was undefined or zero', () => {
    const local: Record<string, DayEntry> = {
      '2026-09-25': {
        date: '2026-09-25',
        tasks: {
          java: { done: false },
          python: { done: true, count: 0 },
        },
      },
    };
    const remote: Record<string, DayEntry> = {
      '2026-09-25': {
        date: '2026-09-25',
        tasks: {
          java: { done: true },
          python: { done: false },
        },
      },
    };

    const merged = mergeDayEntries(local, remote);
    assert.equal(merged['2026-09-25'].tasks['java'].done, true);
    assert.equal(merged['2026-09-25'].tasks['java'].count, 1);

    assert.equal(merged['2026-09-25'].tasks['python'].done, true);
    assert.equal(merged['2026-09-25'].tasks['python'].count, 1);
  });

  test('keeps count undefined if neither task is done and counts are zero/undefined', () => {
    const local: Record<string, DayEntry> = {
      '2026-09-25': {
        date: '2026-09-25',
        tasks: {
          task1: { done: false },
        },
      },
    };
    const remote: Record<string, DayEntry> = {
      '2026-09-25': {
        date: '2026-09-25',
        tasks: {
          task1: { done: false },
        },
      },
    };

    const merged = mergeDayEntries(local, remote);
    assert.equal(merged['2026-09-25'].tasks['task1'].done, false);
    assert.equal(merged['2026-09-25'].tasks['task1'].count, undefined);
  });
});

describe('mergeCategories', () => {
  test('handles empty arrays', () => {
    assert.deepEqual(mergeCategories([], []), []);
  });

  test('preserves local category order and fields, and appends remote-only categories', () => {
    const local: Category[] = [
      {
        id: 'c1',
        name: 'Cat 1 (local updated)',
        color: '#111111',
        icon: 'Code',
        dailyTarget: 10,
        archived: false,
        createdAt: '2026-01-01',
      },
      {
        id: 'c2',
        name: 'Cat 2',
        color: '#222222',
        icon: 'Activity',
        dailyTarget: 2,
        archived: false,
        createdAt: '2026-01-02',
      },
    ];

    const remote: Category[] = [
      {
        id: 'c3',
        name: 'Cat 3 (remote new)',
        color: '#333333',
        icon: 'Book',
        dailyTarget: 1,
        archived: false,
        createdAt: '2026-01-03',
      },
      {
        id: 'c1',
        name: 'Cat 1 (remote stale)',
        color: '#999999',
        icon: 'Code',
        dailyTarget: 5,
        archived: false,
        createdAt: '2026-01-01',
      },
    ];

    const merged = mergeCategories(local, remote);
    assert.equal(merged.length, 3);
    assert.equal(merged[0].id, 'c1');
    assert.equal(merged[0].name, 'Cat 1 (local updated)');
    assert.equal(merged[0].dailyTarget, 10);
    assert.equal(merged[1].id, 'c2');
    assert.equal(merged[2].id, 'c3');
    assert.equal(merged[2].name, 'Cat 3 (remote new)');
  });
});

describe('mergeGoals', () => {
  test('unions goals by id, taking higher currentValue or completed status', () => {
    const local: Goal[] = [
      {
        id: 'g1',
        title: 'LeetCode 50',
        type: 'monthly',
        targetValue: 50,
        currentValue: 20,
        startDate: '2026-09-01',
        endDate: '2026-09-30',
        status: 'active',
      },
      {
        id: 'g2',
        title: 'Aptitude 30',
        type: 'weekly',
        targetValue: 30,
        currentValue: 15,
        startDate: '2026-09-01',
        endDate: '2026-09-30',
        status: 'active',
      },
    ];

    const remote: Goal[] = [
      {
        id: 'g1',
        title: 'LeetCode 50',
        type: 'monthly',
        targetValue: 50,
        currentValue: 35, // higher currentValue
        startDate: '2026-09-01',
        endDate: '2026-09-30',
        status: 'active',
      },
      {
        id: 'g2',
        title: 'Aptitude 30',
        type: 'weekly',
        targetValue: 30,
        currentValue: 15,
        startDate: '2026-09-01',
        endDate: '2026-09-30',
        status: 'completed', // completed status
      },
      {
        id: 'g3',
        title: 'Project 10',
        type: 'monthly',
        targetValue: 10,
        currentValue: 5,
        startDate: '2026-09-01',
        endDate: '2026-09-30',
        status: 'active',
      },
    ];

    const merged = mergeGoals(local, remote);
    assert.equal(merged.length, 3);
    // g1 should pick remote's higher currentValue 35
    assert.equal(merged[0].id, 'g1');
    assert.equal(merged[0].currentValue, 35);
    // g2 should pick remote's completed status
    assert.equal(merged[1].id, 'g2');
    assert.equal(merged[1].status, 'completed');
    // g3 should be appended
    assert.equal(merged[2].id, 'g3');
  });

  test('prioritizes completed status even if other has higher currentValue', () => {
    const local: Goal[] = [
      {
        id: 'g-comp',
        title: 'Read Books',
        type: 'custom',
        targetValue: 5,
        currentValue: 5,
        startDate: '2026-09-01',
        endDate: '2026-09-30',
        status: 'completed',
      },
    ];
    const remote: Goal[] = [
      {
        id: 'g-comp',
        title: 'Read Books',
        type: 'custom',
        targetValue: 10,
        currentValue: 7,
        startDate: '2026-09-01',
        endDate: '2026-09-30',
        status: 'active',
      },
    ];

    const merged = mergeGoals(local, remote);
    assert.equal(merged[0].status, 'completed');
  });

  test('takes remote failed status over local active when currentValue is equal', () => {
    const local: Goal[] = [
      {
        id: 'g-fail',
        title: 'Old Goal',
        type: 'custom',
        targetValue: 5,
        currentValue: 2,
        startDate: '2026-08-01',
        endDate: '2026-08-15',
        status: 'active',
      },
    ];
    const remote: Goal[] = [
      {
        id: 'g-fail',
        title: 'Old Goal',
        type: 'custom',
        targetValue: 5,
        currentValue: 2,
        startDate: '2026-08-01',
        endDate: '2026-08-15',
        status: 'failed',
      },
    ];

    const merged = mergeGoals(local, remote);
    assert.equal(merged[0].status, 'failed');
  });
});

describe('mergePracticeStates', () => {
  test('unions solves dictionary and picks latest queuePointer', () => {
    const local: Record<string, PracticeState> = {
      'dsa-sheet': {
        queueOrder: ['p1', 'p2', 'p3'],
        queuePointer: 2,
        todayBatchStart: 0,
        lastBatchDate: '2026-09-25',
        solves: {
          'p1': { patternId: 'pat1', problemId: 'p1', solvedAt: '2026-09-25' },
        },
        skipped: ['skip1'],
      },
    };

    const remote: Record<string, PracticeState> = {
      'dsa-sheet': {
        queueOrder: ['p1', 'p2', 'p3'],
        queuePointer: 5, // higher pointer
        todayBatchStart: 3,
        lastBatchDate: '2026-09-26',
        solves: {
          'p2': { patternId: 'pat1', problemId: 'p2', solvedAt: '2026-09-26' },
        },
        skipped: ['skip2'],
      },
      'sql-sheet': {
        queueOrder: ['s1'],
        queuePointer: 1,
        todayBatchStart: 0,
        lastBatchDate: '2026-09-26',
        solves: {
          's1': { patternId: 'sql1', problemId: 's1', solvedAt: '2026-09-26' },
        },
        skipped: [],
      },
    };

    const merged = mergePracticeStates(local, remote);
    assert.ok(merged['dsa-sheet']);
    assert.ok(merged['sql-sheet']);

    // dsa-sheet: solves unioned (both p1 and p2 present)
    assert.ok(merged['dsa-sheet'].solves['p1']);
    assert.ok(merged['dsa-sheet'].solves['p2']);
    // queuePointer is max(2, 5) = 5
    assert.equal(merged['dsa-sheet'].queuePointer, 5);
    // skipped unioned
    assert.deepEqual(merged['dsa-sheet'].skipped.sort(), ['skip1', 'skip2']);
  });
});

describe('mergeSyncData', () => {
  test('orchestrates full sync data merging', () => {
    const local: GistSyncData = {
      tasks: {
        categories: [
          {
            id: 'c1',
            name: 'Cat 1',
            color: '#111',
            icon: 'Code',
            archived: false,
            createdAt: '2026-01-01',
          },
        ],
        dayEntries: {
          '2026-09-20': {
            date: '2026-09-20',
            tasks: { c1: { done: true, count: 2 } },
          },
        },
      },
      goals: [],
      practice: {
        sheets: {},
        activeSheetId: 'dsa-sheet',
        statesBySheet: {},
      },
      settings: {
        theme: 'dark',
      },
      updatedAt: '2026-09-20T00:00:00.000Z',
    };

    const remote: GistSyncData = {
      tasks: {
        categories: [
          {
            id: 'c2',
            name: 'Cat 2',
            color: '#222',
            icon: 'Book',
            archived: false,
            createdAt: '2026-01-02',
          },
        ],
        dayEntries: {
          '2026-09-21': {
            date: '2026-09-21',
            tasks: { c2: { done: true, count: 1 } },
          },
        },
      },
      goals: [],
      practice: {
        sheets: {},
        activeSheetId: 'dsa-sheet',
        statesBySheet: {},
      },
      settings: {
        theme: 'light',
        reminderTime: '21:00',
      },
      updatedAt: '2026-09-21T00:00:00.000Z',
    };

    const merged = mergeSyncData(local, remote);
    assert.ok(merged.updatedAt);
    assert.notEqual(merged.updatedAt, local.updatedAt);
    assert.notEqual(merged.updatedAt, remote.updatedAt);

    // categories merged
    const tasks = merged.tasks as any;
    assert.equal(tasks.categories.length, 2);
    assert.equal(tasks.categories[0].id, 'c1');
    assert.equal(tasks.categories[1].id, 'c2');

    // dayEntries merged
    assert.ok(tasks.dayEntries['2026-09-20']);
    assert.ok(tasks.dayEntries['2026-09-21']);

    // settings merged with local overriding remote
    const settings = merged.settings as any;
    assert.equal(settings.theme, 'dark'); // local override
    assert.equal(settings.reminderTime, '21:00'); // remote fallback
  });

  test('handles legacy flat practice state gracefully in mergeSyncData', () => {
    const local: GistSyncData = {
      tasks: {},
      goals: [],
      practice: {
        queueOrder: ['p1'],
        queuePointer: 1,
        solves: {
          p1: { patternId: 'pat1', problemId: 'p1', solvedAt: '2026-09-25' },
        },
        skipped: [],
      },
      settings: {},
      updatedAt: '2026-09-25T00:00:00.000Z',
    };

    const remote: GistSyncData = {
      tasks: {},
      goals: [],
      practice: {
        queueOrder: ['p1', 'p2'],
        queuePointer: 2,
        solves: {
          p2: { patternId: 'pat1', problemId: 'p2', solvedAt: '2026-09-26' },
        },
        skipped: [],
      },
      settings: {},
      updatedAt: '2026-09-26T00:00:00.000Z',
    };

    const merged = mergeSyncData(local, remote);
    const practice = merged.practice as any;
    assert.ok(practice.statesBySheet);
    const dsaState = practice.statesBySheet['dsa-pattern-sheet'];
    assert.ok(dsaState);
    assert.ok(dsaState.solves['p1']);
    assert.ok(dsaState.solves['p2']);
    assert.equal(dsaState.queuePointer, 2);
  });
});
