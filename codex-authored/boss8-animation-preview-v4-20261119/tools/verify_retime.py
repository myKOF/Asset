"""Compare v4 deformed poses against v3 at corresponding animation times.

blender -b --python-exit-code 1 -P verify_retime.py -- V4.blend V3.blend REPORT.json
"""
import bpy
import json
import math
import sys
from pathlib import Path
from bpy_extras.object_utils import world_to_camera_view

source, previous, output = map(Path, sys.argv[sys.argv.index('--') + 1:])
speeds = {'Walk': 1, 'Attack1': 1.5, 'Attack2': 1.25, 'Attack3': 1, 'Die': 1}
old_ends = {'Walk': 48, 'Attack1': 78, 'Attack2': 78, 'Attack3': 72, 'Die': 113}


def load(file):
    bpy.ops.wm.open_mainfile(filepath=str(file))
    scene = bpy.context.scene
    arm = next(o for o in scene.objects if o.type == 'ARMATURE')
    mesh = next(o for o in scene.objects if o.type == 'MESH' and o.vertex_groups)
    return scene, arm, mesh


def pose(name, frame):
    arm.animation_data.action = bpy.data.actions[name]
    arm.animation_data.action_slot = arm.animation_data.action.slots[0]
    integer = math.floor(frame)
    scene.frame_set(integer, subframe=frame-integer)
    bpy.context.view_layer.update()
    matrices = [v for bone in arm.pose.bones for row in bone.matrix for v in row]
    assert all(math.isfinite(v) for v in matrices)
    evaluated = mesh.evaluated_get(bpy.context.evaluated_depsgraph_get())
    data = evaluated.to_mesh()
    points = [evaluated.matrix_world @ v.co for v in data.vertices]
    evaluated.to_mesh_clear()
    return matrices, points


scene, arm, mesh = load(source)
assert scene.render.fps / scene.render.fps_base == 150
assert set(bpy.data.actions.keys()) == set(speeds)
snapshots, report = {}, {}
for name, speed in speeds.items():
    end = old_ends[name]
    assert abs(bpy.data.actions[name].frame_range[1] / 150 - end / 30 / speed) < .00001
    frames = sorted(set([float(f) for f in range(end + 1)] + [end * u for u in [.125, .375, .625, .875]]))
    snapshots[name] = {}
    for frame in frames:
        matrices, points = pose(name, frame * 5 / speed)
        snapshots[name][frame] = matrices
        assert min(p.z for p in points) > .01, (name, frame, 'ground penetration')
        for point in points[::32]:
            uv = world_to_camera_view(scene, scene.camera, point)
            assert .015 < uv.x < .985 and .015 < uv.y < .985
    report[name] = {'speed': speed, 'seconds': end / 30 / speed, 'boneSamples': len(frames), 'maxBoneMatrixError': 0}
    snapshots[name]['surfaces'] = {frame: pose(name, end * frame * 5 / speed)[1] for frame in [0, .2, .5, .8, 1]}

scene, arm, mesh = load(previous)
for name, samples in snapshots.items():
    for frame, matrices in samples.items():
        if frame == 'surfaces':
            continue
        original, _ = pose(name, frame)
        error = max(abs(a-b) for a, b in zip(matrices, original))
        assert error < .0001, (name, frame, 'retiming altered a pose', error)
        report[name]['maxBoneMatrixError'] = max(report[name]['maxBoneMatrixError'], error)
    surface_error = max(max((p-q).length for p, q in zip(points, pose(name, old_ends[name] * u)[1]))
                        for u, points in samples['surfaces'].items())
    assert surface_error < .0001, (name, 'retiming altered the deformed mesh', surface_error)
    report[name]['maxSurfaceError'] = surface_error
output.write_text(json.dumps(report, indent=2) + '\n', encoding='utf-8')
print('BOSS8_RETIME_QA_PASS', json.dumps(report), flush=True)
