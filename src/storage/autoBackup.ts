/**
 * Auto Drive backup after a saved workout (02-workflows §4: "Keep — silent;
 * status in Settings").
 *
 * M6 TODO: when settings.drive.autoBackup is on and a Drive token is at hand,
 * upload the backup file silently and stamp settings.drive.lastBackupUnix.
 * Until then this hook is a deliberate no-op so callers are already wired.
 */

import type { AppData } from '../domain/types';

export type AutoBackupReason = 'workout';

export function requestAutoBackup(_data: AppData, _reason: AutoBackupReason): void {
  // Intentionally empty until M6 (Settings → Data, Google Drive).
}
