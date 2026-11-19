/**
 * The custom routine builder's working copy (Settings → Routines): fields as
 * typed, validated and turned into a WorkoutRoutine. Pure; unit-tested in
 * routineDraft.test.ts. Every duration is whole seconds.
 */

import { EXERCISES } from '../data/exercises';
import { WORKOUT_ROUTINES } from '../data/routines';
import { shortDay } from '../time/daykeep';
import { routineSeconds } from '../workout/phases';
import type { AppData, WorkoutRoutine } from '../domain/types';
import type { WorkoutProtocol } from '../domain/types';

export const PROTOCOLS: readonly { value: WorkoutProtocol; label: string }[] = [
  { value: 'circuit', label: 'Circuit' },
  { value: 'tabata', label: 'Tabata' },
  { value: 'emom', label: 'EMOM' },
  { value: 'amrap', label: 'AMRAP' },
  { value: 'pyramid', label: 'Pyramid' },
];

export const PROTOCOL_LABEL = Object.fromEntries(PROTOCOLS.map((p) => [p.value, p.label])) as Record<WorkoutProtocol, string>;

export const LIMITS = {
  nameMax: 40,
  roundsMax: 20,
  exercisesMax: 20,
  workMin: 5,
  workMax: 600,
  restMax: 600,
  roundRestMax: 600,
} as const;

export const PREP_SECONDS = 10;

export interface ExerciseDraft {
  key: string;
  exerciseId: string;
  work: string;
  rest: string;
}

export interface RoutineDraft {
  /** Set when editing an existing custom routine. */
  id?: string;
  name: string;
  protocol: WorkoutProtocol;
  rounds: number;
  roundRest: string;
  exercises: ExerciseDraft[];
}

export type RoutineProblem = 'name' | 'name_taken' | 'no_exercises' | 'too_many' | 'rounds' | 'round_rest' | 'work' | 'rest' | 'exercise';

export const ROUTINE_PROBLEM_TEXT: Record<RoutineProblem, string> = {
  name: 'Give it a name',
  name_taken: 'Another routine has this name',
  no_exercises: 'Add at least one exercise',
  too_many: `At most ${LIMITS.exercisesMax} exercises`,
  rounds: `Rounds are 1 to ${LIMITS.roundsMax}`,
  round_rest: `Rest between rounds is 0 to ${LIMITS.roundRestMax} s`,
  work: `Work is ${LIMITS.workMin} to ${LIMITS.workMax} s`,
  rest: `Rest is 0 to ${LIMITS.restMax} s`,
  exercise: 'Pick an exercise for every row',
};

let seq = 0;
const key = () => `e${++seq}`;

/** Whole seconds between min and max (inclusive), as typed; null if not. */
export function parseWhole(text: string, min: number, max: number): number | null {
  const s = text.trim();
  if (!/^\d{1,4}$/.test(s)) return null;
  const n = Number(s);
  return n >= min && n <= max ? n : null;
}

export function newExercise(exerciseId = 'rope-boxer-skip-hiit'): ExerciseDraft {
  const ex = EXERCISES[exerciseId];
  return { key: key(), exerciseId, work: String(ex?.defaultWorkSeconds ?? 30), rest: String(ex?.defaultRestSeconds ?? 15) };
}

export function emptyRoutineDraft(): RoutineDraft {
  return { name: '', protocol: 'circuit', rounds: 3, roundRest: '60', exercises: [newExercise()] };
}

export function draftFromRoutine(r: WorkoutRoutine): RoutineDraft {
  return {
    id: r.id,
    name: r.title,
    protocol: r.protocol,
    rounds: r.rounds,
    roundRest: String(r.roundRestSeconds),
    exercises: r.exercises.map((e) => ({ key: key(), exerciseId: e.exerciseId, work: String(e.workSeconds), rest: String(e.restSeconds) })),
  };
}

/** Problems in the order the form shows them; empty when the draft can be saved. */
export function validateRoutine(d: RoutineDraft, others: WorkoutRoutine[] = []): RoutineProblem[] {
  const out: RoutineProblem[] = [];
  const name = d.name.trim();
  if (!name || name.length > LIMITS.nameMax) out.push('name');
  else {
    const lower = name.toLowerCase();
    const clash = [...WORKOUT_ROUTINES, ...others].some((r) => r.id !== d.id && r.title.trim().toLowerCase() === lower);
    if (clash) out.push('name_taken');
  }
  if (!Number.isInteger(d.rounds) || d.rounds < 1 || d.rounds > LIMITS.roundsMax) out.push('rounds');
  if (parseWhole(d.roundRest, 0, LIMITS.roundRestMax) === null) out.push('round_rest');
  if (d.exercises.length === 0) out.push('no_exercises');
  if (d.exercises.length > LIMITS.exercisesMax) out.push('too_many');
  if (d.exercises.some((e) => !EXERCISES[e.exerciseId])) out.push('exercise');
  if (d.exercises.some((e) => parseWhole(e.work, LIMITS.workMin, LIMITS.workMax) === null)) out.push('work');
  if (d.exercises.some((e) => parseWhole(e.rest, 0, LIMITS.restMax) === null)) out.push('rest');
  return out;
}

/** The routine to store, or the problems that keep it from saving. `id` is used for a new routine. */
export function buildRoutine(
  d: RoutineDraft,
  id: string,
  others: WorkoutRoutine[] = [],
): { ok: true; routine: WorkoutRoutine } | { ok: false; problems: RoutineProblem[] } {
  const problems = validateRoutine(d, others);
  if (problems.length) return { ok: false, problems };
  const exercises = d.exercises.map((e) => ({
    exerciseId: e.exerciseId,
    workSeconds: parseWhole(e.work, LIMITS.workMin, LIMITS.workMax)!,
    restSeconds: parseWhole(e.rest, 0, LIMITS.restMax)!,
  }));
  const routine: WorkoutRoutine = {
    id: d.id ?? id,
    title: d.name.trim(),
    subtitle: '',
    protocol: d.protocol,
    description: '',
    primaryGoal: 'hybrid',
    exercises,
    rounds: d.rounds,
    roundRestSeconds: parseWhole(d.roundRest, 0, LIMITS.roundRestMax)!,
    prepSeconds: PREP_SECONDS,
    estimatedCalories: 0,
    estimatedDurationMinutes: 0,
  };
  const seconds = routineSeconds(routine);
  routine.estimatedDurationMinutes = Math.max(1, Math.round(seconds / 60));
  // Legacy rule of thumb for HIIT: ≈ 10 kcal per working minute.
  const work = exercises.reduce((n, e) => n + e.workSeconds, 0) * d.rounds;
  routine.estimatedCalories = Math.round((work / 60) * 10);
  return { ok: true, routine };
}

/** "Circuit · 3 rounds · 4 exercises" */
export function routineMeta(r: WorkoutRoutine): string {
  const rounds = r.rounds === 1 ? '1 round' : `${r.rounds} rounds`;
  const n = r.exercises.length;
  return `${PROTOCOL_LABEL[r.protocol] ?? r.protocol} · ${rounds} · ${n} ${n === 1 ? 'exercise' : 'exercises'}`;
}

/**
 * Where a custom routine is still planned (today on, or in the template), so
 * deleting it can't leave a plan pointing at nothing. Returns a short reason or null.
 */
export function routineInUse(id: string, data: Pick<AppData, 'plans' | 'template'>, today: number): string | null {
  const plan = data.plans
    .filter((p) => p.day >= today && p.items.some((i) => i.kind === 'workout' && i.routineId === id))
    .sort((a, b) => a.day - b.day)[0];
  if (plan) return `Planned on day ${shortDay(plan.day, 3)}`;
  const slot = data.template.findIndex((s) => s.some((i) => i.kind === 'workout' && i.routineId === id));
  if (slot >= 0) return `Used in template slot ${slot}`;
  return null;
}
