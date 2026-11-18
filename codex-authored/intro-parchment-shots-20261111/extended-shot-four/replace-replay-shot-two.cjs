'use strict';

const fs = require('node:fs');
const os = require('node:os');
const path = require('node:path');
const { execFileSync } = require('node:child_process');
const { offset, duration } = require('../extended-shot-two/shot-timing.js');

const fps = 30;
const containerBudget = 104_000_000;
const ffmpeg = process.env.PARCHMENT_FFMPEG || 'ffmpeg';
const ffprobe = process.env.PARCHMENT_FFPROBE || 'ffprobe';
const ff = args => execFileSync(ffmpeg, ['-nostdin', '-hide_banner', '-loglevel', 'error', '-n', ...args], {
  stdio: 'inherit', windowsHide: true
});
const probe = (file, args) => JSON.parse(execFileSync(ffprobe,
  ['-v', 'error', '-select_streams', 'v:0', ...args, '-of', 'json', file],
  { encoding: 'utf8', windowsHide: true }));
const count = file => Number(probe(file, ['-show_entries', 'stream=nb_frames']).streams[0].nb_frames);
const seconds = frames => (frames / fps).toFixed(6);
const bytes = file => fs.statSync(file).size;

function replaceReplayRange(master, replacement, output, start, end) {
  const total = count(master);
  if (!Number.isInteger(start) || !Number.isInteger(end) || start < 1 || end <= start || end >= total) {
    throw new Error('Replay replacement must specify an interior frame range.');
  }
  if (count(replacement) !== end - start) throw new Error('Replacement must retain its approved frame count.');
  const keyframes = probe(master, ['-show_entries', 'packet=pts_time,flags']).packets
    .filter(packet => packet.flags.includes('K')).map(packet => Math.round(packet.pts_time * fps));
  const left = keyframes.filter(frame => frame > 0 && frame <= start).at(-1);
  const right = keyframes.find(frame => frame >= end && frame < total);
  if (left === undefined || right === undefined) throw new Error('Replay is missing keyframes around the replacement.');

  const scratch = fs.mkdtempSync(path.join(os.tmpdir(), 'parchment-replay-splice-'));
  const head = path.join(scratch, 'original-0.mp4');
  const removed = path.join(scratch, 'original-1.mp4');
  const tail = path.join(scratch, 'original-2.mp4');
  const outgoing = path.join(scratch, 'outgoing.mp4');
  const incoming = path.join(scratch, 'incoming.mp4');
  const middle = path.join(scratch, 'replacement.mp4');
  const list = path.join(scratch, 'replay.ffconcat');
  const frameCodec = ['-an', '-c:v', 'libx264', '-preset', 'medium', '-pix_fmt', 'yuv420p',
    '-color_primaries', 'bt709', '-color_trc', 'bt709', '-colorspace', 'bt709', '-video_track_timescale', '15360'];

  function encodeEdge(file, from, to) {
    ff(['-i', master, '-map', '0:v:0', '-vf', 'trim=start_frame=' + from + ':end_frame=' + to +
      ',setpts=PTS-STARTPTS', ...frameCodec, '-crf', '18', '-maxrate', '7300k', '-bufsize', '14600k', file]);
  }

  try {
    ff(['-i', master, '-map', '0:v:0', '-c:v', 'copy', '-f', 'segment',
      '-segment_times', [left, right].map(seconds).join(','), '-segment_time_delta', '0.05',
      '-reset_timestamps', '1', path.join(scratch, 'original-%d.mp4')]);
    if (count(head) !== left || count(tail) !== total - right) throw new Error('Unexpected replay splice boundary.');
    const edges = [[outgoing, left, start], [incoming, end, right]].filter(([, from, to]) => from < to);
    for (const [file, from, to] of edges) {
      encodeEdge(file, from, to);
      if (count(file) !== to - from) throw new Error('The neighboring shots lost frames.');
    }

    const fixedBytes = [head, tail, ...edges.map(([file]) => file)].reduce((size, file) => size + bytes(file), 0);
    if (fixedBytes + bytes(replacement) <= containerBudget) {
      fs.copyFileSync(replacement, middle);
    } else {
      // Constrain the approved image only when the combined replay would exceed the asset budget.
      const rate = Math.floor((containerBudget - fixedBytes - 300_000) * 8 * fps / (end - start) / 1000);
      if (rate <= 0) throw new Error('The surrounding replay exceeds the asset budget.');
      ff(['-i', replacement, '-map', '0:v:0', ...frameCodec,
        '-crf', '17', '-maxrate', rate + 'k', '-bufsize', '1000k', middle]);
    }
    const clips = [[head, left], [outgoing, start - left], [middle, end - start], [incoming, right - end], [tail, total - right]]
      .filter(([, frames]) => frames > 0);
    fs.writeFileSync(list, 'ffconcat version 1.0\n' + clips.map(([file, frames]) =>
      "file '" + path.basename(file) + "'\nduration " + seconds(frames)).join('\n') + '\n');
    ff(['-f', 'concat', '-safe', '0', '-i', list, '-map', '0:v:0', '-c:v', 'copy', '-movflags', '+faststart', output]);
    if (count(output) !== total || bytes(output) > containerBudget) {
      throw new Error('Unexpected replay size or frame count.');
    }
  } finally {
    for (const file of [head, removed, tail, outgoing, incoming, middle, list]) fs.rmSync(file, { force: true });
    fs.rmdirSync(scratch);
  }
}

function replaceShotTwo(master, replacement, output) {
  replaceReplayRange(master, replacement, output, offset * fps, (offset + duration) * fps);
}

if (require.main === module) {
  const [master, replacement, output] = process.argv.slice(2);
  if (!master || !replacement || !output) throw new Error('Use replace-replay-shot-two.cjs MASTER SECOND_SHOT OUTPUT');
  replaceShotTwo(master, replacement, output);
}
module.exports = replaceShotTwo;
module.exports.replaceReplayRange = replaceReplayRange;
