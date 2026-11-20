# Neon Coast Cover Studio

[![make.fun · gta6-cover-art-01](https://make.fun/badge/gta6-cover-art-01.svg)](https://make.fun/bounty/gta6-cover-art-01?utm_source=github&utm_medium=readme&utm_campaign=gta6-cover-art-01)
[![rank](https://make.fun/badge/gta6-cover-art-01/Bejoke/gta6-cover-art-01/rank.svg)](https://make.fun/bounty/gta6-cover-art-01/leaderboard?utm_source=github&utm_medium=readme&utm_campaign=gta6-cover-art-01)
[![reward](https://make.fun/badge/gta6-cover-art-01/Bejoke/gta6-cover-art-01/reward.svg)](https://make.fun/bounty/gta6-cover-art-01?utm_source=github&utm_medium=readme&utm_campaign=gta6-cover-art-01)

A GTA 6-style cover art maker for make.fun's `gta6-cover-art-01` bounty ($250 USDC).

An offline web app that turns your photos and a caption into a multi-panel
poster in the style of GTA 6's covers — Vice City sunset and neon colour
grades, bold Anton lettering with a Pacifico script subtitle — and exports it
as a PNG to share.

## Use it

Serve `app/` with any static file server and open `index.html` in a desktop
browser (Chrome works best). No network request is made; your photos never
leave your machine.

1. Load up to 4 photos (or **Use sample photos** to try it at once).
2. Pick a layout: **Hero + 3**, **Grid 2×2**, **Grid 3×3**, or **Full bleed**.
3. Pick a colour grade: Sunset, Neon, Vice, Gold, or Mono.
4. Type the title, subtitle and badge. Click a panel to select it, then zoom
   and pan its photo, or give it a different photo.
5. Pick the export size — 1080 × 1080, 1080 × 1350, or 1920 × 1080 — and
   **Export PNG**.

Undo and Redo cover every change. Grain and vignette can be switched off.

## Files

- `app/` — the web app (static files, no build step). Fonts are Anton and
  Pacifico under the SIL Open Font License (`app/fonts/OFL.txt`). Sample
  photos are the kit's two model-made photos plus two more made with an
  image model; all are free to use and show no real person.
- `screenshots/` — 4 screenshots: the app with photos loaded and covers it
  exported. The first by name is the cover.
- `vendor/makefun-app.ts` — the kit's dossier library, unchanged.
- `main.ts` — the entry program (Node 22): copies `app/` and `screenshots/`
  to `/output` and writes `/output/dossier.json`.
- `serve.ts` — serves `app/` locally for trying it out.

## License

MIT — see `LICENSE`.
