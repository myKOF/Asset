'use strict';

function makeFeatherFinale(feather, { width, height, lerp, smooth, bloom, featherFx }) {
  const { wideFeatherAt, chestAt, featherLandAt, thirdFadeAt } = ORIGINAL_OPENING_SHOT_TIMING;
  const tau = Math.PI * 2;
  const chest = { u: 0.689, v: 0.404 };
  const featherPivot = { u: 0.47, v: 0.51 };
  const shaftCenter = { u: 0.50, v: 0.42 };
  function drawFeather(ctx, x, y, span, angle, pitch, opacity, blur = 0) {
    const tall = span * feather.height / feather.width;
    ctx.save();
    ctx.globalAlpha *= opacity;
    ctx.translate(x, y);
    ctx.rotate(angle);
    ctx.scale(1, pitch);
    ctx.filter = 'brightness(0.93) saturate(0.79) blur(' + blur.toFixed(2) + 'px)';
    ctx.drawImage(feather, -span * featherPivot.u, -tall * featherPivot.v, span, tall);
    ctx.restore();
  }

  function drawWide(ctx, t, body) {
    if (t < wideFeatherAt) return;
    const s = Math.min(1, (t - wideFeatherAt) / (chestAt - wideFeatherAt));
    const targetX = body.x + body.span * chest.u;
    const targetY = body.y + body.tall * chest.v;
    const wind = Math.sin(Math.PI * s) ** 1.4;
    const drop = smooth(0, 1, s);
    const x = targetX - lerp(width * 0.055, body.span * 0.12, drop) - 270 * wind +
      Math.sin(s * tau * 1.45) * 82 * wind;
    const lensArc = smooth(0, 0.34, s);
    const y = targetY - lerp(height * 0.10, height * 0.38, lensArc) * (1 - drop) -
      body.span * 0.15 * drop +
      Math.sin(s * tau * 1.25) * 21 * wind;
    // Ease away from the lens before the feather falls into the wide composition.
    const depth = lerp(1, 86, s ** 2.10);
    const span = 2480 / depth;
    const lensBlur = 7.4 / (1 + 12 * s);
    const angle = lerp(0.04, 0.73, s) + Math.sin(s * tau * 1.35) * 0.40 * wind;
    const pitch = lerp(0.95, 0.71, s) - wind * 0.49 * Math.sin(s * tau * 1.45) ** 2;

    bloom(ctx, targetX - 28, targetY - 5, 25, 10, '62,37,21', smooth(0.72, 1, s) * 0.17);
    drawFeather(ctx, x, y, span, angle, pitch, smooth(0, 0.028, s), lensBlur);
  }

  function drawChest(ctx, t, body, continuation=0) {
    const age = Math.max(0, t - featherLandAt);
    const hold = thirdFadeAt - featherLandAt;
    const push = smooth(0.08, hold, age);
    const approachZoom = lerp(1.94, 2.01, smooth(chestAt, featherLandAt, t));
    const driftIn = 0.065 * (1 - Math.exp(-0.53 * continuation * continuation));
    const zoom = approachZoom * lerp(1, 1.39, push) * (1 + driftIn);
    const relativeZoom = zoom / approachZoom;
    const target = {
      x: body.x + body.span * chest.u,
      y: body.y + body.tall * chest.v
    };
    const contact = { x: width * (lerp(0.49, 0.50, push) + driftIn * 0.047),
      y: height * (lerp(0.57, 0.53, push) - driftIn * 0.135) };
    ctx.save();
    ctx.translate(contact.x, contact.y);
    ctx.scale(zoom, zoom);
    ctx.translate(-target.x, -target.y);
    body.draw(ctx);
    ctx.restore();

    const phase = Math.max(0, Math.min(1, (t - chestAt) / (featherLandAt - chestAt)));
    const drift = (1 - phase) ** 1.35;
    const sideWind = Math.sin(phase * tau * 1.45) * Math.sin(phase * Math.PI) ** 2;
    const px = contact.x - 244 * drift + Math.sin(phase * tau * 1.35) * 58 * drift + 95 * sideWind;
    const py = contact.y - 313 * drift + Math.sin(phase * tau * 1.60) * 21 * drift;
    const span = lerp(169, 131, phase) * relativeZoom;
    const tilt = lerp(0.73, 0.15, phase) + Math.sin(phase * tau * 1.24) * 0.42 * drift;
    const pitch = lerp(0.71, 0.78, phase) + Math.sin(phase * tau * 1.60) * 0.28 * drift;
    const heightRatio = feather.height / feather.width * pitch;
    const centerAcross = span * (shaftCenter.u - featherPivot.u);
    const centerDown = span * heightRatio * (shaftCenter.v - featherPivot.v);
    const centerX = px + centerAcross * Math.cos(tilt) - centerDown * Math.sin(tilt);
    const centerY = py + centerAcross * Math.sin(tilt) + centerDown * Math.cos(tilt);

    bloom(ctx, px + 7, contact.y + 7, span * 0.60, 13 + drift * 29, '39,24,17',
      smooth(0.27, 1, phase) * 0.70);
    drawFeather(ctx, px, py, span, tilt, pitch, 1, 0.80 * drift);
    featherFx(ctx, t - chestAt, centerX, centerY, relativeZoom);
    return {x:centerX,y:centerY};
  }

  return { drawWide, drawChest };
}
