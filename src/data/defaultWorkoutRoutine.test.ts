import { test, describe } from 'node:test';
import assert from 'node:assert/strict';
import { DEFAULT_WORKOUT_ROUTINE } from './defaultWorkoutRoutine';
import { DayOfWeek } from '../types/workout';

describe('DEFAULT_WORKOUT_ROUTINE', () => {
  const days: DayOfWeek[] = ['monday', 'tuesday', 'wednesday', 'thursday', 'friday', 'saturday', 'sunday'];

  test('contains all 7 days of the week', () => {
    days.forEach((day) => {
      assert.ok(DEFAULT_WORKOUT_ROUTINE[day], `Missing routine for ${day}`);
      assert.equal(DEFAULT_WORKOUT_ROUTINE[day].day, day);
    });
  });

  test('Monday has Upper Body A exercises with correct structure', () => {
    const monday = DEFAULT_WORKOUT_ROUTINE.monday;
    assert.equal(monday.isRestDay, false);
    assert.ok(monday.exercises.length >= 8);
    const pushups = monday.exercises.find((e) => e.name.toLowerCase().includes('push-ups'));
    assert.ok(pushups);
    assert.equal(pushups?.targetSets, 4);
  });

  test('Wednesday has active recovery walking note', () => {
    const wednesday = DEFAULT_WORKOUT_ROUTINE.wednesday;
    assert.equal(wednesday.isRestDay, true);
    assert.ok(wednesday.activityNote?.includes('walking'));
  });

  test('Friday has Core Finisher rounds', () => {
    const friday = DEFAULT_WORKOUT_ROUTINE.friday;
    assert.equal(friday.isRestDay, false);
    const finisher = friday.exercises.find(
      (e) => e.name.toLowerCase().includes('finisher') || e.muscleGroup.toLowerCase().includes('finisher')
    );
    assert.ok(finisher);
  });
});
