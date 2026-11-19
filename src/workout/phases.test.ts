import { describe, expect, it } from 'vitest';
import type { WorkoutRoutine } from '../domain/types';
import {
  buildPhases,
  displaySeconds,
  end,
  isFinished,
  nextLine,
  pause,
  plannedSeconds,
  progress,
  remainingMs,
  resume,
  startRun,
  summarize,
  tick,
} from './phases';

const routine = (over: Partial<WorkoutRoutine> = {}): WorkoutRoutine => ({
  id: 'r',
  title: 'R',
  subtitle: '',
  protocol: 'tabata',
  description: '',
  primaryGoal: 'belly_fat',
  exercises: [
    { exerciseId: 'rope-boxer-skip-hiit', workSeconds: 20, restSeconds: 10 },
    { exerciseId: 'door-bar-dead-hang', workSeconds: 30, restSeconds: 15 },
  ],
  rounds: 2,
  roundRestSeconds: 60,
  prepSeconds: 10,
  estimatedCalories: 100,
  estimatedDurationMinutes: 4,
  ...over,
});

const S = 1000;

describe('buildPhases', () => {
  it('prep → work/rest per exercise → round rest → … with no rest after the last exercise of a round', () => {
    const p = buildPhases(routine());
    expect(p.map((x) => `${x.kind}:${x.seconds}`)).toEqual([
      'prep:10',
      'work:20',
      'rest:10',
      'work:30',
      'roundRest:60',
      'work:20',
      'rest:10',
      'work:30',
    ]);
    // rests carry the exercise they lead into
    expect(p[2]).toMatchObject({ round: 1, index: 1, exerciseId: 'door-bar-dead-hang' });
    expect(p[4]).toMatchObject({ round: 2, index: 0, exerciseId: 'rope-boxer-skip-hiit' });
    expect(plannedSeconds(p)).toBe(190);
  });

  it('one round has no round rest; prep never below 5 s', () => {
    const p = buildPhases(routine({ rounds: 1, prepSeconds: 2 }));
    expect(p.map((x) => x.kind)).toEqual(['prep', 'work', 'rest', 'work']);
    expect(p[0].seconds).toBe(5);
  });

  it('an empty routine has no phases', () => {
    expect(buildPhases(routine({ exercises: [] }))).toEqual([]);
  });
});

describe('run', () => {
  const phases = buildPhases(routine());

  it('derives the remaining time from timestamps', () => {
    const r = startRun(phases, 1_000);
    expect(remainingMs(phases, r, 1_000)).toBe(10 * S);
    expect(remainingMs(phases, r, 1_000 + 3_400)).toBe(6_600);
    expect(displaySeconds(6_600)).toBe(7);
    expect(displaySeconds(10 * S)).toBe(10);
    expect(displaySeconds(1)).toBe(1);
  });

  it('completes phases when their time is up and carries the overflow (a late tick crosses several)', () => {
    const r0 = startRun(phases, 0);
    const a = tick(phases, r0, 9_999);
    expect(a.entered).toEqual([]);
    const b = tick(phases, r0, 10 * S + 250);
    expect(b.entered).toEqual([1]);
    expect(remainingMs(phases, b.run, 10 * S + 250)).toBe(20 * S - 250);
    // Backgrounded for 45 s: prep (10) + work (20) + rest (10) → 5 s into the dead hang.
    const c = tick(phases, r0, 45 * S);
    expect(c.entered).toEqual([1, 2, 3]);
    expect(c.run.index).toBe(3);
    expect(remainingMs(phases, c.run, 45 * S)).toBe(25 * S);
  });

  it('finishes exactly at the planned total', () => {
    const r = tick(phases, startRun(phases, 0), 190 * S);
    expect(isFinished(phases, r.run)).toBe(true);
    expect(r.entered[r.entered.length - 1]).toBe(phases.length);
    expect(r.run.since).toBeNull();
    expect(tick(phases, r.run, 500 * S).entered).toEqual([]);
  });

  it('pause freezes the remaining time; resume continues from it', () => {
    let r = startRun(phases, 0);
    r = pause(r, 4 * S);
    expect(remainingMs(phases, r, 100 * S)).toBe(6 * S);
    expect(tick(phases, r, 100 * S).entered).toEqual([]);
    r = resume(phases, r, 100 * S);
    expect(remainingMs(phases, r, 103 * S)).toBe(3 * S);
    expect(tick(phases, r, 106 * S).entered).toEqual([1]);
  });

  it('progress counts planned time behind us', () => {
    const r = startRun(phases, 0);
    expect(progress(phases, r, 0)).toBe(0);
    expect(progress(phases, tick(phases, r, 95 * S).run, 95 * S)).toBeCloseTo(0.5);
  });
});

describe('summarize', () => {
  const phases = buildPhases(routine());

  it('a full run: completedFull, all rounds, rope time and the longest hang', () => {
    const r = tick(phases, startRun(phases, 0), 190 * S).run;
    expect(summarize(phases, r, 2)).toEqual({
      activeSeconds: 190,
      roundsCompleted: 2,
      totalRounds: 2,
      completedFull: true,
      shortBy: null,
      ropeSeconds: 40,
      longestHangSeconds: 30,
      workFraction: 1,
    });
  });

  it('pauses are not active time', () => {
    let r = startRun(phases, 0);
    r = pause(r, 5 * S);
    r = resume(phases, r, 65 * S);
    r = tick(phases, r, 250 * S).run;
    expect(summarize(phases, r, 2)).toMatchObject({ activeSeconds: 190, completedFull: true });
  });

  it('ended early keeps real numbers and is never completedFull', () => {
    // 10 prep + 20 work + 10 rest + 30 hang + 15 into the round rest = 85 s
    const r = end(tick(phases, startRun(phases, 0), 85 * S).run, 85 * S);
    expect(summarize(phases, r, 2)).toMatchObject({
      activeSeconds: 85,
      roundsCompleted: 1,
      completedFull: false,
      shortBy: 'ended',
      ropeSeconds: 20,
      longestHangSeconds: 30,
    });
    expect(summarize(phases, r, 2).workFraction).toBeCloseTo(0.5);
  });

  it('ending during prep logs nothing done', () => {
    const r = end(startRun(phases, 0), 3 * S);
    expect(summarize(phases, r, 2)).toMatchObject({ activeSeconds: 3, roundsCompleted: 0, completedFull: false, workFraction: 0 });
  });

});

describe('nextLine', () => {
  const phases = buildPhases(routine());
  it('names what comes next', () => {
    expect(nextLine(phases, 0)).toBe('next: Boxer skip');
    expect(nextLine(phases, 1)).toBe('next: Dead hang');
    expect(nextLine(phases, 2)).toBe('next: Dead hang');
    expect(nextLine(phases, 4)).toBe('next: Round 2 · Boxer skip');
    expect(nextLine(phases, 7)).toBe('next: finish');
  });
});
