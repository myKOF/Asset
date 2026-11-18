'use strict';

function makeCommanderImpact(art, smokePuffs, { layer, random, lerp, smooth, bloom }) {
  const w = art.width, h = art.height;
  const referenceScale = 1.66;
  const referenceX = x => 26 + x * referenceScale;
  const referenceY = y => y * referenceScale;
  const body = layer(w, h, { alpha: true });
  const metal = layer(w, h, { alpha: true });
  const reflected = layer(w, h, { alpha: true });
  const fireStrand = layer(178, 108, { alpha: true });
  const seed = random(512016);
  const wounds = [
    { x: 557, y: 359, scale: 1, energy: 1, phase: 0.18, bend: .22, material: 'plate' },
    { x: 432, y: 361, scale: .58, energy: .61, phase: 1.47, bend: .30, material: 'seam' },
    { x: 335, y: 291, scale: .47, energy: .49, phase: 2.05, bend: -.16, material: 'cloth' }
  ];
  const soot = [
    { x: 386, y: 323, energy: .86, phase: .73 },
    { x: 302, y: 276, energy: .67, phase: 1.14 },
    { x: 240, y: 230, energy: .45, phase: 2.42 }
  ];
  const damage = new Path2D('M-39 4 L-32 0 -27 -6 -21 -5 -16 -13 -12 -12 -7 -16 -3 -12 2 -14 4 -9 12 -10 16 -4 20 -5 25 0 28 -2 34 3 28 5 21 4 16 11 12 9 8 15 3 12 -3 17 -8 12 -16 14 -21 9 -26 9 -32 6 Z');
  const bevel = new Path2D('M-40 4 L-30 2 -25 -9 -20 -6 -17 -14 -11 -13 -10 -19 -5 -17 -1 -20 3 -15 8 -14 11 -11 15 -12 18 -5 20 -7 29 -3 32 -4 36 2 28 0 26 3 21 1 14 2 8 -2 3 -1 -4 -8 -9 -3 -14 -7 -21 2 -27 1 -32 6 Z');
  const cracks = new Path2D('M-35 4 L-42 6 -47 3 -55 8 -62 5 M-18 9 L-24 16 -23 22 -29 27 -27 36 M-7 -15 L-12 -24 -8 -30 -11 -37 M24 -3 L32 -8 34 -15 40 -14 51 -23 M12 9 L19 17 26 17 31 22 40 24');
  const glints = new Path2D('M-29 0 L-26 -5 -21 -3 -16 -12 -11 -11 M-8 -14 L-7 -16 -4 -12 1 -13 M14 -4 L19 -5 25 0 M19 6 L16 10 12 9 M8 13 L4 11 -3 15 M-8 11 L-16 12 M-12 -24 L-8 -30');
  const splitSeam = new Path2D('M-43 9 L-28 2 -24 1 -9 -7 -5 -6 3 -10 6 -8 17 -11 13 -5 1 -1 -3 -3 -11 2 -17 2 -22 6 -27 4 Z');
  const burntCloth = new Path2D('M-42 -10 Q-27 -17 -23 -12 L-11 -16 -9 -11 -1 -13 4 -8 17 -5 21 1 31 2 23 5 22 9 15 6 11 10 8 7 1 11 -8 6 -12 9 -18 3 -27 3 -29 -2 -36 -2 Z');
  const dents = Array.from({ length: 98 }, () => ({
    x: lerp(-69, 61, seed()), y: lerp(-42, 38, seed()), radius: lerp(.45, 3.5, seed() ** 2), shine: seed()
  }));
  const embers = Array.from({ length: 75 }, (_, i) => ({
    seed: seed(), speed: lerp(.53, 1.52, seed()), drift: lerp(-1, 1, seed()),
    distance: lerp(.7, 1.8, seed()), size: lerp(.18, 1, seed() ** 2.2),
    spin: lerp(-9, 9, seed()), chip: i % 7 === 0
  }));
  const plumes = Array.from({ length: 16 }, () => ({
    start: seed(), speed: lerp(.48, .97, seed()), drift: lerp(-1, 1, seed()), turn: seed() * 6
  }));
  const ribbons = [1, -1].flatMap(side => Array.from({ length: 5 }, (_, i) => ({
    side, index: i, span: lerp(.53, .75, seed()) * (1.01 - i * .053),
    lift: seed(), fork: lerp(.93, 1.08, seed()), hue: seed()
  })));
  const flame = makeCommanderCombustion(layer, random, smooth);
  const phase = x => x - Math.floor(x);

  // A bronze highlight mask keeps the orange bounce in the metal's existing ridges.
  metal.drawImage(art, 0, 0);
  const matte = metal.getImageData(0, 0, w, h);
  const pixels = matte.data;
  for (let i = 0; i < pixels.length; i += 4) {
    const value = pixels[i] * .26 + pixels[i + 1] * .65 + pixels[i + 2] * .09;
    pixels[i + 3] *= smooth(66, 216, value);
  }
  metal.putImageData(matte, 0, 0);

  function drawDamage(t, energy) {
    body.clearRect(0, 0, w, h);
    body.drawImage(art, 0, 0);
    reflected.clearRect(0, 0, w, h);
    for (const site of wounds) {
      const x = referenceX(site.x), y = referenceY(site.y);
      const charge = .77 + .17 * Math.sin(13.9 * t + site.phase) + .06 * Math.sin(22 * t + site.phase);
      const heat = charge * site.energy * energy;
      body.save();
      body.translate(x, y);
      body.rotate(-.21);
      body.scale(site.scale * referenceScale, site.scale * referenceScale);
      body.globalCompositeOperation = 'source-atop';
      bloom(body, -6, 2, 82, 57, '24,15,12', .90);
      bloom(body, -8, 2, 49, 24, '105,32,17', .58 * heat);
      for (const fleck of dents) {
        body.fillStyle = fleck.shine < .84 ? 'rgba(28,16,12,.44)' : 'rgba(160,71,32,.43)';
        body.fillRect(fleck.x, fleck.y, fleck.radius, fleck.radius * .59);
      }
      body.lineJoin = 'round';
      body.lineCap = 'round';
      const plate = site.material === 'plate';
      const aperture = plate ? damage : site.material === 'seam' ? splitSeam : burntCloth;
      const cavity = body.createLinearGradient(-30, 14, 18, -17);
      cavity.addColorStop(0, '#1d120d');
      cavity.addColorStop(.52, '#130e0b');
      cavity.addColorStop(1, '#3f2014');
      body.fillStyle = cavity;
      if (plate) {
        body.lineWidth = 3.9;
        body.strokeStyle = '#42271b';
        body.stroke(cracks);
        body.fill(damage);
        const edge = body.createLinearGradient(0, -17, 8, 15);
        edge.addColorStop(0, '#261d18');
        edge.addColorStop(.54, '#9a6542');
        edge.addColorStop(1, '#4e2419');
        body.fillStyle = edge;
        body.fill(bevel);
        body.lineWidth = 1.15;
        body.strokeStyle = 'rgba(139,91,68,.68)';
        body.stroke(cracks);
        body.shadowBlur = 9;
        body.shadowColor = '#ff501d';
        body.lineWidth = 1.42;
        body.strokeStyle = 'rgba(255,128,44,' + (.10 + .74 * heat) + ')';
        body.stroke(glints);
        body.shadowBlur = 0;
        body.lineWidth = .57;
        body.strokeStyle = 'rgba(255,206,137,' + (.07 + .62 * heat) + ')';
        body.stroke(glints);
      } else {
        body.fill(aperture);
        body.shadowBlur = 5;
        body.shadowColor = '#e64f1b';
        body.lineWidth = .90;
        body.strokeStyle = 'rgba(213,90,28,' + (.05 + .61 * heat) + ')';
        body.stroke(aperture);
      }
      body.restore();
      bloom(reflected, x + 40 * site.scale, y + 18, 196 * site.scale, 125 * site.scale, '253,89,21', heat * .90);
      bloom(reflected, x + 18, y - 21, 127 * site.scale, 70 * site.scale, '255,167,72', heat * .90);
    }
    reflected.globalCompositeOperation = 'destination-in';
    reflected.drawImage(metal.canvas, 0, 0);
    reflected.globalCompositeOperation = 'source-over';
    body.globalCompositeOperation = 'screen';
    body.drawImage(reflected.canvas, 0, 0);
    body.globalCompositeOperation = 'source-over';
  }

  function drawBody(ctx, x, y, size, tall, t, energy, opacity) {
    drawDamage(t, energy);
    ctx.save();
    ctx.globalAlpha = opacity;
    ctx.drawImage(body.canvas, x, y, size, tall);
    ctx.restore();
  }

  function drawWings(ctx, x, y, size, heading, t, alpha) {
    ctx.save();
    ctx.translate(x, y);
    ctx.rotate(heading);
    ctx.globalCompositeOperation = 'screen';
    for (const { side, index, span, lift, fork, hue } of ribbons) {
      const length = size * span;
      const rootY = side * size * (.009 + .006 * index);
      const spread = size * side * ((side > 0 ? .245 : .135) + index * .040) * fork;
      const breadth = size * (.014 + lift * .022) * (1 - index * .055);
      const center = u => rootY + spread * (1 - Math.exp(-u * 7.4)) * (1 - .26 * u) +
        size * u * (.033 * Math.sin(u * 9 - t * 4.8 + index * .69 + hue) +
          .015 * Math.sin(u * 17 - t * 7.1 + side * .33));
      const profile = Array.from({ length: 29 }, (_, i) => {
        const u = i / 28;
        const wide = breadth * Math.sin(u * Math.PI) ** .64 * (.76 + .24 * Math.sin(u * 12 - t * 4 + hue * 3));
        return { x: -length * u, y: center(u), wide };
      });
      const grad = ctx.createLinearGradient(0, 0, -length, center(1));
      grad.addColorStop(0, 'rgba(255,247,212,.91)');
      grad.addColorStop(.21, 'rgba(255,241,195,.62)');
      grad.addColorStop(.59, 'rgba(253,221,158,.40)');
      grad.addColorStop(.89, 'rgba(234,181,108,.17)');
      grad.addColorStop(1, 'rgba(249,200,131,0)');
      ctx.globalAlpha = alpha * (side < 0 ? .82 : .98);
      ctx.fillStyle = grad;
      ctx.beginPath();
      for (const p of profile) ctx.lineTo(p.x, p.y - p.wide);
      for (let i = profile.length - 1; i >= 0; i--) {
        const p = profile[i];
        ctx.lineTo(p.x, p.y + p.wide);
      }
      ctx.closePath();
      ctx.fill();
      for (const strand of [-.92, -.38, .12, .79]) {
        ctx.globalAlpha = alpha * (.15 + .06 * Math.abs(strand));
        ctx.lineWidth = Math.max(.36, size * .0013);
        ctx.strokeStyle = grad;
        ctx.beginPath();
        for (const p of profile) ctx.lineTo(p.x, p.y + p.wide * strand);
        ctx.stroke();
      }
    }
    ctx.globalAlpha = 1;
    bloom(ctx, -.018 * size, 0, size * .093, size * .044, '255,224,165', alpha * .34);
    ctx.restore();
  }

  function smoke(ctx, size, t, site, alpha, front) {
    for (let i = 0; i < plumes.length; i++) {
      const puff = plumes[i], age = phase(t * puff.speed + puff.start + site.phase);
      const x = -size * (.014 + .72 * age + .12 * age * age);
      const y = size * age * (puff.drift * (.045 + age * .07) +
        .052 * Math.sin(puff.turn + age * 5.4 + t * .6));
      const s = size * (.045 + .29 * age) * (1 + .16 * puff.drift);
      ctx.save();
      ctx.translate(x, y);
      ctx.rotate(puff.drift * .43 + .26 * Math.sin(age * 6 + puff.turn));
      ctx.globalAlpha = alpha * (front ? .53 : .73) * Math.sin(Math.PI * age) ** .72;
      ctx.drawImage(smokePuffs[i % smokePuffs.length], -s * .72, -s * .41, s * 1.44, s * .78);
      ctx.restore();
    }
  }

  function debris(ctx, span, t, level, site) {
    for (const p of embers) {
      const age = phase(t * p.speed + p.seed + site.phase);
      const strength = Math.sin(age * Math.PI) ** .55 * (1 - age * .52) * level;
      const x = -span * (.007 + p.distance * age ** 1.23);
      const y = span * age * (p.drift * (.055 + age * .127) + site.bend * .29 +
        Math.sin(8 * age + p.seed * 6 + t * 1.3) * .047);
      const r = Math.max(.35, span * p.size * (p.chip ? .020 : .0085));
      ctx.globalAlpha = strength;
      if (p.chip) {
        ctx.save();
        ctx.translate(x, y);
        ctx.rotate(p.spin * age);
        ctx.scale(.62 + .38 * Math.abs(Math.cos(p.spin * age * 1.4)), 1);
        ctx.fillStyle = '#2b2019';
        ctx.beginPath();
        ctx.moveTo(-r * .76, -.52 * r);
        ctx.lineTo(.69 * r, -.26 * r);
        ctx.lineTo(.36 * r, .65 * r);
        ctx.lineTo(-.55 * r, .35 * r);
        ctx.closePath();
        ctx.fill();
        ctx.strokeStyle = 'rgba(255,130,56,' + (1 - age) * .80 + ')';
        ctx.lineWidth = Math.min(1.25, r * .28);
        ctx.stroke();
        ctx.restore();
      } else {
        const length = r * (2.3 + 12.5 * age);
        const trail = ctx.createLinearGradient(x - length, y, x, y);
        trail.addColorStop(0, 'rgba(245,90,27,0)');
        trail.addColorStop(.68, 'rgba(252,129,51,.47)');
        trail.addColorStop(1, 'rgba(255,220,153,.98)');
        ctx.strokeStyle = trail;
        ctx.lineWidth = r * .87;
        ctx.beginPath();
        ctx.moveTo(x - length, y - .043 * length * p.drift);
        ctx.lineTo(x, y);
        ctx.stroke();
      }
    }
    ctx.globalAlpha = 1;
  }

  function fire(ctx, size, t, alpha, site) {
    const radius = size * .063 * site.scale;
    const beat = .72 + .18 * Math.sin(t * 13 + site.phase) + .10 * Math.sin(t * 23.8);
    for (let split = 0; split < 3; split++) {
      const offset = split - 1;
      const sx = radius / 34 * (1.07 + split * .22);
      const sy = radius / 34 * (split === 1 ? .61 : .43);
      const tonguePhase = site.phase + split * .277;
      fireStrand.clearRect(0, 0, 178, 108);
      fireStrand.save();
      fireStrand.translate(164, 54);
      flame.fire(fireStrand, 34, t * (1.32 + split * .17) + tonguePhase);
      fireStrand.restore();
      const curve = x => {
        const age = Math.max(0, (164 - x) / 68);
        return radius * (.15 * offset + site.bend * (1 - Math.exp(-age * 2.7)) +
          age * (.24 * Math.sin(age * 4.2 - t * 10 + tonguePhase * 3.2) +
            .10 * Math.sin(age * 9.7 - t * 16.2 + split) + offset * .14));
      };
      ctx.globalAlpha = alpha * beat * (split === 1 ? .97 : .54);
      for (let x = 4; x < 176; x += 4) {
        const dy = (curve(x + 4) - curve(x)) / 4;
        ctx.save();
        ctx.transform(sx, dy, 0, sy, -164 * sx, curve(x) - x * dy - 54 * sy);
        ctx.drawImage(fireStrand.canvas, x, 0, 4.25, 108, x, 0, 4.25, 108);
        ctx.restore();
      }
    }
    ctx.globalAlpha = 1;
    bloom(ctx, -radius * .06, 0, radius * .56, radius * .38, '255,140,49', alpha * .53 * beat);
  }

  function drawWake(ctx, x, y, size, tall, heading, t, energy, front) {
    if (energy <= .001) return;
    for (const site of [...wounds, ...soot]) {
      ctx.save();
      ctx.translate(x + referenceX(site.x) / w * size, y + referenceY(site.y) / h * tall);
      ctx.rotate(heading);
      const heat = energy * site.energy;
      if (!front) {
        smoke(ctx, size * (site.scale ? .67 : .73), t, site, heat, false);
      } else if (site.scale) {
        fire(ctx, size, t, heat, site);
        debris(ctx, size * (.25 + site.scale * .18), t, heat, site);
      } else {
        smoke(ctx, size * .66, t, site, heat, true);
      }
      ctx.restore();
    }
  }

  return { drawBody, drawWings, drawWake };
}
