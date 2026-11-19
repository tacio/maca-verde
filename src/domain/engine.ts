/**
 * The overload engine, ported to pure functions over the new session logs.
 * Methodology preserved from src/services/overloadEngine.ts and
 * App.handleSaveWorkoutLog (legacy):
 *
 * - multiplier: 1.0, +0.01 per logged session (+0.02 when RPE ≥ 8), cap 1.4,
 *   rounded to 2 decimals at each step (legacy `toFixed(2)`).
 * - level: min(10, floor(sessions / 5) + 1).
 * - personal records: max hang, max rope turns, max rounds, lowest neck score.
 * - scaleRoutine: legacy scaleRoutineForUser formula.
 * - daily challenge rotation posture / Tabata / rope, now the suggestion used
 *   to pre-fill a cycle.
 *
 * Deviations (documented):
 * - Rotation is by day number (`day % 3`) instead of `(streak + 1) % 3`,
 *   keeping the same mapping: 1 → posture, 2 → Tabata, 0 → rope.
 * - The rope target's `dayNumber` (legacy: streak + 1) becomes the number of
 *   full rope sessions ('daily-adaptive-overload') before the day + 1:
 *   max(150, n × 25 + 100).
 * - The Tabata challenge had no numeric target (it asked for RPE 8+); it now
 *   targets the routine's own rounds.
 * - Every logged session counts toward multiplier, level and records, as in
 *   the legacy app (which logged early-ended workouts too). Records start from
 *   nothing (legacy profile defaults are not carried over): no sessions →
 *   hang target clamp(0 + 2, 25, 90) = 25 s.
 */

import { WORKOUT_ROUTINES } from '../data/routines';
import { fromUnix, dayStart, type DayConfig } from '../time/daykeep';
import type { PlanItem, TargetMetric, WorkoutItem, WorkoutRoutine, WorkoutSession, WorkoutTargets } from './types';

export const POSTURE_ROUTINE_ID = 'posture-text-neck-antidote';
export const TABATA_ROUTINE_ID = 'tabata-belly-shred';
export const ROPE_ROUTINE_ID = 'daily-adaptive-overload';

export const DEFAULT_MOOD_COUNT = 2;
export const DEFAULT_DRILL_COUNT = 1;

const byEnd = (a: WorkoutSession, b: WorkoutSession) => a.endUnix - b.endUnix;

/* --- records, multiplier, level ------------------------------------------ */

export interface PersonalRecords {
  maxHangSeconds: number;
  maxRopeTurns: number;
  maxRounds: number;
  /** null until a session is logged */
  lowestNeck: number | null;
}

export function personalRecords(sessions: WorkoutSession[]): PersonalRecords {
  const r: PersonalRecords = { maxHangSeconds: 0, maxRopeTurns: 0, maxRounds: 0, lowestNeck: null };
  for (const s of sessions) {
    r.maxHangSeconds = Math.max(r.maxHangSeconds, s.hangSeconds ?? 0);
    r.maxRopeTurns = Math.max(r.maxRopeTurns, s.ropeTurns ?? 0);
    r.maxRounds = Math.max(r.maxRounds, s.roundsCompleted);
    r.lowestNeck = r.lowestNeck === null ? s.neck : Math.min(r.lowestNeck, s.neck);
  }
  return r;
}

/** Legacy step: min(1.4, m + (rpe ≥ 8 ? 0.02 : 0.01)), rounded to 2 decimals. */
export function nextMultiplier(m: number, rpe: number): number {
  return Number(Math.min(1.4, m + (rpe >= 8 ? 0.02 : 0.01)).toFixed(2));
}

export function overloadMultiplier(sessions: WorkoutSession[]): number {
  return [...sessions].sort(byEnd).reduce((m, s) => nextMultiplier(m, s.rpe), 1.0);
}

export function level(sessions: WorkoutSession[]): number {
  return Math.min(10, Math.floor(sessions.length / 5) + 1);
}

/** Legacy scaleRoutineForUser, with multiplier and level passed explicitly. */
export function scaleRoutine(base: WorkoutRoutine, multiplier: number, lvl: number): WorkoutRoutine {
  const levelBonusSeconds = Math.min(10, Math.floor((lvl - 1) * 1.5));
  const exercises = base.exercises.map((item) => ({
    ...item,
    workSeconds: Math.min(50, Math.round(item.workSeconds * multiplier + (levelBonusSeconds > 0 ? 2 : 0))),
    restSeconds: Math.max(10, item.restSeconds),
  }));
  const estimatedDurationMinutes = Math.ceil(
    (exercises.reduce((acc, e) => acc + e.workSeconds + e.restSeconds, 0) * base.rounds +
      base.roundRestSeconds * (base.rounds - 1) +
      base.prepSeconds) /
      60,
  );
  return {
    ...base,
    exercises,
    estimatedDurationMinutes,
    estimatedCalories: Math.round(base.estimatedCalories * multiplier),
  };
}

/* --- last actual (P3) ---------------------------------------------------- */

function actualOf(s: WorkoutSession, metric: TargetMetric): number | undefined {
  switch (metric) {
    case 'totalSeconds':
      return s.totalSeconds;
    case 'rounds':
      return s.roundsCompleted;
    case 'hangSeconds':
      return s.hangSeconds;
    case 'ropeTurns':
      return s.ropeTurns;
  }
}

/**
 * The most recent actual value of a metric (latest session by end moment
 * that recorded it), optionally limited to one routine. null = "no data yet".
 * Early-ended sessions count: they are what was actually done.
 */
export function lastActual(metric: TargetMetric, routineId: string | undefined, history: WorkoutSession[]): number | null {
  let best: WorkoutSession | undefined;
  for (const s of history) {
    if (routineId !== undefined && s.routineId !== routineId) continue;
    if (actualOf(s, metric) === undefined) continue;
    if (!best || s.endUnix > best.endUnix) best = s;
  }
  return best ? (actualOf(best, metric) as number) : null;
}

/* --- suggestions -------------------------------------------------------- */

export type Focus = 'posture' | 'tabata' | 'rope';

/** Legacy rotation by `% 3` (1 posture, 2 Tabata, 0 rope), now by day number. */
export function focusOfDay(day: number): Focus {
  const i = ((day % 3) + 3) % 3;
  return i === 1 ? 'posture' : i === 2 ? 'tabata' : 'rope';
}

export const FOCUS_ROUTINE: Record<Focus, string> = {
  posture: POSTURE_ROUTINE_ID,
  tabata: TABATA_ROUTINE_ID,
  rope: ROPE_ROUTINE_ID,
};

export function findRoutine(id: string, custom: WorkoutRoutine[] = []): WorkoutRoutine | undefined {
  return custom.find((r) => r.id === id) ?? WORKOUT_ROUTINES.find((r) => r.id === id);
}

/** Legacy posture target: personal record + 2 s, clamped to 25..90. */
export function suggestedHangSeconds(history: WorkoutSession[]): number {
  return Math.min(90, Math.max(25, personalRecords(history).maxHangSeconds + 2));
}

/** Legacy rope target with dayNumber = full rope sessions so far + 1. */
export function suggestedRopeTurns(history: WorkoutSession[]): number {
  const n = history.filter((s) => s.routineId === ROPE_ROUTINE_ID && s.completedFull).length + 1;
  return Math.max(150, n * 25 + 100);
}

/** Suggested targets for a workout item of any routine. */
export function suggestTargets(routineId: string, history: WorkoutSession[], custom: WorkoutRoutine[] = []): WorkoutTargets {
  switch (routineId) {
    case POSTURE_ROUTINE_ID:
      return { hangSeconds: suggestedHangSeconds(history) };
    case ROPE_ROUTINE_ID:
      return { ropeTurns: suggestedRopeTurns(history) };
    default: {
      const r = findRoutine(routineId, custom);
      return r ? { rounds: r.rounds } : {};
    }
  }
}

/**
 * The engine's plan for `day`: one workout following the rotation, 2 mood
 * checks and 1 pause drill. Only sessions that ended before the day starts
 * inform the targets. Item ids are `${day}-${index}`.
 */
export function suggestDay(day: number, history: WorkoutSession[], cfg: DayConfig): PlanItem[] {
  const before = history.filter((s) => fromUnix(s.endUnix, cfg) < dayStart(day, cfg));
  const routineId = FOCUS_ROUTINE[focusOfDay(day)];
  const workout: WorkoutItem = { id: `${day}-0`, kind: 'workout', routineId, targets: suggestTargets(routineId, before) };
  return [
    workout,
    { id: `${day}-1`, kind: 'mood', count: DEFAULT_MOOD_COUNT },
    { id: `${day}-2`, kind: 'drill', count: DEFAULT_DRILL_COUNT },
  ];
}
