/**
 * Hands-free screens (P15): the user looks at the phone without holding it
 * (it rests on the floor or a shelf while they move or breathe), so the
 * screen must stay on. Declaring a screen hands-free is the only way to get
 * a wake lock: `FullScreen handsFree` or, for a custom root, `useHandsFree`
 * spread on the `data-screen` element. The attribute lets the UX checks see
 * the declaration (tests/ux/helpers/rules.ts) and that the lock is held.
 */
import { useEffect } from 'react';

interface WakeLockLike {
  release: () => Promise<void>;
}

/**
 * Keeps the screen on while `active` (Screen Wake Lock API, where available)
 * and returns the attributes that mark the screen root as hands-free.
 * The browser drops the lock when the page is hidden, so it's re-requested
 * on return; released on exit.
 */
export function useHandsFree(active: boolean): { 'data-hands-free'?: '' } {
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
  return active ? { 'data-hands-free': '' } : {};
}
