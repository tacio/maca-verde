import React, { useState } from 'react';
import { Search, ShieldAlert, Flame, Heart, Sparkles, Dumbbell } from 'lucide-react';
import { EXERCISE_LIST } from '../data/exercises';
import { Exercise, GoalTarget, EquipmentType } from '../types/fitness';

export const ExerciseLibraryView: React.FC = () => {
  const [search, setSearch] = useState('');
  const [filterGoal, setFilterGoal] = useState<string>('all');
  const [filterEquipment, setFilterEquipment] = useState<string>('all');

  const filteredExercises = EXERCISE_LIST.filter(ex => {
    const matchesSearch = ex.name.toLowerCase().includes(search.toLowerCase()) ||
      ex.description.toLowerCase().includes(search.toLowerCase()) ||
      ex.targetMuscles.some(m => m.toLowerCase().includes(search.toLowerCase()));

    const matchesGoal = filterGoal === 'all' || ex.targets.includes(filterGoal as GoalTarget) || (filterGoal === 'posture' && ex.targets.includes('posture'));
    const matchesEquipment = filterEquipment === 'all' || ex.equipment === filterEquipment;

    return matchesSearch && matchesGoal && matchesEquipment;
  });

  const getEquipmentBadge = (eq: EquipmentType) => {
    if (eq === 'door_bar') return { label: 'Door Pull-up Bar', color: 'bg-indigo-950 text-indigo-300 border-indigo-800' };
    if (eq === 'rope') return { label: 'Jump Rope', color: 'bg-amber-950 text-amber-300 border-amber-800' };
    return { label: 'Bodyweight', color: 'bg-slate-800 text-slate-300 border-slate-700' };
  };

  return (
    <div className="space-y-6">
      {/* Header & Mission */}
      <div className="bg-slate-900 border border-slate-800 rounded-2xl p-6">
        <h2 className="text-2xl font-black text-white flex items-center gap-2">
          <Dumbbell className="w-6 h-6 text-brand-400" />
          Technique & Posture Prescription Library
        </h2>
        <p className="text-sm text-slate-300 mt-1 max-w-2xl leading-relaxed">
          Master the biomechanics behind curing forward head posture ("text neck"), decompressing your thoracic spine, and accelerating visceral fat oxidation using only your fixed door bar and jump rope.
        </p>

        {/* Search & Filters */}
        <div className="mt-6 flex flex-col md:flex-row gap-3">
          <div className="relative flex-1">
            <Search className="w-4 h-4 absolute left-3.5 top-3.5 text-slate-400" />
            <input
              type="text"
              placeholder="Search exercise, muscle, or posture cue..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="w-full bg-slate-950 border border-slate-800 rounded-xl pl-10 pr-4 py-2.5 text-sm text-slate-100 placeholder-slate-500 focus:outline-none focus:border-brand-500"
            />
          </div>

          <div className="flex flex-wrap gap-2">
            <select
              value={filterGoal}
              onChange={(e) => setFilterGoal(e.target.value)}
              className="bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 text-xs font-semibold text-slate-200 focus:outline-none focus:border-brand-500"
            >
              <option value="all">All Goals</option>
              <option value="posture">🛡️ Posture & Text Neck</option>
              <option value="belly_fat">🔥 Belly Fat & Core</option>
              <option value="cardio">⚡ Cardio Capacity</option>
            </select>

            <select
              value={filterEquipment}
              onChange={(e) => setFilterEquipment(e.target.value)}
              className="bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 text-xs font-semibold text-slate-200 focus:outline-none focus:border-brand-500"
            >
              <option value="all">All Equipment</option>
              <option value="door_bar">🚪 Fixed Door Bar</option>
              <option value="rope">🪢 Jump Rope</option>
              <option value="bodyweight">🧘 Bodyweight</option>
            </select>
          </div>
        </div>
      </div>

      {/* Exercise Cards Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {filteredExercises.map(ex => {
          const eqBadge = getEquipmentBadge(ex.equipment);
          return (
            <div
              key={ex.id}
              className="bg-slate-900/90 border border-slate-800 hover:border-slate-700/80 rounded-2xl p-5 shadow-lg flex flex-col justify-between transition-all"
            >
              <div>
                <div className="flex items-center justify-between gap-2 mb-2">
                  <span className={`text-[10px] font-bold px-2.5 py-0.5 rounded-full border ${eqBadge.color}`}>
                    {eqBadge.label}
                  </span>
                  <div className="flex gap-1">
                    {ex.targets.map(t => (
                      <span key={t} className="text-[10px] font-medium px-2 py-0.5 rounded bg-slate-800 text-slate-400 capitalize">
                        {t.replace('_', ' ')}
                      </span>
                    ))}
                  </div>
                </div>

                <h3 className="text-lg font-bold text-white mb-1.5">{ex.name}</h3>
                <p className="text-xs text-slate-300 leading-relaxed mb-4">
                  {ex.description}
                </p>

                {/* Text Neck Coaching Callout */}
                {ex.textNeckCue && (
                  <div className="p-3 rounded-xl bg-brand-950/40 border border-brand-500/30 mb-3">
                    <span className="text-[10px] font-black uppercase tracking-wider text-brand-400 block mb-0.5 flex items-center gap-1">
                      <ShieldAlert className="w-3.5 h-3.5" /> Text-Neck Posture Cue
                    </span>
                    <p className="text-xs text-slate-200 font-medium">
                      {ex.textNeckCue}
                    </p>
                  </div>
                )}

                {/* Biomechanical Benefits Accordion */}
                <div className="space-y-1.5 text-xs text-slate-300 mb-4">
                  <div className="bg-slate-950/60 p-2.5 rounded-lg border border-slate-800/80">
                    <span className="font-bold text-emerald-400">Posture Impact: </span>
                    {ex.postureBenefit}
                  </div>
                  <div className="bg-slate-950/60 p-2.5 rounded-lg border border-slate-800/80">
                    <span className="font-bold text-orange-400">Belly & Metabolic Impact: </span>
                    {ex.bellyBurnBenefit}
                  </div>
                </div>

                {/* Step by Step execution */}
                <div className="mb-4">
                  <span className="text-[11px] font-bold uppercase tracking-wider text-slate-400 block mb-1.5">
                    Execution Technique:
                  </span>
                  <ul className="space-y-1">
                    {ex.formPoints.map((point, idx) => (
                      <li key={idx} className="text-xs text-slate-400 flex items-start gap-1.5">
                        <span className="text-brand-500 font-bold">•</span>
                        <span>{point}</span>
                      </li>
                    ))}
                  </ul>
                </div>
              </div>

              {/* Muscles Targeted */}
              <div className="pt-3 border-t border-slate-800/80 flex flex-wrap gap-1.5">
                {ex.targetMuscles.map(muscle => (
                  <span key={muscle} className="text-[10px] px-2 py-0.5 rounded bg-slate-950 text-slate-400 border border-slate-800">
                    {muscle}
                  </span>
                ))}
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
};
