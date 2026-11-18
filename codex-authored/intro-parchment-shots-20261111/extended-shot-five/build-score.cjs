'use strict';

const fs = require('node:fs');
const path = require('node:path');
const { execFileSync } = require('node:child_process');
const {duration, replayCutAt, fadeAt, fadeEnd}=require('./finale-timing.js');
const rate=48000, frames=duration*rate;
const wave=Buffer.alloc(44+frames*4);
wave.write('RIFF',0);wave.writeUInt32LE(wave.length-8,4);wave.write('WAVEfmt ',8);
wave.writeUInt32LE(16,16);wave.writeUInt16LE(1,20);wave.writeUInt16LE(2,22);
wave.writeUInt32LE(rate,24);wave.writeUInt32LE(rate*4,28);wave.writeUInt16LE(4,32);
wave.writeUInt16LE(16,34);wave.write('data',36);wave.writeUInt32LE(frames*4,40);
const smooth=(a,b,t)=>{
  const u=Math.max(0,Math.min(1,(t-a)/(b-a)));
  return u*u*(3-2*u);
};
let seed=648257, deep=0, low=0, grit=0, diffuse=0;
function noise() {
  seed=(Math.imul(seed,1664525)+1013904223)>>>0;
  return seed/2147483648-1;
}
for(let i=0;i<frames;i++){
  const t=i/rate;
  const a=noise();
  deep+=(a-deep)*.006;
  low+=(a-low)*.033;
  grit+=(a-grit)*.18;
  diffuse+=(noise()-diffuse)*.045;
  const pulse1=Math.exp(-((t-2.05)**2)/.52);
  const pulse2=Math.exp(-((t-4.70)**2)/.79);
  const pulse3=Math.exp(-((t-7.0)**2)/.64);
  const gust=.35+.54*pulse1+.55*pulse2+.48*pulse3;
  const grade=smooth(0,.055,t)*(1-smooth(fadeAt,fadeEnd,t));
  const air=(deep*.89+(low-deep)*.27+(grit-low)*.14)*gust;
  const sand=(a-grit)*.033*gust*(.38+.62*Math.sin(t*27.8+low*9)**4);
  const flaps=(grit-low)*(.06+.12*gust)*Math.sin(t*8.1+deep*4)**6;
  const x=t<3.3?t-2.05:t<5.9?t-4.7:t-7;
  const pan=.25*Math.sin(-Math.PI*.54*x)*Math.max(pulse1,pulse2,pulse3);
  const sides=(air+sand)*pan+diffuse*.032*gust;
  wave.writeInt16LE(Math.round(32700*Math.tanh((air+sand+flaps+sides)*grade)),44+i*4);
  wave.writeInt16LE(Math.round(32700*Math.tanh((air+sand+flaps-sides)*grade)),46+i*4);
}
const out=path.join(__dirname,'assets');
const fx=path.join(out,'finale-effects.wav');
fs.writeFileSync(fx,wave);
execFileSync(process.env.PARCHMENT_FFMPEG||'ffmpeg',['-hide_banner','-loglevel','error','-y',
  '-i',fx,'-ss',String(replayCutAt),'-i',path.resolve(__dirname,'../../../third-party/user-supplied/desert-ascendant/desert-ascendant.mp3'),
  '-filter_complex','[1:a]aresample=48000,atrim=duration='+duration+',asetpts=PTS-STARTPTS,volume=.53,' +
  'afade=t=out:st='+fadeAt+':d='+(fadeEnd-fadeAt).toFixed(2)+':curve=hsin[m];' +
  '[0:a][m]amix=inputs=2:duration=first:dropout_transition=0,volume=2[out]',
  '-map','[out]','-c:a','pcm_s16le',path.join(out,'finale-audio.wav')],{windowsHide:true,stdio:'inherit'});
