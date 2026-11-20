// The cover's state: which photos are loaded, which photo (if any) fills each panel and how it is
// cropped, plus layout, grade, lettering and export size. Undo/redo keeps snapshots of it.

export const MAX_PHOTOS = 4;
export const PANEL_COUNT = 9;

export function blankPanel() {
  return { photo: null, zoom: 1, ox: 0, oy: 0 };
}

export function freshState() {
  return {
    layout: 'hero',
    grade: 'sunset',
    title: 'NEON COAST',
    subtitle: 'a vice city story',
    badge: 'EST. 2026',
    size: '1080x1080',
    photos: [], // { src, name } — src is a data: URL or a samples/ path
    panels: Array.from({ length: PANEL_COUNT }, blankPanel),
    activePanel: 0,
  };
}

/** A plain snapshot of the state, safe to store for undo/redo. */
export function snapshot(state) {
  return JSON.parse(JSON.stringify({ ...state, panels: state.panels.map((p) => ({ ...p })) }));
}

export function restore(state, snap) {
  Object.assign(state, JSON.parse(JSON.stringify(snap)));
}

/** Keeps undo/redo stacks around a state object. */
export function makeHistory(state) {
  const undoStack = [];
  const redoStack = [];
  return {
    get canUndo() { return undoStack.length > 0; },
    get canRedo() { return redoStack.length > 0; },
    commit() {
      undoStack.push(snapshot(state));
      if (undoStack.length > 60) undoStack.shift();
      redoStack.length = 0;
    },
    /** Pushes a snapshot taken earlier (e.g. before a drag) as the undo point. */
    push(snap) {
      undoStack.push(snap);
      if (undoStack.length > 60) undoStack.shift();
      redoStack.length = 0;
    },
    undo() {
      if (!undoStack.length) return false;
      redoStack.push(snapshot(state));
      restore(state, undoStack.pop());
      return true;
    },
    redo() {
      if (!redoStack.length) return false;
      undoStack.push(snapshot(state));
      restore(state, redoStack.pop());
      return true;
    },
  };
}

/** Loads an image from a URL or data: URL, resolving once it can be drawn. */
export function loadImage(url) {
  return new Promise((resolve, reject) => {
    const img = new Image();
    img.onload = () => resolve(img);
    img.onerror = () => reject(new Error(`could not load ${url}`));
    img.src = url;
  });
}

/** Reads a File as a data: URL. */
export function readFileAsDataURL(file) {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => resolve(reader.result);
    reader.onerror = () => reject(reader.error);
    reader.readAsDataURL(file);
  });
}
