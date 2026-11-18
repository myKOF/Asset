'use strict';

function fitFallenProportions(cel, layer) {
  // These masks use the 900px-wide reference of the approved character cel.
  const scale = cel.width / 900;
  const pad = Math.ceil(56 * scale);
  const width = cel.width + pad;
  const height = cel.height;
  const mask = (outline, blur) => {
    const shaped = layer(width, height, { alpha: true });
    shaped.filter = 'blur(' + blur * scale + 'px)';
    shaped.translate(pad, 0);
    shaped.scale(scale, scale);
    shaped.fill(new Path2D(outline));
    return shaped.getImageData(0, 0, width, height).data;
  };
  // Far leg, near leg, waist, and left arm each stretch along their own axis.
  const areas = [
    {
      origin: [466, 178], direction: [-.999, .04], amount: .10,
      alpha: mask('M-67 175 Q65 167 128 164 Q206 164 247 158 Q297 135 340 136 L435 150 L479 171 L463 207 Q397 211 330 216 Q254 222 194 229 Q83 232 -60 233 Z', 4)
    },
    {
      origin: [468, 187], direction: [-.965, .263], amount: .10,
      alpha: mask('M-35 276 Q61 230 123 230 Q163 217 205 199 Q245 184 264 155 Q296 126 340 129 Q397 132 468 155 L485 186 Q426 213 380 220 Q322 236 267 255 Q212 263 161 282 L104 303 Q39 323 -35 327 Z', 5)
    },
    {
      origin: [507, 190], direction: [-.14, .990], amount: .13,
      alpha: mask('M416 162 Q464 153 528 151 Q549 155 568 171 L570 211 Q534 234 478 229 L437 218 Z', 11)
    },
    {
      origin: [600, 272], direction: [.625, .781], amount: .13,
      alpha: mask('M665 206 Q691 212 689 246 Q660 274 625 290 Q587 321 554 333 L525 318 Q536 291 567 271 Q609 244 632 225 Z', 8)
    }
  ];

  const output = layer(width, height, { alpha: true });
  output.drawImage(cel, pad, 0);
  const source = output.getImageData(0, 0, width, height);
  const plate = output.getImageData(0, 0, width, height);
  const src = source.data;
  const dst = plate.data;
  for (let y = 1; y < height - 1; y++) {
    const yy = y / scale;
    for (let x = 0; x < width; x++) {
      const i = (y * width + x) * 4;
      const xx = (x - pad) / scale;
      let dx = 0, dy = 0, legWeight = 0;
      for (let k = 0; k < areas.length; k++) {
        const { alpha, origin, direction, amount } = areas[k];
        let weight = alpha[i + 3] / 255;
        if (weight < .006) continue;
        if (k < 2) {
          if (k === 1) {
            dx *= 1 - weight;
            dy *= 1 - weight;
          }
          legWeight = Math.max(legWeight, weight);
        } else if (k === 2) {
          weight *= 1 - .72 * legWeight;
        }
        const [ux, uy] = direction;
        const distance = (xx - origin[0]) * ux + (yy - origin[1]) * uy;
        const offset = -distance * amount / (1 + amount) * weight * scale;
        dx += ux * offset; dy += uy * offset;
      }
      if (Math.abs(dx) + Math.abs(dy) < .02) continue;
      const px = x + dx, py = y + dy;
      if (px < 0 || py < 0 || px >= width - 1 || py >= height - 1) continue;
      const u = Math.floor(px), v = Math.floor(py), a = px - u, b = py - v;
      // Sample premultiplied alpha so the reshaped edges blend into the sand.
      const base = (v * width + u) * 4, below = base + width * 4;
      const aa = src[base + 3] * (1 - a) * (1 - b);
      const ab = src[base + 7] * a * (1 - b);
      const ba = src[below + 3] * (1 - a) * b;
      const bb = src[below + 7] * a * b;
      const opacity = aa + ab + ba + bb;
      dst[i + 3] = opacity;
      if (opacity > 0) for (let channel = 0; channel < 3; channel++) {
        dst[i + channel] = (src[base + channel] * aa + src[base + 4 + channel] * ab +
          src[below + channel] * ba + src[below + 4 + channel] * bb) / opacity;
      }
    }
  }
  output.putImageData(plate, 0, 0);
  return { canvas: output.canvas, pad };
}

function makeFallenCloth(cel, leftPad, scale, layer, patches) {
  const { width, height } = cel.canvas;
  const pad = leftPad / scale;
  const makeLayer = () => {
    const ink = layer(width, height, { alpha: true, willReadFrequently: true });
    return { ink, surface: ink.canvas };
  };
  return makeFabricLayer({ ink: cel }, width, height, scale, scale, makeLayer, ink => {
    ink.translate(pad, 0);
    for (const { outline } of patches) ink.fill(new Path2D(outline));
  }, patches.map(({ outline, x, root, ...zone }) => ({
    ...zone, x: x + pad, root: root === undefined ? undefined : root + pad
  })));
}

function alignFallenCloth(cel, leftPad, scale, layer) {
  const { width, height } = cel.canvas;
  const source = layer(width, height, { alpha: true });
  source.drawImage(cel.canvas, 0, 0);
  const piece = layer(width, height, { alpha: true });
  const pad = leftPad / scale;
  const ribbons = [
    {
      outline: 'M644 59 Q667 58 686 76 Q714 87 723 117 L726 143 Q722 153 710 149 Q690 135 680 109 Q666 88 644 77 Z',
      clear: 'M642 55 Q673 56 691 74 Q722 85 731 118 L750 144 Q735 157 716 149 Q692 139 673 108 L645 83 Z',
      root: [719, 144], anchor: [720, 138], angle: -0.30, stretch: [1.18, 0.88]
    },
    {
      outline: 'M807 241 Q832 237 854 239 Q871 236 890 244 L889 260 Q866 270 844 266 Q823 265 802 256 Z',
      clear: 'M816 233 Q841 233 859 230 Q885 233 897 243 L894 263 Q865 274 843 267 L812 260 805 253 Z',
      root: [815, 251], anchor: [817, 259], angle: -0.09, stretch: [-0.92, 0.82]
    }
  ];
  // Clear the suspended wing-like fragments from above the boot, knee, and right arm.
  const fragments = new Path2D('M27 140 Q82 136 103 111 Q134 96 159 85 L175 70 Q207 88 240 95 ' +
    'Q295 89 339 72 L355 46 Q389 46 420 66 Q443 75 463 88 L504 89 ' +
    'Q519 78 534 85 L551 100 556 120 Q522 119 489 121 Q455 118 425 127 Q413 131 401 141 ' +
    'Q382 140 362 135 Q349 121 333 120 Q306 126 289 139 L269 152 ' +
    'Q209 160 164 163 Q102 183 42 170 Z');

  cel.save();
  cel.filter = 'blur(4px)';
  cel.translate(leftPad, 0);
  cel.scale(scale, scale);
  cel.globalCompositeOperation = 'destination-out';
  cel.fill(fragments);
  for (const { clear } of ribbons) cel.fill(new Path2D(clear));
  cel.globalCompositeOperation = 'source-over';
  cel.filter = 'none';

  for (const { outline, root, anchor, angle, stretch } of ribbons) {
    piece.clearRect(0, 0, width, height);
    piece.drawImage(source.canvas, 0, 0);
    piece.save();
    piece.translate(leftPad, 0);
    piece.scale(scale, scale);
    piece.globalCompositeOperation = 'destination-in';
    piece.filter = 'blur(3px)';
    piece.fill(new Path2D(outline));
    piece.restore();
    cel.save();
    cel.translate(...anchor);
    cel.rotate(angle);
    cel.scale(...stretch);
    cel.drawImage(piece.canvas, -root[0] - pad, -root[1], width / scale, height / scale);
    cel.restore();
  }
  cel.restore();
}

function makeDesertDescent(image, wideGround, smoke, fallen, { width, height, layer, random, lerp, smooth, bloom }) {
  const { thirdDiveAt, thirdGroundAt, groundLightOut, revealBodyAt,
    revealBodyEnd, pushInStart, pushInEnd, groundDriftEnd } = ORIGINAL_OPENING_SHOT_TIMING;
  const light = { u: 0.523, v: 0.622 };
  const dust = layer(720, 350, { alpha: true });
  dust.filter = 'grayscale(1) brightness(1.03) blur(2.2px)';
  dust.drawImage(smoke, 8, 8, 704, 334);
  dust.filter = 'none';
  dust.globalCompositeOperation = 'source-atop';
  dust.fillStyle = 'rgba(159,103,64,0.57)';
  dust.fillRect(0, 0, 720, 350);

  const sand = random(84917);
  const grains = Array.from({ length: 103 }, () => ({
    angle: sand() * Math.PI * 2, depth: sand(),
    life: 0.64 + sand() * 0.47, phase: sand(),
    brightness: 0.16 + sand() * 0.44, size: 0.48 + sand() * 1.25
  }));
  const dustStreams = [
    [-120, 540, 0.48, 1070, 126, 0.34, 160],
    [1670, 579, -0.67, 1220, 145, 0.43, -208],
    [450, 770, 0.87, 1280, 164, 0.38, 226],
    [1710, 845, -0.94, 1040, 140, 0.37, -255]
  ];
  const sparks = Array.from({ length: 32 }, () => ({
    x: (sand() - 0.5) * 266, y: (sand() - 0.5) * 46, phase: sand(),
    rate: 0.42 + sand() * 0.79, size: 0.55 + sand() * 1.36
  }));
  const driftingSand = Array.from({ length: 146 }, () => ({
    phase: sand(), depth: sand(), offset: sand(), gust: sand(), size: 0.6 + sand() * 1.8
  }));

  const bodySand = Array.from({ length: 94 }, () => ({
    phase: sand(), lane: sand(), speed: sand(), lift: sand(), size: 0.35 + sand() ** 1.7 * 2.1
  }));
  const bodySmoke = [
    [0.47, 0.48, 0.49, 0.29, 0.68, 0.00],
    [0.66, 0.38, 0.36, 0.38, 0.58, 0.34],
    [0.22, 0.56, 0.39, 0.25, 0.40, 0.71],
    [0.70, 0.73, 0.41, 0.27, 0.36, 0.56]
  ];
  const ashSmoke = layer(512, 256, { alpha: true });
  ashSmoke.filter = 'grayscale(1) brightness(0.73) blur(3px)';
  ashSmoke.drawImage(smoke, 9, 9, 494, 238);
  ashSmoke.filter = 'none';
  ashSmoke.globalCompositeOperation = 'source-atop';
  ashSmoke.fillStyle = 'rgba(105,83,70,0.38)';
  ashSmoke.fillRect(0, 0, 512, 256);
  const fittedBody = fitFallenProportions(fallen, layer);
  const clothScale = fallen.width / 900;
  const bodyCel = layer(fittedBody.canvas.width, fittedBody.canvas.height,
    { alpha: true, willReadFrequently: true });
  bodyCel.filter = 'brightness(0.97) saturate(0.91)';
  bodyCel.drawImage(fittedBody.canvas, 0, 0);
  alignFallenCloth(bodyCel, fittedBody.pad, clothScale, layer);
  // Coordinates follow the 900px-wide character reference, before the left padding.
  const leftRags = {
    outline: 'M244 260 Q302 246 340 242 Q375 240 411 218 L456 201 465 220 Q433 233 405 248 Q370 262 350 284 L307 300 255 298 233 282 Z',
    x: 328, y: 263, rx: 117, ry: 32, angle: -0.30, strength: 9.5, phase: 0.9, root: 439
  };
  const shoulderTear = {
    outline: 'M602 76 Q621 78 644 90 Q668 101 690 118 Q714 124 732 136 L729 153 703 153 Q673 141 641 132 Q612 119 601 100 Z',
    x: 654, y: 111, rx: 74, ry: 25, angle: 0.41, strength: 8.1, phase: 2.6, root: 717
  };
  const hoodHem = {
    outline: 'M735 249 Q762 250 787 247 Q800 248 819 254 L823 272 Q804 283 782 278 Q756 278 735 270 L725 258 Z',
    x: 770, y: 261, rx: 57, ry: 18, angle: 0.12, strength: 5.5, phase: 3.8, root: 821
  };
  const wideCloth = makeFallenCloth(bodyCel, fittedBody.pad, clothScale, layer, [leftRags, shoulderTear, hoodHem]);
  const chestCloth = makeFallenCloth(bodyCel, fittedBody.pad, clothScale, layer, [
    { ...shoulderTear, strength: 4.8 },
    {
      outline: 'M374 213 Q397 195 419 181 Q441 163 469 153 L507 151 518 165 Q502 188 494 214 L461 230 Q424 232 380 235 Z',
      x: 441, y: 197, rx: 77, ry: 32, angle: -0.41, strength: 5.2, phase: 1.4, root: 519
    },
    hoodHem,
    {
      outline: 'M727 160 Q754 144 777 147 Q804 153 820 169 L817 184 802 190 Q776 170 744 179 L721 179 Z',
      x: 777, y: 166, rx: 44, ry: 15, angle: 0.13, strength: 3.1, phase: 4.7
    }
  ]);

  const dustCloud = layer(272, 144, { alpha: true });
  const cloudPixels = dustCloud.createImageData(dustCloud.canvas.width, dustCloud.canvas.height);
  const cloudRandom = random(316527);
  const cloudNoise = Array.from({ length: 24 * 17 }, () => cloudRandom());

  function sampleCloud(u, v) {
    const x = ((u % 1) + 1) % 1 * 23;
    const y = ((v % 1) + 1) % 1 * 16;
    const col = Math.floor(x), row = Math.floor(y);
    const mixX = smooth(0, 1, x - col), mixY = smooth(0, 1, y - row);
    const i = row * 24 + col;
    return lerp(lerp(cloudNoise[i], cloudNoise[i + 1], mixX),
      lerp(cloudNoise[i + 24], cloudNoise[i + 25], mixX), mixY);
  }

  function bank(ctx, x, y, w, h, angle, opacity, direction) {
    ctx.save();
    ctx.translate(x, y);
    ctx.rotate(angle);
    ctx.scale(direction, 1);
    ctx.globalAlpha *= opacity;
    ctx.drawImage(dust.canvas, -w / 2, -h / 2, w, h);
    ctx.restore();
  }

  function drawPassage(ctx, t, focus) {
    const density = smooth(thirdDiveAt + 0.38, thirdDiveAt + 0.86, t) *
      (1 - smooth(thirdDiveAt + 0.93, thirdGroundAt + 0.17, t));
    if (density <= 0) return;
    const time = t - thirdDiveAt;
    const veil = ctx.createRadialGradient(focus.x, focus.y, 36, focus.x, focus.y, width * 0.70);
    veil.addColorStop(0, 'rgba(229,175,114,' + 0.29 * density + ')');
    veil.addColorStop(0.32, 'rgba(121,81,66,' + 0.36 * density + ')');
    veil.addColorStop(1, 'rgba(46,25,45,' + 0.79 * density + ')');
    ctx.fillStyle = veil;
    ctx.fillRect(0, 0, width, height);

    bank(ctx, lerp(-260, 420, time), lerp(160, 820, time), 1570, 394, -0.15, density * 0.73, 1);
    bank(ctx, lerp(2150, 1580, time), lerp(280, 875, time), 1440, 350, 0.19, density * 0.74, -1);
    bank(ctx, focus.x + 260, lerp(140, 1120, time), 1800, 390, -0.07, density * 0.48, -1);

    ctx.save();
    ctx.globalCompositeOperation = 'screen';
    ctx.lineCap = 'round';
    ctx.strokeStyle = '#efd1a3';
    for (const grain of grains) {
      const cycle = (grain.phase + time * grain.life) % 1;
      const vx = Math.cos(grain.angle);
      const vy = Math.sin(grain.angle) * 0.59;
      const distance = (60 + 1440 * cycle ** 2.35) * (0.73 + 0.27 * grain.depth);
      const x = focus.x + vx * distance;
      const y = focus.y + vy * distance;
      const streak = (7 + 41 * grain.depth) * cycle * density;
      ctx.globalAlpha = density * grain.brightness * smooth(0.03, 0.26, cycle) * (1 - smooth(0.76, 1, cycle));
      ctx.lineWidth = grain.size;
      ctx.beginPath();
      ctx.moveTo(x - vx * streak, y - vy * streak);
      ctx.lineTo(x, y);
      ctx.stroke();
    }
    ctx.restore();
  }

  function projectSurface(t) {
    const entry = smooth(thirdDiveAt + 0.77, thirdGroundAt + 0.92, t);
    const follow = smooth(pushInStart, pushInEnd, t);
    const linger = smooth(pushInEnd, groundDriftEnd, t);
    const cover = Math.max(width / image.width, height / image.height);
    const zoom = 1.12 + 0.12 * entry + 2.02 * follow + 0.20 * linger;
    const w = image.width * cover * zoom;
    const h = image.height * cover * zoom;
    const wideW = image.width * cover * (1.12 + 0.12 * entry);
    const wideH = image.height * cover * (1.12 + 0.12 * entry);
    const wideX = (width - wideW) / 2 + wideW * light.u;
    const wideY = (height - wideH) / 2 - 56 * (1 - entry) + wideH * light.v;
    const glowX = lerp(wideX, width * 0.545, follow) - 27 * linger;
    const glowY = lerp(wideY, height * 0.548, follow) - 5 * linger;
    return { x: glowX - w * light.u, y: glowY - h * light.v, w, h, glowX, glowY, zoom };
  }

  function projectWide(progress) {
    const distanceRatio = 1.5;
    const descentSpeedRatio = 3.3;
    const cover = Math.max(width / wideGround.width, height / wideGround.height);
    const zoom = cover * (1.035 + 0.043 * descentSpeedRatio * progress);
    const w = wideGround.width * zoom;
    const h = wideGround.height * zoom;
    const x = (width - w) * 0.5 - 13 * progress;
    // Lower the camera toward the valley, moving the projected ground upward.
    const y = (height - h) * 0.5 - 62 * progress;
    return { x, y, w, h, glowX: x + w * 0.508, glowY: y + h * 0.559,
      bodySpan: w * 0.135 / distanceRatio, background: wideGround };
  }

  function bodyBounds({ w, glowX, glowY, bodySpan = w * 0.173 }) {
    const span = bodySpan;
    const tall = span * fallen.height / fallen.width;
    return { x: glowX - span * 0.53, y: glowY - tall * 0.48, span, tall };
  }

  function drawFallen(ctx, body, time, closeUp) {
    const { x, y, span, tall } = body;
    bloom(ctx, x + span * 0.53, y + tall * 0.67, span * 0.51, tall * 0.24, '41,25,21', 0.55);
    const overhang = fittedBody.pad * span / fallen.width;
    const fadeAt = OPENING_SHOT_TIMING.thirdFadeAt;
    const movement = smooth(revealBodyAt, revealBodyAt + 0.78, time) * (1 - smooth(fadeAt - 0.85, fadeAt, time));
    let sprite = bodyCel.canvas;
    if (movement > 0) {
      const cloth = closeUp ? chestCloth : wideCloth;
      const elapsed = time - revealBodyAt;
      const gust = 0.18 + 0.47 * smooth(-0.35, 0.82, Math.sin(1.43 * elapsed + 0.64));
      cloth.draw(elapsed, gust, movement);
      sprite = cloth.surface;
    }
    ctx.drawImage(sprite, x - overhang, y, span + overhang, tall);
  }

  function drawBodyDust(ctx, t, body, reveal) {
    const exposure = smooth(0.04, 0.57, reveal);
    if (exposure <= 0) return;
    const { x, y, span, tall } = body;
    const time = t - revealBodyAt;
    for (const [u, v, w, h, power, phase] of bodySmoke) {
      const cycle = (phase + time * 0.29) % 1;
      const density = Math.sin(Math.PI * cycle) ** 1.15;
      const px = x + span * (u - 0.13 + 0.44 * cycle);
      const py = y + tall * (v - 0.14 * cycle);
      const smokeWidth = span * w * (0.79 + cycle * 0.36);
      const smokeHeight = tall * h * (0.74 + cycle * 0.52);
      ctx.save();
      ctx.globalAlpha *= exposure * density * power;
      ctx.translate(px, py);
      ctx.rotate(-0.11);
      ctx.drawImage(ashSmoke.canvas, -smokeWidth / 2, -smokeHeight / 2, smokeWidth, smokeHeight);
      ctx.restore();
    }

    ctx.save();
    const opacity = ctx.globalAlpha;
    ctx.lineCap = 'round';
    for (const grain of bodySand) {
      const cycle = (grain.phase + time * (0.32 + grain.speed * 0.35)) % 1;
      const px = x + span * (-0.13 + 1.34 * cycle);
      const py = y + tall * (0.40 + grain.lane * 0.53 - 0.16 * grain.lift * Math.sin(Math.PI * cycle));
      const gust = 0.60 + 0.40 * Math.sin(t * 1.12 + grain.lane * 5) ** 2;
      const flicker = Math.sin(Math.PI * cycle) ** 2;
      ctx.globalAlpha = opacity * exposure * gust * flicker * (0.21 + grain.lift * 0.49);
      ctx.strokeStyle = grain.lift > 0.60 ? '#efcca0' : '#be9062';
      ctx.lineWidth = grain.size * span / 1050;
      ctx.beginPath();
      ctx.moveTo(px - span * (0.003 + 0.013 * grain.speed), py + 0.7);
      ctx.lineTo(px, py);
      ctx.stroke();
    }
    ctx.restore();
  }

  function drawRevealCloud(ctx, body, reveal, t) {
    if (reveal >= 1) return;
    const { x, y, span, tall } = body;
    const { width: cols, height: rows } = dustCloud.canvas;
    const { data } = cloudPixels;
    const age = t - thirdGroundAt;
    const wind = 0.025 * age + reveal * 0.25;
    const edge = lerp(-0.45, 1.78, reveal);
    const strength = 1 - smooth(0.62, 1, reveal);
    for (let row = 0; row < rows; row++) {
      const v = -0.52 + row / (rows - 1) * 2.02;
      for (let col = 0; col < cols; col++) {
        const u = -0.60 + col / (cols - 1) * 2.52;
        const i = (row * cols + col) * 4;
        // Broad, overlapping curls move with one prevailing wind along the valley floor.
        const fold = sampleCloud(u * 0.32 - age * 0.041, v * 0.47 + 0.26);
        const eddy = sampleCloud(u * 0.37 - age * 0.035 + 0.43, v * 0.61 + 0.07);
        const wisps = sampleCloud(u * 0.79 - age * 0.093, v * 1.19 + (eddy - 0.5) * 0.21);
        const turbulence = (fold - 0.5) * 0.63 + (wisps - 0.5) * 0.26;
        const driftX = u - wind;
        const centreY = 0.50 + 0.11 * (eddy - 0.5);
        const radius = Math.hypot((driftX - 0.46) / 0.96, (v - centreY) / 0.74);
        const core = 1 - smooth(0.67, 1.13, radius + turbulence * 0.74);
        const groundY = 0.91 - 0.13 * smooth(-0.3, 1.55, driftX) + 0.17 * (eddy - 0.5);
        const wakeRadius = Math.hypot((driftX - 0.68) / 1.09, (v - groundY) / 0.43);
        const wake = (1 - smooth(0.31, 1.05, wakeRadius + turbulence * 0.52)) * (0.25 + 0.28 * fold);
        const volume = core + (1 - core) * wake;
        // Wind strips the upstream edge first. The centre is opaque until the front reaches it.
        const front = smooth(edge - 0.20, edge + 0.14, u + turbulence);
        const warmCore = 1 - smooth(0, 0.73, Math.hypot((u - 0.53 - wind * 0.38) / 0.82, (v - 0.48) / 1.10));
        const backlight = warmCore * (1 - smooth(thirdGroundAt, groundLightOut, t));
        const texture = fold * 0.68 + wisps * 0.32;
        data[i] = 153 + 55 * texture + 46 * backlight;
        data[i + 1] = 104 + 53 * texture + 57 * backlight;
        data[i + 2] = 64 + 48 * texture + 58 * backlight;
        data[i + 3] = Math.round(volume * front * strength * 255);
      }
    }
    dustCloud.putImageData(cloudPixels, 0, 0);
    ctx.save();
    ctx.filter = 'blur(' + Math.max(3.5, span * 0.008).toFixed(2) + 'px)';
    ctx.drawImage(dustCloud.canvas, x - span * 0.60, y - tall * 0.52, span * 2.52, tall * 2.02);
    ctx.restore();

    const glow = 1 - smooth(thirdGroundAt, groundLightOut, t);
    ctx.save();
    ctx.globalCompositeOperation = 'screen';
    bloom(ctx, x + span * 0.53, y + tall * 0.48, span * 0.40, tall * 0.62, '242,174,93', glow * 0.44);
    bloom(ctx, x + span * 0.53, y + tall * 0.48, span * 0.10, tall * 0.24, '255,231,172', glow * 0.67);
    ctx.restore();
  }

  function drawSand(ctx, elapsed, close) {
    ctx.save();
    ctx.strokeStyle = '#e8ba86';
    ctx.lineCap = 'round';
    for (const grain of driftingSand) {
      const phase = (grain.phase + elapsed * (0.07 + grain.gust * 0.10) + 1) % 1;
      const x = lerp(-85, width + 90, phase);
      const y = height * lerp(0.59, 0.98, grain.depth) +
        15 * Math.sin(grain.offset * 13 + phase * 4.7);
      const visibility = Math.sin(Math.PI * phase) ** 2;
      const gust = 0.48 + 0.52 * Math.sin(elapsed * 0.78 + grain.gust * 5) ** 2;
      ctx.globalAlpha = close * visibility * gust * lerp(0.07, 0.31, grain.depth);
      ctx.lineWidth = grain.size * lerp(0.45, 1.05, grain.depth);
      ctx.beginPath();
      ctx.moveTo(x - grain.depth * 14, y + 0.8);
      ctx.lineTo(x, y);
      ctx.stroke();
    }
    ctx.restore();
  }

  function drawSurface(ctx, t, opacity, projection, fabricTime, closeUp = false) {
    if (opacity <= 0) return;
    const { x, y, w, h, glowX, glowY, background = image } = projection;
    const elapsed = t - thirdGroundAt;
    const reveal = smooth(revealBodyAt, revealBodyEnd, t);

    ctx.save();
    ctx.globalAlpha = opacity;
    ctx.imageSmoothingQuality = 'high';
    ctx.filter = 'saturate(0.89)';
    ctx.drawImage(background, x, y, w, h);
    ctx.filter = 'none';
    const body = bodyBounds(projection);
    drawFallen(ctx, body, fabricTime, closeUp);
    drawBodyDust(ctx, t, body, reveal);
    const distantClarity = lerp(0.38, 1, smooth(0.10, 0.91, reveal));
    for (const [baseX, baseY, angle, bw, bh, alpha, wind] of dustStreams) {
      const span = width + bw;
      const position = (((baseX + bw / 2 + elapsed * wind) % span) + span) % span - bw / 2;
      bank(ctx, position, baseY + Math.sin(elapsed * 1.02 + baseX) * 12, bw, bh,
        angle * 0.14, alpha * distantClarity * (0.50 + 0.32 * smooth(0, 1.6, elapsed)), wind > 0 ? 1 : -1);
    }

    drawRevealCloud(ctx, body, reveal, t);
    drawSand(ctx, elapsed, smooth(0.5, 2.7, elapsed));
    ctx.globalCompositeOperation = 'screen';
    for (const spark of sparks) {
      const cycle = (spark.phase + (elapsed + 1) * spark.rate) % 1;
      const intensity = smooth(0, 0.20, cycle) * (1 - smooth(0.44, 1, cycle));
      const sx = glowX + spark.x * (0.50 + cycle * 0.53) * body.span / 420 + 21 * cycle;
      const sy = glowY + spark.y * body.tall / 220 - cycle * 53;
      ctx.globalAlpha = opacity * intensity * 0.35 * (1 - smooth(thirdGroundAt, groundLightOut, t));
      ctx.fillStyle = '#ffe7b6';
      ctx.fillRect(sx, sy, spark.size, spark.size);
    }
    ctx.restore();

  }

  return { projectSurface, projectWide, drawSurface, drawPassage, bodyBounds };
}
