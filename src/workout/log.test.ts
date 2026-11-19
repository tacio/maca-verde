import { describe, expect, it } from 'vitest';
import { WORKOUT_ROUTINES } from '../data/routines';
import { ROPE_ROUTINE_ID, POSTURE_ROUTINE_ID, TABATA_ROUTINE_ID } from '../domain/engine';
import type { WorkoutItem, WorkoutSession } from '../domain/types';
import { sessionSatisfies } from '../domain/record';
import { DEFAULT_CONFIG } from '../time/daykeep';
import {
  DEFAULT_NECK,
  DEFAULT_RPE,
  buildSession,
  fieldHint,
  initialDraft,
  logFields,
  logHeader,
  parseCount,
  recordsBeaten,
  shortNote,
  simulatedResult,
  type WorkoutResult,
} from './log';

const routine = (id: string) => WORKOUT_ROUTINES.find((r) => r.id === id)!;
const rope: WorkoutItem = { id: '14355-0', kind: 'workout', routineId: ROPE_ROUTINE_ID, targets: { ropeTurns: 150 } };
const tabata: WorkoutItem = { id: 'w', kind: 'workout', routineId: TABATA_ROUTINE_ID, targets: { rounds: 2 } };

const result = (over: Partial<WorkoutResult> = {}): WorkoutResult => ({
  itemId: 'w',
  routineId: TABATA_ROUTINE_ID,
  startUnix: 1000,
  endUnix: 1800,
  activeSeconds: 720,
  roundsCompleted: 2,
  totalRounds: 2,
  completedFull: true,
  shortBy: null,
  ropeSeconds: 100,
  longestHangSeconds: 20,
  workFraction: 1,
  estimatedCalories: 150,
  ...over,
});

describe('log fields', () => {
  it('asks only for what the item targets', () => {
    expect(logFields(tabata)).toEqual([]);
    expect(logFields(rope)).toEqual(['ropeTurns']);
    expect(logFields({ ...rope, targets: { hangSeconds: 30, ropeTurns: 200 } })).toEqual(['ropeTurns', 'hangSeconds']);
  });

  it('pre-fills from the timer: 2.2 turns per rope second, the longest hang', () => {
    expect(initialDraft(result(), rope)).toEqual({ rpe: DEFAULT_RPE, neck: DEFAULT_NECK, fields: { ropeTurns: '220' } });
    expect(initialDraft(result(), { ...rope, routineId: POSTURE_ROUTINE_ID, targets: { hangSeconds: 30 } }).fields).toEqual({ hangSeconds: '20' });
  });

  it('parses whole counts only', () => {
    expect(parseCount('360')).toBe(360);
    expect(parseCount(' 0 ')).toBe(0);
    for (const bad of ['', '-1', '3.5', 'abc', undefined]) expect(parseCount(bad)).toBeNull();
  });
});

describe('buildSession', () => {
  it('builds the session from the timer and the inputs', () => {
    const s = buildSession(result({ itemId: rope.id, routineId: ROPE_ROUTINE_ID }), { rpe: 8, neck: 1, fields: { ropeTurns: '360' } }, 's1');
    expect(s).toEqual({
      id: 's1',
      routineId: ROPE_ROUTINE_ID,
      startUnix: 1000,
      endUnix: 1800,
      completedFull: true,
      totalSeconds: 720,
      roundsCompleted: 2,
      totalRounds: 2,
      ropeTurns: 360,
      rpe: 8,
      neck: 1,
      estimatedCalories: 150,
    });
    expect(sessionSatisfies(s!, { ...rope, targets: { ropeTurns: 350 } })).toBe(true);
  });

  it('leaves out fields the item does not ask for, and refuses invalid input', () => {
    const s = buildSession(result(), { rpe: 7, neck: 2, fields: {} }, 's');
    expect(s).not.toHaveProperty('ropeTurns');
    expect(s).not.toHaveProperty('hangSeconds');
    expect(buildSession(result(), { rpe: 7, neck: 2, fields: { ropeTurns: 'x' } }, 's')).toBeNull();
  });

  it('an early session keeps its real numbers and never satisfies the item', () => {
    const s = buildSession(result({ completedFull: false, shortBy: 'ended', roundsCompleted: 1, activeSeconds: 300 }), { rpe: 7, neck: 2, fields: {} }, 's')!;
    expect(s).toMatchObject({ completedFull: false, roundsCompleted: 1, totalSeconds: 300 });
    expect(sessionSatisfies(s, { ...tabata, targets: {} })).toBe(false);
  });

  it('clamps the scales', () => {
    expect(buildSession(result(), { rpe: 12, neck: -3, fields: {} }, 's')).toMatchObject({ rpe: 10, neck: 0 });
  });
});

describe('copy', () => {
  it('header: name, done/ended early, seconds, rounds', () => {
    expect(logHeader('Tabata', result(), DEFAULT_CONFIG)).toBe('Tabata done · 720 s · 2/2 rounds');
    expect(logHeader('Tabata', result({ completedFull: false, activeSeconds: 270, roundsCompleted: 0 }), DEFAULT_CONFIG)).toBe(
      'Tabata ended early · 270 s · 0/2 rounds',
    );
  });

  it('a calm note only when the item stays open', () => {
    expect(shortNote(result())).toBeNull();
    expect(shortNote(result({ completedFull: false, shortBy: 'ended' }))).toBe('Ended early — the item stays open; a full session completes it.');
  });

  it('hint shows the last actual and the target (P3)', () => {
    expect(fieldHint(320, 350)).toBe('last 320 · target 350');
    expect(fieldHint(null, 350)).toBe('no data yet · target 350');
    expect(fieldHint(38, 40, ' s')).toBe('last 38 s · target 40 s');
  });
});

describe('simulatedResult (dev scenarios)', () => {
  it('full and early runs of a real routine', () => {
    const full = simulatedResult(rope, routine(ROPE_ROUTINE_ID), 'full', 10_000);
    expect(full).toMatchObject({ completedFull: true, roundsCompleted: 3, totalRounds: 3, endUnix: 10_000, workFraction: 1 });
    const early = simulatedResult(rope, routine(ROPE_ROUTINE_ID), 'early', 10_000);
    expect(early.completedFull).toBe(false);
    expect(early.activeSeconds).toBeLessThan(full.activeSeconds);
  });
});

describe('records beaten (inline badge)', () => {
  const past = (over: Partial<WorkoutSession>): WorkoutSession => ({
    id: 'p', routineId: ROPE_ROUTINE_ID, startUnix: 0, endUnix: 600, completedFull: true, totalSeconds: 600,
    roundsCompleted: 2, totalRounds: 2, rpe: 7, neck: 2, estimatedCalories: 100, ...over,
  });
  const draft = (fields: Record<string, string>) => ({ rpe: 7, neck: 2, fields });

  it('flags only values above an existing record', () => {
    const history = [past({ ropeTurns: 300, hangSeconds: 40 })];
    expect(recordsBeaten(result({ roundsCompleted: 3 }), draft({ ropeTurns: '301', hangSeconds: '40' }), history)).toEqual(['rounds', 'ropeTurns']);
    expect(recordsBeaten(result({ roundsCompleted: 2 }), draft({ ropeTurns: '300', hangSeconds: '41' }), history)).toEqual(['hangSeconds']);
  });

  it('needs a record to beat, and a valid number', () => {
    expect(recordsBeaten(result({ roundsCompleted: 5 }), draft({ ropeTurns: '500' }), [])).toEqual([]);
    expect(recordsBeaten(result(), draft({ ropeTurns: '9x' }), [past({ ropeTurns: 10 })])).toEqual([]);
  });
});
