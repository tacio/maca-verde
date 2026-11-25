/**
 * Pure view helpers: the short text and classifications screens show for
 * domain data. No React here (unit-tested in view.test.ts).
 */

import { cycleOf, shortDay, type DayConfig } from '../time/daykeep';
import { formatSeconds } from '../time/seconds';
import { findRoutine, POSTURE_ROUTINE_ID, ROPE_ROUTINE_ID, TABATA_ROUTINE_ID } from '../domain/engine';
import { RESERVE_CAP, type ItemProgress, type RecordSummary } from '../domain/record';
import type { PlanItem, WorkoutRoutine, WorkoutTargets } from '../domain/types';
import type { GlyphStatus } from '../ui/StatusGlyph';
import { exerciseName } from '../workout/exerciseCues';

/* --- plan items ---------------------------------------------------------- */

/** Built-in routines by a short, calm name (their titles are marketing-length). */
const SHORT_NAMES: Record<string, string> = {
  [POSTURE_ROUTINE_ID]: 'Posture',
  [TABATA_ROUTINE_ID]: 'Tabata',
  [ROPE_ROUTINE_ID]: 'Rope',
  'emom-rope-door-bar-hybrid': 'EMOM 15',
  'quick-5min-streak-saver': '5-minute circuit',
};

export function routineName(routineId: string, custom: WorkoutRoutine[] = []): string {
  return SHORT_NAMES[routineId] ?? findRoutine(routineId, custom)?.title ?? 'Workout';
}

const plural = (n: number, one: string, many = `${one}s`) => `${n} ${n === 1 ? one : many}`;

/** "2 rounds · hang 40s · 350 turns · .0083" — seconds for per-exercise targets, decimal days for totals. */
export function targetsText(t: WorkoutTargets, cfg: DayConfig): string {
  const parts: string[] = [];
  if (t.rounds !== undefined) parts.push(plural(t.rounds, 'round'));
  if (t.hangSeconds !== undefined) parts.push(`hang ${formatSeconds(t.hangSeconds)}`);
  if (t.ropeTurns !== undefined) parts.push(plural(t.ropeTurns, 'turn'));
  if (t.totalSeconds !== undefined) parts.push(formatSeconds(t.totalSeconds));
  return parts.join(' · ');
}

/** One-line description of a plan item: "Tabata · 2 rounds", "Rest · silence .0104", "Mood check", "Pause drill". */
export function itemText(item: PlanItem, cfg: DayConfig, custom: WorkoutRoutine[] = []): string {
  switch (item.kind) {
    case 'workout': {
      const t = targetsText(item.targets, cfg);
      return t ? `${routineName(item.routineId, custom)} · ${t}` : routineName(item.routineId, custom);
    }
    case 'rest':
      return `Rest · ${item.restKind} ${formatSeconds(item.durationSeconds)}`;
    case 'mood':
      return item.count === 1 ? 'Mood check' : `${item.count} mood checks`;
    case 'drill':
      return item.count === 1 ? 'Pause drill' : `${item.count} pause drills`;
    case 'learn':
      return `Learn · ${exerciseName(item.skillId)}`;
  }
}

/** Today's row title: counted items show progress ("Mood check 1/2"). */
export function progressText(p: ItemProgress, cfg: DayConfig, custom: WorkoutRoutine[] = []): string {
  const { item } = p;
  if (item.kind === 'mood' || item.kind === 'drill') {
    const name = item.kind === 'mood' ? 'Mood check' : 'Pause drill';
    return p.required > 1 ? `${name} ${Math.min(p.current, p.required)}/${p.required}` : name;
  }
  return itemText(item, cfg, custom);
}

/** The next item to do: a due lesson (P14), else the first undone workout, else the first undone item. */
export function nextItem(items: ItemProgress[]): ItemProgress | undefined {
  const undone = (kind: PlanItem['kind']) => items.find((p) => !p.satisfied && p.item.kind === kind);
  return undone('learn') ?? undone('workout') ?? items.find((p) => !p.satisfied);
}

/** Primary action label for an item: "Start Tabata", "Log a mood check"… */
export function actionText(item: PlanItem, custom: WorkoutRoutine[] = []): string {
  switch (item.kind) {
    case 'workout':
      return `Start ${routineName(item.routineId, custom)}`;
    case 'rest':
      return `Start ${item.restKind}`;
    case 'mood':
      return 'Check in';
    case 'drill':
      return 'Start pause drill';
    case 'learn':
      return `Learn ${exerciseName(item.skillId)}`;
  }
}

/** A day plan in one line for lists: main items first, counts after. */
export function daySummary(items: PlanItem[], cfg: DayConfig, custom: WorkoutRoutine[] = []): { title: string; meta: string } {
  const main = items.filter((i) => i.kind !== 'mood' && i.kind !== 'drill').map((i) => itemText(i, cfg, custom));
  const counts = items.filter((i) => i.kind === 'mood' || i.kind === 'drill').map((i) => itemText(i, cfg, custom).toLowerCase());
  if (main.length === 0) return { title: counts.join(' · ') || 'Nothing planned', meta: '' };
  return { title: main.join(' + '), meta: counts.join(' · ') };
}

/* --- day statuses -------------------------------------------------------- */

export type CellKind = 'done' | 'kept' | 'missed' | 'today' | 'future' | 'outside';

/** How the 100-day grid draws a day. A kept day is never drawn as done (P6). */
export function classifyDay(day: number, record: RecordSummary): CellKind {
  if (day > record.today) return 'future';
  const start = record.recordStartDay;
  if (start === null || day < start) return 'outside';
  const e = record.days[day - start];
  if (!e) return 'outside';
  switch (e.status) {
    case 'done':
      return 'done';
    case 'missed':
      return e.protected ? 'kept' : 'missed';
    case 'today':
      return 'today';
    default:
      return 'outside';
  }
}

export interface GridRow {
  cycle: number;
  cells: { day: number; kind: CellKind }[];
  /** 10 of 10 days actually done — none missed, none protected (brief → clean cycles). */
  clean: boolean;
}

/** A clean cycle: every one of its 10 days is in the record and done. A kept day is a miss, so it never counts. */
export function isCleanCycle(cycle: number, record: RecordSummary): boolean {
  for (let i = 0; i < 10; i++) if (classifyDay(cycle * 10 + i, record) !== 'done') return false;
  return true;
}

/** 10 rows × 10 days: the cycle holding today is the last row (02-workflows J8). */
export function lastHundredGrid(record: RecordSummary): GridRow[] {
  const last = cycleOf(record.today);
  return Array.from({ length: 10 }, (_, r) => {
    const cycle = last - 9 + r;
    const cells = Array.from({ length: 10 }, (_, i) => {
      const day = cycle * 10 + i;
      return { day, kind: classifyDay(day, record) };
    });
    return { cycle, cells, clean: cells.every((c) => c.kind === 'done') };
  });
}

/** Glyph for a day row in the Plan list. */
export function dayGlyph(day: number, record: RecordSummary): GlyphStatus {
  const kind = classifyDay(day, record);
  switch (kind) {
    case 'done':
      return 'done';
    case 'kept':
      return 'kept';
    case 'missed':
      return 'missed';
    case 'today':
      return 'current';
    default:
      return 'todo';
  }
}

/* --- celebrations (P13, 02-workflows §6) ----------------------------------- */

/**
 * The closed cycle whose clean-cycle moment is due, or null: the cycle just
 * before today's, if it was clean and its moment hasn't been shown yet
 * (`shown` = settings.cleanCycleShown, the last cycle already celebrated).
 * Older cycles never celebrate late.
 */
export function cleanCycleDue(record: RecordSummary, shown: number | undefined): number | null {
  const cycle = cycleOf(record.today) - 1;
  if (shown !== undefined && cycle <= shown) return null;
  return isCleanCycle(cycle, record) ? cycle : null;
}

/** Roughly 1 day in 10 gets the rare day-done variant; fixed per day number, so it's stable. */
export function isRareDay(day: number): boolean {
  return (Math.imul(day, 2654435761) >>> 0) % 10 === 3;
}

export type DayDoneKind = 'recovery' | 'rare' | 'plain';

/** Which day-done moment a day gets: recovery wins; else the rare variant on its days. */
export function dayDoneKind(day: number, isRecoveryDay: boolean): DayDoneKind {
  if (isRecoveryDay) return 'recovery';
  return isRareDay(day) ? 'rare' : 'plain';
}

export const DAY_DONE_TITLE: Record<DayDoneKind, string> = {
  recovery: 'Back on track',
  rare: 'Beautifully done',
  plain: 'Day done',
};

/* --- streak protection copy (brief → Reserves, "might as well spend it") ---- */

/**
 * At the cap an on-time approval earns nothing more: the copy says
 * "protection full" and never "+1", and nothing says protection was lost.
 * `held` is the protection held now (record.reservesHeld).
 */
export const protectionFull = (held: number) => held >= RESERVE_CAP;

/** Today's quiet "plan the next cycle" row. Today never mentions protection (brief). */
export function cycleRowMeta(_held: number): string {
  return 'Approve it before it starts';
}

/** Plan tab, an unapproved cycle that hasn't started. */
export function planApproveHint(firstDay: number, held: number): string {
  const before = `Approve it before day ${shortDay(firstDay, 3)} starts`;
  return protectionFull(held) ? `${before}. Streak protection is full.` : `${before} to earn streak protection.`;
}

/** The moment after approving a cycle. */
export function approvedMomentText(
  cycle: number,
  onTime: boolean,
  held: number,
  days: number[],
): { earned: boolean; title: string; body: string } {
  if (onTime && !protectionFull(held)) return { earned: true, title: '+1 protection', body: `Cycle ${cycle} approved on time.` };
  if (onTime) return { earned: false, title: 'Cycle approved', body: `On time · protection full` };
  return { earned: false, title: 'Cycle approved', body: `Days ${shortDay(days[0], 3)}–${shortDay(days[days.length - 1], 3)} are planned.` };
}
