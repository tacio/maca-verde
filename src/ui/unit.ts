/**
 * Ratings on the unit interval (0.00–1.00), as the tap scale records them.
 * Two decimals: finer than anyone can repeat their own rating, coarse enough
 * not to pretend otherwise.
 */

/** Round to 2 decimals and clamp to 0–1. */
export function toUnit(v: number): number {
  return Math.min(1, Math.max(0, Math.round(v * 100) / 100));
}

/** The value at horizontal position `x` on a strip spanning `left`…`left + width`. */
export function unitAt(x: number, left: number, width: number): number {
  return width > 0 ? toUnit((x - left) / width) : 0;
}

/** Decimal-fraction style, like daykeep's `.0625`: `.73`, `.05`, `.00`, `1.00`. */
export function formatUnit(v: number): string {
  const u = toUnit(v);
  return u >= 1 ? '1.00' : `.${String(Math.round(u * 100)).padStart(2, '0')}`;
}
