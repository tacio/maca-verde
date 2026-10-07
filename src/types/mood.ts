export type ValenceType = 'great' | 'good' | 'neutral' | 'frustrated' | 'exhausted' | 'anxious';

export interface HALTState {
  hungry: boolean;
  angry: boolean;
  lonely: boolean;
  tired: boolean;
}

export type SomaticTensionArea = 'jaw' | 'neck_shoulders' | 'chest' | 'stomach' | 'hands';

export interface MoodLogEntry {
  id: string;
  date: string; // YYYY-MM-DD
  timestamp: number;
  valence: ValenceType; // Emotional state
  energyLevel: 1 | 2 | 3 | 4 | 5; // 1 = Drained, 5 = High Energy
  halt: HALTState;
  somaticTension: SomaticTensionArea[];
  thoughtBeforeSpeakingRating?: 1 | 2 | 3 | 4 | 5; // 1 = spoke impulsively, 5 = master of pause
  triggers?: string;
  notes?: string;
  speechFilterActive: boolean; // True if HALT was triggered
}

export interface EmotionalControlDrillLog {
  id: string;
  date: string;
  timestamp: number;
  drillType: 'high_hr_pause' | 'speech_filter' | 'physiological_sigh';
  heartRateState: 'elevated_post_hiit' | 'resting';
  pauseSecondsAchieved: number;
  scenarioId?: string;
  impulseResisted: boolean;
  reflection?: string;
}

export interface ProvocationScenario {
  id: string;
  category: 'tired' | 'hungry' | 'upset' | 'criticism' | 'boundary';
  situation: string;
  somaticWarning: string;
  impulsiveReaction: string;
  prefrontalResponse: string;
  mentalPauseTip: string;
}
