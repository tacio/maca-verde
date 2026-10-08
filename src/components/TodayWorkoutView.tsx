import React, { useState } from 'react';
import {
  Play,
  Flame,
  Award,
  Sparkles,
  Plus,
  Clock,
  Zap,
  Target,
  CheckCircle2,
  Brain,
  AlertTriangle,
  ShieldCheck,
  HeartPulse,
  ChevronDown,
  ChevronUp,
  Info
} from 'lucide-react';
import { WorkoutRoutine, UserFitnessProfile, DailyOverloadChallenge } from '../types/fitness';
import { MoodLogEntry, HALTState } from '../types/mood';
import { OverloadEngine } from '../services/overloadEngine';
import { getLocalizedExercises } from '../data/localizedData';
import { TRANSLATIONS } from '../i18n/translations';

interface TodayWorkoutViewProps {
  profile: UserFitnessProfile;
  routines: WorkoutRoutine[];
  latestMood: MoodLogEntry | null;
  onStartWorkout: (routine: WorkoutRoutine) => void;
  onOpenCustomBuilder: () => void;
  onOpenMoodModal: (initialHalt?: Partial<HALTState>) => void;
  onOpenDrillModal: (elevatedPulse?: boolean) => void;
}

export const TodayWorkoutView: React.FC<TodayWorkoutViewProps> = ({
  profile,
  routines,
  latestMood,
  onStartWorkout,
  onOpenCustomBuilder,
  onOpenMoodModal,
  onOpenDrillModal
}) => {
  const lang = profile.language || 'pt-BR';
  const t = TRANSLATIONS[lang];
  const localizedExercises = getLocalizedExercises(lang);

  const dailyChallenge: DailyOverloadChallenge = OverloadEngine.getDailyChallenge(profile);
  const [selectedRoutineId, setSelectedRoutineId] = useState<string>(dailyChallenge.routineId || routines[0]?.id || 'daily-adaptive-overload');
  const [showExercisesList, setShowExercisesList] = useState(false);
  const [showMissionScience, setShowMissionScience] = useState(false);

  const selectedRoutine = routines.find(r => r.id === selectedRoutineId) || routines[0];
  const scaledRoutine = OverloadEngine.scaleRoutineForUser(selectedRoutine, profile);

  const isTodayCompleted = profile.lastCompletedDate === new Date().toISOString().split('T')[0];

  const isHaltTriggered = latestMood?.halt && (
    latestMood.halt.hungry || latestMood.halt.angry || latestMood.halt.lonely || latestMood.halt.tired
  );

  const getHaltReasons = () => {
    if (!latestMood?.halt) return '';
    const reasons: string[] = [];
    if (latestMood.halt.hungry) reasons.push(lang === 'pt-BR' ? 'Fome 🍎' : 'Hungry 🍎');
    if (latestMood.halt.angry) reasons.push(lang === 'pt-BR' ? 'Irritação ⚡' : 'Upset ⚡');
    if (latestMood.halt.lonely) reasons.push(lang === 'pt-BR' ? 'Solidão 👤' : 'Lonely 👤');
    if (latestMood.halt.tired) reasons.push(lang === 'pt-BR' ? 'Cansaço 🥱' : 'Tired 🥱');
    return reasons.join(', ');
  };

  return (
    <div className="space-y-5">
      {/* 1. TOP STATUS & QUICK ACTIONS BAR */}
      <div className="flex flex-wrap items-center justify-between gap-3 p-4 rounded-2xl bg-slate-900 border border-slate-800 shadow-md">
        <div className="flex items-center gap-2.5">
          <div className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-orange-950/70 border border-orange-500/40 text-orange-400 font-black text-sm">
            <Flame className="w-4 h-4 fill-current text-orange-400" />
            <span>{t.streakLabel.replace('{count}', String(profile.currentStreak))}</span>
          </div>

          <div className="flex items-center gap-1 px-2.5 py-1.5 rounded-xl bg-slate-800/80 border border-slate-700/80 text-xs font-semibold text-slate-300">
            <Award className="w-3.5 h-3.5 text-brand-400" />
            <span>{t.athleteLevel.replace('{level}', String(profile.level))}</span>
          </div>

          {isTodayCompleted && (
            <span className="flex items-center gap-1 text-xs font-bold text-emerald-400 bg-emerald-950/60 border border-emerald-800 px-2.5 py-1 rounded-xl">
              <CheckCircle2 className="w-3.5 h-3.5" /> {t.todayHabitDone}
            </span>
          )}
        </div>

        {/* Quick Check-in & Pause Buttons */}
        <div className="flex items-center gap-2">
          <button
            onClick={() => onOpenMoodModal()}
            className="px-3 py-1.5 rounded-xl bg-slate-800 hover:bg-slate-700 border border-slate-700 text-xs font-bold text-slate-200 transition flex items-center gap-1.5"
          >
            <Brain className="w-3.5 h-3.5 text-brand-400" />
            <span>{latestMood ? t.updateMoodBtn : t.checkinMoodBtn}</span>
          </button>
          <button
            onClick={() => onOpenDrillModal(false)}
            className="px-3 py-1.5 rounded-xl bg-indigo-950/70 hover:bg-indigo-900 border border-indigo-700/50 text-xs font-bold text-indigo-300 transition flex items-center gap-1.5"
          >
            <Zap className="w-3.5 h-3.5 text-indigo-400" />
            <span>{t.pulsePauseDrillBtn}</span>
          </button>
        </div>
      </div>

      {/* 2. DAILY +1% MISSION (Clean Card with Progressive Disclosure) */}
      <div className="relative overflow-hidden rounded-2xl bg-gradient-to-br from-brand-950/40 via-slate-900 to-slate-950 border border-brand-500/20 p-5 shadow-lg">
        <div className="flex items-start justify-between gap-3">
          <div className="space-y-1">
            <div className="flex items-center gap-2">
              <Sparkles className="w-4 h-4 text-brand-400" />
              <span className="text-[11px] font-black uppercase tracking-wider text-brand-400">
                {t.todayMissionTitle}
              </span>
            </div>
            <h2 className="text-lg sm:text-xl font-extrabold text-white">
              {dailyChallenge.title}
            </h2>
          </div>

          <button
            onClick={() => setShowMissionScience(!showMissionScience)}
            className="p-1.5 rounded-lg bg-slate-800/80 hover:bg-slate-700 text-slate-400 hover:text-white transition"
            title={showMissionScience ? t.hideDetails : t.viewDetails}
          >
            <Info className="w-4 h-4" />
          </button>
        </div>

        {/* Target Badge */}
        <div className="mt-3 flex flex-wrap items-center gap-2">
          <span className="px-3 py-1 rounded-lg bg-brand-500/10 border border-brand-500/30 text-xs font-bold text-brand-300">
            🎯 {dailyChallenge.bonusTarget}
          </span>

          {/* Compact HALT status pill */}
          {isHaltTriggered ? (
            <span className="px-3 py-1 rounded-lg bg-amber-950/60 border border-amber-500/40 text-amber-300 text-xs font-medium flex items-center gap-1.5">
              <AlertTriangle className="w-3.5 h-3.5 text-amber-400" />
              <span>{t.haltAlertActive.replace('{reasons}', getHaltReasons())}</span>
            </span>
          ) : (
            <span className="px-2.5 py-1 rounded-lg bg-slate-950 border border-slate-800 text-slate-400 text-xs flex items-center gap-1.5">
              <ShieldCheck className="w-3.5 h-3.5 text-emerald-400" />
              <span>{t.haltShieldClear}</span>
            </span>
          )}
        </div>

        {/* Optional Collapsible Science & Quote (Clean Progressive Disclosure) */}
        {showMissionScience && (
          <div className="mt-4 pt-3 border-t border-slate-800/80 space-y-2 animate-in fade-in duration-200">
            <p className="text-xs text-slate-300 leading-relaxed">
              {dailyChallenge.description}
            </p>
            <p className="text-xs italic text-slate-400 border-l-2 border-brand-500/50 pl-2.5">
              "{dailyChallenge.motivationalQuote}"
            </p>
          </div>
        )}
      </div>

      {/* 3. PROTOCOL SELECTOR (Clean Cards Grid) */}
      <div>
        <div className="flex items-center justify-between mb-2.5">
          <h3 className="text-xs font-black uppercase tracking-wider text-slate-400 flex items-center gap-1.5">
            <Target className="w-3.5 h-3.5 text-brand-400" /> {t.chooseProtocol}
          </h3>
          <button
            onClick={onOpenCustomBuilder}
            className="text-xs font-semibold text-brand-400 hover:text-brand-300 flex items-center gap-1 transition"
          >
            <Plus className="w-3.5 h-3.5" /> {t.buildCustomRoutine}
          </button>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-2.5">
          {routines.map(routine => {
            const isSelected = routine.id === selectedRoutineId;
            return (
              <button
                key={routine.id}
                onClick={() => setSelectedRoutineId(routine.id)}
                className={`text-left p-3.5 rounded-xl border transition-all duration-200 relative ${
                  isSelected
                    ? 'bg-slate-900 border-brand-500 shadow-md ring-1 ring-brand-500/30'
                    : 'bg-slate-950/60 border-slate-800 hover:border-slate-700 hover:bg-slate-900/40'
                }`}
              >
                {routine.isDailyRecommended && (
                  <span className="absolute top-2.5 right-2.5 text-[9px] font-black uppercase tracking-wider px-1.5 py-0.5 rounded bg-brand-500 text-slate-950 font-mono">
                    {t.recommended}
                  </span>
                )}

                <h4 className={`font-bold text-sm mb-1 pr-16 ${isSelected ? 'text-brand-300' : 'text-slate-200'}`}>
                  {routine.title}
                </h4>

                <div className="flex items-center gap-2.5 text-[11px] text-slate-400 font-medium mt-2">
                  <span className="flex items-center gap-1">
                    <Clock className="w-3 h-3 text-slate-500" /> ~{routine.estimatedDurationMinutes}m
                  </span>
                  <span className="flex items-center gap-1">
                    <Zap className="w-3 h-3 text-orange-400" /> ~{routine.estimatedCalories} kcal
                  </span>
                  <span className="capitalize px-1.5 py-0.5 rounded bg-slate-800 text-[10px] text-slate-300">
                    {routine.protocol}
                  </span>
                </div>
              </button>
            );
          })}
        </div>
      </div>

      {/* 4. SELECTED ROUTINE & BIG START ACTION */}
      <div className="bg-slate-900 border border-slate-800 rounded-2xl p-5 shadow-lg">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div>
            <div className="flex items-center gap-2 mb-1">
              <span className="px-2 py-0.5 rounded text-[10px] font-black uppercase tracking-wider bg-brand-500/20 text-brand-400 border border-brand-500/30">
                {scaledRoutine.primaryGoal.replace('_', ' ')}
              </span>
              <span className="text-xs text-slate-400">
                {t.roundCount
                  .replace('{rounds}', String(scaledRoutine.rounds))
                  .replace('{count}', String(scaledRoutine.exercises.length))}
              </span>
            </div>
            <h3 className="text-xl font-black text-white">{scaledRoutine.title}</h3>
            <p className="text-xs text-slate-400 mt-0.5 max-w-lg line-clamp-2">{scaledRoutine.description}</p>
          </div>

          <button
            onClick={() => onStartWorkout(scaledRoutine)}
            className="w-full sm:w-auto px-7 py-3.5 rounded-xl bg-brand-500 hover:bg-brand-400 text-slate-950 font-black text-sm tracking-wider uppercase shadow-lg shadow-brand-500/20 active:scale-95 transition flex items-center justify-center gap-2 shrink-0 group"
          >
            <Play className="w-4 h-4 fill-current group-hover:scale-110 transition-transform" />
            <span>{t.startWorkoutNow}</span>
          </button>
        </div>

        {/* Collapsible Exercise Intervals Toggle */}
        <div className="mt-4 pt-3 border-t border-slate-800">
          <button
            onClick={() => setShowExercisesList(!showExercisesList)}
            className="flex items-center justify-between w-full text-xs font-bold uppercase tracking-wider text-slate-400 hover:text-slate-200 transition py-1"
          >
            <span>{t.intervalsBreakdown} ({scaledRoutine.exercises.length})</span>
            {showExercisesList ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}
          </button>

          {showExercisesList && (
            <div className="space-y-1.5 mt-2.5 animate-in fade-in duration-200">
              {scaledRoutine.exercises.map((item, idx) => {
                const ex = localizedExercises[item.exerciseId];
                if (!ex) return null;
                return (
                  <div
                    key={idx}
                    className="flex items-center justify-between p-2.5 rounded-xl bg-slate-950/60 border border-slate-800/80"
                  >
                    <div className="flex items-center gap-2.5">
                      <span className="w-5 h-5 rounded-full bg-slate-800 flex items-center justify-center text-[10px] font-mono font-bold text-slate-400">
                        {idx + 1}
                      </span>
                      <div>
                        <span className="font-bold text-xs text-slate-200">{ex.name}</span>
                        <span className="text-[10px] text-brand-400/90 block font-medium">
                          🛡️ {ex.textNeckCue}
                        </span>
                      </div>
                    </div>

                    <div className="text-right shrink-0">
                      <span className="text-xs font-mono font-bold text-white">
                        {t.workRestInterval.replace('{work}', String(item.workSeconds)).replace('{rest}', String(item.restSeconds))}
                      </span>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
