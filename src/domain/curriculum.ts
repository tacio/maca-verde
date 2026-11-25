/**
 * The curriculum (P14; docs/design/04-curriculum.md): one lesson a day, an
 * exercise enters workouts only on a day after its lesson, and while the
 * curriculum runs the workout is a generated "Basics" routine made of what
 * has been learned. Pure functions, unit-tested in curriculum.test.ts.
 *
 * "Known before day d" counts a lesson planned on an earlier day (the plan is
 * the commitment: a missed lesson doesn't re-plan later days) or a lesson
 * logged before d starts.
 */

import { CURRICULUM, LESSONS } from '../data/lessons';
import { WORKOUT_ROUTINES } from '../data/routines';
import { dayStart, fromUnix, type DayConfig } from '../time/daykeep';
import type { DayPlan, LessonLog, WorkoutRoutine } from './types';

/** Exercises the built-in routines use (★ in 04-curriculum). */
export const ROUTINE_EXERCISES: ReadonlySet<string> = new Set(
  WORKOUT_ROUTINES.flatMap((r) => r.exercises.map((e) => e.exerciseId)),
);

/** Exercises taught by a lesson; every other exercise needs no lesson. */
export const isTaught = (exerciseId: string): boolean => exerciseId in LESSONS;

/** Exercises learned before `day` starts: lessons planned on earlier days or logged before it. */
export function knownBefore(day: number, plans: DayPlan[], lessons: LessonLog[], cfg: DayConfig): Set<string> {
  const known = new Set<string>();
  for (const p of plans) {
    if (p.day >= day) continue;
    for (const i of p.items) if (i.kind === 'learn') known.add(i.skillId);
  }
  const start = dayStart(day, cfg);
  for (const l of lessons) if (fromUnix(l.unix, cfg) < start) known.add(l.skillId);
  return known;
}

/** The next lesson in curriculum order, or undefined once the curriculum is complete. */
export function nextLesson(known: ReadonlySet<string>): string | undefined {
  return CURRICULUM.find((id) => !known.has(id));
}

export const curriculumComplete = (known: ReadonlySet<string>): boolean => nextLesson(known) === undefined;

/** How many lessons, in curriculum order, are known without a gap. */
export function knownPrefix(known: ReadonlySet<string>): number {
  const i = CURRICULUM.findIndex((id) => !known.has(id));
  return i === -1 ? CURRICULUM.length : i;
}

/* --- Basics workouts ------------------------------------------------------ */

export const BASICS_PREFIX = 'basics:';
export const BASICS_MAX_EXERCISES = 6;
export const BASICS_WORK_SECONDS = 20;
export const BASICS_REST_SECONDS = 20;
export const BASICS_ROUNDS = 2;
export const BASICS_ROUND_REST_SECONDS = 30;
export const BASICS_PREP_SECONDS = 10;

export const basicsId = (n: number): string => `${BASICS_PREFIX}${n}`;
export const isBasicsId = (routineId: string): boolean => routineId.startsWith(BASICS_PREFIX);

/** n of a `basics:<n>` id, or undefined. */
export function basicsCount(routineId: string): number | undefined {
  if (!routineId.startsWith(BASICS_PREFIX)) return undefined;
  const n = Number(routineId.slice(BASICS_PREFIX.length));
  return Number.isInteger(n) && n >= 1 && n <= CURRICULUM.length ? n : undefined;
}

/**
 * Exercises of the Basics workout after the first `n` lessons: the 6 newest,
 * in the order learned. A part leaves once a learned combination uses it,
 * unless the part is itself a routine exercise (dead hang stays after
 * scapular pulls; chin tuck leaves after cobra & chin tuck).
 */
export function basicsExercises(n: number): string[] {
  const learned = CURRICULUM.slice(0, Math.max(0, Math.min(n, CURRICULUM.length)));
  const replaced = new Set<string>();
  for (const id of learned) for (const part of LESSONS[id]?.parts ?? []) if (!ROUTINE_EXERCISES.has(part)) replaced.add(part);
  return learned.filter((id) => !replaced.has(id)).slice(-BASICS_MAX_EXERCISES);
}

/** The generated Basics routine after `n` lessons (n ≥ 1). Deterministic: never stored. */
export function basicsRoutine(n: number): WorkoutRoutine {
  const exercises = basicsExercises(n).map((exerciseId) => ({
    exerciseId,
    workSeconds: BASICS_WORK_SECONDS,
    restSeconds: BASICS_REST_SECONDS,
  }));
  const seconds =
    exercises.length * (BASICS_WORK_SECONDS + BASICS_REST_SECONDS) * BASICS_ROUNDS +
    BASICS_ROUND_REST_SECONDS * (BASICS_ROUNDS - 1) +
    BASICS_PREP_SECONDS;
  return {
    id: basicsId(n),
    title: 'Basics',
    subtitle: 'What you’ve learned so far',
    protocol: 'circuit',
    primaryGoal: 'hybrid',
    description: 'One exercise more after each lesson.',
    exercises,
    rounds: BASICS_ROUNDS,
    roundRestSeconds: BASICS_ROUND_REST_SECONDS,
    prepSeconds: BASICS_PREP_SECONDS,
    estimatedCalories: exercises.length * BASICS_ROUNDS * 3,
    estimatedDurationMinutes: Math.ceil(seconds / 60),
  };
}

/* --- learned before used ---------------------------------------------------- */

/** Taught exercises of a routine that aren't known yet, in routine order, without repeats. */
export function unknownExercises(routine: Pick<WorkoutRoutine, 'exercises'>, known: ReadonlySet<string>): string[] {
  const out: string[] = [];
  for (const e of routine.exercises) {
    if (isTaught(e.exerciseId) && !known.has(e.exerciseId) && !out.includes(e.exerciseId)) out.push(e.exerciseId);
  }
  return out;
}
