// Photo handling: uploads from the user's machine, the bundled sample
// scenes, and drawing a photo into a panel with crop and position.

export function loadImage(src) {
  return new Promise((resolve, reject) => {
    const img = new Image();
    img.onload = () => resolve(img);
    img.onerror = () => reject(new Error(`could not load ${src}`));
    img.src = src;
  });
}

// Read image files the user picked into data URLs the app can draw.
export function readUploadedFiles(fileList) {
  const files = [...fileList].filter((file) => file.type.startsWith('image/'));
  return Promise.all(
    files.map(
      (file) =>
        new Promise((resolve, reject) => {
          const reader = new FileReader();
          reader.onload = () => resolve({ name: file.name, dataUrl: reader.result });
          reader.onerror = () => reject(new Error(`could not read ${file.name}`));
          reader.readAsDataURL(file);
        }),
    ),
  );
}

// Draw an image (or a canvas) into a rectangle, covering it fully, with a
// zoom factor and a pan offset measured in fractions of the rectangle.
export function drawPhotoCover(ctx, image, rect, zoom, panX, panY) {
  const iw = image.naturalWidth || image.width;
  const ih = image.naturalHeight || image.height;
  const scale = Math.max(rect.w / iw, rect.h / ih) * zoom;
  const dw = iw * scale;
  const dh = ih * scale;
  // Keep the photo inside its panel: the editor clamps drags to the same
  // range, so the draw and the drag can never disagree.
  const px = Math.max(-0.6, Math.min(0.6, panX));
  const py = Math.max(-0.6, Math.min(0.6, panY));
  const dx = rect.x + (rect.w - dw) / 2 + px * rect.w;
  const dy = rect.y + (rect.h - dh) / 2 + py * rect.h;
  ctx.drawImage(image, dx, dy, dw, dh);
}

// Index of the panel holding a point, or -1 when the point is on no panel.
export function panelAtPoint(panels, x, y) {
  for (let i = panels.length - 1; i >= 0; i--) {
    const p = panels[i];
    if (x >= p.x && x < p.x + p.w && y >= p.y && y < p.y + p.h) return i;
  }
  return -1;
}
