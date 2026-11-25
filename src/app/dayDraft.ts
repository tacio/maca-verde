/**
 * The day editor's working copy (J3): text fields as typed, converted to plan
 * items on save. Pure; unit-tested in dayDraft.test.ts.
 */

import type { DayConfig } from '../time/daykeep';
import { formatSeconds, parseSeconds } from '../time/seconds';
import { routineSeconds } from '../workout/phases';
import { itemId, validatePlanItems } from '../domain/plan';
import {
  findRoutine,
  lastActual,
  suggestedHangSeconds,
  suggestedRopeTurns,
  suggestTargets,
} from '../domain/engine';
import type {
  PlanItem,
  RestSession,
  TargetMetric,
  WorkoutRoutine,
  WorkoutSession,
  WorkoutTargets,
} from '../domain/types';

export const REST_KINDS = ['meditation', 'silence', 'breathing', 'stretch'] as const;
export const DEFAULT_REST_SECONDS = 900;

/** Display order of targets in the editor. */
export const METRIC_ORDER: readonly TargetMetric[] = ['rounds', 'hangSeconds', 'ropeTurns', 'totalSeconds'];

export const METRIC_LABEL: Record<TargetMetric, string> = {
  rounds: 'Rounds',
  hangSeconds: 'Dead hang',
  ropeTurns: 'Rope turns',
  totalSeconds: 'Total time',
};

export interface DraftTarget {
  metric: TargetMetric;
  text: string;
  /** Exact value the text was made from: kept while the text is unchanged (decimal days round). */
  value?: number;
}

export type DraftMain =
  | { key: string; kind: 'workout'; routineId: string; targets: DraftTarget[] }
  | { key: string; kind: 'rest'; restKind: string; text: string; seconds?: number };

export interface DayDraft {
  /** The day's lesson (an exercise id), at most one (P14). */
  learn?: string;
  main: DraftMain[];
  mood: number;
  drill: number;
}

export type DraftProblem = 'empty' | 'bad_target' | 'bad_duration' | 'invalid';

/* --- durations ------------------------------------------------------------ */

/** A session length as typed, in whole seconds ("900", "900 s"); above zero and under one day. */
export function parseDurationInput(text: string, cfg: DayConfig): number | null {
  return parseSeconds(text, cfg.dayLength);
}

/** "≈ 15 min" under a decimal duration field. */
export function minutesHint(seconds: number): string {
  const m = seconds / 60;
  return m < 1 ? `≈ ${Math.round(seconds)} s` : `≈ ${Math.round(m)} min`;
}

/* --- metrics --------------------------------------------------------------- */

/** Metrics that make sense for a routine: rounds and time always; hang and rope turns if it has them. */
export function metricsFor(routineId: string, custom: WorkoutRoutine[] = []): TargetMetric[] {
  const ids = findRoutine(routineId, custom)?.exercises.map((e) => e.exerciseId) ?? [];
  return METRIC_ORDER.filter((m) => {
    if (m === 'hangSeconds') return ids.includes('door-bar-dead-hang');
    if (m === 'ropeTurns') return ids.some((id) => id.startsWith('rope-'));
    return true;
  });
}

/** The engine's suggestion for one metric of a routine (P3). */
export function suggestedValue(
  metric: TargetMetric,
  routineId: string,
  history: WorkoutSession[],
  custom: WorkoutRoutine[] = [],
): number | null {
  switch (metric) {
    case 'hangSeconds':
      return suggestedHangSeconds(history);
    case 'ropeTurns':
      return suggestedRopeTurns(history);
    case 'rounds':
      return findRoutine(routineId, custom)?.rounds ?? null;
    case 'totalSeconds': {
      const r = findRoutine(routineId, custom);
      // The base routine as the HUD runs it: the scaled session is never shorter, so the target is reachable.
      return r ? routineSeconds(r) : null;
    }
  }
}

/** Last actual of a metric: hang and rope turns across routines, rounds and time per routine. */
export function lastValue(metric: TargetMetric, routineId: string, history: WorkoutSession[]): number | null {
  const perRoutine = metric === 'rounds' || metric === 'totalSeconds';
  return lastActual(metric, perRoutine ? routineId : undefined, history);
}

/** Last full rest of a kind, in seconds, or null. */
export function lastRest(restKind: string, rests: RestSession[]): number | null {
  let best: RestSession | undefined;
  for (const r of rests) if (r.restKind === restKind && (!best || r.endUnix > best.endUnix)) best = r;
  return best ? best.durationSeconds : null;
}

export function formatMetric(metric: TargetMetric, value: number, cfg: DayConfig): string {
  if (metric === 'totalSeconds' || metric === 'hangSeconds') return formatSeconds(value);
  return String(value);
}

/** "last 38 s · suggested 40 s" (P3); "no data yet" when nothing was logged. */
export function hintText(last: string | null, suggested: string | null): string {
  const l = last === null ? 'no data yet' : `last ${last}`;
  return suggested === null ? l : `${l} · suggested ${suggested}`;
}

/** Text a target field starts with. */
export function metricText(metric: TargetMetric, value: number, cfg: DayConfig): string {
  return String(value);
}

/* --- draft ⇄ items ---------------------------------------------------------- */

let keySeq = 0;
export const newKey = () => `k${++keySeq}`;

export function targetsToDraft(t: WorkoutTargets, cfg: DayConfig): DraftTarget[] {
  return METRIC_ORDER.filter((m) => t[m] !== undefined).map((m) => ({ metric: m, text: metricText(m, t[m]!, cfg), value: t[m] }));
}

export function draftFromItems(items: PlanItem[], cfg: DayConfig): DayDraft {
  const draft: DayDraft = { main: [], mood: 0, drill: 0 };
  for (const item of items) {
    switch (item.kind) {
      case 'workout':
        draft.main.push({ key: newKey(), kind: 'workout', routineId: item.routineId, targets: targetsToDraft(item.targets, cfg) });
        break;
      case 'rest':
        draft.main.push({
          key: newKey(),
          kind: 'rest',
          restKind: item.restKind,
          text: String(item.durationSeconds),
          seconds: item.durationSeconds,
        });
        break;
      case 'mood':
        draft.mood += item.count;
        break;
      case 'drill':
        draft.drill += item.count;
        break;
      case 'learn':
        draft.learn = item.skillId;
        break;
    }
  }
  return draft;
}

/** A new workout item with the engine's targets for the routine. */
export function newWorkout(routineId: string, history: WorkoutSession[], cfg: DayConfig, custom: WorkoutRoutine[] = []): DraftMain {
  return { key: newKey(), kind: 'workout', routineId, targets: targetsToDraft(suggestTargets(routineId, history, custom), cfg) };
}

export function newRest(cfg: DayConfig, restKind: string = REST_KINDS[0], seconds = DEFAULT_REST_SECONDS): DraftMain {
  return { key: newKey(), kind: 'rest', restKind, text: String(seconds), seconds };
}

/** Parse a target field: whole numbers ≥ 1, or a duration for total time. */
export function parseTarget(metric: TargetMetric, text: string, cfg: DayConfig): number | null {
  if (metric === 'totalSeconds') return parseDurationInput(text, cfg);
  const s = text.trim();
  if (!/^\d+$/.test(s)) return null;
  const n = Number(s);
  return n >= 1 && Number.isSafeInteger(n) ? n : null;
}

/** Items for `day` (ids `${day}-${i}`), or the problems that keep it from saving. */
export function draftToItems(
  draft: DayDraft,
  day: number,
  cfg: DayConfig,
): { ok: true; items: PlanItem[] } | { ok: false; problems: DraftProblem[] } {
  const problems = new Set<DraftProblem>();
  const items: PlanItem[] = [];
  const id = () => itemId(day, items.length);
  if (draft.learn) items.push({ id: id(), kind: 'learn', skillId: draft.learn });
  for (const m of draft.main) {
    if (m.kind === 'workout') {
      const targets: WorkoutTargets = {};
      for (const t of m.targets) {
        const v =
          t.value !== undefined && t.text === metricText(t.metric, t.value, cfg) ? t.value : parseTarget(t.metric, t.text, cfg);
        if (v === null) problems.add(t.metric === 'totalSeconds' ? 'bad_duration' : 'bad_target');
        else targets[t.metric] = v;
      }
      items.push({ id: id(), kind: 'workout', routineId: m.routineId, targets });
    } else {
      const v =
        m.seconds !== undefined && m.text === String(m.seconds) ? m.seconds : parseDurationInput(m.text, cfg);
      if (v === null) problems.add('bad_duration');
      items.push({ id: id(), kind: 'rest', restKind: m.restKind, durationSeconds: v ?? 0 });
    }
  }
  if (draft.mood > 0) items.push({ id: id(), kind: 'mood', count: draft.mood });
  if (draft.drill > 0) items.push({ id: id(), kind: 'drill', count: draft.drill });
  if (items.length === 0) problems.add('empty');
  if (problems.size === 0 && validatePlanItems(items).length > 0) problems.add('invalid');
  return problems.size ? { ok: false, problems: [...problems] } : { ok: true, items };
}

export const PROBLEM_TEXT: Record<DraftProblem, string> = {
  empty: 'Plan at least one thing — rest counts',
  bad_target: 'Targets are whole numbers above 0',
  bad_duration: 'Durations are whole seconds, e.g. 900',
  invalid: "This plan can't be saved",
};
