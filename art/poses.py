"""
Poses for lesson pictures. Each pose sets up the figure and returns its checks:
{name: (value, ok)}. A render fails if any check fails, so a picture can't
silently teach the wrong form (docs/design/04-curriculum.md cues).
"""

import math

from mathutils import Vector

from lib import ARM, LEG, NECK, SPINE, TOES, angle, side_bones, top_profile

SIDES = (('L', 1), ('R', -1))  # bone suffix, sign of the figure's left (+X)


def _arms_down(fig):
    for s, sx in SIDES:
        fig.aim_chain(side_bones(fig, ARM[:2], s), fig.body((sx * 0.12, 0.0, -1)))
        fig.aim_chain(side_bones(fig, ARM[2:], s), fig.body((sx * 0.06, -0.06, -1)))
        fig.aim(f'wrist.{s}', fig.body((sx * 0.03, -0.04, -1)))


def _legs_hip_width(fig):
    feet = {s: fig.world_rot(f'foot.{s}') for s, _ in SIDES}
    for s, sx in SIDES:
        fig.aim_chain(side_bones(fig, LEG, s), fig.body((sx * 0.03, 0, -1)))
        fig.keep_world_rotation(f'foot.{s}', feet[s])


def stand(fig):
    """Standing tall, feet hip-width apart, arms relaxed, eyes level."""
    fig.reset()
    _legs_hip_width(fig)
    _arms_down(fig)
    fig.ground()
    head_dir = (fig.p('head', True) - fig.p('head')).normalized()
    tilt = math.degrees(head_dir.angle(Vector((0, 0, 1))))
    return {'head tilt from vertical (°)': (round(tilt, 1), tilt < 12)}


def chin_tuck(fig):
    """Head slid straight back (double chin), not tilted down."""
    stand(fig)
    head_rot = fig.world_rot('head')
    before = fig.p('head', True)
    fig.aim_chain(NECK, fig.body((0, 0.12, 1)))  # neck leans back (+Y is behind)
    fig.keep_world_rotation('head', head_rot)  # eyes stay level
    after = fig.p('head', True)
    back = after.y - before.y
    drop = before.z - after.z
    tilt = math.degrees(fig.world_rot('head').to_quaternion().rotation_difference(head_rot.to_quaternion()).angle)
    return {
        'head moved back (cm)': (round(back * 100, 1), 2.0 <= back * 100 <= 6.0),
        'head dropped (cm)': (round(drop * 100, 1), drop * 100 < 1.5),
        'head tilt change (°)': (round(tilt, 1), tilt < 2),
    }


def _plank_at(fig, theta):
    fig.reset()
    fig.turn(theta)  # lean forward around X: head towards −Y, face to the floor
    up = fig.body((0, 0, 1))
    fig.aim_chain(SPINE + NECK + ['head'], up)
    for s, sx in SIDES:
        # Shoulder blades follow raised arms (upward rotation): spreads the bend
        # over the girdle instead of a hump at the shoulder joint.
        for b in (f'clavicle.{s}', f'shoulder01.{s}'):
            rest = (fig.p(b, True) - fig.p(b)).normalized()
            fig.aim(b, (rest + up * 0.3).normalized())
        fig.aim_chain(side_bones(fig, LEG, s), fig.body((sx * 0.03, 0, -1)))
        fig.aim_chain(side_bones(fig, ARM, s), Vector((0, 0, -1)))
        fig.aim(f'wrist.{s}', Vector((0, -1, -0.05)))
        fig.aim(f'foot.{s}', Vector((0, 0.25, -1)))
        for t in side_bones(fig, TOES, s):
            fig.aim(t, Vector((0, -1, -0.1)))
    hand = min(fig.p(f'wrist.{s}').z for s, _ in SIDES)
    toe = min(fig.p(f'toe3-3.{s}', True).z for s, _ in SIDES)
    return hand - toe


def _with_neck(fig, k):
    fig.aim_chain(NECK + ['head'], fig.body((0, k, 1)))
    return _back_line(fig)


def _back_line(fig):
    """Outline heights (side view) at head and hips relative to the upper-back→calves line."""
    ys = {k: fig.p(b).y for k, b in (('head', 'head'), ('upper back', 'spine01'),
                                      ('hips', 'spine05'), ('calves', 'lowerleg01.L'))}
    zs = {k: top_profile(fig, y) for k, y in ys.items()}
    (y0, z0), (y1, z1) = (ys['upper back'], zs['upper back']), (ys['calves'], zs['calves'])
    return {k: zs[k] - (z0 + (z1 - z0) * (ys[k] - y0) / (y1 - y0)) for k in ('head', 'hips')}


def high_plank(fig):
    """Hands under shoulders, one straight line from head to heels."""
    best = min((abs(_plank_at(fig, t / 4)), t / 4) for t in range(240, 360))
    gap = _plank_at(fig, best[1])
    fig.ground()
    # Neck: the angle (towards the back, +Y in the body frame) that puts the
    # head on the back's outline, as a coach would cue "head in line".
    lift = min((abs(_with_neck(fig, k / 20)['head']), k / 20) for k in range(0, 11))[1]
    off = _with_neck(fig, lift)
    sh = fig.p('upperarm01.L')
    under = abs(fig.p('wrist.L').y - sh.y)
    return {
        'head off the back line (cm)': (round(off['head'] * 100, 1), abs(off['head']) < 0.04),
        'hips off the back line (cm)': (round(off['hips'] * 100, 1), -0.02 < off['hips'] < 0.05),
        'hands under shoulders (cm)': (round(under * 100, 1), under < 0.06),
        'hands vs toes height (cm)': (round(gap * 100, 1), abs(gap) < 1.5),
    }


POSES = {'stand': stand, 'chin-tuck': chin_tuck, 'high-plank': high_plank}
