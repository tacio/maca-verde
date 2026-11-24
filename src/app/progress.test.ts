import { describe, expect, it } from 'vitest';
import { computeRecord } from '../domain/record';
import { dayStartUnix } from '../domain/plan';
import { buildFixture } from '../dev/fixtures';
import type { MoodCheck, WorkoutSession } from '../domain/types';
import { DEFAULT_CONFIG } from '../time/daykeep';
import { formatUnit } from '../ui/unit';
import { dayDetail, historyRows, moodTrend, neckTrend, trendAverage, trendDays, trendLabel, valenceWord } from './progress';
import { isCleanCycle, lastHundredGrid } from './view';

const cfg = DEFAULT_CONFIG;
const at = (day: number, frac: number) => dayStartUnix(day, cfg) + Math.floor(frac * cfg.dayLength);

describe('clean cycles', () => {
  // Record from 14330: cycle 1433 all done, 1434 has a protected miss, 1435 is today's.
  const f = buildFixture({ history: '.' + 'D'.repeat(10) + 'DDDMDDDDDD' + 'DDDDD' + 'T', today: 14355 });
  const record = computeRecord(f.data, f.now, f.config);

  it('marks a cycle whose 10 days were all done', () => {
    expect(isCleanCycle(1433, record)).toBe(true);
    const row = lastHundredGrid(record).find((r) => r.cycle === 1433)!;
    expect(row.clean).toBe(true);
  });

  it('never counts a protected (kept) day as clean', () => {
    expect(record.protectedDays).toEqual([14343]);
    expect(isCleanCycle(1434, record)).toBe(false);
  });

  it('needs all 10 days in the record and closed', () => {
    expect(isCleanCycle(1435, record)).toBe(false); // today and future days
    expect(isCleanCycle(1432, record)).toBe(false); // before the record
  });
});

describe('trends', () => {
  const session = (id: string, day: number, neck: number): WorkoutSession => ({
    id, routineId: 'x', startUnix: at(day, 0.4) - 600, endUnix: at(day, 0.4), completedFull: true,
    totalSeconds: 600, roundsCompleted: 1, totalRounds: 1, rpe: 0.7, neck, estimatedCalories: 0,
  });
  const moodOn = (id: string, day: number, valence: MoodCheck['valence']): MoodCheck => ({
    id, unix: at(day, 0.3), valence, halt: { hungry: false, angry: false, lonely: false, tired: false },
  });

  it('covers the last 10 days ending today, oldest first', () => {
    expect(trendDays(100)).toEqual([91, 92, 93, 94, 95, 96, 97, 98, 99, 100]);
  });

  it('averages neck tension per day and leaves empty days null', () => {
    const t = neckTrend([session('a', 100, 0.2), session('b', 100, 0.35), session('c', 95, 0.5), session('d', 90, 0.9)], 100, cfg);
    expect(t).toHaveLength(10);
    expect(t[9]).toEqual({ day: 100, value: 0.28 });
    expect(t[4]).toEqual({ day: 95, value: 0.5 });
    expect(t.filter((p) => p.value === null)).toHaveLength(8); // day 90 is outside the window
    expect(trendAverage(t, 2)).toBe(0.39);
  });

  it('scores mood valence, unpleasant moods alike', () => {
    const t = moodTrend([moodOn('a', 100, 'great'), moodOn('b', 100, 'anxious'), moodOn('c', 99, 'good')], 100, cfg);
    expect(t[9].value).toBe(2.5);
    expect(t[8].value).toBe(3);
    expect(valenceWord(trendAverage(t))).toBe('Good');
    expect(valenceWord(null)).toBe('—');
  });

  it('has a text alternative naming each day', () => {
    const t = neckTrend([session('a', 14355, 0.2)], 14355, cfg, 2);
    expect(trendLabel('Neck tension', t, formatUnit)).toBe('Neck tension, last 2 days: 354 none, 355 .20');
  });
});

describe('history', () => {
  const f = buildFixture({ history: '.' + 'D'.repeat(13) + 'Mm' + 'P', today: 14355 });
  const record = computeRecord(f.data, f.now, f.config);

  it('lists record days newest first, with progress and reasons', () => {
    const rows = historyRows(record, cfg);
    expect(rows[0]).toMatchObject({ day: 14355, kind: 'today', title: 'Today · 1 of 3 done' });
    expect(rows[1]).toMatchObject({ day: 14354, kind: 'missed', meta: 'Reason still to write' });
    expect(rows[2]).toMatchObject({ day: 14353, kind: 'kept', title: 'Missed · streak kept · 0 of 3 done', meta: 'Time · “Long day at work”' });
    expect(rows[3]).toMatchObject({ day: 14352, kind: 'done', title: 'Done' });
    expect(rows.at(-1)!.day).toBe(14340);
    expect(rows).toHaveLength(16);
  });

  it('is empty before the record starts', () => {
    const w = buildFixture({ history: '.', today: 14355 });
    expect(historyRows(computeRecord(w.data, w.now, w.config), cfg)).toEqual([]);
  });

  it('summarizes one day: plan, sessions in seconds, checks, drills', () => {
    const d = dayDetail(14352, f.data, record, cfg);
    expect(d.status).toBe('Done');
    expect(d.items.every((i) => i.done)).toBe(true);
    expect(d.sessions).toHaveLength(1);
    expect(d.sessions[0].title).toMatch(/ · \d+ s$/);
    expect(d.sessions[0].meta).toMatch(/^\.\d{4} · /);
    expect(d.moods).toHaveLength(2);
    expect(d.drills[0].meta).toContain('5 s pause');
    expect(d.justification).toBeUndefined();
  });

  it('shows a missed day with its reason', () => {
    const d = dayDetail(14353, f.data, record, cfg);
    expect(d.status).toBe('Missed · streak kept · 0 of 3 done');
    expect(d.items.map((i) => i.done)).toEqual([false, false, false]);
    expect(d.items[1].text).toBe('Mood check 1/2');
    expect(d.justification).toEqual({ reason: 'Time', text: 'Long day at work' });
    expect(d.moods).toHaveLength(1);
  });
});
