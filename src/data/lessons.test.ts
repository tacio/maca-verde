import { describe, expect, it } from 'vitest';
import { CURRICULUM, LESSONS } from './lessons';
import { EXERCISES } from './exercises';
import { ROUTINE_EXERCISES } from '../domain/curriculum';
import { exerciseCue } from '../workout/exerciseCues';

/** P14 checks on the content (docs/design/04-curriculum.md). */
describe('curriculum content (P14)', () => {
  it('teaches every lesson exactly once, in a fixed order', () => {
    expect(new Set(CURRICULUM).size).toBe(CURRICULUM.length);
    expect([...CURRICULUM].sort()).toEqual(Object.keys(LESSONS).sort());
  });

  it('puts every part before the combinations that use it', () => {
    CURRICULUM.forEach((id, i) => {
      for (const part of LESSONS[id].parts) expect(CURRICULUM.indexOf(part), `${part} before ${id}`).toBeGreaterThanOrEqual(0);
      for (const part of LESSONS[id].parts) expect(CURRICULUM.indexOf(part), `${part} before ${id}`).toBeLessThan(i);
    });
  });

  it('reaches every exercise of the built-in routines', () => {
    for (const id of ROUTINE_EXERCISES) expect(CURRICULUM, id).toContain(id);
  });

  it('teaches only real exercises, each with a spoken cue', () => {
    for (const id of CURRICULUM) {
      expect(EXERCISES[id], id).toBeDefined();
      expect(exerciseCue(id), id).not.toBe('');
      expect(LESSONS[id].exerciseId).toBe(id);
    }
  });

  it('has short steps, each with at least one picture angle, ending with a try', () => {
    for (const id of CURRICULUM) {
      const steps = LESSONS[id].steps;
      expect(steps.length, id).toBeGreaterThanOrEqual(3);
      for (const s of steps) {
        expect(s.views.length, `${id}: ${s.text}`).toBeGreaterThan(0);
        // ≤ 2 lines on a 412 px screen (P10); the lesson screen rule checks the rendering.
        expect(s.text.length, `${id}: ${s.text}`).toBeLessThanOrEqual(90);
      }
      expect(steps[steps.length - 1].text, id).toMatch(/^Try\b|\bTry\b/);
    }
  });
});
