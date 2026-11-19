/**
 * Every registered scenario × light/dark at 412×915 (Pixel 8): DOM rules
 * (helpers/rules.ts) + axe on [data-screen]. Scenarios without a
 * [data-screen] (e.g. the UI gallery) are reported as skipped.
 */
import { test, expect } from '@playwright/test';
import { SCENARIOS } from '../../src/dev/scenarios';
import { checkDom } from './helpers/rules';
import { PIXEL_8, THEMES, blockExternal, runAxe, scenarioUrl, settle } from './helpers/app';

for (const theme of THEMES) {
  test.describe(theme, () => {
    test.use({ colorScheme: theme, viewport: PIXEL_8 });

    for (const [name, scenario] of Object.entries(SCENARIOS)) {
      test(name, async ({ page, context, baseURL }) => {
        const errors: string[] = [];
        page.on('pageerror', (e) => errors.push(`pageerror: ${e.message}`));
        await blockExternal(context, new URL(baseURL!).origin);
        await page.goto(scenarioUrl(name, scenario.screen));
        await settle(page);

        expect(errors, 'uncaught page errors').toEqual([]);
        const dom = (await checkDom(page)).map((v) => `${v.rule}: ${v.message}`);
        const axe = await runAxe(page);
        expect([...dom, ...(axe ?? [])], 'UX rule violations').toEqual([]);
        test.skip(axe === null, 'no [data-screen] on this scenario; axe skipped');
      });
    }
  });
}
