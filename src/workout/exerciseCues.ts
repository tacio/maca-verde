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
  'rope-high-knees-burn': { name: 'Rope high knees', cue: 'Chest up, knees to waist.' },
  'chin-tuck-cobra-hold': { name: 'Cobra & chin tuck', cue: 'Slide your head back, eyes down.' },
  'prone-ytw-raises': { name: 'Y-T-W raises', cue: 'Forehead down, chin tucked.' },
  'hollow-body-hold-tuck': { name: 'Hollow rock', cue: 'Lower back flat, chin tucked.' },
  'sprawl-burpee-blast': { name: 'Sprawl burpee', cue: 'Head in line with your spine.' },
  'mountain-climber-sprints': { name: 'Mountain climbers', cue: 'Push the floor away, hips low.' },
  'plank-downdog-toe-tap': { name: 'Plank–dog reach', cue: 'Let your head hang loose.' },
  // Lesson-taught building blocks (docs/design/04-curriculum.md).
  'chin-tuck': { name: 'Chin tuck', cue: 'Slide your head straight back.' },
  'jumping-jacks': { name: 'Jumping jacks', cue: 'Land softly.' },
  'high-plank': { name: 'High plank', cue: 'One straight line, head to heels.' },
  'rope-bounce': { name: 'Rope bounce', cue: 'Small hops, wrists turn the rope.' },
  'cobra-lift': { name: 'Cobra lift', cue: 'Thumbs up, eyes on the floor.' },
  'high-knees': { name: 'High knees', cue: 'Knees to hip height.' },
  'downward-dog': { name: 'Downward dog', cue: 'Push the floor away, head loose.' },
  squat: { name: 'Squat', cue: 'Chest up, sit back.' },
  'plank-to-downdog': { name: 'Plank to down dog', cue: 'Hips up and back, then forward.' },
  sprawl: { name: 'Sprawl', cue: 'Hands down, feet back, feet in.' },
  'hollow-tuck': { name: 'Hollow tuck', cue: 'Lower back flat.' },
  'prone-y': { name: 'Prone Y', cue: 'Thumbs up, chin tucked.' },
  'prone-t': { name: 'Prone T', cue: 'Pinch your shoulder blades.' },
  'prone-w': { name: 'Prone W', cue: 'Elbows to your ribs, squeeze.' },
  'hollow-hold': { name: 'Hollow hold', cue: 'Back flat; tuck if it lifts.' },
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
