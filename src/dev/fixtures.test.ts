import { describe, expect, it } from 'vitest';
import { DEFAULT_CONFIG, fromUnix, parseDate, parseStamp, toUnix, type DayConfig } from '../time/daykeep';
import { approvalFor, isOnTime } from '../domain/plan';
import { computeRecord, type RecordSummary } from '../domain/record';
import { loadData, memoryStorage } from '../storage/store';
import { FIXTURE_SCENARIOS, buildFixture, buildScenarioFixture } from './fixtures';
import { SCENARIOS } from './scenarios';

/** Seed a memory storage exactly as applyScenarioFromUrl does. */
function seeded(storage: Record<string, unknown>) {
  const st = memoryStorage();
  for (const [k, v] of Object.entries(storage)) st.setItem(k, JSON.stringify(v));
  return st;
}

function recordOf(name: string): { r: RecordSummary; now: number } {
  const sc = SCENARIOS[name];
  const cfg = sc.config ?? DEFAULT_CONFIG;
  const now = toUnix(parseStamp(sc.now!, cfg)!, cfg);
  const data = loadData(seeded(sc.storage));
  return { r: computeRecord(data, now, data.settings.config), now };
}

const EXPECT: Record<string, (r: RecordSummary) => void> = {
  warmup: (r) => {
    expect(r.todayEval.status).toBe('outside');
    expect(r.recordStartDay).toBe(r.today + 1);
    expect(r.average).toBeNull();
  },
  'today-start': (r) => {
    expect(r.todayEval).toMatchObject({ status: 'today', satisfiedCount: 0 });
    expect(r).toMatchObject({ streak: 15, reservesHeld: 2, pendingJustifications: [], isRecoveryDay: false, average: 1 });
  },
  'today-mid': (r) => {
    expect(r.todayEval.status).toBe('today');
    expect(r.todayEval.satisfiedCount).toBeGreaterThan(0);
    expect(r.todayEval.satisfiedCount).toBeLessThan(r.todayEval.totalCount);
  },
  'today-done': (r) => {
    expect(r.todayEval.status).toBe('done');
    expect(r.streak).toBe(16);
  },
  halt: (r) => expect(r.todayEval.status).toBe('today'),
  'today-recovery-done': (r) => {
    expect(r).toMatchObject({ isRecoveryDay: true, pendingJustifications: [] });
    expect(r.todayEval.status).toBe('done');
  },
  'workout-preview': (r) => expect(r.todayEval.items[0].item).toMatchObject({ id: `${r.today}-0`, kind: 'workout' }),
  mood: (r) => expect(r.todayEval.items.some((p) => p.item.kind === 'mood' && !p.satisfied)).toBe(true),
  'mood-more': (r) => expect(r.todayEval.status).toBe('today'),
  justify: (r) => {
    expect(r.pendingJustifications).toEqual([r.today - 1]);
    expect(r.protectedDays).toEqual([r.today - 1]);
  },
  'justify-broken': (r) => {
    expect(r.pendingJustifications).toEqual([r.today - 1]);
    expect(r.brokenDays).toEqual([r.today - 1]);
  },
  'justify-stack': (r) => expect(r.pendingJustifications).toHaveLength(3),
  'cycle-tomorrow': (r) => {
    expect(r.today).toBe(14359);
    expect(r.todayEval.status).toBe('done');
  },
  'missed-yesterday': (r) => {
    expect(r.pendingJustifications).toEqual([r.today - 1]);
    expect(r.protectedDays).toEqual([r.today - 1]);
    expect(r).toMatchObject({ streak: 14, reservesHeld: 1, isRecoveryDay: true });
  },
  'missed-three': (r) => {
    expect(r.pendingJustifications).toEqual([r.today - 3, r.today - 2, r.today - 1]);
    expect(r.protectedDays).toEqual([r.today - 3]);
    expect(r.brokenDays).toEqual([r.today - 2, r.today - 1]);
    expect(r).toMatchObject({ streak: 0, bestStreak: 12 });
  },
  recovery: (r) => {
    expect(r).toMatchObject({ isRecoveryDay: true, pendingJustifications: [], streak: 14 });
    expect(r.protectedDays).toEqual([r.today - 1]);
  },
  'streak-broken': (r) => {
    expect(r).toMatchObject({ streak: 0, bestStreak: 13, pendingJustifications: [], isRecoveryDay: true });
    expect(r.brokenDays).toEqual([r.today - 1]);
    expect(r.average).toBeCloseTo(13 / 15);
  },
  'cycle-due': (r) => {
    expect(r.todayEval.status).toBe('done');
    expect(r.days[r.days.length - 1].day).toBe(14359); // nothing planned for cycle 1436
  },
  'cycle-approve': (r) => {
    expect(r.today).toBe(14358);
    expect(r.days[r.days.length - 1].day).toBe(14359); // cycle 1436 not planned yet
    expect(r.protectedDays).toEqual([14354]);
  },
  'cycle-late': (r) => {
    expect(r.today).toBe(14360);
    expect(r.todayEval.planned).toBe(false); // cycle 1436 started without approval
    expect(r.pendingJustifications).toEqual([]);
  },
  'day-edit': (r) => expect(r.days.some((d) => d.status === 'upcoming')).toBe(true),
  'day-edit-empty': (r) => expect(r.days.some((d) => d.day === r.today + 1 && d.status === 'upcoming')).toBe(true),
  'day-locked': (r) => expect(r.todayEval.status).toBe('today'),
  plan: (r) => expect(r.days[r.days.length - 1].day).toBe(14359), // next cycle unplanned
  'plan-approved': (r) => expect(r.days[r.days.length - 1].day).toBe(14369),
  'progress-empty': (r) => expect(r.averageDays).toBe(0),
  'progress-100': (r) => {
    expect(r.averageDays).toBe(100);
    expect(r.averageDone).toBe(95);
    expect(r.days.length).toBeGreaterThanOrEqual(106);
  },
  settings: (r) => expect(r.recordStartDay).not.toBeNull(),
  'hud-work': workoutUndone,
  'hud-rest': workoutUndone,
  'hud-paused': workoutUndone,
  'workout-log': (r) => {
    workoutUndone(r);
    // The log asks for rope turns (the item targets them) and offers the drill (still due).
    expect(r.todayEval.items[0].item).toMatchObject({ kind: 'workout', targets: { ropeTurns: expect.any(Number) } });
    expect(r.todayEval.items.some((p) => p.item.kind === 'drill' && !p.satisfied)).toBe(true);
  },
  'workout-log-early': workoutUndone,
  'drill-elevate': (r) => expect(r.todayEval.status).toBe('today'),
  'drill-sigh': (r) => expect(r.todayEval.status).toBe('today'),
  'drill-scenario': (r) => expect(r.todayEval.status).toBe('today'),
  'rest-timer': (r) => expect(r.todayEval.items.find((p) => p.item.id === `${r.today}-r`)).toMatchObject({ satisfied: false, item: { kind: 'rest' } }),
};

/** Today's first item is an undone workout (the HUD and log scenarios open it). */
function workoutUndone(r: RecordSummary) {
  expect(r.todayEval.items[0]).toMatchObject({ satisfied: false, item: { id: `${r.today}-0`, kind: 'workout' } });
}

describe('fixture scenarios', () => {
  it('every fixture scenario is registered and has an expectation', () => {
    for (const name of Object.keys(FIXTURE_SCENARIOS)) {
      expect(SCENARIOS[name], name).toBeDefined();
      expect(EXPECT[name], name).toBeDefined();
    }
  });

  it.each(Object.keys(FIXTURE_SCENARIOS))('%s: storage round-trips through store.ts and now matches', (name) => {
    const f = buildScenarioFixture(FIXTURE_SCENARIOS[name]);
    const sc = SCENARIOS[name];
    expect(loadData(seeded(sc.storage))).toEqual(f.data);
    const cfg = sc.config ?? DEFAULT_CONFIG;
    expect(toUnix(parseStamp(sc.now!, cfg)!, cfg)).toBe(f.now);
    expect(Object.keys(sc.storage).every((k) => k.startsWith('mv2:'))).toBe(true);
  });

  it.each(Object.keys(FIXTURE_SCENARIOS))('%s: record has the intended state', (name) => {
    EXPECT[name](recordOf(name).r);
  });

  it('halt: the latest mood check flags HALT', () => {
    const data = loadData(seeded(SCENARIOS.halt.storage));
    const latest = data.moods.reduce((a, b) => (b.unix > a.unix ? b : a));
    expect(Object.values(latest.halt).some(Boolean)).toBe(true);
  });

  it('cycle-due: next cycle unapproved and starting within 3 days', () => {
    const { r } = recordOf('cycle-due');
    const data = loadData(seeded(SCENARIOS['cycle-due'].storage));
    expect(approvalFor(data.cycles, 1436)).toBeUndefined();
    expect(14360 - r.today).toBeLessThanOrEqual(3);
  });

  it('every approval in the fixtures is on time', () => {
    for (const name of Object.keys(FIXTURE_SCENARIOS)) {
      const data = loadData(seeded(SCENARIOS[name].storage));
      for (const a of data.cycles) expect(isOnTime(a, data.cycles, data.settings.config), `${name} ${a.cycle}`).toBe(true);
    }
  });
});

describe('buildFixture', () => {
  it('rejects malformed patterns', () => {
    for (const h of ['', 'D.', 'TD', 'MT.', 'DPD', 'X']) expect(() => buildFixture({ history: h, today: 14355 }), h).toThrow();
  });

  it('works with a 03:00 UTC−3 epoch: everything lands on the intended days', () => {
    const cfg: DayConfig = { epoch: parseDate('2000-01-01 03:00 -0300')!, dayLength: 86400 };
    const f = buildFixture({ history: '.DDMmD', today: 14355, config: cfg, nowFrac: 0.99 });
    expect(f.stamp).toBe('14355.9900');
    expect(fromUnix(f.now, cfg)).toBe(14355 * 86400 + Math.floor(0.99 * 86400));
    const r = computeRecord(f.data, f.now, cfg);
    expect(r.days.map((d) => d.status)).toEqual(['done', 'done', 'missed', 'missed', 'done', 'upcoming', 'upcoming', 'upcoming', 'upcoming']);
    // the same data read with midnight-UTC days shifts logs across boundaries
    const shifted = computeRecord(f.data, f.now, DEFAULT_CONFIG);
    expect(shifted.days.map((d) => d.status)).not.toEqual(r.days.map((d) => d.status));
  });
});
