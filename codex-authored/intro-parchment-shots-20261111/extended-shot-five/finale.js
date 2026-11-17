'use strict';

(() => {
  const DURATION=9, w=1672, h=941;
  const ctx=document.querySelector('canvas').getContext('2d',{alpha:false});
  const displayW=ctx.canvas.width, displayH=ctx.canvas.height;
  const clamp=t=>Math.min(1,Math.max(0,t));
  const mix=(a,b,t)=>a+(b-a)*t;
  const smooth=(a,b,t)=>{const q=clamp((t-a)/(b-a));return q*q*(3-2*q);};
  function rnd(seed) {
    return ()=>(seed=(Math.imul(seed,1664525)+1013904223)>>>0)/4294967296;
  }
  function canvas(width=w,height=h) {
    const element=document.createElement('canvas');
    element.width=width;element.height=height;
    return element.getContext('2d');
  }
  const refs={
    original:'../extended-shot-four/assets/vista.png', plate:'assets/vista-clean.png', demons:'../source/assets/demons.png',
    air:'../source/assets/air-demon-atlas.png',smoke:'../source/assets/collapse-smoke.png',flare:'../extended-shot-four/assets/flare.png'
  };
  const state={duration:DURATION};
  window.openingShot=state;

  function masked(source, mask) {
    const c=canvas();
    c.drawImage(source,0,0,w,h);
    c.globalCompositeOperation='destination-in';
    mask(c);
    return c.canvas;
  }
  function phaseFrame(t) {
    const u=clamp(t/8.70);
    const turn=u*(1.57-.57*u);
    return Object.freeze({sky:-34*turn,gate:-72*turn,middle:0,near:70*turn});
  }
  state.parallaxAt=phaseFrame;

  state.ready=Promise.all(Object.entries(refs).map(async ([key,file])=>{
    const art=new Image();art.src=file;
    await art.decode();
    return [key,art];
  })).then(entries=>{
    const images=Object.fromEntries(entries);
    const gateShape=new Path2D('M777 375 L851 309 L928 286 L961 227 L1015 196 L1045 145 L1070 88 L1124 62 L1170 30 L1310 33 L1469 41 L1514 109 L1546 175 L1607 214 L1672 156 L1672 490 L1477 479 L1264 472 L1007 485 L795 477 Z');
    const shape=Object.fromEntries(Object.entries(FINALE_CUTOUTS).filter(([name])=>name!=='gaps').map(([name,value])=>[name,new Path2D(value)]));
    const gaps=FINALE_CUTOUTS.gaps.map(path=>new Path2D(path));
    const fx=makeFinaleFx(images,{w,h,canvas,rnd,smooth,mix});

    const drawBackdrop=makeFinaleBackdrop(images.plate,gateShape,{w,h,canvas});

    const matte=canvas();
    matte.filter='blur(.53px)';
    matte.fill(shape.armor);
    matte.fill(shape.sword);
    matte.globalCompositeOperation='destination-out';
    for (const gap of gaps) matte.fill(gap);
    const figure=masked(images.original,m=>m.drawImage(matte.canvas,0,0));
    const cloth=[
      {image:masked(images.original,m=>{m.filter='blur(.50px)';m.fill(shape.shoulder,'evenodd');}),
        low:489, high:717, anchor:635, y:309, force:38, flutter:25, phase:1.32},
      {image:masked(images.original,m=>{m.filter='blur(.49px)';m.fill(shape.skirt,'evenodd');}),
        low:404, high:770, anchor:679, y:568, force:70, flutter:41, phase:.4}
    ];

    function moveCloth(c,t,shift) {
      const gust=fx.wind(t);
      for (const item of cloth) {
        function bend(x) {
          const flex=clamp((item.anchor-x)/(item.anchor-item.low))**1.28;
          const phase=t*5.75+x*.025+item.phase;
          const flag=Math.sin(phase)*.67+.33*Math.sin(phase*1.81+.39);
          const pull=item.force*(.44+.56*gust)*flex;
          return [x-pull*(.87+.13*Math.sin(phase*.71)), flex*(-gust*25+flag*item.flutter)];
        }
        c.save();
        c.translate(shift,0);
        const step=8;
        for (let u=item.low;u<item.high;u+=step) {
          const b=bend(u), n=bend(u+step);
          const sx=(n[0]-b[0])/step, sy=(n[1]-b[1])/step;
          c.save();
          c.transform(sx,sy,0,1,b[0]-u*sx,b[1]-u*sy);
          c.drawImage(item.image,u,0,step+.65,h,u,0,step+.65,h);
          c.restore();
        }
        c.restore();
      }
    }

    function shadow(near) {
      ctx.save();ctx.translate(735+near,851);ctx.scale(126,24);
      const g=ctx.createRadialGradient(0,0,.07,0,0,1);
      g.addColorStop(0,'rgba(34,18,15,.64)');
      g.addColorStop(.53,'rgba(46,25,19,.35)');
      g.addColorStop(1,'rgba(48,28,19,0)');
      ctx.fillStyle=g;ctx.fillRect(-1,-1,2,2);ctx.restore();
    }
    function render(t) {
      t=Math.max(0,Math.min(t,DURATION));
      const p=phaseFrame(t);
      ctx.fillStyle='#0b0807';ctx.fillRect(0,0,displayW,displayH);
      ctx.save();
      ctx.beginPath();ctx.rect(0,90,displayW,900);ctx.clip();
      ctx.imageSmoothingQuality='high';
      const zoom=1.015;
      ctx.translate(displayW*(.51*(1-zoom)+.007),displayH*(.54*(1-zoom)-.018));
      ctx.scale(zoom*displayW/w,zoom*displayH/h);
      drawBackdrop(ctx,p);
      fx.sunset(ctx,t,p.gate);
      fx.army(ctx,t,p.gate,p.sky);
      fx.distantDust(ctx,t,p.gate);
      fx.gale(ctx,t,false);
      shadow(p.near);
      ctx.drawImage(figure,p.near,0,w,h);
      moveCloth(ctx,t,p.near);
      fx.gale(ctx,t,true);
      ctx.restore();

      ctx.save();
      ctx.beginPath();ctx.rect(0,90,displayW,900);ctx.clip();
      const vignette=ctx.createRadialGradient(displayW*.51,displayH*.50,424,displayW*.51,displayH*.52,1140);
      vignette.addColorStop(0,'rgba(10,6,7,0)');
      vignette.addColorStop(.55,'rgba(16,9,10,.11)');
      vignette.addColorStop(1,'rgba(9,5,7,.39)');
      ctx.fillStyle=vignette;ctx.fillRect(0,0,displayW,displayH);
      ctx.restore();
      const fade=smooth(7.90,8.98,t);
      if(fade>0) {
        ctx.fillStyle='rgba(0,0,0,'+fade+')';
        ctx.fillRect(0,0,displayW,displayH);
      }
    }
    state.render=render;
    state.army={ground:fx.groundCount,air:fx.airCount,wingFrames:fx.wingFrames};
    render(0);
    if (new URLSearchParams(location.search).has('capture')) {
      document.documentElement.classList.add('capture');
      return;
    }
    const play=document.querySelector('button');
    const input=document.querySelector('input');
    const time=document.querySelector('output');
    const audio=document.querySelector('audio');
    input.max=String(DURATION);
    play.disabled=input.disabled=false;
    let elapsed=0, running=false, handle=0, start=0;
    function present(t) {
      elapsed=Math.min(DURATION,t);render(elapsed);
      input.valueAsNumber=elapsed;time.value=elapsed.toFixed(2)+' 秒';
    }
    function pause() {
      running=false;cancelAnimationFrame(handle);audio.pause();play.textContent='播放';
    }
    function tick(now) {
      present((now-start)/1000);
      if(elapsed>=DURATION)pause();else handle=requestAnimationFrame(tick);
    }
    play.addEventListener('click',()=>{
      if(running){pause();return;}
      if(elapsed>=DURATION)present(0);
      audio.currentTime=elapsed;audio.play().catch(()=>{});
      running=true;play.textContent='暫停';
      start=performance.now()-elapsed*1000;
      handle=requestAnimationFrame(tick);
    });
    input.addEventListener('input',()=>{pause();present(input.valueAsNumber);});
    document.addEventListener('visibilitychange',()=>{if(document.hidden&&running)pause();});
  });
})();
