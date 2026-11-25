import { describe, expect, it } from 'vitest';
import { DEFAULT_CONFIG } from '../time/daykeep';
import { POSTURE_ROUTINE_ID, ROPE_ROUTINE_ID, TABATA_ROUTINE_ID } from '../domain/engine';
import type { PlanItem, WorkoutSession } from '../domain/types';
import {
  draftFromItems,
  draftToItems,
  hintText,
  lastValue,
  metricsFor,
  minutesHint,
  newRest,
  parseDurationInput,
  parseTarget,
  suggestedValue,
  type DayDraft,
} from './dayDraft';

const cfg = DEFAULT_CONFIG;

describe('parseDurationInput', () => {
  it('reads whole seconds, with or without "s"', () => {
    expect(parseDurationInput('900', cfg)).toBe(900);
    expect(parseDurationInput(' 900 s ', cfg)).toBe(900);
    expect(parseDurationInput('45s', cfg)).toBe(45);
  });

  it('rejects zero, a day or more, decimals and junk', () => {
    for (const s of ['', '0', '86400', '.0104', '1.2', '-5', 'abc', '15m', '15h']) expect(parseDurationInput(s, cfg)).toBeNull();
  });

  it('shows minutes next to a duration in seconds', () => {
    expect(minutesHint(900)).toBe('≈ 15 min');
    expect(minutesHint(30)).toBe('≈ 30 s');
  });
});

describe('targets', () => {
  it('parses whole numbers ≥ 1 and durations for total time', () => {
    expect(parseTarget('rounds', '3', cfg)).toBe(3);
    expect(parseTarget('rounds', '0', cfg)).toBeNull();
    expect(parseTarget('ropeTurns', '3.5', cfg)).toBeNull();
    expect(parseTarget('hangSeconds', '', cfg)).toBeNull();
    expect(parseTarget('totalSeconds', '720', cfg)).toBe(720);
    expect(parseTarget('totalSeconds', '.0083', cfg)).toBeNull();
  });

  it('offers the metrics a routine has', () => {
    expect(metricsFor(TABATA_ROUTINE_ID)).toEqual(['rounds', 'hangSeconds', 'ropeTurns', 'totalSeconds']);
    expect(metricsFor(POSTURE_ROUTINE_ID)).toEqual(['rounds', 'hangSeconds', 'ropeTurns', 'totalSeconds']);
    expect(metricsFor('emom-rope-door-bar-hybrid')).toContain('ropeTurns');
    expect(metricsFor('unknown')).toEqual(['rounds', 'totalSeconds']);
  });

  it('suggests from the engine and shows the last actual (P3)', () => {
    const s = (over: Partial<WorkoutSession>): WorkoutSession => ({
      id: 'x',
      routineId: ROPE_ROUTINE_ID,
      startUnix: 0,
      endUnix: 100,
      completedFull: true,
      totalSeconds: 600,
      roundsCompleted: 3,
      totalRounds: 3,
      rpe: 0.7,
      neck: 0.1,
      estimatedCalories: 100,
      ...over,
    });
    const history = [s({ hangSeconds: 38, ropeTurns: 320 }), s({ id: 'y', routineId: POSTURE_ROUTINE_ID, endUnix: 200, hangSeconds: 41 })];
    expect(suggestedValue('hangSeconds', POSTURE_ROUTINE_ID, history)).toBe(43);
    expect(suggestedValue('rounds', TABATA_ROUTINE_ID, history)).toBe(2);
    expect(lastValue('hangSeconds', ROPE_ROUTINE_ID, history)).toBe(41); // across routines
    expect(lastValue('rounds', POSTURE_ROUTINE_ID, history)).toBe(3);
    expect(lastValue('rounds', TABATA_ROUTINE_ID, history)).toBeNull();
    expect(hintText(null, '25 s')).toBe('no data yet · suggested 25 s');
    expect(hintText('320', '350')).toBe('last 320 · suggested 350');
  });
});

describe('draft ⇄ items', () => {
  const items: PlanItem[] = [
    { id: '14362-0', kind: 'workout', routineId: ROPE_ROUTINE_ID, targets: { ropeTurns: 350, rounds: 3 } },
    { id: '14362-1', kind: 'rest', restKind: 'silence', durationSeconds: 900 },
    { id: '14362-2', kind: 'mood', count: 2 },
    { id: '14362-3', kind: 'drill', count: 1 },
  ];

  it('round-trips a plan', () => {
    const draft = draftFromItems(items, cfg);
    expect(draft.mood).toBe(2);
    expect(draft.main[0]).toMatchObject({ kind: 'workout', targets: [{ metric: 'rounds', text: '3' }, { metric: 'ropeTurns', text: '350' }] });
    expect(draft.main[1]).toMatchObject({ kind: 'rest', text: '900' });
    expect(draftToItems(draft, 14362, cfg)).toEqual({ ok: true, items });
  });

  it('round-trips the day’s lesson, first in the plan', () => {
    const withLesson: PlanItem[] = [{ id: '14362-0', kind: 'learn', skillId: 'squat' }, ...items.map((i, n) => ({ ...i, id: `14362-${n + 1}` }))];
    const draft = draftFromItems(withLesson, cfg);
    expect(draft.learn).toBe('squat');
    expect(draftToItems(draft, 14362, cfg)).toEqual({ ok: true, items: withLesson });
  });

  it('keeps exact values while a field is untouched, and parses edits', () => {
    const draft = draftFromItems(items, cfg);
    const rest = draft.main[1];
    if (rest.kind !== 'rest') throw new Error('rest expected');
    rest.text = '907 s';
    const r = draftToItems(draft, 14362, cfg);
    expect(r.ok && r.items[1]).toMatchObject({ durationSeconds: 907 });
  });

  it('drops counted items at 0 and renumbers ids', () => {
    const draft: DayDraft = { main: [newRest(cfg, 'meditation', 600)], mood: 0, drill: 0 };
    expect(draftToItems(draft, 14370, cfg)).toEqual({
      ok: true,
      items: [{ id: '14370-0', kind: 'rest', restKind: 'meditation', durationSeconds: 600 }],
    });
  });

  it('refuses an empty day and unreadable fields', () => {
    expect(draftToItems({ main: [], mood: 0, drill: 0 }, 1, cfg)).toEqual({ ok: false, problems: ['empty'] });
    const bad: DayDraft = {
      main: [
        { key: 'a', kind: 'workout', routineId: TABATA_ROUTINE_ID, targets: [{ metric: 'rounds', text: '' }] },
        { key: 'b', kind: 'rest', restKind: 'silence', text: '.0104' },
      ],
      mood: 1,
      drill: 0,
    };
    expect(draftToItems(bad, 1, cfg)).toEqual({ ok: false, problems: ['bad_target', 'bad_duration'] });
  });
});
