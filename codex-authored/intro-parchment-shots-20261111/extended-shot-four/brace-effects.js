'use strict';

function makeBraceEffects(ctx, picture, width, height) {
  const tau=Math.PI*2;
  const clamp=(value,min,max)=>Math.min(max,Math.max(min,value));
  function smooth(from,to,x) {
    const t=clamp((x-from)/(to-from),0,1);
    return t*t*(3-2*t);
  }

  function sample(source,output,w,h,x,y,index,alpha) {
    const sx=clamp(x,0,w-2), sy=clamp(y,0,h-2);
    const left=Math.floor(sx), top=Math.floor(sy);
    const u=sx-left, v=sy-top;
    const a=(top*w+left)*4,b=a+w*4;
    for(let channel=0;channel<3;channel++) {
      output[index+channel]=(1-v)*((1-u)*source[a+channel]+u*source[a+4+channel])+
        v*((1-u)*source[b+channel]+u*source[b+4+channel]);
    }
    output[index+3]=Math.round(255*alpha);
  }

  // Narrow patch along the rear cloth edge. The bright forearm begins beyond it.
  const bounds={x:850,y:62,w:393,h:360};
  const edge=[
    [62,1165],[108,1149],[153,1116],[201,1073],[239,1018],
    [278,993],[320,981],[360,954],[401,927],[421,922],
  ];
  const patch=document.createElement('canvas');
  patch.width=bounds.w; patch.height=bounds.h;
  const patchCtx=patch.getContext('2d',{willReadFrequently:true});
  patchCtx.drawImage(picture,bounds.x,bounds.y,bounds.w,bounds.h,0,0,bounds.w,bounds.h);
  const base=patchCtx.getImageData(0,0,bounds.w,bounds.h).data;
  const updated=patchCtx.createImageData(bounds.w,bounds.h);
  const edgeByRow=new Float32Array(bounds.h);
  for(let y=0,segment=0;y<bounds.h;y++) {
    const originalY=y+bounds.y;
    while(segment+1<edge.length-1&&originalY>edge[segment+1][0])segment++;
    const [ay,ax]=edge[segment], [by,bx]=edge[segment+1];
    edgeByRow[y]=ax+(bx-ax)*(originalY-ay)/(by-ay)-bounds.x;
  }
  const patchRows=Array.from({length:bounds.h},(_,y) => {
    const originalY=y+bounds.y;
    const lowerFade=1-smooth(355,411,originalY);
    const free=smooth(85,229,originalY)*lowerFade;
    const center=edgeByRow[y];
    const start=Math.max(1,Math.floor(center-68));
    const end=Math.min(bounds.w-2,Math.ceil(center+58));
    const points=[];
    for(let x=start;x<=end;x++) {
      const inner=x-center;
      const blend=(1-smooth(22,inner<0?65:55,Math.abs(inner)))
        *smooth(65,112,originalY)*lowerFade;
      if(blend>.005)points.push({x, blend, index:(y*bounds.w+x)*4});
    }
    return {points,free,originalY};
  });

  function cloth(time,shot) {
    const amplitude=smooth(.18,1.63,time);
    if(amplitude===0)return;
    for(let y=0;y<patchRows.length;y++) {
      const {points,free,originalY}=patchRows[y];
      const phase=originalY/142;
      const flicker=Math.sin(time*2.36-phase)+.37*Math.sin(time*4.0-phase*1.63+.5);
      const dx=amplitude*free*(-4.0+10.6*flicker);
      const dy=amplitude*free*(1.8+3.3*Math.cos(time*2.23-phase));
      for(const {x,blend,index} of points) {
        sample(base,updated.data,bounds.w,bounds.h,x-dx,y-dy,index,blend);
      }
    }
    patchCtx.putImageData(updated,0,0);
    const [x,y]=shot.point(bounds.x/picture.naturalWidth,bounds.y/picture.naturalHeight);
    ctx.drawImage(patch,x,y,
      bounds.w/picture.naturalWidth*width*shot.zoom,
      bounds.h/picture.naturalHeight*height*shot.zoom);
  }

  const shimmerAreas=[
    {x:295,y:420,w:282,h:263,strength:2.8},
    {x:645,y:707,w:623,h:102,strength:2.3},
    {x:1392,y:619,w:195,h:149,strength:2.4},
  ].map(area=>{
    const surface=document.createElement('canvas');
    surface.width=area.w;surface.height=area.h;
    const surfaceCtx=surface.getContext('2d',{willReadFrequently:true});
    surfaceCtx.drawImage(picture,area.x,area.y,area.w,area.h,0,0,area.w,area.h);
    const source=surfaceCtx.getImageData(0,0,area.w,area.h).data;
    const warped=surfaceCtx.createImageData(area.w,area.h);
    const points=[];
    for(let y=0;y<area.h;y++) {
      for(let x=0;x<area.w;x++) {
        const distance=Math.hypot((x/area.w-.51)*2.05,(y/area.h-.55)*2.12);
        const envelope=1-smooth(.26,.96,distance);
        if(envelope>.025)points.push({x,y,envelope,offset:(y*area.w+x)*4});
      }
    }
    return {area,surface,surfaceCtx,source,warped,points};
  });

  function shimmer(time,shot) {
    const power=smooth(.52,2.9,time);
    if(power<=0)return;
    for(const {area,surface,surfaceCtx,source,warped,points} of shimmerAreas) {
      const phase=time*7.7+area.x*.007;
      for(const {x,y,envelope,offset} of points) {
        const strength=area.strength*power*envelope;
        const dx=strength*(.72*Math.sin(y*.117+x*.026-phase)+.28*Math.sin(y*.21+phase*1.43));
        const dy=strength*(.52*Math.cos(x*.076-y*.042-phase*.91)+.28*Math.cos(y*.137+phase));
        sample(source,warped.data,area.w,area.h,x+dx,y+dy,offset,smooth(.025,.86,envelope));
      }
      surfaceCtx.putImageData(warped,0,0);
      const [x,y]=shot.point(area.x/picture.naturalWidth,area.y/picture.naturalHeight);
      ctx.drawImage(surface,x,y,area.w/picture.naturalWidth*width*shot.zoom,
        area.h/picture.naturalHeight*height*shot.zoom);
    }
  }

  let seed=945275;
  const rand=()=>((seed=(Math.imul(seed,1664525)+1013904223)>>>0)/4294967296);
  const origin=[
    [.306,.704,.13], [.376,.691,.15], [.440,.725,.16], [.507,.755,.17],
    [.615,.763,.17], [.769,.764,.16], [.822,.764,.15], [.917,.742,.13],
  ];
  const {braceDuration}=SHOT_FOUR_TIMING;
  const initialBraceDuration=8;
  const count=16200;
  const alreadyRising=2480;
  function makeGroundedGrain(i,spawnAt) {
    const [u,v,radius]=origin[i%origin.length];
    const depth=rand(),mass=rand(),color=rand();
    const spill=rand()<.15;
    const sizeClass=rand();
    const coarseness=sizeClass<.67 ? 0 : sizeClass<.93 ? 1 : 2;
    const fineRadius=.42+1.05*mass+.34*depth;
    const radiusAtDepth=coarseness===0 ? fineRadius
      : coarseness===1 ? 1.02+1.55*mass+.47*depth : 2.02+1.84*mass+.87*depth;
    return {
      spawn:spawnAt(rand()),
      x:spill?.18+.70*rand():u+(rand()-.5)*radius,
      y:spill?.849+depth*.042:v+(depth-.35)*.079,
      phase:rand()*tau,drift:(rand()-.5)*49,
      life:1.67+rand()*1.93,
      speed:23+43*mass-6*coarseness,
      radius:radiusAtDepth,
      alpha:.30+.59*color,
      coarseness,
      color:coarseness===2 && color<.54 ? '#946a45' : color<.22?'#805639':color<.62?'#c69560':color<.91?'#e3b17b':'#f0c695',
    };
  }
  const groundedGrains=Array.from({length:count+alreadyRising},(_,i)=>
    // Pre-roll the rising sand on the cut into the close-up.
    makeGroundedGrain(i,jitter=>i<alreadyRising
      ? -1.37+1.32*(i+jitter)/alreadyRising
      : .13+(initialBraceDuration-.34)*((i-alreadyRising+jitter)/count)**.88));

  function withCeiling(grain) {
    const band=rand();
    const ceiling=band<.17 ? .094+.153*rand() : band<.40 ? .29+.31*rand() : null;
    return {...grain,ceiling,
      travelBeforeFade:grain.speed*(grain.life*.89)**1.17};
  }
  const motes=groundedGrains.map(withCeiling);
  function grains(time,shot) {
    const power=.82+.18*smooth(0,initialBraceDuration-.7,time);
    const [centerX]=shot.point(.57,.74);
    ctx.save();
    for(const m of motes) {
      const age=time-m.spawn;
      if(age<=0||age>=m.life)continue;
      const [originX,originY]=shot.point(m.x,m.y);
      const flow=(Math.sin(m.phase+age*1.79)-Math.sin(m.phase))*12;
      const bend=(centerX-originX)*.051*age;
      const x=originX+(m.drift*age*.58+flow+bend)*shot.zoom;
      const travel=m.speed*age**1.17*shot.zoom;
      // Upper trajectories enter this shot already airborne and keep the previous speed.
      const entryAltitude=m.ceiling===null ? 0 :
        Math.max(0,originY-height*m.ceiling-m.travelBeforeFade*shot.zoom);
      const y=originY-entryAltitude-travel;
      const opacity=smooth(0,.27,age)*(1-smooth(m.life*.75,m.life,age))
        *m.alpha*(.46+.54*power);
      const radius=m.radius*shot.zoom;
      drawGrain(m,x,y,radius,age,power,opacity);
    }
    ctx.restore();
  }

  function drawGrain(mote,x,y,radius,age,power,opacity) {
    ctx.fillStyle=mote.color;
    ctx.globalAlpha=opacity;
    ctx.beginPath();
    ctx.ellipse(x,y,radius*(.78+.05*mote.coarseness),radius*(1.08+power*.28-.13*mote.coarseness),
      .40*Math.sin(mote.phase+age),0,tau);
    ctx.fill();
  }

  const kneelDuration=SHOT_FOUR_TIMING.riseAt-SHOT_FOUR_TIMING.kneelAt;
  // Height in full-frame coordinates. Sand enters and exits beyond the horizontal edges.
  const kneelBand={top:.640,bottom:.869};
  const kneelPreRoll=4060;
  const kneelCount=7650;
  const kneelMotes=Array.from({length:kneelPreRoll+kneelCount},(_,i)=>{
    const style=groundedGrains[(i*37+847)%groundedGrains.length];
    const phase=rand();
    const spawn=i<kneelPreRoll ? -2.87+2.85*(i+phase)/kneelPreRoll
      : kneelDuration*(i-kneelPreRoll+phase)/kneelCount;
    const u=-.090+1.147*rand();
    const depth=rand();
    const v=.801+depth*.059+.010*Math.sin(u*tau*2+.8);
    const highest=rand()<.26 ? .638+.059*rand() : null;
    return {...style,spawn,x:u,y:v,ceiling:highest,
      travelBeforeFade:style.speed*(style.life*.89)**1.17};
  });

  // Continue at the original late-shot emission rate using new grain trajectories.
  const extension=braceDuration-initialBraceDuration;
  const lateRate=count/((initialBraceDuration-.34)*.88);
  const extraCount=Math.round(Math.max(0,extension)*lateRate);
  for(let i=0;i<extraCount;i++){
    const grain=makeGroundedGrain(i,jitter=>initialBraceDuration-.21+extension*(i+jitter)/extraCount);
    motes.push(withCeiling(grain));
  }

  function kneelGrains(time,shot) {
    const power=.93+.07*smooth(0,kneelDuration,time);
    const {top,bottom}=kneelBand;
    ctx.save();
    for(const mote of kneelMotes) {
      const age=time-mote.spawn;
      if(age<=0||age>=mote.life)continue;
      const [originX,originY]=shot.point(mote.x,mote.y);
      const drift=(mote.drift*.53+7)*age
        + 9*(Math.sin(mote.phase+age*1.63)-Math.sin(mote.phase));
      const x=originX+drift*shot.zoom;
      const entryAltitude=mote.ceiling===null ? 0 :
        Math.max(0,originY-height*mote.ceiling-mote.travelBeforeFade*shot.zoom);
      const y=originY-entryAltitude-mote.speed*age**1.17*shot.zoom;
      const v=y/height;
      if(x < -6 || x > width+6 || v<=top || v>=bottom)continue;
      const edge=smooth(top,top+.030,v)*(1-smooth(bottom-.015,bottom,v));
      const opacity=edge*smooth(0,.27,age)*(1-smooth(mote.life*.75,mote.life,age))
        *mote.alpha*(.46+.54*power);
      drawGrain(mote,x,y,mote.radius*1.06,age,power,opacity);
    }
    ctx.restore();
  }

  return {cloth,shimmer,grains,kneelGrains};
}
