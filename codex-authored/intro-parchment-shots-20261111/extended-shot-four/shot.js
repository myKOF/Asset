'use strict';

(() => {
  const width=1920, height=1080, matte=90;
  const {braceAt,braceDissolveDuration,kneelAt,riseAt,vistaAt,duration}=SHOT_FOUR_TIMING;
  const fadeAt=kneelAt-braceDissolveDuration;
  const dissolveFrame=document.createElement('canvas');
  dissolveFrame.width=width;
  dissolveFrame.height=height;
  const dissolveCtx=dissolveFrame.getContext('2d',{alpha:false});
  const ctx=document.querySelector('canvas').getContext('2d',{alpha:false});
  const output={duration};
  window.openingShot=output;

  const assets={
    cloth:'cloth-ribbon.png',flare:'flare.png',
    brace:'brace.png',kneel:'kneel.png',kneelDesert:'kneel-desert.png',rise:'rise.png',riseDesert:'rise-desert.png',vista:'vista.png',
  };
  const clamp = x => Math.max(0,Math.min(1,x));
  function loadGoldContinuation() {
    return new Promise((resolve,reject)=>{
      const iframe=document.createElement('iframe');
      iframe.hidden=true;
      iframe.setAttribute('aria-hidden','true');
      iframe.addEventListener('load',async ()=>{
        try {
          const third=iframe.contentWindow.openingShot;
          if(!third)throw new Error('The feather renderer did not load.');
          await third.ready;
          resolve(third.renderGold);
        } catch(error) {
          reject(error);
        }
      },{once:true});
      iframe.src='../extended-shot-three-35.5s/index.html?capture=1';
      document.body.append(iframe);
    });
  }
  let scene;
  const imagesReady=Promise.all(Object.entries(assets).map(async ([name,file])=>{
    const image=new Image();
    image.src='assets/'+file;
    await image.decode();
    return [name,image];
  }));
  output.ready=Promise.all([imagesReady,loadGoldContinuation()]).then(([entries,renderGold])=>{
    scene=makeCinematics(ctx,Object.fromEntries(entries),width,height,renderGold);
    output.render=render;
    render(0);
  });

  const vignette=ctx.createRadialGradient(width*.51,height*.50,420,width*.51,height*.52,1140);
  vignette.addColorStop(0,'rgba(10,6,7,0)');
  vignette.addColorStop(.56,'rgba(18,10,12,0.10)');
  vignette.addColorStop(1,'rgba(9,5,7,0.40)');

  function render(seconds) {
    const t=clamp(seconds/duration)*duration;
    ctx.globalAlpha=1;
    ctx.fillStyle='#0b0807';ctx.fillRect(0,0,width,height);
    ctx.save();
    ctx.beginPath();ctx.rect(0,matte,width,height-2*matte);ctx.clip();
    ctx.imageSmoothingQuality='high';
    if(t<braceAt) {
      scene.goldTransition(t);
    } else {
      if(t<fadeAt) {
        scene.restScene('brace',t-braceAt);
      } else if(t<riseAt) {
        if(t<kneelAt) {
          scene.restScene('brace',t-braceAt);
          dissolveCtx.drawImage(ctx.canvas,0,0);
        }
        const kneelMotionTime=(t-fadeAt)*(riseAt-kneelAt)/(riseAt-fadeAt);
        scene.restScene('kneel',kneelMotionTime);
        if(t<kneelAt) {
          const progress=(t-fadeAt)/braceDissolveDuration;
          ctx.globalAlpha=1-progress*progress*(3-2*progress);
          ctx.drawImage(dissolveFrame,0,0);
          ctx.globalAlpha=1;
        }
      } else if(t<vistaAt) {
        scene.restScene('rise',t-riseAt);
      } else {
        scene.restScene('vista',t-vistaAt);
      }
      ctx.fillStyle=vignette;ctx.fillRect(0,0,width,height);
    }
    ctx.restore();
  }

  if(new URLSearchParams(location.search).has('capture')){
    document.documentElement.classList.add('capture');
    return;
  }
  const play=document.querySelector('button'),seek=document.querySelector('input');
  const counter=document.querySelector('output'),audio=document.querySelector('audio');
  seek.max=String(duration);
  let elapsed=0,start=0,request=0,playing=false;
  function seekTo(value){
    elapsed=clamp(value/duration)*duration;
    seek.valueAsNumber=elapsed;
    counter.value=elapsed.toFixed(2)+' s';
    render(elapsed);
  }
  function pause(){
    playing=false;cancelAnimationFrame(request);audio.pause();play.textContent='播放';
  }
  function tick(now){
    seekTo((now-start)/1000);
    if(elapsed<duration)request=requestAnimationFrame(tick);
    else pause();
  }
  output.ready.then(()=>{play.disabled=seek.disabled=false;});
  play.addEventListener('click',()=>{
    if(playing){pause();return;}
    if(elapsed>=duration)seekTo(0);
    audio.currentTime=elapsed;
    audio.play().catch(()=>{});
    playing=true;play.textContent='暫停';
    start=performance.now()-elapsed*1000;request=requestAnimationFrame(tick);
  });
  seek.addEventListener('input',()=>{pause();seekTo(seek.valueAsNumber);});
  document.addEventListener('visibilitychange',()=>{if(document.hidden&&playing)pause();});
})();
