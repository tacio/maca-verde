import { readFileSync } from 'node:fs';
import { join } from 'node:path';
import { describe, expect, it } from 'vitest';

// P13: text contrast ≥ 4.5:1 in both themes, for every pairing the UI uses.
const css = readFileSync(join(__dirname, 'tokens.css'), 'utf8');

function block(selector: string): Record<string, string> {
  const start = css.indexOf(selector);
  if (start < 0) throw new Error(`missing ${selector}`);
  const body = css.slice(css.indexOf('{', start) + 1, css.indexOf('}', start));
  return Object.fromEntries([...body.matchAll(/--([\w-]+):\s*(#[0-9a-f]{6})/gi)].map((m) => [m[1], m[2]]));
}

const light = block(':root {');
const dark = block(":root[data-theme='dark']");
const systemDark = block(":root:not([data-theme='light'])");

function luminance(hex: string): number {
  const [r, g, b] = [1, 3, 5].map((i) => parseInt(hex.slice(i, i + 2), 16) / 255).map((v) => (v <= 0.03928 ? v / 12.92 : ((v + 0.055) / 1.055) ** 2.4));
  return 0.2126 * r + 0.7152 * g + 0.0722 * b;
}
function contrast(a: string, b: string): number {
  const [x, y] = [luminance(a), luminance(b)].sort((p, q) => q - p);
  return (x + 0.05) / (y + 0.05);
}

/** [foreground, background] pairs the UI is allowed to use. */
const PAIRS: [string, string][] = [
  ['ink', 'canvas'], ['ink', 'surface'], ['ink', 'surface-2'],
  ['ink-muted', 'canvas'], ['ink-muted', 'surface'], ['ink-muted', 'surface-2'],
  ['accent', 'canvas'], ['accent', 'surface'], ['accent', 'accent-soft'],
  ['accent-ink', 'accent'], ['ink', 'accent-soft'],
  ['caution', 'canvas'], ['caution', 'surface'], ['caution', 'caution-soft'],
  ['rest-ink', 'rest'],
];

describe.each([
  ['light', light],
  ['dark', dark],
])('%s theme', (_, theme) => {
  it.each(PAIRS)('%s on %s ≥ 4.5:1', (fg, bg) => {
    expect(theme[fg], fg).toBeDefined();
    expect(theme[bg], bg).toBeDefined();
    expect(contrast(theme[fg], theme[bg])).toBeGreaterThanOrEqual(4.5);
  });
});

it('system dark and forced dark define identical tokens', () => {
  expect(systemDark).toEqual(dark);
});

it('dark overrides every light color token', () => {
  expect(Object.keys(dark).sort()).toEqual(Object.keys(light).sort());
});
