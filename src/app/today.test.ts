import { describe, expect, it } from 'vitest';
import { DEFAULT_CONFIG } from '../time/daykeep';
import { dayStartUnix } from '../domain/plan';
import { computeRecord } from '../domain/record';
import { TABATA_ROUTINE_ID } from '../domain/engine';
import type { MoodCheck } from '../domain/types';
import { buildFixture } from '../dev/fixtures';
import {
  buildJustification,
  buildMoodCheck,
  haltLine,
  itemFlow,
  justifyOutcome,
  leftText,
  primaryText,
  recoveryLine,
  stackText,
  todayPrimary,
} from './today';

const cfg = DEFAULT_CONFIG;
const T = 14355;

function rec(history: string, opts: { today?: number; nowFrac?: number; approveNext?: boolean } = {}) {
  const f = buildFixture({ history, today: opts.today ?? T, nowFrac: opts.nowFrac, approveNext: opts.approveNext });
  return { f, r: computeRecord(f.data, f.now, cfg) };
}
const since = (s: string) => '.' + 'D'.repeat(15 - (s.length - 1)) + s; // setup 14339, ends on 14355

describe('todayPrimary', () => {
  const primary = (history: string, opts?: Parameters<typeof rec>[1]) => {
    const { f, r } = rec(history, opts);
    return todayPrimary(r, f.data.cycles, f.now, cfg);
  };

  it('warm-up and nothing planned', () => {
    expect(primary('.')).toEqual({ kind: 'warmup', start: T + 1 });
  });

  it('a pending justification blocks everything, oldest first', () => {
    expect(primary(since('mmmT'))).toEqual({ kind: 'justify', days: [T - 3, T - 2, T - 1] });
    expect(primary(since('mD'))).toEqual({ kind: 'justify', days: [T - 1] });
  });

  it('then the next undone item, workouts first', () => {
    const p = primary(since('T'));
    expect(p.kind === 'item' && p.progress.item.kind).toBe('workout');
    const mid = primary(since('P'));
    expect(mid.kind === 'item' && mid.progress.item.kind).toBe('mood');
  });

  it('day done: approving a cycle starting within a day becomes primary', () => {
    expect(primary(since('D'))).toEqual({ kind: 'done' });
    // 14359 done, cycle 1436 starts at 14360.0000 (< 1 day away) and isn't approved
    expect(primary('.' + 'D'.repeat(20), { today: 14359 })).toEqual({ kind: 'cycle', cycle: 1436 });
    // 2 days away: not yet primary
    expect(primary('.' + 'D'.repeat(19), { today: 14358 })).toEqual({ kind: 'done' });
    // approved already
    expect(primary('.' + 'D'.repeat(20), { today: 14359, approveNext: true })).toEqual({ kind: 'done' });
  });

  it('opens the right flow per item', () => {
    expect(itemFlow({ id: 'w1', kind: 'workout', routineId: TABATA_ROUTINE_ID, targets: {} })).toBe('workout:w1');
    expect(itemFlow({ id: 'r1', kind: 'rest', restKind: 'silence', durationSeconds: 900 })).toBe('rest:r1');
    expect(itemFlow({ id: 'm', kind: 'mood', count: 2 })).toBe('mood');
    expect(itemFlow({ id: 'd', kind: 'drill', count: 1 })).toBe('drill');
  });

  it('labels the primary with a decimal-day length', () => {
    expect(primaryText({ id: 'w', kind: 'workout', routineId: TABATA_ROUTINE_ID, targets: {} }, cfg)).toMatch(/^Start Tabata · \.\d{4}$/);
    expect(primaryText({ id: 'r', kind: 'rest', restKind: 'silence', durationSeconds: 900 }, cfg)).toBe('Start silence · .0104');
    expect(primaryText({ id: 'm', kind: 'mood', count: 1 }, cfg)).toBe('Check in');
  });
});

describe('recoveryLine', () => {
  it('frames a recovery day, warns after a reserve, and celebrates when done', () => {
    expect(recoveryLine(rec(since('T')).r)).toBeNull();
    expect(recoveryLine(rec(since('MT')).r)).toBe('Recovery day — finish today to get back on track; next miss would break the streak');
    expect(recoveryLine(rec(since('MMT')).r)).toBe('Recovery day — finish today to get back on track');
    expect(recoveryLine(rec(since('MD')).r)).toBe('Back on track');
  });
});

describe('haltLine', () => {
  const check = (unix: number, halt: Partial<MoodCheck['halt']>): MoodCheck => ({
    id: String(unix),
    unix,
    valence: 'neutral',
    halt: { hungry: false, angry: false, lonely: false, tired: false, ...halt },
  });
  const at = (frac: number) => dayStartUnix(T, cfg) + Math.floor(frac * cfg.dayLength);

  it('uses only the latest check of the day', () => {
    expect(haltLine([check(at(0.1), { tired: true })], T, cfg)).toBe('HALT: tired — pause 5 s before replying.');
    expect(haltLine([check(at(0.1), { tired: true }), check(at(0.2), {})], T, cfg)).toBeNull();
    expect(haltLine([check(at(0.3), { tired: true, hungry: true }), check(at(0.2), {})], T, cfg)).toBe(
      'HALT: hungry, tired — pause 5 s before replying.',
    );
  });

  it('ignores other days and no checks', () => {
    expect(haltLine([], T, cfg)).toBeNull();
    expect(haltLine([check(dayStartUnix(T - 1, cfg) + 10, { angry: true })], T, cfg)).toBeNull();
  });
});

describe('buildMoodCheck', () => {
  it('needs a valence', () => {
    expect(buildMoodCheck({ valence: null, halt: [] }, 'x', 1)).toBeNull();
  });

  it('the default path stores only valence and HALT', () => {
    const m = buildMoodCheck({ valence: 'good', halt: ['tired'] }, 'x', 100);
    expect(m).toEqual({ id: 'x', unix: 100, valence: 'good', halt: { hungry: false, angry: false, lonely: false, tired: true } });
    expect(Object.keys(m!)).toEqual(['id', 'unix', 'valence', 'halt']);
  });

  it('keeps touched optional fields and drops empty ones', () => {
    const m = buildMoodCheck({ valence: 'anxious', halt: [], energy: 2, tension: ['jaw'], speakingRating: 4, notes: '  call went well ' }, 'x', 1);
    expect(m).toMatchObject({ energy: 2, tension: ['jaw'], speakingRating: 4, notes: 'call went well' });
    const empty = buildMoodCheck({ valence: 'anxious', halt: [], tension: [], notes: '   ' }, 'x', 1)!;
    expect('tension' in empty || 'notes' in empty).toBe(false);
  });
});

describe('justification', () => {
  it('lists what was left on the day', () => {
    const { r } = rec(since('mT'));
    expect(leftText(r.days.find((d) => d.day === T - 1)!)).toMatch(/^0 of 3 done · \w+, 1 mood check and 1 pause drill left$/);
  });

  it('kept with a reserve, and today is a recovery day', () => {
    const { r } = rec(since('mT'));
    expect(justifyOutcome(T - 1, r)).toEqual({ kind: 'kept', text: 'Streak kept with protection — the day still counts as missed', recoveryToday: true });
  });

  it('reset keeps the average in view and never blames', () => {
    const { r } = rec(since('mmmT'));
    expect(justifyOutcome(T - 3, r)).toMatchObject({ kind: 'kept', recoveryToday: false });
    const o = justifyOutcome(T - 1, r);
    expect(o).toMatchObject({ kind: 'reset', recoveryToday: true });
    expect(o.text).toBe(`Streak reset — 80% of last 15 days stays`);
    expect(o.text).not.toMatch(/\byou\b/i);
  });

  it('needs a reason and a sentence', () => {
    expect(buildJustification(1, null, 'x', 5)).toBeNull();
    expect(buildJustification(1, 'time', '   ', 5)).toBeNull();
    expect(buildJustification(1, 'time', ' Late meeting ', 5)).toEqual({ day: 1, reason: 'time', text: 'Late meeting', unix: 5 });
  });

  it('shows stack progress only for several days', () => {
    expect(stackText(1, 1)).toBeNull();
    expect(stackText(3, 3)).toBe('1 of 3');
    expect(stackText(3, 1)).toBe('3 of 3');
  });
});
