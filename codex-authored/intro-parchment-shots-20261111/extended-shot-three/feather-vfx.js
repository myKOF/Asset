'use strict';

async function makeIntroFeatherParticles() {
  const directory = 'assets/feather-vfx/';
  async function readJson(name) {
    const response = await fetch(directory + name);
    if (!response.ok) throw new Error('Unable to load feather VFX: ' + name);
    return response.json();
  }
  const [preset, files] = await Promise.all([
    readJson('intro-feather-radiance.json'), readJson('textures.json')
  ]);
  const textures = new Map(await Promise.all(Object.entries(files).map(async ([id, name]) => {
    const image = new Image();
    image.src = directory + name;
    await image.decode();
    return [id, image];
  })));

  const tinted = new Map();
  function textureFor(id, tint) {
    const key = id + ':' + tint;
    if (tinted.has(key)) return tinted.get(key);
    const image = textures.get(id);
    const canvas = document.createElement('canvas');
    canvas.width = image.naturalWidth;
    canvas.height = image.naturalHeight;
    const ctx = canvas.getContext('2d');
    ctx.drawImage(image, 0, 0);
    ctx.globalCompositeOperation = 'multiply';
    ctx.fillStyle = '#' + tint.toString(16).padStart(6, '0');
    ctx.fillRect(0, 0, canvas.width, canvas.height);
    ctx.globalCompositeOperation = 'destination-in';
    ctx.drawImage(image, 0, 0);
    tinted.set(key, canvas);
    return canvas;
  }

  const frames = [];
  const samplesPerSecond = 60;
  let frame;
  const runtime = VFXCore.createRuntime({
    resolver: { resolve: (id) => id },
    backend: {
      createNode: (node) => {
        if (node.kind !== 'sprite' || node.sheet || node.blendMode !== 'add') {
          throw new Error('Feather VFX requires additive sprite textures: ' + node.assetUrl);
        }
        return node.assetUrl;
      },
      updateNode: (id, pose) => {
        if (!pose.visible || pose.alpha <= 0) return;
        const { x, y, rotation, scaleX, scaleY, anchorX, anchorY, alpha, zIndex, tint } = pose;
        frame.push({
          texture: textureFor(id, tint), x, y, rotation, scaleX, scaleY, anchorX, anchorY, alpha, zIndex,
        });
      },
      destroyNode: () => {},
    },
  });
  runtime.registerPreset(preset);
  runtime.play(preset.id, { seed: 41705 });
  const samples = Math.ceil(preset.duration * samplesPerSecond);
  for (let index = 0; index <= samples; index++) {
    frame = [];
    runtime.update(index === 0 ? 0 : 1 / samplesPerSecond);
    frames.push(frame.sort((a, b) => a.zIndex - b.zIndex));
  }
  runtime.destroy();

  return function renderFeatherParticles(ctx, age, originX, originY, scale) {
    const index = Math.max(0, Math.min(samples, Math.floor(age * samplesPerSecond + 1e-5)));
    ctx.save();
    ctx.translate(originX, originY);
    ctx.scale(scale, scale);
    const opacity = ctx.globalAlpha;
    ctx.globalCompositeOperation = 'lighter';
    for (const pose of frames[index]) {
      const { texture, x, y, rotation, scaleX, scaleY, anchorX, anchorY, alpha } = pose;
      const width = texture.width * scaleX;
      const height = texture.height * scaleY;
      ctx.save();
      ctx.globalAlpha = opacity * alpha;
      ctx.translate(x, y);
      ctx.rotate(rotation);
      ctx.drawImage(texture, -width * anchorX, -height * anchorY, width, height);
      ctx.restore();
    }
    ctx.restore();
  };
}
