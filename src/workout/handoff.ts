/**
 * The HUD hands its result to the log screen through this slot (flows are
 * strings, a result isn't). Mirrored in sessionStorage so a reload on the log
 * screen keeps the session instead of losing a whole workout.
 */

import type { WorkoutResult } from './log';

const KEY = 'mv2:pending-workout';
let pending: WorkoutResult | null = null;

export function setPendingResult(r: WorkoutResult | null): void {
  pending = r;
  try {
    if (r) sessionStorage.setItem(KEY, JSON.stringify(r));
    else sessionStorage.removeItem(KEY);
  } catch {
    // private mode / no storage: memory only
  }
}

/** The pending result for an item, or null. */
export function pendingResult(itemId: string): WorkoutResult | null {
  if (!pending) {
    try {
      const raw = sessionStorage.getItem(KEY);
      if (raw) pending = JSON.parse(raw) as WorkoutResult;
    } catch {
      pending = null;
    }
  }
  return pending && pending.itemId === itemId ? pending : null;
}
