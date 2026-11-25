# 02 — Workflows

Status: approved · day 14359
Inputs: [00-brief.md](00-brief.md) · [01-principles.md](01-principles.md) (cited as P1–P13)

Designed from scratch for one user (me) on a Pixel 8. Time is daykeep: `14359` is a day, `.3404` a moment within it, `359` / `59` are shortened day numbers.

---

## 1. Jobs

| # | Job | Frequency | Budget |
|---|---|---|---|
| J1 | Set up the app | once | ≤ 3 min |
| J2 | Plan and approve the next 10-day cycle | every 10 days | ≤ 2 min |
| J3 | Adjust upcoming (unlocked) days | occasional | ≤ 30 s |
| J4 | Do today's workout and log it | daily, morning | workout + ≤ 15 s log |
| J5 | Mood check | n × daily | ≤ 15 s (P11) |
| J6 | Pause drill | n × daily | ~2 min, guided |
| J7 | Close a missed day (justification) | after a miss | ≤ 30 s |
| J8 | See how I'm doing | a few times per cycle | glance |
| J9 | Back up / restore / change settings | rare | — |
| J10 | Look up an exercise's form | on demand | — |
| J11 | Learn a new exercise (lesson) | ≤ 1 per day while the curriculum runs | ≤ 2 min |

## 2. Structure

Three destinations (P9: ≤ 4), bottom bar on mobile:

```
┌──────────────┬──────────────┬──────────────┐
│    Today     │     Plan     │   Progress   │
└──────────────┴──────────────┴──────────────┘
```

- **Today** — J4, J5, J6, J7 (everything that happens *within* a day).
- **Plan** — J2, J3, routines, template.
- **Progress** — J8, plus settings & data (J9) behind a gear icon in its header.
- **Full-screen flows** (no bottom bar): workout, post-workout log, mood check, drill, justification, cycle approval, onboarding.
- J10 is not a destination: exercise detail opens as a sheet from wherever an exercise appears (P10); it reuses the lesson's steps and links to the lesson for review.

## 3. Day model

### Day states

```
           approve (before N.0000)           N.0000                    N+1.0000
unplanned ───────────────────────► planned ─────────► active ──┬─ 100% ──► done
    │                                 ▲   edit ok      locked   │
    │                                 └───┘                     └─ <100% ─► missed
    └──── N.0000 with no plan ──────────────────────────────────────────► missed
```

- **A plan is never empty.** Every day needs at least one item; the editor can't save or approve a day with none. Resting is planned too, as a rest item.
- **Done**: every plan item satisfied before N+1.0000.
  - Workout item: a logged session of that routine whose actuals meet every target set on the item (total time, rounds, hang seconds, rope turns). A day may hold several workout items, each satisfied by its own session. A session ended early never satisfies an item; a later attempt must be the full session again.
  - Rest item: a timed rest practice (e.g. meditation, silence) of at least the planned duration, run with the rest timer.
  - Mood item: ≥ *n* mood checks logged during day N.
  - Drill item: ≥ *n* drills logged during day N.
  - Learn item (≤ 1 per day, P14): the lesson for that exercise completed during day N.
- **Learned before used (P14).** A workout item on day N may only hold exercises whose lesson is planned on a day before N (or was logged before N.0000). The cycle editor refuses to approve a day that breaks this.
- **Missed** → justification required (J7); then streak rules apply (brief → Reserves): protected if a reserve is held and day N−1 was not missed; otherwise the streak breaks.
- Extra activity (an unplanned workout, a 4th mood check) is logged and counts toward records and history, never toward or against "done".
- Streak, reserves and the 100-day average are **derived** from the stored records by one pure function — never stored as counters (today's code stores counters and shows stale streaks after missed days).

### The record starts at the first planned day

Setup happens in the middle of some day, which by definition is already locked. That day is outside the record (no streak, no average); I can still work out on it freely. The record starts at the first day of the first approved plan.

## 4. Feature decisions

Every current feature, mapped to the new design.

| Current feature | Decision | Where / why |
|---|---|---|
| Today's Habit tab | **Rebuild** | Today = day header + checklist + one primary action (P1, P9) |
| Routine picker on Today (5 cards + recommended) | **Move** | Routine is chosen when planning, not at workout time (P9) |
| Daily overload challenge (rotation by `streak % 3`) | **Keep logic, move** | Becomes the engine's suggestion when pre-filling a cycle: same three-way rotation (posture / Tabata / rope), now by day number; same target formulas (hang PR + 2 s, rope turns) |
| Motivational quotes | **Cut** | Clutter (brief pain #2) |
| Custom routine builder | **Keep, move** | Plan → Routines (secondary) |
| Workout HUD | **Rebuild** | P12: current exercise, bare seconds, progress strip; Pause only — no skipping (day 14359) |
| HUD sound / voice toggles, skip-back | **Move / cut** | Toggles to Settings; skip and skip-back cut |
| Post-workout modal (RPE, neck, rope, hang, notes) | **Rebuild** | Log screen pre-filled from the timer; asks only for what targets need + RPE + neck (P11). Ratings are tap strips (tap or slide, 0–1, 2 decimals), unset until touched: no preselected value to anchor the answer |
| Drill offer after workout ("pulse is high") | **Keep** | Shown only if a drill is still due today — pairs the methodology's elevated-HR drill with the workout |
| Auto Drive backup after workout | **Keep** | Silent; status in Settings |
| Mood modal (valence, energy, HALT, somatic, speaking rating, notes) | **Rebuild** | Default path: valence + HALT + save (≤ 3 taps). Energy, tension, speaking rating, notes behind "More" and stored only if touched; energy and speaking use the same tap strips as the log |
| HALT radar / header "shield" | **Simplify** | One line on Today when the latest check flags HALT, with a drill shortcut |
| Think-before-speak drill (elevate → freeze → sigh → scenario) | **Keep, restyle** | Same four steps, full-screen, voice-guided; skips "elevate" when started right after a workout |
| Mind & Emotional Control tab | **Dissolve** | Actions → Today items; history → Progress; science → "Why?" (P10) |
| Exercise library tab | **Demote** | Exercise detail sheet from plan editor, workout preview and HUD pause screen |
| Progress tab: stats, 60-day heatmap, records, history | **Rebuild** | Streak + reserves + average; 10×10 grid of the last 100 days (one row = one cycle); records; history with justifications |
| "Mind-body interconnection" essays, kcal "visceral fat burned" hero | **Cut / demote** | Essays → "Why?"; kcal stays in session details, not as a headline |
| Levels ("LVL 3 athlete") | **Hide** | Still an input to the overload engine; not displayed (P13: no levels for their own sake) |
| Data & Google Drive tab | **Move** | Settings → Data |
| Settings tab | **Move** | Gear in Progress; gains epoch, day length, anchor |
| Language toggle, pt-BR | **Cut** | English only (brief) |
| Onboarding wizard | **Rebuild** | J1 below |
| Demo tour | **Cut** | Onboarding + clear empty states replace it |
| Header badges (streak, mood, sound, voice, tour, language), footer | **Cut** | Streak lives on Today; the rest moved or cut |

## 5. Flows

### J1 — Onboarding (first use)

1. **Your day.** Epoch with explicit UTC offset + day length (defaults: daykeep's 2000-01-01 00:00 UTC, 86,400 s). Live preview: "Today is day 14359, now .3404. Your day ends in .6596."
2. **Anchor.** "After I ___, I train." (P4)
3. **First plan.** Opens the cycle editor (J2) for the days from tomorrow to the end of the current cycle — or the whole next cycle if tomorrow starts one. Approving it is on time (+1 reserve).
4. Done → Today, which shows "Today is a warm-up day — your record starts tomorrow (360)" and a free-workout option.

Restore from backup is offered on step 1 as a link.

### J2 — Approve the next cycle

Entry: a card on Today from 3 days before the next cycle starts, and Plan → "Next cycle". Becomes Today's primary action once today's items are done.

```
┌───────────────────────────────────┐
│ ← Cycle 1436 · days 360–369       │
│ Starts in .6596 · approve for +1 ◆│
├───────────────────────────────────┤
│ Last cycle (350–359)              │
│ ●●●●○●●●●●  9/10 · "travel" (354) │
├───────────────────────────────────┤
│ 360  Posture · hang 40s   ◐2 ⚡1  │
│ 361  Tabata · 2 rounds    ◐2 ⚡1  │
│ 362  Rope · 350 turns     ◐2 ⚡1  │
│ 363  Rest · silence .0104 ◐3 ⚡1  │
│ …                                 │
│ 369  Tabata · 2 rounds    ◐2 ⚡1  │
├───────────────────────────────────┤
│ ☐ Save as template                │
│ [        Approve cycle         ]  │
└───────────────────────────────────┘
◐ mood checks  ⚡ drills  ◆ reserve
```

- Pre-filled from the template (slot = last digit); empty slots get the engine's suggestion (P3).
- Tap a day → day editor (J3).
- Look-back row first (P5). Approval is one explicit action.

### J3 — Edit a day

```
┌───────────────────────────────────┐
│ ← Day 362 · editable until 362.0  │
├───────────────────────────────────┤
│ Workout                           │
│  Rope Cardio (EMOM 15)       ▾    │
│  Rope turns  [ 350 ]              │
│     last 320 · suggested 345      │
│  Rounds      [ 3 ]   last 3       │
│  + target                         │
├───────────────────────────────────┤
│ Mood checks   [−] 2 [+]           │
│ Pause drills  [−] 1 [+]           │
├───────────────────────────────────┤
│ [            Save              ]  │
└───────────────────────────────────┘
```

- Every target shows last actual + suggestion (P3). Lowering a target is a normal action — no warning.
- Locked days open read-only with "Locked since 359.0000".
- "+ Workout" adds another workout item (several per day allowed); "+ Rest" adds a rest item with a kind (meditation, silence, …) and a duration (e.g. `.0104` = 15 min).
- Save is disabled while the day has no items ("Plan at least one thing — rest counts").

### J4 — Today, workout, log

**Today (normal)**

```
┌───────────────────────────────────┐
│ 359                     .6596 left│
│ 🔥 12  ◆◆   73% of last 100        │
├───────────────────────────────────┤
│        ◯  1 of 4 done             │
│ ✓ Mood check 1/2                  │
│ ○ Tabata · 2 rounds · 12 min      │
│     After coffee                  │
│ ○ Mood check 2/2                  │
│ ○ Pause drill                     │
├───────────────────────────────────┤
│ HALT: tired — pause 5 s before    │
│ replying.             Drill →     │
│                                   │
│ [    ▶  Start Tabata · 12 min  ]  │
├───────────────────────────────────┤
│  Today        Plan       Progress │
└───────────────────────────────────┘
```

- Primary action = the next undone item, in order: a due lesson first, then the workout in the morning, otherwise top of list. Priority override: pending justification (J7) blocks; next cycle unapproved and starting within 1 day → primary after today's items are done.
- Tapping a workout row opens a preview sheet (exercises, intervals, "How?" per exercise).

**Workout HUD** (P12)

```
┌───────────────────────────────────┐
│ Round 1/2 · 3 of 8                │
│ ▓▓▓▓▓▓▓░░░░░░░░░░░░░░░░░░░░░░░░░  │
│                                   │
│          Boxer skip               │
│                                   │
│               20                  │
│          (≥160px digits)          │
│                                   │
│          next: Hanging knees      │
│                                   │
│ [            Pause             ]  │
└───────────────────────────────────┘
```

- Voice announces every phase: exercise + one cue, 3-2-1, rest, next.
- Pause sheet: resume · end workout · exercise "How?".
- Rest phase uses the same layout with a calmer color; work vs rest must be distinguishable at 3 m by color alone.

**Post-workout log**

```
┌───────────────────────────────────┐
│ Tabata done · 12 min · 2/2 rounds │
├───────────────────────────────────┤
│ Effort (RPE)               .80    │
│ [░░░▒▒▒▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓|▓▓▓]       │  ← tap anywhere: 0–1
│ Neck tension               .15    │
│ [░░░|▒▒▒▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓]       │
│ Rope turns     [ 360 ]  target 350│  ← only if a target needs it
├───────────────────────────────────┤
│ [            Save              ]  │
│ Pulse is up — pause drill now? →  │  ← only if a drill is due
└───────────────────────────────────┘
```

- Time and rounds come from the timer. Ending early keeps the real numbers; the item stays undone and can be redone today.
- On save: item ticks with a small inline animation; if that completes the day → day-complete celebration (P13).

### J5 — Mood check

```
┌───────────────────────────────────┐
│ How are you?                    ✕ │
│  😄  🙂  😐  😤  😩  😰             │
│ H.A.L.T.                          │
│ [Hungry] [Angry] [Lonely] [Tired] │
│ More ▾ (energy, tension, notes)   │
│ [            Save              ]  │
└───────────────────────────────────┘
```

- Reachable from its Today row and from a long-press/secondary button on Today at any time (extra checks allowed).
- Selecting a valence + Save = 2 taps.

### J6 — Pause drill

Full-screen, voice-guided, four steps from the current methodology: **Elevate** (raise heart rate, skipped right after a workout) → **Freeze** (don't react, release jaw and shoulders) → **Sigh** (paced physiological sigh with an animated guide) → **Scenario** (one provocation scenario; choose the paused response) → log. One instruction line per step; science behind "Why?".

### J6b — Rest practice

Full-screen, minimal: the rest kind, a slow-moving ring for the remaining time (no digits needed — this is not a glance-at-3-m context), one soft chime at the end, voice optional. Ending early logs the real duration; the item stays undone (same rule as workouts).

### J7 — Close a missed day

Blocks Today on the first open after a missed day, before anything else.

```
┌───────────────────────────────────┐
│ Day 358 wasn't completed          │
│ 2 of 4 · Tabata and 1 mood check  │
│ left                              │
├───────────────────────────────────┤
│ What got in the way?              │
│ [Plan too big] [Time] [Energy]    │
│ [Pain] [Forgot] [Other]           │
│ [ one sentence…                 ] │
├───────────────────────────────────┤
│ Streak kept with a reserve ◆→◇    │
│ Tomorrow is a recovery day.       │
│ [ Save ]   Adjust next days →     │
└───────────────────────────────────┘
```

- One chip + one sentence required (P8). Wording never says "you failed".
- Outcome line states what happened to the streak: kept (reserve used), or broken ("Streak reset — 73% of last 100 stays"). If several days were missed (app not opened), one justification per day, oldest first, shown as a short stack.
- "Adjust next days" → Plan with the unlocked days (P3).

### J8 — Progress

```
┌───────────────────────────────────┐
│ Progress                       ⚙  │
│ 🔥 12 · best 19 · ◆◆               │
│ 73% of last 100                   │
├───────────────────────────────────┤
│ 1426 ■■■□■■■■■■                   │
│ 1427 ■■■■■■◈■■■                   │
│ …    (10 rows = 100 days)         │
│ 1435 ■■■■■■■■■○  ← today          │
│ ■ done ◈ missed·kept □ missed     │
├───────────────────────────────────┤
│ Records  hang 42 s · rope 360     │
│ Neck tension ▁▂▂▁▁ (last 10)      │
│ Mood        ▃▅▄▅▆ (last 10)       │
├───────────────────────────────────┤
│ History  (days, newest first;     │
│ tap → sessions, checks, reason)   │
└───────────────────────────────────┘
```

- The 10×10 grid *is* the 100-day average made visible; each row is a cycle and lines up with day numbers.

### J11 — Learn a new exercise (P14)

Opens from the Today row "Learn · Downward dog" (`learn:<itemId>`), or for review from "How?" anywhere (`lesson:<skillId>`, logs nothing).

```
┌───────────────────────────────────┐
│ ✕  Downward dog        Step 2 of 4│
├───────────────────────────────────┤
│ ┌───────────────────────────────┐ │
│ │                               │ │
│ │        (picture · side)       │ │
│ │                               │ │
│ └───────────────────────────────┘ │
│        [ Side ] [ Front ]         │  ← only when a step has several angles
│ Push the floor away; hips go up   │
│ and back.                         │
├───────────────────────────────────┤
│ [ Back ]  [        Next        ]  │
└───────────────────────────────────┘
```

- A combination starts with "Built from: Plank · Downward dog" (each opens its review lesson).
- The last step is a short try ("Try it 3 times, slowly"), then **Learned** logs the lesson and ticks the item.
- Untimed: a lesson is reading and trying at your own pace, not a timed flow.

### J9 — Settings (gear on Progress)

Sections: **Day** (epoch, day length — changing them warns that history is re-bucketed) · **Anchor** · **Coach** (beeps, voice) · **Template** · **Routines** (custom builder) · **Data** (export / import JSON, Google Drive backup & restore, last backup stamp) · **Reset** (replay onboarding, erase data).

## 6. Moments of delight (P13)

| Event | Treatment |
|---|---|
| Item done | Inline tick, light haptic-style motion (≤ 300 ms) |
| Lesson done | Inline tick (same as an item) |
| Day done | Full-screen, ≤ 2 s, tap to dismiss; occasional rare variant |
| Recovery day done | Day-done + "Back on track" |
| Cycle done 10/10 | Cycle row fills in an animation on next open |
| Record beaten | Inline badge on the log screen |
| Reserve earned | Shown at cycle approval: "+1 ◆" |

## 7. Data (new, from scratch)

New versioned keys; existing data is discarded (brief).

- `settings` — epoch, dayLength, anchor, sound, voice, drive config.
- `template` — 10 day slots.
- `cycles` — per cycle: approvedAt stamp, on time (bool).
- `plans` — per day: non-empty list of items (workout{routineId, targets} ×n, rest{kind, durationSeconds} ×n, mood{count}, drill{count}, learn{skillId} ≤ 1).
- `lessons` — completed lessons: skill, stamp.
- `sessions`, `rests`, `moods`, `drills` — logs with second-precision stamps (seconds since epoch).
- `justifications` — per missed day: chip, sentence, stamp.
- `routines` — custom routines.
- Engine state (overload multiplier, records, level) derived from sessions where possible.

Derived (pure functions, unit-tested): day state, streak, reserves, 100-day average, suggestions.

## 8. Resolved questions

1. Empty plans are invalid; resting is a planned, timed item (day 14359).
2. A day can hold several workout items.
3. A session ended early never satisfies an item; a retry must be the full session.
4. Exercises are introduced one per day through lessons planned the day before first use; a missed lesson is a missed day and doesn't re-plan the following days (day 14365, P14).
