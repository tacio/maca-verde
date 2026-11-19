import { describe, expect, it } from 'vitest';
import { DEFAULT_CONFIG, parseDate, type DayConfig } from '../time/daykeep';
import {
  approveCycle,
  canEditDay,
  coveredDays,
  dayAt,
  dayStartUnix,
  emptyTemplate,
  isDayPlanned,
  isOnTime,
  prefillCycle,
  saveDayPlan,
  slotOf,
  templateFromPlans,
  validatePlanItems,
} from './plan';
import type { DayPlan, PlanItem } from './types';

const CFG3: DayConfig = { epoch: parseDate('2000-01-01 03:00 -0300')!, dayLength: 86400 };
const at = (day: number, frac: number, cfg: DayConfig = DEFAULT_CONFIG) =>
  dayStartUnix(day, cfg) + Math.floor(frac * cfg.dayLength);

const items = (day: number): PlanItem[] => [
  { id: `${day}-0`, kind: 'workout', routineId: 'tabata-belly-shred', targets: { rounds: 2 } },
  { id: `${day}-1`, kind: 'mood', count: 2 },
];
const plansFor = (days: number[], updatedUnix = 0): DayPlan[] => days.map((day) => ({ day, items: items(day), updatedUnix }));
const cycleDaysOf = (c: number) => Array.from({ length: 10 }, (_, i) => c * 10 + i);

describe('validatePlanItems', () => {
  it('accepts a normal plan, rest-only days and workouts without targets', () => {
    expect(validatePlanItems(items(1))).toEqual([]);
    expect(validatePlanItems([{ id: 'a', kind: 'rest', restKind: 'silence', durationSeconds: 900 }])).toEqual([]);
    expect(validatePlanItems([{ id: 'a', kind: 'workout', routineId: 'x', targets: {} }])).toEqual([]);
  });
  it('rejects empty plans, duplicate mood/drill items and bad numbers', () => {
    expect(validatePlanItems([])).toContain('empty');
    const mood: PlanItem = { id: 'm', kind: 'mood', count: 1 };
    expect(validatePlanItems([mood, { ...mood, id: 'm2' }])).toContain('duplicate_mood');
    const drill: PlanItem = { id: 'd', kind: 'drill', count: 1 };
    expect(validatePlanItems([drill, { ...drill, id: 'd2' }])).toContain('duplicate_drill');
    expect(validatePlanItems([{ ...mood, count: 0 }])).toContain('bad_count');
    expect(validatePlanItems([{ id: 'w', kind: 'workout', routineId: 'x', targets: { rounds: 0 } }])).toContain('bad_target');
    expect(validatePlanItems([{ id: 'w', kind: 'workout', routineId: 'x', targets: { hangSeconds: 1.5 } }])).toContain('bad_target');
    expect(validatePlanItems([{ id: 'r', kind: 'rest', restKind: 'silence', durationSeconds: 0 }])).toContain('bad_duration');
    expect(validatePlanItems([mood, { ...drill, id: 'm' }])).toContain('duplicate_id');
  });
  it('allows several workout items', () => {
    const w: PlanItem = { id: 'a', kind: 'workout', routineId: 'x', targets: { rounds: 1 } };
    expect(validatePlanItems([w, { ...w, id: 'b' }])).toEqual([]);
  });
});

describe('lock rule', () => {
  it('day N is editable until N.0000 and locked from then on', () => {
    expect(canEditDay(14360, at(14359, 0.9999), DEFAULT_CONFIG)).toBe(true);
    expect(canEditDay(14360, at(14360, 0) - 1, DEFAULT_CONFIG)).toBe(true);
    expect(canEditDay(14360, at(14360, 0), DEFAULT_CONFIG)).toBe(false);
    expect(canEditDay(14360, at(14360, 0.5), DEFAULT_CONFIG)).toBe(false);
    expect(canEditDay(14360, at(14365, 0), DEFAULT_CONFIG)).toBe(false);
  });
  it('uses the configured boundary (03:00 at UTC−3)', () => {
    // Days start at 03:00 local = 06:00 UTC.
    const start = parseDate('2039-04-23 03:00 -0300')!;
    expect(dayAt(start, CFG3)).toBe(dayAt(start - 1, CFG3) + 1);
    const day = dayAt(start, CFG3);
    expect(dayStartUnix(day, CFG3)).toBe(start);
    expect(canEditDay(day, start - 1, CFG3)).toBe(true);
    expect(canEditDay(day, start, CFG3)).toBe(false);
    // 03:00 UTC is already day N at midnight-UTC boundaries but still N−1 at 03:00 UTC−3.
    expect(dayAt(start, DEFAULT_CONFIG)).toBe(day);
    expect(dayAt(start - 7 * 3600, DEFAULT_CONFIG)).toBe(day - 1);
    expect(dayAt(start - 7 * 3600, CFG3)).toBe(day - 1);
    expect(dayAt(start - 3 * 3600, DEFAULT_CONFIG)).toBe(day);
    expect(dayAt(start - 3 * 3600, CFG3)).toBe(day - 1);
  });
  it('saveDayPlan refuses started days and invalid plans', () => {
    const now = at(14359, 0.5);
    expect(saveDayPlan([], 14359, items(14359), now, DEFAULT_CONFIG)).toEqual({ ok: false, error: 'locked' });
    expect(saveDayPlan([], 14358, items(14358), now, DEFAULT_CONFIG)).toEqual({ ok: false, error: 'locked' });
    const bad = saveDayPlan([], 14360, [], now, DEFAULT_CONFIG);
    expect(bad).toEqual({ ok: false, error: 'invalid', problems: ['empty'] });
    const ok = saveDayPlan(plansFor([14360, 14361]), 14360, items(14360).slice(1), now, DEFAULT_CONFIG);
    expect(ok.ok).toBe(true);
    if (ok.ok) {
      expect(ok.plans.map((p) => p.day)).toEqual([14360, 14361]);
      expect(ok.plan).toEqual({ day: 14360, items: items(14360).slice(1), updatedUnix: now });
    }
  });
});

describe('approveCycle', () => {
  const plans = plansFor(cycleDaysOf(1436));

  it('on time: before the cycle starts, covers all 10 days', () => {
    const r = approveCycle([], 1436, plans, at(14359, 0.5), DEFAULT_CONFIG);
    expect(r.ok && r.onTime).toBe(true);
    expect(r.ok && r.days).toEqual(cycleDaysOf(1436));
  });

  it('requires a valid plan for every covered day', () => {
    const r = approveCycle([], 1436, plans.filter((p) => p.day !== 14363), at(14359, 0.5), DEFAULT_CONFIG);
    expect(r).toEqual({ ok: false, error: 'invalid_plans', days: [14363] });
    const r2 = approveCycle([], 1436, [...plans.filter((p) => p.day !== 14364), { day: 14364, items: [], updatedUnix: 0 }], at(14359, 0.5), DEFAULT_CONFIG);
    expect(r2).toEqual({ ok: false, error: 'invalid_plans', days: [14364] });
  });

  it('late: covers only unstarted days, earns nothing', () => {
    const earlier = [{ cycle: 1435, approvedUnix: at(14349, 0.5) }];
    // day 14362 has started: plans for 14360–14362 are not required
    const r = approveCycle(earlier, 1436, plans.filter((p) => p.day > 14362), at(14362, 0.3), DEFAULT_CONFIG);
    expect(r.ok).toBe(true);
    if (r.ok) {
      expect(r.onTime).toBe(false);
      expect(r.days).toEqual([14363, 14364, 14365, 14366, 14367, 14368, 14369]);
      expect(isDayPlanned(14362, r.cycles, plans, DEFAULT_CONFIG)).toBe(false);
      expect(isDayPlanned(14363, r.cycles, plans, DEFAULT_CONFIG)).toBe(true);
    }
  });

  it('the onboarding approval (the first ever) is on time even mid-cycle', () => {
    const r = approveCycle([], 1436, plans, at(14364, 0.3), DEFAULT_CONFIG);
    expect(r.ok && r.onTime).toBe(true);
    expect(r.ok && r.days).toEqual([14365, 14366, 14367, 14368, 14369]);
    // ...but a later late approval is not
    if (r.ok) {
      const r2 = approveCycle(r.cycles, 1437, plansFor(cycleDaysOf(1437)), at(14371, 0.5), DEFAULT_CONFIG);
      expect(r2.ok && r2.onTime).toBe(false);
    }
  });

  it('refuses a second approval and a fully started cycle', () => {
    const r = approveCycle([], 1436, plans, at(14359, 0.5), DEFAULT_CONFIG);
    if (!r.ok) throw new Error('expected ok');
    expect(approveCycle(r.cycles, 1436, plans, at(14359, 0.6), DEFAULT_CONFIG)).toEqual({ ok: false, error: 'already_approved' });
    expect(approveCycle([], 1436, plans, at(14369, 0.1), DEFAULT_CONFIG)).toEqual({ ok: false, error: 'started', days: [] });
  });

  it('on time is judged with the configured boundary', () => {
    const c = 1436;
    const start = dayStartUnix(14360, CFG3);
    expect(isOnTime({ cycle: c, approvedUnix: start - 1 }, [{ cycle: 1435, approvedUnix: 0 }], CFG3)).toBe(true);
    expect(isOnTime({ cycle: c, approvedUnix: start }, [{ cycle: 1435, approvedUnix: 0 }], CFG3)).toBe(false);
    expect(coveredDays({ cycle: c, approvedUnix: start }, CFG3)[0]).toBe(14361);
  });
});

describe('isDayPlanned', () => {
  it('needs an approval covering the day and a valid plan saved before the day started', () => {
    const cycles = [{ cycle: 1436, approvedUnix: at(14359, 0.5) }];
    expect(isDayPlanned(14360, cycles, plansFor([14360], at(14359, 0.4)), DEFAULT_CONFIG)).toBe(true);
    expect(isDayPlanned(14360, [], plansFor([14360]), DEFAULT_CONFIG)).toBe(false);
    expect(isDayPlanned(14360, cycles, [], DEFAULT_CONFIG)).toBe(false);
    expect(isDayPlanned(14360, cycles, plansFor([14360], at(14360, 0.1)), DEFAULT_CONFIG)).toBe(false);
  });
});

describe('template', () => {
  it('slots by last digit; prefill keeps existing plans, uses valid slots, suggests for empty ones', () => {
    expect(slotOf(14363)).toBe(3);
    expect(slotOf(-1)).toBe(9);
    const t = emptyTemplate();
    t[1] = [{ id: 'x', kind: 'rest', restKind: 'silence', durationSeconds: 900 }];
    t[2] = [{ id: 'x', kind: 'mood', count: 0 }]; // invalid → suggestion
    const existing = plansFor([14364], 123);
    const suggest = (d: number): PlanItem[] => [{ id: 'ignored', kind: 'drill', count: 1 }];
    const out = prefillCycle(1436, t, existing, suggest, at(14360, 0.5), DEFAULT_CONFIG);
    expect(out.map((p) => p.day)).toEqual([14361, 14362, 14363, 14364, 14365, 14366, 14367, 14368, 14369]);
    expect(out[0].items).toEqual([{ id: '14361-0', kind: 'rest', restKind: 'silence', durationSeconds: 900 }]);
    expect(out[1].items).toEqual([{ id: '14362-0', kind: 'drill', count: 1 }]);
    expect(out[3]).toBe(existing[0]);
  });
  it('templateFromPlans copies plans into slots', () => {
    const t = templateFromPlans(1436, plansFor([14360, 14365]));
    expect(t[0]).toEqual(items(14360));
    expect(t[5]).toEqual(items(14365));
    expect(t[1]).toEqual([]);
  });
});
