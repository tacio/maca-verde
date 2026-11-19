import { describe, expect, it } from 'vitest';
import { emptyTemplate } from '../domain/plan';
import { buildRoutine, emptyRoutineDraft, newExercise, routineInUse, validateRoutine, type RoutineDraft } from './routineDraft';

const draft = (patch: Partial<RoutineDraft> = {}): RoutineDraft => ({ ...emptyRoutineDraft(), name: 'Evening rope', ...patch });

describe('custom routine validation', () => {
  it('accepts a simple routine', () => {
    expect(validateRoutine(draft())).toEqual([]);
  });

  it('needs a name, unique among routines (built-ins included)', () => {
    expect(validateRoutine(draft({ name: '  ' }))).toContain('name');
    expect(validateRoutine(draft({ name: 'x'.repeat(41) }))).toContain('name');
    expect(validateRoutine(draft({ name: 'daily micro-overload hiit (recommended)' }))).toContain('name_taken');
    const other = buildRoutine(draft({ name: 'Mine' }), 'c1');
    if (!other.ok) throw new Error('setup');
    expect(validateRoutine(draft({ name: 'mine ' }), [other.routine])).toContain('name_taken');
    // Editing itself is not a clash.
    expect(validateRoutine(draft({ id: 'c1', name: 'Mine' }), [other.routine])).toEqual([]);
  });

  it('checks rounds, rests and work in whole seconds', () => {
    expect(validateRoutine(draft({ rounds: 0 }))).toContain('rounds');
    expect(validateRoutine(draft({ rounds: 21 }))).toContain('rounds');
    expect(validateRoutine(draft({ roundRest: '1.5' }))).toContain('round_rest');
    expect(validateRoutine(draft({ roundRest: '0' }))).toEqual([]);
    const ex = newExercise();
    expect(validateRoutine(draft({ exercises: [{ ...ex, work: '4' }] }))).toContain('work');
    expect(validateRoutine(draft({ exercises: [{ ...ex, work: '601' }] }))).toContain('work');
    expect(validateRoutine(draft({ exercises: [{ ...ex, rest: '-1' }] }))).toContain('rest');
    expect(validateRoutine(draft({ exercises: [{ ...ex, exerciseId: 'nope' }] }))).toContain('exercise');
    expect(validateRoutine(draft({ exercises: [] }))).toContain('no_exercises');
  });

  it('builds a stored routine with an estimate', () => {
    const r = buildRoutine(
      draft({ rounds: 2, roundRest: '30', exercises: [{ ...newExercise('rope-boxer-skip-hiit'), work: '40', rest: '20' }] }),
      'custom-1',
    );
    expect(r.ok).toBe(true);
    if (!r.ok) return;
    expect(r.routine).toMatchObject({ id: 'custom-1', title: 'Evening rope', rounds: 2, roundRestSeconds: 30, prepSeconds: 10 });
    expect(r.routine.exercises).toEqual([{ exerciseId: 'rope-boxer-skip-hiit', workSeconds: 40, restSeconds: 20 }]);
    expect(r.routine.estimatedDurationMinutes).toBeGreaterThanOrEqual(1);
  });

  it('reports where a routine is still planned', () => {
    const plans = [{ day: 14356, updatedUnix: 0, items: [{ id: 'a', kind: 'workout' as const, routineId: 'c1', targets: {} }] }];
    expect(routineInUse('c1', { plans, template: emptyTemplate() }, 14355)).toBe('Planned on day 356');
    expect(routineInUse('c1', { plans, template: emptyTemplate() }, 14357)).toBeNull();
    const template = emptyTemplate();
    template[4] = [{ id: 'a', kind: 'workout', routineId: 'c1', targets: {} }];
    expect(routineInUse('c1', { plans: [], template }, 0)).toBe('Used in template slot 4');
  });
});
