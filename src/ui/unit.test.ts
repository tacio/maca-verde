import { describe, expect, it } from 'vitest';
import { formatUnit, toUnit, unitAt } from './unit';

describe('unit ratings', () => {
  it('maps a tap position to 0–1 with 2 decimals', () => {
    expect(unitAt(16, 16, 380)).toBe(0);
    expect(unitAt(396, 16, 380)).toBe(1);
    expect(unitAt(16 + 0.733 * 380, 16, 380)).toBe(0.73);
    expect(unitAt(0, 16, 380)).toBe(0); // left of the strip
    expect(unitAt(500, 16, 380)).toBe(1); // right of it
    expect(unitAt(10, 10, 0)).toBe(0);
  });

  it('clamps and rounds', () => {
    expect(toUnit(-0.2)).toBe(0);
    expect(toUnit(1.3)).toBe(1);
    expect(toUnit(0.805)).toBe(0.81);
  });

  it('formats like a daykeep fraction', () => {
    expect(formatUnit(0.73)).toBe('.73');
    expect(formatUnit(0.05)).toBe('.05');
    expect(formatUnit(0)).toBe('.00');
    expect(formatUnit(1)).toBe('1.00');
    expect(formatUnit(0.999)).toBe('1.00');
  });
});
