import React, { useState, useEffect } from 'react';
import { Flame, Dumbbell, Calendar, Cloud, Volume2, VolumeX, Sparkles, Brain, AlertTriangle, Settings, Globe } from 'lucide-react';
import { UserFitnessProfile, WorkoutLogEntry, WorkoutRoutine } from './types/fitness';
import { MoodLogEntry, EmotionalControlDrillLog, HALTState } from './types/mood';
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
import { MoodTrackerModal } from './components/MoodTrackerModal';
import { ThinkBeforeSpeakDrill } from './components/ThinkBeforeSpeakDrill';
import { MoodAndMindView } from './components/MoodAndMindView';
import { SettingsView } from './components/SettingsView';
import { GoogleDriveService } from './services/googleDriveService';
import { OnboardingModal } from './components/OnboardingModal';
import { DemoTourModal } from './components/DemoTourModal';
import { Language, TRANSLATIONS } from './i18n/translations';
import { getLocalizedRoutines } from './data/localizedData';

export const App: React.FC = () => {
  const [profile, setProfile] = useState<UserFitnessProfile>(StorageService.getProfile());
  const [logs, setLogs] = useState<WorkoutLogEntry[]>(StorageService.getLogs());
  const [customRoutines, setCustomRoutines] = useState<WorkoutRoutine[]>(StorageService.getCustomRoutines());
  const [moodLogs, setMoodLogs] = useState<MoodLogEntry[]>(StorageService.getMoodLogs());
  const [emotionalDrills, setEmotionalDrills] = useState<EmotionalControlDrillLog[]>(StorageService.getEmotionalDrills());

  const [activeTab, setActiveTab] = useState<'today' | 'mind' | 'library' | 'progress' | 'backup' | 'settings'>('today');

  const lang: Language = profile.language || 'pt-BR';
  const t = TRANSLATIONS[lang];

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

  // Modals
  const [showCustomBuilder, setShowCustomBuilder] = useState(false);
  const [showMoodModal, setShowMoodModal] = useState(false);
  const [initialMoodHalt, setInitialMoodHalt] = useState<Partial<HALTState> | undefined>(undefined);
  const [showDrillModal, setShowDrillModal] = useState(false);
  const [drillElevatedPulse, setDrillElevatedPulse] = useState(false);

  // Onboarding & Demo Tour
  const [showOnboarding, setShowOnboarding] = useState(
    profile.hasCompletedOnboarding === false || (profile.hasCompletedOnboarding === undefined && profile.totalWorkouts === 0)
  );
  const [showTourModal, setShowTourModal] = useState(false);
  const [tourStep, setTourStep] = useState(1);

  // Refresh data from storage
  const reloadData = () => {
    setProfile(StorageService.getProfile());
    setLogs(StorageService.getLogs());
    setCustomRoutines(StorageService.getCustomRoutines());
    setMoodLogs(StorageService.getMoodLogs());
    setEmotionalDrills(StorageService.getEmotionalDrills());
  };

  useEffect(() => {
    reloadData();
  }, []);

  // Quick toggle language
  const handleToggleLanguage = () => {
    const nextLang: Language = lang === 'pt-BR' ? 'en' : 'pt-BR';
    const updated: UserFitnessProfile = { ...profile, language: nextLang };
    setProfile(updated);
    StorageService.saveProfile(updated);
    soundService.speak(nextLang === 'pt-BR' ? 'Português ativado' : 'English enabled', nextLang);
  };

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

  const handleFinishOnboarding = (updatedProfile: UserFitnessProfile, startTour: boolean) => {
    setProfile(updatedProfile);
    StorageService.saveProfile(updatedProfile);
    setShowOnboarding(false);
    if (startTour) {
      setTourStep(1);
      setShowTourModal(true);
    }
  };

  const handleLaunchTour = () => {
    setTourStep(1);
    setShowTourModal(true);
  };

  const handleLaunchOnboarding = () => {
    setShowOnboarding(true);
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

  // Save Mood entry
  const handleSaveMood = (moodData: Omit<MoodLogEntry, 'id' | 'timestamp'>) => {
    const newMood: MoodLogEntry = {
      ...moodData,
      id: `mood-${Date.now()}`,
      timestamp: Date.now()
    };
    const updated = StorageService.addMoodLog(newMood);
    setMoodLogs(updated);
  };

  // Save Emotional Control Drill
  const handleCompleteEmotionalDrill = (drillData: Omit<EmotionalControlDrillLog, 'id' | 'timestamp'>) => {
    const newDrill: EmotionalControlDrillLog = {
      ...drillData,
      id: `drill-${Date.now()}`,
      timestamp: Date.now()
    };
    const updated = StorageService.addEmotionalDrill(newDrill);
    setEmotionalDrills(updated);
  };

  // Save custom routine
  const handleSaveCustomRoutine = (newRoutine: WorkoutRoutine) => {
    const existing = StorageService.getCustomRoutines();
    const updated = [newRoutine, ...existing];
    StorageService.saveCustomRoutines(updated);
    setCustomRoutines(updated);
  };

  const latestMood = moodLogs.length > 0 ? moodLogs[0] : null;
  const isHaltTriggered = latestMood?.halt && (
    latestMood.halt.hungry || latestMood.halt.angry || latestMood.halt.lonely || latestMood.halt.tired
  );

  // Localized routines combination
  const allCurrentRoutines: WorkoutRoutine[] = [...getLocalizedRoutines(lang), ...customRoutines];

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
                {t.appTitle} <span className="text-brand-400 font-mono text-xs">{t.appBadge}</span>
              </h1>
              <p className="text-[10px] text-slate-400 font-semibold tracking-wide">
                {t.appSubtitle}
              </p>
            </div>
          </div>

          {/* Quick Streak & Dual Mind-Body Indicators */}
          <div className="flex items-center space-x-2 md:space-x-3">
            {/* Quick Language Toggle */}
            <button
              onClick={handleToggleLanguage}
              className="px-2.5 py-1 rounded-lg border text-xs font-bold transition flex items-center gap-1 bg-slate-900 border-slate-700 hover:border-brand-500/50 text-slate-200"
              title={lang === 'pt-BR' ? 'Alternar para Inglês' : 'Switch to Portuguese'}
            >
              <Globe className="w-3.5 h-3.5 text-brand-400" />
              <span>{lang === 'pt-BR' ? '🇧🇷 PT' : '🇺🇸 EN'}</span>
            </button>

            {/* Quick Tour Button */}
            <button
              onClick={handleLaunchTour}
              className="p-2 rounded-lg border text-xs font-bold transition flex items-center justify-center bg-slate-900 border-slate-700 hover:border-brand-500/50 text-brand-400"
              title={t.tourRestartBtn}
            >
              <Sparkles className="w-4 h-4" />
            </button>

            {/* Streak Counter */}
            <div className="flex items-center gap-1.5 px-3 py-1 rounded-full bg-orange-950/60 border border-orange-500/40 text-orange-400 text-xs font-black shadow-inner">
              <Flame className="w-4 h-4 fill-current text-orange-400" />
              <span>{t.streakBadge.replace('{count}', String(profile.currentStreak))}</span>
            </div>

            {/* HALT Status Quick Shield */}
            {isHaltTriggered ? (
              <button
                onClick={() => {
                  setDrillElevatedPulse(false);
                  setShowDrillModal(true);
                }}
                className="hidden sm:flex items-center gap-1.5 px-3 py-1 rounded-full bg-amber-950/70 border border-amber-500/40 text-amber-300 text-xs font-bold transition hover:bg-amber-900/60"
                title={lang === 'pt-BR' ? 'Reserva baixa! Toque para acionar a pausa de 5s' : 'Biological buffer low! Tap to activate 5s speech pause'}
              >
                <AlertTriangle className="w-3.5 h-3.5 text-amber-400" />
                <span>{lang === 'pt-BR' ? 'Escudo H.A.L.T.' : 'HALT Shield Active'}</span>
              </button>
            ) : (
              <button
                onClick={() => {
                  setInitialMoodHalt(undefined);
                  setShowMoodModal(true);
                }}
                className="hidden sm:flex items-center gap-1 px-3 py-1 rounded-full bg-slate-900 border border-slate-800 text-slate-300 text-xs font-semibold hover:border-slate-700"
                title={lang === 'pt-BR' ? 'Toque para registrar humor' : 'Tap to check-in mood'}
              >
                <Brain className="w-3.5 h-3.5 text-brand-400" />
                <span>{latestMood ? `${lang === 'pt-BR' ? 'Humor' : 'Mood'}: ${latestMood.valence}` : t.checkinMoodBtn}</span>
              </button>
            )}

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
              className={`hidden md:flex px-2.5 py-1 rounded-lg border text-[11px] font-bold transition items-center gap-1 ${
                profile.voiceCoachEnabled ? 'bg-brand-500/15 border-brand-500/40 text-brand-300' : 'bg-slate-950 border-slate-800 text-slate-500'
              }`}
              title="Toggle Spoken Voice Coach"
            >
              🗣️ {profile.voiceCoachEnabled ? t.voiceOn : t.voiceOff}
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
            <Sparkles className="w-4 h-4" /> {t.tabToday}
          </button>

          <button
            onClick={() => setActiveTab('mind')}
            className={`px-3.5 py-2 rounded-xl text-xs font-black tracking-wide uppercase transition flex items-center gap-2 shrink-0 ${
              activeTab === 'mind'
                ? 'bg-brand-500 text-slate-950 shadow-md shadow-brand-500/20'
                : 'text-slate-400 hover:text-white hover:bg-slate-800/60'
            }`}
          >
            <Brain className="w-4 h-4" /> {t.tabMind}
          </button>

          <button
            onClick={() => setActiveTab('library')}
            className={`px-3.5 py-2 rounded-xl text-xs font-black tracking-wide uppercase transition flex items-center gap-2 shrink-0 ${
              activeTab === 'library'
                ? 'bg-brand-500 text-slate-950 shadow-md shadow-brand-500/20'
                : 'text-slate-400 hover:text-white hover:bg-slate-800/60'
            }`}
          >
            <Dumbbell className="w-4 h-4" /> {t.tabLibrary}
          </button>

          <button
            onClick={() => setActiveTab('progress')}
            className={`px-3.5 py-2 rounded-xl text-xs font-black tracking-wide uppercase transition flex items-center gap-2 shrink-0 ${
              activeTab === 'progress'
                ? 'bg-brand-500 text-slate-950 shadow-md shadow-brand-500/20'
                : 'text-slate-400 hover:text-white hover:bg-slate-800/60'
            }`}
          >
            <Calendar className="w-4 h-4" /> {t.tabProgress}
          </button>

          <button
            onClick={() => setActiveTab('backup')}
            className={`px-3.5 py-2 rounded-xl text-xs font-black tracking-wide uppercase transition flex items-center gap-2 shrink-0 ${
              activeTab === 'backup'
                ? 'bg-brand-500 text-slate-950 shadow-md shadow-brand-500/20'
                : 'text-slate-400 hover:text-white hover:bg-slate-800/60'
            }`}
          >
            <Cloud className="w-4 h-4" /> {t.tabBackup}
          </button>

          <button
            onClick={() => setActiveTab('settings')}
            className={`px-3.5 py-2 rounded-xl text-xs font-black tracking-wide uppercase transition flex items-center gap-2 shrink-0 ${
              activeTab === 'settings'
                ? 'bg-brand-500 text-slate-950 shadow-md shadow-brand-500/20'
                : 'text-slate-400 hover:text-white hover:bg-slate-800/60'
            }`}
          >
            <Settings className="w-4 h-4" /> {t.tabSettings}
          </button>
        </div>
      </nav>

      {/* Main Container */}
      <main className="max-w-6xl mx-auto w-full flex-1 p-4 md:p-8">
        {activeTab === 'today' && (
          <TodayWorkoutView
            profile={profile}
            routines={allCurrentRoutines}
            latestMood={latestMood}
            onStartWorkout={handleStartWorkout}
            onOpenCustomBuilder={() => setShowCustomBuilder(true)}
            onOpenMoodModal={(initial) => {
              setInitialMoodHalt(initial);
              setShowMoodModal(true);
            }}
            onOpenDrillModal={(elevated) => {
              setDrillElevatedPulse(elevated ?? false);
              setShowDrillModal(true);
            }}
          />
        )}

        {activeTab === 'mind' && (
          <MoodAndMindView
            language={lang}
            moodLogs={moodLogs}
            drills={emotionalDrills}
            onOpenMoodModal={(initial) => {
              setInitialMoodHalt(initial);
              setShowMoodModal(true);
            }}
            onOpenDrillModal={(elevated) => {
              setDrillElevatedPulse(elevated ?? false);
              setShowDrillModal(true);
            }}
          />
        )}

        {activeTab === 'library' && (
          <ExerciseLibraryView language={lang} />
        )}

        {activeTab === 'progress' && (
          <ProgressAnalyticsView
            profile={profile}
            logs={logs}
            moodLogs={moodLogs}
            language={lang}
          />
        )}

        {activeTab === 'backup' && (
          <DataBackupView
            profile={profile}
            logs={logs}
            onDataUpdated={reloadData}
            language={lang}
          />
        )}

        {activeTab === 'settings' && (
          <SettingsView
            profile={profile}
            onUpdateProfile={(updated) => {
              setProfile(updated);
              reloadData();
            }}
            onLaunchTour={handleLaunchTour}
            onLaunchOnboarding={handleLaunchOnboarding}
          />
        )}
      </main>

      {/* Active Workout Player HUD Modal */}
      {activeWorkoutRoutine && !completedWorkoutResult && (
        <WorkoutPlayerHUD
          routine={activeWorkoutRoutine}
          language={lang}
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
          onTriggerEmotionalDrill={() => {
            setDrillElevatedPulse(true);
            setShowDrillModal(true);
          }}
        />
      )}

      {/* Custom Routine Builder Modal */}
      {showCustomBuilder && (
        <CustomRoutineModal
          language={lang}
          onSaveRoutine={handleSaveCustomRoutine}
          onClose={() => setShowCustomBuilder(false)}
        />
      )}

      {/* Mood Tracker Modal */}
      {showMoodModal && (
        <MoodTrackerModal
          language={lang}
          onSaveMood={handleSaveMood}
          onClose={() => setShowMoodModal(false)}
          initialHalt={initialMoodHalt}
        />
      )}

      {/* Think Before You Speak / High-Pulse Emotional Control Drill */}
      {showDrillModal && (
        <ThinkBeforeSpeakDrill
          language={lang}
          onCompleteDrill={handleCompleteEmotionalDrill}
          onClose={() => setShowDrillModal(false)}
          initialHeartRateElevated={drillElevatedPulse}
        />
      )}

      {/* Full Onboarding Wizard Modal */}
      {showOnboarding && (
        <OnboardingModal
          currentProfile={profile}
          language={lang}
          onLanguageChange={(newLang) => {
            const updated = { ...profile, language: newLang };
            setProfile(updated);
            StorageService.saveProfile(updated);
          }}
          onFinishOnboarding={handleFinishOnboarding}
          onImportBackup={() => {
            reloadData();
            setShowOnboarding(false);
          }}
        />
      )}

      {/* Interactive Guided Demo Tour */}
      {showTourModal && (
        <DemoTourModal
          language={lang}
          currentStep={tourStep}
          onStepChange={(step) => setTourStep(step)}
          onCloseTour={() => {
            setShowTourModal(false);
            const updated = { ...profile, hasSeenTour: true };
            setProfile(updated);
            StorageService.saveProfile(updated);
          }}
          onTabChange={(tab) => setActiveTab(tab)}
        />
      )}

      {/* Footer */}
      <footer className="border-t border-slate-900 bg-slate-950/80 py-4 px-4 text-center text-xs text-slate-500">
        Maçã Verde Fitness & Mood • 100% Local Data Privacy • Tested HIIT for Posture, Belly Fat, & Prefrontal Emotional Control
      </footer>
    </div>
  );
};

export default App;
