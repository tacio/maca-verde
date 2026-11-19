import { lazy, Suspense } from 'react';
import { AppProvider, useApp } from './AppContext';
import { NavProvider, initialView, useNav } from './nav';
import { OnboardingPlaceholder } from './screens/OnboardingPlaceholder';
import { PlaceholderScreen } from './screens/Placeholder';
import { PlanScreen } from './screens/PlanScreen';
import { ProgressScreen } from './screens/ProgressScreen';
import { SettingsScreen } from './screens/SettingsScreen';
import { TodayScreen } from './screens/TodayScreen';

// Dev-only primitives gallery (?scenario=ui-gallery). Behind import.meta.env.DEV
// so production builds drop it, like the scenarios.
const Gallery = import.meta.env.DEV ? lazy(() => import('../dev/Gallery')) : null;

function Screens() {
  const { data } = useApp();
  const { tab, flow } = useNav();

  if (!data.settings.onboardedUnix) return <OnboardingPlaceholder />;
  if (flow === 'settings') return <SettingsScreen />;
  if (flow) return <PlaceholderScreen name={flow} />;
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
  return (
    <AppProvider>
      <NavProvider initial={initialView(screen)}>
        <Screens />
      </NavProvider>
    </AppProvider>
  );
}
