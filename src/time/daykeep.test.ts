import { describe, expect, it } from 'vitest';
import golden from './__fixtures__/vectors.json';
import {
  DEFAULT_CONFIG,
  cycleOf,
  dayOf,
  dayStart,
  formatDuration,
  formatHm,
  formatMinutes,
  formatStamp,
  formatTimeOfDay,
  fromUnix,
  parseDate,
  parseDuration,
  parseStamp,
  remainingInDay,
  shortDay,
  toUnix,
  type DayConfig,
} from './daykeep';

describe.each(golden.vectors)('golden vectors: epoch $config.epoch, day $config.dayLength s', (v) => {
  const epoch = parseDate(v.config.epoch);
  if (epoch === null) throw new Error(`unreadable epoch ${v.config.epoch}`);
  const cfg: DayConfig = { epoch, dayLength: v.config.dayLength };

  it.each(v.toStamp)('date $date → $stamp', ({ date, stamp }) => {
    const unix = parseDate(date);
    expect(unix).not.toBeNull();
    expect(formatStamp(fromUnix(unix!, cfg), cfg)).toBe(stamp);
  });

  it.each(v.toDate)('stamp $stamp → $date', ({ stamp, date }) => {
    const s = parseStamp(stamp, cfg);
    expect(s).not.toBeNull();
    expect(toUnix(s!, cfg)).toBe(parseDate(date!));
  });

  it.each(v.durations)('range $range', ({ range, decimal, hm, minutes }) => {
    const [a, b] = range.split(' - ').map((x) => parseStamp(x, cfg)!);
    expect(formatDuration(b - a, cfg)).toBe(decimal);
    expect(formatHm(b - a)).toBe(hm);
    expect(formatMinutes(b - a)).toBe(minutes);
  });
});

const BRT: DayConfig = { epoch: parseDate('2000-01-01 03:00 -0300')!, dayLength: 86400 };

describe('day boundaries', () => {
  it('starts each day at 03:00 UTC-3 with that epoch', () => {
    const before = fromUnix(parseDate('2026-11-20 02:59:59 -0300')!, BRT);
    const at = fromUnix(parseDate('2026-11-20 03:00:00 -0300')!, BRT);
    expect(dayOf(at, BRT)).toBe(dayOf(before, BRT) + 1);
    expect(dayStart(dayOf(at, BRT), BRT)).toBe(at);
    expect(remainingInDay(before, BRT)).toBe(1);
    expect(remainingInDay(at, BRT)).toBe(86400);
  });

  it('floors negative moments into negative days', () => {
    expect(dayOf(-1, DEFAULT_CONFIG)).toBe(-1);
    expect(formatStamp(-1, DEFAULT_CONFIG)).toBe('00000.0000'); // rounds up into day 0
    expect(formatStamp(-86400 + 10800, DEFAULT_CONFIG)).toBe('-0001.1250');
  });

  it('groups days into 10-day cycles', () => {
    expect(cycleOf(14360)).toBe(1436);
    expect(cycleOf(14369)).toBe(1436);
    expect(cycleOf(14370)).toBe(1437);
  });
});

describe('formatting helpers', () => {
  it('formats the time of day, rolling over at the boundary', () => {
    expect(formatTimeOfDay(0.3404 * 86400, DEFAULT_CONFIG)).toBe('.3404');
    expect(formatTimeOfDay(86399, DEFAULT_CONFIG)).toBe('.0000'); // rounds to next day
  });

  it('shortens day numbers like omitting year or month', () => {
    expect(shortDay(14359, 3)).toBe('359');
    expect(shortDay(14359, 2)).toBe('59');
    expect(shortDay(14305, 2)).toBe('05');
    expect(shortDay(7, 5)).toBe('00007');
    expect(shortDay(14359, 9)).toBe('14359');
  });
});

describe('parsing', () => {
  it('reads durations as decimal days', () => {
    expect(parseDuration('.0625', DEFAULT_CONFIG)).toBe(5400);
    expect(parseDuration('.0104', DEFAULT_CONFIG)).toBe(899); // 898.56 rounds half up
    expect(parseDuration('1.25', DEFAULT_CONFIG)).toBe(108000);
    expect(parseDuration('.5', { epoch: 0, dayLength: 1 })).toBe(1);
  });

  it('rejects invalid input', () => {
    for (const bad of ['', '.', 'abc', '-1.5', '+1', '1.2.3', '1e3']) {
      expect(parseDuration(bad, DEFAULT_CONFIG)).toBeNull();
    }
    expect(parseStamp('.5', DEFAULT_CONFIG)).toBeNull(); // stamps need day digits
    for (const bad of ['2026-02-30', '2026-13-01', '2026-01-01 24:00', '2026-01-01 +2400', '2026-1-1', 'today']) {
      expect(parseDate(bad)).toBeNull();
    }
  });

  it('reads an epoch without offset as UTC', () => {
    expect(parseDate('2000-01-01')).toBe(946684800);
    expect(parseDate('2000-01-01 03:00 -0300')).toBe(946684800 + 6 * 3600);
    expect(parseDate('2000-01-01T03:00-03:00')).toBe(946684800 + 6 * 3600);
  });
});
