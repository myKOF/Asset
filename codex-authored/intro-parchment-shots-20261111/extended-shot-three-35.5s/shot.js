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
  // Trace the correction at the scale of the 324 × 196 hand reference.
  const thumbOutline = new Path2D(`M113 64 C126 55 138 42 152 37 C173 30 195 34 211 43
    C230 48 244 55 248 65 C253 74 251 87 246 98
    C238 114 228 132 216 144 C208 152 197 153 191 149
    C187 144 190 133 196 124 C199 119 203 116 209 112
    C217 106 222 98 222 88 C222 82 218 80 213 81
    C207 81 203 77 197 77 C192 78 187 82 182 85
    C176 88 171 86 168 83 C165 83 160 85 156 87
    L151 89 Q149 85 154 82 L163 76
    C149 80 136 83 123 81 Q110 81 112 71 Z`);
  // Preserve the original fingers through the creases where they enter the palm.
  const fingerOutline = new Path2D(`M0 80 L116 80 L131 83 L143 91 Q151 88 157 83
    C162 81 165 81 168 81 Q175 90 182 86 Q190 82 195 78
    Q203 75 212 81 Q221 83 220 92 Q217 106 209 112
    C201 116 195 125 190 139 L181 160 L0 196 Z`);

  function thumbMask(mask) {
    mask.scale(mask.canvas.width / 324, mask.canvas.height / 196);
    mask.filter = "blur(1.15px)";
    mask.fill(thumbOutline);
    mask.filter = "none";
    mask.globalCompositeOperation = "destination-out";
    mask.fill(fingerOutline);
  }

  function compositeHand(base, thumb) {
    const cel = layer(base.width, base.height, { alpha: true });
    cel.drawImage(base, 0, 0);
    const patch = layer(388, 234, { alpha: true });
    patch.imageSmoothingQuality = "high";
    patch.drawImage(thumb, 0, 0, patch.canvas.width, patch.canvas.height);

    // Restore transparency where removing the old thumb exposed the guide’s grey background.
    const pixels = patch.getImageData(0, 0, patch.canvas.width, patch.canvas.height);
    const { data } = pixels;
    for (let i = 0; i < data.length; i += 4) {
      const chroma = Math.max(data[i], data[i + 1], data[i + 2]) -
        Math.min(data[i], data[i + 1], data[i + 2]);
      data[i + 3] *= smooth(8, 23, chroma);
    }
    patch.putImageData(pixels, 0, 0);

    // The source crop includes a grey backing. Clear its upper fringe along
    // the new silhouette so the desert plate shows through the old thumb gap.
    patch.save();
    patch.scale(patch.canvas.width / 324, patch.canvas.height / 196);
    patch.globalCompositeOperation = "destination-out";
    patch.filter = "blur(0.65px)";
    patch.fill(new Path2D(`M94 20 H222 L221 48
      Q215 51 206 51 Q194 51 185 57 C177 61 171 67 166 72
      Q159 77 151 83 L143 86 L94 86 Z`));
    patch.restore();

    const mask = layer(patch.canvas.width, patch.canvas.height, { alpha: true });
    thumbMask(mask);
    patch.globalCompositeOperation = "destination-in";
    patch.drawImage(mask.canvas, 0, 0);

    // Registration maps the supplied 324 × 196 crop back to the character sprite.
    cel.globalCompositeOperation = "destination-out";
    cel.drawImage(mask.canvas, 840, 567);
    cel.globalCompositeOperation = "lighter";
    cel.drawImage(patch.canvas, 840, 567);
    return cel.canvas;
  }

  function shortenPalm(patch) {
    const { width, height } = patch.canvas;
    const wrist = { x: 213, y: 63 };
    const fingerRoots = { x: 79, y: 112 };
    const length = Math.hypot(fingerRoots.x - wrist.x, fingerRoots.y - wrist.y);
    const axisX = (fingerRoots.x - wrist.x) / length;
    const axisY = (fingerRoots.y - wrist.y) / length;
    const shift = length * 0.20;
    // Complete the shift before the exposed fingers so their shapes move together.
    const fingerStart = length * 0.72;
    const shortenedStart = fingerStart - shift;
    const source = patch.getImageData(0, 0, width, height);
    const warped = patch.createImageData(width, height);
    for (let y = 0; y < height; y++) {
      for (let x = 0; x < width; x++) {
        const dx = x - wrist.x;
        const dy = y - wrist.y;
        const along = dx * axisX + dy * axisY;
        const across = dx * axisY - dy * axisX;
        const withinPalm = 1 - smooth(53, 83, Math.abs(across));
        const displacement = shift * smooth(0, shortenedStart, along) * withinPalm;
        const sampleX = x + axisX * displacement;
        const sampleY = y + axisY * displacement;
        const fromX = Math.max(0, Math.min(width - 1, sampleX));
        const fromY = Math.max(0, Math.min(height - 1, sampleY));
        const left = Math.floor(fromX);
        const top = Math.floor(fromY);
        const right = Math.min(width - 1, left + 1);
        const bottom = Math.min(height - 1, top + 1);
        for (let channel = 0; channel < 4; channel++) {
          const upper = lerp(source.data[(top * width + left) * 4 + channel],
            source.data[(top * width + right) * 4 + channel], fromX - left);
          const lower = lerp(source.data[(bottom * width + left) * 4 + channel],
            source.data[(bottom * width + right) * 4 + channel], fromX - left);
          warped.data[(y * width + x) * 4 + channel] = lerp(upper, lower, fromY - top);
        }
      }
    }
    patch.putImageData(warped, 0, 0);
  }

  function applyBuriedHand(cel, image) {
    // Match the reviewed wrist landmarks in the unzoomed character cel.
    const patch = layer(241, 184, { alpha: true });
    patch.imageSmoothingQuality = "high";
    patch.drawImage(image, 0, 0, 241, 184);
    const mask = layer(241, 184, { alpha: true });
    mask.scale(241 / 568, 184 / 387);
    mask.filter = "blur(4.2px)";
    mask.fill(new Path2D("M35 208 C42 158 87 119 117 111 C155 99 205 100 239 117 C264 113 279 98 305 87 C346 67 389 53 420 57 C451 64 476 87 489 117 C511 165 510 207 492 244 C471 285 455 311 396 336 C328 358 240 366 173 352 C96 347 41 321 26 287 C15 259 20 228 35 208 Z"));
    const pixels = patch.getImageData(0, 0, 241, 184);
    const { data } = pixels;
    const patchWidth = patch.canvas.width;
    const patchHeight = patch.canvas.height;
    const visited = new Uint8Array(patchWidth * patchHeight);
    const backdrop = [];
    function markBackdrop(index) {
      if (visited[index]) return;
      const offset = index * 4;
      const chroma = Math.max(data[offset], data[offset + 1], data[offset + 2]) -
        Math.min(data[offset], data[offset + 1], data[offset + 2]);
      if (chroma >= 37) return;
      visited[index] = 1;
      backdrop.push(index);
    }
    // Key only gray contiguous with the backing, preserving silver specular highlights.
    for (let x = 0; x < patchWidth; x++) {
      markBackdrop(x);
      markBackdrop((patchHeight - 1) * patchWidth + x);
    }
    for (let y = 0; y < patchHeight; y++) {
      markBackdrop(y * patchWidth);
      markBackdrop(y * patchWidth + patchWidth - 1);
    }
    for (let i = 0; i < backdrop.length; i++) {
      const index = backdrop[i];
      const x = index % patchWidth;
      if (x > 0) markBackdrop(index - 1);
      if (x < patchWidth - 1) markBackdrop(index + 1);
      if (index >= patchWidth) markBackdrop(index - patchWidth);
      if (index < (patchHeight - 1) * patchWidth) markBackdrop(index + patchWidth);
    }
    for (let i = 0; i < data.length; i += 4) {
      const r = data[i], g = data[i + 1], b = data[i + 2];
      const chroma = r - b;
      if (visited[i / 4]) data[i + 3] *= smooth(16, 37, chroma);
      data[i] = r * 0.93 + g * 0.024;
      data[i + 1] = g * 0.97 + r * 0.010;
      data[i + 2] = b * 0.98 + g * 0.022;
    }
    patch.putImageData(pixels, 0, 0);
    shortenPalm(patch);
    patch.globalCompositeOperation = "destination-in";
    patch.drawImage(mask.canvas, 0, 0);
    const context = cel.getContext("2d");
    context.globalCompositeOperation = "destination-out";
    context.drawImage(mask.canvas, 890, 591);
    context.globalCompositeOperation = "lighter";
    context.drawImage(patch.canvas, 890, 591);
    return cel;
  }

  function buryWrist(cel, sandRelief) {
    // The mask exposes the actual desert plate beneath the cel at each camera angle.
    const mask = layer(403, 248, { alpha: true });
    const origin = { x: 877, y: 550 };
    const screenScale = 0.591043;
    mask.translate(-origin.x, -origin.y);
    mask.scale(1 / screenScale, 1 / screenScale);
    mask.translate(-472.8043, -339.5905);

    const edge = new Path2D(`M998 735
      C1018 721 1032 710 1056 707
      C1084 700 1110 702 1137 692
      C1144 691 1151 698 1158 704
      Q1162 710 1168 710 Q1168 716 1173 720
      Q1173 725 1179 728 Q1177 736 1171 740
      C1171 743 1154 745 1143 753
      C1139 757 1131 760 1135 765
      C1128 770 1123 772 1125 779
      C1117 790 1105 791 1089 793
      C1068 797 1028 793 1003 784
      C981 776 986 750 998 735 Z`);
    mask.filter = 'blur(16px)';
    mask.globalAlpha = 0.93;
    mask.fill(edge);
    mask.filter = 'blur(3.6px)';
    mask.globalAlpha = 1;
    mask.fill(edge);

    // Break up the transition inside the outline with faint sand pockets.
    mask.resetTransform();
    const pixels = mask.getImageData(0, 0, mask.canvas.width, mask.canvas.height);
    const { data } = pixels;
    for (let y = 0; y < pixels.height; y++) {
      for (let x = 0; x < pixels.width; x++) {
        const alpha = (y * pixels.width + x) * 4 + 3;
        const cover = data[alpha] / 255;
        const ripple = Math.sin(y * 0.29 + x * 0.11 + Math.cos(x * 0.18) * 1.4);
        const grit = Math.sin(x * 1.91 + y * 2.89 + Math.cos(x + y * 0.42) * 2.2);
        data[alpha] += 255 * cover * (1 - cover) * (ripple * 0.28 + grit * 0.16);
      }
    }
    mask.putImageData(pixels, 0, 0);
    mask.translate(-origin.x, -origin.y);
    mask.scale(1 / screenScale, 1 / screenScale);
    mask.translate(-472.8043, -339.5905);

    // Keep the four exposed tips. Soften where their lowest edges slip into the sand.
    mask.globalCompositeOperation = 'destination-out';
    mask.filter = 'blur(1.8px)';
    const fingertips = new Path2D(`M1039 724 C1046 722 1051 729 1052 737
      C1054 742 1052 746 1048 745 C1045 743 1042 739 1039 737
      C1036 732 1035 726 1039 724 Z
      M1037 735 C1044 736 1049 742 1049 751
      C1049 755 1046 757 1042 757 C1037 756 1034 750 1034 743
      Q1033 737 1037 735 Z
      M1059 723 C1065 723 1068 734 1067 743
      Q1066 748 1062 745 C1058 741 1056 731 1059 723 Z
      M1066 743 C1071 741 1077 748 1079 754
      C1081 760 1083 766 1081 768 C1075 768 1070 764 1067 759
      C1064 755 1061 746 1066 743 Z`);
    mask.fill(fingertips);

    const context = cel.getContext('2d');
    context.globalCompositeOperation = 'destination-out';
    context.drawImage(mask.canvas, origin.x, origin.y);
    context.globalCompositeOperation = 'source-over';

    const relief = layer(mask.canvas.width, mask.canvas.height, { alpha: true });
    relief.imageSmoothingQuality = 'high';
    relief.setTransform(mask.getTransform());
    relief.drawImage(sandRelief, 1000, 665, 220, 152);
    relief.globalCompositeOperation = 'destination-in';
    relief.filter = 'blur(10px)';
    relief.fill(new Path2D(`M1009 751
      C1032 726 1043 725 1071 715
      C1094 706 1112 700 1138 695
      C1149 696 1157 705 1165 707
      Q1170 717 1179 724 L1180 733
      C1166 744 1153 742 1141 755
      C1126 772 1108 781 1088 784
      C1062 789 1026 778 1008 769
      Q997 759 1009 751 Z`));
    relief.globalCompositeOperation = 'destination-out';
    relief.filter = 'blur(2px)';
    relief.lineWidth = 5;
    relief.stroke(fingertips);
    relief.fill(fingertips);
    context.drawImage(relief.canvas, origin.x, origin.y);
    return cel;
  }

  const shot = { duration };
  window.openingShot = shot;
  shot.ready = Promise.all([
    loadImage('assets/mortal-map.png'), loadImage('assets/desert-surface.png'), loadImage('assets/collapse-smoke.png'), loadImage('assets/desert-wide-extended.png'),
    loadImage('assets/charred-feather.png'), loadImage('assets/archangel-fallen-ivory.png'), loadImage('assets/archangel-left-thumb-reference-edit.png'), loadImage('assets/hand-buried-approved.png'), loadImage('assets/wrist-sand-relief.png'), makeIntroFeatherParticles(), document.fonts.load('700 48px "Noto Serif TC"')
  ]).then(([map, desert, smoke, wideDesert, feather, fallen, thumb, buriedHand, wristSand, featherFx]) => {
    const render = makeMortalMap(map, desert, wideDesert, smoke, feather, buryWrist(applyBuriedHand(compositeHand(fallen, thumb), buriedHand), wristSand), {
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
