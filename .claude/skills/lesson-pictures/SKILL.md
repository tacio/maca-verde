---
name: lesson-pictures
description: Method for posing, checking and rendering Maçã Verde lesson pictures with the art/ Blender pipeline (MPFB figure → outline SVG). Preloaded into the lesson-artist agent; do not load it in the main session.
user-invocable: false
---

# Lesson pictures

You make the step pictures for exercise lessons (P14: one new exercise a day, each
taught step by step from the angles each step lists). The pipeline is in `art/`;
read `art/README.md`, `art/lib.py`, `art/poses.py`, `art/render.py` before starting.
`chin-tuck` and `high-plank` are done and are your reference for quality.

## Inputs per lesson

- Steps and views: `src/data/lessons.ts` (`LESSONS[id].steps[i].views`; steps are 1-based in file names).
- Form cues and intent: `docs/design/04-curriculum.md` §3 (the lesson's section) and
  `src/workout/exerciseCues.ts`. The picture must teach the cue; the cue becomes a check.
- Parts: `LESSONS[id].parts`. A combination reuses its parts' pose functions — import, don't copy.

## Loop (per lesson)

1. Decide one pose per distinct body position the steps show (often 1–3 poses per lesson;
   several steps may share a pose). Movements get two poses (start/end) and a `ghost`.
2. Write each pose in `art/poses.py` as a function returning checks
   `{name: (rounded value, ok)}`, register it in `POSES`, add the shots to `SHOTS`
   in `art/render.py` (one entry per step × view the lesson lists, in step order).
3. Render: `blender -b --python art/render.py -- <lesson> 2>&1 | grep -E '^(ok|FAIL|wrote|CHECKS)|Error|Traceback|line [0-9]'`
4. Look: `art/preview.sh <lesson>` → Read `art/out/prev/sheet.png` (one image; open single
   PNGs in `art/out/prev/` only to inspect a detail).
5. Judge as a coach would, against the cue: right joints bent, right direction, contacts on
   the floor/bar, nothing intersecting, the key feature visible at this size. A passing check
   with a wrong-looking picture means the check is wrong — fix the check, then the pose.
6. Repeat. If a pose hasn't converged after 4 render rounds, stop on it and report your best
   attempt and what's wrong; move on to the next lesson.

## Checks: what makes a good one

- Encode the cue numerically: angles (`angle(a, b, c)`), distances in cm, contacts
  (lowest points vs z = 0, hands vs bar), "under" relations (|Δy| of wrist vs shoulder).
- Prefer the **visible outline** over bones when the cue is about shape: bones can be
  perfectly straight while the mesh shows a hump (`top_profile(fig, y)` gives the outline
  height in a slice; see `_back_line`). Bone-only checks are fine for joint angles.
- Tolerances: tight enough that the wrong form fails (e.g. plank hips sag −2 cm fails),
  loose enough for anatomy (buttocks stick up ~2 cm on a straight plank).
- When a free parameter has a "correct" value defined by the cue (neck angle that keeps the
  head on the back line), search for it (`min(... for k in range(...))`) instead of guessing.

## Posing toolkit (art/lib.py) and its traps

- World: Z up, figure faces −Y, its left is +X. Side view looks from +X (head on the left
  when lying with head at −Y). `SIDES = (('L', 1), ('R', -1))`.
- `fig.aim(bone, world_dir)` points a bone head→tail; apply parent before child
  (spine → neck → head; clavicle → shoulder01 → upperarm01/02 → lowerarm01/02 → wrist;
  upperleg01/02 → lowerleg01/02 → foot → toes). `aim_chain` for chains.
- `fig.body(v)` maps a direction from the figure's own frame (after `turn`) to world and
  **normalizes it**: put offsets inside one vector — `fig.body((sx*0.03, 0, -1))`, never
  `-up + fig.body((sx*0.03, 0, 0))` (that's a unit sideways vector: legs splay 45°).
- Rest pose is MPFB's A-pose: arms out ~45°, legs wider than hip width. Always set arms
  and legs explicitly (`_arms_down`, `_legs_hip_width`).
- `fig.keep_world_rotation(bone, rot)` holds an orientation while parents move (eyes level
  in the chin tuck; feet flat while legs move).
- `fig.turn(x, y, z)` rotates the whole figure (lying poses: `turn(~76)` = plank lean).
  Contacts: search the angle that puts both contacts on the floor (see `high_plank`), then
  `fig.ground()`.
- Arms raised far from the body make a shoulder hump: lift `clavicle`/`shoulder01`
  partway towards the arm (`(rest + up*0.3)`), as real shoulder blades do.
- Toes: tucked = toe bones aimed along the floor towards the head.
- Props (door bar, jump rope): add small helpers in `lib.py` that create simple geometry
  **linked into `fig.coll`** so Freestyle outlines it (bar: thin cylinder at a height where
  straight arms leave the feet off the floor; rope: a curve with bevel depth ~5 mm).
  Keep props minimal; don't add floors or backgrounds.

## Framing and style

- Outline only (Freestyle silhouettes/contours, no creases) in `currentColor`; don't
  change the style, line width or SVG post-processing.
- `frame: 'upper'` for head/neck/shoulder movements; `ghost: '<start pose>'` draws the start
  position dashed behind the end position — use it for any step that describes a movement
  ("slide", "lift", "jump out").
- Top views need the figure readable from above (e.g. arm positions in Y-T-W); front views
  for symmetry (jumping jacks).

## Boundaries

- Touch only `art/` (poses, shots, small lib helpers). Don't edit `src/`, docs, tests or
  baselines, don't commit, don't change the figure's macros or the line style.
- `art/out/` is scratch; leave the final SVGs there.
- If a lesson's text or views can't be illustrated well (e.g. the view listed hides the
  point), don't change lessons.ts — report it as a suggestion.

## Report (your final message)

Per lesson: poses written, shots rendered, every check with its value, judgement calls,
anything unresolved (with the file to look at), suggestions for the lesson text/views.
End with the contact sheet path(s). Be brief; no code dumps.
