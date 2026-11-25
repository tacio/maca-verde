"""
Lesson-picture toolkit (runs inside Blender, `blender -b --python art/render.py`).

A neutral MPFB2 figure (CC0) is posed by aiming bones in world space, checked
numerically (angles, contacts), and drawn from fixed orthographic views as
outline art: Freestyle silhouettes → SVG in currentColor, so pictures follow the
app's tokens and dark mode. Outlines only — no creases (face, chest, folds): an
unclothed, hairless figure reads as a mannequin once interior detail shows.

World frame: Z up, the figure faces −Y, its left is +X.
"""

import importlib
import math

import bpy
from mathutils import Matrix, Vector

UP = Vector((0, 0, 1))
FORWARD = Vector((0, -1, 0))  # where the figure faces at rest

# Neutral, adult, average build: instructional, not a portrait.
MACROS = {
    'gender': 0.5, 'age': 0.5, 'muscle': 0.6, 'weight': 0.45, 'proportions': 0.5,
    'height': 0.5, 'cupsize': 0.0, 'firmness': 0.6,
    'race': {'asian': 0.33, 'caucasian': 0.33, 'african': 0.33},
}


def _hs():
    return importlib.import_module('bl_ext.blender_org.mpfb.services.humanservice').HumanService


class Figure:
    """The rigged figure in the current scene."""

    def __init__(self):
        sc = bpy.context.scene
        for o in list(sc.objects):
            bpy.data.objects.remove(o)
        coll = bpy.data.collections.get('figure') or bpy.data.collections.new('figure')
        if coll.name not in sc.collection.children:
            sc.collection.children.link(coll)
        self.coll = coll
        hs = _hs()
        self.mesh = hs.create_human(macro_detail_dict=MACROS)
        self.rig = hs.add_builtin_rig(self.mesh, 'default')
        for o in (self.mesh, self.rig):
            for c in list(o.users_collection):
                c.objects.unlink(o)
            coll.objects.link(o)
        self._show_eyes()
        self.reset()

    def _show_eyes(self):
        """The base mesh hides its eyeball helpers; without them the face has empty sockets."""
        m = self.mesh
        vis = m.vertex_groups.new(name='visible')
        keep = {m.vertex_groups[n].index for n in ('body', 'helper-l-eye', 'helper-r-eye')}
        vis.add([v.index for v in m.data.vertices if any(g.group in keep and g.weight > 0.5 for g in v.groups)],
                1.0, 'REPLACE')
        for md in m.modifiers:
            if md.type == 'MASK':
                md.vertex_group = 'visible'

    # --- posing ------------------------------------------------------------

    def reset(self):
        for pb in self.rig.pose.bones:
            pb.matrix_basis = Matrix()
        self.rig.location = (0, 0, 0)
        self.rig.rotation_euler = (0, 0, 0)
        self.update()

    def update(self):
        bpy.context.view_layer.update()

    def turn(self, x_deg=0.0, y_deg=0.0, z_deg=0.0):
        """Rotate the whole figure (degrees, XYZ Euler)."""
        self.rig.rotation_euler = tuple(math.radians(a) for a in (x_deg, y_deg, z_deg))
        self.update()

    def body(self, v):
        """A direction in the figure's own frame (rest: Z up, −Y forward) → world."""
        return (self.rig.matrix_world.to_3x3().normalized() @ Vector(v)).normalized()

    def aim(self, bone, direction):
        """Point a bone (head→tail) along a world direction, by the smallest rotation."""
        self.update()
        pb = self.rig.pose.bones[bone]
        mw3 = self.rig.matrix_world.to_3x3().normalized()
        m = pb.matrix.copy()
        cur = (mw3 @ m.to_3x3().normalized() @ Vector((0, 1, 0))).normalized()
        q = cur.rotation_difference(Vector(direction).normalized())
        r = mw3.inverted() @ q.to_matrix() @ mw3
        n = (r @ m.to_3x3()).to_4x4()
        n.translation = m.translation
        pb.matrix = n

    def aim_chain(self, bones, direction):
        for b in bones:
            self.aim(b, direction)

    def keep_world_rotation(self, bone, world_rot3):
        """Give a bone a fixed world orientation (e.g. keep the eyes level)."""
        self.update()
        pb = self.rig.pose.bones[bone]
        mw3 = self.rig.matrix_world.to_3x3().normalized()
        m = pb.matrix.copy()
        n = (mw3.inverted() @ world_rot3).to_4x4()
        n.translation = m.translation
        pb.matrix = n

    def world_rot(self, bone):
        self.update()
        return self.rig.matrix_world.to_3x3().normalized() @ self.rig.pose.bones[bone].matrix.to_3x3().normalized()

    def p(self, bone, tail=False):
        """World position of a bone's head (or tail)."""
        self.update()
        pb = self.rig.pose.bones[bone]
        return self.rig.matrix_world @ (pb.tail if tail else pb.head)

    def points(self):
        self.update()
        dg = bpy.context.evaluated_depsgraph_get()
        ev = self.mesh.evaluated_get(dg)
        me = ev.to_mesh()
        pts = [ev.matrix_world @ v.co for v in me.vertices]
        ev.to_mesh_clear()
        return pts

    def ground(self):
        """Drop the figure so its lowest point touches the floor (z = 0)."""
        mz = min(pt.z for pt in self.points())
        self.rig.location.z -= mz
        self.update()

    def bounds(self, above=None):
        pts = self.points()
        if above is not None:
            pts = [p for p in pts if p.z >= above]
        lo = Vector((min(p.x for p in pts), min(p.y for p in pts), min(p.z for p in pts)))
        hi = Vector((max(p.x for p in pts), max(p.y for p in pts), max(p.z for p in pts)))
        return lo, hi


def top_profile(fig, y, half=0.04, up=Vector((0, 0, 1))):
    """Highest visible point (along `up`) of the mesh in a slice around world y, near the midline."""
    zs = [p.dot(up) for p in fig.points() if abs(p.y - y) < half and abs(p.x) < 0.2]
    return max(zs) if zs else float('nan')


def angle(a, b, c):
    """Angle ABC in degrees."""
    return math.degrees((a - b).angle(c - b))


SPINE = ['spine05', 'spine04', 'spine03', 'spine02', 'spine01']
NECK = ['neck01', 'neck02', 'neck03']
ARM = ['upperarm01', 'upperarm02', 'lowerarm01', 'lowerarm02']
LEG = ['upperleg01', 'upperleg02', 'lowerleg01', 'lowerleg02']
TOES = [f'toe{t}-{k}' for t in range(1, 6) for k in (1, 2, 3)]


def side_bones(fig, names, s):
    return [f'{n}.{s}' for n in names if f'{n}.{s}' in fig.rig.pose.bones]


# --- views and rendering ------------------------------------------------------

ASPECT = 4 / 3  # the lesson picture frame (aspect-[4/3])
VIEWS = {
    # camera direction (from the subject towards the camera), up vector
    'side': (Vector((1, 0, 0)), UP),      # figure's left side; head to the left when lying
    'front': (Vector((0, -1, 0)), UP),
    'top': (Vector((0, 0, 1)), Vector((0, -1, 0))),
}


def setup_camera(fig, view, frame='full', margin=1.15, res=(800, 600)):
    """Orthographic camera fitting the figure: `full` (with the floor) or `upper` (head and shoulders)."""
    sc = bpy.context.scene
    cam = sc.objects.get('cam')
    if not cam:
        cam = bpy.data.objects.new('cam', bpy.data.cameras.new('cam'))
        sc.collection.objects.link(cam)
    sc.camera = cam
    cam.data.type = 'ORTHO'
    sc.render.resolution_x, sc.render.resolution_y = res
    upper = frame == 'upper'
    lo, hi = fig.bounds(above=fig.p('spine01').z - 0.05 if upper else None)
    if not upper:
        lo.z = 0.0  # always frame the floor
    centre = (lo + hi) / 2
    d, up = VIEWS[view]
    right = up.cross(d).normalized()
    true_up = d.cross(right).normalized()
    size = hi - lo
    w = abs(size.dot(right)) or 0.1
    h = abs(size.dot(true_up)) or 0.1
    cam.data.ortho_scale = max(w, h * ASPECT) * margin
    if view != 'top' and not upper:  # floor near the frame's bottom edge, figure above it
        frame_h = cam.data.ortho_scale / ASPECT
        centre = centre - true_up * centre.dot(true_up) + true_up * (frame_h / 2 - frame_h * 0.08)
    cam.location = centre + d * 10
    cam.rotation_euler = Matrix((right, true_up, d)).transposed().to_euler()
    cam.data.clip_end = 30
    return cam




def _freestyle_setup():
    sc = bpy.context.scene
    sc.render.engine = 'CYCLES'  # Freestyle needs Cycles or EEVEE; the raster is discarded
    sc.cycles.samples = 1
    sc.cycles.device = 'CPU'
    sc.render.use_freestyle = True
    sc.render.line_thickness_mode = 'ABSOLUTE'
    sc.render.line_thickness = 2.0
    sc.render.film_transparent = True
    vl = bpy.context.view_layer
    vl.use_freestyle = True
    fs = vl.freestyle_settings
    ls = fs.linesets[0] if fs.linesets else fs.linesets.new('lines')
    ls.select_by_visibility = True
    ls.visibility = 'VISIBLE'
    ls.select_by_edge_types = True
    ls.select_silhouette = True
    ls.select_border = True
    ls.select_crease = False  # outlines only
    ls.select_contour = True
    ls.select_external_contour = True
    ls.linestyle.color = (0, 0, 0)
    ls.linestyle.thickness = 2.0
    ls.linestyle.chaining = 'PLAIN'
    ls.linestyle.use_chain_count = False
    sc.svg_export.use_svg_export = True
    sc.svg_export.mode = 'FRAME'
    sc.svg_export.line_join_type = 'ROUND'
    sc.svg_export.split_at_invisible = True
    sc.svg_export.object_fill = False


def export_line_svg(fig, path, view, ghost=None):
    """Freestyle lines of the figure from the scene camera → SVG in currentColor, plus a floor line.

    `ghost`: path data (from line_paths) of a start position, drawn faint and dashed behind.
    """
    from bpy_extras.object_utils import world_to_camera_view

    sc = bpy.context.scene
    w, h = sc.render.resolution_x, sc.render.resolution_y
    d = line_paths(path)
    svg = (f'<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 {w} {h}" fill="none" '
           f'stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">\n')
    if ghost:
        svg += f'<path d="{ghost}" stroke-opacity=".3" stroke-dasharray="3 6"/>\n'
    svg += f'<path d="{d}"/>\n</svg>\n'
    if view != 'top':
        fy = (1 - world_to_camera_view(sc, sc.camera, Vector((0, 0, 0))).y) * h
        if 0 < fy < h:
            svg = svg.replace('</svg>', f'<path d="M0 {fy:.1f}H{w}" stroke-opacity=".35"/>\n</svg>')
    open(path, 'w', encoding='utf-8').write(svg)


def line_paths(path):
    """Render Freestyle lines from the scene camera; return compact SVG path data."""
    import glob
    import os
    import re

    _freestyle_setup()
    sc = bpy.context.scene
    stem = str(path.with_suffix(''))
    sc.render.filepath = stem + '_fs'
    bpy.ops.render.render(write_still=False)
    made = sorted(glob.glob(stem + '_fs*.svg'))
    if not made:
        raise RuntimeError('Freestyle wrote no SVG for ' + stem)
    svg = open(made[-1], encoding='utf-8').read()
    for f in made:
        os.remove(f)
    # Keep only the path data, rounded to 0.5 px: a few KB instead of ~100.
    paths = []
    for d in re.findall(r' d="([^"]*)"', svg):
        nums = re.sub(r'-?\d+\.\d+', lambda m: f'{round(float(m.group()) * 2) / 2:g}', d)
        nums = re.sub(r'\s*,\s*', ',', re.sub(r'\s+', ' ', nums)).strip()
        pts = nums.split(' ')  # drop points that rounding made identical
        nums = ' '.join(p for i, p in enumerate(pts) if i == 0 or p != pts[i - 1])
        nums = re.sub(r' ?([ML]) ', r'\1', nums)
        paths.append(nums)
    return ''.join(paths)
