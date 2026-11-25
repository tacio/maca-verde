"""
Poses for lesson pictures. Each pose sets up the figure and returns its checks:
{name: (value, ok)}. A render fails if any check fails, so a picture can't
silently teach the wrong form (docs/design/04-curriculum.md cues).
"""

import math

import bpy
from mathutils import Vector

from lib import ARM, LEG, NECK, SPINE, TOES, add_bar, add_rope, angle, side_bones, top_profile

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



# --- jumping jacks (front view) ---------------------------------------------------

def _jj(fig, spread, arms_up, heels=0.0):
    """Standing, legs spread `spread` (0 = together, sideways run per unit drop), arms down or overhead."""
    fig.reset()
    feet = {s: fig.world_rot(f'foot.{s}') for s, _ in SIDES}
    for s, sx in SIDES:
        # Hips are ~0.17 m apart: "together" leans the legs in so the feet touch.
        fig.aim_chain(side_bones(fig, LEG, s), fig.body((sx * (spread - 0.09), 0, -1)))
        fig.keep_world_rotation(f'foot.{s}', feet[s])
        if heels:  # balls of the feet: heel up, toes stay flat
            fig.aim(f'foot.{s}', fig.body((0, -heels, -1)))
            for t in side_bones(fig, TOES, s):
                fig.aim(t, fig.body((0, -1, 0)))
        if arms_up:
            for b in (f'clavicle.{s}', f'shoulder01.{s}'):
                rest = (fig.p(b, True) - fig.p(b)).normalized()
                fig.aim(b, (rest + fig.body((0, 0, 1)) * 0.45).normalized())
            fig.aim_chain(side_bones(fig, ARM, s), fig.body((-sx * 0.31, 0, 1)))
            fig.aim(f'wrist.{s}', fig.body((0, 0, 1)))  # hands straight up, palms meet
    if not arms_up:
        _arms_down(fig)
    fig.ground()


def _jj_checks(fig, feet, arms):
    ank = abs(fig.p('foot.L').x - fig.p('foot.R').x)
    shoulders = abs(fig.p('upperarm01.L').x - fig.p('upperarm01.R').x)
    out = {}
    if feet == 'together':
        out['feet gap (cm)'] = (round(ank * 100, 1), ank < 0.09)
    else:
        r = ank / shoulders
        out['feet gap / shoulder width'] = (round(r, 2), 1.15 < r < 1.8)
    head_top = fig.p("head", True).z
    if arms == 'up':
        gap = abs(fig.p('wrist.L').x - fig.p('wrist.R').x)
        out['hands gap (cm)'] = (round(gap * 100, 1), gap < 0.10)
        hz = min(fig.p(f'wrist.{s}').z for s, _ in SIDES)
        out['hands above head (cm)'] = (round((hz - head_top) * 100, 1), hz > head_top)
    else:
        w = max(abs(fig.p(f'wrist.{s}').x - fig.p(f'upperarm01.{s}').x) for s, _ in SIDES)
        out['hands off the thighs (cm)'] = (round(w * 100, 1), w < 0.12)
    return out


def jj_stand(fig):
    """Feet together, arms by the sides."""
    _jj(fig, 0.0, False)
    return _jj_checks(fig, 'together', 'down')


def jj_arms(fig):
    """Arms only: hands meet overhead, feet together."""
    _jj(fig, 0.0, True)
    return _jj_checks(fig, 'together', 'up')


def jj_feet(fig):
    """Feet only: hopped wider than the shoulders, arms down."""
    _jj(fig, 0.26, False)
    return _jj_checks(fig, 'apart', 'down')


def jj_both(fig):
    """Both at once: feet wide, hands overhead."""
    _jj(fig, 0.26, True)
    return _jj_checks(fig, 'apart', 'up')


def jj_land(fig):
    """Soft landing: on the balls of the feet, heels just off the floor."""
    _jj(fig, 0.0, False, heels=0.5)
    heel = fig.p('foot.L').z
    toe = min(fig.p(f'toe3-3.{s}', True).z for s, _ in SIDES)
    out = _jj_checks(fig, 'together', 'down')
    out['heel above toes (cm)'] = (round((heel - toe) * 100, 1), 3 < (heel - toe) * 100 < 12)
    return out


# --- dead hang (door bar) ----------------------------------------------------------

def _palm(fig, s):
    """Unit normal out of the palm (calibrated: palms-down at rest points to −Z)."""
    v = fig.p(f'metacarpal4.{s}') - fig.p(f'metacarpal2.{s}')
    d = (fig.p(f'finger3-1.{s}') - fig.p(f'wrist.{s}')).normalized()
    n = v.cross(d).normalized()
    return n if s == 'L' else -n  # mirror


def _palm_sign(fig):
    fig.reset()
    return 1 if _palm(fig, 'L').z < 0 else -1


def _hang(fig, active, grip=0.1, roll=0.0, bar_z=None):
    """Hanging from a bar; returns the bar. `active`: shoulders pulled down; else shrugged."""
    fig.reset()
    for s, sx in SIDES:
        fig.aim_chain(side_bones(fig, LEG, s), fig.body((sx * -0.02, 0, -1)))
        fig.aim(f'foot.{s}', fig.body((0, -0.3, -1)))  # relaxed, toes pointing down
        for t in side_bones(fig, TOES, s):
            fig.aim(t, fig.body((0, -0.4, -1)))
        for b in (f'clavicle.{s}', f'shoulder01.{s}'):
            rest = (fig.p(b, True) - fig.p(b)).normalized()
            fig.aim(b, (rest + fig.body((0, 0, 1)) * (0.15 if active else 0.9)).normalized())
        up = fig.body((sx * grip, 0, 1))
        fig.aim_chain(side_bones(fig, ARM, s), up)
        fig.aim(f'wrist.{s}', up)
        for b in ('lowerarm01', 'lowerarm02'):  # pronate: palms face forward (overhand)
            fig.roll(f'{b}.{s}', roll * (1 if s == 'L' else -1) / 2)
        # fingers wrap forward over the bar
        for k in (1, 2, 3):
            for f in range(2, 6):
                nm = f'finger{f}-{k}.{s}'
                if nm in fig.rig.pose.bones:
                    fig.aim(nm, fig.body((0, -1, 0.2 if k == 1 else -0.8)))
    def grip_pt():
        return sum(((fig.p(f'metacarpal3.{s}') + fig.p(f'metacarpal3.{s}', True)) / 2 for s, _ in SIDES), Vector()) / 2 + Vector((0, 0, 0.03))  # bar sits in the palm, fingers curl over

    if bar_z is None:  # the bar's height: straight arms leave the feet 20 cm off the floor
        fig.ground()
        fig.rig.location.z += 0.20
    else:  # same bar, whatever the shoulders do
        fig.rig.location.z += bar_z - grip_pt().z
    fig.update()
    g = grip_pt()
    _BAR.update(z=g.z, y=g.y)
    return add_bar(fig, Vector((0, g.y, g.z)))


def _hang_checks(fig, passive_gap=None):
    pts = fig.points()
    out = {}
    for s in ('L',):
        elbow = angle(fig.p('upperarm01.L'), fig.p('lowerarm01.L'), fig.p('wrist.L'))
        out['arm straight (elbow °)'] = (round(elbow, 1), elbow > 168)
    sh = abs(fig.p('upperarm01.L').x - fig.p('upperarm01.R').x)
    gw = abs(fig.p('wrist.L').x - fig.p('wrist.R').x)
    out['grip / shoulder width'] = (round(gw / sh, 2), 1.1 < gw / sh < 1.6)
    low = min(p.z for p in pts)
    out['feet off the floor (cm)'] = (round(low * 100, 1), low > 0.15)
    hips = abs(fig.p('spine05').y - fig.p('upperarm01.L').y)
    out['hips under shoulders (cm)'] = (round(hips * 100, 1), hips < 0.07)
    palm = _palm(fig, 'L') * _PALM_SIGN[0]
    out['palm faces forward (y)'] = (round(palm.y, 2), palm.y < -0.5)
    return out


_PALM_SIGN = [1]
_BAR = {}


def _best_roll(fig):
    """Forearm twist that turns the palms to face forward (overhand grip)."""
    _PALM_SIGN[0] = _palm_sign(fig)

    def face(r):
        _hang(fig, False, roll=r)
        return (_palm(fig, 'L') * _PALM_SIGN[0]).y

    ROLL[0] = min(range(-180, 181, 15), key=face)


def hang_passive(fig):
    """Relaxed hang: shoulders shrugged up to the ears, head forward."""
    _best_roll(fig)
    _hang(fig, True, roll=ROLL[0])  # fixes the bar height
    _hang(fig, False, roll=ROLL[0], bar_z=_BAR['z'])
    return {}


def dead_hang(fig):
    """Active hang: shoulders pulled down away from the ears, chin tucked, arms straight."""
    _best_roll(fig)
    _hang(fig, True, roll=ROLL[0])
    bz = _BAR['z']
    _hang(fig, False, roll=ROLL[0], bar_z=bz)
    passive = fig.p('upperarm01.L').z - fig.p('neck01').z
    _hang(fig, True, roll=ROLL[0], bar_z=bz)
    active = fig.p('upperarm01.L').z - fig.p('neck01').z
    head_rot = fig.world_rot('head')
    before = fig.p('head', True)
    fig.aim_chain(NECK, fig.body((0, 0.12, 1)))
    fig.keep_world_rotation('head', head_rot)
    back = fig.p('head', True).y - before.y
    out = _hang_checks(fig)
    out['shoulders down vs shrugged (cm)'] = (round((passive - active) * 100, 1), passive - active > 0.02)
    out['head back (cm)'] = (round(back * 100, 1), 2 <= back * 100 <= 6)
    return out


ROLL = [0.0]

# --- rope bounce -------------------------------------------------------------------


def _rope(fig, hands, phase):
    """Handles in the fists and the rope: `rest` behind the heels, `under` the feet, `overhead`."""
    ft = (fig.p('foot.L') + fig.p('foot.R')) / 2
    apex, mid = {
        'rest': (Vector((0, ft.y + 0.30, 0.012)), (0.3, ft.y + 0.12, 0.45)),
        'under': (Vector((0, ft.y - 0.02, 0.006)), (0.34, ft.y - 0.12, 0.5)),
        'overhead': (Vector((0, ft.y + 0.2, 1.95)), (0.34, ft.y - 0.38, 1.5)),
    }[phase]
    pts = []
    for (s, sx), h in zip(SIDES, hands):
        bottom = h - Vector((0, 0, 0.07))
        pts.append((bottom, Vector((sx * mid[0], mid[1], mid[2]))))
        from lib import add_prop
        bpy.ops.mesh.primitive_cylinder_add(radius=0.015, depth=0.14, vertices=12, location=tuple(h))
        add_prop(fig, bpy.context.active_object)
    add_rope(fig, [pts[0][0], pts[0][1], apex, pts[1][1], pts[1][0]])


def _rope_pose(fig, phase, hop=0.0, roll=0.0):
    fig.reset()
    feet = {s: fig.world_rot(f'foot.{s}') for s, _ in SIDES}
    for s, sx in SIDES:
        fig.aim_chain(side_bones(fig, LEG, s), fig.body((sx * -0.08, 0, -1)))
        fig.keep_world_rotation(f'foot.{s}', feet[s])
        if hop:  # balls of the feet
            fig.aim(f'foot.{s}', fig.body((0, -0.45, -1)))
            for t in side_bones(fig, TOES, s):
                fig.aim(t, fig.body((0, -1, 0)))
        # upper arm by the ribs, forearm forward and a little out, hands at hip height
        fig.aim_chain(side_bones(fig, ARM[:2], s), fig.body((sx * 0.05, 0.0, -1)))
        fig.aim_chain(side_bones(fig, ARM[2:], s), fig.body((sx * 0.25, -1, -0.45)))
        fig.aim(f'wrist.{s}', fig.body((sx * 0.25, -1, -0.45)))
        for b in ('lowerarm01', 'lowerarm02'):  # thumbs up: palms face each other
            fig.roll(f'{b}.{s}', roll * (1 if s == 'L' else -1) / 2)
        for k in (1, 2, 3):
            for f in range(2, 6):
                nm = f'finger{f}-{k}.{s}'
                if nm in fig.rig.pose.bones:
                    fig.aim(nm, fig.body((-sx * (0.9 if k == 1 else 0.3), -0.1, 0 if k == 1 else -1)))
    fig.ground()
    if hop:
        fig.rig.location.z += hop
        fig.update()
    hands = [(fig.p(f'metacarpal3.{s}') + fig.p(f'metacarpal3.{s}', True)) / 2 for s, _ in SIDES]
    _rope(fig, hands, phase)


def _rope_checks(fig, hop):
    pts = fig.points()
    out = {}
    sh = fig.p('upperarm01.L')
    el = fig.p('lowerarm01.L')
    gap = abs(el.x) - abs(sh.x)
    out['elbow beside the ribs (cm out)'] = (round(gap * 100, 1), gap < 0.07)
    hip = fig.p('upperleg01.L').z
    dz = fig.p('wrist.L').z - hip
    out['hands vs hip height (cm)'] = (round(dz * 100, 1), abs(dz) < 0.12)
    ang = angle(sh, el, fig.p('wrist.L'))
    out['elbow bend (°)'] = (round(ang, 1), 80 < ang < 130)
    if hop:
        low = min(p.z for p in pts)
        out['feet off the floor (cm)'] = (round(low * 100, 1), 1.0 <= low * 100 <= 2.0)
    return out


def _best_rope_roll(fig):
    """Forearm twist that turns the palm inwards (thumbs up)."""
    def inward(r):
        _rope_pose(fig, 'rest', roll=r)
        return (_palm(fig, 'L') * _PALM_SIGN[0]).x  # inward for the left hand is −X

    _PALM_SIGN[0] = _palm_sign(fig)
    ROLL[0] = min(range(-180, 181, 15), key=inward)


def rope_ready(fig):
    """Handles at hip height, elbows by the ribs, rope resting behind the heels."""
    _best_rope_roll(fig)
    _rope_pose(fig, 'rest', roll=ROLL[0])
    out = _rope_checks(fig, 0)
    palm = _palm(fig, 'L') * _PALM_SIGN[0]
    out['palm faces inwards (x)'] = (round(-palm.x, 2), -palm.x > 0.5)
    return out


def rope_wrists(fig):
    """The rope passes overhead while the hands stay at the hips."""
    _best_rope_roll(fig)
    _rope_pose(fig, 'overhead', roll=ROLL[0])
    return {}


def rope_hop(fig):
    """On the balls of both feet, 1-2 cm off the floor, the rope passes under."""
    _best_rope_roll(fig)
    _rope_pose(fig, 'under', hop=0.015, roll=ROLL[0])
    out = _rope_checks(fig, 0.015)
    heel = fig.p('foot.L').z
    toe = min(fig.p(f'toe3-3.{s}', True).z for s, _ in SIDES)
    out['heel above toes (cm)'] = (round((heel - toe) * 100, 1), 3 < (heel - toe) * 100 < 12)
    return out


# --- cobra lift (prone) ------------------------------------------------------------

def _elev(v):
    """Elevation (°) of a direction above the horizontal plane."""
    return math.degrees(math.asin(max(-1, min(1, v.normalized().z))))


_KL = {}
_K = {}  # hand-on-floor slope per arm twist
_ROLLS = {}


def _prone(fig, lift, roll=0.0, k=None):
    """Face down, head towards −Y, arms by the sides; chest raised by `lift` degrees.

    The arms slope down just enough that the hands rest on the floor of the flat pose
    (`k` is found there and reused when lifted).
    """
    fig.reset()
    fig.turn(90)
    head = Vector((0, -1, 0))

    def tilt(deg):
        a = math.radians(deg)
        return Vector((0, -math.cos(a), math.sin(a)))

    def build(k, lift_deg, kl=None):
        fig.reset()
        fig.turn(90)
        fig.aim_chain(SPINE[:3], head)  # spine05..03 stay flat
        fig.aim('spine02', tilt(lift_deg * 0.45))
        fig.aim('spine01', tilt(lift_deg))
        fig.aim_chain(NECK + ['head'], tilt(lift_deg * 1.1))  # neck follows the chest line
        for s, sx in SIDES:
            fig.aim_chain(side_bones(fig, LEG, s), Vector((sx * 0.03, 1, -(_KL.get('v', 0.0) if kl is None else kl))))
            fig.aim(f'foot.{s}', Vector((0, 1, -0.2)))  # tops of the feet on the floor
            for t in side_bones(fig, TOES, s):
                fig.aim(t, Vector((0, 1, -0.1)))
            d = Vector((sx * 0.10, 1, -k))
            fig.aim_chain(side_bones(fig, ARM, s), d)
            fig.aim(f'wrist.{s}', d)
            for b in ('upperarm02', 'lowerarm01', 'lowerarm02'):
                fig.roll(f'{b}.{s}', roll * (1 if s == 'L' else -1) / 3)
        fig.ground()

    def hand_gap(k):
        build(k, 0)
        return abs(fig.p('wrist.L').z - 0.03)

    if 'v' not in _KL:  # legs slope down so thighs and chest both rest on the floor
        def both_down(kl):
            build(0.1, 0, kl)
            pts = fig.points()
            hip = fig.p('spine05').y
            return max(min(q.z for q in pts if q.y > hip + 0.12), min(q.z for q in pts if q.y < hip - 0.25))

        _KL['v'] = min((i / 100 for i in range(0, 25, 2)), key=both_down)
    if k is not None:
        build(k, lift)
        return
    if roll not in _K:
        _K[roll] = min((i / 100 for i in range(0, 40, 2)), key=hand_gap)
    build(_K[roll], lift)


def _chest_top(fig, y=None):
    """Height of the upper back's outline (arms excluded) around the chest's position."""
    lo, hi = y  # y window between the head and the waist
    return max(q.z for q in fig.points() if lo < q.y < hi and abs(q.x) < 0.12)


def _best_prone_roll(fig, toward):
    """Arm twist that points the left palm along `toward` (world), e.g. down or inwards."""
    _PALM_SIGN[0] = _palm_sign(fig)
    key = tuple(toward)
    if key not in _ROLLS:
        def err(r):
            _prone(fig, 0, r, k=0.1)
            return -(_palm(fig, 'L') * _PALM_SIGN[0]).dot(toward)

        _ROLLS[key] = min(range(-180, 181, 30), key=err)
    ROLL[0] = _ROLLS[key]


def _cobra(fig, lift, thumbs):
    _best_prone_roll(fig, Vector((-1, 0, 0.3)) if thumbs else Vector((0, 0, -1)))
    _prone(fig, 0, ROLL[0])
    flat_y = (fig.p('head').y + 0.2, fig.p('spine05').y - 0.25)
    flat_chest = _chest_top(fig, flat_y)
    flat_hip = fig.p('spine05').z
    _prone(fig, lift, ROLL[0])
    pts = fig.points()
    out = {}
    palm = _palm(fig, 'L') * _PALM_SIGN[0]
    if thumbs:
        out['thumbs up: palm faces inwards (x)'] = (round(-palm.x, 2), -palm.x > 0.6)
    else:
        out['palm faces down (z)'] = (round(-palm.z, 2), -palm.z > 0.6)
    out['belly down: lowest point (cm)'] = (round(min(p.z for p in pts) * 100, 1), True)
    rise = _chest_top(fig, flat_y) - flat_chest
    if lift:
        out['chest rise (cm)'] = (round(rise * 100, 1), 4 <= rise * 100 <= 12)
        out['hips stay down (cm)'] = (round((fig.p('spine05').z - flat_hip) * 100, 1),
                                      abs(fig.p('spine05').z - flat_hip) < 0.015)
        he = _elev(fig.p('head', True) - fig.p('head'))
        ce = _elev(fig.p('spine01', True) - fig.p('spine01'))
        out['head vs chest elevation (°)'] = (round(he - ce, 1), he - ce < 6 and he < 30)
    else:
        he = _elev(fig.p('head', True) - fig.p('head'))
        out['head flat, face down (°)'] = (round(he, 1), abs(he) < 8)
    return out


def cobra_flat(fig):
    """Lying face down, arms by the sides, palms down."""
    return _cobra(fig, 0, False)


def cobra_thumbs(fig):
    """Lying face down, thumbs turned up toward the ceiling."""
    return _cobra(fig, 0, True)


def cobra_lift(fig):
    """Chest a few cm off the floor, eyes on the floor, thumbs up."""
    return _cobra(fig, 20, True)


POSES = {'stand': stand, 'chin-tuck': chin_tuck, 'high-plank': high_plank,
         'jj-stand': jj_stand, 'jj-arms': jj_arms, 'jj-feet': jj_feet, 'jj-both': jj_both, 'jj-land': jj_land,
         'hang-passive': hang_passive, 'dead-hang': dead_hang,
         'rope-ready': rope_ready, 'rope-wrists': rope_wrists, 'rope-hop': rope_hop,
         'cobra-flat': cobra_flat, 'cobra-thumbs': cobra_thumbs, 'cobra-lift': cobra_lift}
