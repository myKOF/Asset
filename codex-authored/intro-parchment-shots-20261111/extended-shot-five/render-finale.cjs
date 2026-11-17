'use strict';

const fs = require('node:fs');
const { mkdtemp, rm } = require('node:fs/promises');
const os = require('node:os');
const path = require('node:path');
const http = require('node:http');
const { spawn, execFileSync } = require('node:child_process');
const { once } = require('node:events');
const { setTimeout: delay } = require('node:timers/promises');

const root = __dirname;
const archive = path.dirname(root);
const review = path.resolve(process.env.PARCHMENT_REVIEW_DIR || path.join(os.tmpdir(), 'idle-rpg-shot-five'));
fs.mkdirSync(review, { recursive: true });
const { duration } = require('./finale-timing.js');
const fps = 30;
const ffmpeg = process.env.PARCHMENT_FFMPEG || 'ffmpeg';
const mime = { '.html': 'text/html; charset=utf-8', '.js': 'text/javascript; charset=utf-8',
  '.mp3': 'audio/mpeg', '.jpg': 'image/jpeg', '.json': 'application/json', '.png': 'image/png', '.wav': 'audio/wav', '.woff2': 'font/woff2' };
const server = http.createServer((req, res) => {
  const url = new URL(req.url, 'http://localhost');
  const file = path.resolve(archive, '.' + url.pathname);
  const type = mime[path.extname(file)];
  if (!file.startsWith(archive + path.sep) || !type || !fs.existsSync(file)) {
    res.writeHead(404).end();
    return;
  }
  res.writeHead(200, { 'Content-Type': type });
  const stream = fs.createReadStream(file);
  res.on('close', () => stream.destroy());
  stream.on('error', () => res.destroy());
  stream.pipe(res);
});

async function main() {
  const temp = path.resolve(os.tmpdir());
  const profile = await mkdtemp(path.join(temp, 'idle-rpg-shot-five-edge-'));
  let browser, ws, encoder;
  try {
    server.listen(0, '127.0.0.1');
    await once(server, 'listening');
    const edge = path.join(process.env['ProgramFiles(x86)'], 'Microsoft/Edge/Application/msedge.exe');
    browser = spawn(edge, ['--headless=new','--no-first-run','--disable-extensions',
      '--disable-background-networking','--mute-audio','--remote-debugging-port=0',
      '--user-data-dir=' + profile, 'about:blank'], { windowsHide:true, stdio:'ignore' });
    const activePort = path.join(profile, 'DevToolsActivePort');
    for (let i = 0; i < 120 && !fs.existsSync(activePort); i++) await delay(100);
    const port = Number(fs.readFileSync(activePort, 'utf8').split(/\r?\n/)[0]);
    const pages = await fetch('http://127.0.0.1:' + port + '/json/list').then(r => r.json());
    ws = new WebSocket(pages.find(t => t.type === 'page').webSocketDebuggerUrl);
    await once(ws, 'open');
    const pending = new Map(), errors = [];
    let id = 0;
    ws.addEventListener('message', ({data}) => {
      const message = JSON.parse(data);
      if (message.method === 'Runtime.exceptionThrown') errors.push(message.params.exceptionDetails);
      const command = pending.get(message.id);
      if (!command) return;
      pending.delete(message.id);
      if (message.error) command.reject(Error(JSON.stringify(message.error)));
      else command.resolve(message.result);
    });
    function send(method, params = {}) {
      const key = ++id;
      return new Promise((resolve, reject) => {
        pending.set(key, { resolve, reject });
        ws.send(JSON.stringify({ id:key, method, params }));
      });
    }
    async function evaluate(expression) {
      const r = await send('Runtime.evaluate', { expression, awaitPromise:true, returnByValue:true });
      if (r.exceptionDetails) throw Error(r.exceptionDetails.exception?.description || r.exceptionDetails.text);
      return r.result.value;
    }
    await send('Runtime.enable');
    await send('Page.enable');
    await send('Page.navigate', { url: 'http://127.0.0.1:' + server.address().port + '/extended-shot-five/index.html?capture=1' });
    let loaded = false;
    for (let i = 0; i < 120 && !loaded; i++) {
      loaded = await evaluate('typeof window.openingShot?.render === "function"');
      if (!loaded) await delay(100);
    }
    if (!loaded) throw Error('Preview did not load: ' + JSON.stringify(errors));
    const layers = await evaluate('({army:openingShot.army,motion:openingShot.parallaxAt(7.5)})');
    if (layers.army.ground + layers.army.air < 30 || layers.army.air < 6 || layers.army.wingFrames < 4 || !(layers.motion.gate < layers.motion.sky && layers.motion.sky < 0 && layers.motion.middle === 0 && layers.motion.near > 0)) throw Error(JSON.stringify(layers));
    console.log('Finale layers and counts: ' + JSON.stringify(layers));
    const finalBlack = await evaluate('openingShot.render(openingShot.duration); document.querySelector("canvas").getContext("2d").getImageData(1000,450,10,10).data.every((v,i)=>i%4===3?v===255:v===0)');
    if (!finalBlack) throw Error('Finale did not end on black');
    async function frame(time) {
      const src = await evaluate('openingShot.render(' + time + '); document.querySelector("canvas").toDataURL("image/jpeg",0.98).split(",")[1]');
      return Buffer.from(src, 'base64');
    }
    if (process.argv.includes('--stills')) {
      fs.mkdirSync(path.join(review, 'stills'), { recursive: true });
      for (const t of [0, 2.85, 3.55, 5.25, 7.70, 9.50, 10.45, 11.3, 12.4, 12.9666667]) {
        fs.writeFileSync(path.join(review, 'stills', 'frame-' + t.toFixed(2) + '.jpg'), await frame(t));
      }
    } else {
      const out = path.join(review, 'shot-05-desert-finale-orbit.mp4');
      encoder = spawn(ffmpeg, ['-hide_banner','-loglevel','error','-y',
        '-f','image2pipe','-framerate',String(fps),'-vcodec','mjpeg','-i','pipe:0',
        '-i',path.join(root,'assets/finale-audio.wav'),'-map','0:v:0','-map','1:a:0','-c:a','aac','-b:a','192k','-vf','scale=in_range=full:out_range=limited,format=yuv420p',
        '-c:v','libx264','-preset','medium','-crf','17','-maxrate','9000k','-bufsize','10000k','-g','60','-color_range','tv',
        '-color_primaries','bt709','-color_trc','bt709','-colorspace','bt709',
        '-movflags','+faststart','-t',String(duration),out
      ], { windowsHide:true, stdio:['pipe','inherit','inherit'] });
      const done = once(encoder, 'exit');
      const frameCount = Math.round(duration * fps);
      for (let i = 0; i < frameCount; i++) {
        const bytes = await frame(i / fps);
        if (!encoder.stdin.write(bytes)) await once(encoder.stdin, 'drain');
        if ((i + 1) % 120 === 0) console.log('Rendered ' + (i + 1) + '/' + frameCount + ' frames');
      }
      encoder.stdin.end();
      const [code] = await done;
      if (code !== 0) throw Error('FFmpeg exited ' + code);
      execFileSync(process.execPath, [path.join(root, 'align-mp4-presentation.cjs'), out, String(duration)], { windowsHide: true });
      console.log(out);
    }
    if (errors.length) throw Error(JSON.stringify(errors));
  } finally {
    if (encoder && encoder.exitCode === null && encoder.signalCode === null) encoder.kill();
    if (ws?.readyState === WebSocket.OPEN) {
      ws.send(JSON.stringify({ id:999999, method:'Browser.close' }));
      ws.close();
    }
    server.closeAllConnections();
    server.close();
    if (browser && browser.exitCode === null && browser.signalCode === null) {
      await Promise.race([once(browser, 'exit'), delay(1800)]);
      if (browser.exitCode === null && browser.signalCode === null) browser.kill();
    }
    if (path.dirname(profile) === temp && path.basename(profile).startsWith('idle-rpg-shot-five-edge-')) {
      await rm(profile, { recursive:true, force:true, maxRetries:10, retryDelay:200 });
    }
  }
}
main().catch(error => { console.error(error); process.exitCode = 1; });
