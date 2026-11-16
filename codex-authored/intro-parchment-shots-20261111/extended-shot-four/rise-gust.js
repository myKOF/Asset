'use strict';

const RISE_WIND = (() => {
  const clamp=x=>Math.max(0,Math.min(1,x));
  const smooth=(a,b,t)=>{const q=clamp((t-a)/(b-a));return q*q*(3-2*q);};
  const gusts=[
    {in:.92,peak:2.08,out:3.52,force:.81},
    {in:3.08,peak:4.55,out:6.17,force:.96},
    {in:5.64,peak:6.88,out:8.24,force:.73},
  ];
  function strength(t) {
    let sum=.08+.19*smooth(.54,2,t);
    for(const event of gusts) {
      sum+=event.force*smooth(event.in,event.peak,t)*(1-smooth(event.peak,event.out,t));
    }
    return clamp(sum);
  }
  const dt=1/120;
  const travel=[0];
  for(let i=1;i<=1200;i++)travel[i]=travel[i-1]+(strength(i*dt)+strength((i-1)*dt))*dt*.5;
  function distance(t) {
    const f=Math.max(0,Math.min(travel.length-2,t/dt));
    const frame=Math.floor(f);
    return travel[frame]+(travel[frame+1]-travel[frame])*(f-frame);
  }
  function pan(t) {
    let sum=0,weight=0;
    for(const event of gusts) {
      const volume=event.force*smooth(event.in,event.peak,t)*(1-smooth(event.peak,event.out,t));
      sum+=volume*(1-2*smooth(event.in,event.out,t));
      weight+=volume;
    }
    return sum/Math.max(.35,weight);
  }
  return {strength,distance,smooth,pan};
})();

function makeRiseGust(ctx) {
  const {strength,distance,smooth}=RISE_WIND;
  const tau=2*Math.PI;
  let seed=39878421;
  const rand=()=>((seed=(Math.imul(seed,1664525)+1013904223)>>>0)/4294967296);
  const shades=['#ad7951','#bc885e','#c99a70','#d6a679','#e0b68c'];
  const grains=Array.from({length:6140},(_,i)=>{
    const depth=rand()**.52;
    const cloud=i%8===0;
    const born=.68+7.55*(i+rand())/6140;
    const horizontal=rand();
    const x=cloud ? 1270+180*horizontal : -70+1625*horizontal;
    const lane=rand();
    const y=519+158*depth + (lane-.5)*24;
    const size=.47+rand()**1.67*(.90+1.31*depth);
    const lift=3+rand()**2*(23+21*(1-depth));
    const phase=rand()*tau;
    return {born,startTravel:distance(born),x,y,lane,depth,size,lift,phase,
      speed:160+rand()*230+210*depth,
      life:1.0+rand()*1.23,
      pigment:shades[Math.floor(rand()*shades.length)],
      opacity:.24+rand()*.47};
  });
  const ribbons=Array.from({length:32},(_,i)=>{
    const event=[1.04,3.18,5.72][i%3];
    const start=event+rand()*.94;
    return {start,startTravel:distance(start),x:870+rand()*670,y:567+rand()*105,
      speed:570+rand()*400,span:110+rand()*225,low:5+rand()*15,life:1.73+rand()*.55,
      opacity:.036+rand()*.098,phase:rand()*tau};
  });

  function draw(t) {
    if(t<.68)return;
    const wind=strength(t);
    const travel=distance(t);
    ctx.save();
    for(const ribbon of ribbons) {
      const age=t-ribbon.start;
      if(age<=0||age>=ribbon.life)continue;
      const x=ribbon.x-ribbon.speed*(.25*age+.87*(travel-ribbon.startTravel));
      const y=ribbon.y-12*smooth(0,.75,age)+5*Math.sin(ribbon.phase+age*3);
      const alpha=ribbon.opacity*smooth(0,.40,age)*(1-smooth(.93,ribbon.life,age));
      if(x < -ribbon.span||x>1280+ribbon.span)continue;
      ctx.save();
      ctx.translate(x,y);
      ctx.rotate(-.048+.039*Math.sin(ribbon.phase));
      ctx.scale(ribbon.span*(1+.32*age),ribbon.low+2.6*age);
      const haze=ctx.createRadialGradient(0,0,0,0,0,1);
      haze.addColorStop(0,'rgba(203,155,109,'+alpha+')');
      haze.addColorStop(.50,'rgba(198,145,101,'+(alpha*.43)+')');
      haze.addColorStop(1,'rgba(198,145,101,0)');
      ctx.fillStyle=haze;
      ctx.fillRect(-1,-1,2,2);
      ctx.restore();
    }
    for(const mote of grains) {
      const age=t-mote.born;
      if(age<=0||age>=mote.life)continue;
      const x=mote.x-mote.speed*(age*.32+(travel-mote.startTravel)*1.14);
      if(x < -78||x>1370)continue;
      const climb=mote.lift*smooth(0,.23,age)*(1-smooth(.36,mote.life,age));
      const flutter=(1-mote.depth)*5*Math.sin(mote.phase+age*7)*(1-Math.exp(-age*7));
      const y=mote.y-climb+flutter;
      const alpha=mote.opacity*(.47+.53*wind)*smooth(0,.12,age)*(1-smooth(mote.life*.66,mote.life,age));
      ctx.fillStyle=mote.pigment;
      ctx.globalAlpha=alpha;
      ctx.beginPath();
      ctx.ellipse(x,y,mote.size*(1.07+(.82+1.85*mote.depth)*wind),
        mote.size*.63,-.065+.075*Math.sin(mote.phase+age*6),0,tau);
      ctx.fill();
    }
    ctx.restore();
  }
  return {draw};
}

if(typeof module!=='undefined')module.exports=RISE_WIND;
