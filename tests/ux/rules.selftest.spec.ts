/**
 * Self-tests: each rule fails on a violating fixture and passes on a good one.
 * The app has no new screens yet, so these fixtures prove the checks work.
 */
import { test, expect, type Page } from '@playwright/test';
import { checkDom, only, type RuleName } from './helpers/rules';
import { runAxe } from './helpers/app';
import { installSpeechSpy, spoken, beeps } from './helpers/speech-spy';

test.use({ viewport: { width: 412, height: 915 } });

const BASE = `<style>
  body { margin: 0; font: 16px/24px sans-serif; color: #111; background: #fff; }
  button, a { display: inline-block; min-width: 48px; min-height: 48px; }
</style>`;

async function violations(page: Page, html: string, rule: RuleName) {
  await page.setContent(`<!doctype html><html lang="en"><head><title>t</title>${BASE}</head><body>${html}</body></html>`);
  return only(await checkDom(page), rule);
}

const screen = (inner: string) => `<main data-screen="fixture"><h1>Today</h1>${inner}</main>`;
const PRIMARY = '<button data-primary>Start</button>';

const CASES: { rule: RuleName; bad: string; good: string }[] = [
  {
    rule: 'primary',
    bad: screen('<button data-primary>Start</button><button data-primary>Log</button>'),
    good: screen(PRIMARY + '<button>Log</button>'),
  },
  {
    rule: 'nav',
    bad: '<nav data-nav>' + 'abcde'.split('').map((c) => `<a href="#${c}">${c}</a>`).join('') + '</nav>',
    good: '<nav data-nav>' + 'abcd'.split('').map((c) => `<a href="#${c}">${c}</a>`).join('') + '</nav>',
  },
  {
    rule: 'target-size',
    bad: screen(PRIMARY + '<button style="min-height:0;height:32px">Small</button>'),
    good: screen(PRIMARY + '<label style="display:block;height:48px"><input type="checkbox"> Done</label>'),
  },
  {
    rule: 'hud-controls',
    bad: screen(
      '<button data-primary data-hud-control style="height:72px">Pause</button><button data-hud-control style="height:72px">Stop</button>',
    ),
    good: screen('<button data-primary data-hud-control style="height:72px;width:100%">Pause</button>'),
  },
  {
    rule: 'no-skip',
    bad: '<main data-screen="workout"><button data-primary>Pause</button><button>Skip</button></main>',
    good: '<main data-screen="workout"><button data-primary>Pause</button><button>End workout</button></main>',
  },
  {
    rule: 'hud-digits',
    bad: screen(PRIMARY + '<div data-hud-digits style="font-size:120px;line-height:1">0:30</div>'),
    good: screen(PRIMARY + '<div data-hud-digits style="font-size:240px;line-height:1">0:30</div>'),
  },
  {
    rule: 'streak',
    bad: screen(PRIMARY + '<div data-stats><span data-streak>12 days</span><span data-reserves>2 protection</span></div>'),
    good: screen(
      PRIMARY +
        '<div data-stats><span data-streak>12 days</span> <span data-average>72 of 100</span></div>',
    ),
  },
  {
    rule: 'last-hint',
    bad: screen(
      PRIMARY +
        '<div data-target><label for="a">Rope turns</label><input id="a" data-target-input value="350"></div>' +
        '<label for="b">Rounds</label><input id="b" data-target-input value="3">',
    ),
    good: screen(
      PRIMARY +
        '<div data-target><label for="a">Rope turns</label><input id="a" data-target-input value="350">' +
        '<p data-last-hint>last 320 · suggested 345</p></div>',
    ),
  },
  {
    rule: 'justify-copy',
    bad: '<main data-screen="justify"><h1>Day 358</h1><p>You missed your plan.</p><button data-primary>Save</button></main>',
    good:
      '<main data-screen="justify"><h1>Day 358 wasn\'t completed</h1><p>What got in the way?</p>' +
      '<button data-primary>Save</button><button data-adjust-link>Adjust next days</button></main>',
  },
  {
    rule: 'text-lines',
    bad: screen(PRIMARY + `<p>${'Long explanation about the science of intervals. '.repeat(4)}</p>`),
    good: screen(
      PRIMARY +
        '<p>Tabata · 12 rounds</p>' +
        `<details data-disclosure open><summary>Why?</summary><p>${'Long explanation. '.repeat(20)}</p></details>` +
        `<p data-allow-long>${'Legal text. '.repeat(30)}</p>`,
    ),
  },
];

for (const { rule, bad, good } of CASES) {
  test(`rule ${rule}: flags the bad fixture`, async ({ page }) => {
    expect((await violations(page, bad, rule)).length).toBeGreaterThan(0);
  });
  test(`rule ${rule}: passes the good fixture`, async ({ page }) => {
    expect(await violations(page, good, rule)).toEqual([]);
  });
}

test('rule justify-copy: each half is checked on its own', async ({ page }) => {
  const noLink = '<main data-screen="justify"><h1>Day 358</h1><button data-primary>Save</button></main>';
  expect((await violations(page, noLink, 'justify-copy')).map((v) => v.message)).toEqual([
    'screen "justify": no [data-adjust-link] to adjust the next days',
  ]);
  const blame = '<main data-screen="justify"><p>You didn\'t finish.</p><button data-primary>Save</button><a href="#" data-adjust-link>Adjust</a></main>';
  expect((await violations(page, blame, 'justify-copy')).map((v) => v.message)).toEqual(['screen "justify": blames the person ("You didn\'t")']);
});

test('rule primary: a self-advancing timed step shows no primary', async ({ page }) => {
  const step = (inner: string) => `<main data-screen="drill" data-autoadvance><h1>Freeze</h1><p role="timer">20</p>${inner}</main>`;
  expect(await violations(page, step(''), 'primary')).toEqual([]);
  expect((await violations(page, step('<button data-primary disabled>Next in 20 s</button>'), 'primary')).length).toBeGreaterThan(0);
  const notTimed = '<main data-screen="today" data-autoadvance><h1>Today</h1></main>';
  expect((await violations(page, notTimed, 'primary')).length).toBeGreaterThan(0);
});

test('rules ignore markup outside [data-screen]', async ({ page }) => {
  await page.setContent(`<div><button style="height:20px">x</button><button data-primary>a</button><button data-primary>b</button>
    <p>${'Long unscoped paragraph. '.repeat(40)}</p></div>`);
  expect(await checkDom(page)).toEqual([]);
});

test.describe('axe', () => {
  const doc = (body: string) =>
    `<!doctype html><html lang="en"><head><title>t</title>${BASE}</head><body>${body}</body></html>`;

  test('flags low contrast inside [data-screen]', async ({ page }) => {
    await page.setContent(doc(screen(PRIMARY + '<p style="color:#bbb">Faint text</p>')));
    const v = await runAxe(page);
    expect(v?.some((s) => s.includes('color-contrast'))).toBe(true);
  });
  test('passes a clean screen', async ({ page }) => {
    await page.setContent(doc(screen(PRIMARY + '<p>Readable text</p>')));
    expect(await runAxe(page)).toEqual([]);
  });
  test('skips pages without [data-screen]', async ({ page }) => {
    await page.setContent(doc('<p style="color:#eee">legacy</p>'));
    expect(await runAxe(page)).toBeNull();
  });
});

test('speech spy records speak() and oscillator beeps', async ({ page }) => {
  await installSpeechSpy(page);
  await page.goto('about:blank');
  await page.evaluate(async () => {
    const u = new SpeechSynthesisUtterance('Work');
    const ended = new Promise((r) => (u.onend = r));
    speechSynthesis.speak(u);
    await ended;
    const ctx = new AudioContext();
    const osc = ctx.createOscillator();
    osc.frequency.value = 880;
    osc.start();
    osc.stop();
  });
  expect(await spoken(page)).toEqual(['Work']);
  expect((await beeps(page)).map((b) => b.frequency)).toEqual([880]);
});
