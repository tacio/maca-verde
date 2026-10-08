import React, { useEffect } from 'react';
import {
  Sparkles,
  Zap,
  HeartPulse,
  Brain,
  Shield,
  Cloud,
  CheckCircle2,
  ArrowRight,
  ArrowLeft,
  X
} from 'lucide-react';
import { Language, TRANSLATIONS } from '../i18n/translations';

interface DemoTourModalProps {
  language: Language;
  currentStep: number;
  onStepChange: (step: number) => void;
  onCloseTour: () => void;
  onTabChange: (tab: 'today' | 'mind' | 'library' | 'progress' | 'backup' | 'settings') => void;
}

export const DemoTourModal: React.FC<DemoTourModalProps> = ({
  language,
  currentStep,
  onStepChange,
  onCloseTour,
  onTabChange
}) => {
  const t = TRANSLATIONS[language];
  const totalSteps = 5;

  const stepsData = [
    {
      step: 1,
      targetTab: 'today' as const,
      icon: Zap,
      iconColor: 'text-orange-400 bg-orange-950/60 border-orange-500/40',
      title: t.tourStep1Title,
      desc: t.tourStep1Desc,
      tip: language === 'pt-BR' 
        ? 'Dica: O temporizador calcula seus intervalos de tiro e descanso com bips sonoros e pausas posturais.' 
        : 'Tip: The timer runs sprint/rest intervals with audio whistles and posture pauses.'
    },
    {
      step: 2,
      targetTab: 'mind' as const,
      icon: HeartPulse,
      iconColor: 'text-emerald-400 bg-emerald-950/60 border-emerald-500/40',
      title: t.tourStep2Title,
      desc: t.tourStep2Desc,
      tip: language === 'pt-BR'
        ? 'Dica: Sentiu irritação repentina? Toque no Escudo de 5 segundos para forçar o silêncio reflexivo antes de responder.'
        : 'Tip: Feeling sudden irritation? Tap the 5-second Shield to enforce thoughtful silence before replying.'
    },
    {
      step: 3,
      targetTab: 'mind' as const,
      icon: Brain,
      iconColor: 'text-brand-400 bg-brand-950/60 border-brand-500/40',
      title: t.tourStep3Title,
      desc: t.tourStep3Desc,
      tip: language === 'pt-BR'
        ? 'Dica: Você pode fazer esse treino logo após o HIIT na corda, quando sua frequência cardíaca já estiver lá no alto.'
        : 'Tip: You can launch this drill right after jump rope HIIT, when your heart rate is already peaked.'
    },
    {
      step: 4,
      targetTab: 'library' as const,
      icon: Shield,
      iconColor: 'text-indigo-400 bg-indigo-950/60 border-indigo-500/40',
      title: t.tourStep4Title,
      desc: t.tourStep4Desc,
      tip: language === 'pt-BR'
        ? 'Dica: A suspensão na barra desfaz a compressão de horas sentado no computador. Queixo recolhido sempre!'
        : 'Tip: Dead hangs decompress hours of desk strain. Always keep your chin tucked!'
    },
    {
      step: 5,
      targetTab: 'backup' as const,
      icon: Cloud,
      iconColor: 'text-blue-400 bg-blue-950/60 border-blue-500/40',
      title: t.tourStep5Title,
      desc: t.tourStep5Desc,
      tip: language === 'pt-BR'
        ? 'Dica: Salve um backup em arquivo .json ou conecte seu Google Drive para sincronização segura.'
        : 'Tip: Save an offline .json backup anytime or connect your personal Google Drive for cloud sync.'
    }
  ];

  const current = stepsData[currentStep - 1] || stepsData[0];
  const Icon = current.icon;

  useEffect(() => {
    onTabChange(current.targetTab);
  }, [currentStep]);

  return (
    <div className="fixed bottom-4 left-4 right-4 sm:left-auto sm:right-6 sm:bottom-6 sm:max-w-md z-50 animate-in fade-in slide-in-from-bottom-4 duration-300">
      <div className="bg-slate-900/95 border-2 border-brand-500/80 rounded-3xl p-5 shadow-2xl backdrop-blur-xl ring-4 ring-brand-500/10">
        {/* Top Header */}
        <div className="flex items-center justify-between gap-3 mb-3">
          <div className="flex items-center gap-2">
            <span className="p-1.5 rounded-lg bg-brand-500/20 text-brand-400">
              <Sparkles className="w-3.5 h-3.5" />
            </span>
            <span className="text-xs font-mono font-bold uppercase tracking-wider text-brand-400">
              {t.tourStepCount.replace('{step}', String(currentStep)).replace('{total}', String(totalSteps))}
            </span>
          </div>

          <button
            onClick={onCloseTour}
            className="p-1 rounded-lg text-slate-400 hover:text-white hover:bg-slate-800 transition"
            title={t.tourSkip}
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Progress Bar */}
        <div className="w-full bg-slate-800 h-1 rounded-full mb-4 overflow-hidden">
          <div
            className="bg-brand-500 h-1 transition-all duration-300"
            style={{ width: `${(currentStep / totalSteps) * 100}%` }}
          />
        </div>

        {/* Main Card Content */}
        <div className="flex items-start gap-3.5 mb-3">
          <div className={`p-2.5 rounded-2xl border ${current.iconColor} shrink-0 mt-0.5`}>
            <Icon className="w-5 h-5" />
          </div>
          <div>
            <h4 className="font-bold text-base text-white">{current.title}</h4>
            <p className="text-xs text-slate-300 mt-1 leading-relaxed">{current.desc}</p>
          </div>
        </div>

        {/* Tip pill */}
        <div className="p-2.5 rounded-xl bg-slate-950/80 border border-slate-800 text-[11px] text-slate-400 mb-4 leading-normal">
          {current.tip}
        </div>

        {/* Action Controls */}
        <div className="flex items-center justify-between gap-2">
          {currentStep > 1 ? (
            <button
              onClick={() => onStepChange(currentStep - 1)}
              className="px-3 py-1.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-xs font-bold text-slate-300 flex items-center gap-1 transition"
            >
              <ArrowLeft className="w-3.5 h-3.5" />
              <span>{t.tourPrev}</span>
            </button>
          ) : (
            <button
              onClick={onCloseTour}
              className="text-xs text-slate-400 hover:text-white px-2 py-1 transition"
            >
              {t.tourSkip}
            </button>
          )}

          {currentStep < totalSteps ? (
            <button
              onClick={() => onStepChange(currentStep + 1)}
              className="px-5 py-2 rounded-xl bg-brand-500 hover:bg-brand-400 text-slate-950 font-black text-xs uppercase tracking-wider flex items-center gap-1.5 transition shadow-lg shadow-brand-500/20"
            >
              <span>{t.tourNext}</span>
              <ArrowRight className="w-3.5 h-3.5" />
            </button>
          ) : (
            <button
              onClick={onCloseTour}
              className="px-5 py-2 rounded-xl bg-brand-500 hover:bg-brand-400 text-slate-950 font-black text-xs uppercase tracking-wider flex items-center gap-1.5 transition shadow-lg shadow-brand-500/20"
            >
              <CheckCircle2 className="w-4 h-4" />
              <span>{t.tourFinish}</span>
            </button>
          )}
        </div>
      </div>
    </div>
  );
};
