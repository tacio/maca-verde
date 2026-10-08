import React, { useState } from 'react';
import { Brain, HeartPulse, AlertTriangle, ShieldCheck, Zap, Sparkles, CheckCircle2, Flame, MessageSquare, Info, ChevronDown, ChevronUp } from 'lucide-react';
import { MoodLogEntry, EmotionalControlDrillLog, HALTState } from '../types/mood';
import { Language, TRANSLATIONS } from '../i18n/translations';

interface MoodAndMindViewProps {
  language?: Language;
  moodLogs: MoodLogEntry[];
  drills: EmotionalControlDrillLog[];
  onOpenMoodModal: (initialHalt?: Partial<HALTState>) => void;
  onOpenDrillModal: (elevatedPulse?: boolean) => void;
}

export const MoodAndMindView: React.FC<MoodAndMindViewProps> = ({
  language = 'pt-BR',
  moodLogs,
  drills,
  onOpenMoodModal,
  onOpenDrillModal
}) => {
  const t = TRANSLATIONS[language];
  const [showScienceDetails, setShowScienceDetails] = useState(false);
  const latestMood = moodLogs.length > 0 ? moodLogs[0] : null;
  const isHaltTriggered = latestMood?.halt && (latestMood.halt.hungry || latestMood.halt.angry || latestMood.halt.lonely || latestMood.halt.tired);

  const getValenceBadge = (valence: string) => {
    if (language === 'pt-BR') {
      switch (valence) {
        case 'great':
          return { label: 'Ótimo & Centrado', color: 'bg-emerald-950/60 text-emerald-300 border-emerald-800' };
        case 'good':
          return { label: 'Bem & Estável', color: 'bg-brand-950/60 text-brand-300 border-brand-800' };
        case 'frustrated':
          return { label: 'Irritado / Bravo', color: 'bg-red-950/60 text-red-300 border-red-800' };
        case 'exhausted':
          return { label: 'Exausto', color: 'bg-purple-950/60 text-purple-300 border-purple-800' };
        case 'anxious':
          return { label: 'Tenso / Ansioso', color: 'bg-blue-950/60 text-blue-300 border-blue-800' };
        default:
          return { label: 'Neutro / Focado', color: 'bg-slate-800 text-slate-300 border-slate-700' };
      }
    }

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

  const haltTags = [
    latestMood?.halt.hungry && (language === 'pt-BR' ? 'Fome 🍎' : 'Hungry 🍎'),
    latestMood?.halt.angry && (language === 'pt-BR' ? 'Irritação ⚡' : 'Upset ⚡'),
    latestMood?.halt.lonely && (language === 'pt-BR' ? 'Solidão 👤' : 'Lonely 👤'),
    latestMood?.halt.tired && (language === 'pt-BR' ? 'Cansaço 🥱' : 'Tired 🥱'),
  ].filter(Boolean);

  return (
    <div className="space-y-5">
      {/* 1. TOP HEADER & CURRENT RADAR CARD */}
      <div className="bg-slate-900 border border-slate-800 rounded-2xl p-5 shadow-lg space-y-4">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
          <div className="flex items-center gap-3">
            <div className="p-2.5 rounded-2xl bg-indigo-500/10 border border-indigo-500/30 text-indigo-400">
              <Brain className="w-6 h-6" />
            </div>
            <div>
              <h2 className="text-xl font-black text-white">{t.mindHubTitle}</h2>
              <p className="text-xs text-slate-400">{t.mindHubSubtitle}</p>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <button
              onClick={() => onOpenMoodModal()}
              className="px-3.5 py-2 rounded-xl bg-brand-500 hover:bg-brand-400 text-slate-950 font-black text-xs uppercase tracking-wider transition shadow-md flex items-center gap-1.5"
            >
              <Sparkles className="w-3.5 h-3.5" /> {t.checkinMoodBtn}
            </button>
            <button
              onClick={() => onOpenDrillModal(false)}
              className="px-3.5 py-2 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white font-bold text-xs uppercase tracking-wider transition shadow-md flex items-center gap-1.5"
            >
              <Zap className="w-3.5 h-3.5" /> {t.pulsePauseDrillBtn}
            </button>
          </div>
        </div>

        {/* Current State Status Bar */}
        <div className="p-3 rounded-xl bg-slate-950/80 border border-slate-800 flex flex-wrap items-center justify-between gap-2">
          <div className="flex items-center gap-2 text-xs">
            <HeartPulse className="w-4 h-4 text-brand-400" />
            <span className="font-bold text-slate-300">{t.currentState}:</span>
            {latestMood ? (
              <span className={`text-[11px] font-bold px-2 py-0.5 rounded border ${getValenceBadge(latestMood.valence).color}`}>
                {getValenceBadge(latestMood.valence).label} (⚡ {latestMood.energyLevel}/5)
              </span>
            ) : (
              <span className="text-slate-400 italic text-[11px]">{t.noCheckinToday}</span>
            )}
          </div>

          {isHaltTriggered ? (
            <span className="text-[11px] font-bold text-amber-300 bg-amber-950/60 border border-amber-500/40 px-2.5 py-1 rounded-lg flex items-center gap-1">
              <AlertTriangle className="w-3.5 h-3.5 text-amber-400" />
              <span>{haltTags.join(' + ')} • {language === 'pt-BR' ? 'Silêncio 5s ativado' : '5s silence active'}</span>
            </span>
          ) : (
            <span className="text-[11px] text-emerald-400 bg-emerald-950/40 border border-emerald-800 px-2.5 py-1 rounded-lg flex items-center gap-1">
              <ShieldCheck className="w-3.5 h-3.5 text-emerald-400" />
              <span>{language === 'pt-BR' ? 'Freio Pré-Frontal Firme' : 'Prefrontal Brake Steady'}</span>
            </span>
          )}
        </div>
      </div>

      {/* 2. PROGRESSIVE DISCLOSURE: Science Behind It (Collapsible) */}
      <div className="bg-slate-900/60 border border-slate-800 rounded-2xl p-4">
        <button
          onClick={() => setShowScienceDetails(!showScienceDetails)}
          className="flex items-center justify-between w-full text-xs font-bold uppercase tracking-wider text-slate-400 hover:text-slate-200 transition"
        >
          <span className="flex items-center gap-2">
            <Info className="w-4 h-4 text-brand-400" />
            {t.scienceModalTitle} (Mente & Frequência Cardíaca)
          </span>
          {showScienceDetails ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}
        </button>

        {showScienceDetails && (
          <div className="grid grid-cols-1 md:grid-cols-3 gap-3 mt-3 pt-3 border-t border-slate-800/80 animate-in fade-in duration-200">
            <div className="bg-slate-950/80 border border-slate-800/80 rounded-xl p-3.5">
              <div className="flex items-center gap-2 mb-1.5 text-orange-400 font-bold text-xs">
                <Flame className="w-4 h-4" />
                <h4>{t.highPulseDrillCardTitle}</h4>
              </div>
              <p className="text-xs text-slate-300 leading-relaxed">
                {t.highPulseDrillCardText}
              </p>
            </div>

            <div className="bg-slate-950/80 border border-slate-800/80 rounded-xl p-3.5">
              <div className="flex items-center gap-2 mb-1.5 text-brand-400 font-bold text-xs">
                <HeartPulse className="w-4 h-4" />
                <h4>{t.postureDecompressCardTitle}</h4>
              </div>
              <p className="text-xs text-slate-300 leading-relaxed">
                {t.postureDecompressCardText}
              </p>
            </div>

            <div className="bg-slate-950/80 border border-slate-800/80 rounded-xl p-3.5">
              <div className="flex items-center gap-2 mb-1.5 text-blue-400 font-bold text-xs">
                <MessageSquare className="w-4 h-4" />
                <h4>{t.fiveSecondRuleCardTitle}</h4>
              </div>
              <p className="text-xs text-slate-300 leading-relaxed">
                {t.fiveSecondRuleCardText}
              </p>
            </div>
          </div>
        )}
      </div>

      {/* 3. HISTORY OF CHECK-INS & HIGH PULSE DRILLS */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {/* Mood Log List */}
        <div className="bg-slate-900 border border-slate-800 rounded-2xl p-4 sm:p-5 shadow-md">
          <div className="flex items-center justify-between mb-3">
            <h3 className="font-bold text-white text-sm">
              {t.emotionalLogsTitle} ({moodLogs.length})
            </h3>
            <button
              onClick={() => onOpenMoodModal()}
              className="text-xs text-brand-400 hover:underline font-semibold"
            >
              + {t.newCheckinBtn}
            </button>
          </div>

          {moodLogs.length === 0 ? (
            <div className="text-xs text-slate-500 py-6 text-center">
              {t.noMoodLogsYet}
            </div>
          ) : (
            <div className="space-y-2 max-h-72 overflow-y-auto pr-1">
              {moodLogs.map(log => {
                const badge = getValenceBadge(log.valence);
                return (
                  <div key={log.id} className="p-2.5 rounded-xl bg-slate-950 border border-slate-800/80">
                    <div className="flex items-center justify-between gap-2 mb-1">
                      <span className={`text-[10px] font-bold px-2 py-0.5 rounded border ${badge.color}`}>
                        {badge.label}
                      </span>
                      <span className="text-[10px] text-slate-500 font-mono">{log.date}</span>
                    </div>

                    <div className="flex flex-wrap gap-1 mt-1">
                      {log.halt.hungry && <span className="text-[10px] px-1.5 py-0.2 rounded bg-amber-950/80 text-amber-400 border border-amber-800">🍎 {t.hungryLabel}</span>}
                      {log.halt.angry && <span className="text-[10px] px-1.5 py-0.2 rounded bg-red-950/80 text-red-400 border border-red-800">⚡ {t.angryLabel}</span>}
                      {log.halt.lonely && <span className="text-[10px] px-1.5 py-0.2 rounded bg-purple-950/80 text-purple-400 border border-purple-800">👤 {t.lonelyLabel}</span>}
                      {log.halt.tired && <span className="text-[10px] px-1.5 py-0.2 rounded bg-blue-950/80 text-blue-400 border border-blue-800">🥱 {t.tiredLabel}</span>}
                    </div>

                    {log.notes && (
                      <p className="text-xs text-slate-400 italic mt-1 line-clamp-1">
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
        <div className="bg-slate-900 border border-slate-800 rounded-2xl p-4 sm:p-5 shadow-md">
          <div className="flex items-center justify-between mb-3">
            <h3 className="font-bold text-white text-sm">
              {t.highPulseDrillsTitle} ({drills.length})
            </h3>
            <button
              onClick={() => onOpenDrillModal(false)}
              className="text-xs text-indigo-400 hover:underline font-semibold"
            >
              + {t.launchDrillBtn}
            </button>
          </div>

          {drills.length === 0 ? (
            <div className="text-xs text-slate-500 py-6 text-center">
              {t.noDrillsYet}
            </div>
          ) : (
            <div className="space-y-2 max-h-72 overflow-y-auto pr-1">
              {drills.map(drill => (
                <div key={drill.id} className="p-2.5 rounded-xl bg-slate-950 border border-slate-800/80">
                  <div className="flex items-center justify-between gap-2 mb-1">
                    <span className="text-xs font-bold text-white flex items-center gap-1.5">
                      <Zap className="w-3.5 h-3.5 text-indigo-400" /> {language === 'pt-BR' ? 'Pausa Somática de 10s' : '10s Somatic Pause'}
                    </span>
                    <span className="text-[10px] text-slate-500 font-mono">{drill.date}</span>
                  </div>

                  <p className="text-xs text-slate-300 mt-1 line-clamp-2">
                    {drill.reflection}
                  </p>

                  <div className="mt-1 flex items-center gap-1.5 text-[10px] text-emerald-400 font-bold">
                    <CheckCircle2 className="w-3 h-3" /> {t.impulseInhibited}
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
