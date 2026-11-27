/**
 * Screen Wake Lock spy for UX tests (P15: hands-free screens keep the screen on).
 *
 *   await installWakeLockSpy(page);   // before page.goto
 *   expect(await wakeLocksHeld(page)).toBe(1);
 *
 * navigator.wakeLock.request('screen') is replaced: it resolves with a fake
 * sentinel and window.__wakeLocks counts the locks requested and not released.
 */
import type { Page } from '@playwright/test';

declare global {
  interface Window {
    __wakeLocks: number;
  }
}

function spy() {
  window.__wakeLocks = 0;
  const request = async () => {
    window.__wakeLocks++;
    let released = false;
    return {
      type: 'screen',
      get released() {
        return released;
      },
      release: async () => {
        if (!released) window.__wakeLocks--;
        released = true;
      },
    };
  };
  Object.defineProperty(navigator, 'wakeLock', { value: { request }, configurable: true });
}

export async function installWakeLockSpy(page: Page): Promise<void> {
  await page.addInitScript(spy);
}

export function wakeLocksHeld(page: Page): Promise<number> {
  return page.evaluate(() => window.__wakeLocks ?? 0);
}
