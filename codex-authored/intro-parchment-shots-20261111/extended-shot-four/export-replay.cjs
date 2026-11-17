'use strict';

const fs = require('node:fs');
const path = require('node:path');
const { execFileSync } = require('node:child_process');
const { createHash } = require('node:crypto');

const [master, output] = process.argv.slice(2);
if (!master || !output) {
  throw new Error('使用方式：node export-replay.cjs <還原的核准 MP4> <輸出影片和音效的目錄>');
}
fs.mkdirSync(output, { recursive: true });

const archive = path.join(__dirname, '..');
const approved = JSON.parse(fs.readFileSync(path.join(archive, 'web/shots-01-04-100.7s.json'), 'utf8'));
const sha = createHash('sha256').update(fs.readFileSync(master)).digest('hex');
if (sha !== approved.sha256) throw new Error('核准母帶 SHA-256 不符');

const ffmpeg = process.env.PARCHMENT_FFMPEG || 'ffmpeg';
const ff = args => execFileSync(ffmpeg, ['-hide_banner', '-loglevel', 'error', '-n', ...args], {
  stdio: 'inherit', windowsHide: true
});
ff(['-i', master, '-map', '0:v:0', '-an', '-map_metadata', '-1',
  '-c:v', 'libx264', '-preset', 'medium', '-crf', '17', '-maxrate', '7300k', '-bufsize', '14600k',
  '-pix_fmt', 'yuv420p', '-color_primaries', 'bt709', '-color_trc', 'bt709', '-colorspace', 'bt709',
  '-movflags', '+faststart', path.join(output, 'shots-01-04-replay.mp4')]);

const inputs = [
  'extended-shot-one/assets/shot-one-effects.wav',
  'extended-shot-two/assets/shot-two-effects.wav',
  'extended-shot-three-35.5s/assets/shot-three-effects.wav',
  'extended-shot-four/assets/shot-four-effects.wav'
].flatMap(file => ['-i', path.join(archive, file)]);
// The approved cut reaches shot four at 68.5s, 34.5s into the third shot.
const tracks = '[2:a]atrim=duration=34.5,asetpts=PTS-STARTPTS,afade=t=out:st=34.46:d=0.04[third];' +
  '[0:a][1:a][third][3:a]concat=n=4:v=0:a=1[out]';
ff([...inputs, '-filter_complex', tracks, '-map', '[out]',
  '-c:a', 'libmp3lame', '-b:a', '192k', path.join(output, 'shots-01-04-replay-sfx.mp3')]);
