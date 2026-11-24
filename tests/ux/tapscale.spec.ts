/**
 * Post-workout log ratings: two tap strips, unset until tapped, so Save
 * waits for both. A tap anywhere sets 0–1 by position; tapping again moves it.
 */
import { test, expect } from '@playwright/test';
import { SCENARIOS } from '../../src/dev/scenarios';
import { PIXEL_8, blockExternal, scenarioUrl, settle } from './helpers/app';

test.use({ viewport: PIXEL_8, colorScheme: 'light' });

test('effort and neck start unset; a tap sets the value by position', async ({ page, context, baseURL }) => {
  await blockExternal(context, new URL(baseURL!).origin);
  await page.goto(scenarioUrl('workout-log', SCENARIOS['workout-log'].screen));
  await settle(page);

  const effort = page.getByRole('slider', { name: 'Effort (RPE)' });
  const neck = page.getByRole('slider', { name: 'Neck tension' });
  const save = page.getByRole('button', { name: 'Save' });

  await expect(effort).not.toHaveAttribute('aria-valuenow');
  await expect(neck).not.toHaveAttribute('aria-valuenow');
  await expect(page.locator('[data-tap-marker]')).toHaveCount(0);
  await expect(save, 'no preselected rating: Save waits for both').toBeDisabled();

  const box = (await effort.boundingBox())!;
  expect(box.height, 'strip is a large target').toBeGreaterThanOrEqual(56);
  await effort.click({ position: { x: box.width * 0.75, y: box.height / 2 } });
  const v = Number(await effort.getAttribute('aria-valuenow'));
  expect(v).toBeGreaterThan(0.72);
  expect(v).toBeLessThan(0.78);
  await expect(save).toBeDisabled();

  await effort.click({ position: { x: box.width * 0.3, y: box.height / 2 } });
  expect(Number(await effort.getAttribute('aria-valuenow')), 'a second tap moves it').toBeLessThan(0.35);

  await neck.click({ position: { x: 2, y: box.height / 2 } });
  expect(Number(await neck.getAttribute('aria-valuenow'))).toBeLessThan(0.02);
  await expect(page.locator('[data-tap-marker]')).toHaveCount(2);
  await expect(save).toBeEnabled();
});
