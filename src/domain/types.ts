/**
 * Domain types for the redesign (docs/design/00-brief.md, 02-workflows.md §3, §7).
 *
 * Time: every stamp is Unix seconds; days are daykeep day numbers computed
 * with the user's DayConfig (src/time/daykeep.ts). No civil dates.
 */

import type { DayConfig } from '../time/daykeep';
import type { WorkoutRoutine } from '../types/fitness';
import type {
  EmotionalControlDrillLog,
  HALTState,
  SomaticTensionArea,
  ValenceType,
} from '../types/mood';

export type { DayConfig } from '../time/daykeep';
export type { WorkoutRoutine } from '../types/fitness';
export type { HALTState, ValenceType, SomaticTensionArea } from '../types/mood';

/* --- settings ----------------------------------------------------------- */

export interface DriveSettings {
  clientId: string;
  autoBackup: boolean;
  lastBackupUnix?: number;
}

export interface Settings {
  config: DayConfig;
  /** "After I ___, I train." (P4) */
  anchor: string;
  sound: boolean;
  voice: boolean;
  drive: DriveSettings;
  /** Set when onboarding finishes; absent means onboarding is due. */
  onboardedUnix?: number;
}

/* --- plan --------------------------------------------------------------- */

export interface WorkoutTargets {
  totalSeconds?: number;
  rounds?: number;
  hangSeconds?: number;
  ropeTurns?: number;
}

export type TargetMetric = keyof WorkoutTargets;
export const TARGET_METRICS: readonly TargetMetric[] = ['totalSeconds', 'rounds', 'hangSeconds', 'ropeTurns'];

export interface WorkoutItem {
  id: string;
  kind: 'workout';
  routineId: string;
  targets: WorkoutTargets;
}

export interface RestItem {
  id: string;
  kind: 'rest';
  /** e.g. 'meditation', 'silence' */
  restKind: string;
  durationSeconds: number;
}

export interface MoodItem {
  id: string;
  kind: 'mood';
  count: number;
}

export interface DrillItem {
  id: string;
  kind: 'drill';
  count: number;
}

export type PlanItem = WorkoutItem | RestItem | MoodItem | DrillItem;
export type PlanItemKind = PlanItem['kind'];

export interface DayPlan {
  day: number;
  items: PlanItem[];
  updatedUnix: number;
}

export interface CycleApproval {
  cycle: number;
  approvedUnix: number;
}

/** 10 slots indexed by the last digit of the day number; an empty slot is []. */
export type Template = PlanItem[][];

/* --- logs --------------------------------------------------------------- */

/** A workout session belongs to the day of its end moment. */
export interface WorkoutSession {
  id: string;
  routineId: string;
  startUnix: number;
  endUnix: number;
  /** false when ended early: such a session never satisfies a plan item. */
  completedFull: boolean;
  totalSeconds: number;
  roundsCompleted: number;
  totalRounds: number;
  hangSeconds?: number;
  ropeTurns?: number;
  /** 1–10 */
  rpe: number;
  /** 0 (pain free) – 10 */
  neck: number;
  estimatedCalories: number;
}

/** A rest practice session belongs to the day of its end moment. */
export interface RestSession {
  id: string;
  restKind: string;
  startUnix: number;
  endUnix: number;
  durationSeconds: number;
  completedFull: boolean;
}

/** A mood check belongs to the day of its `unix`. */
export interface MoodCheck {
  id: string;
  unix: number;
  valence: ValenceType;
  halt: HALTState;
  energy?: 1 | 2 | 3 | 4 | 5;
  tension?: SomaticTensionArea[];
  speakingRating?: 1 | 2 | 3 | 4 | 5;
  notes?: string;
}

/** A drill belongs to the day of its `unix`. */
export type DrillLog = Omit<EmotionalControlDrillLog, 'date' | 'timestamp'> & { unix: number };

export type JustificationReason = 'plan_too_big' | 'time' | 'energy' | 'pain' | 'forgot' | 'other';
export const JUSTIFICATION_REASONS: readonly JustificationReason[] = [
  'plan_too_big',
  'time',
  'energy',
  'pain',
  'forgot',
  'other',
];

export interface Justification {
  day: number;
  reason: JustificationReason;
  text: string;
  unix: number;
}

/* --- all data ----------------------------------------------------------- */

export interface AppData {
  settings: Settings;
  template: Template;
  cycles: CycleApproval[];
  plans: DayPlan[];
  sessions: WorkoutSession[];
  rests: RestSession[];
  moods: MoodCheck[];
  drills: DrillLog[];
  justifications: Justification[];
  /** Custom routines (built-ins live in src/data/routines.ts). */
  routines: WorkoutRoutine[];
}

/** The parts of AppData the record is derived from. */
export type RecordData = Pick<
  AppData,
  'cycles' | 'plans' | 'sessions' | 'rests' | 'moods' | 'drills' | 'justifications'
>;
