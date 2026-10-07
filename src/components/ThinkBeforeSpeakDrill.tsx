import React, { useState, useEffect } from 'react';
import { X, Flame, HeartPulse, Brain, Wind, CheckCircle2, AlertOctagon, RotateCcw, Volume2, ArrowRight } from 'lucide-react';
import { EMOTIONAL_SCENARIOS, getRandomScenario } from '../data/emotionalScenarios';
import { ProvocationScenario, EmotionalControlDrillLog } from '../types/mood';
import { soundService } from '../services/soundService';

interface ThinkBeforeSpeakDrillProps {
  onCompleteDrill: (log: Omit<EmotionalControlDrillLog, 'id' | 'timestamp'>) => void;
  onClose: () => void;
  initialHeartRateElevated?: boolean;
}

type DrillStep = 'elevate' | 'freeze' | 'sigh' | 'scenario' | 'finished';

export const ThinkBeforeSpeakDrill: React.FC<ThinkBeforeSpeakDrillProps> = ({
  onCompleteDrill,
  onClose,
  initialHeartRateElevated = false
}) => {
  const [step, setStep] = useState<DrillStep>(initialHeartRateElevated ? 'freeze' : 'elevate');
  const [elevateTimer, setElevateTimer] = useState(25);
  const [freezeTimer, setFreezeTimer] = useState(10);
  const [sighCycle, setSighCycle] = useState(1);
  const [sighPhase, setSighPhase] = useState<'inhale1' | 'inhale2' | 'exhale'>('inhale1');
  const [scenario, setScenario] = useState<ProvocationScenario>(getRandomScenario());
  const [impulseResisted, setImpulseResisted] = useState(true);

  // Step 1: Elevate Heart Rate Timer
  useEffect(() => {
    if (step !== 'elevate') return;
    if (elevateTimer <= 0) {
      setStep('freeze');
      soundService.speak('Freeze! Heart is racing. Unclench jaw. Absolute silence for 10 seconds.');
      return;
    }

    const t = setInterval(() => {
      setElevateTimer(prev => prev - 1);
    }, 1000);
    return () => clearInterval(t);
  }, [step, elevateTimer]);

  // Step 2: Somatic Freeze & Silence Timer
  useEffect(() => {
    if (step !== 'freeze') return;
    if (freezeTimer <= 0) {
      setStep('sigh');
      soundService.speak('Now engage physiological sigh: two quick inhales, one long slow exhale.');
      return;
    }

    const t = setInterval(() => {
      setFreezeTimer(prev => {
        if (prev <= 4 && prev > 1) {
          soundService.playTone(440, 0.1, 'sine', 0.15);
        }
        return prev - 1;
      });
    }, 1000);
    return () => clearInterval(t);
  }, [step, freezeTimer]);

  // Step 3: Physiological Sigh cycles
  useEffect(() => {
    if (step !== 'sigh') return;

    let cycleTimer: number;
    if (sighPhase === 'inhale1') {
      cycleTimer = window.setTimeout(() => setSighPhase('inhale2'), 1500);
    } else if (sighPhase === 'inhale2') {
      cycleTimer = window.setTimeout(() => setSighPhase('exhale'), 1000);
    } else {
      // exhale
      cycleTimer = window.setTimeout(() => {
        if (sighCycle < 3) {
          setSighCycle(c => c + 1);
          setSighPhase('inhale1');
        } else {
          setStep('scenario');
          soundService.speak('Prefrontal cortex online. Review the provocation scenario.');
        }
      }, 4000);
    }

    return () => clearTimeout(cycleTimer);
  }, [step, sighPhase, sighCycle]);

  const handleFinish = () => {
    const todayStr = new Date().toISOString().split('T')[0];
    onCompleteDrill({
      date: todayStr,
      drillType: 'high_hr_pause',
      heartRateState: initialHeartRateElevated ? 'elevated_post_hiit' : 'elevated_post_hiit',
      pauseSecondsAchieved: 10,
      scenarioId: scenario.id,
      impulseResisted,
      reflection: `Rehearsed prefrontal response under elevated adrenaline.`
    });
    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 bg-black/90 backdrop-blur-md flex items-center justify-center p-4 overflow-y-auto">
      <div className="bg-slate-900 border border-slate-800 rounded-3xl max-w-xl w-full p-6 text-slate-100 shadow-2xl relative">
        {/* Top Header */}
        <div className="flex items-center justify-between border-b border-slate-800 pb-4 mb-4">
          <div className="flex items-center gap-2.5">
            <div className="p-2 rounded-xl bg-orange-950/60 border border-orange-500/30 text-orange-400">
              <Brain className="w-5 h-5" />
            </div>
            <div>
              <h2 className="text-base font-black text-white">High Heart Rate Emotional Control Drill</h2>
              <p className="text-xs text-slate-400">Stress Inoculation • Neurovisceral Prefrontal Brake</p>
            </div>
          </div>
          <button onClick={onClose} className="p-2 text-slate-400 hover:text-white transition">
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* STEP 1: ELEVATE PULSE */}
        {step === 'elevate' && (
          <div className="text-center py-6 space-y-4">
            <div className="w-20 h-20 rounded-full bg-orange-950/60 border-2 border-orange-500/40 text-orange-400 flex items-center justify-center mx-auto animate-pulse">
              <Flame className="w-10 h-10" />
            </div>
            <div>
              <span className="text-xs font-black uppercase tracking-widest text-orange-400 block mb-1">
                PHASE 1: SPIKE ADRENALINE
              </span>
              <h3 className="text-2xl font-black text-white">Jump Rope or Burpees Sprint!</h3>
              <p className="text-xs text-slate-300 max-w-md mx-auto mt-2 leading-relaxed">
                Elevate your heart rate right now to simulate the fight-or-flight surge of feeling attacked, hungry, or exhausted.
              </p>
            </div>

            <div className="text-5xl font-mono font-black text-white py-2">
              {elevateTimer}s
            </div>

            <div className="flex flex-col sm:flex-row gap-2 justify-center pt-2">
              <button
                onClick={() => {
                  setStep('freeze');
                  soundService.speak('Freeze! Notice the racing heart. Silence for 10 seconds.');
                }}
                className="px-5 py-2.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-xs font-bold text-slate-200 border border-slate-700 transition"
              >
                My Pulse Is Already Pounding (Skip to Freeze) →
              </button>
            </div>
          </div>
        )}

        {/* STEP 2: THE 10-SECOND SOMATIC FREEZE & SILENCE */}
        {step === 'freeze' && (
          <div className="text-center py-6 space-y-4">
            <div className="w-28 h-28 rounded-full bg-blue-950/60 border-4 border-blue-500/50 flex flex-col items-center justify-center mx-auto shadow-2xl">
              <span className="text-5xl font-mono font-black text-white">{freezeTimer}</span>
              <span className="text-[10px] uppercase font-bold text-blue-300">Silence</span>
            </div>

            <div>
              <span className="text-xs font-black uppercase tracking-widest text-blue-400 block mb-1">
                PHASE 2: THE INHIBITORY FREEZE
              </span>
              <h3 className="text-2xl font-black text-white">Total Silence & Bodyscan</h3>
              <p className="text-xs text-slate-300 max-w-md mx-auto mt-2 leading-relaxed">
                Your heart is pounding. <strong>Do NOT speak or react.</strong> Unclench your jaw. Drop your shoulders down away from your ears. Notice the adrenaline without acting on it.
              </p>
            </div>

            <div className="p-3 rounded-xl bg-slate-950 border border-slate-800 text-xs text-slate-400 max-w-sm mx-auto">
              🧠 <em>Science:</em> By actively withholding reaction during elevated tachycardia, you strengthen synaptic inhibition in the prefrontal cortex.
            </div>
          </div>
        )}

        {/* STEP 3: PHYSIOLOGICAL SIGH */}
        {step === 'sigh' && (
          <div className="text-center py-6 space-y-5">
            <div className="relative w-36 h-36 mx-auto flex items-center justify-center">
              <div
                className={`w-full h-full rounded-full border-4 transition-all duration-1000 flex flex-col items-center justify-center ${
                  sighPhase === 'inhale1'
                    ? 'scale-100 border-brand-400 bg-brand-950/30'
                    : sighPhase === 'inhale2'
                    ? 'scale-110 border-brand-300 bg-brand-950/50'
                    : 'scale-90 border-blue-400 bg-blue-950/40'
                }`}
              >
                <Wind className="w-8 h-8 text-brand-400 mb-1" />
                <span className="text-xs font-black uppercase tracking-wider text-white">
                  {sighPhase === 'inhale1' && 'Inhale Nose'}
                  {sighPhase === 'inhale2' && '+ Snap Inhale'}
                  {sighPhase === 'exhale' && 'Slow Mouth Exhale'}
                </span>
                <span className="text-[10px] text-slate-400">Cycle {sighCycle}/3</span>
              </div>
            </div>

            <div>
              <span className="text-xs font-black uppercase tracking-widest text-brand-400 block mb-1">
                PHASE 3: VAGAL BRAKE ACTIVATION
              </span>
              <h3 className="text-xl font-black text-white">Double Inhale • Long Exhale</h3>
              <p className="text-xs text-slate-300 max-w-md mx-auto mt-2 leading-relaxed">
                The fastest biological mechanism to immediately decelerate heart rate and engage parasympathetic control.
              </p>
            </div>
          </div>
        )}

        {/* STEP 4: PROVOCATION SCENARIO (THINK BEFORE YOU SPEAK) */}
        {step === 'scenario' && (
          <div className="py-2 space-y-4">
            <div className="p-4 rounded-2xl bg-slate-950 border border-slate-800">
              <span className="text-[10px] font-black uppercase tracking-wider px-2 py-0.5 rounded bg-amber-950 text-amber-400 border border-amber-800 mb-2 inline-block">
                Simulated Trigger ({scenario.category.toUpperCase()})
              </span>
              <h4 className="text-sm font-bold text-white mb-2 leading-snug">
                "{scenario.situation}"
              </h4>
              <p className="text-xs text-slate-400 italic">
                ⚠️ Somatic Warning: {scenario.somaticWarning}
              </p>
            </div>

            {/* Contrast: Impulsive vs Controlled */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <div className="p-3.5 rounded-xl bg-red-950/30 border border-red-500/30 text-xs">
                <span className="text-[11px] font-black uppercase text-red-400 block mb-1 flex items-center gap-1">
                  ❌ Impulsive Reaction
                </span>
                <p className="text-slate-300 font-medium italic">
                  {scenario.impulsiveReaction}
                </p>
              </div>

              <div className="p-3.5 rounded-xl bg-emerald-950/40 border border-emerald-500/40 text-xs">
                <span className="text-[11px] font-black uppercase text-emerald-400 block mb-1 flex items-center gap-1">
                  ✅ Prefrontal Mastered Response
                </span>
                <p className="text-slate-100 font-bold">
                  {scenario.prefrontalResponse}
                </p>
              </div>
            </div>

            <div className="p-3 rounded-xl bg-brand-950/20 border border-brand-500/20 text-xs text-slate-300">
              💡 <strong>Speech Rule:</strong> {scenario.mentalPauseTip}
            </div>

            <div className="flex gap-2 pt-2">
              <button
                type="button"
                onClick={() => setScenario(getRandomScenario())}
                className="p-2.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300 transition"
                title="Another Scenario"
              >
                <RotateCcw className="w-4 h-4" />
              </button>
              <button
                onClick={handleFinish}
                className="flex-1 py-3 rounded-xl bg-brand-500 hover:bg-brand-400 text-slate-950 font-black text-xs uppercase tracking-wider transition shadow-lg flex items-center justify-center gap-2"
              >
                <CheckCircle2 className="w-4 h-4" /> I Rehearsed The Pause (Log Drill)
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};
