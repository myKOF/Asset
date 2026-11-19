"""Numerical QA for the actual skinned review source, independent of authoring.

blender -b --python-exit-code 1 -P verify.py -- SOURCE.blend REPORT.json
"""
import bpy
import json
import math
import sys
from pathlib import Path
from bpy_extras.object_utils import world_to_camera_view
from mathutils import Vector

source, output = map(Path, sys.argv[sys.argv.index('--') + 1:])
bpy.ops.wm.open_mainfile(filepath=str(source))
scene = bpy.context.scene
arm = next(o for o in scene.objects if o.type == 'ARMATURE')
body = next(o for o in scene.objects if o.type == 'MESH' and o.vertex_groups)
expected = {'Walk': 48, 'Attack1': 78, 'Attack2': 78, 'Attack3': 72, 'Die': 144}
assert set(bpy.data.actions.keys()) == set(expected)
assert len(arm.data.bones) == 70


def surface(name, frame):
    arm.animation_data.action = bpy.data.actions[name]
    arm.animation_data.action_slot = arm.animation_data.action.slots[0]
    scene.frame_set(frame)
    bpy.context.view_layer.update()
    for pb in arm.pose.bones:
        assert all(math.isfinite(v) for row in pb.matrix for v in row), (name, frame, pb.name)
    evaluated = body.evaluated_get(bpy.context.evaluated_depsgraph_get())
    mesh = evaluated.to_mesh()
    points = [evaluated.matrix_world @ v.co for v in mesh.vertices]
    evaluated.to_mesh_clear()
    assert all(math.isfinite(v) for p in points for v in p), (name, frame)
    return points


base = surface('Walk', 0)
report = {'clips': {}, 'loopMaxError': 0, 'attackReturnError': {}, 'cameraRange': [1, 0, 1, 0]}
for name, last in expected.items():
    assert tuple(round(x) for x in bpy.data.actions[name].frame_range) == (0, last)
    lows, highs = [], []
    most_motion = 0
    for frame in range(0, last + 1, 3):
        points = surface(name, frame)
        low = [min(p[i] for p in points) for i in range(3)]
        high = [max(p[i] for p in points) for i in range(3)]
        lows.append(low)
        highs.append(high)
        assert max(high[i] - low[i] for i in range(3)) < 4, (name, frame, low, high)
        assert low[2] > .01, (name, frame, 'ground penetration', low[2])
        most_motion = max(most_motion, max((p - q).length for p, q in zip(points, base)))
        for p in points[::16]:
            uv = world_to_camera_view(scene, scene.camera, p)
            report['cameraRange'][0] = min(report['cameraRange'][0], uv.x)
            report['cameraRange'][1] = max(report['cameraRange'][1], uv.x)
            report['cameraRange'][2] = min(report['cameraRange'][2], uv.y)
            report['cameraRange'][3] = max(report['cameraRange'][3], uv.y)
            assert .015 < uv.x < .985 and .015 < uv.y < .985, (name, frame, 'camera crop', list(uv))
    report['clips'][name] = {'seconds': last / 30, 'lowestSurface': min(p[2] for p in lows),
                             'largestDisplacement': most_motion}
    assert most_motion > .25, (name, 'motion is frozen')
    if name != 'Die':
        first, final = surface(name, 0), surface(name, last)
        error = max((p-q).length for p, q in zip(first, final))
        assert error < .0001, (name, 'loop/return discontinuity', error)
        if name == 'Walk':
            report['loopMaxError'] = error
            assert min(p[2] for p in lows) > .15, 'flight feet must stay above the ground'
        else:
            start_error = max((p-q).length for p, q in zip(first, base))
            assert start_error < .0001, (name, 'does not start in flight pose', start_error)
            report['attackReturnError'][name] = error

end = surface('Die', 144)
settled = surface('Die', 141)
report['deathFinalMotion'] = max((p-q).length for p, q in zip(end, settled))
assert report['deathFinalMotion'] < .0001, 'the final death pose must hold still'
assert .015 < min(p.z for p in end) < .04, ('death must contact the floor', min(p.z for p in end), report)
rest_root = arm.data.bones['Bone_000'].matrix_local.inverted()
up = (arm.pose.bones['Bone_000'].matrix @ rest_root).to_3x3() @ Vector((0, 0, 1))
assert abs(up.z) < .2, ('death must rest on its side', list(up))
report['sideLyingUpAxis'] = list(up)

headings = []
for frame in [round(78 * .24), round(78 * .64)]:
    surface('Attack1', frame)
    headings.append((arm.pose.bones['Bone_000'].matrix @ rest_root).to_euler('XYZ').z)
turn = math.degrees(abs(headings[1] - headings[0]))
assert 170 < turn < 190, ('half-turn follow-through', turn)
report['attack1FollowThroughDegrees'] = turn

arm_span, flail_heights, left_reach, lift_heights, hammer_pitch = [], [], [], [], []
for name in ['Attack1', 'Attack2', 'Die']:
    for frame in range(0, expected[name] + 1, 3):
        surface(name, frame)
        body_space = (arm.pose.bones['Bone_002'].matrix @ arm.data.bones['Bone_002'].matrix_local.inverted()).inverted()
        left_hand = body_space @ arm.pose.bones['Bone_034'].head
        right_hand = body_space @ arm.pose.bones['Bone_029'].head
        if name == 'Die' and frame < 90:
            arm_span.append(left_hand.x - right_hand.x)
            flail_heights.append(left_hand.z)
        if name == 'Attack1':
            left_reach.append(left_hand.y)
        if name == 'Attack2':
            lift_heights.append(arm.pose.bones['Bone_000'].head.z)
            hammer_pitch.append((arm.pose.bones['Bone_000'].matrix @ rest_root).to_euler('XYZ').x)
assert max(left_reach) > -.05 and min(left_reach) < -.55, ('left claw must draw back and sweep forward', left_reach)
assert max(arm_span) > .90, ('death must open both arms wide', max(arm_span))
assert max(flail_heights) - min(flail_heights) > .25, 'death arms must flail before falling'
assert max(lift_heights) - min(lift_heights) > .35, 'hammer must move the entire body vertically'
assert math.degrees(max(hammer_pitch) - min(hammer_pitch)) > 70, 'hammer must arch and fold the torso'
report['deathMaxArmSpan'] = max(arm_span)
report['deathHandVerticalTravel'] = max(flail_heights) - min(flail_heights)
report['attack2WholeBodyLift'] = max(lift_heights) - min(lift_heights)
report['attack2PitchTravelDegrees'] = math.degrees(max(hammer_pitch) - min(hammer_pitch))
output.write_text(json.dumps(report, indent=2) + '\n', encoding='utf-8')
print('BOSS8_NUMERICAL_QA_PASS', json.dumps(report), flush=True)
