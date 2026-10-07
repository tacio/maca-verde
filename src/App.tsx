import React, { useState, useEffect } from 'react';
import { Flame, Dumbbell, Calendar, Cloud, Volume2, VolumeX, Plus, Sparkles, Trophy } from 'lucide-react';
import { UserFitnessProfile, WorkoutLogEntry, WorkoutRoutine } from './types/fitness';
import { StorageService } from './services/storageService';
import { OverloadEngine } from './services/overloadEngine';
import { soundService } from './services/soundService';
import { TodayWorkoutView } from './components/TodayWorkoutView';
import { WorkoutPlayerHUD } from './components/WorkoutPlayerHUD';
import { WorkoutCompleteModal } from './components/WorkoutCompleteModal';
import { ExerciseLibraryView } from './components/ExerciseLibraryView';
import { ProgressAnalyticsView } from './components/ProgressAnalyticsView';
import { DataBackupView } from './components/DataBackupView';
import { CustomRoutineModal } from './components/CustomRoutineModal';
import { GoogleDriveService } from './services/googleDriveService';

export const App: React.FC = () => {
  const [profile, setProfile] = useState<UserFitnessProfile>(StorageService.getProfile());
  const [logs, setLogs] = useState<WorkoutLogEntry[]>(StorageService.getLogs());
  const [routines, setRoutines] = useState<WorkoutRoutine[]>(StorageService.getAllRoutines());
  const [activeTab, setActiveTab] = useState<'today' | 'library' | 'progress' | 'backup'>('today');

  // Active workout execution
  const [activeWorkoutRoutine, setActiveWorkoutRoutine] = useState<WorkoutRoutine | null>(null);
  const [completedWorkoutResult, setCompletedWorkoutResult] = useState<{
    durationSeconds: number;
    roundsCompleted: number;
    totalRounds: number;
    estimatedCalories: number;
    jumpRopeTurnsEstimated: number;
    deadHangSecondsEstimated: number;
  } | null>(null);

  // Custom routine builder
  const [showCustomBuilder, setShowCustomBuilder] = useState(false);

  // Refresh data from storage
  const reloadData = () => {
    setProfile(StorageService.getProfile());
    setLogs(StorageService.getLogs());
    setRoutines(StorageService.getAllRoutines());
  };

  useEffect(() => {
    reloadData();
  }, []);

  // Audio toggles
  const handleToggleSound = () => {
    const updated = { ...profile, soundEnabled: !profile.soundEnabled };
    setProfile(updated);
    StorageService.saveProfile(updated);
    soundService.setSoundEnabled(updated.soundEnabled);
  };

  const handleToggleVoice = () => {
    const updated = { ...profile, voiceCoachEnabled: !profile.voiceCoachEnabled };
    setProfile(updated);
    StorageService.saveProfile(updated);
    soundService.setVoiceCoachEnabled(updated.voiceCoachEnabled);
  };

  // Start workout
  const handleStartWorkout = (routine: WorkoutRoutine) => {
    setActiveWorkoutRoutine(routine);
  };

  // Live HUD finishes
  const handleFinishWorkoutHUD = (result: {
    durationSeconds: number;
    roundsCompleted: number;
    totalRounds: number;
    estimatedCalories: number;
    jumpRopeTurnsEstimated: number;
    deadHangSecondsEstimated: number;
  }) => {
    setCompletedWorkoutResult(result);
  };

  // Save log entry from modal
  const handleSaveWorkoutLog = (entryData: Omit<WorkoutLogEntry, 'id' | 'timestamp'>) => {
    const newLog: WorkoutLogEntry = {
      ...entryData,
      id: `log-${Date.now()}`,
      timestamp: Date.now()
    };

    const updatedLogs = StorageService.addLog(newLog);
    setLogs(updatedLogs);

    // Calculate updated streak and profile records
    const { currentStreak, bestStreak } = OverloadEngine.calculateStreakUpdate(profile, entryData.date);

    const updatedProfile: UserFitnessProfile = {
      ...profile,
      currentStreak,
      bestStreak,
      lastCompletedDate: entryData.date,
      totalWorkouts: profile.totalWorkouts + 1,
      totalActiveSeconds: profile.totalActiveSeconds + entryData.durationSeconds,
      totalCaloriesBurned: profile.totalCaloriesBurned + entryData.estimatedCalories,
      totalRopeJumps: profile.totalRopeJumps + (entryData.jumpRopeTurns || 0),
      // Progressive overload level & multiplier
      overloadMultiplier: Number(Math.min(1.4, profile.overloadMultiplier + (entryData.rpeRating >= 8 ? 0.02 : 0.01)).toFixed(2)),
      level: Math.min(10, Math.floor((profile.totalWorkouts + 1) / 5) + 1),
      personalRecords: {
        maxDeadHangSeconds: Math.max(profile.personalRecords.maxDeadHangSeconds, entryData.deadHangSeconds || 0),
        maxSingleSetRopeJumps: Math.max(profile.personalRecords.maxSingleSetRopeJumps, entryData.jumpRopeTurns || 0),
        highestRoundsCompleted: Math.max(profile.personalRecords.highestRoundsCompleted, entryData.roundsCompleted),
        lowestNeckPainScore: Math.min(profile.personalRecords.lowestNeckPainScore, entryData.neckDiscomfortScore)
      }
    };

    StorageService.saveProfile(updatedProfile);
    setProfile(updatedProfile);

    // Close workout flow
    setActiveWorkoutRoutine(null);
    setCompletedWorkoutResult(null);

    // Auto backup to Google Drive if configured
    if (updatedProfile.googleDrive.clientId && updatedProfile.googleDrive.autoBackupPrompt) {
      GoogleDriveService.backupToDrive(updatedProfile.googleDrive.clientId).catch(() => {});
    }
  };

  // Save custom routine
  const handleSaveCustomRoutine = (newRoutine: WorkoutRoutine) => {
    const existing = StorageService.getCustomRoutines();
    const updated = [newRoutine, ...existing];
    StorageService.saveCustomRoutines(updated);
    setRoutines(StorageService.getAllRoutines());
  };

  return (
    <div className="min-h-screen bg-slate-950 text-slate-100 flex flex-col font-sans">
      {/* Top Navbar */}
      <header className="sticky top-0 z-40 bg-slate-950/90 backdrop-blur-md border-b border-slate-800 px-4 md:px-8 py-3.5">
        <div className="max-w-6xl mx-auto flex items-center justify-between gap-4">
          {/* Logo & Title */}
          <div className="flex items-center space-x-2.5 cursor-pointer" onClick={() => setActiveTab('today')}>
            <span className="text-2xl drop-shadow-md">🍏</span>
            <div>
              <h1 className="font-black text-base md:text-lg tracking-tight bg-gradient-to-r from-white via-slate-100 to-brand-300 bg-clip-text text-transparent">
                MAÇÃ VERDE <span className="text-brand-400 font-mono text-xs">FITNESS</span>
              </h1>
              <p className="text-[10px] text-slate-400 font-semibold tracking-wide">
                Daily HIIT • Posture Overload • Jump Rope & Door Bar
              </p>
            </div>
          </div>

          {/* Quick Streak & Controls */}
          <div className="flex items-center space-x-2 md:space-x-3">
            {/* Streak Counter */}
            <div className="flex items-center gap-1.5 px-3 py-1 rounded-full bg-orange-950/60 border border-orange-500/40 text-orange-400 text-xs font-black shadow-inner">
              <Flame className="w-4 h-4 fill-current text-orange-400" />
              <span>{profile.currentStreak}d</span>
            </div>

            {/* Sound Button */}
            <button
              onClick={handleToggleSound}
              className={`p-2 rounded-lg border transition ${
                profile.soundEnabled ? 'bg-slate-900 border-slate-700 text-brand-400' : 'bg-slate-950 border-slate-800 text-slate-500'
              }`}
              title="Toggle Audio Beeps"
            >
              {profile.soundEnabled ? <Volume2 className="w-4 h-4" /> : <VolumeX className="w-4 h-4" />}
            </button>

            {/* Voice Coach Toggle */}
            <button
              onClick={handleToggleVoice}
              className={`hidden sm:flex px-2.5 py-1 rounded-lg border text-[11px] font-bold transition items-center gap-1 ${
                profile.voiceCoachEnabled ? 'bg-brand-500/15 border-brand-500/40 text-brand-300' : 'bg-slate-950 border-slate-800 text-slate-500'
              }`}
              title="Toggle Spoken Voice Coach"
            >
              🗣️ {profile.voiceCoachEnabled ? 'Voice On' : 'Voice Off'}
            </button>
          </div>
        </div>
      </header>

      {/* Main Tab Navigation */}
      <nav className="bg-slate-900/60 border-b border-slate-800/80 px-4 md:px-8">
        <div className="max-w-6xl mx-auto flex items-center gap-1 md:gap-2 overflow-x-auto py-2">
          <button
            onClick={() => setActiveTab('today')}
            className={`px-3.5 py-2 rounded-xl text-xs font-black tracking-wide uppercase transition flex items-center gap-2 shrink-0 ${
              activeTab === 'today'
                ? 'bg-brand-500 text-slate-950 shadow-md shadow-brand-500/20'
                : 'text-slate-400 hover:text-white hover:bg-slate-800/60'
            }`}
          >
            <Sparkles className="w-4 h-4" /> Today's Workout
          </button>

          <button
            onClick={() => setActiveTab('library')}
            className={`px-3.5 py-2 rounded-xl text-xs font-black tracking-wide uppercase transition flex items-center gap-2 shrink-0 ${
              activeTab === 'library'
                ? 'bg-brand-500 text-slate-950 shadow-md shadow-brand-500/20'
                : 'text-slate-400 hover:text-white hover:bg-slate-800/60'
            }`}
          >
            <Dumbbell className="w-4 h-4" /> Technique & Posture
          </button>

          <button
            onClick={() => setActiveTab('progress')}
            className={`px-3.5 py-2 rounded-xl text-xs font-black tracking-wide uppercase transition flex items-center gap-2 shrink-0 ${
              activeTab === 'progress'
                ? 'bg-brand-500 text-slate-950 shadow-md shadow-brand-500/20'
                : 'text-slate-400 hover:text-white hover:bg-slate-800/60'
            }`}
          >
            <Calendar className="w-4 h-4" /> Progress & Heatmap
          </button>

          <button
            onClick={() => setActiveTab('backup')}
            className={`px-3.5 py-2 rounded-xl text-xs font-black tracking-wide uppercase transition flex items-center gap-2 shrink-0 ${
              activeTab === 'backup'
                ? 'bg-brand-500 text-slate-950 shadow-md shadow-brand-500/20'
                : 'text-slate-400 hover:text-white hover:bg-slate-800/60'
            }`}
          >
            <Cloud className="w-4 h-4" /> Local & Google Drive
          </button>
        </div>
      </nav>

      {/* Main Container */}
      <main className="max-w-6xl mx-auto w-full flex-1 p-4 md:p-8">
        {activeTab === 'today' && (
          <TodayWorkoutView
            profile={profile}
            routines={routines}
            onStartWorkout={handleStartWorkout}
            onOpenCustomBuilder={() => setShowCustomBuilder(true)}
          />
        )}

        {activeTab === 'library' && (
          <ExerciseLibraryView />
        )}

        {activeTab === 'progress' && (
          <ProgressAnalyticsView
            profile={profile}
            logs={logs}
          />
        )}

        {activeTab === 'backup' && (
          <DataBackupView
            profile={profile}
            logs={logs}
            onDataUpdated={reloadData}
          />
        )}
      </main>

      {/* Active Workout Player HUD Modal */}
      {activeWorkoutRoutine && !completedWorkoutResult && (
        <WorkoutPlayerHUD
          routine={activeWorkoutRoutine}
          onFinishWorkout={handleFinishWorkoutHUD}
          onCancelWorkout={() => setActiveWorkoutRoutine(null)}
          soundEnabled={profile.soundEnabled}
          voiceCoachEnabled={profile.voiceCoachEnabled}
          onToggleSound={handleToggleSound}
          onToggleVoice={handleToggleVoice}
        />
      )}

      {/* Workout Complete Celebration Modal */}
      {completedWorkoutResult && activeWorkoutRoutine && (
        <WorkoutCompleteModal
          workoutResult={completedWorkoutResult}
          routine={activeWorkoutRoutine}
          profile={profile}
          onSaveLog={handleSaveWorkoutLog}
          onDismiss={() => {
            setActiveWorkoutRoutine(null);
            setCompletedWorkoutResult(null);
          }}
          onTriggerDriveBackup={() => {
            if (profile.googleDrive.clientId) {
              GoogleDriveService.backupToDrive(profile.googleDrive.clientId);
            }
          }}
        />
      )}

      {/* Custom Routine Builder Modal */}
      {showCustomBuilder && (
        <CustomRoutineModal
          onSaveRoutine={handleSaveCustomRoutine}
          onClose={() => setShowCustomBuilder(false)}
        />
      )}

      {/* Footer */}
      <footer className="border-t border-slate-900 bg-slate-950/80 py-4 px-4 text-center text-xs text-slate-500">
        Maçã Verde Fitness • 100% Local Data Privacy • Tested HIIT for Posture & Metabolic Fat Burn
      </footer>
    </div>
  );
};

export default App;
