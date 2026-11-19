import { describe, expect, it } from 'vitest';
import { DEFAULT_CONFIG, parseDate, type DayConfig } from '../time/daykeep';
import { buildFixture } from '../dev/fixtures';
import { dayStartUnix } from './plan';
import { computeRecord, evaluateDay, evaluateItems, matchItems, recordStartDay, type DayLogs } from './record';
import type { MoodCheck, PlanItem, RecordData, RestSession, WorkoutSession } from './types';

const CFG = DEFAULT_CONFIG;
const CFG3: DayConfig = { epoch: parseDate('2000-01-01 03:00 -0300')!, dayLength: 86400 };
const at = (day: number, frac: number, cfg: DayConfig = CFG) => dayStartUnix(day, cfg) + Math.floor(frac * cfg.dayLength);

let seq = 0;
function session(routineId: string, endUnix: number, over: Partial<WorkoutSession> = {}): WorkoutSession {
  return {
    id: `s${seq++}`,
    routineId,
    startUnix: endUnix - 600,
    endUnix,
    completedFull: true,
    totalSeconds: 600,
    roundsCompleted: 3,
    totalRounds: 3,
    rpe: 7,
    neck: 2,
    estimatedCalories: 100,
    ...over,
  };
}
function rest(restKind: string, endUnix: number, durationSeconds: number, completedFull = true): RestSession {
  return { id: `r${seq++}`, restKind, startUnix: endUnix - durationSeconds, endUnix, durationSeconds, completedFull };
}
function mood(unix: number): MoodCheck {
  return { id: `m${seq++}`, unix, valence: 'good', halt: { hungry: false, angry: false, lonely: false, tired: false } };
}
const noLogs = (): DayLogs => ({ sessions: [], rests: [], moods: [], drills: [] });

/** Fixture shorthand: pattern ending today, `today` day number. */
const fx = (history: string, today: number, extra: Partial<Parameters<typeof buildFixture>[0]> = {}) =>
  buildFixture({ history, today, ...extra });

describe('evaluateItems', () => {
  const hang = (id: string, s: number): PlanItem => ({ id, kind: 'workout', routineId: 'p', targets: { hangSeconds: s } });

  it('each workout item needs its own session; proper matching when items share a routine', () => {
    const items = [hang('a', 30), hang('b', 40)];
    const s45 = session('p', 100, { hangSeconds: 45 });
    const s35 = session('p', 200, { hangSeconds: 35 });
    // one session can't satisfy both items
    expect(evaluateItems(items, { ...noLogs(), sessions: [s45] }).map((i) => i.satisfied)).toEqual([true, false]);
    // a greedy pass would give s45 to `a` and leave `b` unmatched; matching finds the assignment
    expect(evaluateItems(items, { ...noLogs(), sessions: [s45, s35] }).map((i) => i.satisfied)).toEqual([true, true]);
    expect(matchItems(items, [s45, s35], (s, it) => (s.hangSeconds ?? 0) >= (it as { targets: { hangSeconds: number } }).targets.hangSeconds)).toEqual([1, 0]);
  });

  it('every target set on the item must be met', () => {
    const item: PlanItem = { id: 'w', kind: 'workout', routineId: 'r', targets: { rounds: 3, ropeTurns: 200, totalSeconds: 600 } };
    const ok = session('r', 1, { roundsCompleted: 3, ropeTurns: 200, totalSeconds: 600 });
    expect(evaluateItems([item], { ...noLogs(), sessions: [ok] })[0].satisfied).toBe(true);
    for (const over of [{ roundsCompleted: 2 }, { ropeTurns: 199 }, { ropeTurns: undefined }, { totalSeconds: 599 }]) {
      expect(evaluateItems([item], { ...noLogs(), sessions: [{ ...ok, ...over }] })[0].satisfied).toBe(false);
    }
    expect(evaluateItems([item], { ...noLogs(), sessions: [{ ...ok, routineId: 'other' }] })[0].satisfied).toBe(false);
  });

  it('a session ended early never satisfies, even beyond the targets', () => {
    const item = hang('a', 30);
    const early = session('p', 1, { hangSeconds: 90, completedFull: false });
    expect(evaluateItems([item], { ...noLogs(), sessions: [early] })[0].satisfied).toBe(false);
    const retry = session('p', 2, { hangSeconds: 31 });
    expect(evaluateItems([item], { ...noLogs(), sessions: [early, retry] })[0].satisfied).toBe(true);
  });

  it('rest items need a full rest of the same kind lasting at least the planned duration', () => {
    const item: PlanItem = { id: 'r', kind: 'rest', restKind: 'silence', durationSeconds: 900 };
    const ev = (r: RestSession) => evaluateItems([item], { ...noLogs(), rests: [r] })[0].satisfied;
    expect(ev(rest('silence', 1, 900))).toBe(true);
    expect(ev(rest('silence', 1, 1200))).toBe(true);
    expect(ev(rest('silence', 1, 899))).toBe(false);
    expect(ev(rest('silence', 1, 900, false))).toBe(false);
    expect(ev(rest('meditation', 1, 900))).toBe(false);
  });

  it('mood and drill items count logs of the day; extra logs never hurt', () => {
    const items: PlanItem[] = [
      { id: 'm', kind: 'mood', count: 2 },
      { id: 'd', kind: 'drill', count: 1 },
    ];
    const one = evaluateItems(items, { ...noLogs(), moods: [mood(1)] });
    expect(one.map((i) => [i.satisfied, i.current, i.required])).toEqual([[false, 1, 2], [false, 0, 1]]);
    const drill = { id: 'd', unix: 1, drillType: 'high_hr_pause' as const, heartRateState: 'resting' as const, pauseSecondsAchieved: 5, impulseResisted: true };
    const extra = evaluateItems(items, {
      sessions: [session('anything', 1)],
      rests: [rest('silence', 1, 60)],
      moods: [mood(1), mood(2), mood(3), mood(4)],
      drills: [drill, { ...drill, id: 'd2' }],
    });
    expect(extra.every((i) => i.satisfied)).toBe(true);
  });
});

describe('day assignment', () => {
  it('a session belongs to the day of its end; checks to the day of their stamp (03:00 UTC−3 boundary)', () => {
    const f = fx('.T', 14355, { config: CFG3 });
    const data = f.data;
    const plan = data.plans.find((p) => p.day === 14355)!;
    plan.items = [{ id: 'x', kind: 'mood', count: 1 }];
    const boundary = dayStartUnix(14356, CFG3); // 14356.0000 = 03:00 at UTC−3
    data.moods.push(mood(boundary - 1)); // 14355.9999…: counts for 14355
    const later = { ...data, moods: [mood(boundary)] }; // 14356.0000: counts for 14356 only
    const now = boundary + 3600;
    expect(computeRecord(data, now, CFG3).days.find((d) => d.day === 14355)!.status).toBe('done');
    expect(computeRecord(later, now, CFG3).days.find((d) => d.day === 14355)!.status).toBe('missed');
    // a session that starts on 14355 and ends on 14356 belongs to 14356 (plan: posture, hang ≥ 25 s)
    const s = session('posture-text-neck-antidote', boundary + 10, { startUnix: boundary - 600, hangSeconds: 30 });
    expect(evaluateDay(14356, { ...data, sessions: [s] }, now, CFG3).items[0].satisfied).toBe(true);
    const s2 = { ...s, endUnix: boundary - 1 };
    expect(evaluateDay(14356, { ...data, sessions: [s2] }, now, CFG3).items[0].satisfied).toBe(false);
  });
});

describe('record start and day statuses', () => {
  it('no approved plan → no record', () => {
    const empty: RecordData = { cycles: [], plans: [], sessions: [], rests: [], moods: [], drills: [], justifications: [] };
    expect(recordStartDay(empty, CFG)).toBeNull();
    const r = computeRecord(empty, at(14355, 0.4), CFG);
    expect(r).toMatchObject({ recordStartDay: null, streak: 0, reservesHeld: 0, average: null, days: [] });
    expect(r.todayEval.status).toBe('outside');
    // plans without an approval don't start a record
    const f = fx('.T', 14355);
    expect(recordStartDay({ ...f.data, cycles: [] }, CFG)).toBeNull();
  });

  it('record starts at the first planned day; the setup day is outside', () => {
    const f = fx('.', 14355);
    const r = computeRecord(f.data, f.now, CFG);
    expect(r.recordStartDay).toBe(14356);
    expect(r.todayEval.status).toBe('outside');
    expect(r.days.map((d) => d.status)).toEqual(['upcoming', 'upcoming', 'upcoming', 'upcoming']);
    expect(evaluateDay(14354, f.data, f.now, CFG).status).toBe('outside');
  });

  it('today, done before the day ends, missed when closed undone', () => {
    const f = fx('.DmP', 14355, { approveNext: true });
    const r = computeRecord(f.data, f.now, CFG);
    const s = Object.fromEntries(r.days.map((d) => [d.day, d.status]));
    expect(s[14353]).toBe('done');
    expect(s[14354]).toBe('missed');
    expect(s[14355]).toBe('today');
    expect(s[14356]).toBe('upcoming');
    expect(s[14369]).toBe('upcoming');
    expect(r.todayEval).toMatchObject({ satisfiedCount: 1, totalCount: 3 });
    const done = fx('.DmD', 14355);
    expect(computeRecord(done.data, done.now, CFG).todayEval.status).toBe('done');
  });

  it('an unplanned day inside the record is missed', () => {
    const f = fx('.DDDT', 14355);
    // drop the plan of 14353: approval covered it but there's no plan now
    const data = { ...f.data, plans: f.data.plans.filter((p) => p.day !== 14353) };
    const r = computeRecord(data, f.now, CFG);
    const d = r.days.find((x) => x.day === 14353)!;
    expect(d).toMatchObject({ status: 'missed', planned: false });
  });
});

describe('streak and reserves', () => {
  it('streak counts done days and includes today once done', () => {
    expect(computeRecord(fx('.DDDT', 14355).data, fx('.DDDT', 14355).now, CFG).streak).toBe(3);
    const f = fx('.DDDD', 14355);
    expect(computeRecord(f.data, f.now, CFG)).toMatchObject({ streak: 4, bestStreak: 4 });
  });

  it('a reserve is earned per on-time approval and credited at the start of the first covered day', () => {
    // onboarding approval on 14339 for cycle 1434, on-time approval for 1435 on 14349
    const f = fx('.' + 'D'.repeat(15) + 'T', 14355, { approveNext: true });
    expect(computeRecord(f.data, f.now, CFG).reservesHeld).toBe(2);
    const f1 = fx('.' + 'D'.repeat(5) + 'T', 14345);
    expect(computeRecord(f1.data, f1.now, CFG).reservesHeld).toBe(1);
    // not yet credited the moment before 14350.0000, credited at 14350.0000
    const g = fx('.' + 'D'.repeat(9) + 'D', 14349, { approveNext: true, nowFrac: 0.5 });
    expect(computeRecord(g.data, dayStartUnix(14350, CFG) - 1, CFG).reservesHeld).toBe(1);
    expect(computeRecord(g.data, dayStartUnix(14350, CFG), CFG).reservesHeld).toBe(2);
  });

  it('a late approval earns nothing', () => {
    const f = fx('.' + 'D'.repeat(15) + 'T', 14355);
    const late = f.data.cycles.map((c) => (c.cycle === 1435 ? { ...c, approvedUnix: at(14350, 0.01) } : c));
    const r = computeRecord({ ...f.data, cycles: late }, f.now, CFG);
    // 14350 isn't covered → missed, consumed the onboarding reserve; no credit for 1435
    expect(r.days.find((d) => d.day === 14350)!.status).toBe('missed');
    expect(r.protectedDays).toEqual([14350]);
    expect(r.reservesHeld).toBe(0);
  });

  it('holds at most 2 reserves; excess is lost', () => {
    const f = fx('.' + 'D'.repeat(35) + 'T', 14355); // record from 14320: 4 on-time approvals
    expect(f.data.cycles).toHaveLength(4);
    expect(computeRecord(f.data, f.now, CFG).reservesHeld).toBe(2);
    const g = fx('.' + 'D'.repeat(34) + 'mT', 14355);
    expect(computeRecord(g.data, g.now, CFG).reservesHeld).toBe(1);
  });

  it('a miss consumes a reserve and the streak holds (does not grow)', () => {
    const f = fx('.DDDMDDT', 14355);
    const r = computeRecord(f.data, f.now, CFG);
    expect(r).toMatchObject({ streak: 5, bestStreak: 5, reservesHeld: 1, protectedDays: [14352], brokenDays: [] });
    expect(r.days.find((d) => d.day === 14352)).toMatchObject({ status: 'missed', protected: true });
  });

  it('a reserve credited on a cycle start can cover a miss that same day', () => {
    // setup on 14349, approval of 1435 is on time; record starts 14350 and misses it
    const f = fx('.MDT', 14352);
    const r = computeRecord(f.data, f.now, CFG);
    expect(r.recordStartDay).toBe(14350);
    expect(r.protectedDays).toEqual([14350]);
    expect(r.reservesHeld).toBe(0);
    expect(r.streak).toBe(1);
  });

  it('never covers two misses in a row, even with reserves held; best streak is kept', () => {
    const f = fx('.' + 'D'.repeat(12) + 'MMDT', 14356);
    const r = computeRecord(f.data, f.now, CFG);
    expect(r.protectedDays).toEqual([14353]);
    expect(r.brokenDays).toEqual([14354]);
    expect(r.reservesHeld).toBe(1);
    expect(r.streak).toBe(1);
    expect(r.bestStreak).toBe(12);
  });

  it('with no reserve left a single miss breaks the streak', () => {
    const f = fx('.DMDDMDT', 14355); // record 14349–: onboarding + cycle 1435 credits
    expect(computeRecord(f.data, f.now, CFG).protectedDays).toEqual([14350, 14353]);
    const g = fx('.DMDMDMDT', 14357); // record 14350–: one credit only
    const rg = computeRecord(g.data, g.now, CFG);
    expect(rg.protectedDays).toEqual([14351]);
    expect(rg.brokenDays).toEqual([14353, 14355]);
    expect(rg.streak).toBe(1);
    expect(rg.bestStreak).toBe(2);
  });
});

describe('100-day average', () => {
  it('until 100 days exist, the denominator is the record days in the window', () => {
    const f = fx('.DDMDT', 14355);
    expect(computeRecord(f.data, f.now, CFG)).toMatchObject({ averageDone: 3, averageDays: 4, average: 0.75 });
  });
  it('today joins the window only once done', () => {
    const f = fx('.DDMDP', 14355);
    expect(computeRecord(f.data, f.now, CFG).averageDays).toBe(4);
    const g = fx('.DDMDD', 14355);
    expect(computeRecord(g.data, g.now, CFG)).toMatchObject({ averageDone: 4, averageDays: 5, average: 0.8 });
  });
  it('protected days count as missed in the average', () => {
    const f = fx('.DMT', 14355);
    expect(computeRecord(f.data, f.now, CFG)).toMatchObject({ protectedDays: [14354], average: 0.5 });
  });
  it('uses only the last 100 days', () => {
    const history = '.' + 'M'.repeat(5) + 'D'.repeat(100) + 'T';
    const f = fx(history, 14355);
    expect(computeRecord(f.data, f.now, CFG)).toMatchObject({ averageDays: 100, averageDone: 100, average: 1 });
    const h2 = '.' + 'D'.repeat(5) + 'M' + 'D'.repeat(99) + 'D';
    const g = fx(h2, 14355);
    // record 14250–; the miss is on 14255. Today done → window 14256..14355, the miss dropped out
    const r = computeRecord(g.data, g.now, CFG);
    expect(r.averageDays).toBe(100);
    expect(r.averageDone).toBe(100);
    const r2 = computeRecord(g.data, g.now - 1, CFG); // same day, still done
    expect(r2.averageDone).toBe(100);
  });
  it('without today done, the window is the last 100 closed days', () => {
    const h = '.' + 'D'.repeat(5) + 'M' + 'D'.repeat(99) + 'T';
    const f = fx(h, 14355);
    const r = computeRecord(f.data, f.now, CFG);
    expect(r.averageDays).toBe(100);
    expect(r.averageDone).toBe(99);
  });
});

describe('justifications and recovery', () => {
  it('pending justifications are unjustified closed misses, oldest first', () => {
    const f = fx('.DmDMmmT', 14355);
    expect(computeRecord(f.data, f.now, CFG).pendingJustifications).toEqual([14350, 14353, 14354]);
  });
  it('the day after a missed day is a recovery day (protected or not)', () => {
    const f = fx('.DDMT', 14355);
    expect(computeRecord(f.data, f.now, CFG).isRecoveryDay).toBe(true);
    const done = fx('.DDMD', 14355);
    expect(computeRecord(done.data, done.now, CFG).isRecoveryDay).toBe(true);
    const ok = fx('.DMDT', 14355);
    expect(computeRecord(ok.data, ok.now, CFG).isRecoveryDay).toBe(false);
    const first = fx('.T', 14355);
    expect(computeRecord(first.data, first.now, CFG).isRecoveryDay).toBe(false);
  });
});
