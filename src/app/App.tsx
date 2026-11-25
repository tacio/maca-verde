import { lazy, Suspense, useEffect } from 'react';
import { coach } from '../audio/coach';
import { isDrillStep } from '../drill/drill';
import { AppProvider, useApp } from './AppContext';
import { NavProvider, initialView, intArg, parseFlow, useNav, type OnboardStep } from './nav';
import { CycleScreen } from './screens/CycleScreen';
import { DayScreen } from './screens/DayScreen';
import { DrillScreen } from './screens/DrillScreen';
import { HistoryDayScreen, HistoryScreen } from './screens/HistoryScreen';
import { JustifyScreen } from './screens/JustifyScreen';
import { LearnScreen, LessonScreen } from './screens/LessonScreen';
import { MoodScreen } from './screens/MoodScreen';
import { Onboarding } from './screens/Onboarding';
import { PlaceholderScreen } from './screens/Placeholder';
import { PlanScreen } from './screens/PlanScreen';
import { ProgressScreen } from './screens/ProgressScreen';
import { RestScreen } from './screens/RestScreen';
import { SettingsScreen } from './screens/SettingsScreen';
import { SettingsAnchorScreen, SettingsCoachScreen, SettingsDayScreen } from './screens/settings/BasicSettings';
import { DataScreen } from './screens/settings/DataScreen';
import { ResetScreen } from './screens/settings/ResetScreen';
import { RoutineEditScreen, RoutineViewScreen, RoutinesScreen } from './screens/settings/RoutinesScreen';
import { TemplateScreen, TemplateSlotScreen } from './screens/settings/TemplateScreen';
import { TodayScreen } from './screens/TodayScreen';
import { WorkoutLogScreen } from './screens/WorkoutLogScreen';
import { WorkoutScreen, type HudStart } from './screens/WorkoutScreen';

// Dev-only primitives gallery (?scenario=ui-gallery). Behind import.meta.env.DEV
// so production builds drop it, like the scenarios.
const Gallery = import.meta.env.DEV ? lazy(() => import('../dev/Gallery')) : null;

function Screens({ onboardStep }: { onboardStep?: OnboardStep }) {
  const { data, record } = useApp();
  const { tab, flow } = useNav();
  const { sound, voice } = data.settings;
  useEffect(() => coach.configure({ sound, voice }), [sound, voice]);

  if (!data.settings.onboardedUnix) return <Onboarding initialStep={onboardStep} />;
  if (flow) {
    const { name, args } = parseFlow(flow);
    switch (name) {
      case 'settings':
        return <SettingsScreen />;
      case 'settings-day':
        // Dev scenarios: `settings-day:confirm` opens the re-bucketing confirmation.
        return <SettingsDayScreen key={flow} confirm={import.meta.env.DEV && args[0] === 'confirm'} />;
      case 'settings-anchor':
        return <SettingsAnchorScreen />;
      case 'settings-coach':
        return <SettingsCoachScreen />;
      case 'settings-template': {
        const slot = intArg(args[0]);
        if (slot !== undefined && slot >= 0 && slot <= 9) return <TemplateSlotScreen key={flow} slot={slot} />;
        return <TemplateScreen />;
      }
      case 'settings-routines':
        return <RoutinesScreen />;
      case 'settings-routine':
        return <RoutineViewScreen key={flow} id={args.join(':')} />;
      case 'settings-routine-edit':
        return <RoutineEditScreen key={flow} id={args.join(':') || 'new'} />;
      case 'settings-data':
        // Dev scenarios: `settings-data:connected` simulates a Drive token (no network).
        return <DataScreen connected={import.meta.env.DEV && args[0] === 'connected'} />;
      case 'settings-reset':
        return <ResetScreen />;
      case 'history': {
        const day = intArg(args[0]);
        return day === undefined ? <HistoryScreen /> : <HistoryDayScreen key={flow} day={day} />;
      }
      case 'cycle':
        return <CycleScreen key={flow} cycle={intArg(args[0])} />;
      case 'day-edit':
      case 'day-locked': {
        // Without a day: tomorrow (edit) or today (locked). DayScreen picks the mode from the lock.
        const day = intArg(args[0]) ?? record.today + (name === 'day-edit' ? 1 : 0);
        return <DayScreen key={flow} day={day} blank={args[1] === 'blank'} />;
      }
      case 'mood':
        return <MoodScreen key={flow} more={args[0] === 'more'} />;
      case 'justify':
        return <JustifyScreen />;
      case 'workout': {
        // Dev scenarios: `workout:<id>:work|rest|paused` opens the HUD at that phase.
        const start = (['work', 'rest', 'paused'] as const).find((s) => s === args[1]);
        return <WorkoutScreen key={flow} itemId={args[0] ?? ''} start={start as HudStart | undefined} />;
      }
      case 'workout-log': {
        // Dev scenarios: `workout-log:<id>:full|early` simulates the HUD's result.
        const sim = (['full', 'early'] as const).find((s) => s === args[1]);
        return <WorkoutLogScreen key={flow} itemId={args[0] ?? ''} simulate={sim} />;
      }
      case 'drill': {
        // `drill:after-workout` starts at Freeze; dev scenarios open a step with `drill:<step>`.
        if (args[0] === 'after-workout') return <DrillScreen key={flow} from="freeze" afterWorkout />;
        const from = import.meta.env.DEV && isDrillStep(args[0]) ? args[0] : 'elevate';
        return <DrillScreen key={flow} from={from} afterWorkout={false} />;
      }
      case 'rest':
        return <RestScreen key={flow} itemId={args[0] ?? ''} mid={args[1] === 'mid'} />;
      case 'learn':
        // `learn:<itemId>[:<step>]`: a planned lesson; dev scenarios open a step (1-based).
        return <LearnScreen key={flow} itemId={args[0] ?? ''} step={intArg(args[1])} />;
      case 'lesson':
        // `lesson:<exerciseId>[:<step>]`: review a lesson; logs nothing.
        return <LessonScreen key={flow} skillId={args[0] ?? ''} step={intArg(args[1])} />;
      case 'preview':
        // The workout preview is a sheet over Today, as a flow so back closes it.
        return <TodayScreen preview={args[0]} />;
      default:
        return <PlaceholderScreen name={name} />;
    }
  }
  switch (tab) {
    case 'plan':
      return <PlanScreen />;
    case 'progress':
      return <ProgressScreen />;
    default:
      return <TodayScreen />;
  }
}

export default function App() {
  useEffect(() => coach.installUnlock(), []);
  const screen = new URLSearchParams(window.location.search).get('screen');
  if (Gallery && screen === 'gallery') {
    return (
      <Suspense fallback={null}>
        <Gallery />
      </Suspense>
    );
  }
  const initial = initialView(screen);
  return (
    <AppProvider>
      <NavProvider initial={initial}>
        <Screens onboardStep={initial.onboardStep} />
      </NavProvider>
    </AppProvider>
  );
}
