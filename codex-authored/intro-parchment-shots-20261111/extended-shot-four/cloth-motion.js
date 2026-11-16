'use strict';

function makeFabricLayer(subject,w,h,sx,sy,makeLayer,paintHems,fabricZones) {
  const hemMask=makeLayer();
  hemMask.ink.save();
  hemMask.ink.filter='blur(7px)';
  hemMask.ink.scale(sx,sy);
  paintHems(hemMask.ink);
  hemMask.ink.restore();
  const hemAlpha=hemMask.ink.getImageData(0,0,w,h).data;

  function ease(a,b,x) {
    const t=Math.max(0,Math.min(1,(x-a)/(b-a)));
    return t*t*(3-2*t);
  }
  const cloth=makeLayer();
  const clothInput=subject.ink.getImageData(0,0,w,h);
  const clothOutput=subject.ink.getImageData(0,0,w,h);
  const pixelsByIndex=new Map();
  for(const zone of fabricZones) {
    const angle=zone.angle ?? 0;
    const cosine=Math.cos(angle),sine=Math.sin(angle);
    const extentX=Math.hypot(zone.rx*cosine,zone.ry*sine);
    const extentY=Math.hypot(zone.rx*sine,zone.ry*cosine);
    const x0=Math.max(0,Math.floor((zone.x-extentX)*sx));
    const x1=Math.min(w-2,Math.ceil((zone.x+extentX)*sx));
    const y0=Math.max(1,Math.floor((zone.y-extentY)*sy));
    const y1=Math.min(h-2,Math.ceil((zone.y+extentY)*sy));
    for(let y=y0;y<=y1;y++) for(let x=x0;x<=x1;x++) {
      const u=x/sx,v=y/sy;
      const horizontal=u-zone.x,vertical=v-zone.y;
      const along=horizontal*cosine+vertical*sine;
      const across=vertical*cosine-horizontal*sine;
      const distance=(along/zone.rx)**2+(across/zone.ry)**2;
      const anchor=zone.root===undefined ? 1 : 1-ease(zone.root-42,zone.root,u);
      const index=(y*w+x)*4;
      const influence=(1-ease(.12,1,distance))*anchor*hemAlpha[index+3]/255;
      if(influence<=.007)continue;
      let point=pixelsByIndex.get(index);
      if(!point) {
        point={x,y,index,weight:0,waves:[]};
        pixelsByIndex.set(index,point);
      }
      point.weight+=influence;
      point.waves.push({strength:zone.strength*influence,phase:zone.phase+u*.026-v*.016});
    }
  }
  const movingPixels=Array.from(pixelsByIndex.values(),point=>({
    ...point,
    normalizer:1/Math.max(1,point.weight),
  }));

  function moveFabric(time,wind=0) {
    const input=clothInput.data, out=clothOutput.data;
    const easeIn=ease(0,.45,time);
    for(const {x,y,index,normalizer,waves} of movingPixels) {
      let dx=0,dy=0;
      for(const {strength,phase} of waves) {
        const swing=Math.sin(time*2.75+phase)*.78+Math.sin(time*4.96+phase*.51)*.22;
        const lift=Math.cos(time*2.75+phase-.65)*.62+Math.cos(time*5.22+phase)*.17;
        dx+=strength*(swing*(1+.90*wind)-wind*(.58+.13*Math.sin(time*4.65+phase)));
        dy+=strength*lift*(1+1.28*wind);
      }
      const px=Math.max(0,Math.min(w-1.01,x-dx*normalizer*easeIn*sx));
      const py=Math.max(0,Math.min(h-1.01,y-dy*normalizer*easeIn*sy));
      const u=Math.floor(px),v=Math.floor(py),a=px-u,b=py-v;
      const i=(v*w+u)*4,j=i+w*4;
      const aa=(1-a)*(1-b)*input[i+3],ab=a*(1-b)*input[i+7];
      const ba=(1-a)*b*input[j+3],bb=a*b*input[j+7];
      const alpha=aa+ab+ba+bb;
      if(alpha>0)for(let channel=0;channel<3;channel++) {
        out[index+channel]=(input[i+channel]*aa+input[i+4+channel]*ab
          +input[j+channel]*ba+input[j+4+channel]*bb)/alpha;
      }
      out[index+3]=alpha;
    }
    cloth.ink.putImageData(clothOutput,0,0);
  }

  return {surface:cloth.surface,draw:moveFabric};
}
