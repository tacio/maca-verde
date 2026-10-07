import { UserFitnessProfile, WorkoutLogEntry, WorkoutRoutine } from '../types/fitness';
import { MoodLogEntry, EmotionalControlDrillLog } from '../types/mood';
import { WORKOUT_ROUTINES } from '../data/routines';

const STORAGE_KEYS = {
  PROFILE: 'maca_verde_profile_v1',
  LOGS: 'maca_verde_workout_logs_v1',
  CUSTOM_ROUTINES: 'maca_verde_custom_routines_v1',
  MOOD_LOGS: 'maca_verde_mood_logs_v1',
  EMOTIONAL_DRILLS: 'maca_verde_emotional_drills_v1',
};

const DEFAULT_PROFILE: UserFitnessProfile = {
  name: 'Athlete',
  currentStreak: 0,
  bestStreak: 0,
  lastCompletedDate: '',
  totalWorkouts: 0,
  totalActiveSeconds: 0,
  totalCaloriesBurned: 0,
  totalRopeJumps: 0,
  personalRecords: {
    maxDeadHangSeconds: 25,
    maxSingleSetRopeJumps: 100,
    highestRoundsCompleted: 3,
    lowestNeckPainScore: 2,
  },
  overloadMultiplier: 1.0,
  level: 1,
  soundEnabled: true,
  voiceCoachEnabled: true,
  googleDrive: {
    clientId: '',
    autoBackupPrompt: true,
  },
  preferredWorkoutTimeMinutes: 15,
};

export class StorageService {
  public static getProfile(): UserFitnessProfile {
    try {
      const raw = localStorage.getItem(STORAGE_KEYS.PROFILE);
      if (!raw) return DEFAULT_PROFILE;
      const parsed = JSON.parse(raw);
      return { ...DEFAULT_PROFILE, ...parsed };
    } catch {
      return DEFAULT_PROFILE;
    }
  }

  public static saveProfile(profile: UserFitnessProfile): void {
    try {
      localStorage.setItem(STORAGE_KEYS.PROFILE, JSON.stringify(profile));
    } catch (e) {
      console.error('Failed to save profile to localStorage', e);
    }
  }

  public static getLogs(): WorkoutLogEntry[] {
    try {
      const raw = localStorage.getItem(STORAGE_KEYS.LOGS);
      if (!raw) return [];
      return JSON.parse(raw) as WorkoutLogEntry[];
    } catch {
      return [];
    }
  }

  public static addLog(entry: WorkoutLogEntry): WorkoutLogEntry[] {
    const existing = StorageService.getLogs();
    const updated = [entry, ...existing];
    try {
      localStorage.setItem(STORAGE_KEYS.LOGS, JSON.stringify(updated));
    } catch (e) {
      console.error('Failed to save workout log to localStorage', e);
    }
    return updated;
  }

  public static getCustomRoutines(): WorkoutRoutine[] {
    try {
      const raw = localStorage.getItem(STORAGE_KEYS.CUSTOM_ROUTINES);
      if (!raw) return [];
      return JSON.parse(raw) as WorkoutRoutine[];
    } catch {
      return [];
    }
  }

  public static saveCustomRoutines(routines: WorkoutRoutine[]): void {
    try {
      localStorage.setItem(STORAGE_KEYS.CUSTOM_ROUTINES, JSON.stringify(routines));
    } catch (e) {
      console.error('Failed to save custom routines', e);
    }
  }

  public static getAllRoutines(): WorkoutRoutine[] {
    const custom = StorageService.getCustomRoutines();
    return [...WORKOUT_ROUTINES, ...custom];
  }

  // === MOOD & EMOTIONAL CONTROL STORAGE ===
  public static getMoodLogs(): MoodLogEntry[] {
    try {
      const raw = localStorage.getItem(STORAGE_KEYS.MOOD_LOGS);
      if (!raw) return [];
      return JSON.parse(raw) as MoodLogEntry[];
    } catch {
      return [];
    }
  }

  public static addMoodLog(entry: MoodLogEntry): MoodLogEntry[] {
    const existing = StorageService.getMoodLogs();
    const updated = [entry, ...existing];
    try {
      localStorage.setItem(STORAGE_KEYS.MOOD_LOGS, JSON.stringify(updated));
    } catch (e) {
      console.error('Failed to save mood log to localStorage', e);
    }
    return updated;
  }

  public static getLatestMood(): MoodLogEntry | null {
    const logs = StorageService.getMoodLogs();
    return logs.length > 0 ? logs[0] : null;
  }

  public static getEmotionalDrills(): EmotionalControlDrillLog[] {
    try {
      const raw = localStorage.getItem(STORAGE_KEYS.EMOTIONAL_DRILLS);
      if (!raw) return [];
      return JSON.parse(raw) as EmotionalControlDrillLog[];
    } catch {
      return [];
    }
  }

  public static addEmotionalDrill(entry: EmotionalControlDrillLog): EmotionalControlDrillLog[] {
    const existing = StorageService.getEmotionalDrills();
    const updated = [entry, ...existing];
    try {
      localStorage.setItem(STORAGE_KEYS.EMOTIONAL_DRILLS, JSON.stringify(updated));
    } catch (e) {
      console.error('Failed to save emotional drill log', e);
    }
    return updated;
  }

  /**
   * Export all user data as an object for Google Drive sync or JSON download
   */
  public static getFullBackupPayload() {
    return {
      appName: 'Maçã Verde Fitness & Mood',
      exportVersion: 2,
      exportedAt: new Date().toISOString(),
      profile: StorageService.getProfile(),
      logs: StorageService.getLogs(),
      customRoutines: StorageService.getCustomRoutines(),
      moodLogs: StorageService.getMoodLogs(),
      emotionalDrills: StorageService.getEmotionalDrills()
    };
  }

  /**
   * Trigger direct browser download of JSON backup file
   */
  public static exportJSONDownload(): void {
    const data = StorageService.getFullBackupPayload();
    const dateStr = new Date().toISOString().split('T')[0];
    const blob = new Blob([JSON.stringify(data, null, 2)], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `maca-verde-fitness-mood-backup-${dateStr}.json`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
  }

  /**
   * Import data from JSON string, with validation
   */
  public static importFromJSON(jsonString: string): { success: boolean; message: string; workoutCount?: number; moodCount?: number } {
    try {
      const parsed = JSON.parse(jsonString);
      if (!parsed || typeof parsed !== 'object') {
        return { success: false, message: 'Invalid JSON file format.' };
      }

      if (parsed.profile) {
        StorageService.saveProfile(parsed.profile);
      }

      if (Array.isArray(parsed.logs)) {
        localStorage.setItem(STORAGE_KEYS.LOGS, JSON.stringify(parsed.logs));
      }

      if (Array.isArray(parsed.customRoutines)) {
        StorageService.saveCustomRoutines(parsed.customRoutines);
      }

      if (Array.isArray(parsed.moodLogs)) {
        localStorage.setItem(STORAGE_KEYS.MOOD_LOGS, JSON.stringify(parsed.moodLogs));
      }

      if (Array.isArray(parsed.emotionalDrills)) {
        localStorage.setItem(STORAGE_KEYS.EMOTIONAL_DRILLS, JSON.stringify(parsed.emotionalDrills));
      }

      const workoutCount = Array.isArray(parsed.logs) ? parsed.logs.length : 0;
      const moodCount = Array.isArray(parsed.moodLogs) ? parsed.moodLogs.length : 0;

      return {
        success: true,
        message: `Successfully restored ${workoutCount} workouts and ${moodCount} mood & emotional check-ins!`,
        workoutCount,
        moodCount
      };
    } catch (err: unknown) {
      const errorMsg = err instanceof Error ? err.message : 'Unknown parse error';
      return { success: false, message: `Failed to import JSON: ${errorMsg}` };
    }
  }

  public static clearAllData(): void {
    localStorage.removeItem(STORAGE_KEYS.PROFILE);
    localStorage.removeItem(STORAGE_KEYS.LOGS);
    localStorage.removeItem(STORAGE_KEYS.CUSTOM_ROUTINES);
    localStorage.removeItem(STORAGE_KEYS.MOOD_LOGS);
    localStorage.removeItem(STORAGE_KEYS.EMOTIONAL_DRILLS);
  }
}
