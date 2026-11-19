"""Numerical QA for the actual skinned review source, independent of authoring.

blender -b --python-exit-code 1 -P verify.py -- SOURCE.blend REPORT.json
"""
import bpy
import json
import math
import sys
from pathlib import Path
from bpy_extras.object_utils import world_to_camera_view

source, output = map(Path, sys.argv[sys.argv.index('--') + 1:])
bpy.ops.wm.open_mainfile(filepath=str(source))
scene = bpy.context.scene
arm = next(o for o in scene.objects if o.type == 'ARMATURE')
body = next(o for o in scene.objects if o.type == 'MESH' and o.vertex_groups)
expected = {'Walk': 48, 'Attack1': 48, 'Attack2': 60, 'Attack3': 72, 'Die': 96}
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

end = surface('Die', 96)
settled = surface('Die', 93)
report['deathFinalMotion'] = max((p-q).length for p, q in zip(end, settled))
assert report['deathFinalMotion'] < .0001, 'the final death pose must hold still'
assert .015 < min(p.z for p in end) < .04, ('death must contact the floor', min(p.z for p in end), report)
output.write_text(json.dumps(report, indent=2) + '\n', encoding='utf-8')
print('BOSS8_NUMERICAL_QA_PASS', json.dumps(report), flush=True)
