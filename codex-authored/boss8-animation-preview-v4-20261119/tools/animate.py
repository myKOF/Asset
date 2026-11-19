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
# Facing -Y: the character's anatomical left is +X.
ARMS = {'right': ('Bone_031', 'Bone_030', 'Bone_029'),
        'left': ('Bone_036', 'Bone_035', 'Bone_034')}
DEATH_OLD_FRAMES = 144
STRUGGLE_OLD_FRAMES = 62
STRUGGLE_NEW_FRAMES = 31
DEATH_FRAMES = DEATH_OLD_FRAMES - STRUGGLE_OLD_FRAMES + STRUGGLE_NEW_FRAMES


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


def scalar(keys, t):
    for (a, va), (b, vb) in zip(keys, keys[1:]):
        if t <= b:
            return va + (vb - va) * smooth(a, b, t)
    return keys[-1][1]


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
    pole = body_matrix.to_3x3() @ Vector((1 if side == 'left' else -1, .25, -.2))
    pole = (pole - axis * pole.dot(axis)).normalized()
    elbow = shoulder + axis * forward + pole * height
    swing(upper, elbow - shoulder)
    swing(lower, shoulder + axis * distance - arm.pose.bones[lower].head)
    pb = arm.pose.bones[hand]
    rotation = body_matrix.to_quaternion() @ Quaternion(Vector((1, 0, 0)), R(palm_pitch)) @ rest[hand].to_quaternion()
    pb.matrix = Matrix.Translation(pb.head) @ rotation.to_matrix().to_4x4()
    bpy.context.view_layer.update()


def pose(clip, u, original_death=False):
    death_frame = None
    shake = 1
    jitter_u = u
    if clip == 'Die' and not original_death:
        death_frame = u * DEATH_FRAMES
        if death_frame < STRUGGLE_NEW_FRAMES:
            u = death_frame * STRUGGLE_OLD_FRAMES / STRUGGLE_NEW_FRAMES / DEATH_OLD_FRAMES
            # Oscillation frequency is independent from the shortened envelope.
            # Align its phase at the splice to the previously accepted fall.
            jitter_u = (death_frame * 1.5 + STRUGGLE_OLD_FRAMES - STRUGGLE_NEW_FRAMES * 1.5) / DEATH_OLD_FRAMES
            shake = .5
        else:
            u = (death_frame + STRUGGLE_OLD_FRAMES - STRUGGLE_NEW_FRAMES) / DEATH_OLD_FRAMES
            jitter_u = u
    for pb in arm.pose.bones:
        pb.rotation_mode = 'QUATERNION'
        pb.matrix_basis.identity()
    cycles = 2 if clip == 'Walk' else 3
    phase = math.tau * cycles * u
    heave = .34 + .035 * math.sin(phase - .5)
    pitch, roll, yaw, surge, lateral = 0, 0, 0, 0, 0
    spine_bend, tuck, stretch, panic = 0, 0, 0, 0
    flap = -22 + 40 * math.cos(phase)
    sweep, fold, impact = 0, 0, 0
    left, right = Vector((-.30, -.39, .71)), Vector((.34, -.44, .75))
    palm = -10
    if clip == 'Attack1':
        anticipation = pulse(.01, .24, .44, u)
        impact = pulse(.28, .58, .88, u)
        # Turn side-on, then follow the anatomical left claw through a half-turn
        # toward the character's right. Recovery starts after the follow-through.
        yaw = scalar([(0, 0), (.24, 55), (.28, 55), (.58, -125), (.70, -125), (1, 0)], u)
        pitch = -18 * anticipation + 25 * impact
        roll = -17 * anticipation + 21 * impact
        lateral = .10 * anticipation - .12 * impact
        heave += .10 * anticipation - .05 * impact
        sweep = 22 * anticipation + 12 * impact
        tuck = 13 * anticipation
        spine_bend = -9 * anticipation + 12 * impact
        turn = smooth(.28, .60, u)
        # Shoulder-centred vertical arc: raise above the head, then chop down.
        # Keep the accepted half-turn, without a sideways sweeping arm path.
        theta = R(95 - 165 * turn)
        arc = Vector((.20 + .04 * math.sin(math.pi * turn),
                      -.28 - .38 * math.cos(theta), .92 + .38 * math.sin(theta)))
        if u < .28:
            right = mix(right, arc, smooth(.01, .24, u))
        elif u <= .68:
            right = arc
        else:
            right = mix(arc, right, smooth(.68, 1, u))
        left = mix(left, (-.48, -.15, .79), anticipation)
        palm = scalar([(0, -10), (.20, -135), (.30, -135), (.50, -5), (.64, 20), (.84, -10), (1, -10)], u)
        flap = flap * (1 - .7 * impact) - 38 * impact
    elif clip == 'Attack2':
        gather = pulse(.01, .14, .32, u)
        lift = pulse(.13, .34, .50, u)
        impact = pulse(.37, .58, .82, u)
        heave += -.10 * gather + .46 * lift + .12 * impact + .08 * pulse(.65, .82, 1, u)
        pitch = 24 * gather - 31 * lift + 54 * impact
        roll = 10 * lift - 12 * impact
        yaw = -11 * gather + 10 * impact
        surge = -.22 * impact
        tuck = 38 * gather + 25 * lift
        stretch = 20 * impact
        spine_bend = 12 * gather - 18 * lift + 19 * impact
        left = curve([(0, left), (.14, (-.26, -.38, .84)), (.34, (-.29, -.10, 1.24)),
                      (.43, (-.26, -.32, 1.20)), (.58, (-.23, -.62, .61)),
                      (.70, (-.26, -.47, .60)), (.86, (-.32, -.39, .70)), (1, left)], u)
        right = curve([(0, right), (.14, (.28, -.42, .88)), (.34, (.30, -.10, 1.25)),
                       (.43, (.27, -.34, 1.21)), (.58, (.24, -.64, .62)),
                       (.70, (.28, -.48, .61)), (.86, (.34, -.44, .74)), (1, right)], u)
        flap = flap * (1 - .8 * impact) + 24 * lift - 60 * impact
        sweep = 25 * gather + 18 * impact
        palm = -10 - 40 * impact
        aim = smooth(.34, .48, u) * (1 - smooth(.70, .90, u))
        raised = Quaternion(Vector((1, 0, 0)), R(-45 * aim))
        shoulder_right = rest[ARMS['right'][0]].translation
        shoulder_left = rest[ARMS['left'][0]].translation
        left = shoulder_right + raised @ (left - shoulder_right)
        right = shoulder_left + raised @ (right - shoulder_left)
        palm -= 45 * aim
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
        recoil = pulse(0, .10, .23, u)
        panic = smooth(.03, .12, u) * (1 - smooth(.48, .64, u))
        fall = smooth(.43, .75, u)
        settle = smooth(.75, .90, u)
        thrash = math.tau * 5.5 * jitter_u
        heave = (.34 + .12 * math.sin(thrash) * panic * shake + .10 * recoil) * (1 - fall)
        heave += .065 * pulse(.73, .79, .87, u)
        pitch = (-22 * recoil + 20 * math.sin(thrash + .3) * panic * shake) * (1 - fall) + 11 * fall - 3 * settle
        roll = 24 * math.sin(thrash - .5) * panic * shake * (1 - fall) + 98 * fall - 8 * settle
        yaw = 15 * math.sin(thrash + .5) * panic * shake - 18 * fall
        flap = flap * (1 - smooth(.43, .67, u)) - 37 * fall
        sweep = 48 * fall
        fold = 28 * fall
        flail_left = (-.55 - .04 * math.sin(thrash) * shake, -.24 + .15 * math.cos(thrash) * shake, .95 + .23 * math.sin(thrash) * shake)
        flail_right = (.56 + .04 * math.sin(thrash + 1) * shake, -.24 + .15 * math.cos(thrash + 1.2) * shake, 1.00 + .23 * math.sin(thrash + math.pi) * shake)
        left = mix(left, flail_left, smooth(.01, .10, u))
        right = mix(right, flail_right, smooth(.01, .10, u))
        left = mix(left, (-.27, -.32, .64), smooth(.56, .83, u))
        right = mix(right, (.25, -.30, .75), smooth(.56, .83, u))
        palm = -30 * panic + 15 * fall
        tuck = 14 * panic
        spine_bend = 13 * math.sin(thrash - .6) * panic * shake
    alive = 1 - smooth(.48, .83, u) if clip == 'Die' else 1
    offset((lateral, surge, heave))
    rotate(ROOT, (pitch, roll, yaw + (1.5 * math.sin(phase) if clip != 'Die' else 0)))
    counter = 0 if clip == 'Attack1' else 1
    rotate('Bone_004', (2.5 * math.sin(phase) * alive + spine_bend * .6, 0, -yaw * .12 * counter))
    rotate('Bone_003', (-1.5 * math.sin(phase) * alive + spine_bend * .4, 0, -yaw * .08 * counter))
    rotate('Bone_027', (-7 - pitch * .15, 0, -yaw * .30))
    for name in ['Bone_009', 'Bone_014']:
        rotate(name, (22 + tuck - stretch + 4 * math.sin(phase + (0 if name.endswith('9') else .3)) * alive, 0, 0))
    for name in ['Bone_008', 'Bone_013']:
        rotate(name, (-19 - tuck * .85 + stretch * .5 + 3 * math.sin(phase - .6) * alive, 0, 0))
    for name in ['Bone_007', 'Bone_012']:
        rotate(name, (-8, 0, 0))
    for side, names in WINGS:
        panic_flap = 26 * math.sin(math.tau * 6 * jitter_u + side * 1.4) * panic * shake
        rotate(names[0], (3 * math.sin(phase) * alive, -side * (flap + panic_flap), side * sweep))
        rotate(names[1], (0, -side * (10 * math.sin(phase - .6) * alive + fold), side * sweep * .10))
        rotate(names[2], (0, -side * 7 * math.sin(phase - 1) * alive, side * sweep * .10))
        rotate(names[3], (0, -side * 4 * math.sin(phase - 1.4) * alive, 0))
    for i, name in enumerate(TAIL):
        damping = 1 - smooth(.45, .94, u) if clip == 'Die' else 1
        extra = -yaw * .15 * impact if clip == 'Attack1' else 10 * impact if clip == 'Attack2' else 0
        rotate(name, (3 * math.sin(phase - i*.55) * damping, 0,
                      (7 if i == 0 else 4) * math.sin(phase - i*.6) * damping + extra / (i + 1)))
    bpy.context.view_layer.update()
    if clip == 'Die':
        flatten = smooth(.50, .85, u)
        for side, names in WINGS:
            for name, direction in zip(names, [(side*.15, .8, -.12), (side*.12, .7, -.04),
                                               (-side*.10, .75, -.02), (-side*.10, .7, 0)]):
                pb = arm.pose.bones[name]
                current = (pb.tail - pb.head).normalized()
                swing(name, current.lerp(Vector(direction).normalized(), flatten))
    body_matrix = arm.pose.bones[CHEST].matrix @ rest[CHEST].inverted()
    wrist('right', left, body_matrix, -10 if clip == 'Attack1' else palm)
    wrist('left', right, body_matrix, palm)
    if clip == 'Die':
        for side, names in [(-1, ['Bone_048', 'Bone_051', 'Bone_054', 'Bone_057']),
                            (1, ['Bone_060', 'Bone_063', 'Bone_066', 'Bone_069'])]:
            for i, name in enumerate(names):
                rotate(name, (-12 * panic, 0, side * (i - 1.5) * 8 * panic))
        bpy.context.view_layer.update()
    if clip == 'Die':
        # Evaluate the actual deformed surface, then enforce a clean floor contact.
        evaluated = body.evaluated_get(bpy.context.evaluated_depsgraph_get())
        mesh = evaluated.to_mesh()
        low = min((evaluated.matrix_world @ v.co).z for v in mesh.vertices)
        evaluated.to_mesh_clear()
        correction = .025 - low
        if correction > 0 or u > .60:
            # Avoid penetration during the fall; finish lowering the resting body
            # onto the floor even if its natural pivot leaves a small air gap.
            correction *= 1 if correction > 0 else smooth(.60, .76, u)
            arm.pose.bones[ROOT].location += rest[ROOT].to_3x3().inverted() @ Vector((0, 0, correction))
            bpy.context.view_layer.update()
    if clip == 'Die' and not original_death and STRUGGLE_NEW_FRAMES - 4 < death_frame < STRUGGLE_NEW_FRAMES:
        # A short transition joins the calmer struggle to the identical old fall.
        calm = {pb.name: (pb.location.copy(), pb.rotation_quaternion.copy(), pb.scale.copy()) for pb in arm.pose.bones}
        pose('Die', u, original_death=True)
        blend = smooth(STRUGGLE_NEW_FRAMES - 4, STRUGGLE_NEW_FRAMES, death_frame)
        for pb in arm.pose.bones:
            location, rotation, scale = calm[pb.name]
            pb.location = location.lerp(pb.location, blend)
            pb.rotation_quaternion = rotation.slerp(pb.rotation_quaternion, blend)
            pb.scale = scale.lerp(pb.scale, blend)
        bpy.context.view_layer.update()


clips = {'Walk': 48, 'Attack1': 78, 'Attack2': 78, 'Attack3': 72, 'Die': DEATH_FRAMES}
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
camera_data.ortho_scale = 3.6
camera = bpy.data.objects.new('Preview_camera', camera_data)
scene.collection.objects.link(camera)
camera.location = (2.6, -5, 2.5)
target = Vector((0, -.05, 1.20))
camera.rotation_euler = (target - camera.location).to_track_quat('-Z', 'Y').to_euler()
scene.camera = camera
bpy.ops.file.pack_all()
bpy.ops.wm.save_as_mainfile(filepath=str(output / 'boss8_preview.blend'), compress=True)
report = {'sourceSha256': hashlib.sha256(source.read_bytes()).hexdigest(), 'blender': bpy.app.version_string,
    'bones': len(arm.data.bones), 'vertices': len(body.data.vertices), 'fps': 30,
    'clips': {name: frames / 30 for name, frames in clips.items()},
    'deathRevision': {'jitterAmplitudeScale': .5, 'jitterSpeedScale': 1.5,
                      'struggleFramesBefore': STRUGGLE_OLD_FRAMES, 'struggleFramesAfter': STRUGGLE_NEW_FRAMES,
                      'unchangedFallSourceFrame': STRUGGLE_OLD_FRAMES, 'fallTimeShiftFrames': STRUGGLE_OLD_FRAMES - STRUGGLE_NEW_FRAMES},
    'approval': 'preview only; not integrated'}
(output / 'motion-qa.json').write_text(json.dumps(report, indent=2) + '\n', encoding='utf-8')
for name, u in [('Attack1', .24), ('Attack1', .44), ('Attack1', .64),
                ('Attack2', .14), ('Attack2', .34), ('Attack2', .58),
                ('Die', .12), ('Die', .24), ('Die', .60), ('Die', .98)]:
    ad.action = bpy.data.actions[name]
    ad.action_slot = ad.action.slots[0]
    scene.frame_set(round(clips[name] * u))
    scene.render.filepath = str(output / (name + '_' + str(int(u*100)) + '.png'))
    bpy.ops.render.render(write_still=True)
print('BOSS8_PREVIEW_AUTHORED', json.dumps(report), flush=True)
