/**
 * Speech and beep spy for UX tests (P12: every phase change is spoken).
 *
 *   await installSpeechSpy(page);   // before page.goto
 *   ...drive the app...
 *   expect(await spoken(page)).toContain('Rest');
 *
 * speechSynthesis.speak() is replaced: the utterance text is recorded in
 * window.__spoken and its start/end events fire on the next tick, so code that
 * waits for `onend` keeps going. Each OscillatorNode.start() is recorded in
 * window.__beeps as { frequency, type, at } (audio still plays normally).
 */
import type { Page } from '@playwright/test';

export interface Beep {
  frequency: number;
  type: string;
  at: number;
}

declare global {
  interface Window {
    __spoken: string[];
    __beeps: Beep[];
  }
}

function spy() {
  window.__spoken = [];
  window.__beeps = [];
  if ('speechSynthesis' in window) {
    window.speechSynthesis.speak = (u: SpeechSynthesisUtterance) => {
      window.__spoken.push(u.text);
      setTimeout(() => {
        u.dispatchEvent(new Event('start'));
        u.dispatchEvent(new Event('end'));
      }, 0);
    };
  }
  if ('OscillatorNode' in window) {
    const start = OscillatorNode.prototype.start;
    OscillatorNode.prototype.start = function (this: OscillatorNode, when?: number) {
      window.__beeps.push({ frequency: this.frequency.value, type: this.type, at: performance.now() });
      return start.call(this, when);
    };
  }
}

export async function installSpeechSpy(page: Page): Promise<void> {
  await page.addInitScript(spy);
}

export function spoken(page: Page): Promise<string[]> {
  return page.evaluate(() => window.__spoken ?? []);
}

export function beeps(page: Page): Promise<Beep[]> {
  return page.evaluate(() => window.__beeps ?? []);
}
