# Reel demo 01: "Mini Bags, Big Mood" (Colour Pop 3D)

- `outlook-styles-reel-mini-bags-2k.mp4`: 18 s, **1440 × 2560 (2K)**, 30 fps, H.264 High, no audio
- `cover.jpg`: reel cover / thumbnail

## Storyboard (cuts sit on a 120 BPM beat grid, so trending audio lines up)

| Time | Scene |
| --- | --- |
| 0.0–1.6 s | Brand sting: gold 3D "OUTLOOK" drops from above and "STYLES" rises from below, then a light sweeps across |
| 1.6–3.2 s | Hook: 3D "MINI BAGS," then "BIG MOOD." pop in on the beat |
| 3.2–7.4 s | Cherry saddle bag on pink: podium pops up, bag drops and bounces, 3D "CHERRY" flips up, then copy, colour chip and a shine sweep |
| 7.4–11.6 s | Crystal hobo on cobalt, with "SHINE" |
| 11.6–15.8 s | Red knot bag on mint, with "SPARKLE" |
| 15.8–18.0 s | End card: all three bags on podiums, "Mini bags, big mood.", DM TO ORDER, delivery all over Pakistan |

Iris wipes in the next scene's colour join the scenes. The camera slowly orbits ±11°, and each product turns partly toward the camera so the 2D photo never looks flat.

## How it is made

A Three.js scene runs in headless Chromium:
- real 3D extruded text, podiums with gold rings, soft shadows and environment reflections
- the HD product cut-outs used as image planes that cast real shadows
- an HTML overlay for the masthead and copy

`render.js` renders each frame at an exact time and pipes it into ffmpeg (x264, CRF 14, slow preset).

```bash
npm install three@0.187.0 opentype.js@1.3.4
python3 -m http.server 8765 --bind 127.0.0.1
node render.js out.mp4 30 18
```
