/**
 * Post-workout log (J4, P11): what the timer measured, the few inputs the
 * log asks for, and the WorkoutSession it saves. Pure; unit-tested.
 *
 * Inputs: RPE and neck tension always (sensible defaults, so Save alone is
 * enough), rope turns / hang seconds only when the plan item targets them,
 * pre-filled from the timer.
 */

import type { DayConfig } from '../time/daykeep';
import { formatSeconds } from '../time/seconds';
import type { WorkoutItem, WorkoutRoutine, WorkoutSession } from '../domain/types';
import { buildPhases, end, estimateRopeTurns, startRun, summarize, tick, type RunSummary } from './phases';

/** A finished or ended run, handed from the HUD to the log screen. */
export interface WorkoutResult extends RunSummary {
  itemId: string;
  routineId: string;
  startUnix: number;
  endUnix: number;
  estimatedCalories: number;
}

export function workoutResult(
  item: WorkoutItem,
  routine: WorkoutRoutine,
  summary: RunSummary,
  startUnix: number,
  endUnix: number,
): WorkoutResult {
  return {
    ...summary,
    itemId: item.id,
    routineId: item.routineId,
    startUnix,
    endUnix: Math.max(startUnix, endUnix),
    estimatedCalories: Math.round(routine.estimatedCalories * summary.workFraction),
  };
}

export type LogField = 'ropeTurns' | 'hangSeconds';

/** Target-dependent inputs, in display order: only what the item targets. */
export function logFields(item: WorkoutItem): LogField[] {
  const out: LogField[] = [];
  if (item.targets.ropeTurns !== undefined) out.push('ropeTurns');
  if (item.targets.hangSeconds !== undefined) out.push('hangSeconds');
  return out;
}

export const LOG_FIELD_LABEL: Record<LogField, string> = { ropeTurns: 'Rope turns', hangSeconds: 'Dead hang (s)' };

export const DEFAULT_RPE = 7;
export const DEFAULT_NECK = 2;

export interface LogDraft {
  rpe: number;
  neck: number;
  /** As typed; only the item's fields are present. */
  fields: Partial<Record<LogField, string>>;
}

/** Defaults and timer estimates. */
export function initialDraft(result: WorkoutResult, item: WorkoutItem): LogDraft {
  const fields: LogDraft['fields'] = {};
  for (const f of logFields(item))
    fields[f] = String(f === 'ropeTurns' ? estimateRopeTurns(result.ropeSeconds) : result.longestHangSeconds);
  return { rpe: DEFAULT_RPE, neck: DEFAULT_NECK, fields };
}

/** A whole number ≥ 0 as typed, or null. */
export function parseCount(text: string | undefined): number | null {
  const t = (text ?? '').trim();
  if (!/^\d{1,5}$/.test(t)) return null;
  return Number(t);
}

export function draftValid(d: LogDraft): boolean {
  return Object.values(d.fields).every((v) => parseCount(v) !== null);
}

const clampInt = (n: number, lo: number, hi: number) => Math.min(hi, Math.max(lo, Math.round(n)));

/** The session to store, or null while a field is invalid. */
export function buildSession(result: WorkoutResult, draft: LogDraft, id: string): WorkoutSession | null {
  if (!draftValid(draft)) return null;
  const s: WorkoutSession = {
    id,
    routineId: result.routineId,
    startUnix: result.startUnix,
    endUnix: result.endUnix,
    completedFull: result.completedFull,
    totalSeconds: result.activeSeconds,
    roundsCompleted: result.roundsCompleted,
    totalRounds: result.totalRounds,
    rpe: clampInt(draft.rpe, 1, 10),
    neck: clampInt(draft.neck, 0, 10),
    estimatedCalories: result.estimatedCalories,
  };
  const rope = parseCount(draft.fields.ropeTurns);
  const hang = parseCount(draft.fields.hangSeconds);
  if (rope !== null) s.ropeTurns = rope;
  if (hang !== null) s.hangSeconds = hang;
  return s;
}

/** "Tabata done · 712 s · 2/2 rounds" or "Tabata ended early · 270 s · 0/2 rounds". */
export function logHeader(name: string, r: WorkoutResult, cfg: DayConfig): string {
  const what = r.completedFull ? 'done' : 'ended early';
  return `${name} ${what} · ${formatSeconds(r.activeSeconds)} · ${r.roundsCompleted}/${r.totalRounds} rounds`;
}

/** The calm line under the header when the session can't complete the item, or null. */
export function shortNote(r: WorkoutResult): string | null {
  if (r.completedFull) return null;
  return r.shortBy === 'skipped'
    ? 'An exercise was skipped — the item stays open; a full session completes it.'
    : 'Ended early — the item stays open; a full session completes it.';
}

/** "last 320 · target 350" for a log field (P3); "no data yet · target 350". */
export function fieldHint(last: number | null, target: number | undefined, unit = ''): string {
  const l = last === null ? 'no data yet' : `last ${last}${unit}`;
  return target === undefined ? l : `${l} · target ${target}${unit}`;
}

/**
 * Dev scenarios: a result as if the HUD had run the routine in full, or been
 * ended about 40% in. Not used by production code paths.
 */
export function simulatedResult(item: WorkoutItem, routine: WorkoutRoutine, kind: 'full' | 'early', endUnix: number): WorkoutResult {
  const phases = buildPhases(routine);
  const t0 = 0;
  let run = startRun(phases, t0);
  const total = phases.reduce((n, p) => n + p.seconds, 0) * 1000;
  if (kind === 'full') run = tick(phases, run, t0 + total).run;
  else run = end(tick(phases, run, t0 + Math.round(total * 0.4)).run, t0 + Math.round(total * 0.4));
  const summary = summarize(phases, run, routine.rounds);
  return workoutResult(item, routine, summary, endUnix - summary.activeSeconds, endUnix);
}
