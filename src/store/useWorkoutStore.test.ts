import { test, describe, beforeEach } from 'node:test';
import assert from 'node:assert/strict';
import { useWorkoutStore } from './useWorkoutStore';

describe('useWorkoutStore', () => {
  beforeEach(() => {
    useWorkoutStore.getState().resetEntireRoutineToDefault();
  });

  test('initializes with 7-day routine and defaults to today or monday', () => {
    const state = useWorkoutStore.getState();
    assert.ok(state.routine.monday);
    assert.ok(state.routine.tuesday);
    assert.ok(state.routine.wednesday);
  });

  test('toggles a set on an exercise for a specific date', () => {
    const { toggleSet } = useWorkoutStore.getState();
    const testDate = '2026-10-05';
    const exerciseId = 'mon-pushups';

    toggleSet(testDate, 'monday', exerciseId, 0, '12');
    let log = useWorkoutStore.getState().logs[testDate];
    assert.equal(log.exercises[exerciseId]?.sets[0]?.completed, true);
    assert.equal(log.exercises[exerciseId]?.sets[0]?.reps, '12');

    toggleSet(testDate, 'monday', exerciseId, 0);
    log = useWorkoutStore.getState().logs[testDate];
    assert.equal(log.exercises[exerciseId]?.sets[0]?.completed, false);
  });

  test('allows adding, editing, and deleting an exercise', () => {
    const { addExercise, editExercise, deleteExercise } = useWorkoutStore.getState();

    // Add
    addExercise('monday', {
      name: 'Custom Dips',
      muscleGroup: 'Chest / Triceps',
      targetSets: 3,
      targetReps: '8–12',
      tempoNote: '2s down',
    });
    let monday = useWorkoutStore.getState().routine.monday;
    const added = monday.exercises.find((e) => e.name === 'Custom Dips');
    assert.ok(added);

    // Edit
    editExercise('monday', added.id, { targetReps: '10–15' });
    monday = useWorkoutStore.getState().routine.monday;
    const updated = monday.exercises.find((e) => e.id === added.id);
    assert.equal(updated?.targetReps, '10–15');

    // Delete
    deleteExercise('monday', added.id);
    monday = useWorkoutStore.getState().routine.monday;
    assert.equal(monday.exercises.some((e) => e.id === added.id), false);
  });

  test('resets a day back to default', () => {
    const { addExercise, resetDayToDefault } = useWorkoutStore.getState();
    addExercise('tuesday', {
      name: 'Extra Hack Squats',
      muscleGroup: 'Legs',
      targetSets: 3,
      targetReps: '10',
    });
    resetDayToDefault('tuesday');
    const tuesday = useWorkoutStore.getState().routine.tuesday;
    assert.equal(tuesday.exercises.some((e) => e.name === 'Extra Hack Squats'), false);
  });

  test('handles rest timer actions', () => {
    const { startRestTimer, pauseRestTimer, tickRestTimer, resetRestTimer } = useWorkoutStore.getState();
    startRestTimer(90);
    let state = useWorkoutStore.getState();
    assert.equal(state.restTimer.durationSeconds, 90);
    assert.equal(state.restTimer.remainingSeconds, 90);
    assert.equal(state.restTimer.isRunning, true);

    tickRestTimer();
    state = useWorkoutStore.getState();
    assert.equal(state.restTimer.remainingSeconds, 89);

    pauseRestTimer();
    state = useWorkoutStore.getState();
    assert.equal(state.restTimer.isRunning, false);

    resetRestTimer();
    state = useWorkoutStore.getState();
    assert.equal(state.restTimer.remainingSeconds, 90);
    assert.equal(state.restTimer.isRunning, false);
  });
});
