import { describe, expect, it } from 'vitest';
import { DEFAULT_CONFIG } from '../time/daykeep';
import { approvalFor, dayStartUnix, findPlan, isDayPlanned } from '../domain/plan';
import { computeRecord } from '../domain/record';
import { TABATA_ROUTINE_ID } from '../domain/engine';
import type { AppData, PlanItem } from '../domain/types';
import { emptyData } from '../storage/store';
import { buildFixture } from '../dev/fixtures';
import { approveWithDrafts, cycleDrafts, cycleRowSummary, draftForDay, firstPlanDays, lookBack, targetCycle, unlearnedDays, unlearnedIn } from './cycle';

const cfg = DEFAULT_CONFIG;
const at = (day: number, frac: number) => dayStartUnix(day, cfg) + Math.floor(frac * cfg.dayLength);

/** History through 14360 with cycle 1436 left unapproved and unplanned (a late approval). */
function lateFixture(): { data: AppData; now: number } {
  const f = buildFixture({ history: '.' + 'D'.repeat(20) + 'T', today: 14360 });
  const data = f.data;
  data.cycles = data.cycles.filter((c) => c.cycle !== 1436);
  data.plans = data.plans.filter((p) => p.day < 14360);
  return { data, now: f.now };
}

describe('targetCycle / firstPlanDays', () => {
  it('starts the first plan tomorrow, to the end of the current cycle', () => {
    expect(targetCycle([], 14355)).toBe(1435);
    expect(firstPlanDays(14355)).toEqual([14356, 14357, 14358, 14359]);
  });

  it('takes the whole next cycle when tomorrow starts one', () => {
    expect(targetCycle([], 14359)).toBe(1436);
    expect(firstPlanDays(14359)).toEqual([14360, 14361, 14362, 14363, 14364, 14365, 14366, 14367, 14368, 14369]);
  });

  it('moves on once the cycle holding tomorrow is approved', () => {
    expect(targetCycle([{ cycle: 1435, approvedUnix: at(14354, 0.1) }], 14355)).toBe(1436);
    expect(targetCycle([{ cycle: 1435, approvedUnix: at(14354, 0.1) }], 14359)).toBe(1436);
  });

  it('stays on a started, unapproved cycle while it has unstarted days', () => {
    const { data } = lateFixture();
    expect(targetCycle(data.cycles, 14360)).toBe(1436);
    expect(targetCycle(data.cycles, 14369)).toBe(1437);
  });
});

describe('drafts', () => {
  it('pre-fills unstarted days without writing anything', () => {
    const f = buildFixture({ history: '.' + 'D'.repeat(15) + 'T', today: 14355 });
    const drafts = cycleDrafts(f.data, 1436, f.now, cfg);
    expect(drafts.map((p) => p.day)).toEqual([14360, 14361, 14362, 14363, 14364, 14365, 14366, 14367, 14368, 14369]);
    expect(f.data.plans.some((p) => p.day >= 14360)).toBe(false);
    expect(draftForDay(f.data, 14362, f.now, cfg)).toEqual(drafts[2].items);
  });

  it('keeps a saved draft over the pre-fill', () => {
    const f = buildFixture({ history: '.' + 'D'.repeat(15) + 'T', today: 14355 });
    const items: PlanItem[] = [{ id: '14361-0', kind: 'rest', restKind: 'silence', durationSeconds: 900 }];
    f.data.plans.push({ day: 14361, items, updatedUnix: f.now });
    expect(cycleDrafts(f.data, 1436, f.now, cfg)[1].items).toEqual(items);
    expect(draftForDay(f.data, 14361, f.now, cfg)).toEqual(items);
  });
});

describe('approveWithDrafts', () => {
  it('saves the pre-fill and approves on time (+1 reserve)', () => {
    const f = buildFixture({ history: '.' + 'D'.repeat(15) + 'T', today: 14355 });
    const r = approveWithDrafts(f.data, 1436, f.now, cfg, false);
    expect(r.ok).toBe(true);
    if (!r.ok) return;
    expect(r.onTime).toBe(true);
    expect(r.days).toHaveLength(10);
    expect(isDayPlanned(14365, r.data.cycles, r.data.plans, cfg)).toBe(true);
    expect(r.data.template).toBe(f.data.template);
  });

  it('copies the covered days into the template when asked', () => {
    const f = buildFixture({ history: '.' + 'D'.repeat(15) + 'T', today: 14355 });
    const r = approveWithDrafts(f.data, 1436, f.now, cfg, true);
    if (!r.ok) throw new Error('not approved');
    expect(r.data.template[3]).toEqual(findPlan(r.data.plans, 14363)!.items);
  });

  it('is late (no reserve) once the cycle started, covering only the unstarted days', () => {
    const { data, now } = lateFixture();
    const r = approveWithDrafts(data, 1436, now, cfg, true);
    if (!r.ok) throw new Error('not approved');
    expect(r.onTime).toBe(false);
    expect(r.days[0]).toBe(14361);
    expect(findPlan(r.data.plans, 14360)).toBeUndefined();
    // Started slots keep what the template had.
    expect(r.data.template[0]).toEqual(data.template[0]);
  });

  it('counts the onboarding plan as on time (first approval, mid-cycle)', () => {
    const data = emptyData();
    const now = at(14355, 0.4);
    const r = approveWithDrafts(data, targetCycle([], 14355), now, cfg, false);
    if (!r.ok) throw new Error('not approved');
    expect(r.onTime).toBe(true);
    expect(r.days).toEqual(firstPlanDays(14355));
    expect(computeRecord(r.data, now, cfg).recordStartDay).toBe(14356);
  });

  it('refuses a cycle that is already approved', () => {
    const f = buildFixture({ history: '.' + 'D'.repeat(15) + 'T', today: 14355, approveNext: true });
    expect(approvalFor(f.data.cycles, 1436)).toBeDefined();
    expect(approveWithDrafts(f.data, 1436, f.now, cfg, false)).toMatchObject({ ok: false, error: 'already_approved' });
  });
});

describe('cycleRowSummary', () => {
  it('lists workouts and rests, and counts checks', () => {
    const items: PlanItem[] = [
      { id: 'a', kind: 'workout', routineId: TABATA_ROUTINE_ID, targets: { rounds: 2 } },
      { id: 'b', kind: 'rest', restKind: 'silence', durationSeconds: 900 },
      { id: 'c', kind: 'mood', count: 2 },
      { id: 'd', kind: 'drill', count: 1 },
    ];
    expect(cycleRowSummary(items, cfg)).toEqual({ title: 'Tabata · 2 rounds + Rest · silence 900 s', mood: 2, drill: 1 });
    expect(cycleRowSummary([{ id: 'c', kind: 'mood', count: 3 }], cfg)).toEqual({ title: 'Checks only', mood: 3, drill: 0 });
    expect(cycleRowSummary([], cfg).title).toBe('Nothing planned');
  });
});

describe('lookBack', () => {
  it("shows the previous cycle's result and its first note", () => {
    const f = buildFixture({ history: '.' + 'D'.repeat(14) + 'M' + 'DDD' + 'D', today: 14358 });
    const lb = lookBack(1436, computeRecord(f.data, f.now, cfg))!;
    expect(lb.cycle).toBe(1435);
    expect(lb.cells.map((c) => c.kind)).toEqual(['done', 'done', 'done', 'done', 'kept', 'done', 'done', 'done', 'done', 'future']);
    expect(lb.done).toBe(8);
    expect(lb.closed).toBe(9);
    expect(lb.complete).toBe(false);
    expect(lb.note).toEqual({ day: 14354, text: 'Long day at work' });
  });

  it('is null before the record', () => {
    const data = emptyData();
    expect(lookBack(1436, computeRecord(data, at(14355, 0.4), cfg))).toBeNull();
  });
});

describe('curriculum drafts (P14)', () => {
  /** A fresh user on 14355: no plans, no lessons. */
  const fresh = (): AppData => {
    const data = emptyData();
    data.settings.onboardedUnix = at(14355, 0.3);
    return data;
  };
  const now = at(14355, 0.4);

  it('pre-fills one lesson a day, each day a Basics of the lessons before it', () => {
    const drafts = cycleDrafts(fresh(), 1435, now, cfg);
    expect(drafts.map((p) => p.day)).toEqual([14356, 14357, 14358, 14359]);
    const learn = drafts.map((p) => p.items.find((i) => i.kind === 'learn'));
    expect(learn.map((i) => i && i.kind === 'learn' && i.skillId)).toEqual(['chin-tuck', 'jumping-jacks', 'door-bar-dead-hang', 'high-plank']);
    const workouts = drafts.map((p) => p.items.find((i) => i.kind === 'workout'));
    expect(workouts[0]).toBeUndefined(); // day 1: nothing learned yet
    expect(workouts.slice(1).map((w) => w && w.kind === 'workout' && w.routineId)).toEqual(['basics:1', 'basics:2', 'basics:3']);
    expect(unlearnedDays(fresh(), drafts, now, cfg)).toEqual([]);
  });

  it('continues the curriculum into the next cycle from saved plans', () => {
    const data = fresh();
    const r = approveWithDrafts(data, 1435, now, cfg, false);
    expect(r.ok).toBe(true);
    if (!r.ok) return;
    const next = cycleDrafts(r.data, 1436, now, cfg);
    const first = next[0].items.find((i) => i.kind === 'learn');
    expect(first && first.kind === 'learn' && first.skillId).toBe('rope-bounce');
  });

  it('refuses to approve a workout that uses an exercise not learned before its day', () => {
    const data = fresh();
    const items: PlanItem[] = [{ id: '14356-0', kind: 'workout', routineId: TABATA_ROUTINE_ID, targets: {} }];
    data.plans = [{ day: 14356, items, updatedUnix: now }];
    const drafts = cycleDrafts(data, 1435, now, cfg);
    expect(unlearnedDays(data, drafts, now, cfg)[0]).toMatchObject({ day: 14356 });
    expect(unlearnedIn(14356, items, data.plans, data, cfg)[0]).toBe('rope-speed-sprint-tabata');
    expect(approveWithDrafts(data, 1435, now, cfg, false)).toMatchObject({ ok: false, error: 'unlearned', days: [14356] });
  });

  it('a lesson planned the day before is enough; the same day is not', () => {
    const data = fresh();
    const basicsOfChinTuck: PlanItem = { id: 'w', kind: 'workout', routineId: 'basics:1', targets: {} };
    const learnChinTuck: PlanItem = { id: 'l', kind: 'learn', skillId: 'chin-tuck' };
    const sameDay = [{ day: 14356, items: [learnChinTuck, basicsOfChinTuck], updatedUnix: now }];
    expect(unlearnedIn(14356, sameDay[0].items, sameDay, data, cfg)).toEqual(['chin-tuck']);
    const dayBefore = [{ day: 14356, items: [learnChinTuck], updatedUnix: now }, { day: 14357, items: [basicsOfChinTuck], updatedUnix: now }];
    expect(unlearnedIn(14357, [basicsOfChinTuck], dayBefore, data, cfg)).toEqual([]);
  });

  it('graduated users get the rotation and their template back', () => {
    const f = buildFixture({ history: '.DDT', today: 14355 });
    const drafts = cycleDrafts(f.data, 1436, f.now, cfg);
    expect(drafts.every((p) => p.items.every((i) => i.kind !== 'learn'))).toBe(true);
  });
});
