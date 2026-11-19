# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Commands

```bash
npm run dev       # Vite dev server on :5173, exposed on LAN (host: true) for phone testing
npm run build     # tsc -b (type check) && vite build → dist/
npm run preview   # serve the production build
```

There is no test runner and no linter configured. `npm run build` is the only correctness gate (TypeScript `strict`); run it after changes.

Deployment: pushing to `main` triggers `.github/workflows/deploy.yml`, which builds and publishes `dist/` to GitHub Pages. `vite.config.ts` uses `base: './'` so the bundle works under any subpath — keep asset paths relative.

## Architecture

Maçã Verde is a client-only React 19 + TypeScript + Tailwind 3 PWA-style app (HIIT/posture workouts with a jump rope and door pull-up bar, plus mood/emotional-control tracking). There is no backend and no router.

**State lives in `src/App.tsx`.** It holds the profile, workout logs, custom routines, mood logs and emotional drills in `useState`, switches views via an `activeTab` string, and controls all modals (onboarding, demo tour, workout HUD, completion, mood, drill, custom routine builder). Components in `src/components/` are presentational/controlled and receive data and callbacks from `App`. Post-workout bookkeeping (streak, personal records, `overloadMultiplier`, level) is computed in `App.handleSaveWorkoutLog`.

**Persistence: `src/services/storageService.ts`** is a static class over `localStorage` with versioned keys (`maca_verde_*_v1`). `getProfile()` merges stored data over `DEFAULT_PROFILE`, so new profile fields need a default there (and a type in `src/types/fitness.ts`). Every mutation must go through `StorageService` *and* update the corresponding `App` state.

**Other services** (all static/singleton, no React):
- `overloadEngine.ts` — the "+1% every day" logic: picks the daily challenge by rotating on `streak % 3` (posture/door bar, Tabata fat burn, rope cardio), scales routines by `overloadMultiplier`, computes streak updates.
- `soundService.ts` — Web Audio beeps and `speechSynthesis` voice coach (language-aware).
- `googleDriveService.ts` — Google Identity Services OAuth (script loaded in `index.html`) with `drive.file` scope; backs up/restores the full StorageService export as a single JSON file. The OAuth client ID is user-provided and stored in `profile.googleDrive.clientId` (no env vars).

**Content & i18n.** Languages are `'pt-BR'` (default) and `'en'`, selected via `profile.language`.
- UI strings: `src/i18n/translations.ts` — `TRANSLATIONS[lang]`, accessed as `t.key`. Both language objects must have the same keys. Placeholders like `{count}` are filled with `.replace('{count}', ...)` at the call site.
- Domain data (`src/data/exercises.ts`, `routines.ts`, `emotionalScenarios.ts`) is authored in English. Portuguese is applied as partial overrides keyed by ID in `src/data/localizedData.ts`; components should consume `getLocalizedExercises/Routines/Scenarios(lang)` rather than the raw data. When adding an exercise/routine/scenario, add its pt-BR override too. Some services (e.g. `overloadEngine` quotes/challenge text) embed their own pt/en strings inline.

Types: `src/types/fitness.ts` (profile, exercises, routines, logs) and `src/types/mood.ts` (mood logs, HALT state, drills, scenarios).

Styling: Tailwind with a custom `brand` green palette in `tailwind.config.js`; `darkMode: 'class'`; icons from `lucide-react`.
