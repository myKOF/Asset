'use strict';

const fs = require('node:fs');
const os = require('node:os');
const path = require('node:path');
const { execFileSync } = require('node:child_process');

// These ranges cover the titles on the archived master. Live caption timings
// come from the game's opening_animation/旁白.md.
const plates = [
  { id: 'one', folder: 'extended-shot-one', from: 120, to: 300, offset: 0 },
  { id: 'two', folder: 'extended-shot-two', from: 30, to: 330, offset: 480 },
  { id: 'three', folder: 'extended-shot-three-35.5s', from: 180, to: 480, offset: 1020 }
];
const fps = 30;
const tailAt = 50.2; // First keyframe after the last title.
const ffmpeg = process.env.PARCHMENT_FFMPEG || 'ffmpeg';
const ffprobe = process.env.PARCHMENT_FFPROBE || 'ffprobe';
const ff = args => execFileSync(ffmpeg, ['-hide_banner', '-loglevel', 'error', '-n', ...args], {
  stdio: 'inherit', windowsHide: true
});
function frameCount(file) {
  const info = execFileSync(ffprobe, ['-v', 'error', '-select_streams', 'v:0',
    '-show_entries', 'stream=nb_frames', '-of', 'json', file], { encoding: 'utf8', windowsHide: true });
  return Number(JSON.parse(info).streams[0].nb_frames);
}

function exportCleanReplay(master, output, existingPlates) {
  const scratch = fs.mkdtempSync(path.join(os.tmpdir(), 'parchment-clean-replay-'));
  const parts = [];
  try {
    const inputs = plates.flatMap(plate => {
      const directory = path.join(existingPlates || scratch, plate.id);
      const picture = path.join(directory, 'picture-range.mp4');
      if (!existingPlates) {
        parts.push(picture);
        execFileSync(process.execPath, [
          path.resolve(__dirname, '..', plate.folder, 'render-shot-' + plate.id + '.cjs'),
          '--frames', String(plate.from), String(plate.to)
        ], { env: { ...process.env, PARCHMENT_REVIEW_DIR: directory }, stdio: 'inherit', windowsHide: true });
      }
      if (frameCount(picture) !== plate.to - plate.from) throw new Error('Incorrect plate length: ' + picture);
      return ['-i', picture];
    });
    const filters = plates.map((plate, index) => {
      const start = (plate.offset + plate.from) / fps;
      const end = (plate.offset + plate.to) / fps;
      const edge = 'clip(min(Y,H-1-Y)/20,0,1)';
      return '[' + (index + 1) + ':v]crop=1920:210:0:798,format=yuva420p,' +
        "geq=lum='p(X,Y)':cb='p(X,Y)':cr='p(X,Y)':a='255*" + edge + "'," +
        'fade=t=in:st=0:d=0.16:alpha=1,fade=t=out:st=' + (end - start - 0.16) + ':d=0.16:alpha=1,' +
        'setpts=PTS+' + start + '/TB[plate' + index + '];' +
        (index ? '[base' + (index - 1) + ']' : '[0:v]') + '[plate' + index + ']' +
        'overlay=y=798:eof_action=pass:repeatlast=0[base' + index + ']';
    }).join(';');

    const lead = path.join(scratch, 'lead.mp4');
    const first = path.join(scratch, 'original-0.mp4');
    const tail = path.join(scratch, 'original-1.mp4');
    const list = path.join(scratch, 'picture.ffconcat');
    parts.push(lead, first, tail, list);
    ff(['-i', master, '-map', '0:v:0', '-c:v', 'copy', '-f', 'segment',
      '-segment_times', String(tailAt), '-segment_time_delta', '0.1',
      '-reset_timestamps', '1', path.join(scratch, 'original-%d.mp4')]);
    if (frameCount(first) !== tailAt * fps || frameCount(first) + frameCount(tail) !== frameCount(master)) {
      throw new Error('Replay does not have the expected cut point.');
    }
    ff(['-i', master, ...inputs, '-filter_complex_threads', '2', '-filter_complex', filters,
      '-map', '[base2]', '-an', '-t', String(tailAt), '-c:v', 'libx264', '-preset', 'medium',
      '-crf', '17', '-maxrate', '7300k', '-bufsize', '14600k', '-pix_fmt', 'yuv420p',
      '-color_primaries', 'bt709', '-color_trc', 'bt709', '-colorspace', 'bt709', lead]);
    fs.writeFileSync(list, "ffconcat version 1.0\nfile lead.mp4\nduration " + tailAt + "\nfile original-1.mp4\n");
    ff(['-f', 'concat', '-safe', '0', '-i', list, '-map', '0:v:0', '-c:v', 'copy', '-movflags', '+faststart', output]);
    if (frameCount(output) !== frameCount(master)) throw new Error('Replay frame count changed.');
  } finally {
    for (const file of parts) fs.rmSync(file, { force: true });
    if (!existingPlates) {
      for (const { id } of plates) {
        const subfolder = path.join(scratch, id);
        if (fs.existsSync(subfolder)) fs.rmdirSync(subfolder);
      }
    }
    fs.rmdirSync(scratch);
  }
}

if (require.main === module) {
  const [master, output, existingPlates] = process.argv.slice(2);
  if (!master || !output) throw new Error('Use export-clean-replay.cjs MASTER OUTPUT [PLATE_DIRECTORY]');
  exportCleanReplay(master, output, existingPlates);
}
module.exports = exportCleanReplay;
