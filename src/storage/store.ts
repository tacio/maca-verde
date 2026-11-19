/**
 * Storage v2 (docs/design/02-workflows.md §7): the whole AppData in
 * localStorage under `mv2:` keys, one JSON value per slice. Starts from
 * scratch — legacy `maca_verde_*_v1` data is discarded, never migrated.
 *
 * Loading is defensive: unreadable JSON gives the slice's default, and
 * malformed entries inside a list are dropped. Backup import is strict: any
 * malformed part rejects the whole file.
 */

import { DEFAULT_CONFIG, isValidDayLength, type DayConfig } from '../time/daykeep';
import { emptyTemplate } from '../domain/plan';
import {
  JUSTIFICATION_REASONS,
  TARGET_METRICS,
  type AppData,
  type CycleApproval,
  type DayPlan,
  type DrillLog,
  type Justification,
  type MoodCheck,
  type PlanItem,
  type RestSession,
  type Settings,
  type Template,
  type WorkoutRoutine,
  type WorkoutSession,
} from '../domain/types';

export const KEY_PREFIX = 'mv2:';

export const KEYS: Record<keyof AppData, string> = {
  settings: 'mv2:settings',
  template: 'mv2:template',
  cycles: 'mv2:cycles',
  plans: 'mv2:plans',
  sessions: 'mv2:sessions',
  rests: 'mv2:rests',
  moods: 'mv2:moods',
  drills: 'mv2:drills',
  justifications: 'mv2:justifications',
  routines: 'mv2:routines',
};

const SLICES = Object.keys(KEYS) as (keyof AppData)[];

export const LEGACY_KEY_PATTERN = /^maca_verde_.*_v1$/;

export const BACKUP_FORMAT = 'maca-verde-backup';
export const BACKUP_VERSION = 2;

/** The subset of the Web Storage API the store uses (localStorage in the app, a Map in tests). */
export interface KVStorage {
  getItem(key: string): string | null;
  setItem(key: string, value: string): void;
  removeItem(key: string): void;
  key(index: number): string | null;
  readonly length: number;
}

function defaultStorage(): KVStorage {
  return globalThis.localStorage;
}

/* --- defaults ----------------------------------------------------------- */

export function defaultSettings(): Settings {
  return {
    config: { ...DEFAULT_CONFIG },
    anchor: '',
    sound: true,
    voice: true,
    drive: { clientId: '', autoBackup: true },
  };
}

export function emptyData(): AppData {
  return {
    settings: defaultSettings(),
    template: emptyTemplate(),
    cycles: [],
    plans: [],
    sessions: [],
    rests: [],
    moods: [],
    drills: [],
    justifications: [],
    routines: [],
  };
}

/* --- guards ------------------------------------------------------------- */

type Obj = Record<string, unknown>;
const isObj = (v: unknown): v is Obj => typeof v === 'object' && v !== null && !Array.isArray(v);
const isNum = (v: unknown): v is number => typeof v === 'number' && Number.isFinite(v);
const isInt = (v: unknown): v is number => isNum(v) && Number.isInteger(v);
const isStr = (v: unknown): v is string => typeof v === 'string';
const isBool = (v: unknown): v is boolean => typeof v === 'boolean';
const optNum = (v: unknown) => v === undefined || isNum(v);
const optStr = (v: unknown) => v === undefined || isStr(v);
const VALENCES = ['great', 'good', 'neutral', 'frustrated', 'exhausted', 'anxious'];
const ONE_TO_FIVE = (v: unknown) => v === undefined || (isInt(v) && v >= 1 && v <= 5);

export function isDayConfig(v: unknown): v is DayConfig {
  return isObj(v) && isInt(v.epoch) && isNum(v.dayLength) && isValidDayLength(v.dayLength);
}

export function isPlanItem(v: unknown): v is PlanItem {
  if (!isObj(v) || !isStr(v.id)) return false;
  switch (v.kind) {
    case 'workout':
      return isStr(v.routineId) && isObj(v.targets) && TARGET_METRICS.every((m) => optNum((v.targets as Obj)[m]));
    case 'rest':
      return isStr(v.restKind) && isNum(v.durationSeconds);
    case 'mood':
    case 'drill':
      return isNum(v.count);
    default:
      return false;
  }
}

export function isDayPlan(v: unknown): v is DayPlan {
  return isObj(v) && isInt(v.day) && isNum(v.updatedUnix) && Array.isArray(v.items) && v.items.every(isPlanItem);
}

export function isCycleApproval(v: unknown): v is CycleApproval {
  return isObj(v) && isInt(v.cycle) && isNum(v.approvedUnix);
}

export function isWorkoutSession(v: unknown): v is WorkoutSession {
  return (
    isObj(v) &&
    isStr(v.id) &&
    isStr(v.routineId) &&
    isNum(v.startUnix) &&
    isNum(v.endUnix) &&
    isBool(v.completedFull) &&
    isNum(v.totalSeconds) &&
    isNum(v.roundsCompleted) &&
    isNum(v.totalRounds) &&
    optNum(v.hangSeconds) &&
    optNum(v.ropeTurns) &&
    isNum(v.rpe) &&
    isNum(v.neck) &&
    isNum(v.estimatedCalories)
  );
}

export function isRestSession(v: unknown): v is RestSession {
  return (
    isObj(v) &&
    isStr(v.id) &&
    isStr(v.restKind) &&
    isNum(v.startUnix) &&
    isNum(v.endUnix) &&
    isNum(v.durationSeconds) &&
    isBool(v.completedFull)
  );
}

export function isMoodCheck(v: unknown): v is MoodCheck {
  if (!isObj(v) || !isStr(v.id) || !isNum(v.unix) || !VALENCES.includes(v.valence as string)) return false;
  const h = v.halt;
  if (!isObj(h) || !isBool(h.hungry) || !isBool(h.angry) || !isBool(h.lonely) || !isBool(h.tired)) return false;
  return (
    ONE_TO_FIVE(v.energy) &&
    ONE_TO_FIVE(v.speakingRating) &&
    (v.tension === undefined || (Array.isArray(v.tension) && v.tension.every(isStr))) &&
    optStr(v.notes)
  );
}

export function isDrillLog(v: unknown): v is DrillLog {
  return (
    isObj(v) &&
    isStr(v.id) &&
    isNum(v.unix) &&
    ['high_hr_pause', 'speech_filter', 'physiological_sigh'].includes(v.drillType as string) &&
    ['elevated_post_hiit', 'resting'].includes(v.heartRateState as string) &&
    isNum(v.pauseSecondsAchieved) &&
    isBool(v.impulseResisted) &&
    optStr(v.scenarioId) &&
    optStr(v.reflection)
  );
}

export function isJustification(v: unknown): v is Justification {
  return (
    isObj(v) &&
    isInt(v.day) &&
    JUSTIFICATION_REASONS.includes(v.reason as Justification['reason']) &&
    isStr(v.text) &&
    isNum(v.unix)
  );
}

export function isRoutine(v: unknown): v is WorkoutRoutine {
  return (
    isObj(v) &&
    isStr(v.id) &&
    isStr(v.title) &&
    isStr(v.protocol) &&
    isNum(v.rounds) &&
    isNum(v.roundRestSeconds) &&
    isNum(v.prepSeconds) &&
    Array.isArray(v.exercises) &&
    v.exercises.every((e) => isObj(e) && isStr(e.exerciseId) && isNum(e.workSeconds) && isNum(e.restSeconds))
  );
}

const LIST_GUARDS = {
  cycles: isCycleApproval,
  plans: isDayPlan,
  sessions: isWorkoutSession,
  rests: isRestSession,
  moods: isMoodCheck,
  drills: isDrillLog,
  justifications: isJustification,
  routines: isRoutine,
} satisfies Partial<Record<keyof AppData, (v: unknown) => boolean>>;

type ListSlice = keyof typeof LIST_GUARDS;

/* --- slice parsing ------------------------------------------------------ */

class Invalid extends Error {}

function parseSettings(v: unknown, strict: boolean): Settings {
  const d = defaultSettings();
  if (!isObj(v)) {
    if (strict) throw new Invalid('settings');
    return d;
  }
  const pick = <T>(val: unknown, ok: (x: unknown) => boolean, def: T, name: string): T => {
    if (val === undefined) return def;
    if (ok(val)) return val as T;
    if (strict) throw new Invalid(`settings.${name}`);
    return def;
  };
  const drive = isObj(v.drive) ? v.drive : {};
  if (strict && v.drive !== undefined && !isObj(v.drive)) throw new Invalid('settings.drive');
  const s: Settings = {
    config: pick(v.config, isDayConfig, d.config, 'config'),
    anchor: pick(v.anchor, isStr, d.anchor, 'anchor'),
    sound: pick(v.sound, isBool, d.sound, 'sound'),
    voice: pick(v.voice, isBool, d.voice, 'voice'),
    drive: {
      clientId: pick(drive.clientId, isStr, d.drive.clientId, 'drive.clientId'),
      autoBackup: pick(drive.autoBackup, isBool, d.drive.autoBackup, 'drive.autoBackup'),
    },
  };
  const last = pick<number | undefined>(drive.lastBackupUnix, isNum, undefined, 'drive.lastBackupUnix');
  if (last !== undefined) s.drive.lastBackupUnix = last;
  const onboarded = pick<number | undefined>(v.onboardedUnix, isNum, undefined, 'onboardedUnix');
  if (onboarded !== undefined) s.onboardedUnix = onboarded;
  const clean = pick<number | undefined>(v.cleanCycleShown, isNum, undefined, 'cleanCycleShown');
  if (clean !== undefined) s.cleanCycleShown = clean;
  return s;
}

function parseTemplate(v: unknown, strict: boolean): Template {
  if (!Array.isArray(v) || v.length !== 10) {
    if (strict) throw new Invalid('template');
    return emptyTemplate();
  }
  return v.map((slot) => {
    if (Array.isArray(slot) && slot.every(isPlanItem)) return slot as PlanItem[];
    if (strict) throw new Invalid('template');
    return [];
  });
}

function parseList<K extends ListSlice>(key: K, v: unknown, strict: boolean): AppData[K] {
  const guard = LIST_GUARDS[key] as (x: unknown) => boolean;
  if (!Array.isArray(v)) {
    if (strict) throw new Invalid(key);
    return [] as AppData[K];
  }
  const ok = v.filter(guard);
  if (strict && ok.length !== v.length) throw new Invalid(key);
  return ok as AppData[K];
}

function parseSlice<K extends keyof AppData>(key: K, v: unknown, strict: boolean): AppData[K] {
  if (key === 'settings') return parseSettings(v, strict) as AppData[K];
  if (key === 'template') return parseTemplate(v, strict) as AppData[K];
  return parseList(key as ListSlice, v, strict) as AppData[K];
}

/* --- load / save -------------------------------------------------------- */

/** Read all slices; missing or unreadable ones fall back to defaults. */
export function loadData(storage: KVStorage = defaultStorage()): AppData {
  const data = emptyData();
  for (const key of SLICES) {
    const raw = storage.getItem(KEYS[key]);
    if (raw === null) continue;
    let parsed: unknown;
    try {
      parsed = JSON.parse(raw);
    } catch {
      continue;
    }
    (data as unknown as Record<string, unknown>)[key] = parseSlice(key, parsed, false);
  }
  return data;
}

/** Storage contents for `data`: key → JSON-serializable value (what saveData writes, before stringify). */
export function toStorageEntries(data: AppData): Record<string, unknown> {
  const out: Record<string, unknown> = {};
  for (const key of SLICES) out[KEYS[key]] = data[key];
  return out;
}

export function saveSlice<K extends keyof AppData>(key: K, value: AppData[K], storage: KVStorage = defaultStorage()): void {
  storage.setItem(KEYS[key], JSON.stringify(value));
}

export function saveData(data: AppData, storage: KVStorage = defaultStorage()): void {
  for (const key of SLICES) saveSlice(key, data[key], storage);
}

/** Remove every `mv2:` key (erase data). */
export function clearData(storage: KVStorage = defaultStorage()): void {
  for (const k of allKeys(storage)) if (k.startsWith(KEY_PREFIX)) storage.removeItem(k);
}

function allKeys(storage: KVStorage): string[] {
  const keys: string[] = [];
  for (let i = 0; i < storage.length; i++) {
    const k = storage.key(i);
    if (k !== null) keys.push(k);
  }
  return keys;
}

/** Delete the legacy app's `maca_verde_*_v1` keys. Returns the removed keys. */
export function discardLegacyData(storage: KVStorage = defaultStorage()): string[] {
  const legacy = allKeys(storage).filter((k) => LEGACY_KEY_PATTERN.test(k));
  for (const k of legacy) storage.removeItem(k);
  return legacy;
}

/* --- backup ------------------------------------------------------------- */

export interface BackupFile {
  format: typeof BACKUP_FORMAT;
  version: typeof BACKUP_VERSION;
  exportedUnix?: number;
  data: AppData;
}

/** Download name of an exported backup: the day number, never a civil date. */
export function backupFileName(day: number): string {
  return `maca-verde-backup-${day}.json`;
}

export function exportBackup(data: AppData, exportedUnix?: number): string {
  const file: BackupFile = { format: BACKUP_FORMAT, version: BACKUP_VERSION, data };
  if (exportedUnix !== undefined) file.exportedUnix = exportedUnix;
  return JSON.stringify(file);
}

export type ImportResult = { ok: true; data: AppData; exportedUnix?: number } | { ok: false; error: string };

/** Parse and validate a backup. Rejects other formats, other versions and any malformed slice. */
export function importBackup(json: string): ImportResult {
  let file: unknown;
  try {
    file = JSON.parse(json);
  } catch {
    return { ok: false, error: 'not_json' };
  }
  if (!isObj(file) || file.format !== BACKUP_FORMAT) return { ok: false, error: 'not_a_backup' };
  if (file.version !== BACKUP_VERSION) return { ok: false, error: 'unsupported_version' };
  if (!isObj(file.data)) return { ok: false, error: 'invalid:data' };
  const data = emptyData();
  try {
    for (const key of SLICES) {
      const v = file.data[key];
      if (v === undefined) throw new Invalid(key);
      (data as unknown as Record<string, unknown>)[key] = parseSlice(key, v, true);
    }
  } catch (e) {
    if (e instanceof Invalid) return { ok: false, error: `invalid:${e.message}` };
    throw e;
  }
  return isNum(file.exportedUnix) ? { ok: true, data, exportedUnix: file.exportedUnix } : { ok: true, data };
}

/** An in-memory KVStorage (tests, previews). */
export function memoryStorage(initial: Record<string, string> = {}): KVStorage {
  const map = new Map<string, string>(Object.entries(initial));
  return {
    getItem: (k) => map.get(k) ?? null,
    setItem: (k, v) => void map.set(k, String(v)),
    removeItem: (k) => void map.delete(k),
    key: (i) => [...map.keys()][i] ?? null,
    get length() {
      return map.size;
    },
  };
}
