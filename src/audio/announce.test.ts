import { describe, expect, it } from 'vitest';
import { WORKOUT_ROUTINES } from '../data/routines';
import { TABATA_ROUTINE_ID } from '../domain/engine';
import { buildPhases } from '../workout/phases';
import { phaseAnnouncement } from './announce';
import { pickVoice } from './coach';

const tabata = WORKOUT_ROUTINES.find((r) => r.id === TABATA_ROUTINE_ID)!;
const phases = buildPhases(tabata);
const say = (i: number) => phaseAnnouncement(phases, i, tabata.rounds);

describe('phaseAnnouncement', () => {
  it('prep: get ready + the first exercise, no beep', () => {
    expect(say(0)).toEqual({ beep: null, text: 'Get ready. First: Speed sprint.' });
  });

  it('work: exercise name + one short cue, with the start beep', () => {
    expect(say(1)).toEqual({ beep: 'start', text: 'Speed sprint. Shoulders down, fast wrists.' });
  });

  it('rest: rest + what is next', () => {
    expect(say(2)).toEqual({ beep: 'rest', text: 'Rest. Next: Hollow rock.' });
  });

  it('round rest and the first work of the next round name the round', () => {
    const rr = phases.findIndex((p) => p.kind === 'roundRest');
    expect(say(rr)).toEqual({ beep: 'rest', text: 'Round 1 done. Rest. Next: Speed sprint.' });
    expect(say(rr + 1).text).toBe('Round 2 of 2. Speed sprint. Shoulders down, fast wrists.');
  });

  it('finish', () => {
    expect(say(phases.length)).toEqual({ beep: 'finish', text: 'Workout done. Well done.' });
  });

  it('every phase has words, short enough to finish within its phase (≈ 2.6 words/s)', () => {
    phases.forEach((p, i) => {
      const words = say(i).text.split(/\s+/).length;
      expect(words, say(i).text).toBeGreaterThan(1);
      expect(words / 2.6, say(i).text).toBeLessThan(p.seconds);
    });
  });
});

describe('pickVoice', () => {
  const v = (lang: string, name = 'x', localService = false, def = false) => ({ lang, name, localService, default: def });
  it('prefers local US English, then UK, ignores other languages', () => {
    expect(pickVoice([v('pt-BR', 'Google pt', true, true), v('en-GB', 'UK'), v('en-US', 'Google US English', true)])).toBe(2);
    expect(pickVoice([v('pt-BR'), v('en_GB', 'UK')])).toBe(1);
    expect(pickVoice([v('pt-BR'), v('fr-FR')])).toBe(-1);
  });
});
