/**
 * Dev-only scenario fixtures (docs/design/03-tooling.md §4).
 *
 *   http://localhost:5173/?scenario=fresh
 *   http://localhost:5173/?scenario=today-mid&now=14359.4
 *
 * A scenario replaces the app's storage with a known state and, optionally,
 * moves the clock to a daykeep stamp (`now`, read with the scenario's day
 * config). Loaded only when import.meta.env.DEV (see src/main.tsx).
 *
 * Scenarios are added alongside the screens that need them; every new screen
 * or state gets one, and scripts/shots.mjs captures all registered scenarios.
 */

import { DEFAULT_CONFIG, parseStamp, toUnix, type DayConfig } from '../time/daykeep';
import { setNow } from '../time/clock';
import { FIXTURE_SCENARIOS, buildScenarioFixture } from './fixtures';
import { toStorageEntries } from '../storage/store';

export interface Scenario {
  description: string;
  /** Day config used to read `now`; the seeded settings should match it. */
  config?: DayConfig;
  /** Default moment, as a full daykeep stamp, when the URL gives none. */
  now?: string;
  /** Storage contents: key → JSON-serializable value. Everything else is cleared. */
  storage: Record<string, unknown>;
  /** Screen to open, passed as `&screen=<value>` by scripts/shots.mjs and tests/ux. */
  screen?: string;
}

export const SCENARIOS: Record<string, Scenario> = {
  fresh: {
    description: 'First use: empty storage, onboarding',
    storage: {},
  },
  'onboard-day': {
    description: 'Onboarding step 1: day 0 and day length, live preview',
    now: '14355.4000',
    storage: {},
    screen: 'onboard-day',
  },
  'onboard-anchor': {
    description: 'Onboarding step 2: the anchor ("After I ___, I train.")',
    now: '14355.4000',
    storage: {},
    screen: 'onboard-anchor',
  },
  'onboard-plan': {
    description: 'Onboarding step 3: first plan, days 14356–14359 pre-filled',
    now: '14355.4000',
    storage: {},
    screen: 'onboard-plan',
  },
  'ui-gallery': {
    description: 'Every UI primitive in its states (src/dev/Gallery.tsx)',
    storage: {},
    screen: 'gallery',
  },
  ...fixtureScenarios(),
};

/** Data-state scenarios built from src/dev/fixtures.ts (storage exactly as store.ts writes it). */
function fixtureScenarios(): Record<string, Scenario> {
  const out: Record<string, Scenario> = {};
  for (const [name, s] of Object.entries(FIXTURE_SCENARIOS)) {
    const f = buildScenarioFixture(s);
    out[name] = {
      description: s.description,
      config: f.config,
      now: f.stamp,
      storage: toStorageEntries(f.data),
      ...(s.screen ? { screen: s.screen } : {}),
    };
  }
  return out;
}

export function applyScenarioFromUrl(url: URL = new URL(window.location.href)): string | null {
  const name = url.searchParams.get('scenario');
  const nowParam = url.searchParams.get('now');
  if (!name) {
    if (nowParam) moveClock(nowParam, DEFAULT_CONFIG);
    return null;
  }
  const scenario = SCENARIOS[name];
  if (!scenario) {
    console.warn(`[scenario] unknown "${name}". Known: ${Object.keys(SCENARIOS).join(', ')}`);
    return null;
  }
  localStorage.clear();
  for (const [key, value] of Object.entries(scenario.storage)) {
    localStorage.setItem(key, JSON.stringify(value));
  }
  const stamp = nowParam ?? scenario.now;
  if (stamp) moveClock(stamp, scenario.config ?? DEFAULT_CONFIG);
  console.info(`[scenario] ${name}: ${scenario.description}${stamp ? ` @ ${stamp}` : ''}`);
  return name;
}

function moveClock(stamp: string, cfg: DayConfig): void {
  const s = parseStamp(stamp, cfg);
  if (s === null) {
    console.warn(`[scenario] unreadable now="${stamp}" (expected a full stamp such as 14359.4)`);
    return;
  }
  setNow(toUnix(s, cfg));
}
