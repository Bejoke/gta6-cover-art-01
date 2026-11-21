# Neon Coast Cover Studio

A free, offline web app that turns your own photos into GTA-style poster
art: a multi-panel cover with bold caption lettering and a Vice City neon
sunset grade, exported as a PNG to share. Your photos never leave your
machine — there is no upload, no account, and no network request.

## What it does

- **Your photos:** add photos from your machine and drop them into the
  panels. Click a panel to select it, drag inside it to move the photo,
  scroll over it to zoom. Two sample scenes ship with the app so you can
  try it with no photos at all.
- **Four layouts:** Hero + 3, a four-panel grid, a full-bleed single
  photo, and a top strip with two panels below.
- **Four neon grades:** Vice Sunset, Neon Night, Golden Hour and Purple
  Dusk. Each grade repaints the sky, the sun, the photo tint and the
  lettering accents.
- **Caption:** edit the big title, the script subtitle, the tagline and
  the credit line. Toggle the logo badge, the rating box, the vignette
  and the film grain.
- **Export:** one click downloads a PNG in Square 1080 x 1080, Portrait
  1080 x 1350 or Wide 1920 x 1080 — or all three at once.

## Run it

```sh
node serve.ts
```

Then open http://127.0.0.1:8080 in a desktop browser. Everything the
page loads is a file under `app/`.

## Make a cover in four steps

1. Add your photos (or press "Load the two sample scenes").
2. Pick a layout and a neon grade.
3. Write your title, subtitle and tagline.
4. Pick an export size and press Export PNG.

Share a cover straight from a link, too: the address bar carries the
choices, for example
`?layout=grid&grade=neon&size=square&title=PIER%20PRESSURE`.

## Files

- `app/index.html`, `app/style.css` — the editor page.
- `app/src/main.js` — boots the editor and wires the controls.
- `app/src/state.js` — the cover state and share-link parameters.
- `app/src/cover.js` — layouts, grades and panel geometry.
- `app/src/render.js` — the canvas drawing: scenes, panels, lettering.
- `app/src/photos.js` — uploads, sample scenes and panel cropping.
- `app/samples/` — the two sample scenes the app renders.
- `main.ts` — hands the app and screenshots in for judging.
- `serve.ts` — the small static server for trying the app locally.

## License

MIT (see `LICENSE`). The Anton and Pacifico fonts ship under the SIL
Open Font License; see `app/fonts/OFL.txt`. All art is original and
drawn by the app itself — no game artwork, logos or fonts are used.
