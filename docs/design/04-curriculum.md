# 04 — Curriculum

Status: approved · day 14365
Inputs: [00-brief](00-brief.md) → Gradual introduction · [01-principles](01-principles.md) P14

One lesson a day, 28 days (≈ 3 cycles). The curriculum is complete when every exercise used by the built-in routines has been learned; from then on the usual rotation (posture / Tabata / rope) takes over.

**It covers every physical objective of the brief, not only posture**: fat loss, posture and cardio. Emotional control is out of scope (mood check and pause drill are unchanged).

## 0. Objectives

The brief's physical priorities are **fat loss** first, then **posture** and **cardio**. Each lesson serves one or two of three goals:

| Goal | What it means here | Brief objective | Tag in `exercises.ts` |
|---|---|---|---|
| **Cardio** | Rope and full-body intervals that raise the heart rate | Fat loss and cardio | `cardio` |
| **Posture** | Neck, shoulder-blade and upper-back work against text-neck | Posture | `posture` |
| **Core** | Planks, hollow body, knee raises: trunk control | Posture and fat loss (supporting) | `belly_fat` |

Fat loss comes from total effort over time, mostly the cardio intervals, not from core work on the belly itself (spot reduction doesn't work), which is why core is a supporting goal here even though the code tags it `belly_fat`.

Balance by main goal (first goal listed in §2):

| Goal | Lessons | Of the first 10 | Of the first 15 | First lesson |
|---|---|---|---|---|
| Posture | 13 | 6 | 7 | 1 · chin tuck |
| Cardio | 10 | 3 | 7 | 2 · jumping jacks |
| Core | 5 | 1 | 1 | 4 · high plank |

Fat loss comes first in the brief, so cardio lessons come as early as their parts allow: jumping jacks on day 2, then rope bounce, high knees, squat, sprawl and mountain climbers before the slower posture and core blocks (Y-T-W, hollow body). The most intense cardio (sprawl burpee, speed sprint) still comes last because it combines earlier parts. From day 3 every Basics workout holds at least one cardio move.

Jumping jacks combine an arm swing and a foot hop. Neither is an exercise of its own, so the lesson teaches them as steps (arms only, feet only, then both) rather than as separate lesson days. Jumping jacks aren't in any built-in routine, so they appear only in Basics workouts.

## 1. Rules

- **One lesson per day.** Lesson *k* is planned on the *k*-th curriculum day.
- **Lesson before use.** An exercise enters workouts only from the day after its lesson.
- **Parts first.** A combination's parts (in brackets below) each have an earlier lesson.
- **Pictures.** Each step has a picture slot per angle listed (side / front / top / diagonal: front-side, seen from slightly above). They ship as labelled placeholders for now; real images drop in without changing the data.
- **Missed lesson.** The day is missed, like any other day. Later plans stay as approved; the lesson stays reachable from the workout preview for review.

## 2. Order

★ = exercise used by a built-in routine. ⊕ = combination.

| # | Lesson | Goal | Kit | Built from | Unlocks |
|---|---|---|---|---|---|
| 1 | Chin tuck | Posture | — |  |  |
| 2 | Jumping jacks | Cardio | — |  |  |
| 3 | Dead hang ★ | Posture | door bar |  |  |
| 4 | High plank | Core | floor |  |  |
| 5 | Rope bounce | Cardio | rope |  |  |
| 6 | Cobra lift | Posture | floor |  |  |
| 7 | Cobra & chin tuck ★ ⊕ | Posture | floor | 6, 1 |  |
| 8 | High knees | Cardio | — |  |  |
| 9 | Downward dog | Posture | floor |  |  |
| 10 | Scapular pulls ★ ⊕ | Posture | door bar | 3 |  |
| 11 | Boxer skip ★ ⊕ | Cardio | rope | 5 |  |
| 12 | Squat | Cardio (legs, burpee part) | — |  |  |
| 13 | Plank to down dog ⊕ | Posture · core | floor | 4, 9 |  |
| 14 | Sprawl ⊕ | Cardio | floor | 12, 4 |  |
| 15 | Mountain climbers ★ ⊕ | Cardio · core | floor | 4 |  |
| 16 | Hollow tuck | Core | floor |  |  |
| 17 | Prone Y | Posture | floor |  |  |
| 18 | Prone T | Posture | floor |  |  |
| 19 | Prone W | Posture | floor |  |  |
| 20 | Y-T-W raises ★ ⊕ | Posture | floor | 17, 18, 19 |  |
| 21 | Rope high knees ★ ⊕ | Cardio · core | rope | 8, 5 |  |
| 22 | Hanging knees ★ ⊕ | Core · posture | door bar | 3 |  |
| 23 | Plank–dog reach ★ ⊕ | Posture · core | floor | 13 | Posture routine |
| 24 | Hollow hold ⊕ | Core | floor | 16 |  |
| 25 | Hollow rock ★ ⊕ | Core · posture | floor | 24 |  |
| 26 | Flexed-arm hang ★ | Posture | door bar |  |  |
| 27 | Sprawl burpee ★ ⊕ | Cardio · core | floor | 14 | EMOM routine |
| 28 | Speed sprint ★ ⊕ | Cardio | rope | 11 | Tabata, Daily Micro-Overload, 5-minute — curriculum complete |

A routine unlocks the day after its last exercise's lesson.

## 3. Lessons

Steps are what the lesson screen shows, one per screen, ≤ 2 lines each. The last step is always the try.

1. **Chin tuck** — side, front
   1. Stand tall, eyes level. *(side)*
   2. Slide your head straight back, as if making a double chin. Don't tilt it down. *(side)*
   3. Hold 3 s, then let it glide forward again. *(side, front)*
   4. Try it 5 times, slowly.
2. **Jumping jacks** — front
   1. Stand tall, feet together, arms by your sides. *(front)*
   2. Arms only: swing them out and up until the hands meet overhead, then back down. *(front)*
   3. Feet only: hop them apart, a bit wider than your shoulders, then back together. *(front)*
   4. Both at once: feet out as the arms go up, in as they come down. *(front)*
   5. Try 10, landing softly on the balls of your feet.
3. **Dead hang** — side, front
   1. Grip the bar overhand, a bit wider than your shoulders. *(front)*
   2. Lift your feet and let your body hang, arms straight. *(side)*
   3. Shoulders active, chin tucked, breathe into your belly. *(side)*
   4. Try a 10 s hang; step down whenever you need.
4. **High plank** — side, top
   1. Hands under shoulders, fingers spread. *(top)*
   2. Step your feet back; body in one straight line from head to heels. *(side)*
   3. Squeeze glutes and belly; don't let the hips sag or spike. *(side)*
   4. Try a 10 s hold.
5. **Rope bounce** — front, diagonal
   1. Handles at hip height, elbows close to your ribs. *(front)*
   2. Turn the rope with your wrists, not your arms. *(diagonal)*
   3. Hop on the balls of both feet, 1–2 cm off the floor. *(diagonal)*
   4. Try 10 jumps. Tripping is normal: just restart. *(diagonal)*
6. **Cobra lift** — side
   1. Lie face down, arms by your sides, palms down. *(side)*
   2. Turn your thumbs up toward the ceiling. *(side, close-up of the hand)*
   3. Lift your chest a few cm, eyes on the floor. *(side)*
   4. Try 3 lifts with a 3 s hold.
7. **Cobra & chin tuck** — side · built from: cobra lift, chin tuck
   1. Start the cobra lift: chest up, thumbs up. *(side)*
   2. Add the chin tuck: slide your head back, eyes down. *(side)*
   3. Hold both while breathing slowly. *(side)*
   4. Try a 10 s hold.
8. **High knees** — side, front
   1. Stand tall. *(side)*
   2. Run in place, lifting each knee to hip height. *(side)*
   3. Land on the balls of your feet; arms swing naturally. *(front)*
   4. Try 20 steps.
9. **Downward dog** — side, diagonal
   1. Start on hands and knees. *(side)*
   2. Tuck your toes and lift your knees off the floor. *(side)*
   3. Push the floor away; hips go up and back, head hangs loose. *(side, diagonal)*
   4. Heels toward the floor (they needn't touch). Try a 10 s hold.
10. **Scapular pulls** — side, front · built from: dead hang
    1. Start in a dead hang, arms straight. *(front)*
    2. Pull your shoulder blades down and back; elbows stay straight. *(side, front)*
    3. You rise a few cm. Hold 1 s, lower slowly. *(side)*
    4. Try 5 pulls.
11. **Boxer skip** — front · built from: rope bounce
    1. Start bouncing on both feet. *(front)*
    2. Shift your weight to one foot, then the other, like a boxer. *(front)*
    3. One turn of the rope per shift; eyes forward. *(front)*
    4. Try 20 turns.
12. **Squat** — side, front
    1. Feet shoulder-width, toes slightly out. *(front)*
    2. Sit back and down, chest up, knees over toes. *(side)*
    3. Stand up by pushing the floor away. *(side)*
    4. Try 5 slow squats.
13. **Plank to down dog** — side · built from: high plank, downward dog
    1. Start in a high plank. *(side)*
    2. Push your hips up and back into downward dog. *(side)*
    3. Come forward again to the plank. *(side)*
    4. Try 5 slow moves, 2 s each way.
14. **Sprawl** — side · built from: squat, high plank
    1. Squat down and put your hands on the floor. *(side)*
    2. Step (or hop) your feet back into a high plank. *(side)*
    3. Bring your feet back to your hands and stand up. *(side)*
    4. Try 3 slow sprawls.
15. **Mountain climbers** — side · built from: high plank
    1. Start in a high plank. *(side)*
    2. Bring one knee toward your chest, then return it. *(side)*
    3. Switch legs; hips stay low and level. *(side)*
    4. Try 10 slow switches, then speed up a little.
16. **Hollow tuck** — side
    1. Lie on your back, knees bent, feet on the floor. *(side)*
    2. Press your lower back into the floor; no gap. *(side)*
    3. Lift shoulders and feet; knees over hips, arms forward. *(side)*
    4. Try a 10 s hold.
17. **Prone Y** — side, top
    1. Lie face down, forehead just off the floor, chin tucked. *(side)*
    2. Arms overhead in a Y, thumbs up. *(top)*
    3. Lift both arms a few cm; hold 2 s, lower. *(side)*
    4. Try 5 lifts.
18. **Prone T** — top
    1. Lie face down, chin tucked. *(top)*
    2. Arms straight out to the sides in a T, thumbs up. *(top)*
    3. Pinch your shoulder blades and lift the arms; hold 2 s. *(top)*
    4. Try 5 lifts.
19. **Prone W** — top, side
    1. Lie face down, chin tucked. *(side)*
    2. Elbows bent and pulled toward your ribs, hands up: a W. *(top)*
    3. Lift elbows and hands, squeeze shoulder blades; hold 2 s. *(side)*
    4. Try 5 lifts.
20. **Y-T-W raises** — top · built from: prone Y, T, W
    1. Do 3 Y lifts. *(top)*
    2. Without resting, 3 T lifts. *(top)*
    3. Then 3 W lifts; repeat the cycle. *(top)*
    4. Try one full Y-T-W cycle.
21. **Rope high knees** — side · built from: high knees, rope bounce
    1. Start a rope bounce. *(side)*
    2. Switch to high knees: one turn per knee. *(side)*
    3. Chest up; don't hunch toward the knees. *(side)*
    4. Try 20 turns.
22. **Hanging knees** — side · built from: dead hang
    1. Start in a dead hang, shoulders active. *(side)*
    2. Exhale and curl your knees toward your chest. *(side)*
    3. Lower slowly; no swinging. *(side)*
    4. Try 5 knee raises.
23. **Plank–dog reach** — side, front · built from: plank to down dog
    1. Plank, then push back into downward dog. *(side)*
    2. Reach one hand toward the opposite ankle. *(front)*
    3. Back to plank; next time the other hand. *(side)*
    4. Try 4 reaches, 2 per side.
24. **Hollow hold** — side · built from: hollow tuck
    1. Start in the hollow tuck, lower back flat. *(side)*
    2. Straighten your legs, feet low, as long as the back stays flat. *(side)*
    3. If the back lifts, tuck the knees again. *(side)*
    4. Try a 10 s hold.
25. **Hollow rock** — side · built from: hollow hold
    1. Start in the hollow hold. *(side)*
    2. Rock gently toward your head and back to your hips. *(side)*
    3. Keep the banana shape the whole time. *(side)*
    4. Try 5 rocks.
26. **Flexed-arm hang** — side, front
    1. Stand on a chair or jump to the bar. *(side)*
    2. Hold your chin at bar height, elbows tight to your ribs. *(front)*
    3. Lower slowly, over 3 s, when you tire. *(side)*
    4. Try a 5 s hold.
27. **Sprawl burpee** — side · built from: sprawl
    1. Do a sprawl. *(side)*
    2. From the squat, jump up and clap overhead. *(side)*
    3. Land soft and go straight into the next one. *(side)*
    4. Try 3 burpees.
28. **Speed sprint** — side · built from: boxer skip
    1. Start a boxer skip. *(side)*
    2. Speed up the wrists; turn the rope as fast as you can. *(side)*
    3. Shoulders down, core braced; land soft. *(side)*
    4. Try 10 s fast, then slow down.

## 4. Workouts while learning

The cycle pre-fill plans, for curriculum day *k*: **lesson k** + a **"Basics" workout** made of what was learned on days 1…k−1 + the usual mood checks and drill. Day 1 has no workout (nothing learned yet).

The Basics workout is generated, never stored:

- Exercises: the **6 newest** learned lessons, in the order they were learned. A part leaves once a combination built from it is learned, unless the part is itself a ★ exercise (chin tuck and cobra lift leave when *cobra & chin tuck* arrives; dead hang stays after *scapular pulls*).
- Intervals: **20 s work / 20 s rest**, **2 rounds**, 30 s between rounds, then the usual overload scaling.
- Target: rounds = 2.

| Day | Lesson | Basics workout |
|---|---|---|
| 1 | Chin tuck | — |
| 2 | Jumping jacks | chin tuck (≈ 2 min) |
| 3 | Dead hang | chin tuck, jumping jacks |
| 7 | Cobra & chin tuck | chin tuck, jumping jacks, dead hang, high plank, rope bounce, cobra lift |
| 11 | Boxer skip | high plank, rope bounce, cobra & chin tuck, high knees, downward dog, scapular pulls |

From day 24 (posture unlocked) the day editor also offers the posture routine. From day 29 the normal rotation and the template take over.

Code: `src/data/lessons.ts` (generated from §2–§3), `src/domain/curriculum.ts` (Basics, known-before), `engine.suggestDay`. The day editor locks routines and custom routines whose exercises aren't learned by that day; the custom routine builder itself lists every exercise.

## 5. Open for later

- Real pictures for every step and angle (placeholders ship first). In progress: generated outline drawings, see [art/README.md](../../art/README.md#status-and-pending) (6 of 28 lessons drawn, not yet in the app). Proposed view changes from that work, awaiting approval: cobra lift step 2 front → top (thumbs unreadable from the head end); rope bounce steps 3–4 side → front (from the side the rope reads as a stick).
- Whether Basics should switch to the 3-way rotation earlier (e.g. once 6 exercises are known).
