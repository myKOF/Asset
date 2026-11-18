'use strict';

const fs = require('node:fs');
const path = require('node:path');
const os = require('node:os');
const { execFileSync } = require('node:child_process');
const { createHash } = require('node:crypto');
const exportCleanReplay = require('./export-clean-replay.cjs');
const replaceShotTwo = require('./replace-replay-shot-two.cjs');

const [master, output] = process.argv.slice(2);
const audioOnly = master === '--audio-only';
const fiveShots = master === '--five-shots';
if (!master || !output) {
  throw new Error('使用方式：node export-replay.cjs <還原的核准 MP4 | --audio-only | --five-shots> <輸出目錄>');
}
fs.mkdirSync(output, { recursive: true });

const archive = path.join(__dirname, '..');
const replay = fiveShots ? 'shots-01-05-replay' : 'shots-01-04-replay';
const ffmpeg = process.env.PARCHMENT_FFMPEG || 'ffmpeg';
const ff = args => execFileSync(ffmpeg, ['-hide_banner', '-loglevel', 'error', '-n', ...args], {
  stdio: 'inherit', windowsHide: true
});
if (!audioOnly && !fiveShots) {
  const approved = JSON.parse(fs.readFileSync(path.join(archive, 'web/shots-01-04-100.7s.json'), 'utf8'));
  const sha = createHash('sha256').update(fs.readFileSync(master)).digest('hex');
  if (sha !== approved.sha256) throw new Error('核准母帶 SHA-256 不符');
  ff(['-i', master, '-map', '0:v:0', '-an', '-map_metadata', '-1',
    '-c:v', 'libx264', '-preset', 'medium', '-crf', '17', '-maxrate', '7300k', '-bufsize', '14600k',
    '-pix_fmt', 'yuv420p', '-color_primaries', 'bt709', '-color_trc', 'bt709', '-colorspace', 'bt709',
    '-movflags', '+faststart', path.join(output, replay + '.mp4')]);
}

const scratch = fs.mkdtempSync(path.join(os.tmpdir(), 'parchment-replay-'));
const firstEffects = path.join(scratch, 'first.wav');
const concatFile = path.join(scratch, 'video.ffconcat');
const bakedPicture = path.join(scratch, 'historical-picture.mp4');
const cleanPicture = path.join(scratch, 'clean-picture.mp4');
const revisedShotTwo = path.join(scratch, 'revised-shot-two.mp4');
const revisedDust = path.join(scratch, 'revised-dust.mp4');
try {
  if (fiveShots) {
    const { replayCutAt, duration } = require('../extended-shot-five/finale-timing.js');
    const clips = [
      ['web/shots-01-04-replay.mp4', replayCutAt],
      ['web/shot-05-desert-finale-orbit.mp4', duration]
    ];
    const segments = clips.map(([file, duration]) => {
      const url = ('file:' + path.join(archive, file).replaceAll('\\', '/')).replaceAll("'", "'\\''");
      return "file '" + url + "'\nduration " + duration;
    });
    fs.writeFileSync(concatFile, ['ffconcat version 1.0', ...segments, ''].join('\n'));
    ff(['-f', 'concat', '-safe', '0', '-i', concatFile, '-map', '0:v:0', '-c:v', 'copy',
      '-movflags', '+faststart', bakedPicture]);
    exportCleanReplay(bakedPicture, cleanPicture);
    replaceShotTwo(cleanPicture, path.join(archive, 'web/shot-02-effects-18s.mp4'), revisedShotTwo);
    const { offset } = require('../extended-shot-three-35.5s/shot-timing.js');
    replaceShotTwo.replaceReplayRange(revisedShotTwo, path.join(archive, 'web/shot-03-valley-dust.mp4'),
      revisedDust, offset * 30 + 486, offset * 30 + 692);
    replaceShotTwo.replaceReplayRange(revisedDust, path.join(archive, 'web/shot-03-flat-left-hand.mp4'),
      path.join(output, replay + '.mp4'), offset * 30 + 573, offset * 30 + 1035);
  }

  execFileSync(process.execPath, [path.join(archive, 'extended-shot-one/build-audio.cjs'), '--replay-effects', firstEffects], {
    stdio: 'inherit', windowsHide: true
  });
  const remainingEffects = [
    'extended-shot-two/assets/shot-two-effects.wav',
    'extended-shot-three-35.5s/assets/shot-three-effects.wav',
    'extended-shot-four/assets/shot-four-effects.wav'
  ];
  if (fiveShots) remainingEffects.push('extended-shot-five/assets/finale-effects.wav');
  const inputs = [firstEffects, ...remainingEffects.map(file => path.join(archive, file))].flatMap(file => ['-i', file]);
  // The approved cut reaches shot four at 68.5s, 34.5s into the third shot.
  const tracks = '[2:a]atrim=duration=34.5,asetpts=PTS-STARTPTS,afade=t=out:st=34.46:d=0.04[third];' +
    '[0:a][1:a][third][3:a]' + (fiveShots ? '[4:a]concat=n=5' : 'concat=n=4') + ':v=0:a=1[out]';
  ff([...inputs, '-filter_complex', tracks, '-map', '[out]',
    '-c:a', 'libmp3lame', '-b:a', '192k', path.join(output, replay + '-sfx.mp3')]);
} finally {
  fs.rmSync(concatFile, { force: true });
  fs.rmSync(bakedPicture, { force: true });
  fs.rmSync(cleanPicture, { force: true });
  fs.rmSync(revisedShotTwo, { force: true });
  fs.rmSync(revisedDust, { force: true });
  fs.rmSync(firstEffects, { force: true });
  fs.rmdirSync(scratch);
}
