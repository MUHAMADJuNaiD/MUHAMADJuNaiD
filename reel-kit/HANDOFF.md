# Outlook Styles – Reels Handoff (for a new Claude session)

Read this file first. Everything needed is in this repo (branch `claude/great-heisenberg-hy32hr`). Nothing has to be redone from zero.

## 1. Who / what

- **Client:** Junaid, Outlook Styles (Lahore). Instagram @outlook_.styles, a women's western wear, bags, shades and flats brand.
- **Language:** reply in **Roman Urdu + English only. Never Devanagari (Hindi script)**, even if Junaid writes in it.
- **Already finished:** 181 HD posters (2160×2700) in `posters/bulk/`, with captions in `posters/bulk/captions.md`.
- **Current job:** **3D animated Instagram Reels** made from the same product data, then bulk.

## 2. What already exists (re-use, do not rebuild)

| Path | What |
| --- | --- |
| `reel-kit/products/*.webp` | 160 HD product cut-outs (AI-upscaled, transparent, ~2400 px) |
| `reel-kit/data/products.json` | 153 products: id, image, category, 3D word, kicker, headline (`<b>` = pop-colour part), description, colour chip, palette, `grade`, matching poster. Also 26 combos (outfits, edits, this-or-that) |
| `reel-kit/data/palettes.json` | 24 approved palettes (bg, bg2, word = pop colour, ink, btn, btnink, acc, shape) |
| `reel-kit/hero.html` + `hero.js` | Reel template v1 ("Hero Product"): Three.js scene, deterministic `window.renderAt(t)`, config via `window.REEL_CFG` |
| `reel-kit/batch.js` | **One command renders a whole list:** `node batch.js reels.json out` → MP4 (1440×2560, 30 fps, H.264 CRF 12) + cover JPG for each reel |
| `reel-kit/reels.json` | The reel list. Each entry is just `{ "product": "0" }` plus optional `palette`, `hookLine`, `calls`, `override` |
| `reels/demo-01-mini-bags/`, `reels/demo-02-gloss-puffer/` | The two demos Junaid reviewed |
| `posters/bulk/overview/` | Contact sheets of every poster, a quick way to see products and colours |

### Environment notes (cloud container)

- `cd reel-kit && npm install three@0.187.0 opentype.js@1.3.4 --no-save`. The npm registry works. cdn.jsdelivr.net and download.blender.org are blocked.
- The local `playwright` in package.json may not match the pre-installed browser. Run with
  `CHROME_PATH=$(find /opt/pw-browsers -path '*chrome-linux64/chrome' | head -1) node batch.js reels.json out`.
- WebGL runs on SwiftShader (CPU). Speed is about 0.7–1.5 s per frame, so a 16 s reel takes about 6–10 min. Run long renders in the background.
- `ffmpeg` is installed.

## 3. Rules from Junaid (all mandatory)

**Brand and content:** no prices or "Rs", no numbering like "N° 01", no "OS" round stamp, and no designer brand names or logos in headlines. CTA is "DM TO ORDER" and the footer is "DELIVERY ALL OVER PAKISTAN". Fonts are Playfair Display (big words and headlines) and Montserrat.

**Colour:** the big word must **contrast** strongly with the background. Never put the word in the same colour family as the background; this was Junaid's main complaint on the posters. Use the product's approved palette from `products.json`.

**Reels feedback so far:**

1. Demo 01 mixed 3 bags in 3 colour worlds, which was rejected. **One reel = one theme**: one product, or one product family in one colour world.
2. **Only products whose photo is perfect at 2K.** Junaid liked the saddle bag (212) and the gloss puffer (0). He rejected the red knot bag (210) as visibly soft on mobile. `grade` in `products.json` is only a resolution hint, so **visually check each product's HD image before using it**.
3. Content must respect the **Instagram Reels safe zone**: text, CTA and the key part of the product go between y 380 and y 2000 of 2560, and clear of the right-side icons (x > 1250, y 1300–2000).
4. Demo 02 kept everything inside the safe zone, but left the outside **empty**. Junaid said it felt cramped and "like a post turned into a reel". **Visuals must be full-bleed; only essential info goes in the safe zone.**
5. Demo 02 animation was **too slow and too simple**: "zyada kuch ho nahi raha". It needs to be more engaging and attractive.
6. Quality must be final on the first render (2K, 30 fps) so it never needs re-enhancing.

## 4. NEXT TASK: build template v2 ("Hero Reel v2"), then one demo for approval

Build `reel-kit/hero2.html` + `hero2.js`, using the same config shape and the same `batch.js` (`"template": "hero2"` in `reels.json`):

- **Full-bleed world:**
  - background, floor, shapes, bokeh and light rays fill the whole 9:16 frame
  - product bigger, about 50–55 % of the height; its key part stays in the safe zone
  - decorative content can sit under the IG UI: a moving marquee ribbon at the top ("OUTLOOK STYLES • NEW IN • WINTERWEAR •"), and the floor, reflections and floating 3D shapes at the bottom
- **Fast, beat-based edit** (120 BPM, so 0.5 s per beat), 12–15 s:
  - something new every 0.5–1 s, with camera cuts (wide, close, low angle) and zoom punches on the beat
  - speed ramps and whip-pan transitions
  - kinetic 3D type that flies in per beat, and a 3D text ring orbiting the product
  - product spin-in, a bounce, and a particle or sparkle burst on the beat
  - macro close-ups from the HD texture (zip, texture, hardware)
  - floating 3D shapes in the palette colours, and the camera flying through a letter as a transition
  - a hook in the first second, and an end frame that loops back to the start
  - a comment prompt, e.g. "Comment GLOSS for details"
- **Keep:** one colour world per reel, brand sting in the reel palette (shorter, about 0.8 s), 3D word in the pop colour, colour chip, and an end card with DM TO ORDER.
- **Fix from v1:** long words (e.g. "CAMPUS") overflow the frame during the hook slam. Fit the slam to the safe width.
- **Workflow (to save credits):**
  1. check stills with `?safe`, using a montage of about 6 frames
  2. render one full demo, using product 0 (gloss puffer) or 212 (saddle bag)
  3. send it to Junaid and **stop and wait for approval**
  4. after approval, add entries to `reels.json` and run `batch.js` in the background
  5. check each reel once with a contact sheet, then deliver
- Keep iterations few. Group fixes into one revision. Commit to the branch and push.

## 5. Bulk plan after v2 approval

- One reel per grade-A product that passes a visual check. Junaid estimated 30–40 reels in total.
- Later templates can reuse `combos`: Style It (top + bottom) and This or That.
- Deliver the MP4 + cover per reel, plus a caption. Reuse the poster caption in `posters/bulk/captions.md`.
