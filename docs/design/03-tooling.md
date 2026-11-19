# 03 — Tooling

Status: draft for review · day 14359
Inputs: [00-brief](00-brief.md) · [01-principles](01-principles.md) · [02-workflows](02-workflows.md)

Goal: let an agent iterate on this app **fast and cheap** while staying inside the principles, the workflows and the constraints (free, local, static hosting).

## 1. What makes iteration expensive here

1. **State is time-dependent.** Most screens depend on *when* it is (lock at N.0000, cycle approval window, missed days, recovery day). Without control over the clock and the data, an agent can't reach those screens at all.
2. **Images cost tokens; text is cheap.** A 412×915 screenshot is roughly 500 input tokens; a long full-page shot several times that. Pass/fail text output costs tens of tokens.
3. **Taste checks drift.** "Looks clean" is not verifiable; the principles' checks are.
4. **Some behavior can't be seen**: speech, beeps, streak arithmetic.

So: make every state reachable by URL, turn as many principle checks as possible into text pass/fail, and batch screenshots into one image per iteration.

## 2. Options compared

| Need | Option | Setup | Per-iteration cost | Automates | Verdict |
|---|---|---|---|---|---|
| Reach any state | **Scenario fixtures + injectable clock** (`?scenario=missed-yesterday&now=14359.4`) | ~½ day | 0 | every state, deterministic | **Adopt** — the biggest lever |
| See the UI | **Scripted Playwright** (`npm run shots`) | already prototyped | 1 contact-sheet image (~2k tokens) | capture of all scenarios × themes | **Adopt** as the main loop |
| See the UI | Playwright MCP | 1 command, user config | similar per step; ~4.4k tokens of tool schema on every request; better for long exploratory sessions | ad-hoc clicking | Optional, not needed |
| See the UI | Claude in Chrome (installed, not connected) | none | per action + screenshots | ad-hoc, real Chrome | Optional fallback for exploration |
| Component isolation | Storybook / Ladle | ½–1 day, heavy deps | moderate | per-component states | **Skip** — scenario fixtures on the real app cover it |
| Principle checks | **Playwright + @axe-core/playwright + custom DOM assertions** (`npm run check:ux`) | ~½ day | text only | contrast, target size, 1 primary action, ≤ 2-line text, HUD digit size, streak+average pairing… | **Adopt** |
| Logic checks | **Vitest** unit tests | ~1 h | text only | daykeep port (golden vectors), day state, streak/reserves, average, suggestions | **Adopt** |
| Speech/beeps | Spy on `speechSynthesis.speak` / `AudioContext` in Playwright | in `check:ux` | text only | "each phase is spoken" (P12) | **Adopt** |
| Visual system | **Design tokens** (CSS variables + Tailwind theme mapping) + token lint | ~2 h | 0 | "no raw colors" (P13), light/dark | **Adopt** |
| Components | shadcn/ui | moderate (Radix deps, its own tokens) | — | accessible primitives | **Skip** — ~10 small primitives in `src/ui/`; native `<dialog>` for sheets |
| Visual regression | Playwright `toHaveScreenshot` baselines | low | text (diff counts) | catches unintended changes | **Later** — only after the redesign settles; baselines churn during it |
| Real device | Pixel 8 over LAN (`npm run dev`, `host: true`) | none | my time | audio through earphones, legibility at 3 m, feel | **Adopt** at milestones (manual) |
| CI | GitHub Actions: build + unit tests (+ UX checks) before deploy | ~30 min | 0 | regressions never ship | **Adopt** |
| Tailwind 4 upgrade | — | moderate | — | nothing the principles need | **Skip** |

Notes:
- Benchmarks disagree on Playwright MCP vs CLI token cost; recent versions return near-identical snapshots, and MCP's fixed cost is its tool schemas. For a repeatable, batched loop, a script beats both.
- axe-core's `target-size` rule checks WCAG 2.2's 24 px minimum and is off by default; our stricter 48 px (and 72 px HUD) rule needs a custom assertion.

## 3. The loop

```
edit
  └─ npm run check        tsc + vitest + check:ux   → text: pass / fail list
       └─ failures? fix, repeat
  └─ npm run shots -- [scenario…]                    → shots/<scenario>-<theme>.png
                                                       + shots/contact-sheet.png (one image)
       └─ read the contact sheet; zoom into single shots only when needed
  └─ milestone: open on the Pixel 8 over LAN
```

Rules for agents (to go into `CLAUDE.md`):
- Run `npm run check` before taking any screenshot; never use a screenshot to discover what a text check could.
- Read the contact sheet, not individual screenshots, unless a specific screen needs inspection.
- Every new screen or state gets a scenario; every principle check that applies to it runs automatically.

## 4. Scenarios (fixtures)

Dev-only module that seeds storage and freezes the clock from URL params. Stripped from production builds (`import.meta.env.DEV`).

| Scenario | Shows |
|---|---|
| `fresh` | Onboarding step 1 |
| `warmup` | Day of setup, record starts tomorrow |
| `today-start` / `today-mid` / `today-done` | Today at 0%, partial, 100% (+ celebration) |
| `halt` | Today with a HALT flag line |
| `missed-yesterday` / `missed-three` | Justification (single / stacked) |
| `recovery` | Today after a protected miss |
| `streak-broken` | Today after a break (average as hero) |
| `cycle-due` | Today with the approval card; cycle approval screen |
| `day-edit` / `day-locked` | Day editor editable / read-only |
| `hud-work` / `hud-rest` / `hud-paused` | Workout HUD states |
| `log` | Post-workout log with a target needing input |
| `mood` / `drill-*` / `rest-timer` | Full-screen flows |
| `progress-empty` / `progress-100` | Progress with no / 100 days of history |
| `settings` | Settings |

Each scenario is captured in **light and dark** at **412×915** (Pixel 8); a desktop pass at 1280×860 runs only on demand.

## 5. Principle → check

| Principle | Check | Tool |
|---|---|---|
| P1 | Completion indicator + full checklist within the 412×915 viewport | check:ux (bounding boxes) |
| P1 | Every item's done state is derived from data | vitest (day state) |
| P2 | No mutation of a started day's plan; no edit control on today's items | vitest + check:ux |
| P3 | Every numeric target input has a "last …" hint next to it | check:ux |
| P4 | Onboarding has an anchor field; it renders on the workout item | check:ux |
| P5 | Cycle approval shows last cycle before the editor; single approve action | check:ux |
| P6 | Streak never rendered without reserves + average; protected days never in done style | check:ux (data attributes) |
| P6/P7 | Reserves: earn on on-time approval, cap 2, never on consecutive misses; recovery framing | vitest |
| P8 | No blame phrases in justification copy; ends with "adjust next days" | check:ux (text scan) |
| P9 | Exactly one `[data-primary]` per screen; bottom nav ≤ 4 | check:ux |
| P10 | No visible text block > 2 lines outside an open disclosure | check:ux (line count via layout) |
| P11 | Mood default path ≤ 3 taps; log ≤ 3 required inputs | check:ux (scripted flow) |
| P12 | HUD digit cap height ≥ 160 px; ≤ 2 controls ≥ 72 px; targets ≥ 48 px elsewhere; every phase change calls `speak` | check:ux + speech spy |
| P13 | Contrast ≥ 4.5:1 both themes; no raw colors outside tokens; celebration only on listed events | axe + token lint + vitest |

Some checks (P5 ordering, P8 tone, overall calm) still need eyes; the contact sheet covers them.

## 6. Setup plan

All free; dev dependencies only — nothing is added to the shipped bundle.

1. **Test runner & daykeep port** — `vitest`; `scripts/daykeep-vectors.sh` runs the local `daykeep` binary (with explicit `--epoch`/`--day-length`, never the personal config) to generate `src/time/__fixtures__/vectors.json`, committed so CI doesn't need the binary.
2. **Clock + scenarios** — all time reads go through one `now()` in the daykeep module; scenario loader in dev builds.
3. **Tokens** — CSS variables for color, type, spacing, radius, motion in `src/index.css`; Tailwind `theme` maps semantic names to them; `scripts/lint-tokens` fails on raw hex / palette classes in `src/`.
4. **Screenshots** — move the prototype script into the repo as `scripts/shots.mjs` using `@playwright/test`'s bundled Chromium (already cached locally) + contact sheet.
5. **UX checks** — `@axe-core/playwright` + custom assertions in `tests/ux/`.
6. **Scripts** — `npm run check` (tsc + vitest + lint-tokens + check:ux), `npm run shots`.
7. **CI** — add `npm run check` before the build in the Pages workflow.
8. **CLAUDE.md** — add the loop rules and links to these four documents.

Order matters: 1–3 come before any UI work, because the new UI is built on them.
