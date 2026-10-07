import { WorkoutRoutine } from '../types/fitness';

export const WORKOUT_ROUTINES: WorkoutRoutine[] = [
  {
    id: 'daily-adaptive-overload',
    title: 'Daily Micro-Overload HIIT (Recommended)',
    subtitle: 'The 1% Daily Compounder • Posture + Belly Burn + Cardio',
    protocol: 'circuit',
    primaryGoal: 'hybrid',
    description: 'Designed for daily execution. Alternates high-cadence cardio intervals with door bar decompression and text-neck posture alignment. Calibrated to increase slightly every day.',
    exercises: [
      { exerciseId: 'rope-boxer-skip-hiit', workSeconds: 30, restSeconds: 15, targetIntensity: 'Moderate' },
      { exerciseId: 'door-bar-dead-hang', workSeconds: 30, restSeconds: 15, targetIntensity: 'Hold / Controlled' },
      { exerciseId: 'mountain-climber-sprints', workSeconds: 30, restSeconds: 15, targetIntensity: 'Sprint' },
      { exerciseId: 'chin-tuck-cobra-hold', workSeconds: 30, restSeconds: 15, targetIntensity: 'Hold / Controlled' },
      { exerciseId: 'rope-speed-sprint-tabata', workSeconds: 20, restSeconds: 15, targetIntensity: 'Sprint' },
      { exerciseId: 'door-bar-hanging-knees', workSeconds: 30, restSeconds: 20, targetIntensity: 'High' }
    ],
    rounds: 3,
    roundRestSeconds: 45,
    prepSeconds: 10,
    estimatedCalories: 210,
    estimatedDurationMinutes: 16,
    isDailyRecommended: true
  },
  {
    id: 'tabata-belly-shred',
    title: 'Tabata Belly Shred & Cardio Torch',
    subtitle: 'Proven 20s:10s Protocol • Maximum EPOC Fat Burn',
    protocol: 'tabata',
    primaryGoal: 'belly_fat',
    description: 'Dr. Izumi Tabata’s proven protocol: 20 seconds maximum effort, 10 seconds rest. Proven to burn more visceral belly fat than 60 minutes of steady-state jogging while boosting cardio VO2max.',
    exercises: [
      { exerciseId: 'rope-speed-sprint-tabata', workSeconds: 20, restSeconds: 10, targetIntensity: 'Sprint' },
      { exerciseId: 'hollow-body-hold-tuck', workSeconds: 20, restSeconds: 10, targetIntensity: 'High' },
      { exerciseId: 'rope-high-knees-burn', workSeconds: 20, restSeconds: 10, targetIntensity: 'Sprint' },
      { exerciseId: 'door-bar-hanging-knees', workSeconds: 20, restSeconds: 10, targetIntensity: 'High' },
      { exerciseId: 'sprawl-burpee-blast', workSeconds: 20, restSeconds: 10, targetIntensity: 'Sprint' },
      { exerciseId: 'mountain-climber-sprints', workSeconds: 20, restSeconds: 10, targetIntensity: 'Sprint' },
      { exerciseId: 'rope-boxer-skip-hiit', workSeconds: 20, restSeconds: 10, targetIntensity: 'Moderate' },
      { exerciseId: 'door-bar-dead-hang', workSeconds: 20, restSeconds: 10, targetIntensity: 'Hold / Controlled' }
    ],
    rounds: 2,
    roundRestSeconds: 60,
    prepSeconds: 10,
    estimatedCalories: 240,
    estimatedDurationMinutes: 12
  },
  {
    id: 'posture-text-neck-antidote',
    title: 'Text-Neck Antidote & Thoracic Armor',
    subtitle: 'Spine Decompression • Scapular Pulls & Chin Tucks',
    protocol: 'circuit',
    primaryGoal: 'posture',
    description: 'Directly reverses forward head carriage ("tech neck"), kyphotic hunched shoulders, and compressed neck vertebrae. Combines hanging traction with deep cervical flexor endurance.',
    exercises: [
      { exerciseId: 'door-bar-dead-hang', workSeconds: 35, restSeconds: 15, targetIntensity: 'Hold / Controlled' },
      { exerciseId: 'chin-tuck-cobra-hold', workSeconds: 30, restSeconds: 15, targetIntensity: 'Hold / Controlled' },
      { exerciseId: 'door-bar-scapular-pull', workSeconds: 30, restSeconds: 15, targetIntensity: 'High' },
      { exerciseId: 'prone-ytw-raises', workSeconds: 35, restSeconds: 15, targetIntensity: 'Hold / Controlled' },
      { exerciseId: 'plank-downdog-toe-tap', workSeconds: 30, restSeconds: 15, targetIntensity: 'Moderate' },
      { exerciseId: 'rope-boxer-skip-hiit', workSeconds: 35, restSeconds: 20, targetIntensity: 'Moderate' }
    ],
    rounds: 3,
    roundRestSeconds: 40,
    prepSeconds: 10,
    estimatedCalories: 175,
    estimatedDurationMinutes: 17
  },
  {
    id: 'emom-rope-door-bar-hybrid',
    title: 'EMOM 15: Rope & Door Bar Conditioning',
    subtitle: 'Every Minute on the Minute • Cadence & Core Mastery',
    protocol: 'emom',
    primaryGoal: 'cardio',
    description: 'Perform the designated work at the start of each minute, resting for the remainder. Builds explosive cardio engine and mental grit while strengthening grip and core.',
    exercises: [
      { exerciseId: 'rope-boxer-skip-hiit', workSeconds: 40, restSeconds: 20, repsGoal: 65, targetIntensity: 'Moderate' },
      { exerciseId: 'door-bar-hanging-knees', workSeconds: 30, restSeconds: 30, repsGoal: 12, targetIntensity: 'High' },
      { exerciseId: 'door-bar-dead-hang', workSeconds: 35, restSeconds: 25, repsGoal: 1, targetIntensity: 'Hold / Controlled' },
      { exerciseId: 'sprawl-burpee-blast', workSeconds: 30, restSeconds: 30, repsGoal: 10, targetIntensity: 'Sprint' },
      { exerciseId: 'chin-tuck-cobra-hold', workSeconds: 35, restSeconds: 25, repsGoal: 1, targetIntensity: 'Hold / Controlled' }
    ],
    rounds: 3,
    roundRestSeconds: 30,
    prepSeconds: 10,
    estimatedCalories: 220,
    estimatedDurationMinutes: 15
  },
  {
    id: 'quick-5min-streak-saver',
    title: '5-Minute Emergency Streak Saver',
    subtitle: 'Zero Excuses • Fast High-Impact Intensity',
    protocol: 'circuit',
    primaryGoal: 'hybrid',
    description: 'Short on time? Never break the chain! A fast, high-octane 5-minute circuit that keeps your daily streak alive and resets your posture in between busy work.',
    exercises: [
      { exerciseId: 'rope-speed-sprint-tabata', workSeconds: 30, restSeconds: 10, targetIntensity: 'Sprint' },
      { exerciseId: 'door-bar-dead-hang', workSeconds: 30, restSeconds: 10, targetIntensity: 'Hold / Controlled' },
      { exerciseId: 'mountain-climber-sprints', workSeconds: 30, restSeconds: 10, targetIntensity: 'Sprint' },
      { exerciseId: 'chin-tuck-cobra-hold', workSeconds: 30, restSeconds: 10, targetIntensity: 'Hold / Controlled' },
      { exerciseId: 'rope-high-knees-burn', workSeconds: 30, restSeconds: 10, targetIntensity: 'Sprint' },
      { exerciseId: 'door-bar-scapular-pull', workSeconds: 30, restSeconds: 10, targetIntensity: 'High' }
    ],
    rounds: 1,
    roundRestSeconds: 0,
    prepSeconds: 5,
    estimatedCalories: 75,
    estimatedDurationMinutes: 5
  }
];

export const getRoutineById = (id: string): WorkoutRoutine => {
  return WORKOUT_ROUTINES.find(r => r.id === id) || WORKOUT_ROUTINES[0];
};
