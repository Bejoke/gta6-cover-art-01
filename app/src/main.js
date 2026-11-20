// Wires the page: photos in, panels arranged, lettering typed, cover drawn live and exported as a PNG.
// A `?shot=` query sets up a fixed scene for a screenshot instead (./shots.js).
import { drawCover, layoutPanels, clampPan, GRADES } from './render.js';
import { freshState, makeHistory, loadImage, readFileAsDataURL, snapshot, MAX_PHOTOS } from './state.js';
import { runShot } from './shots.js';

const canvas = document.getElementById('cover');
const status = document.getElementById('status');
const tray = document.getElementById('tray');
const activeLabel = document.getElementById('active-panel');

const state = freshState();
const history = makeHistory(state);
let images = []; // loaded Image objects, parallel to state.photos

function redraw() {
  drawCover(canvas, state, images);
  document.getElementById('undo').disabled = !history.canUndo;
  document.getElementById('redo').disabled = !history.canRedo;
  activeLabel.textContent = String(state.activePanel + 1);
  document.querySelectorAll('#layouts button').forEach((b) => b.classList.toggle('active', b.dataset.layout === state.layout));
  document.querySelectorAll('#grades button').forEach((b) => b.classList.toggle('active', b.dataset.grade === state.grade));
  document.querySelectorAll('#sizes button').forEach((b) => b.classList.toggle('active', b.dataset.size === state.size));
}

async function syncImages() {
  images = [];
  for (const p of state.photos) {
    try { images.push(await loadImage(p.src)); } catch { images.push(null); }
  }
  redraw();
}

function renderTray() {
  tray.innerHTML = '';
  if (!state.photos.length) {
    const span = document.createElement('span');
    span.className = 'empty';
    span.textContent = 'No photos yet — add some, or use the samples.';
    tray.append(span);
    return;
  }
  state.photos.forEach((p, i) => {
    const img = document.createElement('img');
    img.src = p.src;
    img.alt = p.name;
    img.title = p.name;
    if (state.panels[state.activePanel].photo === i) img.classList.add('assigned');
    img.addEventListener('click', () => {
      history.commit();
      state.panels[state.activePanel].photo = i;
      state.panels[state.activePanel].zoom = 1;
      state.panels[state.activePanel].ox = 0;
      state.panels[state.activePanel].oy = 0;
      renderTray();
      redraw();
    });
    tray.append(img);
  });
}

async function addPhotos(files) {
  const room = MAX_PHOTOS - state.photos.length;
  const picked = [...files].slice(0, room);
  if (!picked.length) { status.textContent = `Already holding ${MAX_PHOTOS} photos.`; return; }
  history.commit();
  for (const file of picked) {
    state.photos.push({ src: await readFileAsDataURL(file), name: file.name });
  }
  await syncImages();
  // New photos fill empty panels in order, so the cover is never blank.
  let next = 0;
  state.panels.forEach((p) => {
    if (p.photo == null && next < state.photos.length) p.photo = next++;
  });
  renderTray();
  redraw();
  status.textContent = `${state.photos.length} photo${state.photos.length === 1 ? '' : 's'} loaded.`;
}

async function useSamples() {
  history.commit();
  state.photos = [
    { src: 'samples/pier.jpg', name: 'pier.jpg' },
    { src: 'samples/boulevard.jpg', name: 'boulevard.jpg' },
  ];
  await syncImages();
  state.panels.forEach((p, i) => { p.photo = state.photos.length ? i % state.photos.length : null; });
  renderTray();
  redraw();
  status.textContent = 'Sample photos loaded.';
}

document.getElementById('photos').addEventListener('change', (e) => addPhotos(e.target.files));
document.getElementById('samples').addEventListener('click', useSamples);
document.getElementById('fillall').addEventListener('click', () => {
  const p = state.panels[state.activePanel];
  if (p.photo == null) { status.textContent = 'Pick a photo for this panel first.'; return; }
  history.commit();
  state.panels.forEach((q) => { q.photo = p.photo; });
  redraw();
  status.textContent = 'Every panel now shows the same photo.';
});

document.getElementById('layouts').addEventListener('click', (e) => {
  const layout = e.target.dataset?.layout;
  if (!layout) return;
  history.commit();
  state.layout = layout;
  state.activePanel = 0;
  redraw();
});
document.getElementById('grades').addEventListener('click', (e) => {
  const grade = e.target.dataset?.grade;
  if (!grade || !GRADES[grade]) return;
  history.commit();
  state.grade = grade;
  redraw();
});
document.getElementById('sizes').addEventListener('click', (e) => {
  const size = e.target.dataset?.size;
  if (!size) return;
  const [w, h] = size.split('x').map(Number);
  state.size = size;
  canvas.width = w;
  canvas.height = h;
  redraw();
});

const titleInput = document.getElementById('title');
const subtitleInput = document.getElementById('subtitle');
const badgeInput = document.getElementById('badge');
titleInput.addEventListener('input', () => { state.title = titleInput.value; redraw(); });
subtitleInput.addEventListener('input', () => { state.subtitle = subtitleInput.value; redraw(); });
badgeInput.addEventListener('input', () => { state.badge = badgeInput.value; redraw(); });
[titleInput, subtitleInput, badgeInput].forEach((el) => el.addEventListener('change', () => history.commit()));

document.getElementById('undo').addEventListener('click', async () => {
  if (history.undo()) { await syncImages(); renderTray(); titleInput.value = state.title; subtitleInput.value = state.subtitle; badgeInput.value = state.badge; }
});
document.getElementById('redo').addEventListener('click', async () => {
  if (history.redo()) { await syncImages(); renderTray(); titleInput.value = state.title; subtitleInput.value = state.subtitle; badgeInput.value = state.badge; }
});

// Panel picking, panning and zooming on the preview canvas.
function panelAt(clientX, clientY) {
  const rect = canvas.getBoundingClientRect();
  const x = (clientX - rect.left) / rect.width;
  const y = (clientY - rect.top) / rect.height;
  const panels = layoutPanels(state.layout);
  for (let i = 0; i < panels.length; i++) {
    const [fx, fy, fw, fh] = panels[i];
    if (x >= fx && x < fx + fw && y >= fy && y < fy + fh) return { index: i, x, y, rect: panels[i] };
  }
  return null;
}

let drag = null;
let lastWheelCommit = 0;
canvas.addEventListener('pointerdown', (e) => {
  const hit = panelAt(e.clientX, e.clientY);
  if (!hit) return;
  canvas.setPointerCapture(e.pointerId);
  state.activePanel = hit.index;
  renderTray();
  redraw();
  drag = { index: hit.index, x: hit.x, y: hit.y, ox: state.panels[hit.index].ox, oy: state.panels[hit.index].oy, moved: false, before: snapshot(state) };
});
canvas.addEventListener('pointermove', (e) => {
  if (!drag) return;
  const hit = panelAt(e.clientX, e.clientY);
  if (!hit) return;
  const [, , fw, fh] = hit.rect;
  const p = state.panels[drag.index];
  const photo = images[p.photo];
  if (!photo) return;
  p.ox = drag.ox + (hit.x - drag.x) / fw;
  p.oy = drag.oy + (hit.y - drag.y) / fh;
  clampPan(p, photo, fw * canvas.width, fh * canvas.height);
  drag.moved = true;
  redraw();
});
canvas.addEventListener('pointerup', () => {
  if (drag?.moved) history.push(drag.before);
  drag = null;
});
canvas.addEventListener('wheel', (e) => {
  e.preventDefault();
  const hit = panelAt(e.clientX, e.clientY);
  if (!hit) return;
  const p = state.panels[hit.index];
  const photo = images[p.photo];
  if (!photo) return;
  if (Date.now() - lastWheelCommit > 500) { history.commit(); lastWheelCommit = Date.now(); }
  p.zoom = Math.max(1, Math.min(3, p.zoom * (e.deltaY < 0 ? 1.12 : 1 / 1.12)));
  const [, , fw, fh] = hit.rect;
  clampPan(p, photo, fw * canvas.width, fh * canvas.height);
  redraw();
}, { passive: false });

document.getElementById('export').addEventListener('click', () => {
  const [w, h] = state.size.split('x').map(Number);
  const off = document.createElement('canvas');
  off.width = w;
  off.height = h;
  drawCover(off, state, images);
  off.toBlob((blob) => {
    const a = document.createElement('a');
    a.href = URL.createObjectURL(blob);
    a.download = `neon-coast-cover-${state.size}.png`;
    a.click();
    status.textContent = `Saved neon-coast-cover-${state.size}.png`;
  }, 'image/png');
});

const shot = new URLSearchParams(location.search).get('shot');
if (shot) {
  runShot(shot, new URLSearchParams(location.search), state, { syncImages, renderTray, redraw, titleInput, subtitleInput, badgeInput });
} else {
  document.fonts.load('80px Anton').then(redraw);
  document.fonts.load('40px Pacifico').then(redraw);
  redraw();
}
