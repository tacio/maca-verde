/**
 * Hooks for the timed flows (workout HUD, rest practice, pause drill).
 */

import { useEffect, useState } from 'react';
import { nowMs } from '../time/clock';

/** Frame-ish refresh for countdowns: often enough that a second never shows late. */
export const TIMER_TICK_MS = 200;

/**
 * nowMs(), refreshed every `intervalMs` while `active` and whenever the page
 * becomes visible again (timers are throttled in the background; the time
 * itself is always read from the clock, so nothing drifts).
 */
export function useClockMs(active: boolean, intervalMs = TIMER_TICK_MS): number {
  const [now, setNow] = useState(nowMs);
  useEffect(() => {
    if (!active) return;
    const tick = () => setNow(nowMs());
    tick();
    const id = window.setInterval(tick, intervalMs);
    const onVisible = () => {
      if (document.visibilityState === 'visible') tick();
    };
    document.addEventListener('visibilitychange', onVisible);
    return () => {
      window.clearInterval(id);
      document.removeEventListener('visibilitychange', onVisible);
    };
  }, [active, intervalMs]);
  return now;
}
