/**
 * Pure helpers for Today (J4), the mood check (J5) and closing a missed day
 * (J7): which action is primary, and the short lines those screens show.
 * No React here (unit-tested in today.test.ts).
 */

import { toUnit } from '../ui/unit';
import { cycleOf, type DayConfig } from '../time/daykeep';
import { formatSeconds } from '../time/seconds';
import { routineSeconds } from '../workout/phases';
import { findRoutine, level, overloadMultiplier, scaleRoutine } from '../domain/engine';
import { approvalFor, dayAt, dayStartUnix } from '../domain/plan';
import type { DayEvaluation, ItemProgress, RecordSummary } from '../domain/record';
import type {
  AppData,
  HALTState,
  Justification,
  JustificationReason,
  MoodCheck,
  PlanItem,
  SomaticTensionArea,
  ValenceType,
  WorkoutRoutine,
  WorkoutSession,
} from '../domain/types';
import { formatAverage } from '../ui/StatsBlock';
import { nextItem, routineName } from './view';

/* --- primary action (J4) -------------------------------------------------- */

/** Days before a cycle starts when Today shows a quiet "plan the next cycle" row. */
export const CYCLE_NOTICE_DAYS = 3;
/** Days before a cycle starts when approving it becomes the primary, once today is done. */
export const CYCLE_PRIMARY_DAYS = 1;

export type TodayPrimary =
  /** Setup day: the record starts on `start`. */
  | { kind: 'warmup'; start: number }
  /** Nothing has ever been planned. */
  | { kind: 'unplanned' }
  /** Missed days wait for a note; they block Today (J7). Oldest first. */
  | { kind: 'justify'; days: number[] }
  /** Today has no approved plan. */
  | { kind: 'no-plan' }
  /** The next undone item (workouts first). */
  | { kind: 'item'; progress: ItemProgress }
  /** Today is done and the next cycle starts soon without approval. */
  | { kind: 'cycle'; cycle: number }
  /** Today is done; nothing else is due. */
  | { kind: 'done' };

/** Seconds until the next cycle starts, or null if it's already approved. */
export function nextCycleDue(cycles: AppData['cycles'], today: number, now: number, cfg: DayConfig): { cycle: number; in: number } | null {
  const cycle = cycleOf(today) + 1;
  if (approvalFor(cycles, cycle)) return null;
  return { cycle, in: dayStartUnix(cycle * 10, cfg) - now };
}

/**
 * Today's one primary action, in the order of 02-workflows J4: a pending
 * justification blocks everything; then the next undone item; then, once the
 * day is done, approving a cycle that starts within a day; else "day done".
 */
export function todayPrimary(record: RecordSummary, cycles: AppData['cycles'], now: number, cfg: DayConfig): TodayPrimary {
  const start = record.recordStartDay;
  if (start === null) return { kind: 'unplanned' };
  if (record.today < start) return { kind: 'warmup', start };
  if (record.pendingJustifications.length > 0) return { kind: 'justify', days: record.pendingJustifications };
  const t = record.todayEval;
  if (!t.planned || t.items.length === 0) return { kind: 'no-plan' };
  const next = nextItem(t.items);
  if (next) return { kind: 'item', progress: next };
  const due = nextCycleDue(cycles, record.today, now, cfg);
  if (due && due.in <= CYCLE_PRIMARY_DAYS * cfg.dayLength) return { kind: 'cycle', cycle: due.cycle };
  return { kind: 'done' };
}

/** The flow a plan item opens: `workout:<id>`, `rest:<id>`, `mood`, `drill`. */
export function itemFlow(item: PlanItem): string {
  switch (item.kind) {
    case 'workout':
      return `workout:${item.id}`;
    case 'rest':
      return `rest:${item.id}`;
    case 'mood':
      return 'mood';
    case 'drill':
      return 'drill';
  }
}

/** A built-in or custom routine scaled to the current overload (engine.scaleRoutine). */
export function scaledRoutine(routineId: string, sessions: WorkoutSession[], custom: WorkoutRoutine[] = []): WorkoutRoutine | undefined {
  const base = findRoutine(routineId, custom);
  return base && scaleRoutine(base, overloadMultiplier(sessions), level(sessions));
}

export { routineSeconds };

/** Primary label for an item: "Start Tabata · 712 s", "Check in", "Start pause drill". */
export function primaryText(item: PlanItem, cfg: DayConfig, sessions: WorkoutSession[] = [], custom: WorkoutRoutine[] = []): string {
  switch (item.kind) {
    case 'workout': {
      const name = routineName(item.routineId, custom);
      const r = scaledRoutine(item.routineId, sessions, custom);
      return r ? `Start ${name} · ${formatSeconds(routineSeconds(r))}` : `Start ${name}`;
    }
    case 'rest':
      return `Start ${item.restKind} · ${formatSeconds(item.durationSeconds)}`;
    case 'mood':
      return 'Check in';
    case 'drill':
      return 'Start pause drill';
  }
}

/* --- recovery day (P7) ---------------------------------------------------- */

/** One line for a recovery day, or null. Adds the warning when a reserve covered yesterday. */
export function recoveryLine(record: RecordSummary): string | null {
  if (!record.isRecoveryDay) return null;
  if (record.todayEval.status === 'done') return 'Back on track';
  const base = 'Recovery day — finish today to get back on track';
  return record.protectedDays.includes(record.today - 1) ? `${base}; next miss would break the streak` : base;
}

/* --- HALT (P11, 02-workflows §4) ----------------------------------------- */

const HALT_ORDER: (keyof HALTState)[] = ['hungry', 'angry', 'lonely', 'tired'];

/** "HALT: tired — pause 5 s before replying." from the latest check of `day`, or null. */
export function haltLine(moods: MoodCheck[], day: number, cfg: DayConfig): string | null {
  let latest: MoodCheck | undefined;
  for (const m of moods) if (dayAt(m.unix, cfg) === day && (!latest || m.unix > latest.unix)) latest = m;
  if (!latest) return null;
  const halt = latest.halt;
  const flags = HALT_ORDER.filter((k) => halt[k]);
  return flags.length ? `HALT: ${flags.join(', ')} — pause 5 s before replying.` : null;
}

/* --- mood check (J5) ------------------------------------------------------ */

export const VALENCE_LABEL: Record<ValenceType, string> = {
  great: 'Great',
  good: 'Good',
  neutral: 'Okay',
  frustrated: 'Frustrated',
  exhausted: 'Exhausted',
  anxious: 'Anxious',
};
export const VALENCES = Object.keys(VALENCE_LABEL) as ValenceType[];

export const HALT_OPTIONS = HALT_ORDER.map((k) => ({ value: k, label: k[0].toUpperCase() + k.slice(1) }));

export const TENSION_OPTIONS: { value: SomaticTensionArea; label: string }[] = [
  { value: 'jaw', label: 'Jaw' },
  { value: 'neck_shoulders', label: 'Neck & shoulders' },
  { value: 'chest', label: 'Chest' },
  { value: 'stomach', label: 'Stomach' },
  { value: 'hands', label: 'Hands' },
];

/** The mood check being filled in. Optional fields stay undefined until touched. */
export interface MoodDraft {
  valence: ValenceType | null;
  halt: (keyof HALTState)[];
  /** 0–1 tap-scale rating. */
  energy?: number;
  tension?: SomaticTensionArea[];
  /** 0–1 tap-scale rating. */
  speakingRating?: number;
  notes?: string;
}

export const emptyMoodDraft = (): MoodDraft => ({ valence: null, halt: [] });

/** The MoodCheck to store, or null without a valence. Untouched and empty optional fields are left out. */
export function buildMoodCheck(d: MoodDraft, id: string, unix: number): MoodCheck | null {
  if (!d.valence) return null;
  const m: MoodCheck = {
    id,
    unix,
    valence: d.valence,
    halt: { hungry: d.halt.includes('hungry'), angry: d.halt.includes('angry'), lonely: d.halt.includes('lonely'), tired: d.halt.includes('tired') },
  };
  if (d.energy !== undefined) m.energy = toUnit(d.energy);
  if (d.tension?.length) m.tension = [...d.tension];
  if (d.speakingRating !== undefined) m.speakingRating = toUnit(d.speakingRating);
  const notes = d.notes?.trim();
  if (notes) m.notes = notes;
  return m;
}

/** A short id for a new log (crypto.randomUUID needs a secure context; the LAN dev server isn't one). */
export function newLogId(prefix: string, unix: number): string {
  return `${prefix}-${unix}-${Math.random().toString(36).slice(2, 8)}`;
}

/* --- justification (J7) --------------------------------------------------- */

export const REASON_LABEL: Record<JustificationReason, string> = {
  plan_too_big: 'Plan too big',
  time: 'Time',
  energy: 'Energy',
  pain: 'Pain',
  forgot: 'Forgot',
  other: 'Other',
};

/** "one sentence": short enough to write in seconds. */
export const NOTE_MAX = 140;

const listJoin = (xs: string[]) => (xs.length <= 1 ? (xs[0] ?? '') : `${xs.slice(0, -1).join(', ')} and ${xs[xs.length - 1]}`);

/** What a closed day still had open: "0 of 3 done · Rope, 1 mood check and 1 pause drill left". */
export function leftText(e: DayEvaluation, custom: WorkoutRoutine[] = []): string {
  if (!e.planned || e.items.length === 0) return 'Nothing was planned for this day';
  const left = e.items
    .filter((p) => !p.satisfied)
    .map((p) => {
      const n = p.required - p.current;
      switch (p.item.kind) {
        case 'workout':
          return routineName(p.item.routineId, custom);
        case 'rest':
          return p.item.restKind;
        case 'mood':
          return n === 1 ? '1 mood check' : `${n} mood checks`;
        case 'drill':
          return n === 1 ? '1 pause drill' : `${n} pause drills`;
      }
    });
  return `${e.satisfiedCount} of ${e.totalCount} done · ${listJoin(left)} left`;
}

export interface JustifyOutcome {
  /** Streak protection (a reserve) kept the streak (◆ → ◇) — still a missed day — or the streak reset. */
  kind: 'kept' | 'reset';
  text: string;
  /** The missed day was yesterday, so today is a recovery day (P7). */
  recoveryToday: boolean;
}

/** What happened to the streak because of `day` (record.protectedDays / brokenDays). Never blames (P8). */
export function justifyOutcome(day: number, record: RecordSummary): JustifyOutcome {
  const recoveryToday = day === record.today - 1;
  if (record.protectedDays.includes(day)) return { kind: 'kept', text: 'Streak kept with protection — the day still counts as missed', recoveryToday };
  const avg = record.averageDays === 0 ? '' : ` — ${formatAverage(record.average)} of last ${record.averageDays === 1 ? 'day' : `${record.averageDays} days`} stays`;
  return { kind: 'reset', text: `Streak reset${avg}`, recoveryToday };
}

export function buildJustification(day: number, reason: JustificationReason | null, text: string, unix: number): Justification | null {
  const t = text.trim();
  if (!reason || !t) return null;
  return { day, reason, text: t.slice(0, NOTE_MAX), unix };
}

/** Flow label for the stack: "1 of 3". */
export function stackText(total: number, remaining: number): string | null {
  return total > 1 ? `${Math.min(total, total - remaining + 1)} of ${total}` : null;
}
