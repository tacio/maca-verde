"""
Render lesson pictures headless:

    blender -b --python art/render.py -- [--out DIR] [lesson …]

Each shot is (lesson, step, view, pose[, options]); options: `frame` ('full',
'upper' = head and shoulders, for small movements, or 'hand' = close-up of the near hand) and `ghost` (a start pose
drawn faint and dashed behind). Files are named
<lesson>-<step>-<view>.svg.
Prints every pose check and exits non-zero if one fails.
"""

import pathlib
import sys

HERE = pathlib.Path(__file__).resolve().parent
sys.path.insert(0, str(HERE))

import addon_utils  # noqa: E402
import bpy  # noqa: E402

if not hasattr(bpy.types.Scene, 'svg_export'):  # installed but not enabled in this profile
    addon_utils.enable('bl_ext.blender_org.freestyle_svg_exporter', default_set=False)

from lib import Figure, export_line_svg, line_paths, setup_camera  # noqa: E402
from poses import POSES  # noqa: E402

# Steps follow src/data/lessons.ts (1-based), one entry per view the step lists.
SHOTS = [
    ('chin-tuck', 1, 'side', 'stand'),
    ('chin-tuck', 2, 'side', 'chin-tuck', {'frame': 'upper', 'ghost': 'stand'}),
    ('chin-tuck', 3, 'side', 'chin-tuck', {'frame': 'upper'}),
    ('chin-tuck', 3, 'front', 'chin-tuck', {'frame': 'upper'}),
    ('chin-tuck', 4, 'side', 'chin-tuck', {'frame': 'upper', 'ghost': 'stand'}),
    ('high-plank', 1, 'top', 'high-plank'),
    ('high-plank', 2, 'side', 'high-plank'),
    ('high-plank', 3, 'side', 'high-plank'),
    ('high-plank', 4, 'side', 'high-plank'),
    ('jumping-jacks', 1, 'front', 'jj-stand'),
    ('jumping-jacks', 2, 'front', 'jj-arms', {'ghost': 'jj-stand'}),
    ('jumping-jacks', 3, 'front', 'jj-feet', {'ghost': 'jj-stand'}),
    ('jumping-jacks', 4, 'front', 'jj-both', {'ghost': 'jj-stand'}),
    ('jumping-jacks', 5, 'front', 'jj-land'),
    ('door-bar-dead-hang', 1, 'front', 'dead-hang'),
    ('door-bar-dead-hang', 2, 'side', 'hang-passive'),
    ('door-bar-dead-hang', 3, 'side', 'dead-hang', {'ghost': 'hang-passive'}),
    ('door-bar-dead-hang', 4, 'side', 'dead-hang'),
    ('rope-bounce', 1, 'front', 'rope-ready'),
    ('rope-bounce', 2, 'diagonal', 'rope-wrists', {'ghost': 'rope-ready'}),
    ('rope-bounce', 3, 'diagonal', 'rope-hop'),
    ('rope-bounce', 4, 'diagonal', 'rope-hop'),
    ('cobra-lift', 1, 'side', 'cobra-flat'),
    ('cobra-lift', 2, 'side', 'cobra-thumbs', {'frame': 'hand', 'ghost': 'cobra-flat'}),
    ('cobra-lift', 3, 'side', 'cobra-lift', {'ghost': 'cobra-thumbs'}),
    ('cobra-lift', 4, 'side', 'cobra-lift'),
    ('chin-tuck-cobra-hold', 1, 'side', 'cobra-lift'),
    ('chin-tuck-cobra-hold', 2, 'side', 'cobra-tuck', {'frame': 'upper', 'ghost': 'cobra-lift'}),
    ('chin-tuck-cobra-hold', 3, 'side', 'cobra-tuck'),
    ('chin-tuck-cobra-hold', 4, 'side', 'cobra-tuck'),
    ('high-knees', 1, 'side', 'stand'),
    ('high-knees', 2, 'side', 'high-knees-up', {'ghost': 'stand'}),
    ('high-knees', 3, 'front', 'high-knees-up'),
    ('high-knees', 4, 'side', 'high-knees-up'),
    ('downward-dog', 1, 'side', 'dog-all-fours'),
    ('downward-dog', 2, 'side', 'dog-tucked', {'ghost': 'dog-all-fours'}),
    ('downward-dog', 3, 'side', 'dog', {'ghost': 'dog-tucked'}),
    ('downward-dog', 3, 'diagonal', 'dog'),
    ('downward-dog', 4, 'side', 'dog'),
    ('door-bar-scapular-pull', 1, 'front', 'scap-start'),
    ('door-bar-scapular-pull', 2, 'side', 'scap-pull', {'ghost': 'scap-start', 'frame': 'upper'}),
    ('door-bar-scapular-pull', 2, 'front', 'scap-pull', {'ghost': 'scap-start', 'frame': 'upper'}),
    ('door-bar-scapular-pull', 3, 'side', 'scap-pull', {'ghost': 'scap-start', 'frame': 'upper'}),
    ('door-bar-scapular-pull', 4, 'side', 'scap-pull'),
]


def main(argv):
    out, lessons = HERE / 'out', []
    it = iter(argv)
    for a in it:
        if a == '--out':
            out = pathlib.Path(next(it))
        else:
            lessons.append(a)
    out.mkdir(parents=True, exist_ok=True)
    fig = Figure()
    failed = []
    checked = set()

    def pose_as(pose):
        checks = POSES[pose](fig)
        if pose not in checked:
            checked.add(pose)
            for name, (value, ok) in checks.items():
                print(f"{'ok  ' if ok else 'FAIL'} {pose}: {name} = {value}")
                if not ok:
                    failed.append(f'{pose}: {name} = {value}')

    for lesson, step, view, pose, *rest in SHOTS:
        opts = rest[0] if rest else {}
        if lessons and lesson not in lessons:
            continue
        pose_as(pose)
        setup_camera(fig, view, opts.get('frame', 'full'))
        base = out / f'{lesson}-{step}-{view}'
        ghost = None
        if 'ghost' in opts:  # same camera, start pose
            pose_as(opts['ghost'])
            ghost = line_paths(base.with_suffix('.svg'))
            pose_as(pose)
        export_line_svg(fig, base.with_suffix('.svg'), view, ghost)
        print('wrote', base.name)
    if failed:
        print('CHECKS FAILED:', *failed, sep='\n  ')
        sys.exit(1)


main(sys.argv[sys.argv.index('--') + 1:] if '--' in sys.argv else [])
