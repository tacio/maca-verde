# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Redesign in progress (branch `redesign`)

The UI is being rebuilt. Read the design docs before touching UI or domain code:
[00-brief](docs/design/00-brief.md) · [01-principles](docs/design/01-principles.md) (P1–P13, each with a check) · [02-workflows](docs/design/02-workflows.md) (screens) · [03-tooling](docs/design/03-tooling.md) (this loop).

**The loop** (03-tooling §3):
1. Edit → `npm run check` → fix until it passes (text only).
2. `npm run shots -- [scenario…]` → read `shots/contact-sheet.png` (one image). Open single `shots/<scenario>-<theme>.png` only when a specific screen needs inspection.
3. At milestones, test on the Pixel 8 over LAN (`npm run dev`).

**Rules for agents:**
- Run `npm run check` before taking any screenshot; never use a screenshot to discover what a text check could.
- Read the contact sheet, not individual screenshots, unless a specific screen needs inspection.
- Every new screen or state gets a scenario; every principle check that applies to it runs automatically.
- New UI uses only design tokens (`src/styles/tokens.css` via `tailwind.config.js`): no hex/rgb/hsl, no Tailwind palette classes (`bg-slate-900`, `text-white`…). `lint:tokens` enforces it; its `LEGACY` list only shrinks.
- English only in new UI; pt-BR/i18n is being removed.

**Scenarios** (`src/dev/scenarios.ts`, dev builds only): `?scenario=<name>&now=<daykeep stamp>` replaces localStorage with the scenario's `storage` and moves the clock (`src/time/clock.ts`; all time reads go through `nowUnix()`). An optional `screen` field is passed as `&screen=<value>` to open a given screen. Flows take `:` arguments (`cycle:1436`, `day-edit:14362`, `day-edit:14362:blank`); `onboard-day|anchor|plan` opens an onboarding step. `shots` and `check:ux` run every registered scenario automatically, in light and dark at 412×915 (Pixel 8).

**DOM contract for new UI** (`tests/ux/helpers/rules.ts`; rules apply only to opted-in markup, so legacy UI is ignored):
- `data-screen="<name>"` on each new screen root; per-screen rules and axe (WCAG 2.2 AA incl. contrast and target-size) are scoped to it. Scenarios without one are reported as skipped.
- `data-primary` — exactly one visible per screen (P9). `data-nav` — bottom nav, ≤ 4 destinations (P9).
- Interactive elements in a screen ≥ 48×48 CSS px (a checkbox/radio counts through its `<label>`); `data-hud-control` ≥ 72 px tall, ≤ 2 per screen (P12).
- `data-hud-digits` — countdown; digit cap height ≥ 160 px (P12).
- `data-streak` must sit in a `data-stats` container that also shows `data-average` and `data-reserves` (P6).
- `data-target-input` (numeric target field) must sit in a `data-target` container with a visible, non-empty `data-last-hint` ("last 38 s · suggested 40 s" or "no data yet") (P3).
- Text blocks in a screen render ≤ 2 lines unless inside `data-disclosure` or `data-allow-long` (P10).
- Speech/beep spy for workout tests: `installSpeechSpy(page)` → `spoken(page)`, `beeps(page)` (`tests/ux/helpers/speech-spy.ts`).

## Commands

```bash
npm run dev          # Vite dev server on :5173, exposed on LAN (host: true) for phone testing
npm run check        # tsc -b && vitest run && lint:tokens && check:ux — the correctness gate
npm run check:ux     # Playwright: tests/ux (rule self-tests + all scenarios × light/dark); own server on :5174
npm run shots [-- scenario… --desktop]   # shots/<scenario>-<theme>.png + shots/contact-sheet.png
npm run test         # vitest only (src/**/*.test.ts)
npm run lint:tokens  # P13 token lint
npm run vectors      # regenerate daykeep golden vectors (needs local daykeep binary)
npm run build        # tsc -b && vite build → dist/
npm run preview      # serve the production build
```

Playwright uses its cached Chromium (`@playwright/test` pinned to 1.56.x); don't download browsers locally. `shots/`, `test-results/` are gitignored.

Deployment: pushing to `main` triggers `.github/workflows/deploy.yml` (npm ci → Playwright Chromium → `npm run check` → build → GitHub Pages). `vite.config.ts` uses `base: './'` so the bundle works under any subpath — keep asset paths relative.

## Architecture

Maçã Verde is a client-only React 19 + TypeScript + Tailwind 3 app (HIIT/posture workouts with a jump rope and door pull-up bar, plus mood/emotional-control tracking). No backend, no router.

New code (redesign): `src/time/` (daykeep port + injectable clock), `src/styles/tokens.css` (design tokens), `src/dev/` (scenarios), domain logic in `src/domain/` and storage in `src/storage/` (unit-tested with Vitest).

**Legacy (being replaced by the redesign; don't extend):**
- **State lives in `src/App.tsx`**: profile, workout logs, custom routines, mood logs, emotional drills in `useState`; views via an `activeTab` string; all modals. Components in `src/components/` are controlled by `App`. Post-workout bookkeeping (streak, records, `overloadMultiplier`, level) is in `App.handleSaveWorkoutLog`.
- **Persistence: `src/services/storageService.ts`** — static class over `localStorage` with versioned keys (`maca_verde_*_v1`); `getProfile()` merges over `DEFAULT_PROFILE`.
- **Services** (static, no React): `overloadEngine.ts` (+1%/day, challenge rotation on `streak % 3`), `soundService.ts` (Web Audio beeps + `speechSynthesis` voice coach), `googleDriveService.ts` (GIS OAuth, `drive.file` backup; client ID stored in the profile).
- **i18n (being removed; new UI is English only):** `src/i18n/translations.ts` (`TRANSLATIONS[lang]`), pt-BR overrides of English domain data in `src/data/localizedData.ts`.
- Types: `src/types/fitness.ts`, `src/types/mood.ts`. Styling: Tailwind `brand` palette, `darkMode: 'class'`, `lucide-react` icons.
