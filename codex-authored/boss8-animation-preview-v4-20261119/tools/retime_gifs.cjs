'use strict';
// Change only GIF delay fields; preserve the actual Blender-rendered pixels.
const fs = require('node:fs');
const path = require('node:path');
const assert = require('node:assert/strict');
const [source, target] = process.argv.slice(2);
if (!source || !target) throw Error('Usage: node retime_gifs.cjs V3_PREVIEWS OUTPUT_DIR');
fs.mkdirSync(target, { recursive: true });
const report = {};
for (const [name, speed] of Object.entries({ Attack1: 1.5, Attack2: 1.25 })) {
  const original = fs.readFileSync(path.join(source, name + '.gif'));
  const result = Buffer.from(original), delays = [];
  assert.match(original.toString('ascii', 0, 6), /^GIF8[79]a$/);
  let p = 13, images = 0;
  if (original[10] & 128) p += 3 * (2 ** ((original[10] & 7) + 1));
  const skipBlocks = () => {
    while (true) {
      assert.ok(p < original.length, 'truncated GIF block');
      const size = original[p++];
      if (!size) break;
      p += size;
      assert.ok(p <= original.length);
    }
  };
  while (original[p] !== 0x3b) {
    assert.ok(p < original.length);
    if (original[p] === 0x21) {
      if (original[p + 1] === 0xf9) {
        assert.equal(original[p + 2], 4);
        delays.push(p + 4);
      }
      p += 2;
      skipBlocks();
    } else if (original[p] === 0x2c) {
      const packed = original[p + 9];
      p += 10;
      if (packed & 128) p += 3 * (2 ** ((packed & 7) + 1));
      p++; // LZW minimum code size.
      skipBlocks();
      images++;
    } else throw Error('Invalid GIF block at ' + p);
  }
  assert.equal(delays.length, images);
  let elapsed = 0, encoded = 0;
  for (const offset of delays) {
    elapsed += original.readUInt16LE(offset);
    const next = Math.round(elapsed / speed), duration = next - encoded;
    assert.ok(duration >= 2, 'frame timing must remain supported by GIF viewers');
    result.writeUInt16LE(duration, offset);
    encoded = next;
  }
  const restored = Buffer.from(result);
  for (const offset of delays) original.copy(restored, offset, offset, offset + 2);
  assert.ok(restored.equals(original), 'retiming must preserve all image data');
  fs.writeFileSync(path.join(target, name + '.gif'), result);
  report[name] = { speed, frames: images, beforeMs: elapsed * 10, afterMs: encoded * 10, pixelsUnchanged: true };
}
fs.writeFileSync(path.join(target, 'gif-retime-qa.json'), JSON.stringify(report, null, 2) + '\n');
console.log('BOSS8_GIF_RETIMED', JSON.stringify(report));
