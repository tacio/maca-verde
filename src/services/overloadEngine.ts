import { UserFitnessProfile, DailyOverloadChallenge, WorkoutRoutine } from '../types/fitness';
import { WORKOUT_ROUTINES } from '../data/routines';

const MOTIVATIONAL_QUOTES_EN = [
  "One day or Day One. You decided today.",
  "Your spine supports your entire future. Chin tucked, shoulders back.",
  "Consistency beats intensity. Just 15 minutes today changes your posture forever.",
  "Fat is mobilized by metabolic shock, not endless boring miles.",
  "Every second on the door bar decompresses hours of desk compression.",
  "The secret of champions is doing what average people dread: showing up every single day.",
  "Each turn of the rope fuels your heart's stroke volume. Keep breathing.",
  "Posture is non-verbal power. Stand tall, tuck that chin, ignite your core."
];

const MOTIVATIONAL_QUOTES_PT = [
  "Ou é 'um dia' ou é o 'Dia Um'. Você decidiu hoje.",
  "Sua coluna sustenta todo o seu futuro. Queixo recolhido, ombros para trás.",
  "Consistência supera intensidade. Apenas 15 minutos hoje mudam sua postura para sempre.",
  "Gordura visceral é queimada com choque metabólico, não com horas de tédio.",
  "Cada segundo na barra fixa desconprime horas curvado no computador.",
  "O segredo dos vencedores é fazer o que a maioria evita: comparecer todo santo dia.",
  "Cada giro de corda fortalece seu coração. Mantenha o ar fluindo.",
  "Postura é autoridade não-verbal. Peito aberto, queixo alinhado, abdômen de aço."
];

export class OverloadEngine {
  /**
   * Determine today's challenge based on streak and previous records
   */
  public static getDailyChallenge(profile: UserFitnessProfile): DailyOverloadChallenge {
    const todayStr = new Date().toISOString().split('T')[0];
    const dayNumber = Math.max(1, profile.currentStreak + 1);
    const isPt = profile.language === 'pt-BR';
    const quotes = isPt ? MOTIVATIONAL_QUOTES_PT : MOTIVATIONAL_QUOTES_EN;

    // Rotate challenge focus based on day number to balance Posture, Fat Burn, and Cardio
    const challengeTypeIndex = dayNumber % 3;

    if (challengeTypeIndex === 1) {
      // Posture / Door Bar focus
      const targetHang = Math.min(90, Math.max(25, profile.personalRecords.maxDeadHangSeconds + 2));
      return {
        date: todayStr,
        dayNumber,
        title: isPt
          ? `Dia ${dayNumber}: Descompressão Cervical & Torácica na Barra`
          : `Day ${dayNumber} Overload: Cervical & Thoracic Spine Decompression`,
        description: isPt
          ? `Mantenha a suspensão na barra com queixo recolhido por pelo menos ${targetHang}s durante os intervalos.`
          : `Hold your door bar dead hang with active chin tuck for at least ${targetHang}s during intervals.`,
        targetType: 'dead_hang',
        bonusTarget: isPt
          ? `Meta: ${targetHang}s na Barra Fixa (Superar recorde de ${profile.personalRecords.maxDeadHangSeconds}s)`
          : `Target: ${targetHang}s Dead Hang (Beat personal record of ${profile.personalRecords.maxDeadHangSeconds}s)`,
        routineId: 'posture-text-neck-antidote',
        motivationalQuote: quotes[dayNumber % quotes.length]
      };
    } else if (challengeTypeIndex === 2) {
      // Belly Fat / Tabata focus
      return {
        date: todayStr,
        dayNumber,
        title: isPt
          ? `Dia ${dayNumber}: Queima Metabólica Tabata Gordura Zero`
          : `Day ${dayNumber} Overload: Metabolic Tabata Afterburn`,
        description: isPt
          ? `Entregue 100% de intensidade nos tiros de 20s para liberar catecolaminas e queimar gordura profunda.`
          : `Push for 100% maximum intensity in the 20s sprint intervals to trigger EPOC belly fat oxidation.`,
        targetType: 'posture_focus',
        bonusTarget: isPt
          ? 'Alcançar RPE 8+ e não descer os joelhos na elevação na barra'
          : 'Achieve RPE 8+ and zero knee-drops during Hanging Knee-to-Chest',
        routineId: 'tabata-belly-shred',
        motivationalQuote: quotes[dayNumber % quotes.length]
      };
    } else {
      // Cardio / Jump Rope focus
      const targetJumps = Math.max(150, (dayNumber * 25) + 100);
      return {
        date: todayStr,
        dayNumber,
        title: isPt
          ? `Dia ${dayNumber}: Explosão Cardiorrespiratória na Corda`
          : `Day ${dayNumber} Overload: Jump Rope Cardio Surge`,
        description: isPt
          ? `Acumule mais de ${targetJumps} giros totais mantendo a postura altiva e o olhar para frente.`
          : `Accumulate ${targetJumps}+ total rope turns across the HIIT intervals with eyes locked forward at eye-level.`,
        targetType: 'jump_rope',
        bonusTarget: isPt
          ? `Meta: Mais de ${targetJumps} giros sem quebrar a postura`
          : `Target: ${targetJumps}+ rope turns without breaking posture`,
        routineId: 'daily-adaptive-overload',
        motivationalQuote: quotes[dayNumber % quotes.length]
      };
    }
  }

  /**
   * Applies the progressive overload formula to adjust exercise intervals
   * for a routine based on user level and overloadMultiplier.
   */
  public static scaleRoutineForUser(baseRoutine: WorkoutRoutine, profile: UserFitnessProfile): WorkoutRoutine {
    // Overload formula: slightly scale work seconds or reduce rest
    const multiplier = profile.overloadMultiplier; // e.g. 1.0 to 1.3
    const levelBonusSeconds = Math.min(10, Math.floor((profile.level - 1) * 1.5));

    const scaledExercises = baseRoutine.exercises.map(item => {
      // Calculate scaled work time (capped within safe HIIT bounds)
      const scaledWork = Math.min(50, Math.round(item.workSeconds * multiplier + (levelBonusSeconds > 0 ? 2 : 0)));
      // Rest intervals stay crisp (or slightly reduce for high levels)
      const scaledRest = Math.max(10, item.restSeconds);

      return {
        ...item,
        workSeconds: scaledWork,
        restSeconds: scaledRest
      };
    });

    const totalDurationEstimate = Math.ceil(
      ((scaledExercises.reduce((acc, curr) => acc + curr.workSeconds + curr.restSeconds, 0) * baseRoutine.rounds) +
      (baseRoutine.roundRestSeconds * (baseRoutine.rounds - 1)) +
      baseRoutine.prepSeconds) / 60
    );

    return {
      ...baseRoutine,
      exercises: scaledExercises,
      estimatedDurationMinutes: totalDurationEstimate,
      estimatedCalories: Math.round(baseRoutine.estimatedCalories * multiplier)
    };
  }

  /**
   * Calculate updated streak and profile after a workout
   */
  public static calculateStreakUpdate(profile: UserFitnessProfile, workoutDate: string): { currentStreak: number; bestStreak: number } {
    const lastDateStr = profile.lastCompletedDate;
    if (!lastDateStr) {
      return { currentStreak: 1, bestStreak: Math.max(1, profile.bestStreak) };
    }

    if (lastDateStr === workoutDate) {
      // Completed another workout on same day - streak remains same
      return { currentStreak: profile.currentStreak, bestStreak: profile.bestStreak };
    }

    const last = new Date(lastDateStr);
    const curr = new Date(workoutDate);
    const diffTime = Math.abs(curr.getTime() - last.getTime());
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));

    if (diffDays === 1) {
      // Consecutive day! Streak + 1
      const newStreak = profile.currentStreak + 1;
      return {
        currentStreak: newStreak,
        bestStreak: Math.max(newStreak, profile.bestStreak)
      };
    } else if (diffDays > 1) {
      // Missed days - reset to 1
      return {
        currentStreak: 1,
        bestStreak: profile.bestStreak
      };
    }

    return { currentStreak: profile.currentStreak, bestStreak: profile.bestStreak };
  }
}
