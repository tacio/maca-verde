/**
 * daykeep conventions in TypeScript — a port of the parts of daykeep's
 * src/dktime.c that this app needs. Verified against golden vectors generated
 * by the real binary (scripts/daykeep-vectors.mjs).
 *
 * A moment is a whole number of seconds since day 0 (the epoch). A day is
 * `dayLength` seconds. Day numbers use floor division, so moments before the
 * epoch have negative days. Output rounds half up to 1/10000 of a day.
 *
 * Not ported (out of scope for the app): civil clock output, HH:MM input,
 * digit completion relative to "now", ranges and the tracker.
 *
 * All values are JS numbers. Every intermediate stays far below 2^53 for
 * real-world dates and day lengths up to 1e9 s; out-of-range input returns null.
 */

export interface DayConfig {
  /** Unix seconds of day 0. */
  epoch: number;
  /** Seconds per day, 1..1e9. */
  dayLength: number;
}

/** daykeep's own default: 2000-01-01 00:00 UTC, 86,400 s. */
export const DEFAULT_CONFIG: DayConfig = { epoch: 946684800, dayLength: 86400 };
export const MAX_DAY_LENGTH = 1_000_000_000;
const MAX_FRAC_DIGITS = 9;
const MAX_DAY_DIGITS = 15; // keeps day * dayLength inside safe integers

export function floorDiv(a: number, b: number): number {
  return Math.floor(a / b);
}

export function isValidDayLength(n: number): boolean {
  return Number.isInteger(n) && n >= 1 && n <= MAX_DAY_LENGTH;
}

/* --- conversions -------------------------------------------------------- */

/** Unix seconds → seconds since day 0. */
export function fromUnix(unixSeconds: number, cfg: DayConfig): number {
  return Math.floor(unixSeconds) - cfg.epoch;
}

/** Seconds since day 0 → Unix seconds. */
export function toUnix(s: number, cfg: DayConfig): number {
  return s + cfg.epoch;
}

/** Day number containing moment `s`. */
export function dayOf(s: number, cfg: DayConfig): number {
  return floorDiv(s, cfg.dayLength);
}

/** First second of day `day` (its N.0000 boundary). */
export function dayStart(day: number, cfg: DayConfig): number {
  return day * cfg.dayLength;
}

/** Seconds left until the next day boundary. */
export function remainingInDay(s: number, cfg: DayConfig): number {
  return dayStart(dayOf(s, cfg) + 1, cfg) - s;
}

/** 10-day cycle number of a day (days 14360–14369 → cycle 1436). */
export function cycleOf(day: number): number {
  return floorDiv(day, 10);
}

/* --- parsing ------------------------------------------------------------ */

interface Decimal {
  ndig: number;
  day: number;
  /** fraction of a day in seconds, rounded half up */
  frac: number;
}

/** [DIGITS][.[DIGITS]] with at least one digit; no sign, no completion. */
function parseDecimal(s: string, cfg: DayConfig): Decimal | null {
  const m = /^(\d*)(?:\.(\d*))?$/.exec(s);
  if (!m) return null;
  const [, dayDigits, fracDigitsRaw = ''] = m;
  if (dayDigits.length + fracDigitsRaw.length === 0) return null;
  if (dayDigits.length > MAX_DAY_DIGITS) return null;
  const fracDigits = fracDigitsRaw.slice(0, MAX_FRAC_DIGITS);
  const num = fracDigits ? Number(fracDigits) : 0;
  const den = 10 ** fracDigits.length;
  // (num * dayLength + den/2) / den, in integers; num*dayLength < 1e18 would
  // overflow doubles, so split: num*dayLength = q*den + r.
  const frac = mulDivRoundHalfUp(num, cfg.dayLength, den);
  return { ndig: dayDigits.length, day: dayDigits ? Number(dayDigits) : 0, frac };
}

/** floor((a*b + c/2) / c) for non-negative integers, exact without BigInt overflow risk. */
function mulDivRoundHalfUp(a: number, b: number, c: number): number {
  if (a * b <= Number.MAX_SAFE_INTEGER) return Math.floor((a * b + Math.floor(c / 2)) / c);
  const r = (BigInt(a) * BigInt(b) + BigInt(c) / 2n) / BigInt(c);
  return Number(r);
}

/** A full stamp such as "14359.3404" → seconds since day 0. Day digits required. */
export function parseStamp(s: string, cfg: DayConfig): number | null {
  const d = parseDecimal(s.trim(), cfg);
  if (!d || d.ndig === 0) return null;
  return d.day * cfg.dayLength + d.frac;
}

/** A decimal duration such as ".0104" or "1.25" → seconds. */
export function parseDuration(s: string, cfg: DayConfig): number | null {
  const d = parseDecimal(s.trim(), cfg);
  if (!d) return null;
  return d.day * cfg.dayLength + d.frac;
}

function daysInMonth(y: number, mon: number): number {
  const leap = (y % 4 === 0 && y % 100 !== 0) || y % 400 === 0;
  return [31, leap ? 29 : 28, 31, 30, 31, 30, 31, 31, 30, 31, 30, 31][mon - 1];
}

/**
 * ISO date as daykeep reads an epoch: YYYY-MM-DD[( |T)H[H]:MM[:SS]][ ][Z|(+|-)HH[:]MM].
 * Without an offset the time is UTC (daykeep's --epoch rule). Returns Unix seconds.
 */
export function parseDate(s: string): number | null {
  const m =
    /^(\d{4})-(\d{2})-(\d{2})(?:[T ](\d{1,2}):(\d{2})(?::(\d{2}))?)? ?(?:(Z)|([+-])(\d{2}):?(\d{2}))?$/.exec(s.trim());
  if (!m) return null;
  const [, ys, mos, ds, hs = '0', mis = '0', ss = '0', z, sign, ohs, oms] = m;
  const y = Number(ys), mon = Number(mos), d = Number(ds);
  const h = Number(hs), mi = Number(mis), sec = Number(ss);
  if (mon < 1 || mon > 12 || d < 1 || d > daysInMonth(y, mon)) return null;
  if (h > 23 || mi > 59 || sec > 59) return null;
  let off = 0;
  if (!z && sign) {
    const oh = Number(ohs), om = Number(oms);
    if (oh > 23 || om > 59) return null;
    off = (sign === '-' ? -1 : 1) * (oh * 3600 + om * 60);
  }
  const date = new Date(0);
  date.setUTCFullYear(y, mon - 1, d);
  date.setUTCHours(h, mi, sec, 0);
  return Math.floor(date.getTime() / 1000) - off;
}

/* --- formatting --------------------------------------------------------- */

/** seconds → 1/10000ths of a day, rounded half up */
function ticks(s: number, cfg: DayConfig): number {
  return floorDiv(s * 10000 + floorDiv(cfg.dayLength, 2), cfg.dayLength);
}

function pad(n: number, width: number): string {
  const sign = n < 0 ? '-' : '';
  return sign + String(Math.abs(n)).padStart(width - sign.length, '0');
}

/** "14359.3404"; at least five day digits (including a '-' sign), four decimals. */
export function formatStamp(s: number, cfg: DayConfig): string {
  const t = ticks(s, cfg);
  const day = floorDiv(t, 10000);
  const frac = t - day * 10000;
  return `${pad(day, 5)}.${String(frac).padStart(4, '0')}`;
}

/** ".0625" under a day, "1.2500" from one day on; "-" in front if negative. */
export function formatDuration(d: number, cfg: DayConfig): string {
  const sg = d < 0 ? '-' : '';
  const t = ticks(Math.abs(d), cfg);
  if (t < 10000) return `${sg}.${String(t).padStart(4, '0')}`;
  return `${sg}${Math.floor(t / 10000)}.${String(t % 10000).padStart(4, '0')}`;
}

/** "1h 30m" (rounded to the nearest minute). */
export function formatHm(d: number): string {
  const sg = d < 0 ? '-' : '';
  const min = Math.floor((Math.abs(d) + 30) / 60);
  return `${sg}${Math.floor(min / 60)}h ${min % 60}m`;
}

/** Whole minutes, rounded to the nearest minute. */
export function formatMinutes(d: number): string {
  const sg = d < 0 ? '-' : '';
  return `${sg}${Math.floor((Math.abs(d) + 30) / 60)}`;
}

/** Time within the day as ".3404" (the fraction part of the rounded stamp). */
export function formatTimeOfDay(s: number, cfg: DayConfig): string {
  const stamp = formatStamp(s, cfg);
  return stamp.slice(stamp.indexOf('.'));
}

/**
 * Day number shortened to its last `digits` digits, like omitting the year
 * or month from a date: 14359 → "359" (3) → "59" (2). Keeps leading zeros
 * of the kept part (14305 → "05").
 */
export function shortDay(day: number, digits: number): string {
  const full = pad(day, 5);
  if (day < 0 || digits >= full.length) return full;
  return full.slice(full.length - digits);
}
