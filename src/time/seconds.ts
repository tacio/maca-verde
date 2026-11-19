/**
 * Durations of a single activity (a workout, a rest practice, a target's
 * total time) are always shown and entered in whole seconds: "720 s".
 * Decimal days stay for day-level time only (time of day, time left in the
 * day, day/cycle boundaries, totals across sessions). Decision of day 14355.
 */

/** "720 s" */
export function formatSeconds(seconds: number): string {
  return `${Math.round(seconds)} s`;
}

/**
 * A single-activity duration as typed: whole seconds, optionally followed by
 * "s" ("900", "900 s"). Above zero and under `max` seconds. Returns seconds or null.
 */
export function parseSeconds(text: string, max = Infinity): number | null {
  const m = /^(\d{1,9})\s*(?:s|sec|secs|seconds?)?$/i.exec(text.trim());
  if (!m) return null;
  const n = Number(m[1]);
  return n > 0 && n < max ? n : null;
}
