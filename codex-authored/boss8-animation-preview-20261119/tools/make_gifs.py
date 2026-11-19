"""Encode actual Blender frames at source speed. No synthetic in-between images."""
from pathlib import Path
from PIL import Image, ImageDraw, ImageFont
import json
import sys

source, output = map(Path, sys.argv[1:])
output.mkdir(parents=True, exist_ok=True)
font = ImageFont.truetype('C:/Windows/Fonts/msjh.ttc', 22)
small = ImageFont.truetype('C:/Windows/Fonts/msjh.ttc', 15)
names = {'Walk': '飛行移動', 'Attack1': '攻擊1：單爪橫掃', 'Attack2': '攻擊2：雙爪下劈',
         'Attack3': '攻擊3：俯衝撲擊', 'Die': '死亡：失速墜落'}
report = {}
for name, title in names.items():
    files = sorted((source / name).glob('*.png'))
    assert files, name
    frames = []
    durations = []
    for i, file in enumerate(files):
        image = Image.open(file).convert('RGB')
        canvas = Image.new('RGB', (image.width, image.height + 58), (20, 25, 35))
        canvas.paste(image, (0, 58))
        draw = ImageDraw.Draw(canvas)
        draw.text((16, 6), 'BOSS8 飛行小惡魔　' + title, font=font, fill=(245, 221, 180))
        draw.text((16, 34), '動作試作 · 暫代貼圖 · 原速播放', font=small, fill=(175, 192, 212))
        frames.append(canvas)
        # GIF units are 10 ms: alternate 70/60/70 to retain 15 FPS mean speed.
        durations.append(70 if i % 3 != 1 else 60)
    if name == 'Die':
        durations[-1] = 1000
    # One global palette keeps the dark floor and thin wing edges stable.
    atlas = Image.new('RGB', (frames[0].width * 3, frames[0].height))
    for i, index in enumerate([0, len(frames)//2, len(frames)-1]):
        atlas.paste(frames[index], (i*frames[0].width, 0))
    palette = atlas.quantize(colors=192)
    indexed = [frame.quantize(palette=palette, dither=Image.Dither.FLOYDSTEINBERG) for frame in frames]
    target = output / (name + '.gif')
    indexed[0].save(target, save_all=True, append_images=indexed[1:], duration=durations,
                    loop=0, disposal=2, optimize=False)
    report[name] = {'frames': len(frames), 'durationMs': sum(durations), 'bytes': target.stat().st_size}
    print('GIF', target, report[name], flush=True)
(output / 'gif-qa.json').write_text(json.dumps(report, indent=2) + '\n', encoding='utf-8')
