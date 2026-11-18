'use strict';

(() => {
  const width = 1920;
  const height = 900;
  const matte = 90;
  const context = document.querySelector('canvas').getContext('2d', { alpha: false });
  const { thirdDuration: duration } = OPENING_SHOT_TIMING;
  const lerp = (a, b, t) => a + (b - a) * t;
  const smooth = (a, b, t) => {
    const p = Math.max(0, Math.min(1, (t - a) / (b - a)));
    return p * p * (3 - 2 * p);
  };
  function random(seed) {
    return () => {
      seed = (Math.imul(seed, 1664525) + 1013904223) >>> 0;
      return seed / 4294967296;
    };
  }
  function layer(w, h, options) {
    const element = document.createElement('canvas');
    element.width = w;
    element.height = h;
    return element.getContext('2d', options);
  }
  async function loadImage(name) {
    const image = new Image();
    image.src = name;
    await image.decode();
    return image;
  }
  function bloom(ctx, x, y, rx, ry, rgb, alpha) {
    if (alpha <= 0) return;
    ctx.save();
    ctx.translate(x, y);
    ctx.scale(rx, ry);
    const glow = ctx.createRadialGradient(0, 0, 0, 0, 0, 1);
    glow.addColorStop(0, 'rgba(' + rgb + ',' + alpha + ')');
    glow.addColorStop(0.4, 'rgba(' + rgb + ',' + (alpha * 0.35) + ')');
    glow.addColorStop(1, 'rgba(' + rgb + ',0)');
    ctx.fillStyle = glow;
    ctx.fillRect(-1, -1, 2, 2);
    ctx.restore();
  }
  function pageFinish(ctx) {
    ctx.save();
    ctx.translate(width * 0.52, height * 0.46);
    ctx.scale(1, 0.70);
    const shade = ctx.createRadialGradient(0, 0, 300, 0, 0, 1200);
    shade.addColorStop(0, 'rgba(26,15,12,0)');
    shade.addColorStop(0.58, 'rgba(26,15,12,0.10)');
    shade.addColorStop(1, 'rgba(13,8,14,0.74)');
    ctx.fillStyle = shade;
    ctx.fillRect(-width, -height, width * 2, height * 2);
    ctx.restore();
  }
  function compositeFlatHand(base, image) {
    const cel = layer(base.width, base.height, { alpha: true });
    cel.drawImage(base, 0, 0);

    // Feather the sand surrounding the old glove onto the projected ground plate.
    // The original forearm remains until the first cuff ring.
    cel.save();
    cel.translate(840, 456);
    cel.globalCompositeOperation = 'destination-out';
    cel.filter = 'blur(5px)';
    cel.fill(new Path2D('M48 176 C83 165 115 158 147 158 ' +
      'C166 149 197 143 218 149 C239 150 257 157 266 168 ' +
      'C286 180 299 206 300 224 C315 238 301 267 275 290 ' +
      'C251 310 137 329 56 316 L36 244 Z'));
    cel.restore();

    // Align the new cuff with the original wrist seam at the character cel’s scale.
    const glove = layer(395, 250, { alpha: true });
    const origin = { x: 840, y: 588 };
    glove.imageSmoothingQuality = 'high';
    glove.drawImage(image, 13, 11, image.width * 0.230, image.height * 0.185);
    const cuffFade = glove.createLinearGradient(279, 64, 325, 39);
    cuffFade.addColorStop(0, '#000');
    cuffFade.addColorStop(1, 'transparent');
    glove.globalCompositeOperation = 'destination-in';
    glove.fillStyle = cuffFade;
    glove.fillRect(0, 0, glove.canvas.width, glove.canvas.height);

    const shadow = layer(glove.canvas.width, glove.canvas.height, { alpha: true });
    shadow.filter = 'blur(4.5px)';
    shadow.drawImage(glove.canvas, 2, 4);
    shadow.filter = 'none';
    shadow.globalCompositeOperation = 'source-in';
    shadow.fillStyle = 'rgba(53,32,21,0.54)';
    shadow.fillRect(0, 0, shadow.canvas.width, shadow.canvas.height);
    cel.drawImage(shadow.canvas, origin.x, origin.y);
    cel.drawImage(glove.canvas, origin.x, origin.y);
    return cel.canvas;
  }

  const shot = { duration };
  window.openingShot = shot;
  shot.ready = Promise.all([
    loadImage('assets/mortal-map.png'), loadImage('assets/desert-surface.png'), loadImage('assets/collapse-smoke.png'), loadImage('assets/desert-wide-extended.png'),
    loadImage('assets/charred-feather.png'), loadImage('assets/archangel-fallen-ivory.png'), loadImage('assets/archangel-left-hand-flat.png'), makeIntroFeatherParticles()
  ]).then(([map, desert, smoke, wideDesert, feather, fallen, flatHand, featherFx]) => {
    const render = makeMortalMap(map, desert, wideDesert, smoke, feather, compositeFlatHand(fallen, flatHand), {
      context, width, height, matte, layer, random, lerp, smooth, bloom, pageFinish, featherFx
    });
    shot.render = time => render(Math.max(0, Math.min(duration, time)));
    shot.renderGold = elapsed => {
      const {x,y} = render(OPENING_SHOT_TIMING.thirdFadeAt + elapsed, elapsed);
      return {canvas:context.canvas,x,y:y+matte};
    };
    shot.render(0);
  });
})();
