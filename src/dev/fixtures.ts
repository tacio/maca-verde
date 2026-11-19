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
import type { AppData, DayPlan, PlanItem, WorkoutItem, WorkoutRoutine, WorkoutSession } from '../domain/types';
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
  /** Leave the last closed cycle's clean-cycle moment unshown (default: already shown, as after a normal open). */
  cleanCycleDue?: boolean;
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
  if (!opts.cleanCycleDue) data.settings.cleanCycleShown = cycleOf(today) - 1;

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

/** Varied neck scores and moods over the last 10 days, so the trends show a shape. */
function varyTrends(data: AppData, f: Fixture): void {
  const today = Math.floor((f.now - f.config.epoch) / f.config.dayLength);
  const neck = [4, 3, 3, 2, 3, 2, 1, 2, 1, 1];
  const valences = ['frustrated', 'neutral', 'good', 'good', 'exhausted', 'good', 'great', 'good', 'great', 'good'] as const;
  for (const s of data.sessions) {
    const back = today - Math.floor((s.endUnix - f.config.epoch) / f.config.dayLength);
    if (back >= 0 && back < 10) s.neck = neck[9 - back];
  }
  for (const m of data.moods) {
    const back = today - Math.floor((m.unix - f.config.epoch) / f.config.dayLength);
    if (back >= 0 && back < 10 && (back !== 3 || m.id.endsWith('-0'))) m.valence = valences[9 - back];
  }
}

const CUSTOM_ROUTINE: WorkoutRoutine = {
  id: 'custom-evening-rope',
  title: 'Evening rope',
  subtitle: '',
  protocol: 'circuit',
  description: '',
  primaryGoal: 'hybrid',
  exercises: [
    { exerciseId: 'rope-boxer-skip-hiit', workSeconds: 45, restSeconds: 15 },
    { exerciseId: 'door-bar-dead-hang', workSeconds: 30, restSeconds: 30 },
    { exerciseId: 'chin-tuck-cobra-hold', workSeconds: 30, restSeconds: 15 },
  ],
  rounds: 3,
  roundRestSeconds: 60,
  prepSeconds: 10,
  estimatedCalories: 53,
  estimatedDurationMinutes: 9,
};

function addCustomRoutine(data: AppData): void {
  data.routines.push(structuredClone(CUSTOM_ROUTINE));
}

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
  'today-recovery-done': {
    description: 'Recovery day completed after a protected miss: "Back on track"',
    fixture: { history: since14340(run(14) + 'M', 'D'), today: TODAY },
  },
  'workout-preview': {
    description: "Workout preview sheet for today's workout (intervals, How? per exercise)",
    fixture: { history: STANDARD, today: TODAY },
    screen: `preview:${TODAY}-0`,
  },
  mood: {
    description: 'Mood check (J5): valence, HALT, save',
    fixture: { history: since14340(run(15), 'P'), today: TODAY },
    screen: 'mood',
  },
  'mood-more': {
    description: 'Mood check with "More" open: energy, tension, speaking, notes',
    fixture: { history: since14340(run(15), 'P'), today: TODAY },
    screen: 'mood:more',
  },
  justify: {
    description: 'Close yesterday (J7): streak kept with a reserve, today is a recovery day',
    fixture: { history: since14340(run(14) + 'm', 'T'), today: TODAY },
    screen: 'justify',
  },
  'justify-broken': {
    description: 'Close yesterday after a protected miss: streak reset, average stays',
    fixture: { history: since14340(run(13) + 'Mm', 'T'), today: TODAY },
    screen: 'justify',
  },
  'justify-stack': {
    description: 'Three days to close, oldest first: "1 of 3"',
    fixture: { history: since14340(run(12) + 'mmm', 'T'), today: TODAY },
    screen: 'justify',
  },
  'clean-cycle': {
    description: 'First open after cycle 1434 closed 10 of 10 done: the clean-cycle moment (once)',
    fixture: { history: '.' + run(10) + 'T', today: 14350, cleanCycleDue: true },
  },
  'cycle-tomorrow': {
    description: "Today done, next cycle (1436) starts tomorrow unapproved: approving it is Today's primary",
    fixture: { history: '.' + run(19) + 'D', today: 14359 },
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
  'cycle-approve': {
    description: 'Approve the next cycle (1436), pre-filled, 2 days before it starts; one justified miss to look back on',
    fixture: { history: '.' + run(14) + 'M' + run(3) + 'D', today: 14358 },
    screen: 'cycle',
  },
  'cycle-approve-full': {
    description: 'Approve the next cycle (1436) on time while 2 protections are held: "protection full", never "+1"',
    fixture: { history: '.' + run(18) + 'D', today: 14358 },
    screen: 'cycle',
  },
  'cycle-late': {
    description: 'Cycle 1436 started today without approval: the other 9 days can still be planned (late, no reserve)',
    fixture: { history: '.' + run(20) + 'T', today: 14360 },
    tweak: (data) => {
      data.cycles = data.cycles.filter((c) => c.cycle !== 1436);
      data.plans = data.plans.filter((p) => p.day < 14360);
    },
    screen: 'cycle',
  },
  'day-edit': {
    description: 'Day editor on tomorrow (editable): a workout and a rest, with last actuals and suggestions',
    fixture: { history: STANDARD, today: TODAY },
    tweak: (data, f) => {
      const tomorrow = data.plans.find((p) => p.day === TODAY + 1)!;
      tomorrow.items.splice(1, 0, { id: `${TODAY + 1}-r`, kind: 'rest', restKind: 'silence', durationSeconds: 900 });
      const end = f.now - 3600;
      data.rests.push({ id: 'r-today', restKind: 'silence', startUnix: end - 600, endUnix: end, durationSeconds: 600, completedFull: true });
    },
    screen: 'day-edit',
  },
  'day-edit-empty': {
    description: 'Day editor with every item removed: Save disabled',
    fixture: { history: STANDARD, today: TODAY },
    screen: `day-edit:${TODAY + 1}:blank`,
  },
  'day-locked': {
    description: "Today's plan, read-only (locked since today started)",
    fixture: { history: STANDARD, today: TODAY },
    screen: 'day-locked',
  },
  plan: {
    description: 'Plan: this cycle (approved) and the next one (not approved yet)',
    fixture: { history: STANDARD, today: TODAY },
    screen: 'plan',
  },
  'plan-approved': {
    description: 'Plan: the next cycle is already approved',
    fixture: { history: STANDARD, today: TODAY, approveNext: true },
    screen: 'plan',
  },
  'progress-empty': {
    description: 'Progress with no history yet (record starts tomorrow)',
    fixture: { history: '.', today: TODAY },
    screen: 'progress',
  },
  'progress-100': {
    description: 'Progress with 105 closed days: clean cycles marked, records, 10-day neck and mood trends',
    fixture: { history: HUNDRED, today: TODAY },
    tweak: varyTrends,
    screen: 'progress',
  },
  history: {
    description: 'History: record days newest first, misses with their reasons',
    fixture: { history: HUNDRED, today: TODAY },
    tweak: varyTrends,
    screen: 'history',
  },
  'history-day': {
    description: 'One closed, missed day (354): plan items, the mood check logged, the reason',
    fixture: { history: since14340(run(14) + 'M', 'T'), today: TODAY },
    screen: `history:${TODAY - 1}`,
  },
  'history-day-done': {
    description: 'One done day (353): plan, workout session in seconds, mood checks, drill',
    fixture: { history: since14340(run(14) + 'M', 'T'), today: TODAY },
    screen: `history:${TODAY - 2}`,
  },
  'hud-work': {
    description: "Workout HUD on today's Rope, first work phase (accent screen, bare seconds)",
    fixture: { history: STANDARD, today: TODAY },
    screen: `workout:${TODAY}-0:work`,
  },
  'hud-rest': {
    description: 'Workout HUD in a rest phase (rest color, "next: …")',
    fixture: { history: STANDARD, today: TODAY },
    screen: `workout:${TODAY}-0:rest`,
  },
  'hud-paused': {
    description: 'Workout HUD paused: sheet with Resume, End workout and How?',
    fixture: { history: STANDARD, today: TODAY },
    screen: `workout:${TODAY}-0:paused`,
  },
  'workout-log': {
    description: 'Post-workout log after a full Rope session: RPE, neck, rope turns (target), drill offer',
    fixture: { history: STANDARD, today: TODAY },
    screen: `workout-log:${TODAY}-0:full`,
  },
  'workout-log-early': {
    description: 'Post-workout log after ending early: real numbers, the item stays open',
    fixture: { history: STANDARD, today: TODAY },
    screen: `workout-log:${TODAY}-0:early`,
  },
  'drill-elevate': {
    description: 'Pause drill, step 1: raise the pulse (30 s)',
    fixture: { history: STANDARD, today: TODAY },
    screen: 'drill:elevate',
  },
  'drill-sigh': {
    description: 'Pause drill, step 3: physiological sigh with the breathing guide',
    fixture: { history: STANDARD, today: TODAY },
    screen: 'drill:sigh',
  },
  'drill-scenario': {
    description: 'Pause drill, step 4: a provocation scenario, choose the paused reply',
    fixture: { history: STANDARD, today: TODAY },
    screen: 'drill:scenario',
  },
  'rest-timer': {
    description: 'Rest practice (silence, .0104) a third of the way in: slow ring, Pause/End',
    fixture: { history: STANDARD, today: TODAY },
    tweak: (data) => {
      const today = data.plans.find((p) => p.day === TODAY)!;
      today.items.splice(1, 0, { id: `${TODAY}-r`, kind: 'rest', restKind: 'silence', durationSeconds: 900 });
    },
    screen: `rest:${TODAY}-r:mid`,
  },
  settings: {
    description: 'Settings',
    fixture: { history: STANDARD, today: TODAY },
    screen: 'settings',
  },
  'settings-day': {
    description: 'Settings → Day: day 0 and day length with the live preview',
    fixture: { history: STANDARD, today: TODAY },
    screen: 'settings-day',
  },
  'settings-day-confirm': {
    description: 'Settings → Day after changing day 0: confirm that day numbers change',
    fixture: { history: STANDARD, today: TODAY },
    screen: 'settings-day:confirm',
  },
  'settings-anchor': {
    description: 'Settings → Anchor',
    fixture: { history: STANDARD, today: TODAY },
    screen: 'settings-anchor',
  },
  'settings-coach': {
    description: 'Settings → Coach: voice and beeps, Test voice',
    fixture: { history: STANDARD, today: TODAY },
    screen: 'settings-coach',
  },
  'settings-template': {
    description: 'Settings → Template: 9 slots from cycle 1434, slot 7 empty',
    fixture: { history: STANDARD, today: TODAY },
    tweak: (data) => {
      data.template = data.template.map((_, i) => (i === 7 ? [] : (data.plans.find((p) => p.day === 14340 + i)?.items ?? [])));
    },
    screen: 'settings-template',
  },
  'settings-template-slot': {
    description: 'Settings → Template → slot 3, edited with the day editor cards',
    fixture: { history: STANDARD, today: TODAY },
    tweak: (data) => {
      data.template[3] = data.plans.find((p) => p.day === 14343)!.items;
    },
    screen: 'settings-template:3',
  },
  'settings-routines': {
    description: 'Settings → Routines: one custom routine, the built-in ones',
    fixture: { history: STANDARD, today: TODAY },
    tweak: addCustomRoutine,
    screen: 'settings-routines',
  },
  'settings-routine-edit': {
    description: 'Settings → Routines → edit a custom routine',
    fixture: { history: STANDARD, today: TODAY },
    tweak: addCustomRoutine,
    screen: `settings-routine-edit:${CUSTOM_ROUTINE.id}`,
  },
  'settings-routine': {
    description: 'Settings → Routines → a built-in routine, read-only, How? per exercise',
    fixture: { history: STANDARD, today: TODAY },
    screen: 'settings-routine:tabata-belly-shred',
  },
  'settings-data': {
    description: 'Settings → Data: export / import, Drive not connected (offline)',
    fixture: { history: STANDARD, today: TODAY },
    screen: 'settings-data',
  },
  'settings-data-connected': {
    description: 'Settings → Data with Drive connected (simulated, no network) and a last backup stamp',
    fixture: { history: STANDARD, today: TODAY },
    tweak: (data, f) => {
      data.settings.drive = { clientId: '123-example.apps.googleusercontent.com', autoBackup: true, lastBackupUnix: f.now - 5000 };
    },
    screen: 'settings-data:connected',
  },
  'settings-reset': {
    description: 'Settings → Reset: replay setup, erase with typed confirmation',
    fixture: { history: STANDARD, today: TODAY },
    screen: 'settings-reset',
  },
};

/** Build a fixture scenario: data (tweaked), now and storage entries. */
export function buildScenarioFixture(s: FixtureScenario): Fixture {
  const f = buildFixture(s.fixture);
  s.tweak?.(f.data, f);
  return f;
}
