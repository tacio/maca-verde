/**
 * Ask the browser to keep this site's storage (localStorage holds all app
 * data) instead of evicting it under storage pressure. Chrome grants it
 * silently to installed apps and engaged sites; no prompt is shown. Best
 * effort: failures are ignored.
 */
export async function requestPersistentStorage(): Promise<boolean> {
  try {
    const s = navigator.storage;
    if (!s?.persist) return false;
    if (await s.persisted?.()) return true;
    return await s.persist();
  } catch {
    return false;
  }
}
