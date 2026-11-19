#!/usr/bin/env node
// Screenshots of every dev scenario (docs/design/03-tooling.md §3–4).
//
//   npm run shots                       all scenarios, light + dark, 412×915
//   npm run shots -- fresh today-mid    only these scenarios
//   npm run shots -- --desktop          also a 1280×860 pass
//
// Output: shots/<scenario>-<theme>[-desktop].png and shots/contact-sheet.png
// (or contact-sheet-1.png, -2.png… when there are many). Read the contact
// sheet, not single shots. Reuses a running dev server (SHOTS_URL, :5174,
// :5173) or starts one on :5174.

import { chromium } from '@playwright/test';
import { mkdirSync, readdirSync, rmSync, writeFileSync } from 'node:fs';
import { join } from 'node:path';
import { fileURLToPath } from 'node:url';

const root = join(fileURLToPath(new URL('.', import.meta.url)), '..');
const outDir = join(root, 'shots');

const MOBILE = { width: 412, height: 915 };
const DESKTOP = { width: 1280, height: 860 };
const THEMES = ['light', 'dark'];

// Contact sheet: a grid of COLS × ROWS units, long side ≤ 1568 px.
// Mobile tiles take 1 unit; desktop tiles span 2 columns.
const SHEET = { cols: 6, rows: 2, tileW: 250, gap: 8, label: 18 };
const TILE_IMG_H = Math.round((SHEET.tileW * MOBILE.height) / MOBILE.width);

const args = process.argv.slice(2);
const desktop = args.includes('--desktop');
const wanted = args.filter((a) => !a.startsWith('--'));

async function reachable(base) {
  try {
    const res = await fetch(new URL('/src/dev/scenarios.ts', base), { signal: AbortSignal.timeout(1500) });
    return res.ok && (await res.text()).includes('SCENARIOS');
  } catch {
    return false;
  }
}

async function devServer() {
  for (const base of [process.env.SHOTS_URL, 'http://localhost:5174', 'http://localhost:5173'].filter(Boolean)) {
    if (await reachable(base)) return { base, close: async () => {} };
  }
  const { createServer } = await import('vite');
  const server = await createServer({ root, logLevel: 'error', server: { port: 5174, host: 'localhost' } });
  await server.listen();
  const base = server.resolvedUrls.local[0];
  return { base, close: () => server.close() };
}

async function main() {
  const { base, close } = await devServer();
  const origin = new URL(base).origin;
  const browser = await chromium.launch();
  try {
    // Discover scenarios from the app itself.
    const probe = await browser.newPage();
    await probe.goto(base);
    const all = await probe.evaluate(() =>
      import('/src/dev/scenarios.ts').then((m) =>
        Object.fromEntries(Object.entries(m.SCENARIOS).map(([k, s]) => [k, { screen: s.screen ?? null }])),
      ),
    );
    await probe.close();

    const unknown = wanted.filter((n) => !(n in all));
    if (unknown.length) {
      console.error(`shots: unknown scenario(s) ${unknown.join(', ')}. Known: ${Object.keys(all).join(', ')}`);
      process.exitCode = 1;
      return;
    }
    const names = wanted.length ? wanted : Object.keys(all);

    mkdirSync(outDir, { recursive: true });
    for (const f of readdirSync(outDir)) if (f.startsWith('contact-sheet')) rmSync(join(outDir, f));

    const passes = [{ viewport: MOBILE, suffix: '' }];
    if (desktop) passes.push({ viewport: DESKTOP, suffix: '-desktop' });

    const shots = [];
    for (const { viewport, suffix } of passes) {
      for (const theme of THEMES) {
        const context = await browser.newContext({ viewport, colorScheme: theme, deviceScaleFactor: 1, reducedMotion: 'reduce' });
        await context.route(
          (url) => url.origin !== origin && /^https?:$/.test(url.protocol),
          (route) => route.abort(),
        );
        for (const name of names) {
          const page = await context.newPage();
          const errors = [];
          page.on('pageerror', (e) => errors.push(`pageerror: ${e.message}`));
          page.on('console', (m) => {
            if (m.type() === 'error' && !/net::ERR_FAILED/.test(m.text())) errors.push(`console: ${m.text()}`);
          });
          const q = new URLSearchParams({ scenario: name });
          if (all[name].screen) q.set('screen', all[name].screen);
          await page.goto(`${base.replace(/\/$/, '')}/?${q}`);
          await page.waitForFunction(() => (document.getElementById('root')?.childElementCount ?? 0) > 0);
          await page.evaluate(() => document.fonts.ready.then(() => undefined));
          await page.waitForTimeout(300);
          const file = `${name}-${theme}${suffix}.png`;
          const buffer = await page.screenshot({ path: join(outDir, file), fullPage: true });
          const fullHeight = await page.evaluate(() => document.documentElement.scrollHeight);
          shots.push({ file, buffer, wide: viewport === DESKTOP, cropped: fullHeight > viewport.height + 1, fullHeight });
          const status = errors.length ? `${errors.length} error(s)` : 'ok';
          console.log(`${file}: ${status}`);
          for (const e of errors) console.log(`  ${e}`);
          await page.close();
        }
        await context.close();
      }
    }

    // Light/dark of the same scenario sit next to each other.
    const order = (s) => s.file.replace(/-(light|dark)/, '') + (s.file.includes('-dark') ? '1' : '0');
    shots.sort((a, b) => Number(a.wide) - Number(b.wide) || order(a).localeCompare(order(b)));

    const sheets = [[]];
    let used = 0;
    const capacity = SHEET.cols * SHEET.rows;
    for (const s of shots) {
      const units = s.wide ? 2 : 1;
      if (used + units > capacity) {
        sheets.push([]);
        used = 0;
      }
      sheets.at(-1).push(s);
      used += units;
    }

    const page = await browser.newPage({ viewport: { width: 1600, height: 1600 }, deviceScaleFactor: 1 });
    for (const [i, sheet] of sheets.entries()) {
      const tiles = sheet
        .map((s) => {
          const label = s.file.replace(/\.png$/, '') + (s.cropped ? ` · cropped (${s.fullHeight}px)` : '');
          return `<figure class="${s.wide ? 'wide' : ''}"><figcaption>${label}</figcaption>
            <img src="data:image/png;base64,${s.buffer.toString('base64')}"></figure>`;
        })
        .join('');
      await page.setContent(`<!doctype html><style>
        body { margin: 0; background: #888; font: 600 12px/1 system-ui, sans-serif; }
        #grid { display: inline-grid; gap: ${SHEET.gap}px; padding: ${SHEET.gap}px;
          grid-template-columns: repeat(${SHEET.cols}, ${SHEET.tileW}px); grid-auto-rows: ${SHEET.label + TILE_IMG_H}px; }
        figure { margin: 0; background: #fff; overflow: hidden; }
        figure.wide { grid-column: span 2; background: transparent; }
        figcaption { height: ${SHEET.label}px; line-height: ${SHEET.label}px; padding: 0 4px; color: #000; background: #ffd;
          white-space: nowrap; overflow: hidden; text-overflow: ellipsis; }
        img { display: block; width: 100%; height: ${TILE_IMG_H}px; object-fit: cover; object-position: top; }
        figure.wide img { height: auto; max-height: ${TILE_IMG_H}px; }
      </style><div id="grid">${tiles}</div>`);
      await page.evaluate(() => Promise.all([...document.images].map((img) => img.decode())));
      const name = sheets.length === 1 ? 'contact-sheet.png' : `contact-sheet-${i + 1}.png`;
      writeFileSync(join(outDir, name), await page.locator('#grid').screenshot());
      console.log(`shots/${name}: ${sheet.length} tile(s)`);
    }
    await page.close();
  } finally {
    await browser.close();
    await close();
  }
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
