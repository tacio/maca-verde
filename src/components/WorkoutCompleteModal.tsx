import React, { useState, useEffect } from 'react';
import confetti from 'canvas-confetti';
import { Trophy, Flame, HeartPulse, Activity, CheckCircle, Cloud, ArrowRight } from 'lucide-react';
import { WorkoutLogEntry, UserFitnessProfile, WorkoutRoutine } from '../types/fitness';
import { TRANSLATIONS } from '../i18n/translations';

interface WorkoutCompleteModalProps {
  workoutResult: {
    durationSeconds: number;
    roundsCompleted: number;
    totalRounds: number;
    estimatedCalories: number;
    jumpRopeTurnsEstimated: number;
    deadHangSecondsEstimated: number;
  };
  routine: WorkoutRoutine;
  profile: UserFitnessProfile;
  onSaveLog: (entry: Omit<WorkoutLogEntry, 'id' | 'timestamp'>) => void;
  onDismiss: () => void;
  onTriggerDriveBackup?: () => void;
  onTriggerEmotionalDrill?: () => void;
}

export const WorkoutCompleteModal: React.FC<WorkoutCompleteModalProps> = ({
  workoutResult,
  routine,
  profile,
  onSaveLog,
  onDismiss,
  onTriggerDriveBackup,
  onTriggerEmotionalDrill
}) => {
  const lang = profile.language || 'pt-BR';
  const t = TRANSLATIONS[lang];

  const [rpe, setRpe] = useState<number>(7);
  const [neckDiscomfort, setNeckDiscomfort] = useState<number>(2);
  const [actualRopeTurns, setActualRopeTurns] = useState<number>(workoutResult.jumpRopeTurnsEstimated || 0);
  const [actualHangSeconds, setActualHangSeconds] = useState<number>(workoutResult.deadHangSecondsEstimated || 30);
  const [notes, setNotes] = useState<string>('');

  // Fire confetti upon mounting
  useEffect(() => {
    try {
      confetti({
        particleCount: 100,
        spread: 70,
        origin: { y: 0.6 }
      });
    } catch {
      // Fallback
    }
  }, []);

  const formatDuration = (totalSec: number) => {
    const mins = Math.floor(totalSec / 60);
    const secs = totalSec % 60;
    return `${mins}m ${secs}s`;
  };

  const handleSave = () => {
    const todayStr = new Date().toISOString().split('T')[0];
    onSaveLog({
      date: todayStr,
      routineId: routine.id,
      routineTitle: routine.title,
      protocol: routine.protocol,
      durationSeconds: workoutResult.durationSeconds,
      roundsCompleted: workoutResult.roundsCompleted,
      totalRounds: workoutResult.totalRounds,
      estimatedCalories: workoutResult.estimatedCalories,
      jumpRopeTurns: actualRopeTurns,
      deadHangSeconds: actualHangSeconds,
      rpeRating: rpe,
      neckDiscomfortScore: neckDiscomfort,
      overloadNotes: notes,
      personalRecordBeaten: actualHangSeconds > profile.personalRecords.maxDeadHangSeconds || actualRopeTurns > profile.personalRecords.maxSingleSetRopeJumps
    });
  };

  const getNeckTensionText = () => {
    if (neckDiscomfort <= 2) return `(${t.painFree})`;
    if (neckDiscomfort <= 5) return `(${t.mildTension})`;
    return `(${t.severeTension})`;
  };

  return (
    <div className="fixed inset-0 z-50 bg-black/85 backdrop-blur-sm flex items-center justify-center p-4 overflow-y-auto">
      <div className="bg-slate-900 border border-brand-500/30 rounded-2xl max-w-lg w-full p-6 text-slate-100 shadow-2xl relative">
        {/* Celebration Header */}
        <div className="text-center mb-6">
          <div className="w-16 h-16 rounded-full bg-brand-500/20 border border-brand-500/40 text-brand-400 mx-auto flex items-center justify-center mb-3">
            <Trophy className="w-8 h-8" />
          </div>
          <h2 className="text-2xl font-black text-white">{t.workoutCrushed}</h2>
          <p className="text-xs text-brand-400 font-semibold uppercase tracking-wider mt-1">
            {t.adaptationLocked}
          </p>
        </div>

        {/* Key stats row */}
        <div className="grid grid-cols-3 gap-3 mb-6">
          <div className="bg-slate-950/80 border border-slate-800 rounded-xl p-3 text-center">
            <span className="text-xs text-slate-400 font-medium block">{t.statTime}</span>
            <span className="text-lg font-bold text-white font-mono">
              {formatDuration(workoutResult.durationSeconds)}
            </span>
          </div>

          <div className="bg-slate-950/80 border border-slate-800 rounded-xl p-3 text-center">
            <span className="text-xs text-slate-400 font-medium block">{t.statCalories}</span>
            <span className="text-lg font-bold text-brand-400 font-mono">
              ~{workoutResult.estimatedCalories} kcal
            </span>
          </div>

          <div className="bg-slate-950/80 border border-slate-800 rounded-xl p-3 text-center">
            <span className="text-xs text-slate-400 font-medium block">{t.statRounds}</span>
            <span className="text-lg font-bold text-white font-mono">
              {workoutResult.roundsCompleted}/{workoutResult.totalRounds}
            </span>
          </div>
        </div>

        {/* Check-in Questions */}
        <div className="space-y-4 mb-6">
          {/* Posture & Neck Check */}
          <div className="bg-slate-950/50 border border-slate-800/80 p-3.5 rounded-xl">
            <div className="flex justify-between items-center mb-1">
              <label className="text-xs font-bold text-slate-300 flex items-center gap-1.5">
                <HeartPulse className="w-4 h-4 text-emerald-400" />
                {t.neckTensionLabel}
              </label>
              <span className={`text-xs font-bold px-2 py-0.5 rounded ${neckDiscomfort <= 3 ? 'bg-emerald-950 text-emerald-400 border border-emerald-800' : 'bg-amber-950 text-amber-400 border border-amber-800'}`}>
                {neckDiscomfort}/10 {getNeckTensionText()}
              </span>
            </div>
            <p className="text-[11px] text-slate-400 mb-2">
              {t.neckTensionHint}
            </p>
            <input
              type="range"
              min="0"
              max="10"
              value={neckDiscomfort}
              onChange={(e) => setNeckDiscomfort(Number(e.target.value))}
              className="w-full accent-brand-500 cursor-pointer"
            />
          </div>

          {/* RPE Exertion */}
          <div className="bg-slate-950/50 border border-slate-800/80 p-3.5 rounded-xl">
            <div className="flex justify-between items-center mb-1">
              <label className="text-xs font-bold text-slate-300 flex items-center gap-1.5">
                <Activity className="w-4 h-4 text-brand-400" />
                {t.rpeLabel}
              </label>
              <span className="text-xs font-bold px-2 py-0.5 rounded bg-brand-950 text-brand-400 border border-brand-800">
                Level {rpe} / 10
              </span>
            </div>
            <p className="text-[11px] text-slate-400 mb-2">
              {t.rpeHint}
            </p>
            <input
              type="range"
              min="1"
              max="10"
              value={rpe}
              onChange={(e) => setRpe(Number(e.target.value))}
              className="w-full accent-brand-500 cursor-pointer"
            />
          </div>

          {/* Jump rope / Door bar inputs */}
          <div className="grid grid-cols-2 gap-3">
            <div className="bg-slate-950/50 border border-slate-800/80 p-3 rounded-xl">
              <label className="text-xs font-bold text-slate-300 block mb-1">
                {t.jumpRopeTurnsInput}
              </label>
              <input
                type="number"
                value={actualRopeTurns}
                onChange={(e) => setActualRopeTurns(Math.max(0, parseInt(e.target.value) || 0))}
                className="w-full bg-slate-900 border border-slate-700 rounded-lg px-3 py-1.5 text-sm font-mono text-white focus:outline-none focus:border-brand-500"
              />
            </div>

            <div className="bg-slate-950/50 border border-slate-800/80 p-3 rounded-xl">
              <label className="text-xs font-bold text-slate-300 block mb-1">
                {t.deadHangSecondsInput}
              </label>
              <input
                type="number"
                value={actualHangSeconds}
                onChange={(e) => setActualHangSeconds(Math.max(0, parseInt(e.target.value) || 0))}
                className="w-full bg-slate-900 border border-slate-700 rounded-lg px-3 py-1.5 text-sm font-mono text-white focus:outline-none focus:border-brand-500"
              />
            </div>
          </div>

          {/* Quick Notes */}
          <div>
            <input
              type="text"
              placeholder={t.notesPlaceholder}
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3.5 py-2 text-xs text-slate-300 focus:outline-none focus:border-brand-500"
            />
          </div>
        </div>

        {/* Action Buttons */}
        <div className="space-y-2">
          <button
            onClick={handleSave}
            className="w-full py-3.5 rounded-xl bg-brand-500 hover:bg-brand-400 text-slate-950 font-black text-sm tracking-wide uppercase transition shadow-lg active:scale-98 flex items-center justify-center gap-2"
          >
            <CheckCircle className="w-5 h-5" /> {t.saveAndAdvanceStreak}
          </button>

          {/* Direct Bridge to High-Heart-Rate Emotional Drill */}
          <button
            onClick={() => {
              handleSave();
              if (onTriggerEmotionalDrill) {
                onTriggerEmotionalDrill();
              }
            }}
            className="w-full py-2.5 rounded-xl bg-indigo-950/80 hover:bg-indigo-900 border border-indigo-700/60 text-indigo-200 text-xs font-bold transition flex items-center justify-center gap-2"
          >
            <span className="text-sm">🫀</span> {t.saveAndDoDrill}
          </button>

          {profile.googleDrive.clientId && onTriggerDriveBackup && (
            <button
              onClick={() => {
                handleSave();
                onTriggerDriveBackup();
              }}
              className="w-full py-2 rounded-xl bg-slate-800 hover:bg-slate-750 text-xs font-semibold text-slate-300 border border-slate-700 transition flex items-center justify-center gap-2"
            >
              <Cloud className="w-4 h-4 text-blue-400" /> {t.saveAndBackupDrive}
            </button>
          )}
        </div>
      </div>
    </div>
  );
};
