// Editor state for Neon Coast Cover Studio: what the cover looks like
// right now, and how a share link (?layout=...&grade=...) sets it up.

import { panelCount } from './cover.js';

export const EXPORT_SIZES = {
  square: { width: 1080, height: 1080, label: 'Square · 1080 × 1080' },
  portrait: { width: 1080, height: 1350, label: 'Portrait · 1080 × 1350' },
  wide: { width: 1920, height: 1080, label: 'Wide · 1920 × 1080' },
};

export const SAMPLE_PATHS = ['samples/boulevard.jpg', 'samples/pier.jpg'];

export const GRADES = ['sunset', 'neon', 'gold', 'dusk'];
export const LAYOUTS = ['hero3', 'grid', 'bleed', 'strip'];

export function createDefaultState() {
  return {
    layout: 'hero3',
    grade: 'sunset',
    exportSize: 'wide',
    title: 'NEON COAST',
    subtitle: 'Vice City nights',
    tagline: 'CHASE THE SUNSET. OWN THE NIGHT.',
    credit: 'A NEON COAST ORIGINAL',
    showBadge: true,
    showRating: true,
    showVignette: true,
    showGrain: true,
    photos: [],
    panels: [],
    selectedPanel: 0,
  };
}

// Fresh panel slots for a layout, keeping the photos the user already
// placed wherever the new layout still has a slot for them.
export function panelsForLayout(state, layoutId) {
  const count = panelCount(layoutId);
  const next = [];
  for (let i = 0; i < count; i++) {
    const old = state.panels[i];
    next.push({
      photo: old ? old.photo : i % Math.max(1, state.photos.length),
      zoom: old ? old.zoom : 1,
      panX: old ? old.panX : 0,
      panY: old ? old.panY : 0,
    });
  }
  return next;
}

export function applyLayout(state, layoutId) {
  if (!LAYOUTS.includes(layoutId)) return;
  state.layout = layoutId;
  state.panels = panelsForLayout(state, layoutId);
  state.selectedPanel = 0;
}

// Read a share link's parameters into the state. Unknown values are ignored.
export function applyUrlParams(state, search) {
  const params = new URLSearchParams(search);
  const layout = params.get('layout');
  if (layout && LAYOUTS.includes(layout)) applyLayout(state, layout);
  const grade = params.get('grade');
  if (grade && GRADES.includes(grade)) state.grade = grade;
  const size = params.get('size');
  if (size && size in EXPORT_SIZES) state.exportSize = size;
  const title = params.get('title');
  if (title) state.title = title.slice(0, 24);
  const subtitle = params.get('subtitle');
  if (subtitle) state.subtitle = subtitle.slice(0, 40);
  const tagline = params.get('tagline');
  if (tagline) state.tagline = tagline.slice(0, 60);
  for (const key of ['badge', 'rating', 'vignette', 'grain']) {
    const value = params.get(key);
    const field = 'show' + key[0].toUpperCase() + key.slice(1);
    if (value === '0') state[field] = false;
    if (value === '1') state[field] = true;
  }
}
