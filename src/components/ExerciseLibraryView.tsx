import React, { useState } from 'react';
import { Search, ShieldAlert, Dumbbell, ChevronDown, ChevronUp, Info, CheckCircle2, X } from 'lucide-react';
import { EquipmentType, GoalTarget, Exercise } from '../types/fitness';
import { Language, TRANSLATIONS } from '../i18n/translations';
import { getLocalizedExercises } from '../data/localizedData';

interface ExerciseLibraryViewProps {
  language?: Language;
}

export const ExerciseLibraryView: React.FC<ExerciseLibraryViewProps> = ({ language = 'pt-BR' }) => {
  const t = TRANSLATIONS[language];
  const localizedExerciseMap = getLocalizedExercises(language);
  const exerciseList = Object.values(localizedExerciseMap);

  const [search, setSearch] = useState('');
  const [filterGoal, setFilterGoal] = useState<string>('all');
  const [filterEquipment, setFilterEquipment] = useState<string>('all');
  const [selectedExerciseModal, setSelectedExerciseModal] = useState<Exercise | null>(null);

  const filteredExercises = exerciseList.filter(ex => {
    const matchesSearch = ex.name.toLowerCase().includes(search.toLowerCase()) ||
      ex.description.toLowerCase().includes(search.toLowerCase()) ||
      ex.targetMuscles.some(m => m.toLowerCase().includes(search.toLowerCase()));

    const matchesGoal = filterGoal === 'all' || ex.targets.includes(filterGoal as GoalTarget) || (filterGoal === 'posture' && ex.targets.includes('posture'));
    const matchesEquipment = filterEquipment === 'all' || ex.equipment === filterEquipment;

    return matchesSearch && matchesGoal && matchesEquipment;
  });

  const getEquipmentBadge = (eq: EquipmentType) => {
    if (eq === 'door_bar') return { label: t.eqDoorBar, color: 'bg-indigo-950/80 text-indigo-300 border-indigo-800' };
    if (eq === 'rope') return { label: t.eqRope, color: 'bg-amber-950/80 text-amber-300 border-amber-800' };
    return { label: t.eqBodyweight, color: 'bg-slate-800 text-slate-300 border-slate-700' };
  };

  return (
    <div className="space-y-5">
      {/* Search & Filters Bar (Clean, compact) */}
      <div className="bg-slate-900 border border-slate-800 rounded-2xl p-4 sm:p-5 shadow-lg">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 mb-3">
          <div className="flex items-center gap-2">
            <Dumbbell className="w-5 h-5 text-brand-400" />
            <h2 className="text-lg font-black text-white">{t.libraryTitle}</h2>
          </div>
          <span className="text-xs text-slate-400">
            {filteredExercises.length} {language === 'pt-BR' ? 'exercícios' : 'exercises'}
          </span>
        </div>

        <div className="flex flex-col sm:flex-row gap-2.5">
          <div className="relative flex-1">
            <Search className="w-4 h-4 absolute left-3.5 top-3 text-slate-400" />
            <input
              type="text"
              placeholder={t.searchPlaceholder}
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="w-full bg-slate-950 border border-slate-800 rounded-xl pl-10 pr-4 py-2 text-xs text-slate-100 placeholder-slate-500 focus:outline-none focus:border-brand-500"
            />
          </div>

          <div className="flex gap-2">
            <select
              value={filterGoal}
              onChange={(e) => setFilterGoal(e.target.value)}
              className="bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 text-xs font-semibold text-slate-200 focus:outline-none focus:border-brand-500"
            >
              <option value="all">{t.allGoals}</option>
              <option value="posture">{t.goalPosture}</option>
              <option value="belly_fat">{t.goalBellyFat}</option>
              <option value="cardio">{t.goalCardio}</option>
            </select>

            <select
              value={filterEquipment}
              onChange={(e) => setFilterEquipment(e.target.value)}
              className="bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 text-xs font-semibold text-slate-200 focus:outline-none focus:border-brand-500"
            >
              <option value="all">{t.allEquipment}</option>
              <option value="door_bar">🚪 {t.eqDoorBar}</option>
              <option value="rope">🪢 {t.eqRope}</option>
              <option value="bodyweight">🧘 {t.eqBodyweight}</option>
            </select>
          </div>
        </div>
      </div>

      {/* Sleek Exercise Cards Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
        {filteredExercises.map(ex => {
          const eqBadge = getEquipmentBadge(ex.equipment);
          return (
            <div
              key={ex.id}
              className="bg-slate-900/90 border border-slate-800 hover:border-slate-700/80 rounded-2xl p-4 shadow-md flex flex-col justify-between transition-all"
            >
              <div>
                <div className="flex items-center justify-between gap-2 mb-2">
                  <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full border ${eqBadge.color}`}>
                    {eqBadge.label}
                  </span>
                  <div className="flex gap-1">
                    {ex.targets.map(tar => (
                      <span key={tar} className="text-[9px] font-medium px-1.5 py-0.5 rounded bg-slate-800 text-slate-400 capitalize">
                        {tar.replace('_', ' ')}
                      </span>
                    ))}
                  </div>
                </div>

                <h3 className="text-base font-bold text-white mb-1">{ex.name}</h3>

                {/* 1-Line Posture Cue */}
                {ex.textNeckCue && (
                  <div className="p-2 rounded-xl bg-brand-950/30 border border-brand-500/20 mb-2.5">
                    <p className="text-xs text-brand-300 font-medium line-clamp-2">
                      🛡️ {ex.textNeckCue}
                    </p>
                  </div>
                )}
              </div>

              {/* Bottom Card Controls: Muscles & Details Button */}
              <div className="pt-2.5 border-t border-slate-800/80 flex items-center justify-between gap-2">
                <div className="flex flex-wrap gap-1">
                  {ex.targetMuscles.slice(0, 2).map(m => (
                    <span key={m} className="text-[10px] px-1.5 py-0.5 rounded bg-slate-950 text-slate-400 border border-slate-800">
                      {m}
                    </span>
                  ))}
                  {ex.targetMuscles.length > 2 && (
                    <span className="text-[10px] text-slate-500">+{ex.targetMuscles.length - 2}</span>
                  )}
                </div>

                <button
                  onClick={() => setSelectedExerciseModal(ex)}
                  className="px-2.5 py-1 rounded-lg bg-slate-800 hover:bg-slate-700 text-xs font-bold text-slate-300 hover:text-white transition flex items-center gap-1"
                >
                  <Info className="w-3 h-3 text-brand-400" />
                  <span>{t.viewDetails}</span>
                </button>
              </div>
            </div>
          );
        })}
      </div>

      {/* Clean Detail Modal (Progressive Disclosure) */}
      {selectedExerciseModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-sm animate-in fade-in duration-200">
          <div className="bg-slate-900 border border-slate-800 rounded-3xl p-6 max-w-lg w-full shadow-2xl relative max-h-[85vh] overflow-y-auto space-y-4">
            <button
              onClick={() => setSelectedExerciseModal(null)}
              className="absolute top-4 right-4 p-1.5 rounded-lg text-slate-400 hover:text-white hover:bg-slate-800 transition"
            >
              <X className="w-5 h-5" />
            </button>

            <div>
              <div className="flex items-center gap-2 mb-1.5">
                <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full border ${getEquipmentBadge(selectedExerciseModal.equipment).color}`}>
                  {getEquipmentBadge(selectedExerciseModal.equipment).label}
                </span>
              </div>
              <h3 className="text-xl font-black text-white">{selectedExerciseModal.name}</h3>
              <p className="text-xs text-slate-300 mt-1 leading-relaxed">{selectedExerciseModal.description}</p>
            </div>

            {/* Posture Cue Box */}
            {selectedExerciseModal.textNeckCue && (
              <div className="p-3 rounded-2xl bg-brand-950/40 border border-brand-500/30">
                <span className="text-[10px] font-black uppercase tracking-wider text-brand-400 block mb-0.5 flex items-center gap-1">
                  <ShieldAlert className="w-3.5 h-3.5" /> {t.postureCueTitle}
                </span>
                <p className="text-xs text-slate-200 font-medium">
                  {selectedExerciseModal.textNeckCue}
                </p>
              </div>
            )}

            {/* Biomechanical Impacts */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 text-xs">
              <div className="p-2.5 rounded-xl bg-slate-950 border border-slate-800">
                <span className="font-bold text-emerald-400 block mb-0.5">{t.postureImpact}:</span>
                <span className="text-slate-300 text-[11px] leading-tight block">{selectedExerciseModal.postureBenefit}</span>
              </div>
              <div className="p-2.5 rounded-xl bg-slate-950 border border-slate-800">
                <span className="font-bold text-orange-400 block mb-0.5">{t.bellyImpact}:</span>
                <span className="text-slate-300 text-[11px] leading-tight block">{selectedExerciseModal.bellyBurnBenefit}</span>
              </div>
            </div>

            {/* Execution Form Points */}
            <div>
              <span className="text-xs font-bold uppercase tracking-wider text-slate-400 block mb-1.5">
                {t.executionTechnique}:
              </span>
              <ul className="space-y-1">
                {selectedExerciseModal.formPoints.map((point, idx) => (
                  <li key={idx} className="text-xs text-slate-300 flex items-start gap-2">
                    <span className="text-brand-400 font-bold">•</span>
                    <span>{point}</span>
                  </li>
                ))}
              </ul>
            </div>

            {/* Targeted Muscles */}
            <div className="pt-2 border-t border-slate-800">
              <span className="text-[11px] text-slate-400 block mb-1">Músculos Ativados:</span>
              <div className="flex flex-wrap gap-1">
                {selectedExerciseModal.targetMuscles.map(m => (
                  <span key={m} className="text-[10px] px-2 py-0.5 rounded bg-slate-950 text-slate-300 border border-slate-800">
                    {m}
                  </span>
                ))}
              </div>
            </div>

            <button
              onClick={() => setSelectedExerciseModal(null)}
              className="w-full py-2.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-white font-bold text-xs uppercase tracking-wider transition"
            >
              {t.closeModal}
            </button>
          </div>
        </div>
      )}
    </div>
  );
};
