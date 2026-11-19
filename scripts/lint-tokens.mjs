#!/usr/bin/env node
// P13 token lint: UI code may use only design tokens (src/styles/tokens.css
// via tailwind.config.js). Fails on raw colors (hex, rgb(), hsl()) and on
// Tailwind palette classes (bg-slate-900, text-white, …).
//
// LEGACY lists files from the old UI that are exempt until they are rebuilt.
// Remove a file from the list when its replacement lands; the list only shrinks.

import { readFileSync, readdirSync, statSync } from 'node:fs';
import { join, relative } from 'node:path';
import { fileURLToPath } from 'node:url';

const root = join(fileURLToPath(new URL('.', import.meta.url)), '..');

const LEGACY = new Set([
  'src/App.tsx',
  'src/index.css',
  'src/components/CustomRoutineModal.tsx',
  'src/components/DataBackupView.tsx',
  'src/components/DemoTourModal.tsx',
  'src/components/ExerciseLibraryView.tsx',
  'src/components/MoodAndMindView.tsx',
  'src/components/MoodTrackerModal.tsx',
  'src/components/OnboardingModal.tsx',
  'src/components/ProgressAnalyticsView.tsx',
  'src/components/SettingsView.tsx',
  'src/components/ThinkBeforeSpeakDrill.tsx',
  'src/components/TodayWorkoutView.tsx',
  'src/components/WorkoutCompleteModal.tsx',
  'src/components/WorkoutPlayerHUD.tsx',
]);

// The token definitions themselves, and tests that read them.
const EXEMPT = new Set(['src/styles/tokens.css', 'src/styles/tokens.test.ts']);

const PALETTE =
  'slate|gray|zinc|neutral|stone|red|orange|amber|yellow|lime|green|emerald|teal|cyan|sky|blue|indigo|violet|purple|fuchsia|pink|rose|brand|white|black';
const UTIL =
  'bg|text|border|border-[trblxy]|from|via|to|ring|ring-offset|fill|stroke|shadow|outline|divide|placeholder|accent|caret|decoration';
const RULES = [
  { name: 'palette class', re: new RegExp(`(?<![\\w-])(?:[\\w-]+:)*(?:${UTIL})-(?:${PALETTE})(?:-\\d{2,3})?(?:\\/\\d+)?(?![\\w-])`, 'g') },
  { name: 'raw hex color', re: /#[0-9a-fA-F]{3,8}\b/g },
  { name: 'raw rgb/hsl color', re: /\b(?:rgba?|hsla?)\(/g },
];

function* walk(dir) {
  for (const entry of readdirSync(dir)) {
    const full = join(dir, entry);
    if (statSync(full).isDirectory()) yield* walk(full);
    else if (/\.(tsx?|css)$/.test(entry)) yield full;
  }
}

const problems = [];
for (const file of walk(join(root, 'src'))) {
  const rel = relative(root, file);
  if (LEGACY.has(rel) || EXEMPT.has(rel) || rel.includes('__fixtures__')) continue;
  readFileSync(file, 'utf8')
    .split('\n')
    .forEach((line, i) => {
      if (/^\s*(\/\/|\*|\/\*)/.test(line)) return; // comments
      for (const { name, re } of RULES) {
        for (const m of line.matchAll(re)) problems.push(`${rel}:${i + 1}: ${name} "${m[0]}"`);
      }
    });
}

for (const file of LEGACY) {
  try {
    statSync(join(root, file));
  } catch {
    problems.push(`scripts/lint-tokens.mjs: legacy entry "${file}" no longer exists — remove it from LEGACY`);
  }
}

if (problems.length) {
  console.error(problems.join('\n'));
  console.error(`\nlint-tokens: ${problems.length} problem(s). Use tokens from src/styles/tokens.css.`);
  process.exit(1);
}
console.log(`lint-tokens: ok (${LEGACY.size} legacy file(s) exempt)`);
