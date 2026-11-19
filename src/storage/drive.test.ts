import { afterEach, describe, expect, it, vi } from 'vitest';
import {
  BACKUP_FILE_NAME,
  BOUNDARY,
  DriveError,
  createUrl,
  downloadBackup,
  downloadUrl,
  driveErrorText,
  findUrl,
  multipartBody,
  queryLiteral,
  updateUrl,
  uploadBackup,
  type FetchFn,
} from './drive';
import { AUTO_BACKUP_DELAY_MS, cancelAutoBackup, requestAutoBackup, setBackupStampSink } from './autoBackup';
import * as drive from './drive';
import { backupFileName, emptyData } from './store';

const json = (body: unknown, status = 200) => new Response(JSON.stringify(body), { status });

/** A fetch mock that answers in order and records each call. */
function mockFetch(...answers: Response[]) {
  const calls: { url: string; init?: RequestInit }[] = [];
  const fn: FetchFn = async (url, init) => {
    calls.push({ url, init });
    const a = answers.shift();
    if (!a) throw new Error(`unexpected fetch ${url}`);
    return a;
  };
  return { fn, calls };
}

describe('Drive request builders', () => {
  it('only targets the Drive v3 endpoints', () => {
    for (const u of [findUrl(), downloadUrl('abc'), updateUrl('abc'), createUrl()])
      expect(u).toMatch(/^https:\/\/www\.googleapis\.com\/(upload\/)?drive\/v3\/files/);
  });

  it('searches the backup file by exact name, not trashed', () => {
    const q = decodeURIComponent(new URL(findUrl()).searchParams.get('q')!);
    expect(q).toBe(`name = 'maca-verde-backup.json' and trashed = false`);
    expect(BACKUP_FILE_NAME).toBe('maca-verde-backup.json');
  });

  it('escapes quotes in query literals', () => {
    expect(queryLiteral(`it's`)).toBe(`'it\\'s'`);
    expect(queryLiteral('a\\b')).toBe(`'a\\\\b'`);
  });

  it('downloads with alt=media and updates with uploadType=media', () => {
    expect(downloadUrl('id 1')).toBe('https://www.googleapis.com/drive/v3/files/id%201?alt=media');
    expect(updateUrl('x')).toContain('/upload/drive/v3/files/x?uploadType=media');
    expect(createUrl()).toContain('/upload/drive/v3/files?uploadType=multipart');
  });

  it('builds a multipart/related body: metadata, then the backup', () => {
    const { body, contentType } = multipartBody('{"a":1}');
    expect(contentType).toBe(`multipart/related; boundary=${BOUNDARY}`);
    const parts = body.split(`--${BOUNDARY}`);
    expect(parts).toHaveLength(4); // '', metadata, content, '--'
    expect(parts[1]).toContain('"name":"maca-verde-backup.json"');
    expect(parts[1]).toContain('"mimeType":"application/json"');
    expect(parts[2]).toContain('\r\n\r\n{"a":1}\r\n');
    expect(parts[3]).toBe('--');
  });
});

describe('Drive calls', () => {
  it('creates the file when none exists', async () => {
    const m = mockFetch(json({ files: [] }), json({ id: 'new', name: BACKUP_FILE_NAME }));
    const f = await uploadBackup('tok', '{}', m.fn);
    expect(f.id).toBe('new');
    expect(m.calls[1].url).toBe(createUrl());
    expect(m.calls[1].init?.method).toBe('POST');
    expect((m.calls[1].init?.headers as Record<string, string>).Authorization).toBe('Bearer tok');
  });

  it('updates the existing file in place', async () => {
    const m = mockFetch(json({ files: [{ id: 'f1', name: BACKUP_FILE_NAME }] }), json({ id: 'f1', name: BACKUP_FILE_NAME }));
    await uploadBackup('tok', '{"x":1}', m.fn);
    expect(m.calls[1].url).toBe(updateUrl('f1'));
    expect(m.calls[1].init?.method).toBe('PATCH');
    expect(m.calls[1].init?.body).toBe('{"x":1}');
  });

  it('downloads the backup text, or null when there is none', async () => {
    const m = mockFetch(json({ files: [{ id: 'f1', name: BACKUP_FILE_NAME }] }), new Response('{"backup":1}'));
    expect(await downloadBackup('tok', m.fn)).toBe('{"backup":1}');
    expect(m.calls[1].url).toBe(downloadUrl('f1'));
    expect(await downloadBackup('tok', mockFetch(json({ files: [] })).fn)).toBeNull();
  });

  it('fails with the HTTP status', async () => {
    await expect(uploadBackup('tok', '{}', mockFetch(json({}, 401)).fn)).rejects.toMatchObject({ status: 401 });
    expect(driveErrorText(new DriveError('x', 403))).toBe('Drive refused access. Connect again.');
    expect(driveErrorText(new TypeError('fetch'))).toBe("Couldn't reach Google Drive.");
  });
});

describe('auto-backup', () => {
  afterEach(() => {
    cancelAutoBackup();
    drive.disconnect();
    setBackupStampSink(null);
    vi.useRealTimers();
  });

  const ready = () => {
    const d = emptyData();
    d.settings.drive = { clientId: 'id', autoBackup: true };
    return d;
  };

  it('does nothing without a token, a client ID or the toggle', () => {
    const m = mockFetch();
    vi.useFakeTimers();
    requestAutoBackup(ready(), 'workout', m.fn); // not connected
    drive.simulateConnection();
    const off = ready();
    off.settings.drive.autoBackup = false;
    requestAutoBackup(off, 'workout', m.fn);
    vi.advanceTimersByTime(AUTO_BACKUP_DELAY_MS * 2);
    expect(m.calls).toHaveLength(0);
  });

  it('uploads once after a burst, with the latest data, and stamps it', async () => {
    vi.useFakeTimers();
    drive.simulateConnection();
    const m = mockFetch(json({ files: [] }), json({ id: 'new', name: BACKUP_FILE_NAME }));
    const stamps: number[] = [];
    setBackupStampSink((u) => stamps.push(u));
    const first = ready();
    const latest = ready();
    latest.settings.anchor = 'After I wake';
    requestAutoBackup(first, 'workout', m.fn);
    requestAutoBackup(latest, 'workout', m.fn);
    await vi.advanceTimersByTimeAsync(AUTO_BACKUP_DELAY_MS + 10);
    expect(m.calls).toHaveLength(2);
    expect(String(m.calls[1].init?.body)).toContain('After I wake');
    expect(stamps).toHaveLength(1);
  });

  it('fails silently, with the status for Settings → Data', async () => {
    vi.useFakeTimers();
    drive.simulateConnection();
    requestAutoBackup(ready(), 'workout', mockFetch(json({}, 500)).fn);
    await vi.advanceTimersByTimeAsync(AUTO_BACKUP_DELAY_MS + 10);
    expect(drive.driveStatus()).toMatchObject({ kind: 'error', auto: true });
  });
});

describe('backup file name', () => {
  it('uses the day number, never a civil date', () => {
    expect(backupFileName(14355)).toBe('maca-verde-backup-14355.json');
  });
});
