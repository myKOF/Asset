'use strict';

function makeRiseScene(ctx,images,width,height) {
  const duration=SHOT_FOUR_TIMING.vistaAt-SHOT_FOUR_TIMING.riseAt;
  const tw=1280,th=720;
  const {rise:painting,riseDesert}=images;
  const w=painting.naturalWidth,h=painting.naturalHeight;
  const sx=w/tw,sy=h/th;
  const tau=2*Math.PI;
  const clamp=(value,min,max)=>Math.min(max,Math.max(min,value));
  const smooth=(a,b,x)=>{const t=clamp((x-a)/(b-a),0,1);return t*t*(3-2*t);};
  function layer() {
    const surface=document.createElement('canvas');
    surface.width=w;
    surface.height=h;
    return {surface,ink:surface.getContext('2d',{willReadFrequently:true})};
  }

  const shapes=RISE_MATTE.map(({path,cloth},index)=>({path:new Path2D(path),cloth,freeCape:index>=3&&index<=5}));
  const mask=layer();
  mask.ink.filter='blur(.68px)';
  mask.ink.scale(sx,sy);
  for(const {path} of shapes)mask.ink.fill(path,'evenodd');
  for(const {origin,scale,cuts,frays} of RISE_MATTE_REFINEMENTS) {
    mask.ink.save();
    mask.ink.translate(...origin);
    mask.ink.scale(scale,scale);
    mask.ink.filter='blur(.49px)';
    mask.ink.globalCompositeOperation='destination-out';
    for(const cut of cuts)mask.ink.fill(new Path2D(cut));
    mask.ink.globalCompositeOperation='source-over';
    for(const fray of frays)mask.ink.fill(new Path2D(fray));
    mask.ink.restore();
  }
  const subject=layer();
  subject.ink.drawImage(painting,0,0,w,h);
  subject.ink.globalCompositeOperation='destination-in';
  subject.ink.drawImage(mask.surface,0,0);
  subject.ink.globalCompositeOperation='source-over';
  // Recover thin dark threads while suppressing ochre sand left between them.
  const spill=layer();
  spill.ink.scale(sx,sy);
  spill.ink.translate(...RISE_SAND_SPILL.origin);
  spill.ink.scale(RISE_SAND_SPILL.scale,RISE_SAND_SPILL.scale);
  spill.ink.filter='blur(1px)';
  spill.ink.fill(new Path2D(RISE_SAND_SPILL.path));
  const subjectPixels=subject.ink.getImageData(0,0,w,h);
  const spillPixels=spill.ink.getImageData(0,0,w,h).data;
  for(let i=0;i<spillPixels.length;i+=4) {
    const strength=spillPixels[i+3]/255;
    const a=subjectPixels.data[i+3];
    if(strength===0||a===0)continue;
    const [red,green,blue]=subjectPixels.data.subarray(i,i+3);
    const ochre=smooth(34,42,red-green)*smooth(55,68,red-blue);
    subjectPixels.data[i+3]=a*(1-strength*ochre);
  }
  subject.ink.putImageData(subjectPixels,0,0);

  const fabricZones=[
    {x:522,y:150,rx:120,ry:41,angle:-.33,strength:7.9,phase:.36,root:647},
    {x:628,y:99,rx:83,ry:32,angle:-.27,strength:5.0,phase:.61,root:713},
    {x:338,y:328,rx:212,ry:66,angle:-.30,strength:11.4,phase:1.55,root:554},
    {x:228,y:390,rx:116,ry:41,angle:-.54,strength:20.0,phase:1.38,root:350},
    {x:305,y:347,rx:100,ry:28,angle:-.37,strength:10.8,phase:1.69,root:415},
    {x:296,y:500,rx:145,ry:103,angle:-.47,strength:12.3,phase:2.39,root:463},
    {x:361,y:567,rx:104,ry:72,angle:-.24,strength:9.4,phase:2.99,root:479},
    {x:529,y:386,rx:99,ry:32,angle:-.53,strength:6.1,phase:1.9,root:624},
    {x:676,y:419,rx:36,ry:88,angle:.21,strength:5.0,phase:2.95},
    {x:628,y:534,rx:54,ry:74,angle:-.13,strength:8.7,phase:3.5},
    {x:835,y:119,rx:54,ry:19,angle:-.61,strength:2.1,phase:4.2},
    {x:835,y:172,rx:28,ry:36,angle:.31,strength:2.4,phase:4.7},
  ];
  const hoodRim=new Path2D('M799 117 Q822 99 872 81 L890 89 884 106 857 110 839 118 823 133 809 149 795 141 Z');
  const cloth=makeFabricLayer(subject,w,h,sx,sy,layer,ink=>{
    ink.lineJoin='round';
    ink.lineWidth=12;
    for(const shape of shapes) {
      if(!shape.cloth)continue;
      ink.fill(shape.path,'evenodd');
      if(shape.freeCape)ink.stroke(shape.path);
    }
    ink.fill(hoodRim);
  },fabricZones);

  const stage=layer();
  stage.ink.drawImage(riseDesert,0,0,w,h);
  const original=layer();
  original.ink.drawImage(painting,0,0,w,h);
  const covered=layer();
  const repaint=new Path2D(`M145 436 Q171 399 235 355 Q251 278 341 265 L489 234 L440 201
    L489 142 L542 105 L595 107 L614 76 L672 56 L740 41 L760 53 L789 32
    L817 25 L855 28 L882 58 L898 102 L875 147 L850 180 L829 229 L810 245
    L813 295 L832 341 L848 381 L885 392 L912 460 L978 509 L1024 558
    L1113 645 L1104 686 L969 687 L871 657 L816 640 L767 643 L693 645
    L621 620 L582 658 L551 686 L413 685 L329 668 L213 630 L177 604 Z`);
  covered.ink.scale(sx,sy);
  covered.ink.lineWidth=27;
  covered.ink.lineJoin='round';
  covered.ink.fill(repaint);
  covered.ink.stroke(repaint);
  // Clear the painted ribbon under the moving cel, including the finest trailing threads.
  const tailClearance=new Path2D('M137 446 Q156 411 181 392 Q204 374 231 361 ' +
    'Q244 333 267 306 Q288 278 308 281 Q333 271 368 290 ' +
    'L365 344 Q332 374 304 401 Q278 421 228 436 L171 468 Z');
  covered.ink.fill(tailClearance);
  covered.ink.stroke(tailClearance);
  original.ink.filter='blur(14px)';
  original.ink.globalCompositeOperation='destination-out';
  original.ink.drawImage(covered.surface,0,0);
  stage.ink.drawImage(original.surface,0,0);

  // This inner plate carries the sand directly under the boots and the sword.
  const foreground=layer();
  foreground.ink.drawImage(stage.surface,0,0);
  foreground.ink.globalCompositeOperation='destination-in';
  const transition=layer();
  for(let x=0;x<w;x++) {
    const u=x/(w-1);
    const line=h*(.635+.027*Math.sin(u*tau-.82)+.012*Math.sin(u*2*tau+1.36));
    const alpha=transition.ink.createLinearGradient(0,line-43*sy,0,line+106*sy);
    alpha.addColorStop(0,'rgba(255,255,255,0)');
    alpha.addColorStop(.30,'rgba(255,255,255,.18)');
    alpha.addColorStop(.68,'rgba(255,255,255,.82)');
    alpha.addColorStop(1,'rgba(255,255,255,1)');
    transition.ink.fillStyle=alpha;
    transition.ink.fillRect(x,0,1,h);
  }
  foreground.ink.drawImage(transition.surface,0,0);
  foreground.ink.globalCompositeOperation='source-over';

  const blowingSand=makeRiseGust(ctx);
  const orbitSpeed=4;
  const distantTravel=33*orbitSpeed;
  const pivotX=635,pivotY=650;
  const rotation=time=>.0101*orbitSpeed*smooth(0,duration,time);
  function groundPoint(t,x,y) {
    const u=x-pivotX,v=y-pivotY;
    const angle=rotation(t),c=Math.cos(angle),s=Math.sin(angle);
    return [pivotX+u*c-v*s,pivotY+u*s+v*c];
  }
  function bladePoint(t,u) {
    return groundPoint(t,848+234*u,438+218*u);
  }

  let seed=9205171;
  const rand=()=>((seed=(Math.imul(seed,1664525)+1013904223)>>>0)/4294967296);
  const sandStart=.06,sandEnd=2.06;
  const sandClusters=Array.from({length:35},(_,i)=>({
    along:.055+.9*((i+rand())/35),
    at:sandStart+.76*rand()**1.7,
    width:.014+rand()*.034,
    hold:.05+rand()*.11,
  }));
  const sandColors=['#794f36','#956444','#ac7954','#c28b61','#d1a074','#dec09a'];
  const bladeSand=Array.from({length:2870},(_,i)=>{
    const group=sandClusters[i%sandClusters.length];
    const clump=rand()<.088;
    const mineral=rand();
    const start=group.at+(clump ? .20 : .40)*rand()**1.9;
    const slideTime=group.hold*(.7+.72*rand());
    const along=clamp(group.along+(rand()-.5)*group.width,.04,.96);
    const slide=clamp((.019+.037*rand())*(clump?1.24:1),0,.985-along);
    const fallAt=start+slideTime;
    const [baseX,baseY]=bladePoint(fallAt,along+slide);
    const [initialX,initialY]=[baseX+(rand()-.48)*5.2,baseY+(rand()-.25)*4.4];
    const floor=groundPoint(fallAt,baseX,643+.058*(baseX-840)+(rand()-.38)*18)[1];
    const speedX=(clump?8:15)+rand()*(clump?23:38);
    const speedY=clump?27+rand()*33:12+rand()*27;
    const gravity=(clump?440:335)+rand()*125;
    const fallHeight=Math.max(3,floor-initialY);
    const collision=(Math.sqrt(speedY*speedY+2*gravity*fallHeight)-speedY)/gravity;
    const radius=clump ? 1.03+rand()*1.58 : .27+rand()**2.1*1.12;
    const pigment=sandColors[Math.min(sandColors.length-1,Math.floor(mineral**1.42*sandColors.length))];
    return {clump,start,slideTime,along,slide,fallAt,initialX,initialY,speedX,speedY,gravity,
      collision,radius,pigment,opacity:.35+rand()*.51,spin:(rand()-.5)*8,phase:rand()*tau};
  });
  const footSand=Array.from({length:520},(_,i)=>{
    const near=i%3!==2;
    return {
      start:(near?.30:.65)+.87*rand(), x:(near?461:745)+(rand()-.5)*95,
      y:(near?662:625)+(rand()-.5)*11, horizontal:(rand()-.36)*62,
      lift:20+rand()*62, gravity:112+rand()*60,
      radius:.33+rand()*1.25,alpha:.22+rand()*.42,
    };
  });
  const lightOpacity=.35;
  const lightMoteStart=.16;
  const lightMoteRamp=4-lightMoteStart;
  const lightMoteSpan=duration-.6;
  const lightMoteRate=132/lightMoteSpan;
  const lightMotesDuringRamp=1.5*lightMoteRate*lightMoteRamp;
  const lightMoteCount=Math.floor(lightMotesDuringRamp+2*lightMoteRate*(lightMoteSpan-lightMoteRamp));
  const lightMotePasses=3;
  // Seed the motes along the shoulder, cuirass, forearm, and greaves.
  const lightOrigins=[
    [725,142,34,26], [686,225,32,36], [637,310,42,34],
    [789,330,23,37], [566,433,37,33], [521,552,23,38],
    [743,562,23,36]
  ];
  const lightMotes=Array.from({length:lightMoteCount},(_,i)=>{
    const [x,y,rx,ry]=lightOrigins[i%lightOrigins.length];
    const angle=rand()*tau;
    const distance=Math.sqrt(rand());
    // Invert the cumulative emission rate so each mote starts on the armor.
    const emission=i+rand();
    const elapsed=emission<lightMotesDuringRamp
      ? lightMoteRamp*(Math.sqrt(1+2*emission/(lightMoteRate*lightMoteRamp))-1)
      : lightMoteRamp+(emission-lightMotesDuringRamp)/(2*lightMoteRate);
    return {
      x:x+Math.cos(angle)*rx*distance, y:y+Math.sin(angle)*ry*distance,
      born:lightMoteStart+elapsed,
      life:1.55+1.3*rand(), rise:27+22*rand(), drift:4+9*rand(),
      radius:.65+rand()**1.7*1.47, opacity:.34+.46*rand(), phase:rand()*tau
    };
  });
  const lightSprite=document.createElement('canvas');
  lightSprite.width=48;
  lightSprite.height=48;
  const lightInk=lightSprite.getContext('2d');
  const lightGradient=lightInk.createRadialGradient(24,24,0,24,24,24);
  lightGradient.addColorStop(0,'#fffef9');
  lightGradient.addColorStop(.21,'rgba(255,255,250,.84)');
  lightGradient.addColorStop(.43,'rgba(250,250,255,.32)');
  lightGradient.addColorStop(1,'rgba(250,250,255,0)');
  lightInk.fillStyle=lightGradient;
  lightInk.fillRect(0,0,48,48);

  function contact(x,y,rx,ry,opacity) {
    ctx.save();
    ctx.translate(x,y);
    ctx.scale(rx,ry);
    const gradient=ctx.createRadialGradient(0,0,0,0,0,1);
    gradient.addColorStop(0,'rgba(28,16,13,'+opacity+')');
    gradient.addColorStop(.6,'rgba(28,16,13,'+(opacity*.5)+')');
    gradient.addColorStop(1,'rgba(28,16,13,0)');
    ctx.fillStyle=gradient;
    ctx.fillRect(-1,-1,2,2);
    ctx.restore();
  }

  function drawBladeSand(t) {
    if(t<sandStart||t>=sandEnd)return;
    const fade=1-smooth(1.76,sandEnd,t);
    for(const mote of bladeSand) {
      if(t<mote.start)continue;
      const age=t-mote.fallAt;
      let x,y,opacity;
      if(age<0) {
        const sliding=(t-mote.start)/mote.slideTime;
        [x,y]=bladePoint(t,mote.along+mote.slide*sliding**1.45);
        opacity=mote.opacity*.83*smooth(0,.24,sliding);
      } else if(age<mote.collision) {
        const turbulence=mote.clump?0:2.8*Math.sin(age*14+mote.phase)*smooth(.08,.45,age);
        x=mote.initialX+mote.speedX*age+(mote.clump?3:14)*age*age+turbulence;
        y=mote.initialY+mote.speedY*age+.5*mote.gravity*age*age;
        opacity=mote.opacity;
      } else {
        const rebound=age-mote.collision;
        const settling=mote.clump?.23:.115;
        if(rebound>=settling)continue;
        const durationFraction=rebound/settling;
        const drop=mote.collision;
        x=mote.initialX+mote.speedX*drop+(mote.clump?3:14)*drop*drop+mote.speedX*rebound*.54;
        const kick=(mote.clump?4.4:1.8)*Math.sin(Math.PI*durationFraction);
        y=mote.initialY+mote.speedY*drop+.5*mote.gravity*drop*drop-kick;
        opacity=mote.opacity*(1-smooth(0,1,durationFraction))*.77;
      }
      ctx.globalAlpha=opacity*fade;
      ctx.fillStyle=mote.pigment;
      const radius=mote.radius;
      ctx.beginPath();
      if(mote.clump){
        const r=mote.phase+Math.max(0,age)*mote.spin;
        const facets=[1.14,.76,.92,.64,1];
        for(let i=0;i<facets.length;i++){
          const angle=r+i*tau/facets.length;
          const px=x+Math.cos(angle)*radius*facets[i];
          const py=y+Math.sin(angle)*radius*facets[i]*1.05;
          if(i===0)ctx.moveTo(px,py);
          else ctx.lineTo(px,py);
        }
        ctx.closePath();
      }else{
        const stretch=1+.64*smooth(.04,.62,age);
        ctx.ellipse(x,y,radius*.84,radius*stretch,-.11,0,tau);
      }
      ctx.fill();
    }
  }

  function grains(t,shift) {
    ctx.save();
    drawBladeSand(t);
    for(const mote of footSand) {
      const age=t-mote.start;
      if(age<0||age>.99)continue;
      const height=mote.lift*age-mote.gravity*age*age;
      if(height<0)continue;
      ctx.globalAlpha=mote.alpha*smooth(0,.10,age)*(1-smooth(.24,.98,age));
      ctx.fillStyle='#d4a374';
      ctx.beginPath();
      ctx.ellipse(mote.x+mote.horizontal*age+shift,mote.y-height,mote.radius,mote.radius*.8,-.24,0,tau);
      ctx.fill();
    }
    ctx.restore();
  }

  function drawRadiance(time) {
    const energy=smooth(0,6,time);
    if(energy<=0)return;
    ctx.save();
    ctx.globalCompositeOperation='screen';
    ctx.filter='brightness(0) invert(1) blur(24px)';
    ctx.globalAlpha=energy*lightOpacity*.24;
    ctx.drawImage(cloth.surface,0,0,tw,th);
    ctx.filter='brightness(0) invert(1) blur(8px)';
    ctx.globalAlpha=energy*lightOpacity*.60;
    ctx.drawImage(cloth.surface,0,0,tw,th);
    ctx.filter='none';
    ctx.globalAlpha=energy*lightOpacity*.16;
    ctx.drawImage(cloth.surface,0,0,tw,th);
    ctx.restore();
  }

  function drawLightMotes(time) {
    ctx.save();
    ctx.globalCompositeOperation='screen';
    const finish=1-smooth(duration-.6,duration,time);
    for(const mote of lightMotes) {
      const age=time-mote.born;
      if(age<=0||age>=mote.life)continue;
      const progress=age/mote.life;
      const sway=3.5*(Math.sin(age*1.45+mote.phase)-Math.sin(mote.phase));
      const x=mote.x-mote.drift*age+sway*smooth(0,.55,age);
      const y=mote.y-mote.rise*age-5*progress*progress;
      const radius=mote.radius*2.3*(1+.28*progress);
      ctx.globalAlpha=mote.opacity*finish*smooth(0,.22,progress)*(1-smooth(.5,1,progress));
      for(let pass=0;pass<lightMotePasses;pass++) {
        ctx.drawImage(lightSprite,x-radius,y-radius,radius*2,radius*2);
      }
    }
    ctx.restore();
  }

  function draw(time) {
    const progress=smooth(0,duration,time);
    const zoom=.913;
    const left=width*.049,top=height*.058;
    const wide=width*zoom,tall=height*zoom;
    const distantLeft=-13,distantWidth=width+26+distantTravel;
    ctx.drawImage(stage.surface,distantLeft-distantTravel*progress,top,distantWidth,tall);

    ctx.save();
    ctx.translate(left,top);
    ctx.scale(wide/tw,tall/th);
    cloth.draw(time,RISE_WIND.strength(time));

    ctx.save();
    ctx.translate(pivotX,pivotY);
    ctx.rotate(rotation(time));
    const floorLeft=(distantLeft-left)*tw/wide;
    const floorWidth=distantWidth*tw/wide;
    ctx.drawImage(foreground.surface,floorLeft-pivotX,-pivotY,floorWidth,th);
    ctx.translate(-pivotX,-pivotY);
    contact(470,668,118,17,.62);
    contact(765,628,99,16,.45);
    contact(590,644,210,25,.29);
    contact(1082,665,42,10,.32);
    ctx.drawImage(cloth.surface,0,0,tw,th);
    drawRadiance(time);
    drawLightMotes(time);
    ctx.restore();

    grains(time,14*orbitSpeed*progress);
    blowingSand.draw(time);
    ctx.restore();
  }

  return {draw};
}
