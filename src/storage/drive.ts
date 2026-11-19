/**
 * Google Drive backup (Settings → Data), ported from the legacy
 * googleDriveService to the v2 backup format (store.ts → exportBackup /
 * importBackup).
 *
 * - OAuth: Google Identity Services token client (script in index.html),
 *   scope `drive.file` (the app only sees files it created). The client ID is
 *   the user's own (settings.drive.clientId).
 * - One file, `maca-verde-backup.json`: found by name, updated in place, or
 *   created with a multipart upload.
 * - The access token lives in memory only (≈ 1 h); "connected" means a token
 *   is held in this session. Auto-backup uses it silently and never prompts.
 * - Network calls go only to the endpoints the legacy service used:
 *   www.googleapis.com/drive/v3/files and www.googleapis.com/upload/drive/v3/files.
 *
 * Request builders are pure and fetch is injectable (unit-tested in drive.test.ts).
 */

export const DRIVE_SCOPE = 'https://www.googleapis.com/auth/drive.file';
export const BACKUP_FILE_NAME = 'maca-verde-backup.json';
export const FILES_URL = 'https://www.googleapis.com/drive/v3/files';
export const UPLOAD_URL = 'https://www.googleapis.com/upload/drive/v3/files';
export const BOUNDARY = 'maca-verde-backup-boundary-314159';

export type FetchFn = (url: string, init?: RequestInit) => Promise<Response>;

export interface DriveFile {
  id: string;
  name: string;
  modifiedTime?: string;
}

/* --- request builders (pure) ------------------------------------------------ */

/** Drive query string literal: backslashes and single quotes escaped. */
export function queryLiteral(s: string): string {
  return `'${s.replace(/\\/g, '\\\\').replace(/'/g, "\\'")}'`;
}

export function findUrl(name = BACKUP_FILE_NAME): string {
  const q = encodeURIComponent(`name = ${queryLiteral(name)} and trashed = false`);
  return `${FILES_URL}?q=${q}&fields=${encodeURIComponent('files(id,name,modifiedTime)')}`;
}

export function downloadUrl(id: string): string {
  return `${FILES_URL}/${encodeURIComponent(id)}?alt=media`;
}

export function updateUrl(id: string): string {
  return `${UPLOAD_URL}/${encodeURIComponent(id)}?uploadType=media&fields=${encodeURIComponent('id,name,modifiedTime')}`;
}

export function createUrl(): string {
  return `${UPLOAD_URL}?uploadType=multipart&fields=${encodeURIComponent('id,name,modifiedTime')}`;
}

/** multipart/related body for creating the file: metadata part, then the JSON content. */
export function multipartBody(json: string, name = BACKUP_FILE_NAME, boundary = BOUNDARY): { body: string; contentType: string } {
  const metadata = { name, mimeType: 'application/json', description: 'Maçã Verde backup' };
  const body =
    `--${boundary}\r\n` +
    'Content-Type: application/json; charset=UTF-8\r\n\r\n' +
    `${JSON.stringify(metadata)}\r\n` +
    `--${boundary}\r\n` +
    'Content-Type: application/json\r\n\r\n' +
    `${json}\r\n` +
    `--${boundary}--`;
  return { body, contentType: `multipart/related; boundary=${boundary}` };
}

const auth = (token: string) => ({ Authorization: `Bearer ${token}` });

/* --- calls (fetch injectable) -------------------------------------------------- */

export class DriveError extends Error {
  constructor(
    message: string,
    readonly status?: number,
  ) {
    super(message);
    this.name = 'DriveError';
  }
}

async function ok(res: Response, what: string): Promise<Response> {
  if (!res.ok) throw new DriveError(`${what} failed (${res.status})`, res.status);
  return res;
}

const defaultFetch: FetchFn = (url, init) => globalThis.fetch(url, init);

export async function findBackup(token: string, fetchFn: FetchFn = defaultFetch): Promise<DriveFile | null> {
  const res = await ok(await fetchFn(findUrl(), { headers: auth(token) }), 'Search');
  const data = (await res.json()) as { files?: DriveFile[] };
  return data.files?.[0] ?? null;
}

/** Update the backup file in place, or create it. */
export async function uploadBackup(token: string, json: string, fetchFn: FetchFn = defaultFetch): Promise<DriveFile> {
  const existing = await findBackup(token, fetchFn);
  if (existing) {
    const res = await ok(
      await fetchFn(updateUrl(existing.id), {
        method: 'PATCH',
        headers: { ...auth(token), 'Content-Type': 'application/json' },
        body: json,
      }),
      'Upload',
    );
    return (await res.json()) as DriveFile;
  }
  const { body, contentType } = multipartBody(json);
  const res = await ok(
    await fetchFn(createUrl(), { method: 'POST', headers: { ...auth(token), 'Content-Type': contentType }, body }),
    'Upload',
  );
  return (await res.json()) as DriveFile;
}

/** The backup file's text, or null when there is none. */
export async function downloadBackup(token: string, fetchFn: FetchFn = defaultFetch): Promise<string | null> {
  const file = await findBackup(token, fetchFn);
  if (!file) return null;
  const res = await ok(await fetchFn(downloadUrl(file.id), { headers: auth(token) }), 'Download');
  return res.text();
}

/* --- OAuth token (Google Identity Services) -------------------------------------- */

interface TokenResponse {
  access_token?: string;
  expires_in?: number;
  error?: string;
}

interface Gis {
  accounts: {
    oauth2: {
      initTokenClient(config: {
        client_id: string;
        scope: string;
        callback: (r: TokenResponse) => void;
        error_callback?: (e: { type?: string; message?: string }) => void;
      }): { requestAccessToken(o?: { prompt?: string }): void };
    };
  };
}

const gis = (): Gis | undefined => (globalThis as unknown as { google?: Gis }).google;

export const isGisLoaded = () => !!gis()?.accounts?.oauth2;

interface Token {
  value: string;
  /** ms, Date.now() clock (a real deadline, not the app's scenario clock). */
  expiresAt: number;
}

let token: Token | null = null;
const listeners = new Set<() => void>();
const emit = () => listeners.forEach((l) => l());

/** Subscribe to connection/status changes (useSyncExternalStore). */
export function subscribeDrive(fn: () => void): () => void {
  listeners.add(fn);
  return () => listeners.delete(fn);
}

/** A token held this session that is still valid for at least a minute. */
export function currentToken(): string | null {
  if (token && token.expiresAt - 60_000 > Date.now()) return token.value;
  return null;
}

export const isConnected = () => currentToken() !== null;

/** Ask Google for a token (opens Google's consent popup; call from a tap). */
export function connect(clientId: string): Promise<string> {
  return new Promise((resolve, reject) => {
    const g = gis();
    if (!g?.accounts?.oauth2) return reject(new DriveError("Google sign-in didn't load. Check the connection."));
    if (!clientId.trim()) return reject(new DriveError('Add your OAuth client ID first.'));
    try {
      const client = g.accounts.oauth2.initTokenClient({
        client_id: clientId.trim(),
        scope: DRIVE_SCOPE,
        callback: (r) => {
          if (r.error || !r.access_token) return reject(new DriveError(r.error ?? 'No access token'));
          token = { value: r.access_token, expiresAt: Date.now() + (r.expires_in ?? 3600) * 1000 };
          emit();
          resolve(r.access_token);
        },
        error_callback: (e) => reject(new DriveError(e?.message ?? e?.type ?? 'Sign-in was closed')),
      });
      client.requestAccessToken({ prompt: token ? '' : 'consent' });
    } catch (e) {
      reject(e instanceof Error ? e : new DriveError(String(e)));
    }
  });
}

export function disconnect(): void {
  token = null;
  emit();
}

/** Dev scenarios only: pretend a token is held, without any network. */
export function simulateConnection(): void {
  token = { value: 'dev-simulated', expiresAt: Date.now() + 3600_000 };
  emit();
}

/* --- status of the last Drive operation (shown in Settings → Data) ---------------- */

export interface DriveStatus {
  /** 'auto' failures are silent elsewhere and only show here. */
  kind: 'idle' | 'working' | 'ok' | 'error';
  message?: string;
  auto?: boolean;
}

let status: DriveStatus = { kind: 'idle' };

export const driveStatus = () => status;

export function setDriveStatus(s: DriveStatus): void {
  status = s;
  emit();
}

/** Short, calm text for an error from any Drive call. */
export function driveErrorText(e: unknown): string {
  if (e instanceof DriveError) {
    if (e.status === 401 || e.status === 403) return 'Drive refused access. Connect again.';
    return e.message;
  }
  if (e instanceof TypeError) return "Couldn't reach Google Drive.";
  return e instanceof Error ? e.message : 'Something went wrong with Drive.';
}
