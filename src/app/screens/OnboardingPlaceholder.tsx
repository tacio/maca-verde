import { Apple } from 'lucide-react';
import { Button } from '../../ui/Button';

/** First use, before setup exists (M3 builds onboarding, J1). */
export function OnboardingPlaceholder() {
  return (
    <div data-screen="onboarding" className="mx-auto flex min-h-dvh max-w-md flex-col bg-canvas px-5">
      <main className="flex flex-1 flex-col items-center justify-center text-center">
        <span className="mb-6 flex size-16 items-center justify-center rounded-full bg-accent-soft text-accent">
          <Apple aria-hidden size={30} strokeWidth={1.75} />
        </span>
        <h1 className="text-3xl font-semibold tracking-tight text-ink">Maçã Verde</h1>
        <p className="mt-2 max-w-xs text-base text-ink-muted">A daily plan for body and mind, one day at a time.</p>
      </main>
      <div className="flex flex-col items-center gap-2 pb-[max(1.5rem,env(safe-area-inset-bottom))]">
        <Button variant="primary" full disabled aria-describedby="onboarding-note">
          Continue
        </Button>
        <p id="onboarding-note" className="text-sm text-ink-muted">
          Setup arrives in the next build (M3).
        </p>
      </div>
    </div>
  );
}
