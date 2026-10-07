export type EquipmentType = 'rope' | 'door_bar' | 'bodyweight';

export type GoalTarget = 'posture' | 'belly_fat' | 'cardio' | 'hybrid';

export type WorkoutProtocol = 'tabata' | 'emom' | 'amrap' | 'pyramid' | 'circuit';

export interface Exercise {
  id: string;
  name: string;
  targets: GoalTarget[];
  equipment: EquipmentType;
  difficulty: 1 | 2 | 3 | 4 | 5;
  description: string;
  textNeckCue: string;
  postureBenefit: string;
  bellyBurnBenefit: string;
  cardioBenefit: string;
  formPoints: string[];
  defaultWorkSeconds: number;
  defaultRestSeconds: number;
  cadenceTip?: string;
  targetMuscles: string[];
}

export interface WorkoutExerciseItem {
  exerciseId: string;
  workSeconds: number;
  restSeconds: number;
  repsGoal?: number;
  targetIntensity?: 'Sprint' | 'High' | 'Moderate' | 'Hold / Controlled';
}

export interface WorkoutRoutine {
  id: string;
  title: string;
  subtitle: string;
  protocol: WorkoutProtocol;
  description: string;
  primaryGoal: GoalTarget;
  exercises: WorkoutExerciseItem[];
  rounds: number;
  roundRestSeconds: number;
  prepSeconds: number;
  estimatedCalories: number;
  estimatedDurationMinutes: number;
  isDailyRecommended?: boolean;
  levelRequired?: number;
}

export interface WorkoutLogEntry {
  id: string;
  date: string; // YYYY-MM-DD
  timestamp: number;
  routineId: string;
  routineTitle: string;
  protocol: WorkoutProtocol;
  durationSeconds: number;
  roundsCompleted: number;
  totalRounds: number;
  estimatedCalories: number;
  jumpRopeTurns?: number;
  deadHangSeconds?: number;
  rpeRating: number; // 1 to 10
  neckDiscomfortScore: number; // 0 (pain free) to 10 (high tension)
  overloadNotes?: string;
  personalRecordBeaten?: boolean;
}

export interface UserFitnessProfile {
  name: string;
  currentStreak: number;
  bestStreak: number;
  lastCompletedDate: string; // YYYY-MM-DD
  totalWorkouts: number;
  totalActiveSeconds: number;
  totalCaloriesBurned: number;
  totalRopeJumps: number;
  personalRecords: {
    maxDeadHangSeconds: number;
    maxSingleSetRopeJumps: number;
    highestRoundsCompleted: number;
    lowestNeckPainScore: number;
  };
  overloadMultiplier: number; // e.g. 1.05 = +5% progressive overload
  level: number;
  soundEnabled: boolean;
  voiceCoachEnabled: boolean;
  googleDrive: {
    clientId: string;
    lastSyncedIso?: string;
    autoBackupPrompt: boolean;
  };
  preferredWorkoutTimeMinutes: number;
}

export interface DailyOverloadChallenge {
  date: string;
  dayNumber: number;
  title: string;
  description: string;
  targetType: 'dead_hang' | 'jump_rope' | 'workout_duration' | 'posture_focus';
  bonusTarget: string;
  routineId: string;
  motivationalQuote: string;
}
