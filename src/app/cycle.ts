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
import { findRoutine, suggestDay } from '../domain/engine';
import { curriculumComplete, isBasicsId, knownBefore, unknownExercises } from '../domain/curriculum';
import {
  approvalFor,
  approveCycle,
  canEditDay,
  cycleDays,
  emptyTemplate,
  findPlan,
  prefillCycle,
  saveDayPlan,
  slotOf,
  templateFromPlans,
  validatePlanItems,
} from '../domain/plan';
import type { RecordSummary } from '../domain/record';
import type { AppData, DayPlan, PlanItem, Template, WorkoutRoutine } from '../domain/types';
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

/** `plans` with `drafts` replacing the plans of the same days. */
export function withDrafts(plans: DayPlan[], drafts: DayPlan[]): DayPlan[] {
  const days = new Set(drafts.map((p) => p.day));
  return [...plans.filter((p) => !days.has(p.day)), ...drafts];
}

/**
 * The template the pre-fill may use: none while the curriculum runs (a copied
 * lesson would re-teach, P14), and never a slot holding a lesson or a Basics
 * workout (curriculum-only items).
 */
export function usableTemplate(data: AppData, cycle: number, now: number, cfg: DayConfig): Template {
  const first = cycleDays(cycle).find((d) => canEditDay(d, now, cfg)) ?? cycle * 10;
  if (!curriculumComplete(knownBefore(first, data.plans, data.lessons, cfg))) return emptyTemplate();
  return data.template.map((slot) =>
    slot.some((i) => i.kind === 'learn' || (i.kind === 'workout' && isBasicsId(i.routineId))) ? [] : slot,
  );
}

/**
 * Plans the editor shows for a cycle's unstarted days: saved ones, else the
 * pre-fill, each day suggested with what's known after the days before it.
 */
export function cycleDrafts(data: AppData, cycle: number, now: number, cfg: DayConfig): DayPlan[] {
  const suggest = (d: number, earlier: DayPlan[]) =>
    suggestDay(d, data.sessions, cfg, knownBefore(d, withDrafts(data.plans, earlier), data.lessons, cfg));
  return prefillCycle(cycle, usableTemplate(data, cycle, now, cfg), data.plans, suggest, now, cfg);
}

/* --- learned before used (P14) ------------------------------------------- */

export interface Unlearned {
  day: number;
  /** Exercises of the day's workouts whose lesson isn't on an earlier day. */
  exerciseIds: string[];
}

/** Exercises in `items` (a plan for `day`) not known before the day, given all `plans`. */
export function unlearnedIn(day: number, items: PlanItem[], plans: DayPlan[], data: Pick<AppData, 'lessons' | 'routines'>, cfg: DayConfig): string[] {
  const known = knownBefore(day, plans, data.lessons, cfg);
  const out: string[] = [];
  for (const i of items) {
    if (i.kind !== 'workout') continue;
    const r = findRoutine(i.routineId, data.routines);
    if (r) for (const id of unknownExercises(r, known)) if (!out.includes(id)) out.push(id);
  }
  return out;
}

/** Unstarted days among `drafts` whose workouts use an exercise not learned before them, oldest first. */
export function unlearnedDays(data: AppData, drafts: DayPlan[], now: number, cfg: DayConfig): Unlearned[] {
  const plans = withDrafts(data.plans, drafts);
  return drafts
    .filter((p) => canEditDay(p.day, now, cfg))
    .map((p) => ({ day: p.day, exerciseIds: unlearnedIn(p.day, p.items, plans, data, cfg) }))
    .filter((u) => u.exerciseIds.length > 0)
    .sort((a, b) => a.day - b.day);
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
  | { ok: false; error: 'already_approved' | 'started' | 'invalid_plans' | 'unlearned'; days: number[] };

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
  const drafts = cycleDrafts(data, cycle, now, cfg);
  const unlearned = unlearnedDays(data, drafts, now, cfg);
  if (unlearned.length) return { ok: false, error: 'unlearned', days: unlearned.map((u) => u.day) };
  for (const draft of drafts) {
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
  /** Lesson, workouts and rests, "Learn · Squat + Basics · 2 rounds". */
  title: string;
  mood: number;
  drill: number;
}

/** One line per day in the cycle editor: main items, plus mood and drill counts. */
export function cycleRowSummary(items: PlanItem[], cfg: DayConfig, custom: WorkoutRoutine[] = []): CycleRowSummary {
  // The lesson first: it's what's new that day (P14).
  const main = [...items.filter((i) => i.kind === 'learn'), ...items.filter((i) => i.kind === 'workout' || i.kind === 'rest')].map((i) =>
    itemText(i, cfg, custom),
  );
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
