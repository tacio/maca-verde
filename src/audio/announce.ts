/**
 * What the coach says (and which sound precedes it) when a workout phase
 * starts (P12: every phase change is spoken — exercise + one cue, rest,
 * next, finish). Pure; unit-tested in announce.test.ts. English only.
 */

import { exerciseCue, exerciseName } from '../workout/exerciseCues';
import type { Phase } from '../workout/phases';

export type BeepKind = 'tick' | 'start' | 'rest' | 'finish' | 'chime';

export interface Announcement {
  /** Played before the words; null = words only. */
  beep: BeepKind | null;
  text: string;
}

/** The announcement for entering `phases[index]` (index === phases.length: finished). */
export function phaseAnnouncement(phases: Phase[], index: number, totalRounds: number): Announcement {
  const p = phases[index];
  if (!p) return { beep: 'finish', text: 'Workout done. Well done.' };
  const name = exerciseName(p.exerciseId);
  switch (p.kind) {
    case 'prep':
      return { beep: null, text: `Get ready. First: ${name}.` };
    case 'work': {
      const cue = exerciseCue(p.exerciseId);
      const round = p.index === 0 && p.round > 1 ? `Round ${p.round} of ${totalRounds}. ` : '';
      return { beep: 'start', text: `${round}${name}.${cue ? ` ${cue}` : ''}` };
    }
    case 'rest':
      return { beep: 'rest', text: `Rest. Next: ${name}.` };
    case 'roundRest':
      return { beep: 'rest', text: `Round ${p.round - 1} done. Rest. Next: ${name}.` };
  }
}
