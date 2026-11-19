import { describe, expect, it } from 'vitest';
import { EMOTIONAL_SCENARIOS } from '../data/emotionalScenarios';
import {
  SIGH_CYCLES,
  SIGH_READY_MS,
  SIGH_TOTAL_MS,
  STEP_COPY,
  buildDrillLog,
  drillSteps,
  nextStep,
  pickScenario,
  replyOptions,
  sighAt,
} from './drill';

describe('steps', () => {
  it('runs elevate → freeze → sigh → scenario, or from freeze after a workout', () => {
    expect(drillSteps()).toEqual(['elevate', 'freeze', 'sigh', 'scenario']);
    expect(drillSteps('freeze')).toEqual(['freeze', 'sigh', 'scenario']);
    const s = drillSteps();
    expect(nextStep(s, 'elevate')).toBe('freeze');
    expect(nextStep(s, 'sigh')).toBe('scenario');
    expect(nextStep(s, 'scenario')).toBeNull();
  });

  it('each step has one short instruction line, a why and words to say', () => {
    for (const c of Object.values(STEP_COPY)) {
      expect(c.line.length).toBeLessThanOrEqual(70);
      expect(c.why.length).toBeGreaterThan(c.line.length);
      expect(c.say).toBeTruthy();
    }
  });
});

describe('sighAt', () => {
  it('lead-in, then double inhale + long exhale, for each cycle, then done', () => {
    expect(sighAt(0)).toEqual({ phase: 'ready', cycle: 0 });
    expect(sighAt(SIGH_READY_MS)).toEqual({ phase: 'inhale', cycle: 1 });
    expect(sighAt(SIGH_READY_MS + 2500)).toEqual({ phase: 'topup', cycle: 1 });
    expect(sighAt(SIGH_READY_MS + 3000)).toEqual({ phase: 'exhale', cycle: 1 });
    expect(sighAt(SIGH_READY_MS + 9000)).toEqual({ phase: 'inhale', cycle: 2 });
    expect(sighAt(SIGH_TOTAL_MS - 1)).toEqual({ phase: 'exhale', cycle: SIGH_CYCLES });
    expect(sighAt(SIGH_TOTAL_MS)).toEqual({ phase: 'done', cycle: SIGH_CYCLES });
  });
});

describe('scenario', () => {
  it('avoids repeating the last scenario', () => {
    const last = EMOTIONAL_SCENARIOS[0].id;
    for (const r of [0, 0.3, 0.99]) expect(pickScenario(last, () => r).id).not.toBe(last);
    expect(pickScenario(undefined, () => 0).id).toBe(last);
  });

  it('offers the impulsive and the paused reply in either order', () => {
    const s = EMOTIONAL_SCENARIOS[0];
    const a = replyOptions(s, () => 0.1);
    const b = replyOptions(s, () => 0.9);
    expect(a.map((o) => o.paused)).toEqual([false, true]);
    expect(b.map((o) => o.paused)).toEqual([true, false]);
    expect(a.find((o) => o.paused)!.text).toBe(s.prefrontalResponse);
  });
});

describe('buildDrillLog', () => {
  it('after a workout: elevated pulse, freeze time, scenario, choice', () => {
    expect(buildDrillLog({ afterWorkout: true, freezeSeconds: 19.6, scenarioId: 'x', pausedReply: true }, 'd1', 500)).toEqual({
      id: 'd1',
      unix: 500,
      drillType: 'high_hr_pause',
      heartRateState: 'elevated_post_hiit',
      pauseSecondsAchieved: 20,
      scenarioId: 'x',
      impulseResisted: true,
    });
  });

  it('on its own: resting baseline; choosing the impulse is recorded honestly', () => {
    expect(buildDrillLog({ afterWorkout: false, freezeSeconds: 8, pausedReply: false }, 'd', 1)).toMatchObject({
      heartRateState: 'resting',
      pauseSecondsAchieved: 8,
      impulseResisted: false,
    });
  });
});
