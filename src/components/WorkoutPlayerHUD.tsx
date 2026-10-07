import React, { useState, useEffect, useRef, useCallback } from 'react';
import { Play, Pause, SkipForward, SkipBack, X, Volume2, VolumeX, ShieldAlert, Award, Sparkles } from 'lucide-react';
import { WorkoutRoutine } from '../types/fitness';
import { EXERCISES } from '../data/exercises';
import { soundService } from '../services/soundService';

interface WorkoutPlayerHUDProps {
  routine: WorkoutRoutine;
  onFinishWorkout: (result: {
    durationSeconds: number;
    roundsCompleted: number;
    totalRounds: number;
    estimatedCalories: number;
    jumpRopeTurnsEstimated: number;
    deadHangSecondsEstimated: number;
  }) => void;
  onCancelWorkout: () => void;
  soundEnabled: boolean;
  voiceCoachEnabled: boolean;
  onToggleSound: () => void;
  onToggleVoice: () => void;
}

type Phase = 'prep' | 'work' | 'rest' | 'roundRest' | 'finished';

export const WorkoutPlayerHUD: React.FC<WorkoutPlayerHUDProps> = ({
  routine,
  onFinishWorkout,
  onCancelWorkout,
  soundEnabled,
  voiceCoachEnabled,
  onToggleSound,
  onToggleVoice
}) => {
  const [currentRound, setCurrentRound] = useState(1);
  const [exerciseIndex, setExerciseIndex] = useState(0);
  const [phase, setPhase] = useState<Phase>('prep');
  const [timeLeft, setTimeLeft] = useState(routine.prepSeconds || 10);
  const [isPaused, setIsPaused] = useState(false);
  const [totalElapsedSeconds, setTotalElapsedSeconds] = useState(0);

  // Stats accumulation
  const [totalHangSeconds, setTotalHangSeconds] = useState(0);
  const [totalRopeSeconds, setTotalRopeSeconds] = useState(0);

  const currentExerciseItem = routine.exercises[exerciseIndex];
  const currentExercise = EXERCISES[currentExerciseItem?.exerciseId] || {
    id: 'unknown',
    name: 'Exercise',
    equipment: 'bodyweight',
    textNeckCue: 'Keep neck aligned and breathe deeply.',
    targetMuscles: []
  };

  const nextExerciseItem = exerciseIndex + 1 < routine.exercises.length
    ? routine.exercises[exerciseIndex + 1]
    : currentRound < routine.rounds
      ? routine.exercises[0]
      : null;
  const nextExercise = nextExerciseItem ? EXERCISES[nextExerciseItem.exerciseId] : null;

  const totalExercisesInRound = routine.exercises.length;
  const timerRef = useRef<number | null>(null);

  // Sync audio toggles with service
  useEffect(() => {
    soundService.setSoundEnabled(soundEnabled);
  }, [soundEnabled]);

  useEffect(() => {
    soundService.setVoiceCoachEnabled(voiceCoachEnabled);
  }, [voiceCoachEnabled]);

  // Initial speech announcement
  useEffect(() => {
    soundService.speak(`Get ready for ${routine.title}. First up: ${currentExercise.name}`);
  }, [routine.title, currentExercise.name]);

  // Phase transition handler
  const transitionToNext = useCallback(() => {
    if (phase === 'prep') {
      setPhase('work');
      setTimeLeft(currentExerciseItem.workSeconds);
      soundService.playWorkStart();
      soundService.speak(`Work! ${currentExercise.name}. ${currentExercise.textNeckCue ? currentExercise.textNeckCue : ''}`);
    } else if (phase === 'work') {
      // Accumulate equipment stats
      if (currentExercise.equipment === 'door_bar' && currentExercise.id.includes('hang')) {
        setTotalHangSeconds(prev => prev + currentExerciseItem.workSeconds);
      }
      if (currentExercise.equipment === 'rope') {
        setTotalRopeSeconds(prev => prev + currentExerciseItem.workSeconds);
      }

      // Check if end of exercise
      if (exerciseIndex + 1 < totalExercisesInRound) {
        // More exercises in current round
        setPhase('rest');
        setTimeLeft(currentExerciseItem.restSeconds);
        soundService.playRestStart();
        if (nextExercise) {
          soundService.speak(`Rest. Next up: ${nextExercise.name}`);
        }
      } else {
        // Completed all exercises in current round
        if (currentRound < routine.rounds) {
          setPhase('roundRest');
          setTimeLeft(routine.roundRestSeconds);
          soundService.playRestStart();
          soundService.speak(`Round ${currentRound} complete! Take a breather.`);
        } else {
          // Entire routine completed!
          setPhase('finished');
          soundService.playVictory();
          soundService.speak('Workout complete! Incredible effort today!');
          const approxTurns = Math.round(totalRopeSeconds * 2.2);
          onFinishWorkout({
            durationSeconds: totalElapsedSeconds,
            roundsCompleted: currentRound,
            totalRounds: routine.rounds,
            estimatedCalories: routine.estimatedCalories,
            jumpRopeTurnsEstimated: approxTurns,
            deadHangSecondsEstimated: totalHangSeconds
          });
        }
      }
    } else if (phase === 'rest') {
      const nextIdx = exerciseIndex + 1;
      setExerciseIndex(nextIdx);
      const nextItem = routine.exercises[nextIdx];
      const nextEx = EXERCISES[nextItem.exerciseId];
      setPhase('work');
      setTimeLeft(nextItem.workSeconds);
      soundService.playWorkStart();
      soundService.speak(`Work! ${nextEx?.name || 'Next exercise'}`);
    } else if (phase === 'roundRest') {
      setCurrentRound(prev => prev + 1);
      setExerciseIndex(0);
      const firstItem = routine.exercises[0];
      const firstEx = EXERCISES[firstItem.exerciseId];
      setPhase('work');
      setTimeLeft(firstItem.workSeconds);
      soundService.playWorkStart();
      soundService.speak(`Round ${currentRound + 1}! Let's go: ${firstEx?.name || 'Start'}`);
    }
  }, [
    phase,
    currentExerciseItem,
    currentExercise,
    exerciseIndex,
    totalExercisesInRound,
    nextExercise,
    currentRound,
    routine,
    totalRopeSeconds,
    totalHangSeconds,
    totalElapsedSeconds,
    onFinishWorkout
  ]);

  // Main countdown tick
  useEffect(() => {
    if (isPaused || phase === 'finished') return;

    timerRef.current = window.setInterval(() => {
      setTotalElapsedSeconds(prev => prev + 1);

      setTimeLeft(prev => {
        if (prev <= 4 && prev > 1) {
          soundService.playCountdownTick(prev - 1);
        }

        if (prev <= 1) {
          transitionToNext();
          return 0;
        }
        return prev - 1;
      });
    }, 1000);

    return () => {
      if (timerRef.current) clearInterval(timerRef.current);
    };
  }, [isPaused, phase, transitionToNext]);

  // Manual navigation controls
  const handleSkipForward = () => {
    transitionToNext();
  };

  const handleSkipBack = () => {
    if (exerciseIndex > 0) {
      setExerciseIndex(prev => prev - 1);
      setPhase('prep');
      setTimeLeft(5);
    } else if (currentRound > 1) {
      setCurrentRound(prev => prev - 1);
      setExerciseIndex(routine.exercises.length - 1);
      setPhase('prep');
      setTimeLeft(5);
    }
  };

  // Color schemes based on phase
  const getPhaseStyles = () => {
    switch (phase) {
      case 'work':
        return {
          bg: 'bg-emerald-950/40 border-brand-500/50',
          badgeBg: 'bg-brand-500 text-slate-950',
          textAccent: 'text-brand-400',
          progressBar: 'bg-brand-500',
          label: 'WORK NOW'
        };
      case 'rest':
        return {
          bg: 'bg-blue-950/40 border-blue-500/40',
          badgeBg: 'bg-blue-500 text-slate-950',
          textAccent: 'text-blue-400',
          progressBar: 'bg-blue-500',
          label: 'REST & BREATHE'
        };
      case 'roundRest':
        return {
          bg: 'bg-purple-950/40 border-purple-500/40',
          badgeBg: 'bg-purple-500 text-slate-950',
          textAccent: 'text-purple-400',
          progressBar: 'bg-purple-500',
          label: 'ROUND COMPLETE REST'
        };
      case 'prep':
      default:
        return {
          bg: 'bg-amber-950/40 border-amber-500/40',
          badgeBg: 'bg-amber-400 text-slate-950',
          textAccent: 'text-amber-400',
          progressBar: 'bg-amber-400',
          label: 'GET READY'
        };
    }
  };

  const currentStyles = getPhaseStyles();

  // Progress percentage within phase
  const getPhaseDuration = () => {
    if (phase === 'prep') return routine.prepSeconds || 10;
    if (phase === 'work') return currentExerciseItem.workSeconds;
    if (phase === 'rest') return currentExerciseItem.restSeconds;
    if (phase === 'roundRest') return routine.roundRestSeconds;
    return 30;
  };

  const totalPhaseSecs = getPhaseDuration();
  const progressRatio = Math.max(0, Math.min(1, (totalPhaseSecs - timeLeft) / (totalPhaseSecs || 1)));

  // Format MM:SS
  const formatTime = (totalSec: number) => {
    const mins = Math.floor(totalSec / 60);
    const secs = totalSec % 60;
    return `${mins}:${secs < 10 ? '0' : ''}${secs}`;
  };

  const getEquipmentIcon = (eq: string) => {
    if (eq === 'door_bar') return '🚪 Door Pull-up Bar';
    if (eq === 'rope') return '⚡ Jump Rope';
    return '🧘 Bodyweight Mat';
  };

  return (
    <div className="fixed inset-0 z-50 bg-slate-950/95 backdrop-blur-md flex flex-col justify-between p-4 md:p-8 select-none text-slate-100 overflow-y-auto">
      {/* Top Bar HUD */}
      <div className="flex items-center justify-between border-b border-slate-800 pb-4 max-w-4xl mx-auto w-full">
        <div className="flex items-center space-x-3">
          <span className="text-2xl">🍏</span>
          <div>
            <h2 className="font-bold text-sm md:text-base text-slate-200">{routine.title}</h2>
            <p className="text-xs text-slate-400">
              Round {currentRound} of {routine.rounds} • Interval {exerciseIndex + 1} of {totalExercisesInRound}
            </p>
          </div>
        </div>

        <div className="flex items-center space-x-2">
          {/* Sound & Voice controls */}
          <button
            onClick={onToggleSound}
            className={`p-2.5 rounded-lg border transition ${
              soundEnabled ? 'bg-slate-800 border-slate-700 text-brand-400' : 'bg-slate-900 border-slate-800 text-slate-500'
            }`}
            title="Toggle Beeps & Whistles"
          >
            {soundEnabled ? <Volume2 className="w-5 h-5" /> : <VolumeX className="w-5 h-5" />}
          </button>

          <button
            onClick={onToggleVoice}
            className={`px-3 py-1.5 rounded-lg border text-xs font-semibold transition ${
              voiceCoachEnabled ? 'bg-brand-500/20 border-brand-500/40 text-brand-300' : 'bg-slate-900 border-slate-800 text-slate-500'
            }`}
            title="Toggle Spoken Voice Coaching"
          >
            {voiceCoachEnabled ? '🗣️ Voice On' : 'Voice Off'}
          </button>

          {/* Close / Quit */}
          <button
            onClick={() => {
              if (window.confirm('Quit workout now? Your progress for this session will not be saved.')) {
                onCancelWorkout();
              }
            }}
            className="p-2.5 rounded-lg bg-red-950/40 hover:bg-red-900/60 border border-red-800/40 text-red-300 transition"
            title="Cancel Workout"
          >
            <X className="w-5 h-5" />
          </button>
        </div>
      </div>

      {/* Main Center Countdown Stage */}
      <div className="max-w-2xl mx-auto w-full my-auto flex flex-col items-center text-center">
        {/* Phase Pill */}
        <div className={`px-4 py-1.5 rounded-full text-xs font-black tracking-widest uppercase mb-4 shadow-lg ${currentStyles.badgeBg}`}>
          {currentStyles.label}
        </div>

        {/* Big Giant Timer Numbers */}
        <div className="relative flex items-center justify-center my-2">
          <div
            className={`w-64 h-64 md:w-80 md:h-80 rounded-full flex flex-col items-center justify-center border-4 shadow-2xl transition-all duration-300 ${currentStyles.bg}`}
          >
            <span className="text-8xl md:text-9xl font-black tracking-tight tabular-nums font-mono drop-shadow-md">
              {timeLeft}
            </span>
            <span className="text-xs uppercase tracking-wider text-slate-400 font-medium mt-1">
              Seconds Remaining
            </span>
          </div>

          {/* Progress ring track simulation */}
          <div className="absolute inset-x-0 -bottom-6 w-72 md:w-96 mx-auto h-2 bg-slate-800 rounded-full overflow-hidden">
            <div
              className={`h-full transition-all duration-1000 ease-linear ${currentStyles.progressBar}`}
              style={{ width: `${progressRatio * 100}%` }}
            />
          </div>
        </div>

        {/* Exercise Info Box */}
        <div className="mt-10 w-full bg-slate-900/90 border border-slate-800 rounded-2xl p-5 shadow-xl">
          <div className="flex flex-wrap items-center justify-between gap-2 mb-2">
            <span className="text-xs font-bold px-2.5 py-1 rounded-md bg-slate-800 text-slate-300 border border-slate-700">
              {getEquipmentIcon(currentExercise.equipment)}
            </span>
            <span className="text-xs text-brand-400 font-semibold flex items-center gap-1">
              <Sparkles className="w-3.5 h-3.5" /> Total Time: {formatTime(totalElapsedSeconds)}
            </span>
          </div>

          <h3 className="text-2xl md:text-3xl font-extrabold text-white tracking-tight mb-2">
            {phase === 'prep' ? `Up Next: ${currentExercise.name}` : currentExercise.name}
          </h3>

          {/* CRITICAL TEXT NECK POSTURE COACHING CALLOUT */}
          {currentExercise.textNeckCue && (
            <div className="mt-3 p-3.5 bg-brand-950/40 border border-brand-500/30 rounded-xl text-left flex items-start gap-3">
              <ShieldAlert className="w-5 h-5 text-brand-400 shrink-0 mt-0.5" />
              <div>
                <span className="text-xs font-black tracking-wide uppercase text-brand-400 block mb-0.5">
                  POSTURE & TEXT-NECK CUE
                </span>
                <p className="text-sm font-medium text-slate-200 leading-snug">
                  {currentExercise.textNeckCue}
                </p>
              </div>
            </div>
          )}

          {/* Form cues / cadence tip */}
          {currentExercise.cadenceTip && (
            <p className="mt-2 text-xs text-slate-400 italic">
              ⚡ Cadence: {currentExercise.cadenceTip}
            </p>
          )}
        </div>

        {/* Up Next Teaser */}
        {nextExercise && phase !== 'prep' && (
          <div className="mt-4 text-xs text-slate-400 flex items-center justify-center gap-2">
            <span>Next up:</span>
            <span className="font-semibold text-slate-200">{nextExercise.name}</span>
            <span className="text-slate-500">({getEquipmentIcon(nextExercise.equipment)})</span>
          </div>
        )}
      </div>

      {/* Bottom Controls Bar */}
      <div className="max-w-xl mx-auto w-full pt-4 border-t border-slate-800/80 flex items-center justify-center gap-4">
        <button
          onClick={handleSkipBack}
          disabled={exerciseIndex === 0 && currentRound === 1}
          className="p-3.5 rounded-full bg-slate-900 border border-slate-800 hover:border-slate-700 disabled:opacity-40 transition active:scale-95"
          title="Previous Interval"
        >
          <SkipBack className="w-5 h-5 text-slate-300" />
        </button>

        <button
          onClick={() => setIsPaused(!isPaused)}
          className={`px-8 py-3.5 rounded-full font-bold text-sm tracking-wide uppercase shadow-lg transition active:scale-95 flex items-center gap-2 ${
            isPaused
              ? 'bg-brand-500 text-slate-950 hover:bg-brand-400'
              : 'bg-slate-800 hover:bg-slate-700 text-white border border-slate-700'
          }`}
        >
          {isPaused ? (
            <>
              <Play className="w-5 h-5 fill-current" /> Resume
            </>
          ) : (
            <>
              <Pause className="w-5 h-5" /> Pause
            </>
          )}
        </button>

        <button
          onClick={handleSkipForward}
          className="p-3.5 rounded-full bg-slate-900 border border-slate-800 hover:border-slate-700 transition active:scale-95"
          title="Skip to Next Interval"
        >
          <SkipForward className="w-5 h-5 text-slate-300" />
        </button>
      </div>
    </div>
  );
};
