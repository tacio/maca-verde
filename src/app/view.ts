/**
 * Pure view helpers: the short text and classifications screens show for
 * domain data. No React here (unit-tested in view.test.ts).
 */

import { cycleOf, type DayConfig } from '../time/daykeep';
import { formatSeconds } from '../time/seconds';
import { findRoutine, POSTURE_ROUTINE_ID, ROPE_ROUTINE_ID, TABATA_ROUTINE_ID } from '../domain/engine';
import type { ItemProgress, RecordSummary } from '../domain/record';
import type { PlanItem, WorkoutRoutine, WorkoutTargets } from '../domain/types';
import type { GlyphStatus } from '../ui/StatusGlyph';

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

/** The next item to do: the first undone workout, else the first undone item. */
export function nextItem(items: ItemProgress[]): ItemProgress | undefined {
  return items.find((p) => !p.satisfied && p.item.kind === 'workout') ?? items.find((p) => !p.satisfied);
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
  }
}

/** A day plan in one line for lists: main items first, counts after. */
export function daySummary(items: PlanItem[], cfg: DayConfig, custom: WorkoutRoutine[] = []): { title: string; meta: string } {
  const main = items.filter((i) => i.kind === 'workout' || i.kind === 'rest').map((i) => itemText(i, cfg, custom));
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
}

/** 10 rows × 10 days: the cycle holding today is the last row (02-workflows J8). */
export function lastHundredGrid(record: RecordSummary): GridRow[] {
  const last = cycleOf(record.today);
  return Array.from({ length: 10 }, (_, r) => {
    const cycle = last - 9 + r;
    return {
      cycle,
      cells: Array.from({ length: 10 }, (_, i) => {
        const day = cycle * 10 + i;
        return { day, kind: classifyDay(day, record) };
      }),
    };
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
