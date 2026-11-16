'use strict';

const fs = require('node:fs');
const path = require('node:path');
const os = require('node:os');
const { spawnSync } = require('node:child_process');
const archive = process.env.PARCHMENT_ARCHIVE;
if (!archive) throw Error('Set PARCHMENT_ARCHIVE to the approved intro asset directory.');
const {braceAt,kneelAt,riseAt,vistaAt,duration} = require("./shot-timing.js");
const {strength:windStrength,pan:windPan} = require("./rise-gust.js");
const rate=48000, count=Math.round(rate*duration), tau=Math.PI*2;
const assetDir=path.join(__dirname,'assets');
const output=path.resolve(process.env.PARCHMENT_REVIEW_DIR || path.join(os.tmpdir(),'idle-rpg-shot-four'));
fs.mkdirSync(output,{recursive:true});
const ffmpeg=process.env.PARCHMENT_FFMPEG || 'ffmpeg';
const desert=path.join(archive,'../../third-party/user-supplied/desert-ascendant/desert-ascendant.mp3');

function ff(args) {
  const result=spawnSync(ffmpeg,['-hide_banner','-loglevel','error','-y',...args],{windowsHide:true,stdio:'inherit'});
  if (result.error) throw result.error;
  if (result.status!==0) throw Error('FFmpeg exited '+result.status);
}
function ease(a,b,t) {
  const x=Math.max(0,Math.min(1,(t-a)/(b-a)));
  return x*x*(3-2*x);
}
function windowed(t,start,peak,end) {
  return ease(start,peak,t)*(1-ease(peak,end,t));
}
const seeded=(() => {
  let seed=6381219;
  return () => ((seed=(Math.imul(seed,1664525)+1013904223)>>>0)/2147483648 - 1);
})();
function ring(t, start, frequencies, gain, decay) {
  const age=t-start;
  if (age<=0 || age>1.3) return 0;
  let sum=0;
  for (let i=0;i<frequencies.length;i++) {
    sum+=Math.sin(tau*frequencies[i]*age+.43*i)*Math.exp(-i*age*1.6)/(1+i*.51);
  }
  return gain*ease(0,.019,age)*Math.exp(-age*decay)*sum;
}
const scrapes=[
  [braceAt,braceAt+.35,braceAt+.95,.23],
  [braceAt+1.85,braceAt+2.15,braceAt+2.76,.19],
  [kneelAt+.18,kneelAt+.58,kneelAt+1.16,.21],
  [kneelAt+2.12,kneelAt+2.61,kneelAt+3.32,.15],
  [riseAt+.12,riseAt+.64,riseAt+1.23,.20],
  [riseAt+1.68,riseAt+2.21,riseAt+2.97,.30],
  [vistaAt+.80,vistaAt+1.21,vistaAt+1.89,.19],
  [vistaAt+1.86,vistaAt+2.08,vistaAt+2.66,.27],
];
const contact=[
  [braceAt+.03,.091],[braceAt+.51,.045],[braceAt+2.24,.037],
  [kneelAt+.32,.078],[kneelAt+1.37,.045],[riseAt+.43,.071],[vistaAt+2.01,.085],
];
const wav=Buffer.alloc(44+count*4);
wav.write('RIFF',0); wav.writeUInt32LE(wav.length-8,4); wav.write('WAVEfmt ',8);
wav.writeUInt32LE(16,16); wav.writeUInt16LE(1,20); wav.writeUInt16LE(2,22);
wav.writeUInt32LE(rate,24); wav.writeUInt32LE(rate*4,28); wav.writeUInt16LE(4,32);
wav.writeUInt16LE(16,34); wav.write('data',36); wav.writeUInt32LE(count*4,40);
let low=0,mid=0,high=0, windSide=0;
for(let frame=0;frame<count;frame++){
  const t=frame/rate;
  const noise=seeded();
  low+=(noise-low)*.008;
  mid+=(noise-mid)*.061;
  high+=(noise-high)*.35;
  windSide+=(seeded()-windSide)*.025;
  let scrape=0,plate=0;
  for (const [a,b,c,g] of scrapes) scrape+=g*windowed(t,a,b,c);
  for (const [when,amplitude] of contact)
    plate+=ring(t,when,[83,121,197,276],amplitude,16)+ring(t,when+.037,[459,709,1281],amplitude*.16,14);
  const air=(mid-low)*(.052+.018*Math.sin(t*1.04+.5)) + low*(.33+.19*Math.sin(t*1.38));
  const grain=(high-mid)*scrape*(.62+.38*Math.sin(tau*37*t+low*5)**2);
  const sword=windowed(t,riseAt+1.71,riseAt+2.20,riseAt+3)*((high-mid)*.16+(mid-low)*.30)
    +ring(t,riseAt+2.24,[627,989,1531],.051,6.5);
  const light = windowed(t,.035,braceAt*.81,braceAt);
  const shimmer = light * (0.024*Math.sin(tau*(145*t+4.0*t*t))
    +0.016*Math.sin(tau*(216*t+6.0*t*t))+(mid-low)*0.18);
  const remnants=ring(t,.18,[233,345,526],.026,3.45);
  const fade=ease(0,.32,t)*(1-ease(duration-.73,duration,t));
  const local=t-riseAt;
  const gust=local>=0&&t<vistaAt ? windStrength(local)*windowed(local,.46,2.0,8.25) : 0;
  const rush=gust*(low*.66+(mid-low)*.49+(high-mid)*.15);
  const rightToLeft=windPan(local);
  const center=air+grain+plate+sword+remnants+shimmer+rush;
  const stereo=windSide*.055+grain*.19*Math.sin(t*.50)+rush*.57*rightToLeft;
  for(let channel=0;channel<2;channel++){
    const value=Math.max(-1,Math.min(1,fade*(center+(channel===0?-stereo:stereo))));
    wav.writeInt16LE(Math.round(32767*value),44+frame*4+2*channel);
  }
}
const sfx=path.join(output,'shot-four-effects.wav');
fs.writeFileSync(sfx,wav);
const mix=path.join(assetDir,'shot-four-mix.wav');
const filter=
  "[1:a]atrim=duration="+duration+",aresample=48000,asetpts=PTS-STARTPTS,volume='0.47+0.15*exp(-t/0.52)':eval=frame[music];"+
  "[0:a][music]amix=inputs=2:duration=first:dropout_transition=0,volume=2,"+
  "alimiter=limit=0.91:level=false,afade=out:st="+(duration-.41).toFixed(2)+":d=0.41[out]";
ff(['-i',sfx,'-ss','68.5','-i',desert,'-filter_complex',filter,
  '-map','[out]','-ar','48000','-ac','2','-c:a','pcm_s16le',mix]);
console.log(mix);
