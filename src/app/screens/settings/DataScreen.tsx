import { useRef, useState, useSyncExternalStore, type ChangeEvent } from 'react';
import { CloudDownload, CloudUpload, Download, Link2, Upload } from 'lucide-react';
import type { AppData } from '../../../domain/types';
import {
  connect,
  currentToken,
  downloadBackup,
  driveErrorText,
  driveStatus,
  isConnected,
  setDriveStatus,
  simulateConnection,
  subscribeDrive,
  uploadBackup,
} from '../../../storage/drive';
import { backupFileName, exportBackup, importBackup } from '../../../storage/store';
import { nowUnix } from '../../../time/clock';
import { formatStamp, fromUnix } from '../../../time/daykeep';
import { Button } from '../../../ui/Button';
import { Checkbox } from '../../../ui/Checkbox';
import { Disclosure } from '../../../ui/Disclosure';
import { FullScreen } from '../../../ui/FullScreen';
import { Sheet } from '../../../ui/Sheet';
import { TextField } from '../../../ui/TextField';
import { cx } from '../../../ui/cx';
import { useApp } from '../../AppContext';
import { useNav } from '../../nav';
import { importErrorText } from '../Onboarding';

let simulated = false;

/**
 * Data (J9): export / import a backup file, and Google Drive backup & restore
 * (storage/drive.ts). `connected` (dev scenarios) simulates a Drive token
 * without any network.
 */
export function DataScreen({ connected: simulate }: { connected?: boolean }) {
  if (simulate && import.meta.env.DEV && !simulated) {
    simulated = true;
    simulateConnection();
  }
  const { data, record, cfg, update } = useApp();
  const { close } = useNav();
  const fileRef = useRef<HTMLInputElement>(null);
  const connected = useSyncExternalStore(subscribeDrive, isConnected);
  const status = useSyncExternalStore(subscribeDrive, driveStatus);
  const [pending, setPending] = useState<{ data: AppData; from: 'file' | 'drive' } | null>(null);
  const [fileNote, setFileNote] = useState<{ text: string; error?: boolean } | null>(null);
  const drive = data.settings.drive;
  const busy = status.kind === 'working';

  const setDrive = (patch: Partial<AppData['settings']['drive']>) =>
    update((d) => ({ ...d, settings: { ...d.settings, drive: { ...d.settings.drive, ...patch } } }));

  const exportFile = () => {
    const json = exportBackup(data, nowUnix());
    const url = URL.createObjectURL(new Blob([json], { type: 'application/json' }));
    const a = document.createElement('a');
    a.href = url;
    a.download = backupFileName(record.today);
    a.click();
    setTimeout(() => URL.revokeObjectURL(url), 1000);
    setFileNote({ text: `Saved ${a.download}` });
  };

  const onFile = async (e: ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    e.target.value = '';
    if (!file) return;
    const r = importBackup(await file.text());
    if (r.ok) setPending({ data: r.data, from: 'file' });
    else setFileNote({ text: importErrorText(r.error), error: true });
  };

  const replace = () => {
    if (!pending) return;
    const incoming = pending.data;
    update((d) => ({
      ...incoming,
      settings: {
        ...incoming.settings,
        // Keep this device set up and connected to its Drive client.
        onboardedUnix: incoming.settings.onboardedUnix ?? d.settings.onboardedUnix,
        drive: { ...incoming.settings.drive, clientId: incoming.settings.drive.clientId || d.settings.drive.clientId },
      },
    }));
    if (pending.from === 'file') setFileNote({ text: 'Backup restored' });
    else setDriveStatus({ kind: 'ok', message: 'Restored from Drive' });
    setPending(null);
  };

  const withToken = async (): Promise<string> => currentToken() ?? (await connect(drive.clientId));

  const run = async (label: string, fn: () => Promise<void>) => {
    setDriveStatus({ kind: 'working', message: label });
    try {
      await fn();
    } catch (e) {
      setDriveStatus({ kind: 'error', message: driveErrorText(e) });
    }
  };

  const onConnect = () =>
    run('Connecting…', async () => {
      await connect(drive.clientId);
      setDriveStatus({ kind: 'ok', message: 'Connected to Drive' });
    });

  const backUpNow = () =>
    run('Backing up…', async () => {
      const token = await withToken();
      const unix = nowUnix();
      await uploadBackup(token, exportBackup(data, unix));
      setDrive({ lastBackupUnix: unix });
      setDriveStatus({ kind: 'ok', message: 'Backed up to Drive' });
    });

  const restore = () =>
    run('Looking for a backup…', async () => {
      const text = await downloadBackup(await withToken());
      if (text === null) return setDriveStatus({ kind: 'error', message: 'No backup on Drive yet.' });
      const r = importBackup(text);
      if (!r.ok) return setDriveStatus({ kind: 'error', message: importErrorText(r.error) });
      setDriveStatus({ kind: 'idle' });
      setPending({ data: r.data, from: 'drive' });
    });

  const last = drive.lastBackupUnix === undefined ? null : formatStamp(fromUnix(drive.lastBackupUnix, cfg), cfg);
  const hasId = drive.clientId.trim() !== '';

  return (
    <FullScreen
      screen="settings-data"
      title="Data"
      onClose={close}
      dismiss="back"
      footer={
        !pending && (
          <Button variant="primary" full icon={Download} onClick={exportFile}>
            Export backup
          </Button>
        )
      }
    >
      <section aria-labelledby="file-title" className="flex flex-col gap-2 pb-6">
        <h2 id="file-title" className="text-base font-semibold text-ink">
          Backup file
        </h2>
        <p className="text-sm text-ink-muted">Everything in one JSON file, named by today’s day number.</p>
        <Button icon={Upload} className="self-start" onClick={() => fileRef.current?.click()}>
          Import backup
        </Button>
        <input ref={fileRef} type="file" accept="application/json,.json" className="hidden" onChange={onFile} />
        {fileNote && (
          <p role="status" className={cx('text-sm', fileNote.error ? 'text-caution' : 'text-ink-muted')}>
            {fileNote.text}
          </p>
        )}
      </section>

      <section aria-labelledby="drive-title" className="flex flex-col gap-3 border-t border-line pt-5">
        <div className="flex items-baseline justify-between gap-3">
          <h2 id="drive-title" className="text-base font-semibold text-ink">
            Google Drive
          </h2>
          <p className="text-sm tabular-nums text-ink-muted">{connected ? 'Connected' : 'Not connected'}</p>
        </div>
        <TextField
          label="OAuth client ID"
          value={drive.clientId}
          onChange={(e) => setDrive({ clientId: e.target.value.trim() })}
          placeholder="…apps.googleusercontent.com"
          autoComplete="off"
          spellCheck={false}
        />
        <Disclosure summary="How?">
          Create an OAuth client ID (type “Web application”) in Google Cloud Console, add this site as an authorized JavaScript
          origin, and paste the ID here. Backups go to one file, maca-verde-backup.json, that only this app can see. The
          connection lasts for this session.
        </Disclosure>
        {connected ? (
          <div className="grid grid-cols-2 gap-2">
            <Button icon={CloudUpload} disabled={busy} onClick={backUpNow}>
              Back up now
            </Button>
            <Button icon={CloudDownload} disabled={busy} onClick={restore}>
              Restore
            </Button>
          </div>
        ) : (
          <Button icon={Link2} className="self-start" disabled={!hasId || busy} onClick={onConnect}>
            Connect
          </Button>
        )}
        <Checkbox checked={drive.autoBackup} onChange={(v) => setDrive({ autoBackup: v })}>
          Back up after each workout
        </Checkbox>
        <p className="text-sm tabular-nums text-ink-muted">{last ? `Last backup ${last}` : 'No Drive backup yet'}</p>
        {status.kind !== 'idle' && status.message && (
          <p role="status" className={cx('text-sm', status.kind === 'error' ? 'text-caution' : 'text-ink-muted')}>
            {status.message}
          </p>
        )}
      </section>

      <p className="border-t border-line pt-5 text-sm tabular-nums text-ink-muted">
        Version {__BUILD_STAMP__}
      </p>

      <Sheet
        open={!!pending}
        onClose={() => setPending(null)}
        title="Replace all data?"
        footer={
          <>
            <Button variant="primary" full onClick={replace}>
              Replace
            </Button>
            <Button full onClick={() => setPending(null)}>
              Cancel
            </Button>
          </>
        }
      >
        {pending && (
          <p className="text-base tabular-nums text-ink-muted">
            The backup holds {pending.data.plans.length} planned days and {pending.data.sessions.length} workouts. What’s here now is
            replaced.
          </p>
        )}
      </Sheet>
    </FullScreen>
  );
}
