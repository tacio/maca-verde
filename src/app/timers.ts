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

interface WakeLockLike {
  release: () => Promise<void>;
}

/**
 * Keep the screen on while `active` (Screen Wake Lock API, where available).
 * The browser drops the lock when the page is hidden, so it's re-requested
 * on return; released on exit.
 */
export function useWakeLock(active: boolean): void {
  useEffect(() => {
    const wl = (navigator as Navigator & { wakeLock?: { request: (t: 'screen') => Promise<WakeLockLike> } }).wakeLock;
    if (!active || !wl) return;
    let lock: WakeLockLike | null = null;
    let gone = false;
    const acquire = () => {
      if (document.visibilityState !== 'visible') return;
      wl.request('screen')
        .then((l) => {
          if (gone) void l.release().catch(() => undefined);
          else lock = l;
        })
        .catch(() => undefined);
    };
    acquire();
    document.addEventListener('visibilitychange', acquire);
    return () => {
      gone = true;
      document.removeEventListener('visibilitychange', acquire);
      if (lock) void lock.release().catch(() => undefined);
    };
  }, [active]);
}
