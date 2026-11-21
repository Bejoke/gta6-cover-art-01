// Canvas rendering: the procedural neon-coast scenes, the poster
// composition, the lettering, and the export drawing.

import { GRADES, panelsFor, titleAnchor } from './cover.js';
import { EXPORT_SIZES } from './state.js';
import { drawPhotoCover } from './photos.js';

// A small seeded random generator so the film grain looks the same on
// every render of the same cover.
function mulberry32(seed) {
  let a = seed >>> 0;
  return function () {
    a |= 0;
    a = (a + 0x6d2b79f5) | 0;
    let t = Math.imul(a ^ (a >>> 15), 1 | a);
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

function roundRectPath(ctx, x, y, w, h, r) {
  ctx.beginPath();
  ctx.moveTo(x + r, y);
  ctx.arcTo(x + w, y, x + w, y + h, r);
  ctx.arcTo(x + w, y + h, x, y + h, r);
  ctx.arcTo(x, y + h, x, y, r);
  ctx.arcTo(x, y, x + w, y, r);
  ctx.closePath();
}

function skyFill(ctx, W, H, grade) {
  const g = ctx.createLinearGradient(0, 0, 0, H);
  g.addColorStop(0, grade.skyTop);
  g.addColorStop(0.55, grade.skyMid);
  g.addColorStop(1, grade.skyBottom);
  ctx.fillStyle = g;
  ctx.fillRect(0, 0, W, H);
}

function drawSun(ctx, cx, cy, r, color) {
  const glow = ctx.createRadialGradient(cx, cy, r * 0.2, cx, cy, r * 2.4);
  glow.addColorStop(0, `${color}b3`);
  glow.addColorStop(1, `${color}00`);
  ctx.fillStyle = glow;
  ctx.beginPath();
  ctx.arc(cx, cy, r * 2.4, 0, Math.PI * 2);
  ctx.fill();
  ctx.fillStyle = color;
  ctx.beginPath();
  ctx.arc(cx, cy, r, 0, Math.PI * 2);
  ctx.fill();
  // Retro slats across the lower half of the disc.
  ctx.save();
  ctx.beginPath();
  ctx.arc(cx, cy, r, 0, Math.PI * 2);
  ctx.clip();
  ctx.fillStyle = 'rgba(20, 8, 40, 0.55)';
  let y = cy + r * 0.1;
  let band = r * 0.06;
  while (y < cy + r) {
    ctx.fillRect(cx - r, y, r * 2, band);
    y += band * 2.2;
    band *= 1.5;
  }
  ctx.restore();
}

function drawSkyline(ctx, W, horizonY, rand) {
  let x = 0;
  while (x < W) {
    const bw = W * (0.04 + rand() * 0.06);
    const bh = horizonY * (0.25 + rand() * 0.5);
    ctx.fillStyle = '#160a2c';
    ctx.fillRect(x, horizonY - bh, bw, bh);
    ctx.fillStyle = '#ffd76a';
    for (let i = 0; i < 5; i++) {
      if (rand() > 0.5) {
        ctx.fillRect(x + rand() * bw * 0.8, horizonY - bh + rand() * bh * 0.7, 3, 4);
      }
    }
    x += bw + W * 0.012;
  }
}

function drawPalm(ctx, x, baseY, size, lean) {
  ctx.strokeStyle = '#12061f';
  ctx.lineWidth = Math.max(3, size * 0.06);
  ctx.lineCap = 'round';
  ctx.beginPath();
  ctx.moveTo(x, baseY);
  ctx.quadraticCurveTo(x + lean, baseY - size * 0.6, x + lean * 1.6, baseY - size);
  ctx.stroke();
  const topX = x + lean * 1.6;
  const topY = baseY - size;
  ctx.lineWidth = Math.max(3, size * 0.05);
  for (let i = 0; i < 7; i++) {
    const angle = Math.PI * (0.08 + i * 0.13);
    const len = size * (0.45 + (i % 2) * 0.1);
    ctx.beginPath();
    ctx.moveTo(topX, topY);
    ctx.quadraticCurveTo(
      topX + Math.cos(angle) * len * 0.55,
      topY - Math.sin(angle) * len * 0.7,
      topX + Math.cos(angle) * len,
      topY - Math.sin(angle) * len * 0.25,
    );
    ctx.stroke();
  }
  // Coconuts under the crown.
  ctx.fillStyle = '#12061f';
  ctx.beginPath();
  ctx.arc(topX - size * 0.03, topY + size * 0.04, size * 0.035, 0, Math.PI * 2);
  ctx.arc(topX + size * 0.04, topY + size * 0.05, size * 0.03, 0, Math.PI * 2);
  ctx.fill();
}

function neonSign(ctx, x, y, w, h, color, label) {
  ctx.save();
  ctx.shadowColor = color;
  ctx.shadowBlur = 18;
  ctx.fillStyle = color;
  roundRectPath(ctx, x, y, w, h, 6);
  ctx.fill();
  ctx.shadowBlur = 0;
  ctx.fillStyle = '#14061f';
  ctx.font = `700 ${Math.round(h * 0.42)}px system-ui, sans-serif`;
  ctx.textAlign = 'center';
  ctx.textBaseline = 'middle';
  ctx.fillText(label, x + w / 2, y + h / 2 + 1);
  ctx.restore();
}

function drawBoulevard(ctx, W, H, grade) {
  const rand = mulberry32(20261119);
  skyFill(ctx, W, H, grade);
  drawSun(ctx, W * 0.68, H * 0.4, H * 0.15, grade.sun);
  const horizon = H * 0.62;
  drawSkyline(ctx, W, horizon, rand);
  // Road receding to the horizon, with sidewalk strips beside it.
  ctx.fillStyle = '#150829';
  ctx.beginPath();
  ctx.moveTo(W * 0.44, horizon);
  ctx.lineTo(W * 0.56, horizon);
  ctx.lineTo(W * 0.98, H);
  ctx.lineTo(W * 0.02, H);
  ctx.closePath();
  ctx.fill();
  ctx.fillStyle = '#241040';
  ctx.beginPath();
  ctx.moveTo(W * 0.36, horizon);
  ctx.lineTo(W * 0.44, horizon);
  ctx.lineTo(W * 0.02, H);
  ctx.lineTo(0, H);
  ctx.closePath();
  ctx.fill();
  ctx.beginPath();
  ctx.moveTo(W * 0.56, horizon);
  ctx.lineTo(W * 0.64, horizon);
  ctx.lineTo(W, H);
  ctx.lineTo(W * 0.98, H);
  ctx.closePath();
  ctx.fill();
  // Lane dashes shrinking toward the horizon.
  ctx.fillStyle = '#ffe9a8';
  let t = 0;
  while (t < 1) {
    const y = horizon + (H - horizon) * t;
    const w = 2 + 8 * t;
    const h = 3 + 14 * t;
    ctx.fillRect(W / 2 - w / 2, y, w, h);
    t += 0.16;
  }
  drawPalm(ctx, W * 0.1, H * 0.98, H * 0.42, -W * 0.02);
  drawPalm(ctx, W * 0.9, H * 0.98, H * 0.36, W * 0.02);
  neonSign(ctx, W * 0.06, H * 0.3, W * 0.14, H * 0.07, grade.accent, 'MOTEL');
  neonSign(ctx, W * 0.8, H * 0.24, W * 0.12, H * 0.06, '#ff5edb', 'PIER');
}

function drawPier(ctx, W, H, grade) {
  const rand = mulberry32(777);
  skyFill(ctx, W, H, grade);
  drawSun(ctx, W * 0.3, H * 0.34, H * 0.14, grade.sun);
  // Gulls.
  ctx.strokeStyle = 'rgba(20, 8, 40, 0.8)';
  ctx.lineWidth = Math.max(2, H * 0.006);
  for (const [gx, gy, gs] of [
    [0.62, 0.2, 0.03],
    [0.72, 0.28, 0.022],
    [0.55, 0.32, 0.018],
  ]) {
    ctx.beginPath();
    ctx.arc(W * (gx - gs / 2), H * gy, (W * gs) / 2, Math.PI * 1.15, Math.PI * 1.85);
    ctx.arc(W * (gx + gs / 2), H * gy, (W * gs) / 2, Math.PI * 1.15, Math.PI * 1.85);
    ctx.stroke();
  }
  // Sea with the sun shimmering on it.
  const sea = ctx.createLinearGradient(0, H * 0.55, 0, H);
  sea.addColorStop(0, grade.skyBottom);
  sea.addColorStop(1, '#0a1030');
  ctx.fillStyle = sea;
  ctx.fillRect(0, H * 0.55, W, H * 0.45);
  ctx.fillStyle = grade.sun;
  for (let i = 0; i < 26; i++) {
    const y = H * (0.57 + rand() * 0.4);
    const w = W * (0.02 + rand() * 0.09);
    ctx.globalAlpha = 0.25 + rand() * 0.4;
    ctx.fillRect(W * 0.3 - w / 2 + (rand() - 0.5) * W * 0.04, y, w, 2 + rand() * 3);
  }
  ctx.globalAlpha = 1;
  // The pier: planks converging toward the horizon.
  const vpy = H * 0.56;
  ctx.fillStyle = '#2a1608';
  ctx.beginPath();
  ctx.moveTo(W * 0.2, H);
  ctx.lineTo(W * 0.44, vpy);
  ctx.lineTo(W * 0.56, vpy);
  ctx.lineTo(W * 0.8, H);
  ctx.closePath();
  ctx.fill();
  ctx.strokeStyle = 'rgba(0, 0, 0, 0.5)';
  ctx.lineWidth = 2;
  for (let i = 1; i < 9; i++) {
    const k = i / 9;
    const y = vpy + (H - vpy) * k * k;
    const left = W * 0.2 + (W * 0.44 - W * 0.2) * k;
    const right = W * 0.8 - (W * 0.8 - W * 0.56) * k;
    ctx.beginPath();
    ctx.moveTo(left, y);
    ctx.lineTo(right, y);
    ctx.stroke();
  }
  // Posts.
  ctx.fillStyle = '#1c0e04';
  for (const [px, py, pw, ph] of [
    [0.24, 0.86, 0.02, 0.14],
    [0.76, 0.86, 0.02, 0.14],
    [0.38, 0.68, 0.014, 0.09],
    [0.62, 0.68, 0.014, 0.09],
  ]) {
    ctx.fillRect(W * px, H * py - H * ph, W * pw, H * ph);
  }
}

// Paint one scene into a rectangle of the cover.
export function drawScene(ctx, scene, x, y, w, h, grade) {
  ctx.save();
  ctx.beginPath();
  ctx.rect(x, y, w, h);
  ctx.clip();
  ctx.translate(x, y);
  if (scene === 'pier') drawPier(ctx, w, h, grade);
  else drawBoulevard(ctx, w, h, grade);
  ctx.restore();
}

// A standalone canvas holding one scene, for the sample images.
export function sceneCanvas(scene, grade, w, h) {
  const canvas = document.createElement('canvas');
  canvas.width = w;
  canvas.height = h;
  const ctx = canvas.getContext('2d');
  drawScene(ctx, scene, 0, 0, w, h, grade);
  return canvas;
}

function fitFont(ctx, text, baseSize, maxWidth, family, weight) {
  let size = baseSize;
  ctx.font = `${weight} ${size}px ${family}`;
  while (size > 12 && ctx.measureText(text).width > maxWidth) {
    size -= 2;
    ctx.font = `${weight} ${size}px ${family}`;
  }
  return size;
}

function drawLettering(ctx, state, W, H, grade) {
  const anchor = titleAnchor(state.layout);
  const ax = W * anchor.x;
  const ay = H * anchor.y;
  const maxW = W * (1 - anchor.x * 2);

  ctx.save();
  ctx.textBaseline = 'alphabetic';
  ctx.textAlign = anchor.align;

  // Subtitle in script, just above the title.
  const subSize = Math.round(H * 0.042);
  ctx.font = `${subSize}px Pacifico, cursive`;
  ctx.fillStyle = grade.subtitle;
  ctx.shadowColor = grade.subtitle;
  ctx.shadowBlur = Math.round(H * 0.012);
  ctx.fillText(state.subtitle, ax, ay - H * 0.155);
  ctx.shadowBlur = 0;

  // Title: big Anton, white over an accent offset, tilted a touch.
  const titleSize = fitFont(ctx, state.title, Math.round(H * 0.15), maxW, 'Anton, sans-serif', 400);
  ctx.save();
  ctx.translate(ax, ay);
  ctx.rotate(-0.03);
  ctx.font = `400 ${titleSize}px Anton, sans-serif`;
  ctx.letterSpacing = '2px';
  ctx.fillStyle = grade.accent;
  ctx.fillText(state.title, 5, 6);
  ctx.strokeStyle = 'rgba(10, 4, 24, 0.9)';
  ctx.lineWidth = Math.max(2, titleSize * 0.05);
  ctx.strokeText(state.title, 0, 0);
  ctx.fillStyle = grade.title;
  ctx.fillText(state.title, 0, 0);
  ctx.restore();

  // Tagline under the title.
  const tagSize = Math.round(H * 0.024);
  ctx.font = `700 ${tagSize}px system-ui, sans-serif`;
  ctx.fillStyle = 'rgba(255, 255, 255, 0.92)';
  ctx.letterSpacing = '3px';
  ctx.fillText(state.tagline, ax, ay + H * 0.055);

  // Credit line, small, bottom-left corner.
  const creditSize = Math.round(H * 0.016);
  ctx.font = `600 ${creditSize}px system-ui, sans-serif`;
  ctx.fillStyle = 'rgba(255, 255, 255, 0.65)';
  ctx.textAlign = 'left';
  ctx.letterSpacing = '0px';
  ctx.fillText(state.credit, W * 0.03, H * 0.975);

  ctx.restore();
}

function drawBadge(ctx, W, H) {
  const s = Math.min(W, H);
  const bw = s * 0.19;
  const bh = s * 0.085;
  const x = W * 0.03;
  const y = H * 0.03;
  ctx.save();
  ctx.fillStyle = 'rgba(10, 5, 24, 0.72)';
  roundRectPath(ctx, x, y, bw, bh, bh * 0.18);
  ctx.fill();
  ctx.strokeStyle = '#ffffff';
  ctx.lineWidth = Math.max(1.5, s * 0.002);
  ctx.stroke();
  ctx.fillStyle = '#ffffff';
  ctx.font = `400 ${Math.round(bh * 0.52)}px Anton, sans-serif`;
  ctx.textAlign = 'left';
  ctx.textBaseline = 'middle';
  ctx.fillText('NC', x + bw * 0.07, y + bh / 2 + 1);
  ctx.font = `700 ${Math.round(bh * 0.22)}px system-ui, sans-serif`;
  ctx.fillStyle = '#ffd76a';
  ctx.fillText('NEON COAST', x + bw * 0.3, y + bh / 2 + 1);
  ctx.restore();
}

function drawRating(ctx, W, H) {
  const s = Math.min(W, H);
  const size = s * 0.075;
  const x = W - W * 0.03 - size;
  const y = H - H * 0.03 - size;
  ctx.save();
  ctx.strokeStyle = '#ffffff';
  ctx.lineWidth = Math.max(2, s * 0.003);
  ctx.strokeRect(x, y, size, size);
  ctx.fillStyle = '#ffffff';
  ctx.font = `400 ${Math.round(size * 0.42)}px Anton, sans-serif`;
  ctx.textAlign = 'center';
  ctx.textBaseline = 'middle';
  ctx.fillText('18+', x + size / 2, y + size / 2 + 1);
  ctx.restore();
}

function drawVignette(ctx, W, H) {
  const g = ctx.createRadialGradient(
    W / 2,
    H / 2,
    Math.min(W, H) * 0.42,
    W / 2,
    H / 2,
    Math.max(W, H) * 0.72,
  );
  g.addColorStop(0, 'rgba(5, 2, 12, 0)');
  g.addColorStop(1, 'rgba(5, 2, 12, 0.5)');
  ctx.fillStyle = g;
  ctx.fillRect(0, 0, W, H);
}

function drawGrain(ctx, W, H) {
  const rand = mulberry32(4242);
  const dots = Math.round((W * H) / 900);
  ctx.save();
  for (let i = 0; i < dots; i++) {
    const v = rand();
    ctx.fillStyle = v > 0.5 ? 'rgba(255, 255, 255, 0.05)' : 'rgba(0, 0, 0, 0.06)';
    ctx.fillRect(rand() * W, rand() * H, 1 + rand() * 2, 1 + rand() * 2);
  }
  ctx.restore();
}

// Paint the whole cover onto a canvas at the given size.
export function renderCover(canvas, state, width, height, opts = {}) {
  canvas.width = width;
  canvas.height = height;
  const ctx = canvas.getContext('2d');
  const grade = GRADES[state.grade] || GRADES.sunset;
  const highlight = opts.highlight === true;

  skyFill(ctx, width, height, grade);

  const rects = panelsFor(state.layout, width, height);
  const gutter = Math.max(2, Math.round(width * 0.004));
  rects.forEach((rect, i) => {
    const slot = state.panels[i] || { photo: i, zoom: 1, panX: 0, panY: 0 };
    ctx.save();
    ctx.beginPath();
    ctx.rect(rect.x, rect.y, rect.w, rect.h);
    ctx.clip();
    const photo = state.photos[slot.photo];
    if (photo) {
      drawPhotoCover(ctx, photo.image, rect, slot.zoom, slot.panX, slot.panY);
    } else {
      drawScene(ctx, i % 2 === 0 ? 'boulevard' : 'pier', rect.x, rect.y, rect.w, rect.h, grade);
    }
    ctx.globalCompositeOperation = 'overlay';
    ctx.globalAlpha = 0.16;
    ctx.fillStyle = grade.tint;
    ctx.fillRect(rect.x, rect.y, rect.w, rect.h);
    ctx.globalAlpha = 1;
    ctx.globalCompositeOperation = 'source-over';
    ctx.restore();
    ctx.strokeStyle = '#ffffff';
    ctx.lineWidth = gutter;
    ctx.strokeRect(rect.x, rect.y, rect.w, rect.h);
    if (highlight && i === state.selectedPanel) {
      ctx.strokeStyle = grade.accent;
      ctx.lineWidth = Math.max(3, gutter * 2);
      ctx.strokeRect(rect.x, rect.y, rect.w, rect.h);
    }
  });

  // Scrim so the lettering reads over any photo.
  const scrim = ctx.createLinearGradient(0, height * 0.55, 0, height);
  scrim.addColorStop(0, 'rgba(8, 4, 20, 0)');
  scrim.addColorStop(1, 'rgba(8, 4, 20, 0.62)');
  ctx.fillStyle = scrim;
  ctx.fillRect(0, height * 0.55, width, height * 0.45);

  drawLettering(ctx, state, width, height, grade);

  if (state.showBadge) drawBadge(ctx, width, height);
  if (state.showRating) drawRating(ctx, width, height);
  if (state.showVignette) drawVignette(ctx, width, height);
  if (state.showGrain) drawGrain(ctx, width, height);
}

// One scene full-frame, for the sample images.
export function renderSceneOnly(canvas, scene, width, height, gradeId) {
  canvas.width = width;
  canvas.height = height;
  const ctx = canvas.getContext('2d');
  const grade = GRADES[gradeId] || GRADES.sunset;
  drawScene(ctx, scene, 0, 0, width, height, grade);
  drawVignette(ctx, width, height);
}

// A fresh canvas holding the finished cover at an export size.
export function exportCanvas(state, sizeKey) {
  const size = EXPORT_SIZES[sizeKey] || EXPORT_SIZES.wide;
  const canvas = document.createElement('canvas');
  renderCover(canvas, state, size.width, size.height, { highlight: false });
  return canvas;
}
