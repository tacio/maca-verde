/**
 * DOM rules for new UI (docs/design/01-principles.md checks; contract in CLAUDE.md).
 *
 * Rules run only on markup that opts in, so the legacy app never trips them:
 *   [data-screen="name"]  root of a new screen; per-screen rules are scoped to it
 *   [data-primary]        the one primary action of a screen (P9)
 *   [data-nav]            bottom navigation, ≤ 4 destinations (P9)
 *   [data-hud-control]    big HUD control: ≥ 72 px tall, ≤ 2 per screen (P12)
 *   [data-hud-digits]     HUD countdown, digit cap height ≥ 160 px (P12)
 *   [data-stats] > [data-streak] + [data-average]  (P6; [data-reserves] optional, never on Today)
 *   [data-disclosure]     text inside is exempt from the 2-line rule (P10)
 *   [data-allow-long]     text inside is exempt from the 2-line rule (P10)
 *   [data-target] > [data-target-input] + [data-last-hint]  numeric target shows the last actual (P3)
 *   [data-screen="justify"]  no second-person blame ("you failed/missed/didn't") and a
 *                            [data-adjust-link] to edit the next days (P8)
 */
import type { Page } from '@playwright/test';

export type RuleName =
  | 'primary'
  | 'nav'
  | 'target-size'
  | 'hud-controls'
  | 'hud-digits'
  | 'streak'
  | 'text-lines'
  | 'last-hint'
  | 'justify-copy';

export interface Violation {
  rule: RuleName;
  message: string;
}

export const LIMITS = {
  target: 48,
  hudControl: 72,
  maxHudControls: 2,
  hudCapHeight: 160,
  maxNav: 4,
  maxLines: 2.2,
  blame: String.raw`\byou (failed|missed|didn'?t)\b`,
} as const;

/** Runs every DOM rule in the page and returns all violations. */
export async function checkDom(page: Page): Promise<Violation[]> {
  return page.evaluate((L) => {
    const out: { rule: string; message: string }[] = [];
    const add = (rule: string, message: string) => out.push({ rule, message });

    const visible = (el: Element) => {
      const r = el.getBoundingClientRect();
      return r.width > 0 && r.height > 0 && el.checkVisibility({ checkOpacity: true, checkVisibilityCSS: true });
    };
    const describe = (el: Element) => {
      const tag = el.tagName.toLowerCase();
      const label = (el.getAttribute('aria-label') || el.textContent || '').trim().replace(/\s+/g, ' ').slice(0, 40);
      return label ? `<${tag}> "${label}"` : `<${tag}>`;
    };
    const px = (n: number) => `${Math.round(n)}px`;

    const screens = [...document.querySelectorAll<HTMLElement>('[data-screen]')].filter(visible);

    for (const screen of screens) {
      const name = `screen "${screen.dataset.screen}"`;

      // P9 — exactly one visible primary action.
      const primaries = [...screen.querySelectorAll('[data-primary]')].filter(visible);
      if (primaries.length !== 1) add('primary', `${name}: ${primaries.length} visible [data-primary], expected 1`);

      // P12 — touch targets.
      const interactive = [
        ...screen.querySelectorAll('button, a[href], input, select, textarea, [role=button], [role=link], [role=tab]'),
      ].filter(visible);
      for (const el of interactive) {
        if (el.closest('[data-hud-control]')) continue;
        let r = el.getBoundingClientRect();
        // A checkbox/radio counts through its <label>.
        const label = el.closest('label');
        if (el instanceof HTMLInputElement && label && /^(checkbox|radio)$/.test(el.type)) r = label.getBoundingClientRect();
        if (r.width < L.target - 0.5 || r.height < L.target - 0.5)
          add('target-size', `${name}: ${describe(el)} is ${px(r.width)}×${px(r.height)}, needs ≥ ${L.target}×${L.target}`);
      }
      const hud = [...screen.querySelectorAll('[data-hud-control]')].filter(visible);
      if (hud.length > L.maxHudControls)
        add('hud-controls', `${name}: ${hud.length} [data-hud-control], max ${L.maxHudControls}`);
      for (const el of hud) {
        const r = el.getBoundingClientRect();
        if (r.height < L.hudControl - 0.5 || r.width < L.target - 0.5)
          add('hud-controls', `${name}: HUD control ${describe(el)} is ${px(r.width)}×${px(r.height)}, needs ≥ ${L.hudControl}px tall`);
      }

      // P10 — text blocks ≤ 2 lines unless disclosed / allowed.
      const walker = document.createTreeWalker(screen, NodeFilter.SHOW_ELEMENT);
      for (let node = walker.currentNode as Element | null; node; node = walker.nextNode() as Element | null) {
        const el = node as HTMLElement;
        if (/^(SCRIPT|STYLE|svg)$/i.test(el.tagName)) continue;
        if (el.closest('[data-disclosure], [data-allow-long]')) continue;
        const texts = [...el.childNodes].filter((n) => n.nodeType === Node.TEXT_NODE && n.textContent!.trim());
        if (!texts.length || !visible(el)) continue;
        const cs = getComputedStyle(el);
        if (cs.display === 'inline' || cs.display === 'contents') continue; // measured by its block container
        const fs = parseFloat(cs.fontSize);
        const lh = cs.lineHeight === 'normal' ? fs * 1.2 : parseFloat(cs.lineHeight);
        // Span from the first to the last direct text node, so block children
        // after the text (e.g. a disclosure) don't count as this block's lines.
        const range = document.createRange();
        range.setStart(texts[0], 0);
        range.setEnd(texts[texts.length - 1], texts[texts.length - 1].textContent!.length);
        const lines = range.getBoundingClientRect().height / lh;
        if (lines > L.maxLines)
          add('text-lines', `${name}: ${describe(el)} renders ${lines.toFixed(1)} lines, max 2 (wrap in [data-disclosure] or mark [data-allow-long])`);
      }
    }

    // P8 — justification asks about the plan, not the person, and offers to adjust the next days.
    for (const screen of screens.filter((s) => s.dataset.screen === 'justify')) {
      const m = screen.innerText.match(new RegExp(L.blame, 'i'));
      if (m) add('justify-copy', `screen "justify": blames the person ("${m[0]}")`);
      if (!screen.querySelector('[data-adjust-link]')) add('justify-copy', 'screen "justify": no [data-adjust-link] to adjust the next days');
    }

    // P9 — bottom nav.
    for (const nav of [...document.querySelectorAll('[data-nav]')].filter(visible)) {
      const dest = [...nav.querySelectorAll('a[href], button, [role=tab], [role=link]')].filter(visible);
      if (dest.length > L.maxNav) add('nav', `[data-nav] has ${dest.length} destinations, max ${L.maxNav}`);
    }

    // P12 — HUD digits: cap height from the glyph box of "0" in the rendered font.
    const ctx = document.createElement('canvas').getContext('2d')!;
    for (const el of [...document.querySelectorAll('[data-hud-digits]')].filter(visible)) {
      const cs = getComputedStyle(el);
      ctx.font = `${cs.fontStyle} ${cs.fontWeight} ${cs.fontSize} ${cs.fontFamily}`;
      const m = ctx.measureText('0');
      const cap = m.actualBoundingBoxAscent + m.actualBoundingBoxDescent || 0.7 * parseFloat(cs.fontSize);
      if (cap < L.hudCapHeight - 0.5)
        add('hud-digits', `[data-hud-digits] cap height ${px(cap)} (font-size ${cs.fontSize}), needs ≥ ${L.hudCapHeight}px`);
    }

    // P6 — streak always with the average in the same [data-stats] (streak protection is optional).
    for (const el of [...document.querySelectorAll('[data-streak]')].filter(visible)) {
      const stats = el.closest('[data-stats]');
      if (!stats) {
        add('streak', `${describe(el)}: [data-streak] outside a [data-stats] container`);
        continue;
      }
      for (const need of ['data-average'])
        if (![...stats.querySelectorAll(`[${need}]`)].some(visible))
          add('streak', `${describe(el)}: [data-stats] has no visible [${need}] next to [data-streak]`);
    }

    // P3 — every numeric target field shows the last actual (or "no data yet") next to it.
    for (const el of [...document.querySelectorAll('[data-target-input]')].filter(visible)) {
      const box = el.closest('[data-target]');
      if (!box) {
        add('last-hint', `${describe(el)}: [data-target-input] outside a [data-target] container`);
        continue;
      }
      if (![...box.querySelectorAll('[data-last-hint]')].some((h) => visible(h) && h.textContent!.trim()))
        add('last-hint', `${describe(el)}: its [data-target] has no visible [data-last-hint]`);
    }

    return out;
  }, LIMITS) as Promise<Violation[]>;
}

export function only(violations: Violation[], rule: RuleName): Violation[] {
  return violations.filter((v) => v.rule === rule);
}

export const AXE_TAGS = ['wcag2a', 'wcag2aa', 'wcag21aa', 'wcag22aa'];
