#!/usr/bin/env node
// Generate golden test vectors for src/time/daykeep.ts from the real daykeep
// binary. Every call passes --epoch and --day-length explicitly and runs with
// a cleared config, so the personal ~/.config/daykeep/config is never read.
//
//   node scripts/daykeep-vectors.mjs            # uses `daykeep` from PATH
//   DAYKEEP_BIN=/path/to/daykeep node scripts/daykeep-vectors.mjs
//
// Output: src/time/__fixtures__/vectors.json (committed; CI doesn't need the binary).

import { execFileSync } from 'node:child_process';
import { mkdtempSync, mkdirSync, writeFileSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join, dirname } from 'node:path';
import { fileURLToPath } from 'node:url';

const BIN = process.env.DAYKEEP_BIN || 'daykeep';
const root = join(dirname(fileURLToPath(import.meta.url)), '..');
const out = join(root, 'src/time/__fixtures__/vectors.json');

const env = {
  PATH: process.env.PATH,
  TZ: 'UTC',
  HOME: mkdtempSync(join(tmpdir(), 'dk-home-')), // empty home: no personal config
  XDG_CONFIG_HOME: mkdtempSync(join(tmpdir(), 'dk-xdg-')),
};

function dk(cfg, ...args) {
  try {
    return execFileSync(BIN, [`--epoch=${cfg.epoch}`, `--day-length=${cfg.dayLength}`, ...args], {
      env,
      encoding: 'utf8',
    })
      .trim()
      .split('\n');
  } catch (e) {
    return null; // invalid input
  }
}

const configs = [
  { epoch: '2000-01-01 00:00Z', dayLength: 86400 }, // daykeep default
  { epoch: '2000-01-01 03:00 -0300', dayLength: 86400 }, // 03:00 UTC-3 boundary
  { epoch: '2010-06-15 12:34:56 +0530', dayLength: 90000 }, // 25 h day
  { epoch: '2000-01-01 00:00Z', dayLength: 20000 }, // 2 s ticks: exact half-tick ties
  { epoch: '1999-12-31 23:59:59Z', dayLength: 7 }, // tiny day
];

// Instants as ISO dates with explicit offsets (all forms dk_parse_date accepts).
const dates = [
  '2000-01-01 00:00Z',
  '2000-01-01 00:00:01Z',
  '1999-12-31 23:59:59Z',
  '1999-12-31 03:00Z',
  '1990-05-05 05:05:05Z',
  '2000-01-01 03:00 -0300',
  '2000-01-01 06:00:00Z',
  '2000-01-01T06:00:04Z',
  '2000-01-01T06:00:05Z',
  '2026-11-19 11:10:00 -0300',
  '2026-11-19 11:10:00-03:00',
  '2026-11-20 02:59:59 -0300',
  '2026-11-20 03:00:00 -0300',
  '2026-11-20 03:00:01 -0300',
  '2024-02-29 12:00 +0000',
  '2038-01-19 03:14:08Z',
  '2026-07-01T00:00:00+14:00',
];
// Half-tick probes for the 20000 s day (tick = 2 s): odd seconds are exact ties.
for (let s = 0; s <= 9; s++) dates.push(`2000-01-02 00:00:0${s}Z`);

const literals = ['00000.0000', '09761.4564', '14359.3404', '00007.0000', '00000.00005', '12.5', '00001.9999', '00001.99999'];
const ranges = [
  ['09761.0000', '09761.0625'],
  ['09761.1000', '09761.3000'],
  ['09761.0000', '09763.2500'],
  ['09761.0000', '09761.0104'],
  ['09761.0000', '09761.00004'],
  ['09761.0000', '09761.00006'],
  ['09761.0000', '09761.9999'],
  ['09761.0000', '09771.0000'],
];

const vectors = configs.map((cfg) => {
  const toStamp = dates.map((date) => ({ date, stamp: dk(cfg, '--convert', date)?.[0] ?? null }));
  // daykeep completes stamps with fewer day digits than today's day number
  // relative to "now"; keep only stamps it reads literally so vectors stay
  // independent of the day they were generated.
  const todayDigits = dk(cfg, '--now')[0].split('.')[0].replace(/^-?0*/, '').length;
  const literal = (s) => !s.startsWith('-') && s.split('.')[0].length >= todayDigits;
  const candidates = [...literals, ...toStamp.map((v) => v.stamp).filter(Boolean)].filter(literal);
  const toDate = [...new Set(candidates)].map((stamp) => ({ stamp, date: dk(cfg, '-u', '--convert', stamp)?.[0] ?? null }));
  const durations = ranges.map(([a, b]) => {
    const range = `${a} - ${b}`;
    return {
      range,
      decimal: dk(cfg, '-s', range)?.[0] ?? null,
      hm: dk(cfg, '-s', '--format=hm', range)?.[0] ?? null,
      minutes: dk(cfg, '-s', '--format=minutes', range)?.[0] ?? null,
    };
  });
  return { config: cfg, toStamp, toDate, durations };
});

const version = execFileSync(BIN, ['--version'], { env, encoding: 'utf8' }).split('\n')[0];
mkdirSync(dirname(out), { recursive: true });
writeFileSync(out, JSON.stringify({ generatedBy: version, vectors }, null, 2) + '\n');
console.log(`wrote ${out} (${version})`);
