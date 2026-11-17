'use strict';

const fs = require('node:fs');
const path = require('node:path');
const os = require('node:os');
const { execFileSync } = require('node:child_process');
const { createHash } = require('node:crypto');

const [master, output] = process.argv.slice(2);
const audioOnly = master === '--audio-only';
if (!master || !output) {
  throw new Error('使用方式：node export-replay.cjs <還原的核准 MP4 | --audio-only> <輸出目錄>');
}
fs.mkdirSync(output, { recursive: true });

const archive = path.join(__dirname, '..');
const ffmpeg = process.env.PARCHMENT_FFMPEG || 'ffmpeg';
const ff = args => execFileSync(ffmpeg, ['-hide_banner', '-loglevel', 'error', '-n', ...args], {
  stdio: 'inherit', windowsHide: true
});
if (!audioOnly) {
  const approved = JSON.parse(fs.readFileSync(path.join(archive, 'web/shots-01-04-100.7s.json'), 'utf8'));
  const sha = createHash('sha256').update(fs.readFileSync(master)).digest('hex');
  if (sha !== approved.sha256) throw new Error('核准母帶 SHA-256 不符');
  ff(['-i', master, '-map', '0:v:0', '-an', '-map_metadata', '-1',
    '-c:v', 'libx264', '-preset', 'medium', '-crf', '17', '-maxrate', '7300k', '-bufsize', '14600k',
    '-pix_fmt', 'yuv420p', '-color_primaries', 'bt709', '-color_trc', 'bt709', '-colorspace', 'bt709',
    '-movflags', '+faststart', path.join(output, 'shots-01-04-replay.mp4')]);
}

const scratch = fs.mkdtempSync(path.join(os.tmpdir(), 'parchment-replay-fx-'));
const firstEffects = path.join(scratch, 'first.wav');
try {
  execFileSync(process.execPath, [path.join(archive, 'extended-shot-one/build-audio.cjs'), '--replay-effects', firstEffects], {
    stdio: 'inherit', windowsHide: true
  });
  const remainingEffects = [
    'extended-shot-two/assets/shot-two-effects.wav',
    'extended-shot-three-35.5s/assets/shot-three-effects.wav',
    'extended-shot-four/assets/shot-four-effects.wav'
  ].map(file => path.join(archive, file));
  const inputs = [firstEffects, ...remainingEffects].flatMap(file => ['-i', file]);
  // The approved cut reaches shot four at 68.5s, 34.5s into the third shot.
  const tracks = '[2:a]atrim=duration=34.5,asetpts=PTS-STARTPTS,afade=t=out:st=34.46:d=0.04[third];' +
    '[0:a][1:a][third][3:a]concat=n=4:v=0:a=1[out]';
  ff([...inputs, '-filter_complex', tracks, '-map', '[out]',
    '-c:a', 'libmp3lame', '-b:a', '192k', path.join(output, 'shots-01-04-replay-sfx.mp3')]);
} finally {
  fs.rmSync(firstEffects, { force: true });
  fs.rmdirSync(scratch);
}
