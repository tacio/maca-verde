import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { nowUnix, resetClock } from '../time/clock';
import { DEFAULT_CONFIG, formatStamp, fromUnix } from '../time/daykeep';
import { SCENARIOS, applyScenarioFromUrl } from './scenarios';

function memoryStorage() {
  const map = new Map<string, string>();
  return {
    getItem: (k: string) => map.get(k) ?? null,
    setItem: (k: string, v: string) => void map.set(k, v),
    removeItem: (k: string) => void map.delete(k),
    clear: () => map.clear(),
    get length() {
      return map.size;
    },
    key: (i: number) => [...map.keys()][i] ?? null,
  };
}

describe('scenarios', () => {
  beforeEach(() => {
    vi.stubGlobal('localStorage', memoryStorage());
    vi.spyOn(console, 'info').mockImplementation(() => {});
    vi.spyOn(console, 'warn').mockImplementation(() => {});
  });
  afterEach(() => {
    vi.unstubAllGlobals();
    vi.restoreAllMocks();
    resetClock();
  });

  it('clears storage and seeds the scenario', () => {
    localStorage.setItem('stale', '1');
    SCENARIOS.__test = { description: 'test', storage: { a: { b: 1 } } };
    expect(applyScenarioFromUrl(new URL('http://x/?scenario=__test'))).toBe('__test');
    expect(localStorage.getItem('stale')).toBeNull();
    expect(JSON.parse(localStorage.getItem('a')!)).toEqual({ b: 1 });
    delete SCENARIOS.__test;
  });

  it('moves the clock to the requested stamp', () => {
    applyScenarioFromUrl(new URL('http://x/?scenario=fresh&now=14359.4000'));
    expect(formatStamp(fromUnix(nowUnix(), DEFAULT_CONFIG), DEFAULT_CONFIG)).toBe('14359.4000');
  });

  it('ignores unknown scenarios without touching storage', () => {
    localStorage.setItem('keep', '1');
    expect(applyScenarioFromUrl(new URL('http://x/?scenario=nope'))).toBeNull();
    expect(localStorage.getItem('keep')).toBe('1');
  });
});
