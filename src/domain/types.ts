/**
 * Domain types for the redesign (docs/design/00-brief.md, 02-workflows.md §3, §7).
 *
 * Time: every stamp is Unix seconds; days are daykeep day numbers computed
 * with the user's DayConfig (src/time/daykeep.ts). No civil dates.
 */

import type { DayConfig } from '../time/daykeep';

export type { DayConfig } from '../time/daykeep';

/* --- content (src/data: exercises, routines, scenarios) ------------------ */

export type EquipmentType = 'rope' | 'door_bar' | 'bodyweight';
export type GoalTarget = 'posture' | 'belly_fat' | 'cardio' | 'hybrid';
export type WorkoutProtocol = 'tabata' | 'emom' | 'amrap' | 'pyramid' | 'circuit';

export interface Exercise {
  id: string;
  name: string;
  targets: GoalTarget[];
  equipment: EquipmentType;
  difficulty: 1 | 2 | 3 | 4 | 5;
  description: string;
  /** Long-form notes from the original library; newer, lesson-taught exercises leave them out. */
  textNeckCue?: string;
  postureBenefit?: string;
  bellyBurnBenefit?: string;
  cardioBenefit?: string;
  formPoints: string[];
  defaultWorkSeconds: number;
  defaultRestSeconds: number;
  cadenceTip?: string;
  targetMuscles?: string[];
}

/* --- lessons (P14, docs/design/04-curriculum.md) ------------------------- */

/** Camera angles a lesson picture can show. */
export type LessonView = 'side' | 'front' | 'top' | 'diagonal';

export interface LessonStep {
  /** One instruction, ≤ 2 lines on the lesson screen. */
  text: string;
  /** Angles this step has a picture for, first = default; never empty. */
  views: LessonView[];
}

/** The lesson that introduces one exercise (keyed by exercise id). */
export interface Lesson {
  exerciseId: string;
  /** Exercises this one combines; each has its own earlier lesson. */
  parts: string[];
  /** Ends with the "try it" step. */
  steps: LessonStep[];
}

export interface WorkoutExerciseItem {
  exerciseId: string;
  workSeconds: number;
  restSeconds: number;
  repsGoal?: number;
  targetIntensity?: 'Sprint' | 'High' | 'Moderate' | 'Hold / Controlled';
}

export interface WorkoutRoutine {
  id: string;
  title: string;
  subtitle: string;
  protocol: WorkoutProtocol;
  description: string;
  primaryGoal: GoalTarget;
  exercises: WorkoutExerciseItem[];
  rounds: number;
  roundRestSeconds: number;
  prepSeconds: number;
  estimatedCalories: number;
  estimatedDurationMinutes: number;
  isDailyRecommended?: boolean;
  levelRequired?: number;
}

export interface ProvocationScenario {
  id: string;
  category: 'tired' | 'hungry' | 'upset' | 'criticism' | 'boundary';
  situation: string;
  somaticWarning: string;
  impulsiveReaction: string;
  prefrontalResponse: string;
  mentalPauseTip: string;
}

/* --- mood ---------------------------------------------------------------- */

export type ValenceType = 'great' | 'good' | 'neutral' | 'frustrated' | 'exhausted' | 'anxious';

export interface HALTState {
  hungry: boolean;
  angry: boolean;
  lonely: boolean;
  tired: boolean;
}

export type SomaticTensionArea = 'jaw' | 'neck_shoulders' | 'chest' | 'stomach' | 'hands';

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
  /** The last cycle whose clean-cycle moment was shown (P13); each shows once. */
  cleanCycleShown?: number;
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

/** A lesson that introduces one exercise (P14); ≤ 1 per day. */
export interface LearnItem {
  id: string;
  kind: 'learn';
  /** Exercise id the lesson teaches. */
  skillId: string;
}

export type PlanItem = WorkoutItem | RestItem | MoodItem | DrillItem | LearnItem;
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
  /** Effort, 0–1 (tap scale, 2 decimals). */
  rpe: number;
  /** Neck tension, 0 (none) – 1 (worst), 2 decimals. */
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
  /** 0 (drained) – 1 (charged), 2 decimals. */
  energy?: number;
  tension?: SomaticTensionArea[];
  /** 0 (rarely) – 1 (every time) paused before speaking, 2 decimals. */
  speakingRating?: number;
  notes?: string;
}

/** A drill belongs to the day of its `unix`. */
export interface DrillLog {
  id: string;
  unix: number;
  drillType: 'high_hr_pause' | 'speech_filter' | 'physiological_sigh';
  heartRateState: 'elevated_post_hiit' | 'resting';
  pauseSecondsAchieved: number;
  scenarioId?: string;
  impulseResisted: boolean;
  reflection?: string;
}

/** A completed lesson; belongs to the day of its `unix`. */
export interface LessonLog {
  id: string;
  skillId: string;
  unix: number;
}

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
  /** Completed lessons (P14). */
  lessons: LessonLog[];
  /** Custom routines (built-ins live in src/data/routines.ts). */
  routines: WorkoutRoutine[];
}

/** The parts of AppData the record is derived from. */
export type RecordData = Pick<
  AppData,
  'cycles' | 'plans' | 'sessions' | 'rests' | 'moods' | 'drills' | 'justifications' | 'lessons'
>;
