import React, { useState } from 'react';
import { X, CheckCircle2, Dumbbell, Trash2 } from 'lucide-react';
import { WorkoutRoutine, WorkoutExerciseItem, WorkoutProtocol, GoalTarget } from '../types/fitness';
import { Language } from '../i18n/translations';
import { getLocalizedExercises } from '../data/localizedData';

interface CustomRoutineModalProps {
  language?: Language;
  onSaveRoutine: (routine: WorkoutRoutine) => void;
  onClose: () => void;
}

export const CustomRoutineModal: React.FC<CustomRoutineModalProps> = ({
  language = 'pt-BR',
  onSaveRoutine,
  onClose
}) => {
  const localizedExerciseMap = getLocalizedExercises(language);
  const exerciseList = Object.values(localizedExerciseMap);

  const [title, setTitle] = useState('');
  const [subtitle, setSubtitle] = useState(language === 'pt-BR' ? 'Circuito Personalizado' : 'Custom Circuit');
  const [protocol, setProtocol] = useState<WorkoutProtocol>('circuit');
  const [primaryGoal, setPrimaryGoal] = useState<GoalTarget>('hybrid');
  const [rounds, setRounds] = useState(3);
  const [roundRestSeconds, setRoundRestSeconds] = useState(45);
  const [exercises, setExercises] = useState<WorkoutExerciseItem[]>([
    { exerciseId: 'rope-boxer-skip-hiit', workSeconds: 30, restSeconds: 15, targetIntensity: 'Moderate' },
    { exerciseId: 'door-bar-dead-hang', workSeconds: 30, restSeconds: 15, targetIntensity: 'Hold / Controlled' },
    { exerciseId: 'chin-tuck-cobra-hold', workSeconds: 30, restSeconds: 15, targetIntensity: 'Hold / Controlled' }
  ]);

  const handleAddExercise = (exerciseId: string) => {
    const ex = localizedExerciseMap[exerciseId];
    setExercises(prev => [
      ...prev,
      {
        exerciseId,
        workSeconds: ex?.defaultWorkSeconds || 30,
        restSeconds: ex?.defaultRestSeconds || 15,
        targetIntensity: 'High'
      }
    ]);
  };

  const handleRemoveExercise = (index: number) => {
    setExercises(prev => prev.filter((_, idx) => idx !== index));
  };

  const handleUpdateExercise = (index: number, updates: Partial<WorkoutExerciseItem>) => {
    setExercises(prev => prev.map((item, idx) => idx === index ? { ...item, ...updates } : item));
  };

  const handleSave = () => {
    if (!title.trim()) {
      alert(language === 'pt-BR' ? 'Por favor insira um título para o treino' : 'Please enter a routine title');
      return;
    }
    if (exercises.length === 0) {
      alert(language === 'pt-BR' ? 'Adicione pelo menos 1 exercício' : 'Please add at least 1 exercise');
      return;
    }

    const totalSeconds = (exercises.reduce((a, b) => a + b.workSeconds + b.restSeconds, 0) * rounds) + (roundRestSeconds * (rounds - 1));
    const estimatedMins = Math.ceil(totalSeconds / 60);

    const newRoutine: WorkoutRoutine = {
      id: `custom-${Date.now()}`,
      title: title.trim(),
      subtitle: subtitle.trim(),
      protocol,
      primaryGoal,
      description: language === 'pt-BR' ? 'Protocolo HIIT personalizado criado pelo usuário.' : 'Personal custom HIIT protocol created by user.',
      exercises,
      rounds,
      roundRestSeconds,
      prepSeconds: 10,
      estimatedCalories: Math.round(estimatedMins * 13),
      estimatedDurationMinutes: estimatedMins
    };

    onSaveRoutine(newRoutine);
    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 bg-black/80 backdrop-blur-sm flex items-center justify-center p-4 overflow-y-auto">
      <div className="bg-slate-900 border border-slate-800 rounded-2xl max-w-2xl w-full p-6 text-slate-100 shadow-2xl relative my-8">
        <div className="flex items-center justify-between border-b border-slate-800 pb-4 mb-4">
          <h2 className="text-xl font-black text-white flex items-center gap-2">
            <Dumbbell className="w-5 h-5 text-brand-400" />
            {language === 'pt-BR' ? 'Criar Treino HIIT Personalizado' : 'Build Custom HIIT Routine'}
          </h2>
          <button
            onClick={onClose}
            className="p-2 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-400 transition"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        <div className="space-y-4 max-h-[70vh] overflow-y-auto pr-1">
          {/* Title & Subtitle */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div>
              <label className="text-xs font-bold text-slate-300 block mb-1">
                {language === 'pt-BR' ? 'Título do Treino' : 'Routine Title'}
              </label>
              <input
                type="text"
                placeholder={language === 'pt-BR' ? 'ex: Meu HIIT Matinal Postura & Corda' : 'e.g. My Morning Posture & Jump Torch'}
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 text-xs text-white focus:outline-none focus:border-brand-500"
              />
            </div>
            <div>
              <label className="text-xs font-bold text-slate-300 block mb-1">
                {language === 'pt-BR' ? 'Subtítulo / Objetivo' : 'Subtitle / Goal'}
              </label>
              <input
                type="text"
                placeholder={language === 'pt-BR' ? 'ex: Hábito Diário de 15 Minutos' : 'e.g. 15-Minute Daily Habit'}
                value={subtitle}
                onChange={(e) => setSubtitle(e.target.value)}
                className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 text-xs text-white focus:outline-none focus:border-brand-500"
              />
            </div>
          </div>

          {/* Rounds & Rest */}
          <div className="grid grid-cols-3 gap-3">
            <div>
              <label className="text-xs font-bold text-slate-300 block mb-1">
                {language === 'pt-BR' ? 'Séries (Rounds)' : 'Rounds'}
              </label>
              <input
                type="number"
                min="1"
                max="10"
                value={rounds}
                onChange={(e) => setRounds(Math.max(1, parseInt(e.target.value) || 1))}
                className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 text-xs font-mono text-white focus:outline-none focus:border-brand-500"
              />
            </div>
            <div>
              <label className="text-xs font-bold text-slate-300 block mb-1">
                {language === 'pt-BR' ? 'Descanso Série (Seg)' : 'Round Rest (Sec)'}
              </label>
              <input
                type="number"
                min="0"
                max="180"
                value={roundRestSeconds}
                onChange={(e) => setRoundRestSeconds(Math.max(0, parseInt(e.target.value) || 0))}
                className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 text-xs font-mono text-white focus:outline-none focus:border-brand-500"
              />
            </div>
            <div>
              <label className="text-xs font-bold text-slate-300 block mb-1">
                {language === 'pt-BR' ? 'Objetivo Primário' : 'Target Goal'}
              </label>
              <select
                value={primaryGoal}
                onChange={(e) => setPrimaryGoal(e.target.value as GoalTarget)}
                className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 text-xs text-white focus:outline-none focus:border-brand-500"
              >
                <option value="hybrid">{language === 'pt-BR' ? 'Híbrido Completo' : 'Hybrid All-in-One'}</option>
                <option value="posture">{language === 'pt-BR' ? 'Postura & Pescoço Tech' : 'Posture & Text Neck'}</option>
                <option value="belly_fat">{language === 'pt-BR' ? 'Gordura Abdominal & Core' : 'Belly Fat & Core'}</option>
                <option value="cardio">{language === 'pt-BR' ? 'Cardio & Corda' : 'Cardio & Jump Rope'}</option>
              </select>
            </div>
          </div>

          {/* Exercises Sequence */}
          <div>
            <label className="text-xs font-bold uppercase tracking-wider text-slate-400 block mb-2">
              {language === 'pt-BR'
                ? `Sequência de Exercícios (${exercises.length} Selecionados)`
                : `Exercises Sequence (${exercises.length} Selected)`}
            </label>
            <div className="space-y-2 mb-3">
              {exercises.map((item, idx) => {
                const ex = localizedExerciseMap[item.exerciseId];
                return (
                  <div
                    key={idx}
                    className="flex items-center justify-between p-3 rounded-xl bg-slate-950 border border-slate-800/80 gap-3"
                  >
                    <div className="flex-1">
                      <span className="text-xs font-bold text-white block">{ex?.name || 'Exercise'}</span>
                      <span className="text-[10px] text-slate-400">
                        {ex?.equipment === 'door_bar'
                          ? (language === 'pt-BR' ? 'Barra de Porta' : 'Door Bar')
                          : ex?.equipment === 'rope'
                          ? (language === 'pt-BR' ? 'Corda de Pular' : 'Jump Rope')
                          : (language === 'pt-BR' ? 'Peso Corporal' : 'Bodyweight')}
                      </span>
                    </div>

                    <div className="flex items-center gap-2">
                      <div className="flex items-center gap-1">
                        <span className="text-[10px] text-slate-400">
                          {language === 'pt-BR' ? 'Treino' : 'Work'}
                        </span>
                        <input
                          type="number"
                          value={item.workSeconds}
                          onChange={(e) => handleUpdateExercise(idx, { workSeconds: Math.max(5, parseInt(e.target.value) || 5) })}
                          className="w-14 bg-slate-900 border border-slate-700 rounded px-1.5 py-1 text-xs text-center font-mono text-white"
                        />
                        <span className="text-[10px] text-slate-400">s</span>
                      </div>

                      <div className="flex items-center gap-1">
                        <span className="text-[10px] text-slate-400">
                          {language === 'pt-BR' ? 'Desc' : 'Rest'}
                        </span>
                        <input
                          type="number"
                          value={item.restSeconds}
                          onChange={(e) => handleUpdateExercise(idx, { restSeconds: Math.max(0, parseInt(e.target.value) || 0) })}
                          className="w-14 bg-slate-900 border border-slate-700 rounded px-1.5 py-1 text-xs text-center font-mono text-white"
                        />
                        <span className="text-[10px] text-slate-400">s</span>
                      </div>

                      <button
                        onClick={() => handleRemoveExercise(idx)}
                        className="p-1.5 text-slate-500 hover:text-red-400 transition"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </div>
                  </div>
                );
              })}
            </div>

            {/* Quick add exercise dropdown */}
            <div className="flex gap-2">
              <select
                id="add-exercise-select"
                className="flex-1 bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 text-xs text-slate-300"
                defaultValue=""
                onChange={(e) => {
                  if (e.target.value) {
                    handleAddExercise(e.target.value);
                    e.target.value = '';
                  }
                }}
              >
                <option value="" disabled>
                  {language === 'pt-BR' ? '+ Adicionar exercício ao circuito...' : '+ Add an exercise to circuit...'}
                </option>
                {exerciseList.map(ex => (
                  <option key={ex.id} value={ex.id}>
                    {ex.name} ({ex.equipment === 'door_bar' ? (language === 'pt-BR' ? 'Barra' : 'Door Bar') : ex.equipment === 'rope' ? (language === 'pt-BR' ? 'Corda' : 'Rope') : (language === 'pt-BR' ? 'Chão' : 'Bodyweight')})
                  </option>
                ))}
              </select>
            </div>
          </div>
        </div>

        {/* Save button */}
        <div className="mt-6 pt-4 border-t border-slate-800 flex justify-end gap-3">
          <button
            onClick={onClose}
            className="px-4 py-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-xs font-semibold text-slate-300 transition"
          >
            {language === 'pt-BR' ? 'Cancelar' : 'Cancel'}
          </button>
          <button
            onClick={handleSave}
            className="px-6 py-2.5 rounded-xl bg-brand-500 hover:bg-brand-400 text-slate-950 font-bold text-xs uppercase tracking-wider transition flex items-center gap-1.5"
          >
            <CheckCircle2 className="w-4 h-4" /> {language === 'pt-BR' ? 'Salvar Treino' : 'Save Routine'}
          </button>
        </div>
      </div>
    </div>
  );
};
