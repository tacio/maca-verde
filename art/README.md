# Lesson pictures

Generated, not drawn: a neutral MPFB2 figure (CC0) in Blender is posed by script,
checked by numbers, and rendered from the views each lesson step lists
(`src/data/lessons.ts`, P14).

```bash
blender -b --python art/render.py -- [--out DIR] [lesson …]
```

- `lib.py` — figure, world-space bone aiming, mesh measurements, cameras, both styles.
- `poses.py` — one function per pose; each returns checks (`{name: (value, ok)}`) that
  encode the lesson's cue (plank: head and hips on the back's outline; chin tuck: head
  back 2–6 cm, no tilt). A failed check exits non-zero.
- `render.py` — the shot list (lesson, step, view, pose, options: `frame: 'upper'`
  for small movements, `ghost` = start pose drawn dashed behind).

Style: outlines only — Freestyle silhouettes → SVG in `currentColor` (follows tokens
and dark mode, a few KB gzipped). No creases: interior detail on an unclothed,
hairless figure looks like a mannequin.
Output goes to `art/out/` (ignored).

Setup: Blender ≥ 5.1 on PATH with the MPFB and Freestyle SVG Exporter extensions
(`blender --online-mode -c extension install mpfb freestyle_svg_exporter --enable`).

## Status and pending

As of 2026-11-27 (day 14367). The app still shows placeholders: no picture is wired in yet.

**Drawn** (all checks pass; `art/out/`, regenerate with the command above):
chin-tuck, high-plank, jumping-jacks, door-bar-dead-hang, rope-bounce, cobra-lift,
chin-tuck-cobra-hold, high-knees, downward-dog, door-bar-scapular-pull.

Views: `side`, `front`, `top` and `diagonal` (front-left, ~20° above; no floor line, since a
tilted floor isn't a line). Use `diagonal` when depth matters: a rope loop collapses into a
line from the side. Frames: `full`, `upper`, `hand` (close-up of the near hand, e.g. thumbs).
View changes are lesson content: edit docs/design/04-curriculum.md §3 first (user approval),
then `src/data/lessons.ts`, then re-render.

**Weak but accepted:** dead hang active vs passive is subtle from the side; jumping-jacks step 5
heel lift barely visible from the front; cobra & chin tuck relies on the step-2 ghost;
high-knees step 3 (front) foreshortens the arm swing; downward-dog's hanging head reads as a
rounded mass; scapular pulls show "down" but not "back".

**Not drawn yet** (18, ids in curriculum order; batches of 3–5 with the `lesson-artist` agent,
`.claude/agents/lesson-artist.md`, method in `.claude/skills/lesson-pictures/SKILL.md`):
`rope-boxer-skip-hiit`, `squat`, `plank-to-downdog`, `sprawl`, `mountain-climber-sprints`, `hollow-tuck`, `prone-y`, `prone-t`, `prone-w`, `prone-ytw-raises`, `rope-high-knees-burn`, `door-bar-hanging-knees`, `plank-downdog-toe-tap`, `hollow-hold`, `hollow-body-hold-tuck`, `door-bar-isometric-lock`, `sprawl-burpee-blast`, `rope-speed-sprint-tabata`.
Expect ~1.5 h and ~125k Sonnet tokens per batch of 4; the main session reviews each batch's
contact sheets (`art/out/prev-<lesson>.png`) against the cues before the next.

**Wiring into the app** (after the drawings): an `<img>` can't inherit `currentColor`, so
draw each SVG as a CSS mask (`mask-image: url(…)` on an element with a token background,
e.g. `bg-ink`), keeping `data-step-image`, `role="img"` and the aria-label. Ship the SVGs
from `art/out/` to a served folder (e.g. `public/lessons/<lesson>-<step>-<view>.svg`) and
resolve them by that naming convention instead of hand-editing `images` in lessons.ts. The
PWA precache should include them (offline lessons). Update the lesson scenarios' baselines.

**Setup on a new machine:** Blender ≥ 5.1 on PATH; extensions `mpfb` and
`freestyle_svg_exporter` (command under Setup above); Inkscape and ImageMagick for
`art/preview.sh`. Optional: Blender Lab MCP (`uv tool install
"git+https://projects.blender.org/lab/blender_mcp.git#subdirectory=mcp"`, add-on from the
`https://lab.blender.org/` extensions repo, `claude mcp add blender -- blender-mcp`).
