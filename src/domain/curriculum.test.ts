import { describe, expect, it } from 'vitest';
import { DEFAULT_CONFIG } from '../time/daykeep';
import { CURRICULUM } from '../data/lessons';
import { WORKOUT_ROUTINES } from '../data/routines';
import { dayStartUnix } from './plan';
import { findRoutine } from './engine';
import {
  basicsCount,
  basicsExercises,
  basicsId,
  basicsRoutine,
  curriculumComplete,
  knownBefore,
  knownPrefix,
  nextLesson,
  unknownExercises,
} from './curriculum';
import type { DayPlan } from './types';

const cfg = DEFAULT_CONFIG;
const at = (day: number, frac: number) => dayStartUnix(day, cfg) + Math.floor(frac * cfg.dayLength);
const learnPlan = (day: number, skillId: string): DayPlan => ({ day, items: [{ id: `${day}-0`, kind: 'learn', skillId }], updatedUnix: 0 });

describe('knownBefore', () => {
  it('counts lessons planned on earlier days, not the same day', () => {
    const plans = [learnPlan(14356, 'chin-tuck'), learnPlan(14357, 'jumping-jacks')];
    expect([...knownBefore(14357, plans, [], cfg)]).toEqual(['chin-tuck']);
    expect([...knownBefore(14358, plans, [], cfg)].sort()).toEqual(['chin-tuck', 'jumping-jacks']);
  });

  it('counts lessons logged before the day starts', () => {
    const lessons = [{ id: 'l', skillId: 'squat', unix: at(14356, 0.5) }];
    expect(knownBefore(14356, [], lessons, cfg).has('squat')).toBe(false);
    expect(knownBefore(14357, [], lessons, cfg).has('squat')).toBe(true);
  });
});

describe('order', () => {
  it('next lesson and known prefix follow the curriculum', () => {
    expect(nextLesson(new Set())).toBe('chin-tuck');
    expect(nextLesson(new Set(['chin-tuck']))).toBe('jumping-jacks');
    expect(knownPrefix(new Set(['chin-tuck', 'door-bar-dead-hang']))).toBe(1);
    expect(curriculumComplete(new Set(CURRICULUM))).toBe(true);
    expect(nextLesson(new Set(CURRICULUM))).toBeUndefined();
  });
});

describe('Basics workouts (04-curriculum §4)', () => {
  it('matches the documented examples', () => {
    expect(basicsExercises(1)).toEqual(['chin-tuck']);
    expect(basicsExercises(2)).toEqual(['chin-tuck', 'jumping-jacks']);
    expect(basicsExercises(6)).toEqual(['chin-tuck', 'jumping-jacks', 'door-bar-dead-hang', 'high-plank', 'rope-bounce', 'cobra-lift']);
    // Day 11: chin tuck and cobra lift left with cobra & chin tuck; jumping jacks and dead hang fell off the 6.
    expect(basicsExercises(10)).toEqual(['high-plank', 'rope-bounce', 'chin-tuck-cobra-hold', 'high-knees', 'downward-dog', 'door-bar-scapular-pull']);
  });

  it('keeps routine exercises after a combination uses them', () => {
    // Scapular pulls (10) are built from dead hang (3); dead hang stays until the cap pushes it out.
    expect(basicsExercises(10)).not.toContain('chin-tuck');
    expect(basicsExercises(9)).toContain('door-bar-dead-hang');
    expect(basicsExercises(11)).not.toContain('rope-bounce'); // boxer skip replaces it
  });

  it('is deterministic, never over 6 exercises, 20/20 s, 2 rounds, resolved by findRoutine', () => {
    for (let n = 1; n <= CURRICULUM.length; n++) {
      const r = basicsRoutine(n);
      expect(r.exercises.length).toBeGreaterThan(0);
      expect(r.exercises.length).toBeLessThanOrEqual(6);
      expect(r.exercises.every((e) => e.workSeconds === 20 && e.restSeconds === 20)).toBe(true);
      expect(r.rounds).toBe(2);
      expect(findRoutine(basicsId(n))).toEqual(r);
    }
    expect(basicsCount('basics:0')).toBeUndefined();
    expect(basicsCount(`basics:${CURRICULUM.length + 1}`)).toBeUndefined();
    expect(findRoutine('basics:x')).toBeUndefined();
  });

  it('only uses exercises learned before', () => {
    for (let n = 1; n <= CURRICULUM.length; n++) {
      expect(unknownExercises(basicsRoutine(n), new Set(CURRICULUM.slice(0, n)))).toEqual([]);
    }
  });
});

describe('unknownExercises', () => {
  it('lists taught exercises not known yet, once each', () => {
    const tabata = WORKOUT_ROUTINES.find((r) => r.id === 'tabata-belly-shred')!;
    expect(unknownExercises(tabata, new Set(CURRICULUM))).toEqual([]);
    expect(unknownExercises(tabata, new Set())[0]).toBe('rope-speed-sprint-tabata');
    expect(unknownExercises({ exercises: [{ exerciseId: 'x', workSeconds: 1, restSeconds: 1 }] }, new Set())).toEqual([]);
  });
});
