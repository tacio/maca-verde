import React from 'react';
import { Brain, HeartPulse, AlertTriangle, ShieldCheck, Zap, Sparkles, CheckCircle2, Flame, ArrowRight, MessageSquare, Battery } from 'lucide-react';
import { MoodLogEntry, EmotionalControlDrillLog, HALTState } from '../types/mood';

interface MoodAndMindViewProps {
  moodLogs: MoodLogEntry[];
  drills: EmotionalControlDrillLog[];
  onOpenMoodModal: (initialHalt?: Partial<HALTState>) => void;
  onOpenDrillModal: (elevatedPulse?: boolean) => void;
}

export const MoodAndMindView: React.FC<MoodAndMindViewProps> = ({
  moodLogs,
  drills,
  onOpenMoodModal,
  onOpenDrillModal
}) => {
  const latestMood = moodLogs.length > 0 ? moodLogs[0] : null;
  const isHaltTriggered = latestMood?.halt && (latestMood.halt.hungry || latestMood.halt.angry || latestMood.halt.lonely || latestMood.halt.tired);

  const getValenceBadge = (valence: string) => {
    switch (valence) {
      case 'great':
        return { label: 'Great & Grounded', color: 'bg-emerald-950/60 text-emerald-300 border-emerald-800' };
      case 'good':
        return { label: 'Good & Steady', color: 'bg-brand-950/60 text-brand-300 border-brand-800' };
      case 'frustrated':
        return { label: 'Upset / Irritated', color: 'bg-red-950/60 text-red-300 border-red-800' };
      case 'exhausted':
        return { label: 'Exhausted', color: 'bg-purple-950/60 text-purple-300 border-purple-800' };
      case 'anxious':
        return { label: 'Tense / Anxious', color: 'bg-blue-950/60 text-blue-300 border-blue-800' };
      default:
        return { label: 'Neutral / Focused', color: 'bg-slate-800 text-slate-300 border-slate-700' };
    }
  };

  return (
    <div className="space-y-6">
      {/* Top Banner: Mind-Body Command */}
      <div className="relative overflow-hidden rounded-2xl bg-gradient-to-br from-indigo-950/70 via-slate-900 to-slate-950 border border-indigo-500/30 p-5 md:p-6 shadow-2xl">
        <div className="flex flex-wrap items-center justify-between gap-4 mb-4">
          <div className="flex items-center gap-3">
            <div className="p-3 rounded-2xl bg-indigo-500/20 border border-indigo-500/40 text-indigo-300">
              <Brain className="w-7 h-7" />
            </div>
            <div>
              <h2 className="text-xl md:text-2xl font-black text-white">Emotional Self-Command & Interoception</h2>
              <p className="text-xs text-slate-300">Think before speaking • Awareness under hunger, fatigue, and arousal</p>
            </div>
          </div>

          <div className="flex gap-2">
            <button
              onClick={() => onOpenMoodModal()}
              className="px-4 py-2.5 rounded-xl bg-brand-500 hover:bg-brand-400 text-slate-950 font-black text-xs uppercase tracking-wider transition shadow-lg flex items-center gap-1.5"
            >
              <Sparkles className="w-4 h-4" /> Check-in Mood
            </button>
            <button
              onClick={() => onOpenDrillModal(false)}
              className="px-4 py-2.5 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white font-bold text-xs uppercase tracking-wider transition shadow-lg flex items-center gap-1.5"
            >
              <Zap className="w-4 h-4" /> High-Pulse Drill
            </button>
          </div>
        </div>

        {/* Current State Radar Card */}
        <div className="p-4 rounded-xl bg-slate-950/70 border border-slate-800">
          <div className="flex flex-wrap items-center justify-between gap-2 mb-2">
            <span className="text-xs font-bold uppercase tracking-wider text-slate-400 flex items-center gap-1.5">
              <HeartPulse className="w-4 h-4 text-brand-400" /> Current Mental Status:
            </span>
            {latestMood ? (
              <span className={`text-xs font-bold px-2.5 py-0.5 rounded-full border ${getValenceBadge(latestMood.valence).color}`}>
                {getValenceBadge(latestMood.valence).label}
              </span>
            ) : (
              <span className="text-xs text-slate-400 italic">No check-in yet today</span>
            )}
          </div>

          {/* HALT Warning Banner if active */}
          {isHaltTriggered ? (
            <div className="p-3 rounded-lg bg-amber-950/50 border border-amber-500/40 text-amber-200 text-xs flex items-start gap-2.5 mt-2">
              <AlertTriangle className="w-5 h-5 text-amber-400 shrink-0 mt-0.5" />
              <div>
                <strong className="block text-amber-300 text-xs uppercase tracking-wide">
                  ⚠️ PREFRONTAL BUFFER COMPROMISED (H.A.L.T. ALERT)
                </strong>
                <p className="mt-0.5 leading-relaxed">
                  You are currently{' '}
                  {[
                    latestMood?.halt.hungry && 'Hungry',
                    latestMood?.halt.angry && 'Upset',
                    latestMood?.halt.lonely && 'Isolated',
                    latestMood?.halt.tired && 'Tired',
                  ].filter(Boolean).join(' + ')}.
                  <strong> Do not react or send impulsive messages.</strong> Enforce the 5-second silence rule before speaking.
                </p>
              </div>
            </div>
          ) : (
            <div className="p-2.5 rounded-lg bg-emerald-950/30 border border-emerald-500/30 text-emerald-300 text-xs flex items-center gap-2 mt-2">
              <ShieldCheck className="w-4 h-4 text-emerald-400 shrink-0" />
              <span>Speech Filter Clear: Prefrontal self-control is biologically supported.</span>
            </div>
          )}
        </div>
      </div>

      {/* The Mind-Body Science Grid */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <div className="bg-slate-900 border border-slate-800 rounded-2xl p-5 shadow-lg">
          <div className="w-10 h-10 rounded-xl bg-orange-950/60 border border-orange-500/30 text-orange-400 flex items-center justify-center mb-3">
            <Flame className="w-5 h-5" />
          </div>
          <h3 className="font-bold text-white text-sm mb-1.5">Heart Rate & Vagal Brake</h3>
          <p className="text-xs text-slate-300 leading-relaxed">
            When you spike heart rate with jump rope intervals and deliberately practice pausing for 10 seconds, you train your brain's vagus nerve to brake emotional outbursts under real-life pressure.
          </p>
        </div>

        <div className="bg-slate-900 border border-slate-800 rounded-2xl p-5 shadow-lg">
          <div className="w-10 h-10 rounded-xl bg-brand-950/60 border border-brand-500/30 text-brand-400 flex items-center justify-center mb-3">
            <HeartPulse className="w-5 h-5" />
          </div>
          <h3 className="font-bold text-white text-sm mb-1.5">Posture Decompression</h3>
          <p className="text-xs text-slate-300 leading-relaxed">
            Forward head posture ("text neck") compresses the suboccipital nerves at the base of the skull, maintaining constant sympathetic arousal. Decompressing on the door bar directly soothes irritability.
          </p>
        </div>

        <div className="bg-slate-900 border border-slate-800 rounded-2xl p-5 shadow-lg">
          <div className="w-10 h-10 rounded-xl bg-blue-950/60 border border-blue-500/30 text-blue-400 flex items-center justify-center mb-3">
            <MessageSquare className="w-5 h-5" />
          </div>
          <h3 className="font-bold text-white text-sm mb-1.5">The 5-Second Speech Rule</h3>
          <p className="text-xs text-slate-300 leading-relaxed">
            The limbic urge to blurt out defensive words takes 250ms; prefrontal reason takes 3 to 5 seconds. A forced 5-second silence allows you to choose your words rather than letting fatigue speak for you.
          </p>
        </div>
      </div>

      {/* History of Emotional Check-ins & Drills */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {/* Mood Log List */}
        <div className="bg-slate-900 border border-slate-800 rounded-2xl p-5">
          <h3 className="font-bold text-white text-sm mb-3 flex items-center justify-between">
            <span>Emotional Logs ({moodLogs.length})</span>
            <button onClick={() => onOpenMoodModal()} className="text-xs text-brand-400 hover:underline">
              + New Check-in
            </button>
          </h3>

          {moodLogs.length === 0 ? (
            <div className="text-xs text-slate-500 py-6 text-center">
              No mood check-ins yet. Take 15 seconds to log your current feelings!
            </div>
          ) : (
            <div className="space-y-2.5 max-h-80 overflow-y-auto pr-1">
              {moodLogs.map(log => {
                const badge = getValenceBadge(log.valence);
                return (
                  <div key={log.id} className="p-3 rounded-xl bg-slate-950 border border-slate-800/80">
                    <div className="flex items-center justify-between gap-2 mb-1">
                      <span className={`text-[10px] font-bold px-2 py-0.5 rounded border ${badge.color}`}>
                        {badge.label}
                      </span>
                      <span className="text-[10px] text-slate-500">{log.date}</span>
                    </div>

                    <div className="flex flex-wrap gap-1 mt-1.5">
                      {log.halt.hungry && <span className="text-[10px] px-1.5 py-0.5 rounded bg-amber-950 text-amber-400 border border-amber-800">🍎 Hungry</span>}
                      {log.halt.angry && <span className="text-[10px] px-1.5 py-0.5 rounded bg-red-950 text-red-400 border border-red-800">⚡ Upset</span>}
                      {log.halt.lonely && <span className="text-[10px] px-1.5 py-0.5 rounded bg-purple-950 text-purple-400 border border-purple-800">👤 Lonely</span>}
                      {log.halt.tired && <span className="text-[10px] px-1.5 py-0.5 rounded bg-blue-950 text-blue-400 border border-blue-800">🥱 Tired</span>}
                    </div>

                    {log.thoughtBeforeSpeakingRating && (
                      <div className="text-[11px] text-slate-400 mt-1.5">
                        Speech Discipline: <span className="text-brand-400 font-bold">{log.thoughtBeforeSpeakingRating}/5 stars</span>
                      </div>
                    )}

                    {log.notes && (
                      <p className="text-xs text-slate-300 italic mt-1 border-l-2 border-slate-800 pl-2">
                        "{log.notes}"
                      </p>
                    )}
                  </div>
                );
              })}
            </div>
          )}
        </div>

        {/* High Pulse Drills History */}
        <div className="bg-slate-900 border border-slate-800 rounded-2xl p-5">
          <h3 className="font-bold text-white text-sm mb-3 flex items-center justify-between">
            <span>High-Pulse Control Drills ({drills.length})</span>
            <button onClick={() => onOpenDrillModal(false)} className="text-xs text-indigo-400 hover:underline">
              + Launch Drill
            </button>
          </h3>

          {drills.length === 0 ? (
            <div className="text-xs text-slate-500 py-6 text-center">
              No stress inoculation drills logged. Practice controlling your words while your pulse is high!
            </div>
          ) : (
            <div className="space-y-2.5 max-h-80 overflow-y-auto pr-1">
              {drills.map(drill => (
                <div key={drill.id} className="p-3 rounded-xl bg-slate-950 border border-slate-800/80">
                  <div className="flex items-center justify-between gap-2 mb-1">
                    <span className="text-xs font-bold text-white flex items-center gap-1.5">
                      <Zap className="w-3.5 h-3.5 text-indigo-400" /> 10s Somatic Pause
                    </span>
                    <span className="text-[10px] text-slate-500">{drill.date}</span>
                  </div>

                  <p className="text-xs text-slate-300 mt-1">
                    {drill.reflection || 'Rehearsed prefrontal cognitive response during elevated heart rate.'}
                  </p>

                  <div className="mt-1.5 flex items-center gap-2 text-[10px] text-emerald-400 font-bold">
                    <CheckCircle2 className="w-3.5 h-3.5" /> Impulse Successfully Inhibited
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
