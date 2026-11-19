import { describe, expect, it } from 'vitest';
import { DEFAULT_CONFIG } from '../time/daykeep';
import { WORKOUT_ROUTINES } from '../data/routines';
import { OverloadEngine } from '../services/overloadEngine';
import type { UserFitnessProfile } from '../types/fitness';
import { dayStartUnix, validatePlanItems } from './plan';
import {
  POSTURE_ROUTINE_ID,
  ROPE_ROUTINE_ID,
  TABATA_ROUTINE_ID,
  focusOfDay,
  lastActual,
  level,
  overloadMultiplier,
  personalRecords,
  scaleRoutine,
  suggestDay,
  suggestTargets,
} from './engine';
import type { WorkoutSession } from './types';

const CFG = DEFAULT_CONFIG;
let seq = 0;
function s(over: Partial<WorkoutSession> = {}): WorkoutSession {
  const endUnix = over.endUnix ?? 1000 + seq;
  return {
    id: `s${seq++}`,
    routineId: TABATA_ROUTINE_ID,
    startUnix: endUnix - 600,
    endUnix,
    completedFull: true,
    totalSeconds: 600,
    roundsCompleted: 2,
    totalRounds: 2,
    rpe: 6,
    neck: 3,
    estimatedCalories: 200,
    ...over,
  };
}

/** The legacy App.handleSaveWorkoutLog fold, verbatim. */
function legacyFold(rpes: number[]) {
  let m = 1.0;
  let lvl = 1;
  let total = 0;
  for (const rpe of rpes) {
    m = Number(Math.min(1.4, m + (rpe >= 8 ? 0.02 : 0.01)).toFixed(2));
    lvl = Math.min(10, Math.floor((total + 1) / 5) + 1);
    total++;
  }
  return { m, lvl };
}

describe('multiplier and level match the legacy formulas', () => {
  it.each([[[]], [[5]], [[8]], [[7, 8, 9, 3]], [Array.from({ length: 30 }, (_, i) => (i % 3 ? 8 : 5))], [Array.from({ length: 60 }, () => 9)]])(
    'rpes %j',
    (rpes) => {
      const sessions = rpes.map((rpe, i) => s({ rpe, endUnix: 5000 - i * 10 })).reverse();
      const legacy = legacyFold(rpes);
      expect(overloadMultiplier(sessions)).toBe(legacy.m);
      expect(level(sessions)).toBe(rpes.length ? legacy.lvl : 1);
    },
  );
  it('caps at 1.4 and level 10', () => {
    const many = Array.from({ length: 100 }, (_, i) => s({ rpe: 9, endUnix: i }));
    expect(overloadMultiplier(many)).toBe(1.4);
    expect(level(many)).toBe(10);
    expect(level(many.slice(0, 4))).toBe(1);
    expect(level(many.slice(0, 5))).toBe(2);
  });
});

describe('personal records', () => {
  it('max hang, max rope turns, max rounds, lowest neck', () => {
    expect(personalRecords([])).toEqual({ maxHangSeconds: 0, maxRopeTurns: 0, maxRounds: 0, lowestNeck: null });
    const r = personalRecords([s({ hangSeconds: 40, neck: 4 }), s({ ropeTurns: 300, roundsCompleted: 3, neck: 1 }), s({ hangSeconds: 35, neck: 5 })]);
    expect(r).toEqual({ maxHangSeconds: 40, maxRopeTurns: 300, maxRounds: 3, lowestNeck: 1 });
  });
});

describe('scaleRoutine', () => {
  it('equals legacy scaleRoutineForUser', () => {
    for (const routine of WORKOUT_ROUTINES) {
      for (const [m, lvl] of [[1, 1], [1.07, 2], [1.25, 5], [1.4, 10]]) {
        const profile = { overloadMultiplier: m, level: lvl } as UserFitnessProfile;
        expect(scaleRoutine(routine, m, lvl)).toEqual(OverloadEngine.scaleRoutineForUser(routine, profile));
      }
    }
  });
});

describe('suggestions', () => {
  it('rotates by day number like the legacy % 3 (1 posture, 2 Tabata, 0 rope)', () => {
    expect(focusOfDay(14356)).toBe('posture'); // 14356 % 3 = 1
    expect(focusOfDay(14357)).toBe('tabata');
    expect(focusOfDay(14358)).toBe('rope');
    expect(suggestDay(14356, [], CFG)[0]).toMatchObject({ routineId: POSTURE_ROUTINE_ID, targets: { hangSeconds: 25 } });
    expect(suggestDay(14357, [], CFG)[0]).toMatchObject({ routineId: TABATA_ROUTINE_ID, targets: { rounds: 2 } });
    expect(suggestDay(14358, [], CFG)[0]).toMatchObject({ routineId: ROPE_ROUTINE_ID, targets: { ropeTurns: 150 } });
  });

  it('adds 2 mood checks and 1 drill and is a valid plan', () => {
    const items = suggestDay(14357, [], CFG);
    expect(items.slice(1)).toEqual([
      { id: '14357-1', kind: 'mood', count: 2 },
      { id: '14357-2', kind: 'drill', count: 1 },
    ]);
    expect(validatePlanItems(items)).toEqual([]);
  });

  it('hang target = clamp(record + 2, 25, 90)', () => {
    expect(suggestTargets(POSTURE_ROUTINE_ID, [s({ hangSeconds: 20 })])).toEqual({ hangSeconds: 25 });
    expect(suggestTargets(POSTURE_ROUTINE_ID, [s({ hangSeconds: 50 }), s({ hangSeconds: 40 })])).toEqual({ hangSeconds: 52 });
    expect(suggestTargets(POSTURE_ROUTINE_ID, [s({ hangSeconds: 100 })])).toEqual({ hangSeconds: 90 });
  });

  it('rope target = max(150, (full rope sessions + 1) × 25 + 100)', () => {
    const rope = (completedFull = true) => s({ routineId: ROPE_ROUTINE_ID, completedFull, ropeTurns: 200 });
    expect(suggestTargets(ROPE_ROUTINE_ID, [rope(), rope()])).toEqual({ ropeTurns: 175 });
    expect(suggestTargets(ROPE_ROUTINE_ID, [rope(), rope(), rope(), rope(), rope(false)])).toEqual({ ropeTurns: 225 });
  });

  it('only sessions that ended before the day inform its suggestion', () => {
    const start = dayStartUnix(14356, CFG);
    expect(suggestDay(14356, [s({ hangSeconds: 60, endUnix: start - 1 })], CFG)[0]).toMatchObject({ targets: { hangSeconds: 62 } });
    expect(suggestDay(14356, [s({ hangSeconds: 60, endUnix: start })], CFG)[0]).toMatchObject({ targets: { hangSeconds: 25 } });
  });

  it('other routines get their own rounds', () => {
    expect(suggestTargets('emom-rope-door-bar-hybrid', [])).toEqual({ rounds: 3 });
    expect(suggestTargets('unknown', [])).toEqual({});
  });
});

describe('lastActual (P3)', () => {
  it('latest session by end moment that recorded the metric, optionally per routine', () => {
    const h = [
      s({ endUnix: 300, hangSeconds: 38, routineId: POSTURE_ROUTINE_ID }),
      s({ endUnix: 100, hangSeconds: 42, routineId: POSTURE_ROUTINE_ID }),
      s({ endUnix: 400, roundsCompleted: 1, completedFull: false }),
      s({ endUnix: 200, ropeTurns: 320, routineId: ROPE_ROUTINE_ID }),
    ];
    expect(lastActual('hangSeconds', undefined, h)).toBe(38);
    expect(lastActual('rounds', undefined, h)).toBe(1);
    expect(lastActual('rounds', POSTURE_ROUTINE_ID, h)).toBe(2);
    expect(lastActual('ropeTurns', POSTURE_ROUTINE_ID, h)).toBeNull();
    expect(lastActual('ropeTurns', undefined, h)).toBe(320);
    expect(lastActual('totalSeconds', undefined, [])).toBeNull();
  });
});
