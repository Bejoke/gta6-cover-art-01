// Fixed scenes for screenshots: ?shot=editor shows the page with sample photos loaded;
// ?shot=cover shows the cover alone, filling the window. Query knobs: layout, grade, size,
// title, subtitle, badge and photos (a comma list of sample names, cycled across the panels).
// window.__shotReady is set once the scene has painted.
export async function runShot(shot, query, state, ui) {
  if (shot === 'cover') document.body.classList.add('shot-cover');
  state.layout = query.get('layout') ?? 'hero';
  state.grade = query.get('grade') ?? 'sunset';
  state.size = query.get('size') ?? '1080x1080';
  state.title = query.get('title') ?? 'NEON COAST';
  state.subtitle = query.get('subtitle') ?? 'a vice city story';
  state.badge = query.get('badge') ?? 'EST. 2026';
  const names = (query.get('photos') ?? 'pier,boulevard').split(',').map((n) => n.trim()).filter(Boolean);
  state.photos = names.map((n) => ({ src: `samples/${n}.jpg`, name: `${n}.jpg` }));
  await ui.syncImages();
  state.panels.forEach((p, i) => {
    p.photo = state.photos.length ? i % state.photos.length : null;
    p.zoom = 1;
    p.ox = 0;
    p.oy = 0;
  });
  // `pan0=ox,oy` shifts the first panel's photo (useful when a wide hero panel crops a tall photo).
  const pan0 = query.get('pan0');
  if (pan0) {
    const [ox, oy] = pan0.split(',').map(Number);
    if (Number.isFinite(ox)) state.panels[0].ox = ox;
    if (Number.isFinite(oy)) state.panels[0].oy = oy;
  }
  const [w, h] = state.size.split('x').map(Number);
  const canvas = document.getElementById('cover');
  canvas.width = w;
  canvas.height = h;
  ui.titleInput.value = state.title;
  ui.subtitleInput.value = state.subtitle;
  ui.badgeInput.value = state.badge;
  await document.fonts.load('80px Anton');
  await document.fonts.load('40px Pacifico');
  ui.renderTray();
  ui.redraw();
  requestAnimationFrame(() => requestAnimationFrame(() => { window.__shotReady = true; }));
}
