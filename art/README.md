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
