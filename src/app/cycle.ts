/**
 * Pure helpers for cycle approval (J2) and the first plan in onboarding (J1).
 *
 * Drafts: before approval, a cycle's plans are ordinary saved DayPlans (the
 * domain counts them only once the cycle is approved). Days without a saved
 * plan are shown pre-filled (prefillCycle: template slot, else the engine's
 * suggestion) but are not written until the day is edited or the cycle is
 * approved — opening the screen never writes anything.
 */

import { cycleOf, type DayConfig } from '../time/daykeep';
import { suggestDay } from '../domain/engine';
import {
  approvalFor,
  approveCycle,
  cycleDays,
  findPlan,
  prefillCycle,
  saveDayPlan,
  slotOf,
  templateFromPlans,
  validatePlanItems,
} from '../domain/plan';
import type { RecordSummary } from '../domain/record';
import type { AppData, DayPlan, PlanItem, WorkoutRoutine } from '../domain/types';
import { classifyDay, itemText, type CellKind } from './view';

/**
 * The cycle to plan from `today`: the one holding tomorrow while it isn't
 * approved (first plan, or a late approval), otherwise the one after it.
 * With no approvals this is the onboarding range: tomorrow to the end of the
 * current cycle, or the whole next cycle when tomorrow starts one.
 */
export function targetCycle(cycles: AppData['cycles'], today: number): number {
  const c = cycleOf(today + 1);
  return approvalFor(cycles, c) ? c + 1 : c;
}

/** Days of the first plan made on `today` (onboarding step 3). */
export function firstPlanDays(today: number): number[] {
  return cycleDays(cycleOf(today + 1)).filter((d) => d > today);
}

/** Plans the editor shows for a cycle's unstarted days: saved ones, else the pre-fill. */
export function cycleDrafts(data: AppData, cycle: number, now: number, cfg: DayConfig): DayPlan[] {
  return prefillCycle(cycle, data.template, data.plans, (d) => suggestDay(d, data.sessions, cfg), now, cfg);
}

/** The plan a day editor starts from: the saved plan, else the cycle pre-fill for that day. */
export function draftForDay(data: AppData, day: number, now: number, cfg: DayConfig): PlanItem[] {
  const saved = findPlan(data.plans, day);
  if (saved) return saved.items;
  return cycleDrafts(data, cycleOf(day), now, cfg).find((p) => p.day === day)?.items ?? [];
}

/** Unstarted days whose plan can't be approved, oldest first. */
export function invalidDraftDays(drafts: DayPlan[]): number[] {
  return drafts.filter((p) => validatePlanItems(p.items).length > 0).map((p) => p.day);
}

export type ApproveDraftsResult =
  | { ok: true; data: AppData; onTime: boolean; days: number[] }
  | { ok: false; error: 'already_approved' | 'started' | 'invalid_plans'; days: number[] };

/**
 * Save the cycle's unsaved pre-filled days, approve the cycle and, if asked,
 * copy its plans into the template (only the slots of the days it covers).
 */
export function approveWithDrafts(
  data: AppData,
  cycle: number,
  now: number,
  cfg: DayConfig,
  saveTemplate: boolean,
): ApproveDraftsResult {
  let plans = data.plans;
  for (const draft of cycleDrafts(data, cycle, now, cfg)) {
    if (findPlan(plans, draft.day)) continue;
    const r = saveDayPlan(plans, draft.day, draft.items, now, cfg);
    if (!r.ok) return { ok: false, error: r.error === 'locked' ? 'started' : 'invalid_plans', days: [draft.day] };
    plans = r.plans;
  }
  const a = approveCycle(data.cycles, cycle, plans, now, cfg);
  if (!a.ok) return { ok: false, error: a.error, days: 'days' in a ? a.days : [] };
  let template = data.template;
  if (saveTemplate) {
    const fromCycle = templateFromPlans(cycle, plans);
    const slots = new Set(a.days.map(slotOf));
    template = data.template.map((slot, i) => (slots.has(i) ? fromCycle[i] : slot));
  }
  return { ok: true, data: { ...data, plans, cycles: a.cycles, template }, onTime: a.onTime, days: a.days };
}

/* --- display ------------------------------------------------------------- */

export interface CycleRowSummary {
  /** Workouts and rests, "Tabata · 2 rounds + Rest · silence 900 s". */
  title: string;
  mood: number;
  drill: number;
}

/** One line per day in the cycle editor: main items, plus mood and drill counts. */
export function cycleRowSummary(items: PlanItem[], cfg: DayConfig, custom: WorkoutRoutine[] = []): CycleRowSummary {
  const main = items.filter((i) => i.kind === 'workout' || i.kind === 'rest').map((i) => itemText(i, cfg, custom));
  const mood = items.reduce((n, i) => (i.kind === 'mood' ? n + i.count : n), 0);
  const drill = items.reduce((n, i) => (i.kind === 'drill' ? n + i.count : n), 0);
  const title = main.length ? main.join(' + ') : items.length ? 'Checks only' : 'Nothing planned';
  return { title, mood, drill };
}

export interface LookBack {
  cycle: number;
  cells: { day: number; kind: CellKind }[];
  done: number;
  /** Closed record days (done, kept or missed). */
  closed: number;
  /** Every day of the cycle is closed. */
  complete: boolean;
  /** The first written justification in the cycle. */
  note?: { day: number; text: string };
}

/** The previous cycle's result for the look-back row (P5); null if it has no record days. */
export function lookBack(cycle: number, record: RecordSummary): LookBack | null {
  const prev = cycle - 1;
  const cells = cycleDays(prev).map((day) => ({ day, kind: classifyDay(day, record) }));
  const closedKinds: CellKind[] = ['done', 'kept', 'missed'];
  const closed = cells.filter((c) => closedKinds.includes(c.kind)).length;
  const inRecord = cells.some((c) => c.kind !== 'outside' && c.kind !== 'future');
  if (!inRecord) return null;
  const done = cells.filter((c) => c.kind === 'done').length;
  const start = record.recordStartDay ?? 0;
  let note: LookBack['note'];
  for (const day of cycleDays(prev)) {
    const j = record.days[day - start]?.justification;
    if (j && day >= start) {
      note = { day, text: j.text };
      break;
    }
  }
  return { cycle: prev, cells, done, closed, complete: closed === 10, ...(note ? { note } : {}) };
}
