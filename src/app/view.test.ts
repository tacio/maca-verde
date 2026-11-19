import { describe, expect, it } from 'vitest';
import { DEFAULT_CONFIG } from '../time/daykeep';
import { computeRecord, type ItemProgress } from '../domain/record';
import { POSTURE_ROUTINE_ID, ROPE_ROUTINE_ID, TABATA_ROUTINE_ID } from '../domain/engine';
import type { PlanItem } from '../domain/types';
import { buildFixture } from '../dev/fixtures';
import { actionText, classifyDay, daySummary, itemText, lastHundredGrid, nextItem, progressText, targetsText } from './view';

const cfg = DEFAULT_CONFIG;
const tabata: PlanItem = { id: 'a', kind: 'workout', routineId: TABATA_ROUTINE_ID, targets: { rounds: 2 } };
const posture: PlanItem = { id: 'b', kind: 'workout', routineId: POSTURE_ROUTINE_ID, targets: { hangSeconds: 40 } };
const rope: PlanItem = { id: 'c', kind: 'workout', routineId: ROPE_ROUTINE_ID, targets: { ropeTurns: 350 } };
const silence: PlanItem = { id: 'd', kind: 'rest', restKind: 'silence', durationSeconds: 900 };
const mood: PlanItem = { id: 'e', kind: 'mood', count: 2 };
const drill: PlanItem = { id: 'f', kind: 'drill', count: 1 };

describe('item text', () => {
  it('describes each kind in one short line', () => {
    expect(itemText(tabata, cfg)).toBe('Tabata · 2 rounds');
    expect(itemText(posture, cfg)).toBe('Posture · hang 40 s');
    expect(itemText(rope, cfg)).toBe('Rope · 350 turns');
    expect(itemText(silence, cfg)).toBe('Rest · silence 900 s');
    expect(itemText(mood, cfg)).toBe('2 mood checks');
    expect(itemText(drill, cfg)).toBe('Pause drill');
  });

  it('uses seconds for a session total and singular units', () => {
    expect(targetsText({ rounds: 1, totalSeconds: 5400 }, cfg)).toBe('1 round · 5400 s');
    expect(itemText({ id: 'x', kind: 'workout', routineId: 'unknown', targets: {} }, cfg)).toBe('Workout');
  });

  it('shows progress on counted items', () => {
    const p = (item: PlanItem, current: number, required: number): ItemProgress => ({
      item,
      current,
      required,
      satisfied: current >= required,
    });
    expect(progressText(p(mood, 1, 2), cfg)).toBe('Mood check 1/2');
    expect(progressText(p(mood, 5, 2), cfg)).toBe('Mood check 2/2');
    expect(progressText(p(drill, 0, 1), cfg)).toBe('Pause drill');
    expect(progressText(p(tabata, 0, 1), cfg)).toBe('Tabata · 2 rounds');
  });

  it('summarizes a day: main items first, counts after', () => {
    expect(daySummary([tabata, mood, drill], cfg)).toEqual({ title: 'Tabata · 2 rounds', meta: '2 mood checks · pause drill' });
    expect(daySummary([silence, mood], cfg)).toEqual({ title: 'Rest · silence 900 s', meta: '2 mood checks' });
    expect(daySummary([mood], cfg)).toEqual({ title: '2 mood checks', meta: '' });
  });
});

describe('next item', () => {
  const p = (item: PlanItem, satisfied: boolean): ItemProgress => ({ item, satisfied, current: +satisfied, required: 1 });
  it('prefers the first undone workout, then the first undone item', () => {
    expect(nextItem([p(mood, false), p(tabata, false)])?.item).toBe(tabata);
    expect(nextItem([p(mood, false), p(tabata, true), p(drill, false)])?.item).toBe(mood);
    expect(nextItem([p(tabata, true)])).toBeUndefined();
  });
  it('labels the action', () => {
    expect(actionText(tabata)).toBe('Start Tabata');
    expect(actionText(silence)).toBe('Start silence');
    expect(actionText(mood)).toBe('Check in');
  });
});

describe('100-day grid', () => {
  it('classifies done, kept, missed, today, future and outside days', () => {
    // Setup on 14339, record from 14340; 14352 missed (kept by a reserve), 14353–54 missed (broken).
    const f = buildFixture({ history: '.' + 'D'.repeat(12) + 'MMM' + 'T', today: 14355 });
    const record = computeRecord(f.data, f.now, f.config);
    expect(classifyDay(14339, record)).toBe('outside');
    expect(classifyDay(14340, record)).toBe('done');
    expect(classifyDay(14352, record)).toBe('kept');
    expect(classifyDay(14353, record)).toBe('missed');
    expect(classifyDay(14355, record)).toBe('today');
    expect(classifyDay(14356, record)).toBe('future');
  });

  it('lays out 10 cycles × 10 days ending with the cycle holding today', () => {
    const f = buildFixture({ history: '.DDT', today: 14355 });
    const grid = lastHundredGrid(computeRecord(f.data, f.now, f.config));
    expect(grid).toHaveLength(10);
    expect(grid[0].cycle).toBe(1426);
    expect(grid[9].cycle).toBe(1435);
    expect(grid[9].cells.map((c) => c.day)).toEqual([14350, 14351, 14352, 14353, 14354, 14355, 14356, 14357, 14358, 14359]);
    expect(grid[9].cells.map((c) => c.kind)).toEqual([
      'outside', 'outside', 'outside', 'done', 'done', 'today', 'future', 'future', 'future', 'future',
    ]);
  });

  it('treats a missing record as outside', () => {
    const f = buildFixture({ history: '.', today: 14355 });
    const record = computeRecord({ ...f.data, plans: [], cycles: [] }, f.now, f.config);
    expect(classifyDay(14355, record)).toBe('outside');
  });
});
