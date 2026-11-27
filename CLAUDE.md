# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Design docs

Read them before touching UI or domain code:
[00-brief](docs/design/00-brief.md) · [01-principles](docs/design/01-principles.md) (P1–P14, each with a check) · [02-workflows](docs/design/02-workflows.md) (screens) · [03-tooling](docs/design/03-tooling.md) (this loop) · [04-curriculum](docs/design/04-curriculum.md) (lesson order and content).

**The loop** (03-tooling §3):
1. Edit → `npm run check` → fix until it passes (text only).
2. `npm run shots -- [scenario…]` → read `shots/contact-sheet.png` (one image). Open single `shots/<scenario>-<theme>.png` only when a specific screen needs inspection.
3. At milestones, test on the Pixel 8 over LAN (`npm run dev`).

**Rules for agents:**
- Run `npm run check` before taking any screenshot; never use a screenshot to discover what a text check could.
- Read the contact sheet, not individual screenshots, unless a specific screen needs inspection.
- Every new screen or state gets a scenario; every principle check that applies to it runs automatically.
- UI uses only design tokens (`src/styles/tokens.css` via `tailwind.config.js`, whose `colors` hold nothing else): no hex/rgb/hsl, no Tailwind palette classes (`bg-slate-900`, `text-white`…). `lint:tokens` enforces it.
- English only; no i18n.
- After an intended visual change, update the baselines (below) and look at the diff before committing them.

**Scenarios** (`src/dev/scenarios.ts`, dev builds only): `?scenario=<name>&now=<daykeep stamp>` replaces localStorage with the scenario's `storage` and moves the clock (`src/time/clock.ts`; all time reads go through `nowUnix()`). An optional `screen` field is passed as `&screen=<value>` to open a given screen. Flows take `:` arguments (`cycle:1436`, `day-edit:14362`, `day-edit:14362:blank`, `preview:<itemId>` = workout preview sheet over Today, `mood:more` = mood check with "More" open, `learn:<itemId>[:<step>]` = a planned lesson, `lesson:<exerciseId>[:<step>]` = a lesson for review; steps are 1-based); `onboard-day|anchor|plan` opens an onboarding step. `shots`, `check:ux` and the visual baselines run every registered scenario automatically, in light and dark at 412×915 (Pixel 8). Fixtures mark the last closed cycle's clean-cycle moment as already shown (`cleanCycleDue: true` to see it, as in `clean-cycle`). Fixtures default to a graduated user (every lesson logged on the setup day, so plans follow the routine rotation); `curriculum: true` plans from the first lesson.

**DOM contract** (`tests/ux/helpers/rules.ts`; rules apply only to markup inside `data-screen`):
- `data-screen="<name>"` on each new screen root; per-screen rules and axe (WCAG 2.2 AA incl. contrast and target-size) are scoped to it. Scenarios without one are reported as skipped.
- `data-primary` — exactly one visible per screen (P9); none on a timed screen marked `data-autoadvance` (a step that runs out on its own, e.g. drill Elevate/Freeze/Sigh — no disabled "Next" either). `data-nav` — bottom nav, ≤ 4 destinations (P9).
- Interactive elements in a screen ≥ 48×48 CSS px (a checkbox/radio counts through its `<label>`); `data-hud-control` ≥ 72 px tall, at most 1 per screen — Pause is the only HUD control (P12). In `data-screen="workout|rest|drill"` no visible button/link may be named "skip" (no skipping in timed flows, P12).
- `data-hud-digits` — countdown; digit cap height ≥ 160 px (P12).
- `data-streak` must sit in a `data-stats` container that also shows `data-average` (P6). `data-reserves` (UI copy: "streak protection", never "reserve") is optional and never shown on Today; no copy predicts protection before a day closes.
- `data-target-input` (numeric target field) must sit in a `data-target` container with a visible, non-empty `data-last-hint` ("last 38 s · suggested 40 s" or "no data yet") (P3).
- `data-screen="justify"`: visible text never matches `/\byou (failed|missed|didn'?t)\b/i`, and the screen has a `data-adjust-link` to edit the next days (P8).
- `data-screen="lesson"`: exactly one visible `data-step-image` (the step's picture or its placeholder) (P14).
- Text blocks in a screen render ≤ 2 lines unless inside `data-disclosure` or `data-allow-long` (P10).
- Speech/beep spy for workout tests: `installSpeechSpy(page)` → `spoken(page)`, `beeps(page)` (`tests/ux/helpers/speech-spy.ts`).

## Commands

```bash
npm run dev          # Vite dev server on :5173, exposed on LAN (host: true) for phone testing
npm run check        # tsc -b && vitest run && lint:tokens && check:ux — the correctness gate
npm run check:ux     # Playwright: tests/ux (rule self-tests, all scenarios × light/dark, visual baselines); own server on :5174
npx playwright test visual --update-snapshots   # rewrite failing visual baselines after an intended UI change
                                                # (=all also rewrites ones within tolerance, maxDiffPixelRatio 0.002: small text changes)
npm run shots [-- scenario… --desktop]   # shots/<scenario>-<theme>.png + shots/contact-sheet.png
npm run test         # vitest only (src/**/*.test.ts)
npm run lint:tokens  # P13 token lint
npm run vectors      # regenerate daykeep golden vectors (needs local daykeep binary)
npm run build        # tsc -b && vite build → dist/
npm run preview      # serve the production build
npm run icons        # re-render public/icon-*.png and apple-touch-icon.png from public/icon.svg
blender -b --python art/render.py -- [lesson…]   # lesson pictures → art/out/ (art/README.md)
```

Playwright uses its cached Chromium (`@playwright/test` pinned to 1.56.x); don't download browsers locally. `shots/`, `test-results/` are gitignored.

**Visual baselines** (`tests/ux/visual.spec.ts`): every scenario × light/dark, viewport-sized, compared with `toHaveScreenshot` against `tests/ux/__screenshots__/<scenario>-<theme>.png` (committed; `snapshotPathTemplate` in `playwright.config.ts`, no platform suffix). Playwright's clock is paused before load (the scenario's `now` still places the app clock), so countdowns and moments are frozen; animations are disabled. Skipped when `CI` is set: the baselines use this machine's system fonts.

**PWA** (`vite-plugin-pwa`, config in `vite.config.ts`): production builds get a manifest and a Workbox service worker that precaches the whole app (works offline). Dev has no service worker, so scenarios and Playwright are unaffected. Updates use `registerType: 'prompt'` with no prompt: a new version waits until every app window is closed, so it never reloads mid-workout. `src/storage/persist.ts` asks for persistent storage so localStorage isn't evicted. Settings → Data shows a build stamp (`__BUILD_STAMP__`, `vite.config.ts`): short commit · build date in production builds, `dev` otherwise so baselines don't change per commit.

Deployment: pushing to `main` triggers `.github/workflows/deploy.yml` (npm ci → Playwright Chromium → `npm run check` → build → GitHub Pages). `vite.config.ts` uses `base: './'` so the bundle works under any subpath — keep asset paths relative.

## Architecture

Maçã Verde is a client-only React 19 + TypeScript + Tailwind 3 app: a daily plan of short workouts (jump rope, door pull-up bar), rest practices, mood checks and pause drills, approved in 10-day cycles. No backend, no router. Pure logic lives outside React and is unit-tested with Vitest (`*.test.ts` next to it).

- `src/time/` — daykeep port (day numbers, stamps, durations; golden vectors) and the injectable clock: all time reads go through `nowUnix()`/`nowMs()`. `seconds.ts` formats single activities in seconds.
- `src/domain/` — types (`types.ts`, incl. the content types), plans and cycle approval/locking (`plan.ts`), the record (`record.ts`: day status, streak, streak protection, 100-day average — all derived, never stored), the overload engine and suggestions (`engine.ts`), the curriculum (`curriculum.ts`: what's learned before a day, generated `basics:<n>` workouts).
- `src/data/` — built-in content in English: exercises, routines, lessons and their order (`lessons.ts`, from docs/design/04-curriculum.md), provocation scenarios.
- `src/storage/` — `AppData` in localStorage under `mv2:` keys, backup import/export, Google Drive backup (GIS, `drive.file`; client ID in settings) and auto-backup.
- `src/app/` — `App.tsx` (screen switch), `AppContext` (data, derived record, ticking `now`, `update()` that persists), `nav.tsx` (tab + flow stack; flows are strings like `cycle:1436`), screens in `screens/`, and pure view helpers (`view.ts`, `today.ts`, `cycle.ts`, `progress.ts`, …). Celebrations use the shared `Moment` (≤ 2 s, tap to dismiss).
- `src/ui/` — small token-only primitives (Button, Sheet, ListRow, StatsBlock…).
- `src/workout/` — HUD phases, exercise short names/cues, post-workout log; `src/drill/` — the pause drill; `src/audio/` — Web Audio beeps and the speech coach.
- `src/dev/` — scenarios and fixtures (dev builds only), UI gallery.
- `tests/ux/` — Playwright: DOM rules + axe per scenario, rule self-tests, HUD behaviour, visual baselines.
