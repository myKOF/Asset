"""Render the five authored actions at their original speed for GIF encoding.

blender -b --python-exit-code 1 -P preview.py -- SOURCE.blend FRAME_DIR
"""
import bpy
import sys
from pathlib import Path

args = sys.argv[sys.argv.index('--') + 1:]
source, output = map(Path, args[:2])
requested = args[2:] or ['Walk', 'Attack1', 'Attack2', 'Attack3', 'Die']
bpy.ops.wm.open_mainfile(filepath=str(source))
scene = bpy.context.scene
arm = next(o for o in scene.objects if o.type == 'ARMATURE')
ad = arm.animation_data
scene.render.resolution_x = scene.render.resolution_y = 576
scene.eevee.taa_render_samples = 12
for name in requested:
    action = bpy.data.actions[name]
    ad.action = action
    ad.action_slot = action.slots[0]
    directory = output / name
    directory.mkdir(parents=True, exist_ok=True)
    last = round(action.frame_range[1])
    # Every other 30 FPS source frame, encoded at 15 FPS without slowing motion.
    frames = list(range(0, last, 2))
    if name == 'Die':
        frames.append(last)
    for frame in frames:
        scene.frame_set(frame)
        scene.render.filepath = str(directory / (str(frame).zfill(3) + '.png'))
        bpy.ops.render.render(write_still=True)
    print('PREVIEW_RENDERED', name, flush=True)
