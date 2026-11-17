'use strict';
const fs=require('node:fs');
const assert=require('node:assert/strict');
const [file, value]=process.argv.slice(2);
const seconds=Number(value);
assert.ok(file && Number.isFinite(seconds) && seconds > 0);
const mp4=fs.readFileSync(file);
function boxes(start,end) {
  const result=[];
  for(let pos=start;pos<end;) {
    const size=mp4.readUInt32BE(pos);
    assert.ok(size>=8 && pos+size<=end);
    result.push({tag:mp4.toString('ascii',pos+4,pos+8),body:pos+8,end:pos+size});
    pos+=size;
  }
  return result;
}
const children=box=>boxes(box.body,box.end);
function field(box,tag) {
  const entry=children(box).find(item=>item.tag===tag);
  assert.ok(entry,tag);
  return entry.body;
}
const movie=boxes(0,mp4.length).find(box=>box.tag==='moov');
const header=field(movie,'mvhd');
assert.equal(mp4[header],0);
const timescale=mp4.readUInt32BE(header+12);
const duration=Math.round(seconds*timescale);
assert.ok(Math.abs(duration-seconds*timescale)<1e-6);
if (mp4.readUInt32BE(header+16)===duration) return;

// Old FFmpeg muxers include AAC encoder delay in the track and movie headers.
// The edit lists already express the correct presentation interval.
const offsets=[header+16];
for (const track of children(movie).filter(box=>box.tag==='trak')) {
  const trackHeader=field(track,'tkhd');
  const edits=field(children(track).find(box=>box.tag==='edts'),'elst');
  assert.equal(mp4[trackHeader],0);
  assert.equal(mp4[edits],0);
  assert.equal(mp4.readUInt32BE(edits+4),1);
  assert.equal(mp4.readUInt32BE(edits+8),duration);
  offsets.push(trackHeader+20);
}
assert.equal(offsets.length,3);
const word=Buffer.alloc(4);
word.writeUInt32BE(duration);
const fd=fs.openSync(file,'r+');
try {
  for(const offset of offsets) fs.writeSync(fd,word,0,4,offset);
} finally {
  fs.closeSync(fd);
}
