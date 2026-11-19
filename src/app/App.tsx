import { lazy, Suspense } from 'react';
import { AppProvider, useApp } from './AppContext';
import { NavProvider, initialView, intArg, parseFlow, useNav, type OnboardStep } from './nav';
import { CycleScreen } from './screens/CycleScreen';
import { DayScreen } from './screens/DayScreen';
import { JustifyScreen } from './screens/JustifyScreen';
import { MoodScreen } from './screens/MoodScreen';
import { Onboarding } from './screens/Onboarding';
import { PlaceholderScreen } from './screens/Placeholder';
import { PlanScreen } from './screens/PlanScreen';
import { ProgressScreen } from './screens/ProgressScreen';
import { SettingsScreen } from './screens/SettingsScreen';
import { TodayScreen } from './screens/TodayScreen';

// Dev-only primitives gallery (?scenario=ui-gallery). Behind import.meta.env.DEV
// so production builds drop it, like the scenarios.
const Gallery = import.meta.env.DEV ? lazy(() => import('../dev/Gallery')) : null;

function Screens({ onboardStep }: { onboardStep?: OnboardStep }) {
  const { data, record } = useApp();
  const { tab, flow } = useNav();

  if (!data.settings.onboardedUnix) return <Onboarding initialStep={onboardStep} />;
  if (flow) {
    const { name, args } = parseFlow(flow);
    switch (name) {
      case 'settings':
        return <SettingsScreen />;
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
