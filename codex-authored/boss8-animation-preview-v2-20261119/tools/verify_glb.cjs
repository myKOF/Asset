'use strict';
// Validate the exported artifact, including quaternion normalization and loop endpoints.
const fs = require('node:fs');
const assert = require('node:assert/strict');
const [file, reportFile, previousFile] = process.argv.slice(2);
if (!file) throw new Error('Usage: node verify_glb.cjs MODEL.glb [REPORT.json]');
const bytes = fs.readFileSync(file);
assert.equal(bytes.readUInt32LE(0), 0x46546c67);
assert.equal(bytes.readUInt32LE(4), 2);
assert.equal(bytes.readUInt32LE(8), bytes.length);
const end = 20 + bytes.readUInt32LE(12);
const g = JSON.parse(bytes.subarray(20, end));
const bin = bytes.subarray(end + 8);
assert.equal(g.meshes.length, 1);
assert.equal(g.skins[0].joints.length, 70);
assert.ok(g.materials[0].pbrMetallicRoughness.baseColorTexture);
assert.ok(g.images.every(i => Number.isInteger(i.bufferView)));
for (const v of g.bufferViews) assert.ok((v.byteOffset || 0) + v.byteLength <= bin.length);
const expected = { Walk: 1.6, Attack1: 2.6, Attack2: 2.6, Attack3: 2.4, Die: 4.8 };
assert.deepEqual(g.animations.map(a => a.name).sort(), Object.keys(expected).sort());
function values(index) {
  const a = g.accessors[index], v = g.bufferViews[a.bufferView];
  assert.equal(a.componentType, 5126);
  assert.ok(!a.sparse);
  const lanes = { SCALAR: 1, VEC3: 3, VEC4: 4 }[a.type];
  assert.ok(lanes);
  return Array.from({length: a.count}, (_, i) => Array.from({length: lanes}, (_, k) => {
    const x = bin.readFloatLE((v.byteOffset || 0) + (a.byteOffset || 0) + i * (v.byteStride || lanes * 4) + k * 4);
    assert.ok(Number.isFinite(x));
    return x;
  }));
}
const report = {};
for (const clip of g.animations) {
  let duration = 0, largestQuaternionError = 0;
  assert.ok(clip.channels.some(c => g.nodes[c.target.node].name === 'Bone_041'), 'left wing');
  assert.ok(clip.channels.some(c => g.nodes[c.target.node].name === 'Bone_045'), 'right wing');
  for (const channel of clip.channels) {
    const sampler = clip.samplers[channel.sampler];
    const times = values(sampler.input).flat(), track = values(sampler.output);
    duration = Math.max(duration, times.at(-1));
    assert.equal(times.length, track.length);
    assert.ok(times.every((t,i) => !i || t > times[i-1]));
    if (channel.target.path === 'rotation') {
      for (const q of track) largestQuaternionError = Math.max(largestQuaternionError, Math.abs(Math.hypot(...q) - 1));
    }
    if (clip.name !== 'Die') {
      const a = track[0], b = track.at(-1);
      const sign = channel.target.path === 'rotation' && a.reduce((s,x,i) => s+x*b[i],0) < 0 ? -1 : 1;
      assert.ok(a.every((x,i) => Math.abs(x - sign*b[i]) < .0001), clip.name + ': loop or return endpoint');
    }
  }
  assert.ok(Math.abs(duration - expected[clip.name]) < .0001);
  assert.ok(largestQuaternionError < .00001);
  report[clip.name] = {duration, channels:clip.channels.length, largestQuaternionError};
}
if (previousFile) {
  const prior = fs.readFileSync(previousFile), priorEnd = 20 + prior.readUInt32LE(12);
  const previous = JSON.parse(prior.subarray(20, priorEnd)), previousBin = prior.subarray(priorEnd + 8);
  for (const name of ['Walk', 'Attack3']) {
    const clip = g.animations.find(a => a.name === name), oldClip = previous.animations.find(a => a.name === name);
    const key = (doc, c) => doc.nodes[c.target.node].name + ':' + c.target.path;
    const oldChannels = new Map(oldClip.channels.map(c => [key(previous, c), c]));
    assert.equal(clip.channels.length, oldClip.channels.length);
    let largestDifference = 0;
    for (const c of clip.channels) {
      const old = oldChannels.get(key(g, c));
      assert.ok(old);
      for (const field of ['input', 'output']) {
        const now = values(clip.samplers[c.sampler][field]).flat();
        const a = previous.accessors[oldClip.samplers[old.sampler][field]], v = previous.bufferViews[a.bufferView];
        const lanes = {SCALAR:1,VEC3:3,VEC4:4}[a.type];
        const past = Array.from({length:a.count*lanes}, (_,i) => previousBin.readFloatLE((v.byteOffset||0)+(a.byteOffset||0)+Math.floor(i/lanes)*(v.byteStride||lanes*4)+(i%lanes)*4));
        assert.equal(now.length, past.length);
        for (let i=0;i<now.length;i++) largestDifference = Math.max(largestDifference, Math.abs(now[i]-past[i]));
      }
    }
    assert.ok(largestDifference < .00001, name + ': changed accepted motion ' + largestDifference);
    report[name].differenceFromV1 = largestDifference;
  }
}
if (reportFile) fs.writeFileSync(reportFile, JSON.stringify(report, null, 2) + '\n');
console.log('BOSS8 GLB QA passed:', JSON.stringify(report));
