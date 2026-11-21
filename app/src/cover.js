// Cover composition: the poster layouts, the neon grades, and the geometry
// that turns a layout and a size into panel rectangles.

export const GRADES = {
  sunset: {
    name: 'Vice Sunset',
    skyTop: '#2b1055',
    skyMid: '#ff5e78',
    skyBottom: '#ff9a3d',
    sun: '#ffd76a',
    tint: '#ff5e78',
    title: '#ffffff',
    accent: '#19e3d6',
    subtitle: '#ffd76a',
  },
  neon: {
    name: 'Neon Night',
    skyTop: '#0b1030',
    skyMid: '#b01e8f',
    skyBottom: '#0e3a4d',
    sun: '#ff5edb',
    tint: '#19e3d6',
    title: '#ffffff',
    accent: '#ff5edb',
    subtitle: '#19e3d6',
  },
  gold: {
    name: 'Golden Hour',
    skyTop: '#3a1c00',
    skyMid: '#ff8c1a',
    skyBottom: '#ffd76a',
    sun: '#fff3b0',
    tint: '#ffb02e',
    title: '#ffffff',
    accent: '#ff5e78',
    subtitle: '#fff3b0',
  },
  dusk: {
    name: 'Purple Dusk',
    skyTop: '#12082e',
    skyMid: '#6a2bff',
    skyBottom: '#ff7a9e',
    sun: '#ffb3c8',
    tint: '#9b5cff',
    title: '#ffffff',
    accent: '#19e3d6',
    subtitle: '#ffb3c8',
  },
};

export const LAYOUTS = {
  hero3: { name: 'Hero + 3', panels: 4, title: { x: 0.05, y: 0.86, align: 'left' } },
  grid: { name: 'Four grid', panels: 4, title: { x: 0.05, y: 0.86, align: 'left' } },
  bleed: { name: 'Full bleed', panels: 1, title: { x: 0.05, y: 0.84, align: 'left' } },
  strip: { name: 'Top strip', panels: 3, title: { x: 0.05, y: 0.58, align: 'left' } },
};

export function panelCount(layoutId) {
  return (LAYOUTS[layoutId] || LAYOUTS.hero3).panels;
}

export function titleAnchor(layoutId) {
  return (LAYOUTS[layoutId] || LAYOUTS.hero3).title;
}

// Panel rectangles for a layout at a given cover size. A margin frames the
// whole poster and a gutter separates the panels.
export function panelsFor(layoutId, W, H) {
  // Unknown layouts fall back to the hero layout instead of crashing.
  // (LAYOUTS is a record keyed by id, so the check is a key lookup.)
  if (!LAYOUTS[layoutId]) layoutId = 'hero3';
  const margin = Math.round(Math.min(W, H) * 0.03);
  const gap = Math.max(4, Math.round(W * 0.008));
  const inner = { x: margin, y: margin, w: W - margin * 2, h: H - margin * 2 };

  if (layoutId === 'grid') {
    const cw = (inner.w - gap) / 2;
    const ch = (inner.h - gap) / 2;
    return [
      { x: inner.x, y: inner.y, w: cw, h: ch },
      { x: inner.x + cw + gap, y: inner.y, w: cw, h: ch },
      { x: inner.x, y: inner.y + ch + gap, w: cw, h: ch },
      { x: inner.x + cw + gap, y: inner.y + ch + gap, w: cw, h: ch },
    ];
  }

  if (layoutId === 'bleed') {
    return [{ x: inner.x, y: inner.y, w: inner.w, h: inner.h }];
  }

  if (layoutId === 'strip') {
    const heroH = inner.h * 0.66;
    const rowH = inner.h - heroH - gap;
    const cw = (inner.w - gap) / 2;
    return [
      { x: inner.x, y: inner.y, w: inner.w, h: heroH },
      { x: inner.x, y: inner.y + heroH + gap, w: cw, h: rowH },
      { x: inner.x + cw + gap, y: inner.y + heroH + gap, w: cw, h: rowH },
    ];
  }

  // hero3: a big hero panel on the left, three stacked panels on the right.
  const heroW = inner.w * 0.62;
  const sideW = inner.w - heroW - gap;
  const sh = (inner.h - gap * 2) / 3;
  return [
    { x: inner.x, y: inner.y, w: heroW, h: inner.h },
    { x: inner.x + heroW + gap, y: inner.y, w: sideW, h: sh },
    { x: inner.x + heroW + gap, y: inner.y + sh + gap, w: sideW, h: sh },
    { x: inner.x + heroW + gap, y: inner.y + (sh + gap) * 2, w: sideW, h: sh },
  ];
}
