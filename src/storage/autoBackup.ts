/**
 * Auto Drive backup after a saved workout (02-workflows §4: "Keep — silent;
 * status in Settings").
 *
 * Runs only when settings.drive.autoBackup is on, a client ID is set and a
 * Drive token is held this session (drive.ts → currentToken): it never opens
 * a sign-in popup. Debounced, so a burst of saves uploads once, with the
 * latest data. Failures are silent here; their status shows in Settings → Data.
 * On success the app stamps settings.drive.lastBackupUnix through the sink
 * AppProvider registers.
 */

import type { AppData } from '../domain/types';
import { nowUnix } from '../time/clock';
import { currentToken, driveErrorText, setDriveStatus, uploadBackup, type FetchFn } from './drive';
import { exportBackup } from './store';

export type AutoBackupReason = 'workout';

export const AUTO_BACKUP_DELAY_MS = 3000;

let pending: { data: AppData; timer: ReturnType<typeof setTimeout> } | null = null;
let onBackedUp: ((unix: number) => void) | null = null;

/** AppProvider registers how a finished backup is stamped into the data. */
export function setBackupStampSink(fn: ((unix: number) => void) | null): void {
  onBackedUp = fn;
}

/** Whether an auto-backup would run for this data right now. */
export function autoBackupReady(data: AppData): boolean {
  const d = data.settings.drive;
  return d.autoBackup && d.clientId.trim() !== '' && currentToken() !== null;
}

export function requestAutoBackup(data: AppData, _reason: AutoBackupReason, fetchFn?: FetchFn): void {
  if (!autoBackupReady(data)) return;
  if (pending) clearTimeout(pending.timer);
  pending = {
    data,
    timer: setTimeout(() => {
      const latest = pending!.data;
      pending = null;
      void runBackup(latest, fetchFn);
    }, AUTO_BACKUP_DELAY_MS),
  };
}

async function runBackup(data: AppData, fetchFn?: FetchFn): Promise<void> {
  const token = currentToken();
  if (!token) return;
  const unix = nowUnix();
  try {
    await uploadBackup(token, exportBackup(data, unix), fetchFn);
    onBackedUp?.(unix);
    setDriveStatus({ kind: 'ok', message: 'Backed up after your workout', auto: true });
  } catch (e) {
    setDriveStatus({ kind: 'error', message: `Auto-backup failed: ${driveErrorText(e)}`, auto: true });
  }
}

/** Tests: drop a pending upload. */
export function cancelAutoBackup(): void {
  if (pending) clearTimeout(pending.timer);
  pending = null;
}
