"""Author five flying-imp motions on the supplied rig in Blender.

blender -b --python-exit-code 1 -P animate.py -- SOURCE.glb OUTPUT_DIR
"""
import bpy
import hashlib
import json
import math
import sys
from pathlib import Path
from mathutils import Matrix, Quaternion, Vector

source, output = map(Path, sys.argv[sys.argv.index('--') + 1:])
output.mkdir(parents=True, exist_ok=True)
bpy.ops.wm.read_factory_settings(use_empty=True)
bpy.ops.import_scene.gltf(filepath=str(source))
scene = bpy.context.scene
scene.render.fps = 30
scene.render.fps_base = 1
arm = next(o for o in scene.objects if o.type == 'ARMATURE')
body = next(o for o in scene.objects if o.type == 'MESH' and o.vertex_groups)
arm.name = 'BOSS8_FlyingImp_Rig'
body.name = 'BOSS8_FlyingImp_Body'
for action in list(bpy.data.actions):
    bpy.data.actions.remove(action)
ad = arm.animation_data_create()
for track in list(ad.nla_tracks):
    ad.nla_tracks.remove(track)
rest = {b.name: b.matrix_local.copy() for b in arm.data.bones}
R = math.radians
ROOT = 'Bone_000'
CHEST = 'Bone_002'
WINGS = [(-1, ['Bone_041', 'Bone_040', 'Bone_039', 'Bone_038']),
         (1, ['Bone_045', 'Bone_044', 'Bone_043', 'Bone_042'])]
TAIL = ['Bone_' + str(i).zfill(3) for i in range(22, 14, -1)]
ARMS = {'left': ('Bone_031', 'Bone_030', 'Bone_029'),
        'right': ('Bone_036', 'Bone_035', 'Bone_034')}


def smooth(a, b, t):
    x = max(0, min(1, (t - a) / (b - a)))
    return x * x * (3 - 2 * x)


def pulse(a, peak, end, t):
    return smooth(a, peak, t) * (1 - smooth(peak, end, t))


def mix(a, b, t):
    return Vector(a).lerp(Vector(b), t)


def curve(keys, t):
    for (a, va), (b, vb) in zip(keys, keys[1:]):
        if t <= b:
            return mix(va, vb, smooth(a, b, t))
    return Vector(keys[-1][1])


def rotate(name, xyz):
    # Express character-space axes in each imported bone's rest coordinates.
    inv = rest[name].to_quaternion().inverted()
    q = Quaternion()
    for axis, angle in zip([Vector((1, 0, 0)), Vector((0, 1, 0)), Vector((0, 0, 1))], xyz):
        q = Quaternion(inv @ axis, R(angle)) @ q
    arm.pose.bones[name].rotation_quaternion = q


def offset(value):
    arm.pose.bones[ROOT].location = rest[ROOT].to_3x3().inverted() @ Vector(value)


def swing(name, direction):
    pb = arm.pose.bones[name]
    m = pb.matrix.copy()
    old = m.to_3x3() @ Vector((0, 1, 0))
    q = old.normalized().rotation_difference(direction.normalized())
    pb.matrix = Matrix.Translation(m.translation) @ (q.to_matrix() @ m.to_3x3()).to_4x4()
    bpy.context.view_layer.update()


def wrist(side, target, body_matrix, palm_pitch=0):
    upper, lower, hand = ARMS[side]
    shoulder = arm.pose.bones[upper].head.copy()
    target = body_matrix @ Vector(target)
    axis = (target - shoulder).normalized()
    l1, l2 = arm.data.bones[upper].length, arm.data.bones[lower].length
    distance = max(abs(l1 - l2) + .001, min((target - shoulder).length, (l1 + l2) * .99))
    forward = (l1*l1 + distance*distance - l2*l2) / (2*distance)
    height = math.sqrt(max(0, l1*l1 - forward*forward))
    pole = body_matrix.to_3x3() @ Vector((-1 if side == 'left' else 1, .25, -.2))
    pole = (pole - axis * pole.dot(axis)).normalized()
    elbow = shoulder + axis * forward + pole * height
    swing(upper, elbow - shoulder)
    swing(lower, shoulder + axis * distance - arm.pose.bones[lower].head)
    pb = arm.pose.bones[hand]
    rotation = body_matrix.to_quaternion() @ Quaternion(Vector((1, 0, 0)), R(palm_pitch)) @ rest[hand].to_quaternion()
    pb.matrix = Matrix.Translation(pb.head) @ rotation.to_matrix().to_4x4()
    bpy.context.view_layer.update()


def pose(clip, u):
    for pb in arm.pose.bones:
        pb.rotation_mode = 'QUATERNION'
        pb.matrix_basis.identity()
    cycles = 2 if clip in ('Walk', 'Attack1') else 3
    phase = math.tau * cycles * u
    heave = .34 + .035 * math.sin(phase - .5)
    pitch, roll, yaw, surge = 0, 0, 0, 0
    flap = -22 + 40 * math.cos(phase)
    sweep, fold, impact = 0, 0, 0
    left, right = Vector((-.30, -.39, .71)), Vector((.34, -.44, .75))
    palm = -10
    if clip == 'Attack1':
        anticipation = pulse(.04, .25, .45, u)
        impact = pulse(.30, .47, .68, u)
        yaw = -22 * anticipation + 27 * impact
        pitch = -7 * anticipation + 12 * impact
        right = curve([(0, right), (.24, (.53, -.11, 1.03)), (.40, (.35, -.62, .94)),
                       (.52, (.04, -.59, .76)), (.70, (.10, -.43, .66)), (1, right)], u)
        left += Vector((-.03, .08, -.03)) * anticipation
        palm = -10 - 32 * impact
    elif clip == 'Attack2':
        windup = pulse(.02, .30, .52, u)
        impact = pulse(.36, .52, .72, u)
        heave += .13 * windup - .09 * impact
        pitch = -12 * windup + 23 * impact
        left = curve([(0, left), (.30, (-.30, -.34, 1.18)), (.46, (-.23, -.61, .96)),
                      (.57, (-.21, -.61, .63)), (.76, (-.27, -.39, .61)), (1, left)], u)
        right = curve([(0, right), (.30, (.30, -.34, 1.20)), (.46, (.23, -.63, .96)),
                       (.57, (.21, -.63, .63)), (.76, (.30, -.41, .62)), (1, right)], u)
        flap -= 24 * impact
        palm = -10 - 35 * impact
    elif clip == 'Attack3':
        windup = pulse(.03, .25, .43, u)
        dive = pulse(.25, .48, .77, u)
        hit = pulse(.38, .53, .68, u)
        impact = hit
        heave += .22 * windup - .15 * dive
        pitch = -17 * windup + 57 * dive
        surge = -.22 * dive
        sweep = 46 * dive
        fold = 12 * dive
        left = mix(left, (-.20, -.62, .85), dive)
        right = mix(right, (.22, -.64, .87), dive)
        flap = flap * (1 - dive) - 30 * dive
        palm = -10 - 22 * dive
    elif clip == 'Die':
        recoil = pulse(0, .13, .35, u)
        fall = smooth(.18, .65, u)
        settle = smooth(.65, .94, u)
        heave = .34 * (1 - fall) + .04 * math.sin(u*40) * (1 - smooth(.60, .85, u))
        pitch = -20 * recoil + 88 * fall - 6 * settle
        roll = 11 * recoil + 24 * fall - 4 * settle
        yaw = -12 * fall
        flap = flap * (1 - smooth(.12, .55, u)) - 32 * fall
        sweep = 35 * fall
        fold = 15 * fall
        left = mix(left, (-.21, -.29, .82), recoil)
        right = mix(right, (.23, -.33, .82), recoil)
        left = mix(left, (-.42, -.22, .64), fall)
        right = mix(right, (.43, -.24, .61), fall)
        palm = 15 * fall
    alive = 1 - smooth(.40, .82, u) if clip == 'Die' else 1
    offset((0, surge, heave))
    rotate(ROOT, (pitch, roll, yaw + (1.5 * math.sin(phase) if clip != 'Die' else 0)))
    rotate('Bone_004', (2.5 * math.sin(phase) * alive, 0, -yaw * .12))
    rotate('Bone_003', (-1.5 * math.sin(phase) * alive, 0, -yaw * .08))
    rotate('Bone_027', (-7 - pitch * .15, 0, -yaw * .30))
    for name in ['Bone_009', 'Bone_014']:
        rotate(name, (22 + 4 * math.sin(phase + (0 if name.endswith('9') else .3)) * alive, 0, 0))
    for name in ['Bone_008', 'Bone_013']:
        rotate(name, (-19 + 3 * math.sin(phase - .6) * alive, 0, 0))
    for name in ['Bone_007', 'Bone_012']:
        rotate(name, (-8, 0, 0))
    for side, names in WINGS:
        rotate(names[0], (3 * math.sin(phase) * alive, -side * flap, side * sweep))
        rotate(names[1], (0, -side * (10 * math.sin(phase - .6) * alive + fold), side * sweep * .10))
        rotate(names[2], (0, -side * 7 * math.sin(phase - 1) * alive, side * sweep * .10))
        rotate(names[3], (0, -side * 4 * math.sin(phase - 1.4) * alive, 0))
    for i, name in enumerate(TAIL):
        damping = 1 - smooth(.45, .94, u) if clip == 'Die' else 1
        rotate(name, (3 * math.sin(phase - i*.55) * damping, 0,
                      (7 if i == 0 else 4) * math.sin(phase - i*.6) * damping))
    bpy.context.view_layer.update()
    if clip == 'Die':
        flatten = smooth(.32, .82, u)
        for side, names in WINGS:
            for name, direction in zip(names, [(side*.7, .75, -.17), (side*.4, .6, -.06),
                                               (-side*.15, .8, -.04), (-side*.15, .8, 0)]):
                pb = arm.pose.bones[name]
                current = (pb.tail - pb.head).normalized()
                swing(name, current.lerp(Vector(direction).normalized(), flatten))
    body_matrix = arm.pose.bones[CHEST].matrix @ rest[CHEST].inverted()
    wrist('left', left, body_matrix, palm)
    wrist('right', right, body_matrix, palm)
    if clip == 'Die':
        # Evaluate the actual deformed surface, then enforce a clean floor contact.
        evaluated = body.evaluated_get(bpy.context.evaluated_depsgraph_get())
        mesh = evaluated.to_mesh()
        low = min((evaluated.matrix_world @ v.co).z for v in mesh.vertices)
        evaluated.to_mesh_clear()
        correction = .025 - low
        if correction > 0 or u > .50:
            # Avoid penetration during the fall; finish lowering the resting body
            # onto the floor even if its natural pivot leaves a small air gap.
            correction *= 1 if correction > 0 else smooth(.50, .65, u)
            arm.pose.bones[ROOT].location += rest[ROOT].to_3x3().inverted() @ Vector((0, 0, correction))
            bpy.context.view_layer.update()


clips = {'Walk': 48, 'Attack1': 48, 'Attack2': 60, 'Attack3': 72, 'Die': 96}
for name, frames in clips.items():
    action = bpy.data.actions.new(name)
    action.use_fake_user = True
    ad.action = action
    previous = {}
    for frame in range(frames + 1):
        scene.frame_set(frame)
        pose(name, frame / frames)
        for pb in arm.pose.bones:
            # Avoid quaternion sign flips between dense samples.
            if pb.name in previous:
                pb.rotation_quaternion.make_compatible(previous[pb.name])
            previous[pb.name] = pb.rotation_quaternion.copy()
            pb.keyframe_insert('rotation_quaternion', frame=frame, group=pb.name)
            if pb.name == ROOT:
                pb.keyframe_insert('location', frame=frame, group=pb.name)
    if action.slots:
        ad.action_slot = action.slots[0]
    print('AUTHORED', name, frames / 30, flush=True)

ad.action = bpy.data.actions['Walk']
ad.action_slot = ad.action.slots[0]
scene.frame_set(0)
bpy.ops.object.select_all(action='DESELECT')
arm.select_set(True)
body.select_set(True)
bpy.context.view_layer.objects.active = arm
bpy.ops.export_scene.gltf(filepath=str(output / 'boss8_preview.glb'), export_format='GLB', use_selection=True,
    export_animations=True, export_animation_mode='ACTIONS', export_anim_single_armature=True,
    export_force_sampling=True, export_frame_step=1, export_reset_pose_bones=True, export_skins=True)

# The review stage is part of the editable source and uses the actual imported material.
scene.render.engine = 'BLENDER_EEVEE_NEXT'
scene.eevee.taa_render_samples = 16
scene.render.resolution_x = scene.render.resolution_y = 640
scene.render.resolution_percentage = 100
scene.render.image_settings.file_format = 'PNG'
scene.render.film_transparent = False
scene.view_settings.view_transform = 'AgX'
world = bpy.data.worlds.new('Review studio')
world.use_nodes = True
world.node_tree.nodes['Background'].inputs[0].default_value = (.055, .075, .11, 1)
world.node_tree.nodes['Background'].inputs[1].default_value = .5
scene.world = world
for name, location, energy, color in [('Key', (-3, -4, 5), 800, (1, .85, .73)),
                                      ('Fill', (4, -1, 3), 500, (.65, .8, 1)),
                                      ('Rim', (1, 3, 4), 1000, (.85, .9, 1))]:
    light = bpy.data.lights.new(name, 'AREA')
    light.energy, light.shape, light.size, light.color = energy, 'DISK', 4, color
    obj = bpy.data.objects.new(name, light)
    scene.collection.objects.link(obj)
    obj.location = location
    obj.rotation_euler = (Vector((0, 0, 1)) - obj.location).to_track_quat('-Z', 'Y').to_euler()
bpy.ops.mesh.primitive_plane_add(size=200, location=(0, 0, -.005))
floor = bpy.context.object
floor.name = 'Preview_ground_only'
mat = bpy.data.materials.new('Review floor')
mat.diffuse_color = (.045, .06, .085, 1)
mat.use_nodes = True
mat.node_tree.nodes['Principled BSDF'].inputs['Base Color'].default_value = (.045, .06, .085, 1)
mat.node_tree.nodes['Principled BSDF'].inputs['Roughness'].default_value = .85
floor.data.materials.append(mat)
camera_data = bpy.data.cameras.new('Preview_camera')
camera_data.type = 'ORTHO'
camera_data.ortho_scale = 3.15
camera = bpy.data.objects.new('Preview_camera', camera_data)
scene.collection.objects.link(camera)
camera.location = (2.6, -5, 2.5)
target = Vector((0, -.05, 1.08))
camera.rotation_euler = (target - camera.location).to_track_quat('-Z', 'Y').to_euler()
scene.camera = camera
bpy.ops.file.pack_all()
bpy.ops.wm.save_as_mainfile(filepath=str(output / 'boss8_preview.blend'), compress=True)
report = {'sourceSha256': hashlib.sha256(source.read_bytes()).hexdigest(), 'blender': bpy.app.version_string,
    'bones': len(arm.data.bones), 'vertices': len(body.data.vertices), 'fps': 30,
    'clips': {name: frames / 30 for name, frames in clips.items()}, 'approval': 'preview only; not integrated'}
(output / 'motion-qa.json').write_text(json.dumps(report, indent=2) + '\n', encoding='utf-8')
for name, u in [('Walk', 0), ('Walk', .25), ('Attack1', .45), ('Attack2', .30), ('Attack2', .48), ('Attack3', .5), ('Die', .98)]:
    ad.action = bpy.data.actions[name]
    ad.action_slot = ad.action.slots[0]
    scene.frame_set(round(clips[name] * u))
    scene.render.filepath = str(output / (name + '_' + str(int(u*100)) + '.png'))
    bpy.ops.render.render(write_still=True)
print('BOSS8_PREVIEW_AUTHORED', json.dumps(report), flush=True)
