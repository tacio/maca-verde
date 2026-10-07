import { StorageService } from './storageService';

// Google Drive API configuration
const BACKUP_FILENAME = 'maca-verde-fitness-backup.json';
const DRIVE_SCOPE = 'https://www.googleapis.com/auth/drive.file';

interface GoogleTokenResponse {
  access_token: string;
  error?: string;
  expires_in?: number;
}

interface GoogleDriveFile {
  id: string;
  name: string;
  modifiedTime: string;
}

declare global {
  interface Window {
    google?: {
      accounts: {
        oauth2: {
          initTokenClient: (config: {
            client_id: string;
            scope: string;
            callback: (response: GoogleTokenResponse) => void;
            error_callback?: (err: unknown) => void;
          }) => {
            requestAccessToken: (overrideConfig?: { prompt?: string }) => void;
          };
        };
      };
    };
  }
}

export class GoogleDriveService {
  private static accessToken: string | null = null;

  public static isGoogleScriptLoaded(): boolean {
    return typeof window !== 'undefined' && !!window.google?.accounts?.oauth2;
  }

  /**
   * Request OAuth token via Google Identity Services
   */
  public static async requestAuth(clientId: string): Promise<string> {
    if (!this.isGoogleScriptLoaded()) {
      throw new Error('Google Identity Services script not loaded yet. Please check your internet connection.');
    }

    if (!clientId.trim()) {
      throw new Error('Please provide your Google OAuth Client ID.');
    }

    return new Promise((resolve, reject) => {
      try {
        const client = window.google!.accounts.oauth2.initTokenClient({
          client_id: clientId.trim(),
          scope: DRIVE_SCOPE,
          callback: (response: GoogleTokenResponse) => {
            if (response.error) {
              reject(new Error(response.error));
            } else if (response.access_token) {
              GoogleDriveService.accessToken = response.access_token;
              resolve(response.access_token);
            } else {
              reject(new Error('No access token received.'));
            }
          },
          error_callback: (err: unknown) => {
            reject(err);
          }
        });

        client.requestAccessToken({ prompt: 'consent' });
      } catch (err) {
        reject(err);
      }
    });
  }

  /**
   * Search for existing maca-verde-fitness-backup.json file
   */
  public static async findBackupFile(token: string): Promise<GoogleDriveFile | null> {
    const query = encodeURIComponent(`name = '${BACKUP_FILENAME}' and trashed = false`);
    const res = await fetch(`https://www.googleapis.com/drive/v3/files?q=${query}&fields=files(id,name,modifiedTime)`, {
      headers: {
        Authorization: `Bearer ${token}`
      }
    });

    if (!res.ok) {
      const errorText = await res.text();
      throw new Error(`Failed to query Google Drive: ${res.status} - ${errorText}`);
    }

    const data = await res.json();
    if (data.files && data.files.length > 0) {
      return data.files[0] as GoogleDriveFile;
    }
    return null;
  }

  /**
   * Backup all local data to Google Drive
   */
  public static async backupToDrive(clientId: string): Promise<{ success: boolean; message: string; modifiedTime?: string }> {
    try {
      const token = await this.requestAuth(clientId);
      const payload = StorageService.getFullBackupPayload();
      const payloadString = JSON.stringify(payload, null, 2);

      const existingFile = await this.findBackupFile(token);

      if (existingFile) {
        // Update existing backup file
        const updateRes = await fetch(
          `https://www.googleapis.com/upload/drive/v3/files/${existingFile.id}?uploadType=media`,
          {
            method: 'PATCH',
            headers: {
              Authorization: `Bearer ${token}`,
              'Content-Type': 'application/json'
            },
            body: payloadString
          }
        );

        if (!updateRes.ok) {
          throw new Error(`Update failed: ${updateRes.statusText}`);
        }

        const updatedData = await updateRes.json();
        // Update profile last synced
        const profile = StorageService.getProfile();
        profile.googleDrive.clientId = clientId;
        profile.googleDrive.lastSyncedIso = new Date().toISOString();
        StorageService.saveProfile(profile);

        return {
          success: true,
          message: `Backup updated on Google Drive! (${payload.logs.length} workouts synced)`,
          modifiedTime: updatedData.modifiedTime || new Date().toISOString()
        };
      } else {
        // Create new backup file using multipart upload
        const metadata = {
          name: BACKUP_FILENAME,
          mimeType: 'application/json',
          description: 'Maçã Verde Fitness local workout backup'
        };

        const boundary = '-------314159265358979323846';
        const delimiter = `\r\n--${boundary}\r\n`;
        const closeDelimiter = `\r\n--${boundary}--`;

        const multipartRequestBody =
          delimiter +
          'Content-Type: application/json; charset=UTF-8\r\n\r\n' +
          JSON.stringify(metadata) +
          delimiter +
          'Content-Type: application/json\r\n\r\n' +
          payloadString +
          closeDelimiter;

        const createRes = await fetch(
          'https://www.googleapis.com/upload/drive/v3/files?uploadType=multipart',
          {
            method: 'POST',
            headers: {
              Authorization: `Bearer ${token}`,
              'Content-Type': `multipart/related; boundary=${boundary}`
            },
            body: multipartRequestBody
          }
        );

        if (!createRes.ok) {
          throw new Error(`Upload failed: ${createRes.statusText}`);
        }

        const createdData = await createRes.json();
        const profile = StorageService.getProfile();
        profile.googleDrive.clientId = clientId;
        profile.googleDrive.lastSyncedIso = new Date().toISOString();
        StorageService.saveProfile(profile);

        return {
          success: true,
          message: `Created new backup on Google Drive! (${payload.logs.length} workouts saved)`,
          modifiedTime: createdData.modifiedTime || new Date().toISOString()
        };
      }
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : 'Unknown Google Drive error';
      return { success: false, message: msg };
    }
  }

  /**
   * Restore local data from Google Drive
   */
  public static async restoreFromDrive(clientId: string): Promise<{ success: boolean; message: string; workoutCount?: number }> {
    try {
      const token = await this.requestAuth(clientId);
      const existingFile = await this.findBackupFile(token);

      if (!existingFile) {
        return {
          success: false,
          message: `No backup file named "${BACKUP_FILENAME}" found in your Google Drive.`
        };
      }

      const downloadRes = await fetch(
        `https://www.googleapis.com/drive/v3/files/${existingFile.id}?alt=media`,
        {
          headers: {
            Authorization: `Bearer ${token}`
          }
        }
      );

      if (!downloadRes.ok) {
        throw new Error(`Download failed: ${downloadRes.statusText}`);
      }

      const jsonText = await downloadRes.text();
      const result = StorageService.importFromJSON(jsonText);

      if (result.success) {
        const profile = StorageService.getProfile();
        profile.googleDrive.clientId = clientId;
        profile.googleDrive.lastSyncedIso = new Date().toISOString();
        StorageService.saveProfile(profile);
      }

      return result;
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : 'Unknown Google Drive restore error';
      return { success: false, message: msg };
    }
  }
}
