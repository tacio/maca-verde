/**
 * Fixture builder for dev scenarios and tests: produces AppData — and the
 * storage entries store.ts writes for it — from a compact history pattern.
 *
 * Pattern: one character per day, the last one is today.
 *
 *   .  before the record: setup / warm-up day, no plan (leading only).
 *      If the pattern is all dots, the record starts tomorrow.
 *   D  done: every plan item satisfied (today too, if last)
 *   M  missed, justified (one mood check logged, nothing else)
 *   m  missed, justification still pending (same logs as M)
 *   P  today only: partial (the workout and one mood check done)
 *   T  today only: nothing logged yet
 *
 * Example: '.DDDDMDT' — setup day, 4 done, 1 missed (justified), 1 done, today
 * untouched.
 *
 * Consistency with the rules:
 * - Every planned day uses the engine's suggestion (suggestDay with no history).
 * - Plans run from the first record day to the end of today's cycle (and the
 *   whole next cycle with `approveNext`). Each cycle is approved at .0200 of
 *   the day before its first covered day (on time); the first approval is the
 *   onboarding one, made on the setup day.
 * - Logs of closed days are spread over the day's first 90%; today's logs
 *   happen before `now`.
 * - Justifications are written at .0100 of the next day.
 */

import { DEFAULT_CONFIG, cycleOf, formatStamp, fromUnix, type DayConfig } from '../time/daykeep';
import { cycleDays, dayStartUnix } from '../domain/plan';
import { findRoutine, suggestDay } from '../domain/engine';
import type { AppData, DayPlan, PlanItem, WorkoutItem, WorkoutSession } from '../domain/types';
import { emptyData, toStorageEntries } from '../storage/store';

export interface FixtureOptions {
  history: string;
  /** Day number of today (the pattern's last character). */
  today: number;
  /** Fraction of today elapsed at `now`, 0.05..0.99 (default 0.4). */
  nowFrac?: number;
  config?: DayConfig;
  /** Also plan and approve (on time) the cycle after today's. */
  approveNext?: boolean;
  anchor?: string;
}

export interface Fixture {
  data: AppData;
  /** Unix seconds of "now". */
  now: number;
  /** "now" as a daykeep stamp, e.g. "14355.4000". */
  stamp: string;
  config: DayConfig;
  /** First record day, or null (never null: an all-dot pattern starts tomorrow). */
  recordStartDay: number;
}

const DAY_CHARS = /^(\.+|\.*[DMm]*[DPT])$/;

export function buildFixture(opts: FixtureOptions): Fixture {
  const cfg = opts.config ?? DEFAULT_CONFIG;
  const nowFrac = opts.nowFrac ?? 0.4;
  const { history, today } = opts;
  if (nowFrac < 0.05 || nowFrac > 0.99) throw new Error(`nowFrac out of range: ${nowFrac}`);
  if (!DAY_CHARS.test(history)) throw new Error(`bad history pattern: "${history}"`);
  const len = cfg.dayLength;
  const at = (day: number, frac: number) => dayStartUnix(day, cfg) + Math.floor(frac * len);
  const now = at(today, nowFrac);
  const firstDay = today - history.length + 1;
  const dots = history.match(/^\.*/)![0].length;
  const recordStart = firstDay + dots; // == today + 1 when all dots
  const charOf = (d: number) => history[d - firstDay];

  const data = emptyData();
  data.settings.config = { ...cfg };
  data.settings.anchor = opts.anchor ?? 'After coffee';

  // Plans and approvals.
  const lastCycle = cycleOf(Math.max(today, recordStart)) + (opts.approveNext ? 1 : 0);
  const planFor = (d: number): PlanItem[] => suggestDay(d, [], cfg);
  for (let c = cycleOf(recordStart); c <= lastCycle; c++) {
    const first = Math.max(c * 10, recordStart);
    const approvedUnix = at(first - 1, 0.02);
    if (c === cycleOf(recordStart)) data.settings.onboardedUnix = at(first - 1, 0.01);
    for (const d of cycleDays(c)) {
      if (d < first) continue;
      data.plans.push({ day: d, items: planFor(d), updatedUnix: approvedUnix } satisfies DayPlan);
    }
    data.cycles.push({ cycle: c, approvedUnix });
  }

  // Logs for started record days.
  for (let d = recordStart; d <= today; d++) {
    const ch = charOf(d);
    const span = d === today ? nowFrac : 0.9;
    const items = data.plans.find((p) => p.day === d)!.items;
    if (ch === 'D') logAll(data, d, items, span, cfg);
    else if (ch === 'P') {
      for (const w of items.filter((i): i is WorkoutItem => i.kind === 'workout')) addSession(data, d, w, at(d, span * 0.5), 0);
      addMood(data, d, 0, at(d, span * 0.25));
    } else if (ch === 'M' || ch === 'm') {
      addMood(data, d, 0, at(d, span * 0.25));
      if (ch === 'M') {
        data.justifications.push({ day: d, reason: 'time', text: 'Long day at work', unix: at(d + 1, 0.01) });
      }
    }
  }

  return { data, now, stamp: formatStamp(fromUnix(now, cfg), cfg), config: cfg, recordStartDay: recordStart };
}

function logAll(data: AppData, day: number, items: PlanItem[], span: number, cfg: DayConfig): void {
  const at = (frac: number) => dayStartUnix(day, cfg) + Math.floor(frac * span * cfg.dayLength);
  let w = 0;
  for (const item of items) {
    if (item.kind === 'workout') addSession(data, day, item, at(0.5 + 0.05 * w), w++);
    else if (item.kind === 'rest') {
      const end = at(0.95);
      data.rests.push({
        id: `r-${day}-${item.id}`,
        restKind: item.restKind,
        startUnix: end - item.durationSeconds,
        endUnix: end,
        durationSeconds: item.durationSeconds,
        completedFull: true,
      });
    } else if (item.kind === 'mood') {
      for (let i = 0; i < item.count; i++) addMood(data, day, i, at(0.1 + (0.3 * i) / item.count));
    } else {
      for (let i = 0; i < item.count; i++) {
        data.drills.push({
          id: `d-${day}-${i}`,
          unix: at(0.8 + (0.1 * i) / item.count),
          drillType: 'high_hr_pause',
          heartRateState: i === 0 ? 'elevated_post_hiit' : 'resting',
          pauseSecondsAchieved: 5,
          impulseResisted: true,
        });
      }
    }
  }
}

function addSession(data: AppData, day: number, item: WorkoutItem, endUnix: number, n: number): void {
  const r = findRoutine(item.routineId);
  const totalSeconds = Math.max(item.targets.totalSeconds ?? 0, (r?.estimatedDurationMinutes ?? 10) * 60);
  const rounds = Math.max(item.targets.rounds ?? 0, r?.rounds ?? 1);
  const s: WorkoutSession = {
    id: `s-${day}-${n}`,
    routineId: item.routineId,
    startUnix: endUnix - totalSeconds,
    endUnix,
    completedFull: true,
    totalSeconds,
    roundsCompleted: rounds,
    totalRounds: rounds,
    rpe: 7,
    neck: 2,
    estimatedCalories: r?.estimatedCalories ?? 100,
  };
  if (item.targets.hangSeconds !== undefined) s.hangSeconds = item.targets.hangSeconds + 3;
  if (item.targets.ropeTurns !== undefined) s.ropeTurns = item.targets.ropeTurns + 10;
  data.sessions.push(s);
}

function addMood(data: AppData, day: number, i: number, unix: number): void {
  data.moods.push({
    id: `m-${day}-${i}`,
    unix,
    valence: 'good',
    halt: { hungry: false, angry: false, lonely: false, tired: false },
  });
}

/** Storage entries (key → value, as store.ts writes them) for a fixture. */
export function fixtureStorage(f: Fixture): Record<string, unknown> {
  return toStorageEntries(f.data);
}

/* --- data-state scenarios (docs/design/03-tooling.md §4) ----------------- */

export interface FixtureScenario {
  description: string;
  fixture: FixtureOptions;
  /** Post-process the built data (e.g. flag HALT on today's check). */
  tweak?: (data: AppData, f: Fixture) => void;
  screen?: string;
}

/** Most scenarios sit mid-cycle on day 14355 at .4000 with DEFAULT_CONFIG. */
const TODAY = 14355;
const run = (n: number, ch = 'D') => ch.repeat(n);
/** Setup on 14339, record from 14340 (a cycle start) to today. */
const since14340 = (middle: string, last: string) => {
  const h = '.' + middle + last;
  if (h.length !== TODAY - 14339 + 1) throw new Error(`pattern length ${h.length} doesn't end on ${TODAY}`);
  return h;
};
const STANDARD = since14340(run(15), 'T');

/** 105 closed days from 14250 (10.5 cycles) with a few misses, incl. one double miss. */
const HUNDRED =
  '.' +
  ['DDDDDDDDDD', 'DDDMDDDDDD', 'DDDDDDDDDD', 'DDDDDMMDDD', 'DDDDDDDDDD', 'DDDDDDDDMD', 'DDDDDDDDDD', 'DMDDDDDDDD', 'DDDDDDDDDD', 'DDDDDDDDDD', 'DDDDD'].join('') +
  'T';

export const FIXTURE_SCENARIOS: Record<string, FixtureScenario> = {
  warmup: {
    description: 'Day of setup; the record starts tomorrow',
    fixture: { history: '.', today: TODAY },
  },
  'today-start': {
    description: 'Today at 0%, streak 15',
    fixture: { history: STANDARD, today: TODAY },
  },
  'today-mid': {
    description: 'Today partly done (workout + 1 of 2 mood checks)',
    fixture: { history: since14340(run(15), 'P'), today: TODAY },
  },
  'today-done': {
    description: 'Today 100% done',
    fixture: { history: since14340(run(15), 'D'), today: TODAY },
  },
  halt: {
    description: "Today's latest mood check flags HALT (tired, hungry)",
    fixture: { history: since14340(run(15), 'P'), today: TODAY },
    tweak: (data) => {
      const latest = data.moods.reduce((a, b) => (b.unix > a.unix ? b : a));
      latest.valence = 'exhausted';
      latest.halt = { hungry: true, angry: false, lonely: false, tired: true };
    },
  },
  'missed-yesterday': {
    description: 'Yesterday missed, justification pending (reserve used)',
    fixture: { history: since14340(run(14) + 'm', 'T'), today: TODAY },
  },
  'missed-three': {
    description: 'Three missed days pending justification (stacked)',
    fixture: { history: since14340(run(12) + 'mmm', 'T'), today: TODAY },
  },
  recovery: {
    description: 'Recovery day after a protected, justified miss',
    fixture: { history: since14340(run(14) + 'M', 'T'), today: TODAY },
  },
  'streak-broken': {
    description: 'Two misses in a row broke the streak (average as hero)',
    fixture: { history: since14340(run(13) + 'MM', 'T'), today: TODAY },
  },
  'cycle-due': {
    description: "Today done, next cycle (1436) starts in 2 days and isn't approved",
    fixture: { history: '.' + run(18) + 'D', today: 14358 },
  },
  'day-edit': {
    description: 'Day editor on an upcoming (editable) day',
    fixture: { history: STANDARD, today: TODAY },
    screen: 'day-edit',
  },
  'day-locked': {
    description: "Day editor read-only on today's (locked) plan",
    fixture: { history: STANDARD, today: TODAY },
  },
  'progress-empty': {
    description: 'Progress with no history yet (record starts tomorrow)',
    fixture: { history: '.', today: TODAY },
    screen: 'progress',
  },
  'progress-100': {
    description: 'Progress with 105 closed days of history',
    fixture: { history: HUNDRED, today: TODAY },
    screen: 'progress',
  },
  settings: {
    description: 'Settings',
    fixture: { history: STANDARD, today: TODAY },
    screen: 'settings',
  },
};

/** Build a fixture scenario: data (tweaked), now and storage entries. */
export function buildScenarioFixture(s: FixtureScenario): Fixture {
  const f = buildFixture(s.fixture);
  s.tweak?.(f.data, f);
  return f;
}
