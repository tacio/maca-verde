/**
 * Visual regression (03-tooling: "later" item): every scenario × light/dark at
 * 412×915 (viewport, not full page) against committed baselines in
 * tests/ux/__screenshots__/<scenario>-<theme>.png.
 *
 * Deterministic by construction: the scenario's `now` places the app clock,
 * and Playwright's clock is paused before the page loads, so countdowns,
 * "time left" and celebration moments are frozen; CSS animations are disabled.
 *
 * Update after an intended UI change:  npx playwright test visual --update-snapshots
 *
 * Skipped in CI: baselines are rendered with this machine's system fonts
 * (tokens use system-ui), which the CI runner doesn't have.
 */
import { test, expect } from '@playwright/test';
import { SCENARIOS } from '../../src/dev/scenarios';
import { PIXEL_8, THEMES, blockExternal, scenarioUrl } from './helpers/app';

/** Any fixed instant: the app's own clock is the scenario's `now`, an offset from this. */
const FROZEN = new Date('2026-01-01T12:00:00Z');

test.skip(!!process.env.CI, 'baselines depend on local system fonts');

for (const theme of THEMES) {
  test.describe(`visual ${theme}`, () => {
    test.use({ colorScheme: theme, viewport: PIXEL_8 });

    for (const [name, scenario] of Object.entries(SCENARIOS)) {
      test(name, async ({ page, context, baseURL }) => {
        await blockExternal(context, new URL(baseURL!).origin);
        await page.clock.install({ time: FROZEN });
        await page.clock.pauseAt(FROZEN);
        await page.goto(scenarioUrl(name, scenario.screen));
        // Not settle(): its waitForFunction polls on rAF, which the paused clock stops.
        // Locator waits run in Playwright's own world, outside the fake clock. A fixed
        // 500 ms of fake time lets React's Suspense throttle (lazy Gallery) commit;
        // it stays under the moments' 1.6 s, so they're captured.
        await page.clock.runFor(500);
        const root = page.locator('#root > *');
        // A lazy chunk (the Gallery) may still be loading: nudge fake time until it commits.
        for (let i = 0; i < 50 && (await root.count()) === 0; i++) {
          await page.waitForTimeout(50);
          await page.clock.runFor(100);
        }
        await root.first().waitFor();
        await page.evaluate(() => document.fonts.ready.then(() => undefined));
        await expect(page).toHaveScreenshot(`${name}-${theme}.png`, {
          animations: 'disabled',
          caret: 'hide',
          maxDiffPixelRatio: 0.002,
        });
      });
    }
  });
}
