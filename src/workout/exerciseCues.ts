/**
 * Short names and one spoken cue per exercise for the workout HUD and coach
 * (P12: exercise name + one short cue). The library titles in
 * src/data/exercises.ts are long ("Jump Rope Boxer Skip HIIT"); at 3 m and
 * by voice, short wins. Cues are condensed from each exercise's textNeckCue.
 */

import { EXERCISES } from '../data/exercises';

interface Cue {
  name: string;
  cue: string;
}

const CUES: Record<string, Cue> = {
  'door-bar-dead-hang': { name: 'Dead hang', cue: 'Chin tucked, neck long.' },
  'door-bar-scapular-pull': { name: 'Scapular pulls', cue: 'Shoulder blades down and back.' },
  'door-bar-hanging-knees': { name: 'Hanging knees', cue: 'Head still, exhale at the top.' },
  'door-bar-isometric-lock': { name: 'Flexed-arm hang', cue: 'Chest to the bar, neck long.' },
  'rope-boxer-skip-hiit': { name: 'Boxer skip', cue: 'Eyes forward, not at your feet.' },
  'rope-speed-sprint-tabata': { name: 'Speed sprint', cue: 'Shoulders down, fast wrists.' },
  'rope-high-knees-burn': { name: 'High knees', cue: 'Chest up, knees to waist.' },
  'chin-tuck-cobra-hold': { name: 'Cobra & chin tuck', cue: 'Slide your head back, eyes down.' },
  'prone-ytw-raises': { name: 'Y-T-W raises', cue: 'Forehead down, chin tucked.' },
  'hollow-body-hold-tuck': { name: 'Hollow body', cue: 'Lower back flat, chin tucked.' },
  'sprawl-burpee-blast': { name: 'Sprawl burpee', cue: 'Head in line with your spine.' },
  'mountain-climber-sprints': { name: 'Mountain climbers', cue: 'Push the floor away, hips low.' },
  'plank-downdog-toe-tap': { name: 'Plank to down dog', cue: 'Let your head hang loose.' },
};

/** Short display/spoken name of an exercise. */
export function exerciseName(id: string): string {
  return CUES[id]?.name ?? EXERCISES[id]?.name ?? 'Exercise';
}

/** One short form cue, or '' when none is known. */
export function exerciseCue(id: string): string {
  return CUES[id]?.cue ?? '';
}

/** Exercises whose work time counts as rope time (turn estimate). */
export const isRope = (id: string) => id.startsWith('rope-');
/** The exercise whose work time is a dead hang (hang estimate). */
export const isDeadHang = (id: string) => id === 'door-bar-dead-hang';
