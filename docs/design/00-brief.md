# 00 — Design Brief

Status: approved · day 14359

## Goal

A **daily routine I actually follow** for physical and mental health. The redesign exists to make me *want* to open the app every day — not to change the training methodology.

- Priorities: **fat loss** and **emotional control** first; **posture** and **cardio** still matter.
- The methodology already implemented stays as-is: overload engine and daily challenge rotation, routines, RPE / neck-discomfort check-in, HALT mood check-in, think-before-speak drill.
- Gamification is welcome where it reinforces showing up daily.

## Success metric

A **day is done** when 100% of that day's plan is completed. The record of each day is always honest: done or missed. Two numbers track it:

- **100-day average** — share of the last 100 days that were done (until 100 days exist, the share of days since the first plan). Counts only truly done days; nothing can shield it.
- **Streak** — consecutive days without an *unprotected* miss, governed by reserves (below). Revised on day 14359 from a strict no-repair streak, following the evidence in [01-principles](01-principles.md) P6–P7.

Everything else (workouts, check-ins, records) is supporting signal.

### Reserves (streak protection)

| Rule | Decision | Why |
|---|---|---|
| Earning | +1 reserve when a 10-day cycle is approved **before it begins** | Slack that has to be earned, and rewards planning ahead (Sharif & Shu) |
| Cap | Hold at most **2** | Duolingo's tests: 2 freezes retained better than 1; more makes the streak meaningless |
| Use | Applied automatically to a missed day (including a day with no plan). The streak holds but does not grow; the day stays recorded as missed | Repairable streaks blunt the drop after a break (Silverman & Barasch); automatic so forgetfulness can't break it |
| Cost | The written justification is still required | Slack works when using it costs something (Sharif & Shu) |
| Never twice | A reserve **cannot** cover a miss on the day right after a miss: two misses in a row break the streak | Runs of misses are what predict quitting (Milkman et al. 2021) |
| Break | Streak → 0; best streak is kept; the next day is a recovery day | P6, P7 |

### Against "might as well spend it" (day 14359)

Reserves must never feel like a budget to use. They are insurance, not currency.

- **Called "streak protection" in the UI**; "reserve" is an internal term only.
- **Invisible while deciding**: Today never shows protection. It appears only on Progress and in the justification outcome after a miss.
- **No forecasts**: no copy ever predicts that protection will cover an active day ("your streak is safe"). Outcomes are stated only after the day closes.
- **No spend action**: protection is applied automatically after a day ends; there is no button to use it.
- **A protected day is still a miss** everywhere: grid, 100-day average, required justification, and the next day is a recovery day that protection can't cover.
- **No waste framing at the cap**: at 2, an on-time approval says "Protection full" — never "+1 lost".
- **Not spending is rewarded**: a *clean cycle* (10 of 10 days actually done, none protected) gets a distinct mark in the Progress grid and a completion moment.

## The plan (new feature — not implemented today)

| Rule | Decision |
|---|---|
| Cycle | Plans cover **10-day cycles** aligned to the day number (e.g. 14360–14369). Each new cycle must be **explicitly approved** before it begins |
| Template | Only a helper that pre-fills a new cycle (slot = last digit of the day number); it never counts as a plan by itself |
| Plan items | Workouts (routine + numeric targets; several per day allowed) · rest practices (timed: meditation, silence…) · mood check-ins (count per day) · pause drills (count per day). A plan is never empty — rest is planned too |
| Workout targets | Proposed by the overload engine, accepted or adjusted by me. Measurable: total time, rounds, dead-hang seconds, rope turns. Methodology refinements are a later sprint |
| Rest days | A day without workouts is valid if it holds other items, e.g. a timed rest practice |
| Early stop | A workout or rest practice ended early never satisfies its item; a retry must be the full session |
| Editing & lock | Day N's plan is editable until N.0000; it is locked for the whole of day N. What "done" means never changes once the day has started. Early on, plans will be recalibrated downward between days — this is expected |
| No plan | A day without an approved plan is a failed day |
| Done | 100% of items, numeric targets met or exceeded |
| Not done | Requires a **written justification**: the first thing the app asks on the next open, before planning or starting the day. Can't be skipped; one sentence is enough |
| Mood checks / drills | Count per day, no fixed times |

## Time model: daykeep

All time handling follows [daykeep](../../../../utilities/daykeep/) conventions, not only the day boundary:

- A day is a **day number** counted from a personal epoch; time within it is a decimal fraction (`14359.3404`). Durations are decimal days (`.0625` = 90 min).
- Day boundary and length come from the epoch and `day_length` settings (mine: boundary 03:00 at fixed UTC−3, 86,400 s). No DST, no weeks, no months as units.
- Integer-seconds internally, floor division for day numbers, round half up to four decimals for display, formats as in `dktime.h` (`09761.4564`, `.0625`, `1.2500`).
- The planning cycle (10 days) and the moving average (100 days) are counted in daykeep days.
- **Epoch and day length are set in onboarding** on first use (the browser can't read `~/.config/daykeep/config`) and travel with backups. The public code ships daykeep's default epoch only — never a personal one.
- **No civil dates anywhere.** Day numbers may drop leading digits in tight spaces (`14359` → `359` → `59`), like omitting the year or month.
- **Single activities are measured in seconds**: workout intervals, per-exercise targets, and the duration of each workout session or rest practice ("Start Rope · 720 s", "Rest · silence 900 s"). Seconds are heartbeat-scale. Decimal days are for day-level time only: time of day, time left in the day, day and cycle boundaries, and totals across sessions.

## Data

Start from scratch: existing history (logs, profile stats, streaks) is discarded. New storage uses new versioned keys; no migration.

## User & context (single persona: me)

| | |
|---|---|
| Device | Pixel 8, Chrome (≈412×915 CSS px viewport, portrait) |
| Primary moment | Every morning — the daily session |
| Secondary moments | A few short visits during the day (unknown frequency/length — design for < 30 s) |
| During a workout | Bluetooth earphones; phone may be **a few meters away**. Audio is the primary channel, the screen is glanceable and secondary |
| Hands | Busy (rope, door bar) — interaction mid-workout must be rare and large-target |

## Pain points today

1. **Clutter** — badges, pills, multiple accent colors, duplicated stats, decorative text.
2. **Explanations everywhere** — science and benefit copy competes with what to do now.
3. **Too many things to do at once** — six tabs, several competing calls to action on the home screen, no single obvious next step.

## Tone

**"Asana, not Jira."** Calm, friendly, focused on the next action; small moments of delight on completion; complexity available but out of the way. Not a dashboard, not a settings maze.

## Technical constraints

- Client-only React 19 + TypeScript + Tailwind 3, built with Vite; no backend.
- Static hosting on GitHub Pages; relative asset paths (`base: './'`).
- Local-first: all data in `localStorage` via `StorageService`, under versioned keys.
- Optional Google Drive backup via Google Identity Services (`drive.file` scope).
- **English only.** Localization (pt-BR, the `TRANSLATIONS` layer, `localizedData.ts` overrides, language toggles) is removed.
- daykeep conventions via a dependency-free **TypeScript port**, verified against golden vectors generated by the real `daykeep` binary.
- Must work offline once loaded; Web Audio + Speech Synthesis for the coach.
- No paid services or accounts required.

## Out of scope

- Changing the training/emotional-control methodology or its content.
- Multi-user, social, or cloud-sync features beyond the existing Drive backup.
- Native app packaging.
