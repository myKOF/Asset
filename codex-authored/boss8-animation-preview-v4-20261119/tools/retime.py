"""Retime the existing v3 Blender source and GLB without resampling poses.

blender -b --python-exit-code 1 -P retime.py -- V3.blend V3.glb OUTPUT_DIR
"""
import bpy
import copy
import hashlib
import json
import struct
import sys
from pathlib import Path

blend, glb, output = map(Path, sys.argv[sys.argv.index('--') + 1:])
output.mkdir(parents=True, exist_ok=True)
speeds = {'Attack1': 1.5, 'Attack2': 1.25}
bpy.ops.wm.open_mainfile(filepath=str(blend))
scene = bpy.context.scene
old_fps = scene.render.fps / scene.render.fps_base
assert old_fps == 30
# 150 FPS makes both exact end times integral (260 and 312 frames).
scene.render.fps, scene.render.fps_base = 150, 1
report = {'sourceBlendSha256': hashlib.sha256(blend.read_bytes()).hexdigest(),
          'sourceGlbSha256': hashlib.sha256(glb.read_bytes()).hexdigest(), 'clips': {}}
for action in bpy.data.actions:
    original_end = float(action.frame_range[1])
    speed = speeds.get(action.name, 1)
    scale = 5 / speed
    for layer in action.layers:
        for strip in layer.strips:
            for bag in strip.channelbags:
                for curve in bag.fcurves:
                    for key in curve.keyframe_points:
                        key.co.x *= scale
                        key.handle_left.x *= scale
                        key.handle_right.x *= scale
                    curve.update()
    assert abs(action.frame_range[1] - original_end * scale) < .0001
    report['clips'][action.name] = {'speed': speed, 'beforeSeconds': original_end / old_fps,
                                  'afterSeconds': float(action.frame_range[1]) / 150}
scene.frame_end = 565
scene.frame_set(0)
bpy.ops.wm.save_as_mainfile(filepath=str(output / 'boss8_preview.blend'), compress=True)

# Preserve every exported pose sample, mesh, material and unaffected animation.
# Append private timestamp accessors so shared v3 inputs cannot change another clip.
raw = glb.read_bytes()
json_end = 20 + struct.unpack_from('<I', raw, 12)[0]
doc = json.loads(raw[20:json_end])
binary = bytearray(raw[json_end + 8:])
assert len(doc['buffers']) == 1
for clip in doc['animations']:
    if clip['name'] not in speeds:
        continue
    speed = speeds[clip['name']]
    inputs = {}
    for sampler in clip['samplers']:
        old_index = sampler['input']
        if old_index not in inputs:
            accessor = doc['accessors'][old_index]
            view = doc['bufferViews'][accessor['bufferView']]
            assert accessor['componentType'] == 5126 and accessor['type'] == 'SCALAR'
            assert 'sparse' not in accessor
            start = view.get('byteOffset', 0) + accessor.get('byteOffset', 0)
            times = [struct.unpack_from('<f', binary, start + i * view.get('byteStride', 4))[0] / speed
                     for i in range(accessor['count'])]
            while len(binary) % 4:
                binary.append(0)
            offset = len(binary)
            binary.extend(struct.pack('<' + 'f' * len(times), *times))
            view_index = len(doc['bufferViews'])
            doc['bufferViews'].append({'buffer': 0, 'byteOffset': offset, 'byteLength': 4 * len(times)})
            updated = copy.deepcopy(accessor)
            updated.update(bufferView=view_index, byteOffset=0, min=[min(times)], max=[max(times)])
            inputs[old_index] = len(doc['accessors'])
            doc['accessors'].append(updated)
        sampler['input'] = inputs[old_index]
doc['buffers'][0]['byteLength'] = len(binary)
encoded = json.dumps(doc, separators=(',', ':')).encode('utf-8')
encoded += b' ' * (-len(encoded) % 4)
binary.extend(b'\0' * (-len(binary) % 4))
result = (struct.pack('<III', 0x46546c67, 2, 28 + len(encoded) + len(binary))
          + struct.pack('<II', len(encoded), 0x4e4f534a) + encoded
          + struct.pack('<II', len(binary), 0x004e4942) + binary)
(output / 'boss8_preview.glb').write_bytes(result)
(output / 'retime-qa.json').write_text(json.dumps(report, indent=2) + '\n', encoding='utf-8')
print('BOSS8_RETIMED', json.dumps(report), flush=True)
