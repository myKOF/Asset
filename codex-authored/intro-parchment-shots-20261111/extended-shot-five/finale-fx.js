'use strict';

function makeFinaleFx(images, { w, h, canvas, rnd, smooth, mix }) {
  const rand = rnd(51037);
  const tau = Math.PI * 2;
  function wind(t) {
    return .43 + .54 * Math.exp(-((t - 2.05) ** 2) / .52) +
      .55 * Math.exp(-((t - 4.70) ** 2) / .79) + .48 * Math.exp(-((t - 7.0) ** 2) / .64);
  }
  function tint(img, color, opacity) {
    const c = canvas(img.naturalWidth, img.naturalHeight);
    c.drawImage(img, 0, 0);
    c.globalCompositeOperation = 'source-atop';
    c.fillStyle = color;
    c.globalAlpha = opacity;
    c.fillRect(0, 0, c.canvas.width, c.canvas.height);
    return c.canvas;
  }
  const smoke = tint(images.smoke, '#a8794f', .46);
  const warmSmoke = tint(images.smoke, '#d3a775', .49);
  const ground = tint(images.demons, '#3e2623', .58);
  const flying = tint(images.air, '#382325', .69);
  const flare = tint(images.flare, '#ffd18a', .66);
  const infantry = [[93,5,424,593], [672,79,537,506], [92,621,403,621], [643,671,547,573]];

  // Each sprite sheet entry is cropped once. The baked frames keep the torso still
  // while the wing joints lead the flexible tips through the upstroke and downstroke.
  const wingFrames = 16;
  const wingAtlas = [
    { rect:[12,9,509,513], root:.55, swing:.22 },
    { rect:[546,9,521,465], root:.55, swing:.24 },
    { rect:[1099,43,410,449], root:.54, swing:.26 }
  ].map(({rect:[sx,sy,sw,sh],root,swing})=>{
    const spriteW=148, spriteH=Math.round(spriteW*sh/sw);
    const padY=38, padX=20;
    const source=canvas(spriteW,spriteH);
    source.imageSmoothingQuality='high';
    source.drawImage(flying,sx,sy,sw,sh,0,0,spriteW,spriteH);
    const frames=Array.from({length:wingFrames},(_,index)=>{
      const c=canvas(spriteW+2*padX,spriteH+2*padY);
      const phase=index/wingFrames*tau;
      function joint(x) {
        const u=x/spriteW-root;
        const side=Math.sign(u);
        const reach=side<0?root:1-root;
        const tip=smooth(.105,reach,Math.abs(u));
        const lead=phase-tip*.72+(side>0?.13:0);
        const down=Math.sin(lead), fold=(1-down)*.5;
        return { x:x-side*spriteW*tip*(.104*fold+.019*tip),
          y:padY+swing*spriteH*tip*(down+.17*Math.sin(lead*2)),
          height:1-.20*tip*fold };
      }
      const stride=4;
      for (let x=0;x<spriteW;x+=stride) {
        const next=Math.min(x+stride,spriteW);
        const a=joint(x), b=joint(next);
        const scaleX=(b.x-a.x)/(next-x);
        const dy=(b.y-a.y)/(next-x);
        c.save();
        c.transform(scaleX,dy,0,(a.height+b.height)*.5,padX+a.x-x*scaleX,a.y-x*dy);
        const strip=Math.min(next-x+.55,spriteW-x);
        c.drawImage(source.canvas,x,0,strip,spriteH,x,0,strip,spriteH);
        c.restore();
      }
      return c.canvas;
    });
    return { frames, spriteW, spriteH, padX, padY, root };
  });
  const positions = [
    [1037,416,18],[1064,414,15],[1088,424,22],[1112,417,20],[1130,431,26],
    [1164,422,19],[1181,437,25],[1218,422,22],[1237,431,18],[1262,419,13],[1288,417,14],
    [1313,422,16],[1346,425,19],[1368,428,21],[1393,431,24],[1419,442,27],
    [1454,437,18],[1480,445,24],[1511,447,31],[1536,437,20],[1576,448,24],[1612,454,22],
    [1165,454,51],[1432,460,60]
  ];
  const airPositions = [
    [995,242,31,2],[1059,221,38,1],[1111,231,29,2],[1165,142,43,0],
    [1266,245,25,2],[1315,288,31,1],[1360,234,29,2],
    [1450,153,53,0],[1518,191,40,1],[1593,236,29,2]
  ];
  const soldiers = positions.map(([x,y,height],i)=>({x,y,height,pose:i%4,phase:rand()*tau,flip:rand()<.5?-1:1}));
  const flight = airPositions.map(([x,y,width,pose],i)=>({x,y,width,pose,phase:rand()*tau,flip:i%3?-1:1}));
  const dust = Array.from({length: 590},()=>({
    x: rand()*(w+360), y: rand(), phase: rand()*tau, speed:rand(),
    size:rand()**2, light:rand(), roll:rand(), depth:rand()
  }));
  const stones = Array.from({length: 32},()=>({
    x: rand(), depth: rand(), phase: rand()*tau, speed: rand(), size: rand()
  }));
  const streaks = [
    [540, 1910, 1210, 127, 259, .18, 1], [601, 2540, 1470, 193, 333,.15,-1],
    [706, 1530, 1380, 173, 377,.24, 1], [779, 2380, 1400, 216, 448,.22,-1],
    [865, 1990, 1430, 211, 516,.26, 1], [913, 2810, 1660, 228, 606,.22,-1]
  ];

  function bloom(ctx,x,y,rx,ry,color,opacity) {
    ctx.save();
    ctx.translate(x,y);ctx.scale(rx,ry);
    const g=ctx.createRadialGradient(0,0,0,0,0,1);
    g.addColorStop(0,'rgba('+color+','+opacity+')');
    g.addColorStop(.33,'rgba('+color+','+opacity*.57+')');
    g.addColorStop(.72,'rgba('+color+','+opacity*.12+')');
    g.addColorStop(1,'rgba('+color+',0)');
    ctx.fillStyle=g;
    ctx.fillRect(-1,-1,2,2);
    ctx.restore();
  }

  function sunset(ctx,t,shift) {
    const strength=.81+.19*smooth(0,2.5,t);
    const x=1294+shift;
    ctx.save();
    ctx.globalCompositeOperation='screen';
    bloom(ctx,x,167,390,262,'234,130,39',.24*strength);
    bloom(ctx,x,249,204,190,'255,193,71',.37*strength);
    ctx.save();
    ctx.translate(shift,0);
    const opening = new Path2D('M1246 406 Q1244 337 1243 275 Q1245 223 1289 188 Q1340 210 1364 279 L1375 399 Q1300 430 1246 406 Z');
    ctx.clip(opening);
    bloom(ctx,1297,241,110,119,'255,196,73',.75*strength);
    bloom(ctx,1293,225,59,49,'255,248,170',.58*strength);
    bloom(ctx,1297,233,33,22,'255,246,188',.58*strength);
    const ray=ctx.createLinearGradient(1300,227,1210,454);
    ray.addColorStop(0,'rgba(255,228,139,'+(.28*strength)+')');
    ray.addColorStop(1,'rgba(255,223,149,0)');
    ctx.fillStyle=ray;
    ctx.fill(new Path2D('M1289 222 L1319 228 L1343 419 L1247 430 Z M1291 221 L1303 225 L1271 414 L1255 413 Z'));
    ctx.restore();
    ctx.globalAlpha=.22*strength;
    ctx.drawImage(flare,x-148,177,296,126);
    ctx.globalAlpha=1;
    bloom(ctx,x,415,180,64,'255,193,107',.28*strength);
    ctx.restore();
  }

  function army(ctx,t,gateShift,skyShift) {
    ctx.save();
    ctx.imageSmoothingQuality='high';
    for (const u of soldiers) {
      const position = u.x + gateShift + Math.sin(t*.85+u.phase)*1.8 - t*.23;
      const foot = u.y + t*.38;
      const [sx,sy,sw,sh] = infantry[u.pose];
      const width = u.height*sw/sh;
      ctx.save();
      ctx.translate(position,foot);
      ctx.scale(u.flip,1);
      ctx.globalAlpha=.62+u.height*.0036;
      ctx.filter='blur('+mix(.84,.26,smooth(15,55,u.height))+'px)';
      ctx.drawImage(ground,sx,sy,sw,sh,-width/2,-u.height,width,u.height);
      ctx.restore();
      bloom(ctx,position,foot+1,width*.73,2.6,'58,34,26',.33);
    }
    for(const u of flight) {
      const rhythm=t*(.73+u.pose*.10)+u.phase/tau;
      const beat=rhythm-Math.floor(rhythm);
      const sequence=wingAtlas[u.pose];
      const sprite=sequence.frames[Math.floor(beat*wingFrames)];
      const scale=u.width*(1+.02*Math.sin(t+u.phase))/sequence.spriteW;
      const wave=Math.sin(beat*tau);
      ctx.save();
      ctx.translate(u.x+skyShift*.5-t*(2.6+u.pose*.45)+Math.sin(t+u.phase)*3.7,
        u.y+Math.sin(t*1.42+u.phase)*5.4-wave*1.65);
      ctx.rotate(.048*Math.sin(t*.9+u.phase));
      ctx.scale(u.flip,1);
      ctx.globalAlpha=.78;
      ctx.filter='blur(.52px)';
      ctx.drawImage(sprite,-(sequence.padX+sequence.spriteW*sequence.root)*scale,
        -(sequence.padY+sequence.spriteH*.43)*scale,sprite.width*scale,sprite.height*scale);
      ctx.restore();
    }
    ctx.restore();
  }

  function bank(ctx,img,x,y,width,height,opacity,flip,slant) {
    ctx.save();
    ctx.globalAlpha=opacity;
    ctx.translate(x,y);ctx.rotate(slant);ctx.scale(flip,1);
    ctx.drawImage(img,-width/2,-height/2,width,height);
    ctx.restore();
  }

  function distantDust(ctx,t,gateShift) {
    const g=wind(t);
    for (const [index,y] of [408,443,491,554].entries()) {
      const x=1710+gateShift+175*index-(t*(109+index*26))%1660;
      const strength=.09+g*.108;
      bank(ctx,index%2?smoke:warmSmoke,x,y,840+index*195,64+index*31,strength,index%2?-1:1,.008);
    }
  }

  function gale(ctx,t,front) {
    const swell=wind(t);
    const clock=t+.19*Math.sin(t*1.25);
    for (const [index,entry] of streaks.entries()) {
      if ((index>=3)!==front) continue;
      const [y,start,width,height,speed,alpha,flip]=entry;
      const x=((start-clock*speed+4800)%2460)-430;
      bank(ctx,index%2?smoke:warmSmoke,x,y+8*Math.sin(t*.97+index),width,height,
        alpha*(.88+swell*.95),flip,-.035+index*.009);
    }
    ctx.save();
    ctx.lineCap='round';
    for(const p of dust) {
      if ((p.depth>.63)!==front) continue;
      const speed=mix(170,930,p.speed)*mix(.49,1,p.depth);
      const x=((p.x-clock*speed+14000)%(w+360))-165;
      const band=mix(406,906,p.y**.53);
      const y=band+7*Math.sin(t*2.3+p.phase)*(1+p.depth)+3*Math.sin(x*.013+p.phase);
      const alpha=(.13+.40*p.light)*(.58+.42*Math.sin(t*2+p.phase)**2)*(front?.94:.69);
      const stretch=2.5+25*p.size*p.speed*(.44+.9*swell);
      ctx.globalAlpha=alpha;
      ctx.strokeStyle=p.light>.59?'#f5c38a':p.light>.32?'#bd8b5d':'#77523d';
      ctx.lineWidth=.40+1.54*p.size*p.depth;
      ctx.beginPath();
      ctx.moveTo(x,y);
      ctx.lineTo(x+stretch,y+.055*stretch+1.6*p.roll);
      ctx.stroke();
    }
    if(front) for(const p of stones) {
      const x=((p.x*(w+410)-clock*(350+690*p.speed)+15000)%(w+410))-210;
      const beat=(1+Math.sin(x*.039+p.phase))*.5;
      const y=710+p.depth*185-(8+23*p.depth)*beat**4;
      const r=(1.5+4.8*p.size)*(.55+.65*p.depth);
      ctx.globalAlpha=.31+p.depth*.44;
      ctx.save();
      ctx.translate(x,y);
      ctx.rotate(t*(5+p.speed*10)+p.phase);
      ctx.fillStyle='#704733';
      ctx.beginPath();
      ctx.moveTo(-r,-r*.14);ctx.lineTo(-r*.29,-r*.71);ctx.lineTo(r*.70,-r*.47);
      ctx.lineTo(r*.91,r*.33);ctx.lineTo(-r*.44,r*.65);ctx.closePath();ctx.fill();
      ctx.fillStyle='#c99061';
      ctx.fillRect(-r*.48,-r*.51,r*.82,r*.16);
      ctx.restore();
    }
    ctx.restore();
  }

  return { wind, sunset, army, distantDust, gale, groundCount:soldiers.length, airCount:flight.length, wingFrames };
}
