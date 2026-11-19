/**
 * Pure helpers for Progress (J8): trends of the last 10 days, the history
 * list and one day's detail. No React here (unit-tested in progress.test.ts).
 *
 * Single activities are shown in seconds; moments within a day as daykeep
 * fractions (".4123"); days as day numbers. No civil dates.
 */

import { formatTimeOfDay, fromUnix, shortDay, type DayConfig } from '../time/daykeep';
import { formatSeconds } from '../time/seconds';
import { dayAt } from '../domain/plan';
import type { RecordSummary } from '../domain/record';
import type { AppData, MoodCheck, ValenceType, WorkoutRoutine, WorkoutSession } from '../domain/types';
import { REASON_LABEL, VALENCE_LABEL } from './today';
import { classifyDay, daySummary, progressText, routineName, type CellKind } from './view';

/* --- trends ---------------------------------------------------------------- */

export const TREND_DAYS = 10;

/** Pleasant → unpleasant. The three unpleasant valences differ in arousal, not valence, so they share a score. */
export const VALENCE_SCORE: Record<ValenceType, number> = {
  great: 4,
  good: 3,
  neutral: 2,
  frustrated: 1,
  exhausted: 1,
  anxious: 1,
};
export const VALENCE_MAX = 4;
export const NECK_MAX = 10;

export interface TrendPoint {
  day: number;
  /** Mean of the day's values (one decimal), or null when nothing was logged. */
  value: number | null;
}

const mean = (xs: number[]) => (xs.length ? Math.round((xs.reduce((a, b) => a + b, 0) / xs.length) * 10) / 10 : null);

/** The last `n` days ending today, oldest first. */
export function trendDays(today: number, n = TREND_DAYS): number[] {
  return Array.from({ length: n }, (_, i) => today - n + 1 + i);
}

function trend<T>(xs: T[], dayOf: (x: T) => number, valueOf: (x: T) => number, today: number, n: number): TrendPoint[] {
  const byDay = new Map<number, number[]>();
  for (const x of xs) {
    const d = dayOf(x);
    if (d > today || d <= today - n) continue;
    const list = byDay.get(d);
    if (list) list.push(valueOf(x));
    else byDay.set(d, [valueOf(x)]);
  }
  return trendDays(today, n).map((day) => ({ day, value: mean(byDay.get(day) ?? []) }));
}

/** Neck tension (0 = pain free … 10) logged after workouts, per day. */
export function neckTrend(sessions: WorkoutSession[], today: number, cfg: DayConfig, n = TREND_DAYS): TrendPoint[] {
  return trend(sessions, (s) => dayAt(s.endUnix, cfg), (s) => s.neck, today, n);
}

/** Mood valence (VALENCE_SCORE, 1 … 4) of the day's checks. */
export function moodTrend(moods: MoodCheck[], today: number, cfg: DayConfig, n = TREND_DAYS): TrendPoint[] {
  return trend(moods, (m) => dayAt(m.unix, cfg), (m) => VALENCE_SCORE[m.valence], today, n);
}

/** Mean over the days that have a value, or null. */
export function trendAverage(points: TrendPoint[]): number | null {
  return mean(points.flatMap((p) => (p.value === null ? [] : [p.value])));
}

/** Text alternative for a trend row: "Neck tension, last 10 days: 346 2, 347 none, …". */
export function trendLabel(name: string, points: TrendPoint[]): string {
  const parts = points.map((p) => `${shortDay(p.day, 3)} ${p.value === null ? 'none' : p.value}`);
  return `${name}, last ${points.length} days: ${parts.join(', ')}`;
}

/** Closest valence word for a mean score (for the mood trend's summary). */
export function valenceWord(score: number | null): string {
  if (score === null) return '—';
  if (score >= 3.5) return VALENCE_LABEL.great;
  if (score >= 2.5) return VALENCE_LABEL.good;
  if (score >= 1.5) return VALENCE_LABEL.neutral;
  return 'Low';
}

/* --- history list ------------------------------------------------------------ */

export const STATUS_TEXT: Record<CellKind, string> = {
  done: 'Done',
  kept: 'Missed · streak kept',
  missed: 'Missed',
  today: 'Today',
  future: 'Upcoming',
  outside: 'Before the record',
};

export interface HistoryRow {
  day: number;
  kind: CellKind;
  title: string;
  meta: string;
}

/** Record days up to today, newest first: status, then the plan or the reason it wasn't done. */
export function historyRows(record: RecordSummary, cfg: DayConfig, custom: WorkoutRoutine[] = []): HistoryRow[] {
  const start = record.recordStartDay;
  if (start === null || start > record.today) return [];
  const rows: HistoryRow[] = [];
  for (let day = record.today; day >= start; day--) {
    const e = record.days[day - start];
    if (!e) continue;
    const kind = classifyDay(day, record);
    const progress = `${e.satisfiedCount} of ${e.totalCount} done`;
    let title = STATUS_TEXT[kind];
    let meta = e.plan ? daySummary(e.plan.items, cfg, custom).title : 'No plan';
    if (kind === 'today') title = `Today · ${progress}`;
    else if (kind === 'kept' || kind === 'missed') {
      title = `${STATUS_TEXT[kind]} · ${progress}`;
      meta = e.justification ? `${REASON_LABEL[e.justification.reason]} · “${e.justification.text}”` : 'Reason still to write';
    }
    rows.push({ day, kind, title, meta });
  }
  return rows;
}

/* --- one day ------------------------------------------------------------------ */

export interface DetailLine {
  id: string;
  title: string;
  meta: string;
}

export interface DayDetail {
  day: number;
  kind: CellKind;
  status: string;
  /** Plan items with whether each was satisfied. */
  items: { id: string; text: string; done: boolean }[];
  sessions: DetailLine[];
  rests: DetailLine[];
  moods: DetailLine[];
  drills: DetailLine[];
  justification?: { reason: string; text: string };
}

const HALT_WORDS = ['hungry', 'angry', 'lonely', 'tired'] as const;

/** Everything logged on `day`, in the order it happened. */
export function dayDetail(day: number, data: AppData, record: RecordSummary, cfg: DayConfig): DayDetail {
  const at = (unix: number) => formatTimeOfDay(fromUnix(unix, cfg), cfg);
  const custom = data.routines;
  const start = record.recordStartDay;
  const e = start !== null && day >= start ? record.days[day - start] : undefined;
  const kind = classifyDay(day, record);
  const items = (e?.items ?? []).map((p) => ({ id: p.item.id, text: progressText(p, cfg, custom), done: p.satisfied }));

  const sessions = data.sessions
    .filter((s) => dayAt(s.endUnix, cfg) === day)
    .sort((a, b) => a.endUnix - b.endUnix)
    .map((s) => {
      const parts = [at(s.endUnix), `${s.roundsCompleted}/${s.totalRounds} rounds`];
      if (s.hangSeconds !== undefined) parts.push(`hang ${formatSeconds(s.hangSeconds)}`);
      if (s.ropeTurns !== undefined) parts.push(`${s.ropeTurns} turns`);
      parts.push(`RPE ${s.rpe}`, `neck ${s.neck}`);
      const title = `${routineName(s.routineId, custom)} · ${formatSeconds(s.totalSeconds)}${s.completedFull ? '' : ' · ended early'}`;
      return { id: s.id, title, meta: parts.join(' · ') };
    });

  const rests = data.rests
    .filter((r) => dayAt(r.endUnix, cfg) === day)
    .sort((a, b) => a.endUnix - b.endUnix)
    .map((r) => ({
      id: r.id,
      title: `Rest · ${r.restKind} ${formatSeconds(r.durationSeconds)}${r.completedFull ? '' : ' · ended early'}`,
      meta: at(r.endUnix),
    }));

  const moods = data.moods
    .filter((m) => dayAt(m.unix, cfg) === day)
    .sort((a, b) => a.unix - b.unix)
    .map((m) => {
      const halt = HALT_WORDS.filter((k) => m.halt[k]);
      const parts = [at(m.unix)];
      if (halt.length) parts.push(`HALT: ${halt.join(', ')}`);
      if (m.notes) parts.push(`“${m.notes}”`);
      return { id: m.id, title: VALENCE_LABEL[m.valence], meta: parts.join(' · ') };
    });

  const drills = data.drills
    .filter((d) => dayAt(d.unix, cfg) === day)
    .sort((a, b) => a.unix - b.unix)
    .map((d) => ({
      id: d.id,
      title: 'Pause drill',
      meta: [at(d.unix), `${formatSeconds(d.pauseSecondsAchieved)} pause`, d.impulseResisted ? 'held' : 'reacted'].join(' · '),
    }));

  const j = e?.justification ?? data.justifications.find((x) => x.day === day);
  let status = STATUS_TEXT[kind];
  if (e && (kind === 'today' || kind === 'kept' || kind === 'missed')) status += ` · ${e.satisfiedCount} of ${e.totalCount} done`;
  return {
    day,
    kind,
    status,
    items,
    sessions,
    rests,
    moods,
    drills,
    ...(j ? { justification: { reason: REASON_LABEL[j.reason], text: j.text } } : {}),
  };
}
