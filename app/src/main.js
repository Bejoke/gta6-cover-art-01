// Neon Coast Cover Studio — bootstrap: wires the editor controls to the
// cover state and paints the live preview.

import {
  EXPORT_SIZES,
  SAMPLE_PATHS,
  applyLayout,
  applyUrlParams,
  createDefaultState,
} from './state.js';
import { loadImage, panelAtPoint, readUploadedFiles } from './photos.js';
import { panelsFor } from './cover.js';
import { exportCanvas, renderCover, renderSceneOnly } from './render.js';

const $ = (id) => document.getElementById(id);

const state = createDefaultState();
const canvas = $('coverCanvas');
const params = new URLSearchParams(location.search);

// Preview size follows the chosen export size.
function previewSize() {
  const size = EXPORT_SIZES[state.exportSize];
  const scale = Math.min(1, 960 / size.width);
  return { width: Math.round(size.width * scale), height: Math.round(size.height * scale) };
}

function paint() {
  const size = previewSize();
  renderCover(canvas, state, size.width, size.height, { highlight: true });
  $('sizeLabel').textContent = EXPORT_SIZES[state.exportSize].label;
  for (const [rowId, key, field] of [
    ['layoutRow', 'layout', 'layout'],
    ['gradeRow', 'grade', 'grade'],
    ['sizeRow', 'size', 'exportSize'],
  ]) {
    document.querySelectorAll(`#${rowId} .choice-btn`).forEach((button) => {
      button.classList.toggle('active', button.dataset[key] === state[field]);
    });
  }
  refreshThumbs();
}

function refreshThumbs() {
  const box = $('thumbs');
  box.innerHTML = '';
  state.photos.forEach((photo, i) => {
    const img = document.createElement('img');
    img.src = photo.thumb;
    img.alt = photo.name;
    img.classList.toggle('used', state.panels.some((slot) => slot.photo === i));
    img.addEventListener('click', () => {
      state.panels[state.selectedPanel].photo = i;
      paint();
    });
    box.appendChild(img);
  });
}

function download(canvasEl, name) {
  canvasEl.toBlob((blob) => {
    if (!blob) return;
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = name;
    a.click();
    setTimeout(() => URL.revokeObjectURL(url), 5000);
  }, 'image/png');
}

function exportOne(sizeKey) {
  const out = exportCanvas(state, sizeKey);
  download(out, `neon-coast-cover-${sizeKey}.png`);
}

// Pointer: drag a panel to move its photo, scroll over a panel to zoom it.
function canvasPoint(event) {
  const rect = canvas.getBoundingClientRect();
  const size = previewSize();
  return {
    x: ((event.clientX - rect.left) / rect.width) * size.width,
    y: ((event.clientY - rect.top) / rect.height) * size.height,
  };
}

let dragging = null;

canvas.addEventListener('pointerdown', (event) => {
  const point = canvasPoint(event);
  const size = previewSize();
  const rects = panelsFor(state.layout, size.width, size.height);
  const hit = panelAtPoint(rects, point.x, point.y);
  if (hit < 0) return;
  state.selectedPanel = hit;
  dragging = { panel: hit, x: point.x, y: point.y };
  canvas.setPointerCapture(event.pointerId);
  paint();
});

canvas.addEventListener('pointermove', (event) => {
  if (!dragging) return;
  const point = canvasPoint(event);
  const size = previewSize();
  const slot = state.panels[dragging.panel];
  slot.panX += (point.x - dragging.x) / size.width;
  slot.panY += (point.y - dragging.y) / size.height;
  slot.panX = Math.max(-0.6, Math.min(0.6, slot.panX));
  slot.panY = Math.max(-0.6, Math.min(0.6, slot.panY));
  dragging.x = point.x;
  dragging.y = point.y;
  paint();
});

canvas.addEventListener('pointerup', () => {
  dragging = null;
});

canvas.addEventListener(
  'wheel',
  (event) => {
    event.preventDefault();
    const point = canvasPoint(event);
    const size = previewSize();
    const rects = panelsFor(state.layout, size.width, size.height);
    const hit = panelAtPoint(rects, point.x, point.y);
    if (hit < 0) return;
    state.selectedPanel = hit;
    const slot = state.panels[hit];
    slot.zoom = Math.max(1, Math.min(3, slot.zoom * (event.deltaY < 0 ? 1.1 : 0.9)));
    paint();
  },
  { passive: false },
);

// Controls.
$('photoInput').addEventListener('change', async (event) => {
  const uploads = await readUploadedFiles(event.target.files);
  for (const up of uploads) {
    const image = await loadImage(up.dataUrl);
    state.photos.push({ name: up.name, image, thumb: up.dataUrl });
  }
  event.target.value = '';
  paint();
});

$('loadSamples').addEventListener('click', () => loadSamples());

$('layoutRow').addEventListener('click', (event) => {
  const button = event.target.closest('[data-layout]');
  if (!button) return;
  applyLayout(state, button.dataset.layout);
  paint();
});

$('gradeRow').addEventListener('click', (event) => {
  const button = event.target.closest('[data-grade]');
  if (!button) return;
  state.grade = button.dataset.grade;
  paint();
});

$('sizeRow').addEventListener('click', (event) => {
  const button = event.target.closest('[data-size]');
  if (!button) return;
  state.exportSize = button.dataset.size;
  paint();
});

for (const [id, field] of [
  ['titleInput', 'title'],
  ['subtitleInput', 'subtitle'],
  ['taglineInput', 'tagline'],
  ['creditInput', 'credit'],
]) {
  $(id).addEventListener('input', (event) => {
    state[field] = event.target.value;
    paint();
  });
}

for (const [id, field] of [
  ['toggleBadge', 'showBadge'],
  ['toggleRating', 'showRating'],
  ['toggleVignette', 'showVignette'],
  ['toggleGrain', 'showGrain'],
]) {
  $(id).addEventListener('change', (event) => {
    state[field] = event.target.checked;
    paint();
  });
}

$('exportBtn').addEventListener('click', () => exportOne(state.exportSize));
$('exportAllBtn').addEventListener('click', () => {
  for (const key of Object.keys(EXPORT_SIZES)) exportOne(key);
});

// Load the bundled sample scenes as photos, one per panel in turn.
async function loadSamples() {
  for (const path of SAMPLE_PATHS) {
    if (state.photos.some((photo) => photo.name === path)) continue;
    try {
      const image = await loadImage(path);
      state.photos.push({ name: path, image, thumb: path });
    } catch (e) {
      // A missing sample must not stop the editor: the panels fall
      // back to the procedural scenes.
    }
  }
  if (state.panels.length === 0) applyLayout(state, state.layout);
  state.panels.forEach((slot, i) => {
    slot.photo = i % state.photos.length;
  });
  paint();
}

// Solo mode: hide the editor chrome so a screenshot is just the canvas.
function soloLayout() {
  for (const selector of ['.topbar', '.controls', '.foot', '.preview-bar']) {
    const el = document.querySelector(selector);
    // Inline display beats the stylesheet's own display rules; the
    // hidden attribute alone does not, and the chrome stayed visible.
    if (el) el.style.display = 'none';
  }
  const studio = document.querySelector('.studio');
  studio.style.gridTemplateColumns = '1fr';
  studio.style.padding = '0';
  studio.style.maxWidth = 'none';
  const wrap = document.querySelector('.canvas-wrap');
  wrap.style.padding = '0';
  wrap.style.border = 'none';
  wrap.style.borderRadius = '0';
  wrap.style.background = '#000';
  canvas.style.borderRadius = '0';
  canvas.style.boxShadow = 'none';
}

async function loadFonts() {
  if (!document.fonts) return;
  try {
    await Promise.all([
      document.fonts.load('400 40px Anton'),
      document.fonts.load('40px Pacifico'),
    ]);
  } catch (e) {
    // The canvas falls back to system fonts; the app still works.
  }
}

// Modes driven by the address bar: a cover-only view for screenshots, a
// full-frame scene for the sample images, and a self test of the export.
async function boot() {
  applyUrlParams(state, location.search);
  applyLayout(state, state.layout);

  const sample = params.get('sample');
  if (sample === 'boulevard' || sample === 'pier') {
    soloLayout();
    const w = Number(params.get('w') || 1200);
    const h = Number(params.get('h') || 800);
    renderSceneOnly(canvas, sample, w, h, state.grade);
    document.title = `sample ${sample}`;
    return;
  }

  await loadSamples();
  await loadFonts();

  if (params.get('view') === 'cover') {
    soloLayout();
    const size = EXPORT_SIZES[state.exportSize];
    const scale = Math.min(1, 1280 / size.width, 1280 / size.height);
    renderCover(
      canvas,
      state,
      Math.round(size.width * scale),
      Math.round(size.height * scale),
      { highlight: false },
    );
  } else {
    paint();
  }

  if (params.get('selftest') === '1') {
    const out = exportCanvas(state, state.exportSize);
    const url = out.toDataURL('image/png');
    $('selftest').textContent = `SELFTEST OK len=${url.length}`;
    document.title = `SELFTEST OK len=${url.length}`;
  }
}

boot();
