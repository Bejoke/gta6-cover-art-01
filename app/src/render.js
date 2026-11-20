// Draws the cover: photo panels in the chosen layout, a colour grade over them, and the big display title,
// script subtitle and badge ribbon on top. All geometry is derived from the canvas size, so the same draw
// works for the live preview and for every export size.

export const GRADES = {
  sunset: { filter: 'saturate(1.3) contrast(1.06) sepia(0.18)', top: 'rgba(255, 120, 60, 0.10)', bottom: 'rgba(190, 30, 110, 0.55)', accent: '#ff9e5e', ribbon: '#ff5ea8' },
  neon: { filter: 'saturate(1.7) contrast(1.12) hue-rotate(-12deg)', top: 'rgba(0, 220, 255, 0.12)', bottom: 'rgba(150, 30, 220, 0.55)', accent: '#37e6ff', ribbon: '#ff2fb3' },
  vice: { filter: 'saturate(1.45) contrast(1.05) hue-rotate(28deg)', top: 'rgba(255, 60, 180, 0.14)', bottom: 'rgba(30, 90, 255, 0.5)', accent: '#ff6ec7', ribbon: '#2fb3ff' },
  gold: { filter: 'sepia(0.38) saturate(1.35) contrast(1.05)', top: 'rgba(255, 200, 90, 0.12)', bottom: 'rgba(140, 70, 10, 0.55)', accent: '#ffd27a', ribbon: '#b8860b' },
  mono: { filter: 'grayscale(1) contrast(1.12) brightness(1.05)', top: 'rgba(255, 255, 255, 0.06)', bottom: 'rgba(0, 0, 0, 0.55)', accent: '#ffffff', ribbon: '#888888' },
};

/** Panel rectangles for a layout, as fractions of the cover (x, y, w, h). The gap is a fraction of width. */
export function layoutPanels(layout, gap = 0.008) {
  const g = gap;
  if (layout === 'full') return [[0, 0, 1, 1]];
  if (layout === 'grid2') {
    return [
      [0, 0, 0.5 - g / 2, 0.5 - g / 2], [0.5 + g / 2, 0, 0.5 - g / 2, 0.5 - g / 2],
      [0, 0.5 + g / 2, 0.5 - g / 2, 0.5 - g / 2], [0.5 + g / 2, 0.5 + g / 2, 0.5 - g / 2, 0.5 - g / 2],
    ];
  }
  if (layout === 'grid3') {
    const cell = (1 - 2 * g) / 3;
    const cells = [];
    for (let r = 0; r < 3; r++) {
      for (let c = 0; c < 3; c++) {
        cells.push([c * (cell + g), r * (cell + g), cell, cell]);
      }
    }
    return cells;
  }
  // hero: one wide panel on top, three across the foot.
  return [
    [0, 0, 1, 0.62 - g / 2],
    [0, 0.62 + g / 2, 1 / 3 - g * 0.5, 0.38 - g / 2],
    [1 / 3 + g / 2, 0.62 + g / 2, 1 / 3 - g, 0.38 - g / 2],
    [2 / 3 + g / 2, 0.62 + g / 2, 1 / 3 - g * 0.5, 0.38 - g / 2],
  ];
}

/** Clamps a panel's pan offsets (fractions of the panel) so the photo always covers the panel fully. */
export function clampPan(panel, photo, pw, ph) {
  if (!photo) return;
  const base = Math.max(pw / photo.naturalWidth, ph / photo.naturalHeight);
  const dw = photo.naturalWidth * base * panel.zoom;
  const dh = photo.naturalHeight * base * panel.zoom;
  const maxX = Math.max(0, (dw - pw) / 2 / pw);
  const maxY = Math.max(0, (dh - ph) / 2 / ph);
  panel.ox = Math.max(-maxX, Math.min(maxX, panel.ox));
  panel.oy = Math.max(-maxY, Math.min(maxY, panel.oy));
}

function drawPanel(ctx, photo, panel, x, y, pw, ph, filter) {
  ctx.save();
  ctx.beginPath();
  ctx.rect(x, y, pw, ph);
  ctx.clip();
  if (photo) {
    const base = Math.max(pw / photo.naturalWidth, ph / photo.naturalHeight);
    const dw = photo.naturalWidth * base * panel.zoom;
    const dh = photo.naturalHeight * base * panel.zoom;
    ctx.filter = filter;
    ctx.drawImage(photo, x + (pw - dw) / 2 + panel.ox * pw, y + (ph - dh) / 2 + panel.oy * ph, dw, dh);
    ctx.filter = 'none';
  } else {
    ctx.fillStyle = '#2a1638';
    ctx.fillRect(x, y, pw, ph);
    ctx.strokeStyle = 'rgba(255,255,255,0.25)';
    ctx.lineWidth = Math.max(1, pw * 0.004);
    ctx.setLineDash([pw * 0.03, pw * 0.02]);
    ctx.strokeRect(x + pw * 0.05, y + ph * 0.05, pw * 0.9, ph * 0.9);
    ctx.setLineDash([]);
    ctx.fillStyle = 'rgba(255,255,255,0.5)';
    ctx.font = `${Math.max(12, pw * 0.045)}px sans-serif`;
    ctx.textAlign = 'center';
    ctx.fillText('add a photo', x + pw / 2, y + ph / 2);
  }
  ctx.restore();
}

function fitFont(ctx, text, maxWidth, startSize, family, weight = '') {
  let size = startSize;
  ctx.font = `${weight} ${size}px ${family}`;
  while (size > 10 && ctx.measureText(text).width > maxWidth) {
    size -= 2;
    ctx.font = `${weight} ${size}px ${family}`;
  }
  return size;
}

/** Draws the whole cover for `state` (see state.js) onto `canvas`. `photos` are loaded Image objects. */
export function drawCover(canvas, state, photos) {
  const ctx = canvas.getContext('2d');
  const w = canvas.width;
  const h = canvas.height;
  const grade = GRADES[state.grade] ?? GRADES.sunset;
  const panels = layoutPanels(state.layout);
  ctx.fillStyle = '#12081f';
  ctx.fillRect(0, 0, w, h);

  panels.forEach((rect, i) => {
    const [fx, fy, fw, fh] = rect;
    const p = state.panels[i] ?? { photo: null, zoom: 1, ox: 0, oy: 0 };
    const photo = p.photo == null ? null : photos[p.photo] ?? null;
    drawPanel(ctx, photo, p, fx * w, fy * h, fw * w, fh * h, grade.filter);
  });

  // Colour grade wash, stronger toward the foot so the lettering sits on it.
  const wash = ctx.createLinearGradient(0, 0, 0, h);
  wash.addColorStop(0, grade.top);
  wash.addColorStop(1, grade.bottom);
  ctx.fillStyle = wash;
  ctx.fillRect(0, 0, w, h);

  // Thin bright frame lines between the panels.
  ctx.strokeStyle = 'rgba(255,255,255,0.35)';
  ctx.lineWidth = Math.max(1, w * 0.003);
  panels.forEach(([fx, fy, fw, fh]) => ctx.strokeRect(fx * w, fy * h, fw * w, fh * h));

  const title = state.title.trim().toUpperCase();
  const sub = state.subtitle.trim();
  const badge = state.badge.trim();
  const foot = h * 0.965;
  const pad = w * 0.045;

  if (sub) {
    const size = fitFont(ctx, sub, w * 0.7, h * 0.052, 'Pacifico, cursive');
    ctx.textAlign = 'left';
    ctx.fillStyle = grade.accent;
    ctx.shadowColor = 'rgba(0,0,0,0.6)';
    ctx.shadowBlur = size * 0.25;
    ctx.fillText(sub, pad, foot - h * 0.115);
    ctx.shadowBlur = 0;
  }
  if (title) {
    const size = fitFont(ctx, title, w * 0.92, h * 0.115, 'Anton, sans-serif');
    ctx.textAlign = 'left';
    ctx.lineJoin = 'round';
    ctx.strokeStyle = 'rgba(10, 4, 20, 0.9)';
    ctx.lineWidth = size * 0.14;
    ctx.strokeText(title, pad, foot);
    ctx.fillStyle = '#ffffff';
    ctx.shadowColor = grade.ribbon;
    ctx.shadowBlur = size * 0.12;
    ctx.fillText(title, pad, foot);
    ctx.shadowBlur = 0;
  }
  if (badge) {
    const size = fitFont(ctx, badge, w * 0.3, h * 0.032, 'Anton, sans-serif');
    const bw = ctx.measureText(badge).width + size * 1.6;
    const bh = size * 2.1;
    const bx = w - bw - pad;
    const by = h * 0.78;
    ctx.save();
    ctx.translate(bx + bw / 2, by + bh / 2);
    ctx.rotate(-0.06);
    ctx.fillStyle = grade.ribbon;
    ctx.fillRect(-bw / 2, -bh / 2, bw, bh);
    ctx.fillStyle = '#ffffff';
    ctx.font = `${size}px Anton, sans-serif`;
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    ctx.fillText(badge, 0, size * 0.06);
    ctx.restore();
    ctx.textBaseline = 'alphabetic';
  }
}
