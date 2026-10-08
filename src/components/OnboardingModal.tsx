import React, { useState, useRef } from 'react';
import {
  Sparkles,
  Shield,
  Zap,
  HeartPulse,
  Brain,
  CheckCircle2,
  ArrowRight,
  ArrowLeft,
  Upload,
  Globe,
  Dumbbell,
  Volume2,
  X
} from 'lucide-react';
import { UserFitnessProfile, GoalTarget, EquipmentType } from '../types/fitness';
import { Language, TRANSLATIONS } from '../i18n/translations';
import { StorageService } from '../services/storageService';
import { soundService } from '../services/soundService';

interface OnboardingModalProps {
  currentProfile: UserFitnessProfile;
  language: Language;
  onLanguageChange: (lang: Language) => void;
  onFinishOnboarding: (updatedProfile: UserFitnessProfile, startTour: boolean) => void;
  onImportBackup: () => void;
}

export const OnboardingModal: React.FC<OnboardingModalProps> = ({
  currentProfile,
  language,
  onLanguageChange,
  onFinishOnboarding,
  onImportBackup
}) => {
  const t = TRANSLATIONS[language];
  const [step, setStep] = useState<number>(1);
  const totalSteps = 5;

  // Form state
  const [name, setName] = useState<string>(currentProfile.name === 'Athlete' ? '' : currentProfile.name);
  const [selectedGoals, setSelectedGoals] = useState<GoalTarget[]>(
    currentProfile.selectedGoals && currentProfile.selectedGoals.length > 0
      ? currentProfile.selectedGoals
      : ['posture', 'belly_fat', 'cardio']
  );
  const [level, setLevel] = useState<number>(currentProfile.level || 1);
  const [deadHangSeconds, setDeadHangSeconds] = useState<number>(currentProfile.personalRecords.maxDeadHangSeconds || 25);
  const [ropeSkill, setRopeSkill] = useState<'beginner' | 'intermediate' | 'advanced'>('intermediate');
  const [hasDoorBar, setHasDoorBar] = useState<boolean>(true);
  const [hasRope, setHasRope] = useState<boolean>(true);
  const [soundEnabled, setSoundEnabled] = useState<boolean>(currentProfile.soundEnabled);
  const [voiceCoachEnabled, setVoiceCoachEnabled] = useState<boolean>(currentProfile.voiceCoachEnabled);

  // Hidden file input for quick backup restore
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleGoalToggle = (goal: GoalTarget) => {
    if (selectedGoals.includes(goal)) {
      if (selectedGoals.length > 1) {
        setSelectedGoals(selectedGoals.filter(g => g !== goal));
      }
    } else {
      setSelectedGoals([...selectedGoals, goal]);
    }
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = (event) => {
      try {
        const content = event.target?.result as string;
        const result = StorageService.importFromJSON(content);
        if (result.success) {
          onImportBackup();
        } else {
          alert(result.message || (language === 'pt-BR' ? 'Arquivo de backup inválido.' : 'Invalid backup file.'));
        }
      } catch (err) {
        alert(language === 'pt-BR' ? 'Erro ao ler arquivo de backup.' : 'Error reading backup file.');
      }
    };
    reader.readAsText(file);
  };

  const handleFinish = (startTour: boolean) => {
    const updated: UserFitnessProfile = {
      ...currentProfile,
      name: name.trim() || (language === 'pt-BR' ? 'Atleta' : 'Athlete'),
      level,
      personalRecords: {
        ...currentProfile.personalRecords,
        maxDeadHangSeconds: deadHangSeconds,
      },
      soundEnabled,
      voiceCoachEnabled,
      language,
      selectedGoals,
      hasCompletedOnboarding: true,
      hasSeenTour: !startTour,
    };
    onFinishOnboarding(updated, startTour);
  };

  const handleSkip = () => {
    const updated: UserFitnessProfile = {
      ...currentProfile,
      hasCompletedOnboarding: true,
    };
    onFinishOnboarding(updated, false);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-slate-950/85 backdrop-blur-md overflow-y-auto">
      <input
        type="file"
        ref={fileInputRef}
        onChange={handleFileChange}
        accept=".json"
        className="hidden"
      />

      <div className="relative w-full max-w-xl bg-slate-900 border border-slate-800 rounded-3xl shadow-2xl overflow-hidden my-auto flex flex-col max-h-[92vh]">
        {/* Top App Header & Skip Bar */}
        <div className="flex items-center justify-between px-5 sm:px-6 py-4 border-b border-slate-800 bg-slate-950/60">
          <div className="flex items-center gap-2">
            <span className="w-2.5 h-2.5 rounded-full bg-brand-400 animate-ping" />
            <span className="text-xs font-mono font-bold tracking-wider uppercase text-slate-400">
              {t.appTitle} • {step}/{totalSteps}
            </span>
          </div>

          <div className="flex items-center gap-2 sm:gap-3">
            {/* Language quick switcher */}
            <button
              onClick={() => onLanguageChange(language === 'pt-BR' ? 'en' : 'pt-BR')}
              className="px-2.5 py-1 rounded-lg bg-slate-800 hover:bg-slate-700 text-xs font-medium text-slate-300 flex items-center gap-1.5 transition"
              title="Mudar idioma / Change language"
            >
              <Globe className="w-3.5 h-3.5 text-brand-400" />
              <span>{language === 'pt-BR' ? '🇧🇷 PT' : '🇺🇸 EN'}</span>
            </button>

            {/* Import Backup */}
            <button
              onClick={() => fileInputRef.current?.click()}
              className="px-2.5 py-1 rounded-lg bg-slate-800 hover:bg-slate-700 text-xs font-medium text-slate-300 flex items-center gap-1.5 transition"
              title={t.importBackupBtn}
            >
              <Upload className="w-3.5 h-3.5 text-slate-400" />
              <span className="hidden sm:inline">{t.importBackupBtn}</span>
            </button>

            {/* Skip */}
            <button
              onClick={handleSkip}
              className="text-xs font-semibold text-slate-400 hover:text-white px-2 py-1 transition"
            >
              {t.skipOnboarding}
            </button>
          </div>
        </div>

        {/* Step Progress Line */}
        <div className="w-full bg-slate-800 h-1">
          <div
            className="bg-brand-500 h-1 transition-all duration-300"
            style={{ width: `${(step / totalSteps) * 100}%` }}
          />
        </div>

        {/* Content Body */}
        <div className="p-6 overflow-y-auto flex-1 space-y-6">
          {/* STEP 1: Welcome & Core Pillars */}
          {step === 1 && (
            <div className="space-y-5 animate-in fade-in duration-200">
              <div className="text-center space-y-2">
                <div className="inline-flex p-3 rounded-2xl bg-brand-500/10 border border-brand-500/30 text-brand-400 mb-1">
                  <Sparkles className="w-8 h-8" />
                </div>
                <h2 className="text-2xl font-black text-white">{t.welcomeHeading}</h2>
                <p className="text-sm text-slate-300 max-w-md mx-auto">{t.welcomeLead}</p>
              </div>

              <div className="space-y-2.5 pt-2">
                <div className="flex items-center gap-3 p-3.5 rounded-2xl bg-slate-950/60 border border-slate-800">
                  <div className="p-2 rounded-xl bg-orange-950 text-orange-400 shrink-0">
                    <Zap className="w-5 h-5" />
                  </div>
                  <div>
                    <h4 className="text-xs font-bold text-white uppercase tracking-wider">
                      {language === 'pt-BR' ? 'Micro-Sobrecarga (+1% Diário)' : 'Micro-Overload (+1% Daily)'}
                    </h4>
                    <p className="text-xs text-slate-400">{t.welcomePoint1}</p>
                  </div>
                </div>

                <div className="flex items-center gap-3 p-3.5 rounded-2xl bg-slate-950/60 border border-slate-800">
                  <div className="p-2 rounded-xl bg-indigo-950 text-indigo-400 shrink-0">
                    <Shield className="w-5 h-5" />
                  </div>
                  <div>
                    <h4 className="text-xs font-bold text-white uppercase tracking-wider">
                      {language === 'pt-BR' ? 'Antídoto do Pescoço Tech' : 'Text Neck Antidote'}
                    </h4>
                    <p className="text-xs text-slate-400">{t.welcomePoint2}</p>
                  </div>
                </div>

                <div className="flex items-center gap-3 p-3.5 rounded-2xl bg-slate-950/60 border border-slate-800">
                  <div className="p-2 rounded-xl bg-emerald-950 text-emerald-400 shrink-0">
                    <Brain className="w-5 h-5" />
                  </div>
                  <div>
                    <h4 className="text-xs font-bold text-white uppercase tracking-wider">
                      {language === 'pt-BR' ? 'Autocontrole sob Estresse' : 'Stress Inoculation'}
                    </h4>
                    <p className="text-xs text-slate-400">{t.welcomePoint3}</p>
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* STEP 2: Goals Selection */}
          {step === 2 && (
            <div className="space-y-4 animate-in fade-in duration-200">
              <div>
                <h3 className="text-xl font-black text-white">{t.goalSelectTitle}</h3>
                <p className="text-xs text-slate-400 mt-0.5">{t.goalSelectSubtitle}</p>
              </div>

              <div className="grid grid-cols-1 gap-2.5">
                {[
                  {
                    id: 'posture' as GoalTarget,
                    icon: Shield,
                    title: t.goalPostureTitle,
                    desc: t.goalPostureDesc,
                    color: 'text-indigo-400',
                    border: 'border-indigo-500/50 bg-indigo-950/20'
                  },
                  {
                    id: 'belly_fat' as GoalTarget,
                    icon: Zap,
                    title: t.goalBellyTitle,
                    desc: t.goalBellyDesc,
                    color: 'text-orange-400',
                    border: 'border-orange-500/50 bg-orange-950/20'
                  },
                  {
                    id: 'cardio' as GoalTarget,
                    icon: HeartPulse,
                    title: t.goalCardioTitle,
                    desc: t.goalCardioDesc,
                    color: 'text-emerald-400',
                    border: 'border-emerald-500/50 bg-emerald-950/20'
                  },
                  {
                    id: 'hybrid' as GoalTarget,
                    icon: Brain,
                    title: t.goalMindTitle,
                    desc: t.goalMindDesc,
                    color: 'text-brand-400',
                    border: 'border-brand-500/50 bg-brand-950/20'
                  }
                ].map((item) => {
                  const isChecked = selectedGoals.includes(item.id);
                  const Icon = item.icon;
                  return (
                    <button
                      key={item.id}
                      onClick={() => handleGoalToggle(item.id)}
                      className={`text-left p-4 rounded-2xl border transition-all flex items-start gap-3.5 ${
                        isChecked
                          ? `${item.border} ring-1 ring-brand-500/30`
                          : 'bg-slate-950/50 border-slate-800 hover:border-slate-700'
                      }`}
                    >
                      <div className={`p-2 rounded-xl bg-slate-900 border border-slate-800 ${item.color} shrink-0 mt-0.5`}>
                        <Icon className="w-5 h-5" />
                      </div>
                      <div className="flex-1">
                        <div className="flex items-center justify-between">
                          <h4 className="font-bold text-sm text-white">{item.title}</h4>
                          <div className={`w-5 h-5 rounded-md flex items-center justify-center border transition ${
                            isChecked ? 'bg-brand-500 border-brand-500 text-slate-950' : 'border-slate-700'
                          }`}>
                            {isChecked && <CheckCircle2 className="w-3.5 h-3.5 fill-current" />}
                          </div>
                        </div>
                        <p className="text-xs text-slate-400 mt-1 leading-relaxed">{item.desc}</p>
                      </div>
                    </button>
                  );
                })}
              </div>
            </div>
          )}

          {/* STEP 3: Baseline & Level */}
          {step === 3 && (
            <div className="space-y-5 animate-in fade-in duration-200">
              <div>
                <h3 className="text-xl font-black text-white">{t.baselineTitle}</h3>
                <p className="text-xs text-slate-400 mt-0.5">{t.baselineSubtitle}</p>
              </div>

              <div className="space-y-4">
                <div>
                  <label className="block text-xs font-bold uppercase tracking-wider text-slate-300 mb-1.5">
                    {t.nameLabel}
                  </label>
                  <input
                    type="text"
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                    placeholder={language === 'pt-BR' ? 'Ex: Tacio' : 'e.g. Alex'}
                    className="w-full bg-slate-950 border border-slate-800 rounded-xl px-4 py-3 text-sm text-white focus:outline-none focus:border-brand-500"
                  />
                </div>

                <div>
                  <label className="block text-xs font-bold uppercase tracking-wider text-slate-300 mb-2">
                    {t.levelLabel}
                  </label>
                  <div className="grid grid-cols-3 gap-2">
                    {[
                      { lvl: 1, label: t.level1 },
                      { lvl: 2, label: t.level2 },
                      { lvl: 3, label: t.level3 }
                    ].map((item) => (
                      <button
                        key={item.lvl}
                        onClick={() => setLevel(item.lvl)}
                        className={`p-3 rounded-xl border text-center transition ${
                          level === item.lvl
                            ? 'bg-brand-500/10 border-brand-500 text-brand-300 font-bold'
                            : 'bg-slate-950/60 border-slate-800 text-slate-400 hover:border-slate-700'
                        }`}
                      >
                        <span className="block text-base font-black text-white mb-0.5">Lvl {item.lvl}</span>
                        <span className="text-[10px] leading-tight block">{item.label}</span>
                      </button>
                    ))}
                  </div>
                </div>

                <div>
                  <div className="flex justify-between items-center mb-1.5">
                    <label className="text-xs font-bold uppercase tracking-wider text-slate-300">
                      {t.doorBarBaselineLabel}
                    </label>
                    <span className="text-xs font-mono font-bold text-brand-400">{deadHangSeconds}s</span>
                  </div>
                  <input
                    type="range"
                    min="10"
                    max="90"
                    step="5"
                    value={deadHangSeconds}
                    onChange={(e) => setDeadHangSeconds(Number(e.target.value))}
                    className="w-full accent-brand-500 h-2 bg-slate-800 rounded-lg cursor-pointer"
                  />
                </div>

                <div>
                  <label className="block text-xs font-bold uppercase tracking-wider text-slate-300 mb-2">
                    {t.jumpRopeBaselineLabel}
                  </label>
                  <div className="grid grid-cols-3 gap-2">
                    {[
                      { id: 'beginner', label: t.ropeBeginner },
                      { id: 'intermediate', label: t.ropeIntermediate },
                      { id: 'advanced', label: t.ropeAdvanced }
                    ].map((item) => (
                      <button
                        key={item.id}
                        onClick={() => setRopeSkill(item.id as any)}
                        className={`p-2.5 rounded-xl border text-center transition text-xs ${
                          ropeSkill === item.id
                            ? 'bg-brand-500/10 border-brand-500 text-brand-300 font-bold'
                            : 'bg-slate-950/60 border-slate-800 text-slate-400 hover:border-slate-700'
                        }`}
                      >
                        {item.label}
                      </button>
                    ))}
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* STEP 4: Equipment & Sensory Cues */}
          {step === 4 && (
            <div className="space-y-4 animate-in fade-in duration-200">
              <div>
                <h3 className="text-xl font-black text-white">{t.equipAudioTitle}</h3>
                <p className="text-xs text-slate-400 mt-0.5">{t.equipAudioSubtitle}</p>
              </div>

              <div className="space-y-3">
                <div className="p-4 rounded-2xl bg-slate-950/60 border border-slate-800 space-y-3">
                  <h4 className="text-xs font-bold uppercase tracking-wider text-slate-400">
                    {language === 'pt-BR' ? 'Equipamentos Mínimos' : 'Minimal Gear'}
                  </h4>

                  <label className="flex items-center gap-3 cursor-pointer">
                    <input
                      type="checkbox"
                      checked={hasDoorBar}
                      onChange={(e) => setHasDoorBar(e.target.checked)}
                      className="w-4 h-4 rounded text-brand-500 focus:ring-brand-500 bg-slate-900 border-slate-700"
                    />
                    <span className="text-sm font-semibold text-slate-200">
                      🚪 {t.equipDoorBarConfirm}
                    </span>
                  </label>

                  <label className="flex items-center gap-3 cursor-pointer">
                    <input
                      type="checkbox"
                      checked={hasRope}
                      onChange={(e) => setHasRope(e.target.checked)}
                      className="w-4 h-4 rounded text-brand-500 focus:ring-brand-500 bg-slate-900 border-slate-700"
                    />
                    <span className="text-sm font-semibold text-slate-200">
                      🪢 {t.equipRopeConfirm}
                    </span>
                  </label>
                </div>

                <div className="p-4 rounded-2xl bg-slate-950/60 border border-slate-800 space-y-3">
                  <h4 className="text-xs font-bold uppercase tracking-wider text-slate-400">
                    {language === 'pt-BR' ? 'Feedback Sensorial' : 'Sensory Feedback'}
                  </h4>

                  <label className="flex items-center justify-between cursor-pointer">
                    <span className="text-sm font-semibold text-slate-200 flex items-center gap-2">
                      <Volume2 className="w-4 h-4 text-brand-400" />
                      {t.audioTicksLabel}
                    </span>
                    <input
                      type="checkbox"
                      checked={soundEnabled}
                      onChange={(e) => setSoundEnabled(e.target.checked)}
                      className="w-4 h-4 rounded text-brand-500 focus:ring-brand-500 bg-slate-900 border-slate-700"
                    />
                  </label>

                  <label className="flex items-center justify-between cursor-pointer">
                    <span className="text-sm font-semibold text-slate-200 flex items-center gap-2">
                      <Brain className="w-4 h-4 text-indigo-400" />
                      {t.voiceCoachLabel}
                    </span>
                    <input
                      type="checkbox"
                      checked={voiceCoachEnabled}
                      onChange={(e) => setVoiceCoachEnabled(e.target.checked)}
                      className="w-4 h-4 rounded text-brand-500 focus:ring-brand-500 bg-slate-900 border-slate-700"
                    />
                  </label>
                </div>
              </div>
            </div>
          )}

          {/* STEP 5: Ready & Choice (Tour or Direct) */}
          {step === 5 && (
            <div className="space-y-6 text-center animate-in fade-in duration-200 py-2">
              <div className="inline-flex p-4 rounded-3xl bg-brand-500/10 border border-brand-500/30 text-brand-400">
                <CheckCircle2 className="w-12 h-12" />
              </div>

              <div className="space-y-2">
                <h3 className="text-2xl font-black text-white">{t.finishHeading}</h3>
                <p className="text-sm text-slate-300 max-w-sm mx-auto">{t.finishLead}</p>
              </div>

              <div className="p-4 rounded-2xl bg-slate-950/60 border border-slate-800 text-left space-y-2 max-w-sm mx-auto">
                <div className="flex justify-between text-xs">
                  <span className="text-slate-400">{t.athleteNameLabel}:</span>
                  <span className="font-bold text-white">{name.trim() || (language === 'pt-BR' ? 'Atleta' : 'Athlete')}</span>
                </div>
                <div className="flex justify-between text-xs">
                  <span className="text-slate-400">{t.levelLabel}:</span>
                  <span className="font-bold text-brand-400">Nível {level}</span>
                </div>
                <div className="flex justify-between text-xs">
                  <span className="text-slate-400">{t.doorBarBaselineLabel}:</span>
                  <span className="font-bold text-white">{deadHangSeconds}s</span>
                </div>
              </div>

              <div className="space-y-3 pt-2">
                <button
                  onClick={() => handleFinish(true)}
                  className="w-full py-4 px-6 rounded-2xl bg-brand-500 hover:bg-brand-400 text-slate-950 font-black text-sm uppercase tracking-wider transition shadow-xl shadow-brand-500/20 flex items-center justify-center gap-2"
                >
                  <Sparkles className="w-4 h-4" />
                  <span>{t.startTourBtn}</span>
                </button>

                <button
                  onClick={() => handleFinish(false)}
                  className="w-full py-3 px-6 rounded-2xl bg-slate-800 hover:bg-slate-700 text-white font-bold text-xs uppercase tracking-wider transition"
                >
                  {t.directAppBtn}
                </button>
              </div>
            </div>
          )}
        </div>

        {/* Footer Navigation (Prev / Next) */}
        {step < 5 && (
          <div className="flex items-center justify-between px-6 py-4 border-t border-slate-800 bg-slate-950/40">
            {step > 1 ? (
              <button
                onClick={() => setStep(step - 1)}
                className="px-4 py-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-xs font-bold text-slate-300 flex items-center gap-1.5 transition"
              >
                <ArrowLeft className="w-3.5 h-3.5" />
                <span>{t.tourPrev}</span>
              </button>
            ) : (
              <div />
            )}

            <button
              onClick={() => {
                if (step === 1 && !soundService) {
                  // init audio on first user gesture
                }
                setStep(step + 1);
              }}
              className="px-6 py-2.5 rounded-xl bg-brand-500 hover:bg-brand-400 text-slate-950 font-black text-xs uppercase tracking-wider flex items-center gap-1.5 transition shadow-lg shadow-brand-500/20"
            >
              <span>{step === 1 ? t.startConfigBtn : t.tourNext}</span>
              <ArrowRight className="w-3.5 h-3.5" />
            </button>
          </div>
        )}
      </div>
    </div>
  );
};
