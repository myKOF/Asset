'use strict';

function makeCinematics(ctx, images, width, height, renderGold) {
  const twicePi = Math.PI * 2;
  const braceEffects=makeBraceEffects(ctx,images.brace,width,height);
  const kneelOrbit=makeKneelOrbit(ctx,images,width,height);
  const riseScene=makeRiseScene(ctx,images,width,height);
  const clamp = x => Math.max(0, Math.min(1, x));
  function ease(a,b,t) { const x = clamp((t-a)/(b-a)); return x*x*(3-2*x); }
  const lerp = (a,b,t) => a+(b-a)*t;
  const gradient = (strength, color) => 'rgba('+color+','+clamp(strength)+')';

  function imageFrame(image, x=.5, y=.5, zoom=1, panX=0, panY=0) {
    const w=width*zoom, h=height*zoom;
    const left=width*(x*(1-zoom)+panX), top=height*(y*(1-zoom)+panY);
    ctx.drawImage(image,left,top,w,h);
    // Extend only the sliver outside the artwork on wider compositions.
    if (left > 0) {
      ctx.save(); ctx.translate(left,top); ctx.scale(-1,1);
      ctx.drawImage(image,0,0,w,h); ctx.restore();
    }
    if (left+w < width) {
      ctx.save(); ctx.translate(left+w,top); ctx.scale(-1,1);
      ctx.drawImage(image,-w,0,w,h); ctx.restore();
    }
    return {
      point(u,v) { return [left + u*w, top + v*h]; },
      zoom,
    };
  }

  function bloom(x,y,rx,ry,opacity,rgb) {
    ctx.save(); ctx.translate(x,y); ctx.scale(rx,ry);
    const fade=ctx.createRadialGradient(0,0,0,0,0,1);
    fade.addColorStop(0,gradient(opacity,rgb));
    fade.addColorStop(.28,gradient(opacity*.55,rgb));
    fade.addColorStop(.63,gradient(opacity*.16,rgb));
    fade.addColorStop(1,gradient(0,rgb));
    ctx.fillStyle=fade; ctx.fillRect(-1,-1,2,2);
    ctx.restore();
  }
  const goldFlare=document.createElement('canvas');
  goldFlare.width=images.flare.naturalWidth;
  goldFlare.height=images.flare.naturalHeight;
  const goldInk=goldFlare.getContext('2d');
  goldInk.drawImage(images.flare,0,0);
  goldInk.globalCompositeOperation='multiply';
  goldInk.fillStyle='#ffcc56';
  goldInk.fillRect(0,0,goldFlare.width,goldFlare.height);
  goldInk.globalCompositeOperation='destination-in';
  goldInk.drawImage(images.flare,0,0);

  function flare(x,y,w,h,opacity,angle=0) {
    if (opacity<=0) return;
    ctx.save();
    ctx.globalCompositeOperation='screen';
    ctx.globalAlpha=clamp(opacity);
    ctx.translate(x,y); ctx.rotate(angle);
    ctx.drawImage(goldFlare,-w/2,-h/2,w,h);
    ctx.restore();
  }

  function seeded(seed) {
    return () => ((seed=(Math.imul(seed,1664525)+1013904223)>>>0)/4294967296);
  }
  const rand=seeded(473773);
  const grains=Array.from({length:118},()=>[rand(),rand(),rand(),rand(),rand()]);
  function wind(t, strength=1, direction=-1) {
    for(const [a,b,c,d,e] of grains) {
      const u=((a+direction*(.02+.12*c)*t+50)%1.22)-.11;
      const v=.17+b*.71 + .013*Math.sin(t*1.65+a*twicePi);
      const alpha=(.045+.23*d)*(.61+.39*Math.sin(t*1.34+e*twicePi)**2)*strength;
      ctx.fillStyle=gradient(alpha,'229,184,132');
      ctx.beginPath();
      ctx.ellipse(u*width,v*height,.58+c*2.85,.37+c*.59,-.24,0,twicePi);
      ctx.fill();
    }
  }
  function sandTumble(t,shot,start,u,v,amount) {
    const [x,y]=shot.point(u,v);
    for(const [a,b,c,d,e] of grains.slice(0,72)) {
      const dt=t-start-a*.34;
      if(dt<=0||dt>=1.49) continue;
      const dx=(b-.69)*(29+dt*(76+62*d));
      const dy=(c-.52)*16-dt*(16+64*b)+dt*dt*(24+16*d);
      const alpha=amount*(.19+.81*e)*ease(0,.19,dt)*(1-ease(.19,1.49,dt));
      ctx.fillStyle=gradient(alpha,'215,163,111');
      ctx.beginPath();
      ctx.ellipse(x+dx,y+dy,1+d*3.4,d*1.8+.55,-.27,0,twicePi);
      ctx.fill();
    }
  }

  function cloth(rootX,rootY,span,rotation,windTime,brightness) {
    const picture=images.cloth;
    const tall=span*picture.naturalHeight/picture.naturalWidth;
    const fixedX=.977*span, fixedY=.145*tall;
    const gust=Math.sin(windTime*1.91)+.40*Math.sin(windTime*3.61+1.15);
    ctx.save();
    ctx.translate(rootX,rootY);
    ctx.rotate(rotation+gust*.085);
    ctx.scale(1,.93+Math.sin(windTime*2.22+.54)*.10);
    ctx.filter='brightness('+brightness+') saturate(0.83)';
    ctx.drawImage(picture,-fixedX,-fixedY,span,tall);
    ctx.restore();
  }

  function goldTransition(t) {
    const {canvas,x,y}=renderGold(t);
    ctx.drawImage(canvas,0,0,width,height);
    const p=t/SHOT_FOUR_TIMING.braceAt;
    const expansion=p**1.08;
    const energy=p**.86*(1-.52*ease(.73,1,p));
    ctx.save();
    ctx.globalCompositeOperation='screen';
    bloom(x,y,lerp(242,1630,expansion),lerp(175,880,expansion),.61*energy,'255,186,58');
    bloom(x,y,lerp(102,950,expansion),lerp(79,605,expansion),.88*energy,'255,220,125');
    ctx.restore();
    flare(x,y,lerp(1050,3180,expansion),lerp(580,1880,expansion),.38*energy,-.17+.025*p);
    flare(x,y,lerp(750,2690,expansion),lerp(530,1495,expansion),.21*energy,.29+.056*p);

    const wash=0.73*p**1.19+0.27*ease(.39,1,p);
    const reach=lerp(325,width*1.28,expansion);
    const veil=ctx.createRadialGradient(x,y,0,x,y,reach);
    veil.addColorStop(0,gradient(wash,'255,241,184'));
    veil.addColorStop(.47,gradient(wash*.96,'255,224,148'));
    veil.addColorStop(.78,gradient(wash*.62,'255,207,123'));
    veil.addColorStop(1,gradient(0,'247,181,92'));
    ctx.fillStyle=veil;
    ctx.fillRect(0,0,width,height);
  }

  function restScene(name,t) {
    let view;
    if (name==='brace') {
      view=imageFrame(images.brace,.61,.64,lerp(1.047,1.092,ease(0,SHOT_FOUR_TIMING.braceDuration,t)),.009,-.012);
      braceEffects.shimmer(t,view);
      braceEffects.cloth(t,view);
      sandTumble(t,view,.31,.588,.716,.54);
      sandTumble(t,view,1.98,.600,.715,.19);
      braceEffects.grains(t,view);
    } else if (name==='kneel') {
      view=kneelOrbit.draw(t,imageFrame);
      sandTumble(t,view,.21,.430,.783,.30);
      sandTumble(t,view,1.35,.710,.762,.41);
      braceEffects.kneelGrains(t,view);
    } else if (name==='rise') {
      riseScene.draw(t);
    } else {
      view=imageFrame(images.vista,.51,.54,lerp(1.106,1.015,ease(0,6.1,t)),.007,-.018);
      const [x,y]=view.point(.427,.494);
      cloth(x,y,302*view.zoom,-.42,t+1.47,.70);
      sandTumble(t,view,1.92,.468,.899,.66);
    }
    wind(t,.89,name==='kneel' ? 1 : -1);
  }

  return { goldTransition,restScene };
}
