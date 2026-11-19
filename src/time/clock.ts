/**
 * The app's only source of "now". Every time read in app code goes through
 * nowUnix(), so dev scenarios and tests can place the app at any moment.
 *
 * The override is an offset, not a frozen instant: time keeps flowing from
 * the chosen moment, so timers (workout HUD, rest timer) still work.
 */

let offsetSeconds = 0;

/** Current Unix time in whole seconds. */
export function nowUnix(): number {
  return Math.floor(Date.now() / 1000) + offsetSeconds;
}

/**
 * Current time in milliseconds on the same (possibly moved) clock, for
 * timers that need sub-second precision (workout HUD, rest timer, drill).
 * Wall-clock based, so a timer derived from it survives tab backgrounding
 * and device sleep.
 */
export function nowMs(): number {
  return Date.now() + offsetSeconds * 1000;
}

/** Make nowUnix() return `unixSeconds` right now and keep ticking from there. */
export function setNow(unixSeconds: number): void {
  offsetSeconds = Math.floor(unixSeconds) - Math.floor(Date.now() / 1000);
}

/** Back to the real clock. */
export function resetClock(): void {
  offsetSeconds = 0;
}
