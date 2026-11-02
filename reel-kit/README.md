# Outlook Styles Reel Kit

Turn the product data into 2K 3D Instagram reels in bulk with **one command**. The images, cut-outs, colours and copy are already prepared, so only the animation is rendered.

## What's inside

- `products/`: 160 HD transparent product photos
- `data/products.json`: every product's ID, 3D word, headline, description, colour and category
- `data/palettes.json`: the 24 brand colour combinations
- `hero.html` / `hero.js`: the reel template (3D scene)
- `batch.js`: renders every reel in `reels.json` and saves an MP4 and a cover image for each
- `reels.json`: your list of reels

## Make reels on your own computer (no AI credits needed)

1. Install **Node.js 18+** (nodejs.org) and **ffmpeg** (ffmpeg.org; Windows: `winget install ffmpeg`).
2. In this folder, run once:

```bash
npm install
```

```bash
npx playwright install chromium
```

3. Edit `reels.json`. One line per reel, using a product ID from `data/products.json`. You can also find IDs in the poster file names in `posters/bulk/` (e.g. `036-...jpg` is product 36).

```json
[
  { "product": "0" },
  { "product": "212", "hookLine": "THE BAG OF THE SEASON." },
  { "product": "36", "palette": "red-varsity" }
]
```

4. Render all of them. With a graphics card it is much faster:

```bash
GPU=1 node batch.js reels.json out
```

On Windows PowerShell:

```bash
$env:GPU=1; node batch.js reels.json out
```

The reels and covers appear in `out/`. Each reel is 1440×2560, 30 fps and Instagram-ready. Add trending audio inside Instagram; the cuts sit on a 120 BPM beat.

## Optional fields per reel

| Field | Meaning |
| --- | --- |
| `name` | output file name |
| `palette` | any key from `data/palettes.json` (default: the product's poster colours) |
| `hookLine` | small line under the hook word |
| `calls` | feature callouts: `{ "uv": [x, y], "label": "STAND<br>COLLAR", "side": "l" or "r" }` (x and y are 0–1 positions on the product photo) |
| `template` | which template page to use (`hero` now; `hero2` once v2 is approved) |
| `override` | any template setting, e.g. `{ "dur": 15, "word": "SHINE" }` |

## Music + sound effects (automatic)

Every reel is saved twice: `name.mp4` with background music and animation-synced sound effects, and `name-sfx-only.mp4` with only the sound effects, so you can add Instagram trending audio on top.

- The music is picked automatically (luxe for dark palettes, soft for blouses, co-ords and Eid, house for everything else). To choose a track yourself, add `"music": "file.mp3"` from `audio/music/`.
- `"music": false` gives sound effects only, and `"sound": false` gives a silent video.
- The sounds come from `audio/` (original, copyright-free). The cue times live in `addaudio.js`.
