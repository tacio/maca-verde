import { describe, expect, it } from 'vitest';
import { DEFAULT_CONFIG } from '../time/daykeep';
import { buildFixture } from '../dev/fixtures';
import {
  BACKUP_FORMAT,
  BACKUP_VERSION,
  KEYS,
  clearData,
  defaultSettings,
  discardLegacyData,
  emptyData,
  exportBackup,
  importBackup,
  loadData,
  memoryStorage,
  saveData,
  saveSlice,
  toStorageEntries,
} from './store';

const sample = () => {
  const f = buildFixture({ history: '.DDMmP', today: 14355, approveNext: true });
  f.data.routines.push({
    id: 'custom-1',
    title: 'Mine',
    subtitle: '',
    protocol: 'circuit',
    description: '',
    primaryGoal: 'hybrid',
    exercises: [{ exerciseId: 'door-bar-dead-hang', workSeconds: 30, restSeconds: 15 }],
    rounds: 2,
    roundRestSeconds: 30,
    prepSeconds: 10,
    estimatedCalories: 50,
    estimatedDurationMinutes: 4,
  });
  f.data.settings.drive.lastBackupUnix = 123;
  return f.data;
};

describe('store', () => {
  it('defaults use daykeep DEFAULT_CONFIG', () => {
    expect(defaultSettings().config).toEqual(DEFAULT_CONFIG);
    expect(loadData(memoryStorage())).toEqual(emptyData());
  });

  it('round-trips the whole AppData under mv2: keys', () => {
    const st = memoryStorage();
    const data = sample();
    saveData(data, st);
    expect(Object.values(KEYS).every((k) => k.startsWith('mv2:') && st.getItem(k) !== null)).toBe(true);
    expect(loadData(st)).toEqual(data);
    // toStorageEntries matches what saveData writes
    for (const [k, v] of Object.entries(toStorageEntries(data))) expect(st.getItem(k)).toBe(JSON.stringify(v));
  });

  it('corrupted JSON falls back to the slice default, others survive', () => {
    const st = memoryStorage();
    const data = sample();
    saveData(data, st);
    st.setItem(KEYS.sessions, '{not json');
    st.setItem(KEYS.settings, '"a string"');
    st.setItem(KEYS.template, '[1,2]');
    const loaded = loadData(st);
    expect(loaded.sessions).toEqual([]);
    expect(loaded.settings).toEqual(defaultSettings());
    expect(loaded.template).toEqual(emptyData().template);
    expect(loaded.plans).toEqual(data.plans);
  });

  it('drops malformed entries and fields', () => {
    const st = memoryStorage();
    saveSlice('moods', sample().moods, st);
    const moods = JSON.parse(st.getItem(KEYS.moods)!);
    st.setItem(KEYS.moods, JSON.stringify([...moods, { id: 'x', unix: 'soon' }, null, 5]));
    st.setItem(KEYS.settings, JSON.stringify({ anchor: 'After coffee', sound: 'yes', config: { epoch: 0, dayLength: 0 } }));
    const loaded = loadData(st);
    expect(loaded.moods).toEqual(moods);
    expect(loaded.settings).toEqual({ ...defaultSettings(), anchor: 'After coffee' });
  });

  it('discardLegacyData removes only maca_verde_*_v1 keys', () => {
    const st = memoryStorage({
      maca_verde_profile_v1: '{}',
      maca_verde_workout_logs_v1: '[]',
      maca_verde_mood_logs_v1: '[]',
      'mv2:settings': '{}',
      other: '1',
    });
    expect(discardLegacyData(st).sort()).toEqual(['maca_verde_mood_logs_v1', 'maca_verde_profile_v1', 'maca_verde_workout_logs_v1']);
    expect(st.length).toBe(2);
    clearData(st);
    expect(st.getItem('other')).toBe('1');
    expect(st.length).toBe(1);
  });

  it('backup export/import round-trips', () => {
    const data = sample();
    const json = exportBackup(data, 999);
    expect(JSON.parse(json)).toMatchObject({ format: BACKUP_FORMAT, version: BACKUP_VERSION, exportedUnix: 999 });
    expect(importBackup(json)).toEqual({ ok: true, data, exportedUnix: 999 });
    expect(importBackup(exportBackup(data))).toEqual({ ok: true, data });
  });

  it('round-trips lessons and learn items; a backup from before lessons imports with none', () => {
    const f = buildFixture({ history: '.DDP', today: 14355, curriculum: true });
    expect(f.data.lessons.length).toBeGreaterThan(0);
    expect(f.data.plans.some((p) => p.items.some((i) => i.kind === 'learn'))).toBe(true);
    expect(importBackup(exportBackup(f.data))).toEqual({ ok: true, data: f.data });
    const file = JSON.parse(exportBackup(f.data));
    const { lessons: _l, ...old } = file.data;
    const r = importBackup(JSON.stringify({ ...file, data: old }));
    expect(r.ok && r.data.lessons).toEqual([]);
    const mem = memoryStorage();
    saveData(f.data, mem);
    expect(loadData(mem)).toEqual(f.data);
  });

  it('backup import validates strictly', () => {
    const file = JSON.parse(exportBackup(sample()));
    const imp = (f: unknown) => importBackup(JSON.stringify(f));
    expect(importBackup('nope')).toEqual({ ok: false, error: 'not_json' });
    expect(imp({ ...file, format: 'other' })).toEqual({ ok: false, error: 'not_a_backup' });
    expect(imp({ ...file, version: 1 })).toEqual({ ok: false, error: 'unsupported_version' });
    expect(imp({ ...file, data: [] })).toEqual({ ok: false, error: 'invalid:data' });
    expect(imp({ ...file, data: { ...file.data, sessions: [{ id: 1 }] } })).toEqual({ ok: false, error: 'invalid:sessions' });
    const { plans: _p, ...noPlans } = file.data;
    expect(imp({ ...file, data: noPlans })).toEqual({ ok: false, error: 'invalid:plans' });
    expect(imp({ ...file, data: { ...file.data, settings: { ...file.data.settings, config: { epoch: 1, dayLength: -5 } } } })).toEqual({
      ok: false,
      error: 'invalid:settings.config',
    });
    expect(imp({ ...file, data: { ...file.data, justifications: [{ day: 1, reason: 'lazy', text: '', unix: 1 }] } })).toEqual({
      ok: false,
      error: 'invalid:justifications',
    });
  });
});
