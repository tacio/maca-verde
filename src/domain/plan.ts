/**
 * Plan rules (docs/design/00-brief.md → The plan; 02-workflows.md §3).
 *
 * - A day plan is never empty; ≤ 1 mood item, ≤ 1 drill item and ≤ 1 lesson
 *   (P14); counts ≥ 1; every target is a positive integer.
 * - Day N's plan is editable until N.0000 and locked for the whole of day N
 *   (no function here modifies the plan of a started day).
 * - Cycle c covers days 10c..10c+9 and must be explicitly approved. An
 *   approval covers the cycle's days that had not started at approval time.
 * - A day counts as planned only if its cycle's approval covers it and its
 *   plan is valid (and was last saved before the day started).
 */

import { cycleOf, dayOf, dayStart, fromUnix, type DayConfig } from '../time/daykeep';
import { LESSONS } from '../data/lessons';
import {
  TARGET_METRICS,
  type CycleApproval,
  type DayPlan,
  type PlanItem,
  type Template,
} from './types';

/* --- time helpers ------------------------------------------------------- */

/** Day number containing Unix moment `unix`. */
export function dayAt(unix: number, cfg: DayConfig): number {
  return dayOf(fromUnix(unix, cfg), cfg);
}

/** Unix seconds of the start (N.0000) of `day`. */
export function dayStartUnix(day: number, cfg: DayConfig): number {
  return dayStart(day, cfg) + cfg.epoch;
}

/** Days of cycle `cycle`: 10c..10c+9. */
export function cycleDays(cycle: number): number[] {
  return Array.from({ length: 10 }, (_, i) => cycle * 10 + i);
}

/** Template slot of a day: its last digit. */
export function slotOf(day: number): number {
  return ((day % 10) + 10) % 10;
}

/* --- validation --------------------------------------------------------- */

export type PlanProblem =
  | 'empty'
  | 'duplicate_mood'
  | 'duplicate_drill'
  | 'duplicate_id'
  | 'bad_count'
  | 'bad_target'
  | 'bad_duration'
  | 'bad_routine'
  | 'bad_rest_kind'
  | 'duplicate_learn'
  | 'bad_skill';

function isPositiveInt(n: unknown): boolean {
  return typeof n === 'number' && Number.isInteger(n) && n >= 1;
}

/** Problems with a list of plan items; [] means valid. */
export function validatePlanItems(items: PlanItem[]): PlanProblem[] {
  const problems = new Set<PlanProblem>();
  if (items.length === 0) problems.add('empty');
  const ids = new Set<string>();
  let moods = 0;
  let drills = 0;
  let lessons = 0;
  for (const item of items) {
    if (ids.has(item.id)) problems.add('duplicate_id');
    ids.add(item.id);
    switch (item.kind) {
      case 'workout': {
        if (!item.routineId) problems.add('bad_routine');
        // No targets is allowed: then any full session of the routine satisfies it.
        for (const m of TARGET_METRICS) {
          if (item.targets[m] !== undefined && !isPositiveInt(item.targets[m])) problems.add('bad_target');
        }
        break;
      }
      case 'rest':
        if (!item.restKind) problems.add('bad_rest_kind');
        if (!isPositiveInt(item.durationSeconds)) problems.add('bad_duration');
        break;
      case 'mood':
        moods++;
        if (!isPositiveInt(item.count)) problems.add('bad_count');
        break;
      case 'drill':
        drills++;
        if (!isPositiveInt(item.count)) problems.add('bad_count');
        break;
      case 'learn':
        lessons++;
        if (!LESSONS[item.skillId]) problems.add('bad_skill');
        break;
    }
  }
  if (moods > 1) problems.add('duplicate_mood');
  if (drills > 1) problems.add('duplicate_drill');
  if (lessons > 1) problems.add('duplicate_learn');
  return [...problems];
}

export function isValidPlan(plan: DayPlan | undefined): plan is DayPlan {
  return !!plan && validatePlanItems(plan.items).length === 0;
}

/* --- lock & editing ------------------------------------------------------ */

/** Day N is editable while now < N.0000; locked from then on. */
export function canEditDay(day: number, now: number, cfg: DayConfig): boolean {
  return fromUnix(now, cfg) < dayStart(day, cfg);
}

export function findPlan(plans: DayPlan[], day: number): DayPlan | undefined {
  return plans.find((p) => p.day === day);
}

export type SavePlanResult =
  | { ok: true; plans: DayPlan[]; plan: DayPlan }
  | { ok: false; error: 'locked' }
  | { ok: false; error: 'invalid'; problems: PlanProblem[] };

/** Insert or replace the plan for `day`. Refused for started days and invalid plans. */
export function saveDayPlan(
  plans: DayPlan[],
  day: number,
  items: PlanItem[],
  now: number,
  cfg: DayConfig,
): SavePlanResult {
  if (!canEditDay(day, now, cfg)) return { ok: false, error: 'locked' };
  const problems = validatePlanItems(items);
  if (problems.length) return { ok: false, error: 'invalid', problems };
  const plan: DayPlan = { day, items, updatedUnix: now };
  const rest = plans.filter((p) => p.day !== day);
  return { ok: true, plan, plans: [...rest, plan].sort((a, b) => a.day - b.day) };
}

/* --- approval ----------------------------------------------------------- */

/** The (earliest) approval of a cycle, if any. */
export function approvalFor(cycles: CycleApproval[], cycle: number): CycleApproval | undefined {
  let best: CycleApproval | undefined;
  for (const c of cycles) if (c.cycle === cycle && (!best || c.approvedUnix < best.approvedUnix)) best = c;
  return best;
}

/** First day an approval covers: the cycle's first day not yet started at approval time. */
export function firstCoveredDay(approval: CycleApproval, cfg: DayConfig): number {
  return Math.max(approval.cycle * 10, dayAt(approval.approvedUnix, cfg) + 1);
}

/** Days of the cycle an approval covers (may be empty if approved after the cycle's last day started). */
export function coveredDays(approval: CycleApproval, cfg: DayConfig): number[] {
  const first = firstCoveredDay(approval, cfg);
  return cycleDays(approval.cycle).filter((d) => d >= first);
}

/**
 * An approval is on time — and earns a reserve — when made before its
 * cycle's first day starts.
 *
 * Exception (02-workflows J1 step 3): the very first approval ever, made
 * during onboarding for "tomorrow to the end of the current cycle", is on
 * time even though that cycle already started. It's the earliest approval in
 * `cycles` and it still has to cover at least one day.
 */
export function isOnTime(approval: CycleApproval, cycles: CycleApproval[], cfg: DayConfig): boolean {
  if (fromUnix(approval.approvedUnix, cfg) < dayStart(approval.cycle * 10, cfg)) return true;
  const first = cycles.reduce<CycleApproval | undefined>(
    (a, c) => (!a || c.approvedUnix < a.approvedUnix ? c : a),
    undefined,
  );
  return (
    first !== undefined &&
    first.cycle === approval.cycle &&
    first.approvedUnix === approval.approvedUnix &&
    coveredDays(approval, cfg).length > 0
  );
}

export type ApproveResult =
  | { ok: true; cycles: CycleApproval[]; approval: CycleApproval; onTime: boolean; days: number[] }
  | { ok: false; error: 'already_approved' }
  | { ok: false; error: 'started'; days: [] }
  | { ok: false; error: 'invalid_plans'; days: number[] };

/**
 * Approve cycle `cycle` at `now`. Covers the cycle's days that haven't
 * started; every one of them needs a valid plan. A late approval (after the
 * cycle's first day started) is allowed for the remaining days but earns no
 * reserve (except the onboarding approval, see isOnTime).
 */
export function approveCycle(
  cycles: CycleApproval[],
  cycle: number,
  plans: DayPlan[],
  now: number,
  cfg: DayConfig,
): ApproveResult {
  if (approvalFor(cycles, cycle)) return { ok: false, error: 'already_approved' };
  const approval: CycleApproval = { cycle, approvedUnix: now };
  const days = coveredDays(approval, cfg);
  if (days.length === 0) return { ok: false, error: 'started', days: [] };
  const bad = days.filter((d) => !isValidPlan(findPlan(plans, d)));
  if (bad.length) return { ok: false, error: 'invalid_plans', days: bad };
  const next = [...cycles, approval].sort((a, b) => a.cycle - b.cycle);
  return { ok: true, cycles: next, approval, onTime: isOnTime(approval, next, cfg), days };
}

/**
 * A day is planned when its cycle's approval covers it and its plan is valid
 * and was last saved before the day started (a defensive check: the API never
 * saves a started day's plan, so a later stamp means the data was tampered with).
 */
export function isDayPlanned(
  day: number,
  cycles: CycleApproval[],
  plans: DayPlan[],
  cfg: DayConfig,
): boolean {
  const approval = approvalFor(cycles, cycleOf(day));
  if (!approval || day < firstCoveredDay(approval, cfg)) return false;
  const plan = findPlan(plans, day);
  return isValidPlan(plan) && fromUnix(plan.updatedUnix, cfg) < dayStart(day, cfg);
}

/* --- template ----------------------------------------------------------- */

export function emptyTemplate(): Template {
  return Array.from({ length: 10 }, () => []);
}

/** Item id unique within a day plan. */
export function itemId(day: number, index: number): string {
  return `${day}-${index}`;
}

function withIds(day: number, items: PlanItem[]): PlanItem[] {
  return items.map((item, i) => ({ ...item, id: itemId(day, i) }));
}

/** Build a template from a cycle's plans (slot = last digit); days without a plan leave the slot empty. */
export function templateFromPlans(cycle: number, plans: DayPlan[]): Template {
  const t = emptyTemplate();
  for (const d of cycleDays(cycle)) {
    const p = findPlan(plans, d);
    if (p) t[slotOf(d)] = p.items.map((i) => ({ ...i }));
  }
  return t;
}

/**
 * Pre-fill the cycle's unstarted days for the approval editor (J2). Existing
 * plans are kept; otherwise the template slot is used if it's a valid plan;
 * otherwise `suggest(day, earlier)`, where `earlier` holds the drafts of the
 * cycle's days before it (so a curriculum advances one lesson per day, P14).
 * Returns the plans of the cycle's unstarted days, in day order.
 * The template never counts as a plan by itself: the caller saves and approves.
 */
export function prefillCycle(
  cycle: number,
  template: Template,
  plans: DayPlan[],
  suggest: (day: number, earlier: DayPlan[]) => PlanItem[],
  now: number,
  cfg: DayConfig,
): DayPlan[] {
  const drafts: DayPlan[] = [];
  for (const d of cycleDays(cycle)) {
    if (!canEditDay(d, now, cfg)) continue;
    const existing = findPlan(plans, d);
    if (existing) {
      drafts.push(existing);
      continue;
    }
    const slot = template[slotOf(d)] ?? [];
    const items = validatePlanItems(slot).length === 0 ? withIds(d, slot) : withIds(d, suggest(d, [...drafts]));
    drafts.push({ day: d, items, updatedUnix: now });
  }
  return drafts;
}
