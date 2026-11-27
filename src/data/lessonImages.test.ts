import { describe, expect, it } from 'vitest';
import { LESSONS } from './lessons';
import { LESSON_IMAGES, stepImage } from './lessonImages';

describe('lesson pictures (P14)', () => {
  it('ships only pictures of a listed step and angle', () => {
    for (const name of Object.keys(LESSON_IMAGES)) {
      const m = /^(.+)-(\d+)-(side|front|top|diagonal)$/.exec(name);
      expect(m, name).not.toBeNull();
      const [, id, step, view] = m!;
      const s = LESSONS[id]?.steps[Number(step) - 1];
      expect(s, `${name}: no such lesson step`).toBeDefined();
      expect(s.views, `${name}: angle not listed for this step`).toContain(view);
    }
  });

  it('draws every angle of a lesson once any of its steps is drawn', () => {
    const drawn = new Set(Object.keys(LESSON_IMAGES).map((n) => n.replace(/-\d+-\w+$/, '')));
    for (const id of drawn)
      LESSONS[id].steps.forEach((s, i) => {
        for (const v of s.views) expect(stepImage(id, i, v), `${id} step ${i + 1} ${v}`).toBeDefined();
      });
  });
});
