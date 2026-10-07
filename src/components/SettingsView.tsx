import React, { useState } from 'react';
import { Globe, Volume2, VolumeX, ShieldCheck, CheckCircle2, User, Clock, HardDrive, Sparkles } from 'lucide-react';
import { UserFitnessProfile } from '../types/fitness';
import { Language, TRANSLATIONS } from '../i18n/translations';
import { StorageService } from '../services/storageService';
import { soundService } from '../services/soundService';

interface SettingsViewProps {
  profile: UserFitnessProfile;
  onUpdateProfile: (updated: UserFitnessProfile) => void;
}

export const SettingsView: React.FC<SettingsViewProps> = ({ profile, onUpdateProfile }) => {
  const [currentLang, setCurrentLang] = useState<Language>(profile.language || 'pt-BR');
  const [name, setName] = useState(profile.name || 'Atleta');
  const [preferredMinutes, setPreferredMinutes] = useState(profile.preferredWorkoutTimeMinutes || 15);
  const [soundEnabled, setSoundEnabled] = useState(profile.soundEnabled);
  const [voiceEnabled, setVoiceEnabled] = useState(profile.voiceCoachEnabled);
  const [savedBanner, setSavedBanner] = useState(false);

  const t = TRANSLATIONS[currentLang];

  const handleLanguageChange = (lang: Language) => {
    setCurrentLang(lang);
    const updated: UserFitnessProfile = {
      ...profile,
      language: lang
    };
    onUpdateProfile(updated);
    StorageService.saveProfile(updated);

    // Give audio feedback in the new language
    if (lang === 'pt-BR') {
      soundService.speak('Idioma alterado para Português do Brasil.', 'pt-BR');
    } else {
      soundService.speak('Language switched to English.', 'en');
    }

    setSavedBanner(true);
    setTimeout(() => setSavedBanner(false), 3000);
  };

  const handleSave = (e: React.FormEvent) => {
    e.preventDefault();
    const updated: UserFitnessProfile = {
      ...profile,
      name: name.trim() || 'Atleta',
      preferredWorkoutTimeMinutes: preferredMinutes,
      soundEnabled,
      voiceCoachEnabled: voiceEnabled,
      language: currentLang
    };

    soundService.setSoundEnabled(soundEnabled);
    soundService.setVoiceCoachEnabled(voiceEnabled);
    StorageService.saveProfile(updated);
    onUpdateProfile(updated);

    setSavedBanner(true);
    setTimeout(() => setSavedBanner(false), 3000);
  };

  return (
    <div className="space-y-6 max-w-4xl mx-auto">
      {/* Top Banner */}
      <div className="bg-slate-900 border border-slate-800 rounded-2xl p-6 shadow-xl">
        <h2 className="text-xl font-bold text-white flex items-center gap-2 mb-1">
          <Globe className="w-5 h-5 text-brand-400" />
          {t.settingsTitle}
        </h2>
        <p className="text-xs text-slate-400">
          {t.settingsSubtitle}
        </p>

        {savedBanner && (
          <div className="mt-4 p-3 rounded-xl bg-emerald-950/60 border border-emerald-500/40 text-emerald-300 text-xs font-bold flex items-center gap-2 animate-fade-in">
            <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0" />
            <span>{t.settingsSavedMessage}</span>
          </div>
        )}
      </div>

      <form onSubmit={handleSave} className="space-y-6">
        {/* Language Selection Section */}
        <div className="bg-slate-900 border border-slate-800 rounded-2xl p-6 shadow-xl">
          <div className="flex items-center gap-2 mb-1">
            <Globe className="w-5 h-5 text-brand-400" />
            <h3 className="text-base font-bold text-white">{t.languageSectionTitle}</h3>
          </div>
          <p className="text-xs text-slate-400 mb-4">{t.languageSectionSubtitle}</p>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <button
              type="button"
              onClick={() => handleLanguageChange('pt-BR')}
              className={`p-4 rounded-xl border text-left transition flex items-center justify-between ${
                currentLang === 'pt-BR'
                  ? 'bg-brand-950/40 border-brand-500 ring-1 ring-brand-500/40 text-white'
                  : 'bg-slate-950 border-slate-800 text-slate-300 hover:border-slate-700'
              }`}
            >
              <div className="flex items-center gap-3">
                <span className="text-3xl">🇧🇷</span>
                <div>
                  <div className="font-bold text-sm text-white">Português (Brasil)</div>
                  <div className="text-xs text-slate-400">pt-BR • Voz e termos em português</div>
                </div>
              </div>
              {currentLang === 'pt-BR' && (
                <CheckCircle2 className="w-5 h-5 text-brand-400 shrink-0" />
              )}
            </button>

            <button
              type="button"
              onClick={() => handleLanguageChange('en')}
              className={`p-4 rounded-xl border text-left transition flex items-center justify-between ${
                currentLang === 'en'
                  ? 'bg-brand-950/40 border-brand-500 ring-1 ring-brand-500/40 text-white'
                  : 'bg-slate-950 border-slate-800 text-slate-300 hover:border-slate-700'
              }`}
            >
              <div className="flex items-center gap-3">
                <span className="text-3xl">🇺🇸</span>
                <div>
                  <div className="font-bold text-sm text-white">English (US)</div>
                  <div className="text-xs text-slate-400">en • English speech & terminology</div>
                </div>
              </div>
              {currentLang === 'en' && (
                <CheckCircle2 className="w-5 h-5 text-brand-400 shrink-0" />
              )}
            </button>
          </div>
        </div>

        {/* Audio & Voice Coach Section */}
        <div className="bg-slate-900 border border-slate-800 rounded-2xl p-6 shadow-xl">
          <div className="flex items-center gap-2 mb-1">
            <Volume2 className="w-5 h-5 text-indigo-400" />
            <h3 className="text-base font-bold text-white">{t.audioSectionTitle}</h3>
          </div>
          <p className="text-xs text-slate-400 mb-4">
            {currentLang === 'pt-BR'
              ? 'Configure o feedback sonoro e o treinador falado nos treinos HIIT.'
              : 'Configure sound synthesizer and speech synthesis during HIIT workouts.'}
          </p>

          <div className="space-y-3">
            <div className="flex items-center justify-between p-3.5 rounded-xl bg-slate-950 border border-slate-800">
              <div>
                <span className="text-xs font-bold text-white block">{t.soundBeepsToggle}</span>
                <span className="text-[11px] text-slate-400">
                  {currentLang === 'pt-BR'
                    ? 'Apitos e contagens 3-2-1 gerados via Web Audio API'
                    : 'Whistles and 3-2-1 countdown ticks generated via Web Audio API'}
                </span>
              </div>
              <button
                type="button"
                onClick={() => setSoundEnabled(!soundEnabled)}
                className={`w-12 h-6 rounded-full transition-colors relative ${
                  soundEnabled ? 'bg-brand-500' : 'bg-slate-800'
                }`}
              >
                <div
                  className={`w-5 h-5 rounded-full bg-white transition-transform ${
                    soundEnabled ? 'translate-x-6' : 'translate-x-0.5'
                  }`}
                />
              </button>
            </div>

            <div className="flex items-center justify-between p-3.5 rounded-xl bg-slate-950 border border-slate-800">
              <div>
                <span className="text-xs font-bold text-white block">{t.voiceCoachToggle}</span>
                <span className="text-[11px] text-slate-400">
                  {currentLang === 'pt-BR'
                    ? 'Fala o nome dos exercícios e as correções posturais em voz alta'
                    : 'Speaks exercise names and posture cues out loud'}
                </span>
              </div>
              <button
                type="button"
                onClick={() => setVoiceEnabled(!voiceEnabled)}
                className={`w-12 h-6 rounded-full transition-colors relative ${
                  voiceEnabled ? 'bg-brand-500' : 'bg-slate-800'
                }`}
              >
                <div
                  className={`w-5 h-5 rounded-full bg-white transition-transform ${
                    voiceEnabled ? 'translate-x-6' : 'translate-x-0.5'
                  }`}
                />
              </button>
            </div>
          </div>
        </div>

        {/* Profile & Workout Goals Section */}
        <div className="bg-slate-900 border border-slate-800 rounded-2xl p-6 shadow-xl">
          <div className="flex items-center gap-2 mb-1">
            <User className="w-5 h-5 text-emerald-400" />
            <h3 className="text-base font-bold text-white">{t.profileSectionTitle}</h3>
          </div>
          <p className="text-xs text-slate-400 mb-4">
            {currentLang === 'pt-BR'
              ? 'Seus dados permanecem 100% locais no dispositivo.'
              : 'Your data stays 100% local on this device.'}
          </p>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="text-xs font-bold text-slate-300 block mb-1">
                {t.athleteNameLabel}
              </label>
              <input
                type="text"
                value={name}
                onChange={(e) => setName(e.target.value)}
                className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3.5 py-2.5 text-xs text-white focus:outline-none focus:border-brand-500"
              />
            </div>

            <div>
              <label className="text-xs font-bold text-slate-300 block mb-1">
                {t.preferredDurationLabel}
              </label>
              <input
                type="number"
                min="5"
                max="60"
                value={preferredMinutes}
                onChange={(e) => setPreferredMinutes(Math.max(5, parseInt(e.target.value) || 15))}
                className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3.5 py-2.5 text-xs text-white font-mono focus:outline-none focus:border-brand-500"
              />
            </div>
          </div>
        </div>

        {/* Save Preferences Button */}
        <div className="flex justify-end">
          <button
            type="submit"
            className="px-8 py-3.5 rounded-xl bg-brand-500 hover:bg-brand-400 text-slate-950 font-black text-xs uppercase tracking-wider transition shadow-lg flex items-center gap-2 active:scale-95"
          >
            <CheckCircle2 className="w-4 h-4" /> {t.saveSettingsBtn}
          </button>
        </div>
      </form>
    </div>
  );
};
