#!/usr/bin/env node
// Renders public/icon.svg to the PNG sizes the web app manifest and iOS use,
// with Playwright's cached Chromium. Run after changing the icon: npm run icons
import { readFileSync } from 'node:fs';
import { join } from 'node:path';
import { fileURLToPath } from 'node:url';
import { chromium } from '@playwright/test';

const pub = join(fileURLToPath(new URL('.', import.meta.url)), '..', 'public');
const svg = readFileSync(join(pub, 'icon.svg'), 'utf8');
const SIZES = { 'icon-192.png': 192, 'icon-512.png': 512, 'apple-touch-icon.png': 180 };

const browser = await chromium.launch();
const page = await browser.newPage();
for (const [file, size] of Object.entries(SIZES)) {
  await page.setViewportSize({ width: size, height: size });
  await page.setContent(
    `<style>html,body{margin:0}svg{display:block;width:${size}px;height:${size}px}</style>${svg}`,
  );
  await page.screenshot({ path: join(pub, file) });
  console.log(`public/${file}`);
}
await browser.close();
