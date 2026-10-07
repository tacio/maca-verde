import React, { useState } from 'react';
import { X, HeartPulse, Brain, AlertTriangle, ShieldCheck, CheckCircle2 } from 'lucide-react';
import { ValenceType, HALTState, SomaticTensionArea, MoodLogEntry } from '../types/mood';
import { Language, TRANSLATIONS } from '../i18n/translations';

interface MoodTrackerModalProps {
  language?: Language;
  onSaveMood: (entry: Omit<MoodLogEntry, 'id' | 'timestamp'>) => void;
  onClose: () => void;
  initialHalt?: Partial<HALTState>;
}

export const MoodTrackerModal: React.FC<MoodTrackerModalProps> = ({
  language = 'pt-BR',
  onSaveMood,
  onClose,
  initialHalt
}) => {
  const t = TRANSLATIONS[language];

  const [valence, setValence] = useState<ValenceType>('good');
  const [energyLevel, setEnergyLevel] = useState<1 | 2 | 3 | 4 | 5>(3);
  const [halt, setHalt] = useState<HALTState>({
    hungry: initialHalt?.hungry ?? false,
    angry: initialHalt?.angry ?? false,
    lonely: initialHalt?.lonely ?? false,
    tired: initialHalt?.tired ?? false,
  });
  const [somaticTension, setSomaticTension] = useState<SomaticTensionArea[]>(['neck_shoulders']);
  const [thoughtBeforeSpeakingRating, setThoughtBeforeSpeakingRating] = useState<1 | 2 | 3 | 4 | 5>(4);
  const [notes, setNotes] = useState('');

  const toggleHalt = (key: keyof HALTState) => {
    setHalt(prev => ({ ...prev, [key]: !prev[key] }));
  };

  const toggleSomatic = (area: SomaticTensionArea) => {
    setSomaticTension(prev =>
      prev.includes(area) ? prev.filter(a => a !== area) : [...prev, area]
    );
  };

  const isHaltActive = halt.hungry || halt.angry || halt.lonely || halt.tired;

  const handleSave = () => {
    const todayStr = new Date().toISOString().split('T')[0];
    onSaveMood({
      date: todayStr,
      valence,
      energyLevel,
      halt,
      somaticTension,
      thoughtBeforeSpeakingRating,
      notes: notes.trim(),
      speechFilterActive: isHaltActive,
    });
    onClose();
  };

  const valenceOptions: { type: ValenceType; label: string; icon: string; color: string }[] = language === 'pt-BR' ? [
    { type: 'great', label: 'Ótimo & Centrado', icon: '✨', color: 'border-emerald-500 bg-emerald-950/40 text-emerald-300' },
    { type: 'good', label: 'Bem & Estável', icon: '🌿', color: 'border-brand-500 bg-brand-950/40 text-brand-300' },
    { type: 'neutral', label: 'Neutro / Focado', icon: '⚖️', color: 'border-slate-600 bg-slate-900 text-slate-300' },
    { type: 'frustrated', label: 'Irritado / Bravo', icon: '⚡', color: 'border-orange-500 bg-orange-950/40 text-orange-300' },
    { type: 'exhausted', label: 'Exausto', icon: '🥱', color: 'border-purple-500 bg-purple-950/40 text-purple-300' },
    { type: 'anxious', label: 'Tenso / Ansioso', icon: '🌀', color: 'border-blue-500 bg-blue-950/40 text-blue-300' },
  ] : [
    { type: 'great', label: 'Great & Grounded', icon: '✨', color: 'border-emerald-500 bg-emerald-950/40 text-emerald-300' },
    { type: 'good', label: 'Good & Steady', icon: '🌿', color: 'border-brand-500 bg-brand-950/40 text-brand-300' },
    { type: 'neutral', label: 'Neutral / Focused', icon: '⚖️', color: 'border-slate-600 bg-slate-900 text-slate-300' },
    { type: 'frustrated', label: 'Upset / Irritated', icon: '⚡', color: 'border-orange-500 bg-orange-950/40 text-orange-300' },
    { type: 'exhausted', label: 'Exhausted', icon: '🥱', color: 'border-purple-500 bg-purple-950/40 text-purple-300' },
    { type: 'anxious', label: 'Tense / Anxious', icon: '🌀', color: 'border-blue-500 bg-blue-950/40 text-blue-300' },
  ];

  return (
    <div className="fixed inset-0 z-50 bg-black/85 backdrop-blur-sm flex items-center justify-center p-4 overflow-y-auto">
      <div className="bg-slate-900 border border-slate-800 rounded-2xl max-w-lg w-full p-6 text-slate-100 shadow-2xl relative my-8">
        <div className="flex items-center justify-between border-b border-slate-800 pb-4 mb-4">
          <div className="flex items-center gap-2.5">
            <div className="p-2 rounded-xl bg-brand-500/10 text-brand-400 border border-brand-500/20">
              <Brain className="w-5 h-5" />
            </div>
            <div>
              <h2 className="text-lg font-black text-white">{t.moodModalTitle}</h2>
              <p className="text-xs text-slate-400">{t.moodModalSubtitle}</p>
            </div>
          </div>
          <button onClick={onClose} className="p-2 text-slate-400 hover:text-white transition">
            <X className="w-5 h-5" />
          </button>
        </div>

        <div className="space-y-5 max-h-[72vh] overflow-y-auto pr-1">
          {/* Emotional Valence */}
          <div>
            <label className="text-xs font-bold uppercase tracking-wider text-slate-400 block mb-2">
              {t.howAreYouFeeling}
            </label>
            <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
              {valenceOptions.map(opt => (
                <button
                  key={opt.type}
                  type="button"
                  onClick={() => setValence(opt.type)}
                  className={`p-2.5 rounded-xl border text-xs font-bold flex items-center gap-2 transition ${
                    valence === opt.type
                      ? `${opt.color} ring-1 ring-white/20`
                      : 'border-slate-800 bg-slate-950/60 text-slate-400 hover:border-slate-700'
                  }`}
                >
                  <span className="text-base">{opt.icon}</span>
                  <span>{opt.label}</span>
                </button>
              ))}
            </div>
          </div>

          {/* CRITICAL: HALT VULNERABILITY RADAR */}
          <div className="p-4 rounded-xl bg-slate-950 border border-slate-800">
            <div className="flex items-center justify-between mb-2">
              <span className="text-xs font-black uppercase tracking-wider text-slate-300 flex items-center gap-1.5">
                <AlertTriangle className="w-4 h-4 text-amber-400" />
                {t.haltCheckTitle}
              </span>
              <span className="text-[10px] text-slate-400">{t.tapAllThatApply}</span>
            </div>
            <p className="text-[11px] text-slate-400 mb-3">
              {t.haltExplainer}
            </p>

            <div className="grid grid-cols-2 gap-2">
              <button
                type="button"
                onClick={() => toggleHalt('hungry')}
                className={`p-2.5 rounded-xl border text-left text-xs transition ${
                  halt.hungry
                    ? 'bg-amber-950/60 border-amber-500 text-amber-300 font-bold'
                    : 'bg-slate-900 border-slate-800 text-slate-400 hover:border-slate-700'
                }`}
              >
                <div className="flex items-center gap-2 mb-0.5">
                  <span>🍎</span>
                  <span className="font-bold">{t.hungryLabel}</span>
                </div>
                <span className="text-[10px] text-slate-400 block leading-tight">
                  {t.hungryDesc}
                </span>
              </button>

              <button
                type="button"
                onClick={() => toggleHalt('angry')}
                className={`p-2.5 rounded-xl border text-left text-xs transition ${
                  halt.angry
                    ? 'bg-red-950/60 border-red-500 text-red-300 font-bold'
                    : 'bg-slate-900 border-slate-800 text-slate-400 hover:border-slate-700'
                }`}
              >
                <div className="flex items-center gap-2 mb-0.5">
                  <span>⚡</span>
                  <span className="font-bold">{t.angryLabel}</span>
                </div>
                <span className="text-[10px] text-slate-400 block leading-tight">
                  {t.angryDesc}
                </span>
              </button>

              <button
                type="button"
                onClick={() => toggleHalt('lonely')}
                className={`p-2.5 rounded-xl border text-left text-xs transition ${
                  halt.lonely
                    ? 'bg-purple-950/60 border-purple-500 text-purple-300 font-bold'
                    : 'bg-slate-900 border-slate-800 text-slate-400 hover:border-slate-700'
                }`}
              >
                <div className="flex items-center gap-2 mb-0.5">
                  <span>👤</span>
                  <span className="font-bold">{t.lonelyLabel}</span>
                </div>
                <span className="text-[10px] text-slate-400 block leading-tight">
                  {t.lonelyDesc}
                </span>
              </button>

              <button
                type="button"
                onClick={() => toggleHalt('tired')}
                className={`p-2.5 rounded-xl border text-left text-xs transition ${
                  halt.tired
                    ? 'bg-blue-950/60 border-blue-500 text-blue-300 font-bold'
                    : 'bg-slate-900 border-slate-800 text-slate-400 hover:border-slate-700'
                }`}
              >
                <div className="flex items-center gap-2 mb-0.5">
                  <span>🥱</span>
                  <span className="font-bold">{t.tiredLabel}</span>
                </div>
                <span className="text-[10px] text-slate-400 block leading-tight">
                  {t.tiredDesc}
                </span>
              </button>
            </div>

            {/* Dynamic HALT Shield Advice */}
            {isHaltActive ? (
              <div className="mt-3 p-3 rounded-lg bg-amber-950/40 border border-amber-500/40 text-amber-200 text-xs flex items-start gap-2">
                <ShieldCheck className="w-4 h-4 text-amber-400 shrink-0 mt-0.5" />
                <div>
                  {t.speechShieldActiveAlert}
                </div>
              </div>
            ) : (
              <div className="mt-3 p-2.5 rounded-lg bg-emerald-950/30 border border-emerald-500/30 text-emerald-300 text-xs flex items-center gap-2">
                <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0" />
                <span>{t.speechShieldClearNotice}</span>
              </div>
            )}
          </div>

          {/* Somatic Tension (Interoceptive Body Awareness) */}
          <div>
            <label className="text-xs font-bold uppercase tracking-wider text-slate-400 block mb-1.5 flex items-center gap-1.5">
              <HeartPulse className="w-3.5 h-3.5 text-brand-400" />
              {t.somaticTensionTitle}
            </label>
            <p className="text-[11px] text-slate-400 mb-2">
              {t.somaticTensionSubtitle}
            </p>
            <div className="flex flex-wrap gap-2">
              {[
                { id: 'jaw', label: t.jawTension },
                { id: 'neck_shoulders', label: t.neckTensionArea },
                { id: 'chest', label: t.chestTension },
                { id: 'stomach', label: t.stomachTension },
                { id: 'hands', label: t.handsTension },
              ].map(area => {
                const isSelected = somaticTension.includes(area.id as SomaticTensionArea);
                return (
                  <button
                    key={area.id}
                    type="button"
                    onClick={() => toggleSomatic(area.id as SomaticTensionArea)}
                    className={`px-3 py-1.5 rounded-lg text-xs font-semibold border transition ${
                      isSelected
                        ? 'bg-brand-500/20 border-brand-500/50 text-brand-300'
                        : 'bg-slate-950 border-slate-800 text-slate-400 hover:border-slate-700'
                    }`}
                  >
                    {isSelected ? '✓ ' : '+ '}{area.label}
                  </button>
                );
              })}
            </div>
          </div>

          {/* Speech Control Self-Score */}
          <div>
            <div className="flex justify-between items-center mb-1">
              <label className="text-xs font-bold text-slate-300">
                {t.thoughtBeforeSpeakingPrompt}
              </label>
              <span className="text-xs font-bold text-brand-400">
                {thoughtBeforeSpeakingRating}/5 {thoughtBeforeSpeakingRating >= 4 ? `⭐️ ${t.disciplined}` : `⚠️ ${t.impulsive}`}
              </span>
            </div>
            <input
              type="range"
              min="1"
              max="5"
              value={thoughtBeforeSpeakingRating}
              onChange={(e) => setThoughtBeforeSpeakingRating(Number(e.target.value) as 1 | 2 | 3 | 4 | 5)}
              className="w-full accent-brand-500 cursor-pointer"
            />
          </div>

          {/* Brief Reflection Note */}
          <div>
            <input
              type="text"
              placeholder={t.triggerPlaceholder}
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3.5 py-2.5 text-xs text-slate-200 focus:outline-none focus:border-brand-500"
            />
          </div>
        </div>

        {/* Save Button */}
        <div className="mt-5 pt-3 border-t border-slate-800 flex justify-end gap-3">
          <button
            onClick={onClose}
            className="px-4 py-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-xs font-semibold text-slate-300 transition"
          >
            {language === 'pt-BR' ? 'Cancelar' : 'Cancel'}
          </button>
          <button
            onClick={handleSave}
            className="px-6 py-2.5 rounded-xl bg-brand-500 hover:bg-brand-400 text-slate-950 font-black text-xs uppercase tracking-wider transition shadow-lg active:scale-95 flex items-center gap-1.5"
          >
            <CheckCircle2 className="w-4 h-4" /> {t.saveMoodBtn}
          </button>
        </div>
      </div>
    </div>
  );
};
