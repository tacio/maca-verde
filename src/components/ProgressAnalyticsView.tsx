import React from 'react';
import { Flame, Trophy, HeartPulse, Activity, Zap, Calendar, Clock, Award, TrendingDown, ArrowUpRight } from 'lucide-react';
import { UserFitnessProfile, WorkoutLogEntry } from '../types/fitness';

interface ProgressAnalyticsViewProps {
  profile: UserFitnessProfile;
  logs: WorkoutLogEntry[];
}

export const ProgressAnalyticsView: React.FC<ProgressAnalyticsViewProps> = ({ profile, logs }) => {
  // Generate last 60 days for heatmap
  const getDaysArray = (numDays: number) => {
    const arr = [];
    const today = new Date();
    for (let i = numDays - 1; i >= 0; i--) {
      const d = new Date(today);
      d.setDate(d.getDate() - i);
      arr.push(d.toISOString().split('T')[0]);
    }
    return arr;
  };

  const past60Days = getDaysArray(60);
  const logMap = new Map<string, WorkoutLogEntry[]>();
  logs.forEach(log => {
    const list = logMap.get(log.date) || [];
    list.push(log);
    logMap.set(log.date, list);
  });

  const formatTotalTime = (seconds: number) => {
    const hours = Math.floor(seconds / 3600);
    const mins = Math.floor((seconds % 3600) / 60);
    if (hours > 0) return `${hours}h ${mins}m`;
    return `${mins}m`;
  };

  // Recent neck tension trend
  const recentNeckScores = logs.slice(0, 10).map(l => l.neckDiscomfortScore);
  const avgNeckScore = recentNeckScores.length > 0
    ? (recentNeckScores.reduce((a, b) => a + b, 0) / recentNeckScores.length).toFixed(1)
    : 'N/A';

  return (
    <div className="space-y-6">
      {/* Top Stats Overview */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
        <div className="bg-slate-900 border border-slate-800 rounded-2xl p-4">
          <div className="flex items-center gap-2 text-xs font-bold text-orange-400 mb-1">
            <Flame className="w-4 h-4" /> Current Streak
          </div>
          <div className="text-3xl font-black text-white">{profile.currentStreak} Days</div>
          <div className="text-[11px] text-slate-400 mt-1">Best: {profile.bestStreak} days</div>
        </div>

        <div className="bg-slate-900 border border-slate-800 rounded-2xl p-4">
          <div className="flex items-center gap-2 text-xs font-bold text-brand-400 mb-1">
            <Clock className="w-4 h-4" /> Total Cardio Time
          </div>
          <div className="text-3xl font-black text-white">{formatTotalTime(profile.totalActiveSeconds)}</div>
          <div className="text-[11px] text-slate-400 mt-1">{profile.totalWorkouts} sessions total</div>
        </div>

        <div className="bg-slate-900 border border-slate-800 rounded-2xl p-4">
          <div className="flex items-center gap-2 text-xs font-bold text-indigo-400 mb-1">
            <Trophy className="w-4 h-4" /> Max Dead Hang
          </div>
          <div className="text-3xl font-black text-white">{profile.personalRecords.maxDeadHangSeconds}s</div>
          <div className="text-[11px] text-slate-400 mt-1">Decompression target: 60s</div>
        </div>

        <div className="bg-slate-900 border border-slate-800 rounded-2xl p-4">
          <div className="flex items-center gap-2 text-xs font-bold text-emerald-400 mb-1">
            <HeartPulse className="w-4 h-4" /> Neck Tension Avg
          </div>
          <div className="text-3xl font-black text-white">{avgNeckScore}/10</div>
          <div className="text-[11px] text-slate-400 mt-1">Goal: ≤ 2 (relaxed spine)</div>
        </div>
      </div>

      {/* 60-Day Consistency Heatmap */}
      <div className="bg-slate-900 border border-slate-800 rounded-2xl p-6">
        <div className="flex items-center justify-between mb-4">
          <div>
            <h3 className="text-base font-bold text-white flex items-center gap-2">
              <Calendar className="w-4 h-4 text-brand-400" />
              60-Day Habit & Daily Overload Heatmap
            </h3>
            <p className="text-xs text-slate-400 mt-0.5">
              Every filled square represents your commitment to better posture, cardio, and discipline.
            </p>
          </div>
        </div>

        <div className="flex flex-wrap gap-1.5 p-3 rounded-xl bg-slate-950 border border-slate-800/80">
          {past60Days.map(dateStr => {
            const dayLogs = logMap.get(dateStr) || [];
            const count = dayLogs.length;
            const isToday = dateStr === new Date().toISOString().split('T')[0];

            let bgClass = 'bg-slate-800/60';
            if (count === 1) bgClass = 'bg-brand-600';
            if (count >= 2) bgClass = 'bg-brand-400';

            return (
              <div
                key={dateStr}
                title={`${dateStr}: ${count} workout(s)`}
                className={`w-4 h-4 rounded-[3px] transition-all cursor-pointer ${bgClass} ${
                  isToday ? 'ring-2 ring-brand-300' : ''
                }`}
              />
            );
          })}
        </div>

        <div className="flex items-center justify-between mt-3 text-[11px] text-slate-400">
          <span>60 days ago</span>
          <div className="flex items-center gap-1.5">
            <span>Less</span>
            <span className="w-3 h-3 rounded-[2px] bg-slate-800/60" />
            <span className="w-3 h-3 rounded-[2px] bg-brand-600" />
            <span className="w-3 h-3 rounded-[2px] bg-brand-400" />
            <span>More</span>
          </div>
          <span>Today</span>
        </div>
      </div>

      {/* Posture & Cardio Transformation Insights */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {/* Posture Check Insight */}
        <div className="bg-slate-900 border border-slate-800 rounded-2xl p-5">
          <div className="flex items-center justify-between mb-3">
            <h4 className="font-bold text-white text-sm flex items-center gap-2">
              <HeartPulse className="w-4 h-4 text-emerald-400" />
              Text-Neck Tension Trajectory
            </h4>
            <span className="text-xs font-mono font-bold text-emerald-400 flex items-center gap-0.5">
              <TrendingDown className="w-3.5 h-3.5" /> Posture Progress
            </span>
          </div>
          <p className="text-xs text-slate-300 mb-4 leading-relaxed">
            By consistently pairing door bar decompression hangs with chin tucks and scapular retractions, your cervical vertebrae decompress and deep neck flexors strengthen.
          </p>

          {/* Simple Sparkline Representation */}
          <div className="h-20 flex items-end gap-2 bg-slate-950 p-3 rounded-xl border border-slate-800/80">
            {logs.slice(0, 12).reverse().map((l, idx) => {
              const heightPct = Math.max(10, (l.neckDiscomfortScore / 10) * 100);
              return (
                <div key={idx} className="flex-1 flex flex-col items-center gap-1">
                  <div
                    className={`w-full rounded-t transition-all ${
                      l.neckDiscomfortScore <= 3 ? 'bg-emerald-500' : 'bg-amber-500'
                    }`}
                    style={{ height: `${heightPct}%` }}
                    title={`${l.date}: Tension ${l.neckDiscomfortScore}/10`}
                  />
                  <span className="text-[9px] text-slate-500 font-mono">{l.neckDiscomfortScore}</span>
                </div>
              );
            })}
            {logs.length === 0 && (
              <div className="text-xs text-slate-500 m-auto">
                Complete your first workout to track posture tension reduction!
              </div>
            )}
          </div>
        </div>

        {/* Metabolic & Equipment Insights */}
        <div className="bg-slate-900 border border-slate-800 rounded-2xl p-5">
          <h4 className="font-bold text-white text-sm flex items-center gap-2 mb-3">
            <Zap className="w-4 h-4 text-orange-400" />
            Equipment Overload Records
          </h4>
          <div className="space-y-3">
            <div className="flex items-center justify-between p-3 rounded-xl bg-slate-950 border border-slate-800/80">
              <div>
                <span className="text-xs font-bold text-slate-200 block">Door Bar Continuous Hang</span>
                <span className="text-[11px] text-slate-400">Current Personal Best</span>
              </div>
              <span className="text-base font-black font-mono text-brand-400">
                {profile.personalRecords.maxDeadHangSeconds} seconds
              </span>
            </div>

            <div className="flex items-center justify-between p-3 rounded-xl bg-slate-950 border border-slate-800/80">
              <div>
                <span className="text-xs font-bold text-slate-200 block">Jump Rope Turns in Session</span>
                <span className="text-[11px] text-slate-400">Max Cadence Volume</span>
              </div>
              <span className="text-base font-black font-mono text-amber-400">
                {profile.personalRecords.maxSingleSetRopeJumps} turns
              </span>
            </div>

            <div className="flex items-center justify-between p-3 rounded-xl bg-slate-950 border border-slate-800/80">
              <div>
                <span className="text-xs font-bold text-slate-200 block">Total Visceral Fat Burn Estimate</span>
                <span className="text-[11px] text-slate-400">HIIT Metabolic EPOC</span>
              </div>
              <span className="text-base font-black font-mono text-orange-400">
                ~{profile.totalCaloriesBurned} kcal
              </span>
            </div>
          </div>
        </div>
      </div>

      {/* Historical Workout Logs */}
      <div className="bg-slate-900 border border-slate-800 rounded-2xl p-6">
        <h3 className="text-base font-bold text-white mb-4">
          Session History ({logs.length} Completed)
        </h3>

        {logs.length === 0 ? (
          <div className="text-center py-10 text-slate-400 text-sm">
            No workouts logged yet. Smash your first session today to ignite your streak!
          </div>
        ) : (
          <div className="space-y-2.5">
            {logs.map((log) => (
              <div
                key={log.id}
                className="flex flex-col sm:flex-row sm:items-center justify-between p-3.5 rounded-xl bg-slate-950 border border-slate-800/80 hover:border-slate-700 transition"
              >
                <div>
                  <div className="flex items-center gap-2">
                    <span className="font-bold text-sm text-slate-100">{log.routineTitle}</span>
                    <span className="text-[10px] px-2 py-0.5 rounded bg-slate-800 text-slate-400 capitalize">
                      {log.protocol}
                    </span>
                  </div>
                  <div className="flex items-center gap-3 text-xs text-slate-400 mt-1">
                    <span>{log.date}</span>
                    <span>•</span>
                    <span>{Math.round(log.durationSeconds / 60)} mins</span>
                    <span>•</span>
                    <span>~{log.estimatedCalories} kcal</span>
                    <span>•</span>
                    <span>RPE: {log.rpeRating}/10</span>
                    <span>•</span>
                    <span className={log.neckDiscomfortScore <= 3 ? 'text-emerald-400' : 'text-amber-400'}>
                      Neck Tension: {log.neckDiscomfortScore}/10
                    </span>
                  </div>
                  {log.overloadNotes && (
                    <p className="text-xs text-slate-300 italic mt-1.5 border-l-2 border-slate-700 pl-2">
                      "{log.overloadNotes}"
                    </p>
                  )}
                </div>

                <div className="mt-2 sm:mt-0 text-right">
                  {log.jumpRopeTurns ? (
                    <span className="text-[11px] font-mono text-amber-300 block">
                      ⚡ {log.jumpRopeTurns} rope turns
                    </span>
                  ) : null}
                  {log.deadHangSeconds ? (
                    <span className="text-[11px] font-mono text-brand-300 block">
                      🚪 {log.deadHangSeconds}s hang
                    </span>
                  ) : null}
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
};
