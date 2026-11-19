/**
 * The workout HUD's phase machine (J4, P12), pure and unit-tested.
 *
 * A routine becomes a flat list of phases: prep → (work, rest)… per round,
 * with a round rest between rounds and no rest after the last exercise of a
 * round (legacy WorkoutPlayerHUD order). Finishing the last work phase ends
 * the workout.
 *
 * Timing is drift-free: a Run stores when the current phase was (re)started
 * and how much of it had elapsed before, so the remaining time is always
 * derived from a timestamp, never from counted ticks. A late tick (throttled
 * or backgrounded tab) carries the overflow into the next phases, so the
 * workout stays on the clock.
 */

import type { WorkoutRoutine } from '../domain/types';
import { exerciseName, isDeadHang, isRope } from './exerciseCues';

export type PhaseKind = 'prep' | 'work' | 'rest' | 'roundRest';

export interface Phase {
  kind: PhaseKind;
  seconds: number;
  /** 1-based round of the exercise this phase is or leads into. */
  round: number;
  /** 0-based position of that exercise within the round. */
  index: number;
  /** Work: the exercise itself. Prep and rests: the exercise that comes next. */
  exerciseId: string;
}

/** Rope turns per second of rope work (legacy estimate: 2.2/s ≈ 130 rpm). */
export const TURNS_PER_SECOND = 2.2;
/** A prep phase is never shorter than this, so the first announcement fits. */
export const MIN_PREP_SECONDS = 5;

export function buildPhases(r: WorkoutRoutine): Phase[] {
  const out: Phase[] = [];
  const ex = r.exercises;
  if (ex.length === 0) return out;
  out.push({ kind: 'prep', seconds: Math.max(MIN_PREP_SECONDS, r.prepSeconds || 10), round: 1, index: 0, exerciseId: ex[0].exerciseId });
  for (let round = 1; round <= r.rounds; round++) {
    ex.forEach((item, i) => {
      out.push({ kind: 'work', seconds: item.workSeconds, round, index: i, exerciseId: item.exerciseId });
      if (i + 1 < ex.length) {
        if (item.restSeconds > 0)
          out.push({ kind: 'rest', seconds: item.restSeconds, round, index: i + 1, exerciseId: ex[i + 1].exerciseId });
      } else if (round < r.rounds && r.roundRestSeconds > 0) {
        out.push({ kind: 'roundRest', seconds: r.roundRestSeconds, round: round + 1, index: 0, exerciseId: ex[0].exerciseId });
      }
    });
  }
  return out;
}

export const isRestKind = (k: PhaseKind) => k === 'rest' || k === 'roundRest';

/** Total planned seconds. */
export const plannedSeconds = (phases: Phase[]) => phases.reduce((n, p) => n + p.seconds, 0);

/** Planned length of a routine in seconds, as the HUD runs it (prep, work, rests). */
export const routineSeconds = (r: WorkoutRoutine) => plannedSeconds(buildPhases(r));

/* --- the run --------------------------------------------------------------- */

export interface Run {
  /** Current phase; phases.length once finished. */
  index: number;
  /** Time spent in the current phase before `since`. */
  elapsedMs: number;
  /** Timestamp (ms) the current phase last (re)started running; null while paused or finished. */
  since: number | null;
  /** Time actually spent in each phase (ms); full length once completed. */
  spentMs: number[];
  /** Ended early by the user. */
  ended: boolean;
}

export function startRun(phases: Phase[], now: number, at = 0): Run {
  const spentMs = phases.map((p, i) => (i < at ? p.seconds * 1000 : 0));
  return { index: Math.min(at, phases.length), elapsedMs: 0, since: at < phases.length ? now : null, spentMs, ended: false };
}

export const isFinished = (phases: Phase[], run: Run) => run.index >= phases.length;
export const isPaused = (run: Run) => run.since === null;

/** Time spent in the current phase at `now`. */
export function phaseElapsedMs(run: Run, now: number): number {
  return run.elapsedMs + (run.since === null ? 0 : Math.max(0, now - run.since));
}

export function remainingMs(phases: Phase[], run: Run, now: number): number {
  const p = phases[run.index];
  return p ? Math.max(0, p.seconds * 1000 - phaseElapsedMs(run, now)) : 0;
}

/** Whole seconds shown on the HUD: 20 → … → 1, never 0 while a phase runs. */
export function displaySeconds(ms: number): number {
  return Math.ceil(ms / 1000 - 1e-9);
}

export interface Step {
  run: Run;
  /** Indexes of phases entered by this step, in order (phases.length = finished). */
  entered: number[];
}

/** Advance to `now`, completing every phase whose time is up (overflow carries over). */
export function tick(phases: Phase[], run: Run, now: number): Step {
  if (run.since === null || isFinished(phases, run)) return { run, entered: [] };
  let r = run;
  const entered: number[] = [];
  for (;;) {
    const p = phases[r.index];
    if (!p) break;
    const elapsed = phaseElapsedMs(r, now);
    const dur = p.seconds * 1000;
    if (elapsed < dur) break;
    const spentMs = r.spentMs.slice();
    spentMs[r.index] = dur;
    const index = r.index + 1;
    r = { ...r, index, spentMs, elapsedMs: elapsed - dur, since: index < phases.length ? now : null };
    entered.push(index);
  }
  if (isFinished(phases, r)) r = { ...r, elapsedMs: 0 };
  return { run: r, entered };
}

export function pause(run: Run, now: number): Run {
  if (run.since === null) return run;
  return { ...run, elapsedMs: phaseElapsedMs(run, now), since: null };
}

export function resume(phases: Phase[], run: Run, now: number): Run {
  if (run.since !== null || run.ended || isFinished(phases, run)) return run;
  return { ...run, since: now };
}

/** End early: the current phase keeps the time spent in it. */
export function end(run: Run, now: number): Run {
  const spentMs = run.spentMs.slice();
  if (run.index < spentMs.length) spentMs[run.index] = phaseElapsedMs(run, now);
  return { ...run, spentMs, elapsedMs: phaseElapsedMs(run, now), since: null, ended: true };
}

/** Share of the planned time behind us 0–1. */
export function progress(phases: Phase[], run: Run, now: number): number {
  const total = plannedSeconds(phases) * 1000;
  if (total === 0) return 1;
  let before = 0;
  for (let i = 0; i < Math.min(run.index, phases.length); i++) before += phases[i].seconds * 1000;
  const cur = phases[run.index] ? Math.min(phaseElapsedMs(run, now), phases[run.index].seconds * 1000) : 0;
  return Math.min(1, (before + cur) / total);
}

/* --- summary --------------------------------------------------------------- */

export interface RunSummary {
  /** Time spent in phases (pauses excluded), whole seconds. */
  activeSeconds: number;
  roundsCompleted: number;
  totalRounds: number;
  /** Every phase ran to its end (no skipping exists: P12). */
  completedFull: boolean;
  /** Why not full: ended early by the user (the only way a session is short). */
  shortBy: 'ended' | null;
  ropeSeconds: number;
  /** Longest single dead hang (s), from the timer. */
  longestHangSeconds: number;
  /** Work done / planned work, 0–1. */
  workFraction: number;
}

export function summarize(phases: Phase[], run: Run, totalRounds: number): RunSummary {
  const full = (i: number) => run.spentMs[i] >= phases[i].seconds * 1000;
  let spent = 0;
  let rope = 0;
  let hang = 0;
  let work = 0;
  let plannedWork = 0;
  const roundOk = new Map<number, boolean>();
  phases.forEach((p, i) => {
    const ms = run.spentMs[i] ?? 0;
    spent += ms;
    if (p.kind !== 'work') return;
    plannedWork += p.seconds * 1000;
    work += ms;
    if (isRope(p.exerciseId)) rope += ms;
    if (isDeadHang(p.exerciseId)) hang = Math.max(hang, ms);
    roundOk.set(p.round, (roundOk.get(p.round) ?? true) && full(i));
  });
  const finished = isFinished(phases, run) && !run.ended;
  const completedFull = finished && phases.length > 0;
  return {
    activeSeconds: Math.round(spent / 1000),
    roundsCompleted: [...roundOk.values()].filter(Boolean).length,
    totalRounds,
    completedFull,
    shortBy: completedFull ? null : 'ended',
    ropeSeconds: Math.round(rope / 1000),
    longestHangSeconds: Math.round(hang / 1000),
    workFraction: plannedWork === 0 ? 0 : Math.min(1, work / plannedWork),
  };
}

export const estimateRopeTurns = (ropeSeconds: number) => Math.round(ropeSeconds * TURNS_PER_SECOND);

/** "next: Hanging knees", "next: Round 2 · Boxer skip", "next: finish". */
export function nextLine(phases: Phase[], index: number): string {
  const p = phases[index];
  if (!p) return '';
  if (p.kind !== 'work') {
    const prefix = p.kind === 'roundRest' ? `Round ${p.round} · ` : '';
    return `next: ${prefix}${exerciseName(p.exerciseId)}`;
  }
  const n = phases.slice(index + 1).find((q) => q.kind === 'work');
  return n ? `next: ${exerciseName(n.exerciseId)}` : 'next: finish';
}
