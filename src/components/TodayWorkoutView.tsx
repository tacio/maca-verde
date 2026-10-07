import React, { useState } from 'react';
import { Play, Flame, Award, ShieldAlert, Sparkles, Plus, Clock, Zap, Target, CheckCircle2, Brain, AlertTriangle, ShieldCheck, HeartPulse } from 'lucide-react';
import { WorkoutRoutine, UserFitnessProfile, DailyOverloadChallenge } from '../types/fitness';
import { MoodLogEntry, HALTState } from '../types/mood';
import { EXERCISES } from '../data/exercises';
import { OverloadEngine } from '../services/overloadEngine';

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
  const dailyChallenge: DailyOverloadChallenge = OverloadEngine.getDailyChallenge(profile);
  const [selectedRoutineId, setSelectedRoutineId] = useState<string>(dailyChallenge.routineId || routines[0].id);

  const selectedRoutine = routines.find(r => r.id === selectedRoutineId) || routines[0];
  const scaledRoutine = OverloadEngine.scaleRoutineForUser(selectedRoutine, profile);

  const isTodayCompleted = profile.lastCompletedDate === new Date().toISOString().split('T')[0];

  const isHaltTriggered = latestMood?.halt && (
    latestMood.halt.hungry || latestMood.halt.angry || latestMood.halt.lonely || latestMood.halt.tired
  );

  return (
    <div className="space-y-6">
      {/* UNIFIED DUAL GLASS PANE: Physical + Emotional Command Banner */}
      <div className="relative overflow-hidden rounded-2xl bg-gradient-to-br from-brand-950/80 via-slate-900 to-slate-950 border border-brand-500/30 p-5 md:p-6 shadow-2xl">
        <div className="absolute top-0 right-0 -mr-8 -mt-8 w-40 h-40 bg-brand-500/10 rounded-full blur-3xl pointer-events-none" />

        {/* Top Badges */}
        <div className="flex flex-wrap items-center justify-between gap-3 mb-4">
          <div className="flex items-center gap-2.5">
            <div className="flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-orange-950/80 border border-orange-500/40 text-orange-400 font-black text-sm shadow-inner">
              <Flame className="w-5 h-5 fill-current animate-pulse-fast text-orange-400" />
              <span>{profile.currentStreak} DAY STREAK</span>
            </div>

            <div className="flex items-center gap-1 px-3 py-1.5 rounded-full bg-slate-800/80 border border-slate-700 text-xs font-semibold text-slate-300">
              <Award className="w-4 h-4 text-brand-400" />
              <span>LVL {profile.level} ATHLETE</span>
            </div>

            {isTodayCompleted && (
              <span className="flex items-center gap-1 text-xs font-bold text-emerald-400 bg-emerald-950/70 border border-emerald-800 px-2.5 py-1 rounded-full">
                <CheckCircle2 className="w-3.5 h-3.5" /> WORKOUT DONE
              </span>
            )}
          </div>

          {/* Quick Mind-Body Actions */}
          <div className="flex items-center gap-2">
            <button
              onClick={() => onOpenMoodModal()}
              className="px-3 py-1.5 rounded-xl bg-slate-800 hover:bg-slate-700 border border-slate-700 text-xs font-bold text-slate-200 transition flex items-center gap-1.5"
            >
              <Brain className="w-3.5 h-3.5 text-brand-400" />
              <span>{latestMood ? 'Update Mood' : 'Check-in Mood'}</span>
            </button>
            <button
              onClick={() => onOpenDrillModal(false)}
              className="px-3 py-1.5 rounded-xl bg-indigo-950/80 hover:bg-indigo-900 border border-indigo-700/60 text-xs font-bold text-indigo-300 transition flex items-center gap-1.5"
            >
              <Zap className="w-3.5 h-3.5 text-indigo-400" />
              <span>Pulse Pause Drill</span>
            </button>
          </div>
        </div>

        {/* EMOTIONAL & HALT RADAR (Single Glass Pane) */}
        <div className="mb-4 p-3.5 rounded-xl bg-slate-950/80 border border-slate-800/90">
          <div className="flex flex-wrap items-center justify-between gap-2">
            <div className="flex items-center gap-2">
              <HeartPulse className="w-4 h-4 text-emerald-400" />
              <span className="text-xs font-black uppercase tracking-wider text-slate-300">
                Emotional Control & H.A.L.T. Radar
              </span>
            </div>

            {latestMood ? (
              <span className="text-xs font-bold text-slate-300 capitalize">
                State: <span className="text-brand-300">{latestMood.valence}</span> (Energy: {latestMood.energyLevel}/5)
              </span>
            ) : (
              <span className="text-xs text-slate-400">Baseline not logged today</span>
            )}
          </div>

          {isHaltTriggered ? (
            <div className="mt-2.5 p-2.5 rounded-lg bg-amber-950/50 border border-amber-500/40 text-amber-200 text-xs flex items-center justify-between gap-2">
              <div className="flex items-center gap-2">
                <AlertTriangle className="w-4 h-4 text-amber-400 shrink-0" />
                <span>
                  <strong>H.A.L.T. Shield:</strong> You are{' '}
                  {[
                    latestMood?.halt.hungry && 'Hungry 🍎',
                    latestMood?.halt.angry && 'Upset ⚡',
                    latestMood?.halt.lonely && 'Lonely 👤',
                    latestMood?.halt.tired && 'Tired 🥱'
                  ].filter(Boolean).join(', ')}. <em>Count to 5 before speaking.</em>
                </span>
              </div>
              <button
                onClick={() => onOpenDrillModal(false)}
                className="text-[11px] font-bold underline text-amber-300 hover:text-white shrink-0"
              >
                Practice 10s Pause →
              </button>
            </div>
          ) : (
            <div className="mt-2 text-xs text-slate-400 flex items-center gap-1.5">
              <ShieldCheck className="w-3.5 h-3.5 text-emerald-400" />
              <span>Prefrontal inhibition supported. Remember: <em>Raise your heart rate to strengthen your emotional brake.</em></span>
            </div>
          )}
        </div>

        {/* The +1% Challenge of the Day */}
        <div className="bg-slate-950/60 border border-slate-800/80 rounded-xl p-4 mb-4">
          <div className="flex items-center gap-2 mb-1">
            <Sparkles className="w-4 h-4 text-brand-400" />
            <span className="text-xs font-black tracking-wider uppercase text-brand-400">
              TODAY'S +1% PHYSICAL & MENTAL OVERLOAD MISSION
            </span>
          </div>
          <h2 className="text-lg md:text-xl font-extrabold text-white">
            {dailyChallenge.title}
          </h2>
          <p className="text-sm text-slate-300 mt-1 leading-relaxed">
            {dailyChallenge.description}
          </p>
          <div className="mt-3 inline-block px-3 py-1 rounded-md bg-brand-500/10 border border-brand-500/30 text-xs font-semibold text-brand-300">
            🎯 {dailyChallenge.bonusTarget}
          </div>
        </div>

        {/* Motivational Quote */}
        <p className="text-xs italic text-slate-400 border-l-2 border-brand-500/50 pl-3">
          "{dailyChallenge.motivationalQuote}"
        </p>
      </div>

      {/* Routine Selector Carousel / Grid */}
      <div>
        <div className="flex items-center justify-between mb-3">
          <h3 className="text-sm font-black uppercase tracking-wider text-slate-400 flex items-center gap-1.5">
            <Target className="w-4 h-4 text-brand-400" /> Choose Today's Protocol
          </h3>
          <button
            onClick={onOpenCustomBuilder}
            className="text-xs font-semibold text-brand-400 hover:text-brand-300 flex items-center gap-1 transition"
          >
            <Plus className="w-3.5 h-3.5" /> Build Custom Routine
          </button>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
          {routines.map(routine => {
            const isSelected = routine.id === selectedRoutineId;
            return (
              <button
                key={routine.id}
                onClick={() => setSelectedRoutineId(routine.id)}
                className={`text-left p-4 rounded-xl border transition-all duration-200 relative ${
                  isSelected
                    ? 'bg-slate-900 border-brand-500 shadow-lg shadow-brand-500/10 ring-1 ring-brand-500/40'
                    : 'bg-slate-950/60 border-slate-800/80 hover:border-slate-700 hover:bg-slate-900/40'
                }`}
              >
                {routine.isDailyRecommended && (
                  <span className="absolute top-3 right-3 text-[10px] font-black uppercase tracking-widest px-2 py-0.5 rounded bg-brand-500 text-slate-950 font-mono">
                    RECOMMENDED
                  </span>
                )}

                <h4 className={`font-bold text-base mb-1 ${isSelected ? 'text-brand-300' : 'text-slate-200'}`}>
                  {routine.title}
                </h4>
                <p className="text-xs text-slate-400 line-clamp-1 mb-3">
                  {routine.subtitle}
                </p>

                <div className="flex items-center gap-3 text-xs text-slate-400 font-medium">
                  <span className="flex items-center gap-1">
                    <Clock className="w-3.5 h-3.5 text-slate-500" /> ~{routine.estimatedDurationMinutes}m
                  </span>
                  <span className="flex items-center gap-1">
                    <Zap className="w-3.5 h-3.5 text-orange-400" /> ~{routine.estimatedCalories} kcal
                  </span>
                  <span className="capitalize px-1.5 py-0.5 rounded bg-slate-800 text-[10px] text-slate-300 border border-slate-700">
                    {routine.protocol}
                  </span>
                </div>
              </button>
            );
          })}
        </div>
      </div>

      {/* Selected Routine Detail & Launch Panel */}
      <div className="bg-slate-900/90 border border-slate-800 rounded-2xl p-6 shadow-xl">
        <div className="flex flex-wrap items-start justify-between gap-4 mb-4 pb-4 border-b border-slate-800">
          <div>
            <div className="flex items-center gap-2 mb-1">
              <span className="px-2 py-0.5 rounded text-[11px] font-black uppercase tracking-wider bg-brand-500/20 text-brand-400 border border-brand-500/30">
                {scaledRoutine.primaryGoal.replace('_', ' ')}
              </span>
              <span className="text-xs text-slate-400">
                {scaledRoutine.rounds} Rounds • {scaledRoutine.exercises.length} Exercises per Round
              </span>
            </div>
            <h3 className="text-2xl font-black text-white">{scaledRoutine.title}</h3>
            <p className="text-xs text-slate-400 mt-1 max-w-xl">{scaledRoutine.description}</p>
          </div>

          {/* Big Start Workout Button */}
          <button
            onClick={() => onStartWorkout(scaledRoutine)}
            className="w-full sm:w-auto px-8 py-4 rounded-xl bg-brand-500 hover:bg-brand-400 text-slate-950 font-black text-base tracking-wide uppercase shadow-lg shadow-brand-500/20 active:scale-95 transition flex items-center justify-center gap-2 group"
          >
            <Play className="w-5 h-5 fill-current group-hover:scale-110 transition-transform" />
            <span>START WORKOUT NOW</span>
          </button>
        </div>

        {/* Exercises Sequence Breakdown */}
        <div>
          <h4 className="text-xs font-black uppercase tracking-wider text-slate-400 mb-3">
            Intervals Breakdown (Micro-Overload Adjusted)
          </h4>
          <div className="space-y-2">
            {scaledRoutine.exercises.map((item, idx) => {
              const ex = EXERCISES[item.exerciseId];
              if (!ex) return null;
              return (
                <div
                  key={idx}
                  className="flex items-center justify-between p-3 rounded-xl bg-slate-950/60 border border-slate-800/80 hover:border-slate-700/80 transition"
                >
                  <div className="flex items-center gap-3">
                    <span className="w-6 h-6 rounded-full bg-slate-800 flex items-center justify-center text-xs font-mono font-bold text-slate-400">
                      {idx + 1}
                    </span>
                    <div>
                      <div className="flex items-center gap-2">
                        <span className="font-bold text-sm text-slate-200">{ex.name}</span>
                        <span className="text-[10px] px-1.5 py-0.5 rounded bg-slate-800 text-slate-400">
                          {ex.equipment === 'door_bar' ? '🚪 Door Bar' : ex.equipment === 'rope' ? '⚡ Rope' : '🧘 Bodyweight'}
                        </span>
                      </div>
                      <p className="text-xs text-brand-400/90 font-medium">
                        🛡️ {ex.textNeckCue}
                      </p>
                    </div>
                  </div>

                  <div className="text-right shrink-0">
                    <span className="text-xs font-mono font-bold text-white block">
                      {item.workSeconds}s Work / {item.restSeconds}s Rest
                    </span>
                    {item.targetIntensity && (
                      <span className="text-[10px] text-slate-400">{item.targetIntensity}</span>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      </div>
    </div>
  );
};
