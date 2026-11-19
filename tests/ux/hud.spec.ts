/**
 * Workout HUD (P12): every phase change is spoken exactly once, and work vs
 * rest differ by full-screen color. Time is driven with Playwright's clock;
 * the HUD derives its countdown from timestamps, so jumping the clock is a
 * faithful stand-in for waiting.
 */
import { test, expect, type Page } from '@playwright/test';
import { SCENARIOS } from '../../src/dev/scenarios';
import { PIXEL_8, blockExternal, scenarioUrl, settle } from './helpers/app';
import { beeps, installSpeechSpy, spoken } from './helpers/speech-spy';

test.use({ viewport: PIXEL_8, colorScheme: 'light' });

const screen = (page: Page) => page.locator('[data-screen="workout"]');
const digits = async (page: Page) => Number(await page.locator('[data-hud-digits]').innerText());
const background = (page: Page) => screen(page).evaluate((el) => getComputedStyle(el).backgroundColor);

/** Run the clock to just past the end of the current phase (+ time for the cue's beep and words). */
async function finishPhase(page: Page) {
  await page.clock.runFor((await digits(page)) * 1000 + 1200);
}

test('each phase change is announced once; work and rest differ by color', async ({ page, context, baseURL }) => {
  await blockExternal(context, new URL(baseURL!).origin);
  await installSpeechSpy(page);
  await page.clock.install();
  await page.goto(scenarioUrl('hud-work', SCENARIOS['hud-work'].screen));
  await settle(page);
  await page.clock.runFor(1000);

  await expect(screen(page)).toHaveAttribute('data-phase', 'work');
  const opening = await spoken(page);
  expect(opening, 'the opening phase is announced once').toHaveLength(1);
  const workBg = await background(page);

  // work → rest
  await finishPhase(page);
  await expect(screen(page)).toHaveAttribute('data-phase', 'rest');
  const afterRest = await spoken(page);
  expect(afterRest).toHaveLength(2);
  expect(afterRest[1]).toMatch(/^Rest\. Next: /);
  const restBg = await background(page);
  expect(restBg, 'work and rest backgrounds differ').not.toBe(workBg);

  // rest → work
  await finishPhase(page);
  await expect(screen(page)).toHaveAttribute('data-phase', 'work');
  const afterWork = await spoken(page);
  expect(afterWork).toHaveLength(3);
  expect(afterWork[2]).not.toBe(afterWork[0]);
  expect(await background(page)).toBe(workBg);

  // 3-2-1 are beeps, never words; ticks never overlap speech (one sound at a time).
  expect((await beeps(page)).length).toBeGreaterThan(0);
});

test('Pause is the only HUD control: it opens the sheet and silences the coach', async ({ page, context, baseURL }) => {
  await blockExternal(context, new URL(baseURL!).origin);
  await installSpeechSpy(page);
  await page.clock.install();
  await page.goto(scenarioUrl('hud-work', SCENARIOS['hud-work'].screen));
  await settle(page);
  await page.clock.runFor(1000);
  const before = (await spoken(page)).length;

  await expect(page.locator('[data-hud-control]')).toHaveCount(1);
  await expect(page.getByRole('button', { name: /skip/i })).toHaveCount(0);

  await page.getByRole('button', { name: 'Pause' }).click();
  const sheet = page.getByRole('dialog', { name: 'Paused' });
  await expect(sheet).toBeVisible();
  await expect(sheet.getByRole('button', { name: /skip/i })).toHaveCount(0);
  const shown = await digits(page);
  await page.clock.runFor(30_000);
  expect(await digits(page), 'paused time stands still').toBe(shown);
  expect((await spoken(page)).length).toBe(before);
});
