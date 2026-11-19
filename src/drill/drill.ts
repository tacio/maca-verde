/**
 * Pause drill (J6): the legacy think-before-speak methodology in four steps —
 * Elevate (raise the pulse) → Freeze (don't react) → Sigh (paced
 * physiological sigh) → Scenario (choose the paused reply). Elevate is
 * skipped when the drill follows a workout: the pulse is already up.
 * Pure; unit-tested in drill.test.ts.
 */

import { EMOTIONAL_SCENARIOS } from '../data/emotionalScenarios';
import type { DrillLog } from '../domain/types';
import type { ProvocationScenario } from '../types/mood';

export const DRILL_STEPS = ['elevate', 'freeze', 'sigh', 'scenario'] as const;
export type DrillStep = (typeof DRILL_STEPS)[number];

export const isDrillStep = (s: string | undefined): s is DrillStep => (DRILL_STEPS as readonly string[]).includes(s ?? '');

/** Timed steps, in seconds. */
export const ELEVATE_SECONDS = 30;
export const FREEZE_SECONDS = 20;

/** The steps of a drill, starting at `from` (after a workout: from freeze). */
export function drillSteps(from: DrillStep = 'elevate'): DrillStep[] {
  return DRILL_STEPS.slice(DRILL_STEPS.indexOf(from));
}

export function nextStep(steps: readonly DrillStep[], step: DrillStep): DrillStep | null {
  const i = steps.indexOf(step);
  return i >= 0 && i + 1 < steps.length ? steps[i + 1] : null;
}

export interface StepCopy {
  title: string;
  /** One instruction line (P10). */
  line: string;
  /** The science, behind "Why?". */
  why: string;
  /** Spoken when the step starts. */
  say: string;
}

export const STEP_COPY: Record<DrillStep, StepCopy> = {
  elevate: {
    title: 'Raise your pulse',
    line: 'Jump rope or burpees, hard, for 30 seconds.',
    why: 'A racing heart is what anger, hunger and exhaustion feel like. Raising it on purpose lets you rehearse staying calm inside that surge, the way it happens for real.',
    say: 'Raise your heart rate. Jump rope or burpees, thirty seconds.',
  },
  freeze: {
    title: 'Freeze',
    line: "Don't speak, don't react. Let your jaw and shoulders drop.",
    why: 'Holding back a reaction while your heart pounds trains the brake in your prefrontal cortex: you notice the surge without acting on it.',
    say: "Freeze. Don't react. Let your jaw and shoulders drop.",
  },
  sigh: {
    title: 'Sigh',
    line: 'Two inhales through the nose, one long exhale.',
    why: 'The physiological sigh is the fastest known way to slow the heart: the second inhale reopens the lungs, the long exhale engages the vagal brake.',
    say: 'Sigh. Two inhales through the nose, one long exhale.',
  },
  scenario: {
    title: 'Pause, then answer',
    line: 'Which reply would you give?',
    why: 'Choosing the paused reply while your pulse is still up makes it the one that comes out when it counts.',
    say: 'Read the situation. Pause, then choose your reply.',
  },
};

/* --- the sigh ----------------------------------------------------------------- */

export type SighPhase = 'ready' | 'inhale' | 'topup' | 'exhale' | 'done';

/** Lead-in so the step's spoken intro ends before the first breath. */
export const SIGH_READY_MS = 4000;
export const SIGH_CYCLES = 3;
export const SIGH_PHASE_MS: Record<'inhale' | 'topup' | 'exhale', number> = { inhale: 2000, topup: 1000, exhale: 6000 };
const CYCLE_MS = SIGH_PHASE_MS.inhale + SIGH_PHASE_MS.topup + SIGH_PHASE_MS.exhale;
export const SIGH_TOTAL_MS = SIGH_READY_MS + SIGH_CYCLES * CYCLE_MS;

export const SIGH_WORD: Record<'inhale' | 'topup' | 'exhale', string> = { inhale: 'In', topup: 'Once more', exhale: 'Out, slowly' };

export interface SighState {
  phase: SighPhase;
  /** 1-based; 0 during the lead-in. */
  cycle: number;
}

/** Where the breathing guide is `ms` after the sigh step started. */
export function sighAt(ms: number): SighState {
  if (ms < SIGH_READY_MS) return { phase: 'ready', cycle: 0 };
  const t = ms - SIGH_READY_MS;
  const cycle = Math.floor(t / CYCLE_MS);
  if (cycle >= SIGH_CYCLES) return { phase: 'done', cycle: SIGH_CYCLES };
  const inCycle = t - cycle * CYCLE_MS;
  const phase = inCycle < SIGH_PHASE_MS.inhale ? 'inhale' : inCycle < SIGH_PHASE_MS.inhale + SIGH_PHASE_MS.topup ? 'topup' : 'exhale';
  return { phase, cycle: cycle + 1 };
}

/* --- the scenario -------------------------------------------------------------- */

/** A random scenario, avoiding the one used last time when there's a choice. */
export function pickScenario(lastId: string | undefined, rand: () => number = Math.random, all: ProvocationScenario[] = EMOTIONAL_SCENARIOS): ProvocationScenario {
  const pool = all.length > 1 ? all.filter((s) => s.id !== lastId) : all;
  return pool[Math.min(pool.length - 1, Math.floor(rand() * pool.length))];
}

export interface ReplyOption {
  text: string;
  paused: boolean;
}

/** The impulsive and the paused reply, in random order (so the answer isn't always in the same place). */
export function replyOptions(s: ProvocationScenario, rand: () => number = Math.random): ReplyOption[] {
  const both: ReplyOption[] = [
    { text: s.impulsiveReaction, paused: false },
    { text: s.prefrontalResponse, paused: true },
  ];
  return rand() < 0.5 ? both : [both[1], both[0]];
}

/* --- the log ---------------------------------------------------------------------- */

export interface DrillOutcome {
  afterWorkout: boolean;
  /** Seconds actually held in Freeze. */
  freezeSeconds: number;
  scenarioId?: string;
  /** Chose the paused reply. */
  pausedReply: boolean;
}

export function buildDrillLog(o: DrillOutcome, id: string, unix: number): DrillLog {
  const log: DrillLog = {
    id,
    unix,
    drillType: 'high_hr_pause',
    heartRateState: o.afterWorkout ? 'elevated_post_hiit' : 'resting',
    pauseSecondsAchieved: Math.max(0, Math.round(o.freezeSeconds)),
    impulseResisted: o.pausedReply,
  };
  if (o.scenarioId) log.scenarioId = o.scenarioId;
  return log;
}
