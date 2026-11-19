/** Shared setup for UX tests against the running app (scenarios × themes). */
import type { BrowserContext, Page } from '@playwright/test';
import { AxeBuilder } from '@axe-core/playwright';
import { AXE_TAGS } from './rules';

export const PIXEL_8 = { width: 412, height: 915 };
export const THEMES = ['light', 'dark'] as const;
export type Theme = (typeof THEMES)[number];

/** URL for a scenario; `screen` comes from the scenario's optional `screen` field. */
export function scenarioUrl(name: string, screen?: string, now?: string): string {
  const q = new URLSearchParams({ scenario: name });
  if (now) q.set('now', now);
  if (screen) q.set('screen', screen);
  return `/?${q}`;
}

/** Keep tests offline and deterministic: only same-origin requests go through. */
export async function blockExternal(context: BrowserContext, origin: string): Promise<void> {
  await context.route(
    (url) => url.origin !== origin && /^https?:$/.test(url.protocol),
    (route) => route.abort(),
  );
}

/** Wait until React has rendered and fonts are ready. */
export async function settle(page: Page): Promise<void> {
  await page.waitForFunction(() => (document.getElementById('root')?.childElementCount ?? 0) > 0);
  await page.evaluate(() => document.fonts.ready.then(() => undefined));
  await page.waitForTimeout(150);
}

/** axe over new UI only. Returns null when the page has no [data-screen] (skipped). */
export async function runAxe(page: Page): Promise<string[] | null> {
  if ((await page.locator('[data-screen]').count()) === 0) return null;
  const result = await new AxeBuilder({ page })
    .include('[data-screen]')
    .withTags(AXE_TAGS)
    .options({ rules: { 'color-contrast': { enabled: true }, 'target-size': { enabled: true } } })
    .analyze();
  return result.violations.map(
    (v) => `axe ${v.id} (${v.impact}): ${v.help} — ${v.nodes.map((n) => n.target.join(' ')).slice(0, 3).join(', ')}`,
  );
}
