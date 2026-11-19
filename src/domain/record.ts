/**
 * Day evaluation and the record (docs/design/02-workflows.md §3; 00-brief.md →
 * Success metric, Reserves). Everything here is derived from stored logs and
 * plans by pure functions — no stored counters.
 *
 * - A log belongs to the day of its end moment (sessions) or its unix (checks).
 * - The record starts at the first planned day.
 * - A closed day (N+1.0000 ≤ now) is done or missed; today is done as soon as
 *   every item is satisfied.
 * - Streak: consecutive days without an unprotected miss. A missed day uses a
 *   reserve if one is held and the previous day was not missed (a protected
 *   day still counts as missed for this rule): the streak holds. Otherwise it
 *   breaks to 0. Reserves: +1 per on-time cycle approval, credited at the start
 *   of the first day it covers (the cycle's first day), capped at 2.
 */

import type { DayConfig } from '../time/daykeep';
import { approvalFor, dayAt, findPlan, firstCoveredDay, isDayPlanned, isOnTime } from './plan';
import type {
  DayPlan,
  DrillLog,
  Justification,
  MoodCheck,
  PlanItem,
  RecordData,
  RestItem,
  RestSession,
  WorkoutItem,
  WorkoutSession,
  WorkoutTargets,
} from './types';

export const RESERVE_CAP = 2;
export const AVERAGE_WINDOW = 100;

export type DayStatus = 'outside' | 'upcoming' | 'today' | 'done' | 'missed';

export interface ItemProgress {
  item: PlanItem;
  satisfied: boolean;
  /** Logged amount toward the item: matching sessions (0/1) or check count. */
  current: number;
  /** 1 for workouts and rests, `count` for mood and drill items. */
  required: number;
}

export interface DayEvaluation {
  day: number;
  status: DayStatus;
  /** Planned per the rules (approved, valid, saved before the day started). */
  planned: boolean;
  plan?: DayPlan;
  items: ItemProgress[];
  satisfiedCount: number;
  totalCount: number;
  /** Missed, but a reserve kept the streak (set by computeRecord only). */
  protected: boolean;
  justification?: Justification;
}

export interface DayLogs {
  sessions: WorkoutSession[];
  rests: RestSession[];
  moods: MoodCheck[];
  drills: DrillLog[];
}

/* --- matching ----------------------------------------------------------- */

/** Does a session's actuals meet every target set on an item? */
export function meetsTargets(s: WorkoutSession, t: WorkoutTargets): boolean {
  return (
    (t.totalSeconds === undefined || s.totalSeconds >= t.totalSeconds) &&
    (t.rounds === undefined || s.roundsCompleted >= t.rounds) &&
    (t.hangSeconds === undefined || (s.hangSeconds ?? 0) >= t.hangSeconds) &&
    (t.ropeTurns === undefined || (s.ropeTurns ?? 0) >= t.ropeTurns)
  );
}

export function sessionSatisfies(s: WorkoutSession, item: WorkoutItem): boolean {
  return s.completedFull && s.routineId === item.routineId && meetsTargets(s, item.targets);
}

/** Rest items must match the rest kind, run in full, for at least the planned duration. */
export function restSatisfies(r: RestSession, item: RestItem): boolean {
  return r.completedFull && r.restKind === item.restKind && r.durationSeconds >= item.durationSeconds;
}

/**
 * Maximum bipartite matching (Kuhn's algorithm): each item gets its own
 * distinct log. Returns, per item index, the matched log index or -1.
 */
export function matchItems<I, L>(items: I[], logs: L[], fits: (log: L, item: I) => boolean): number[] {
  const logOwner = new Array<number>(logs.length).fill(-1);
  const itemLog = new Array<number>(items.length).fill(-1);
  const tryItem = (i: number, seen: boolean[]): boolean => {
    for (let l = 0; l < logs.length; l++) {
      if (seen[l] || !fits(logs[l], items[i])) continue;
      seen[l] = true;
      if (logOwner[l] === -1 || tryItem(logOwner[l], seen)) {
        logOwner[l] = i;
        itemLog[i] = l;
        return true;
      }
    }
    return false;
  };
  for (let i = 0; i < items.length; i++) tryItem(i, new Array<boolean>(logs.length).fill(false));
  return itemLog;
}

/** Progress of each plan item given the logs of its day. Extra logs never hurt. */
export function evaluateItems(items: PlanItem[], logs: DayLogs): ItemProgress[] {
  const workouts = items.filter((i): i is WorkoutItem => i.kind === 'workout');
  const rests = items.filter((i): i is RestItem => i.kind === 'rest');
  const wMatch = matchItems(workouts, logs.sessions, sessionSatisfies);
  const rMatch = matchItems(rests, logs.rests, restSatisfies);
  return items.map((item) => {
    switch (item.kind) {
      case 'workout': {
        const ok = wMatch[workouts.indexOf(item)] !== -1;
        return { item, satisfied: ok, current: ok ? 1 : 0, required: 1 };
      }
      case 'rest': {
        const ok = rMatch[rests.indexOf(item)] !== -1;
        return { item, satisfied: ok, current: ok ? 1 : 0, required: 1 };
      }
      case 'mood':
        return { item, satisfied: logs.moods.length >= item.count, current: logs.moods.length, required: item.count };
      case 'drill':
        return { item, satisfied: logs.drills.length >= item.count, current: logs.drills.length, required: item.count };
    }
  });
}

/* --- indexing ----------------------------------------------------------- */

function groupBy<T>(xs: T[], key: (x: T) => number): Map<number, T[]> {
  const m = new Map<number, T[]>();
  for (const x of xs) {
    const k = key(x);
    const list = m.get(k);
    if (list) list.push(x);
    else m.set(k, [x]);
  }
  return m;
}

/** Logs grouped by the day they belong to. */
export class LogIndex {
  private sessions: Map<number, WorkoutSession[]>;
  private rests: Map<number, RestSession[]>;
  private moods: Map<number, MoodCheck[]>;
  private drills: Map<number, DrillLog[]>;
  private justifications: Map<number, Justification>;

  constructor(data: RecordData, cfg: DayConfig) {
    this.sessions = groupBy(data.sessions, (s) => dayAt(s.endUnix, cfg));
    this.rests = groupBy(data.rests, (r) => dayAt(r.endUnix, cfg));
    this.moods = groupBy(data.moods, (m) => dayAt(m.unix, cfg));
    this.drills = groupBy(data.drills, (d) => dayAt(d.unix, cfg));
    this.justifications = new Map();
    for (const j of [...data.justifications].sort((a, b) => a.unix - b.unix)) this.justifications.set(j.day, j);
  }

  logsOf(day: number): DayLogs {
    return {
      sessions: this.sessions.get(day) ?? [],
      rests: this.rests.get(day) ?? [],
      moods: this.moods.get(day) ?? [],
      drills: this.drills.get(day) ?? [],
    };
  }

  justificationOf(day: number): Justification | undefined {
    return this.justifications.get(day);
  }
}

/* --- record start & day status ------------------------------------------ */

/** First planned day (the record's first day), or null if nothing is planned. */
export function recordStartDay(data: Pick<RecordData, 'cycles' | 'plans'>, cfg: DayConfig): number | null {
  let start: number | null = null;
  for (const plan of data.plans) {
    if ((start === null || plan.day < start) && isDayPlanned(plan.day, data.cycles, data.plans, cfg)) start = plan.day;
  }
  return start;
}

function evaluateWith(
  day: number,
  data: RecordData,
  index: LogIndex,
  start: number | null,
  today: number,
  cfg: DayConfig,
): DayEvaluation {
  const planned = isDayPlanned(day, data.cycles, data.plans, cfg);
  const plan = findPlan(data.plans, day);
  const items = plan ? evaluateItems(plan.items, index.logsOf(day)) : [];
  const satisfiedCount = items.filter((i) => i.satisfied).length;
  const allDone = planned && items.length > 0 && satisfiedCount === items.length;
  let status: DayStatus;
  if (start === null || day < start) status = 'outside';
  else if (day > today) status = 'upcoming';
  else if (allDone) status = 'done';
  else status = day === today ? 'today' : 'missed';
  return {
    day,
    status,
    planned,
    plan,
    items,
    satisfiedCount,
    totalCount: items.length,
    protected: false,
    justification: index.justificationOf(day),
  };
}

/** Status and item progress of one day, without streak/reserve information. */
export function evaluateDay(day: number, data: RecordData, now: number, cfg: DayConfig): DayEvaluation {
  return evaluateWith(day, data, new LogIndex(data, cfg), recordStartDay(data, cfg), dayAt(now, cfg), cfg);
}

/* --- the record --------------------------------------------------------- */

export interface RecordSummary {
  today: number;
  recordStartDay: number | null;
  /** recordStartDay .. max(today, last planned day); empty when there's no record. */
  days: DayEvaluation[];
  todayEval: DayEvaluation;
  streak: number;
  bestStreak: number;
  reservesHeld: number;
  /** Missed days covered by a reserve (streak held). */
  protectedDays: number[];
  /** Missed days that broke the streak (unprotected misses). */
  brokenDays: number[];
  /** done / days in window, or null when the window is empty. */
  average: number | null;
  averageDone: number;
  averageDays: number;
  /** Today is in the record and the previous (closed) day was missed. */
  isRecoveryDay: boolean;
  /** Missed closed days without a justification, oldest first. */
  pendingJustifications: number[];
}

/** Day each on-time approval's reserve is credited at (its first covered day). */
export function reserveCredits(data: Pick<RecordData, 'cycles'>, cfg: DayConfig): number[] {
  return data.cycles
    .filter((a) => approvalFor(data.cycles, a.cycle) === a && isOnTime(a, data.cycles, cfg))
    .map((a) => firstCoveredDay(a, cfg))
    .sort((a, b) => a - b);
}

export function computeRecord(data: RecordData, now: number, cfg: DayConfig): RecordSummary {
  const today = dayAt(now, cfg);
  const index = new LogIndex(data, cfg);
  const start = recordStartDay(data, cfg);
  const evalDay = (d: number) => evaluateWith(d, data, index, start, today, cfg);

  const empty: RecordSummary = {
    today,
    recordStartDay: start,
    days: [],
    todayEval: evalDay(today),
    streak: 0,
    bestStreak: 0,
    reservesHeld: 0,
    protectedDays: [],
    brokenDays: [],
    average: null,
    averageDone: 0,
    averageDays: 0,
    isRecoveryDay: false,
    pendingJustifications: [],
  };
  if (start === null) return empty;

  const lastPlanned = data.plans.reduce(
    (m, p) => (p.day > m && isDayPlanned(p.day, data.cycles, data.plans, cfg) ? p.day : m),
    start,
  );
  const end = Math.max(today, lastPlanned);
  const days: DayEvaluation[] = [];
  for (let d = start; d <= end; d++) days.push(evalDay(d));
  const byDay = (d: number) => days[d - start];

  // Walk the started days in order: reserves, streak.
  const credits = reserveCredits(data, cfg);
  let ci = 0;
  let reserves = 0;
  let streak = 0;
  let best = 0;
  const protectedDays: number[] = [];
  const brokenDays: number[] = [];
  for (let d = start; d <= today; d++) {
    while (ci < credits.length && credits[ci] <= d) {
      reserves = Math.min(RESERVE_CAP, reserves + 1);
      ci++;
    }
    const e = byDay(d);
    if (e.status === 'done') {
      streak++;
    } else if (e.status === 'missed') {
      const prevMissed = d > start && byDay(d - 1).status === 'missed';
      if (reserves > 0 && !prevMissed) {
        reserves--;
        e.protected = true;
        protectedDays.push(d);
      } else {
        streak = 0;
        brokenDays.push(d);
      }
    }
    best = Math.max(best, streak);
  }

  // 100-day average: the last 100 closed record days, plus today once done.
  const window: DayEvaluation[] = [];
  for (let d = start; d < today; d++) window.push(byDay(d));
  if (today >= start && byDay(today).status === 'done') window.push(byDay(today));
  const last = window.slice(-AVERAGE_WINDOW);
  const averageDone = last.filter((e) => e.status === 'done').length;

  const pendingJustifications: number[] = [];
  for (let d = start; d < today; d++) {
    const e = byDay(d);
    if (e.status === 'missed' && !e.justification) pendingJustifications.push(d);
  }

  return {
    today,
    recordStartDay: start,
    days,
    todayEval: today >= start ? byDay(today) : evalDay(today),
    streak,
    bestStreak: best,
    reservesHeld: reserves,
    protectedDays,
    brokenDays,
    average: last.length ? averageDone / last.length : null,
    averageDone,
    averageDays: last.length,
    isRecoveryDay: today > start && byDay(today - 1).status === 'missed',
    pendingJustifications,
  };
}
