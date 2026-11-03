"""Pre-compute per product: object bbox + two detail crop windows (sharp, ~1:1 on the 2048 canvas).
Usage: python3 prep.py  ->  writes jobs.json"""
import json, os, numpy as np
from PIL import Image
HERE = os.path.dirname(os.path.abspath(__file__)); KIT = os.path.join(HERE, '..', '..', 'reel-kit')
D = json.load(open(f'{KIT}/data/products.json')); PAL = json.load(open(f'{KIT}/data/palettes.json'))
byId = {p['id']: p for p in D['products']}
sel = json.load(open(f'{HERE}/select.json'))['ids']

def windows(gray, mask, cw, ch, f=4):
    g = gray[::f, ::f].astype(np.float32); m = mask[::f, ::f].astype(np.float32)
    e = (np.abs(np.diff(g, axis=0, prepend=g[:1])) + np.abs(np.diff(g, axis=1, prepend=g[:, :1]))) * m
    I = np.pad(e.cumsum(0).cumsum(1), ((1, 0), (1, 0))); M = np.pad(m.cumsum(0).cumsum(1), ((1, 0), (1, 0)))
    w, h = max(1, cw // f), max(1, ch // f); H, W = g.shape
    if w >= W or h >= H: return []
    S = I[h:, w:] - I[:-h, w:] - I[h:, :-w] + I[:-h, :-w]; C = (M[h:, w:] - M[:-h, w:] - M[h:, :-w] + M[:-h, :-w]) / (w * h)
    out = []
    for thr in (.9, .75, .55, .3, .12):
        T = np.where(C > thr, S, -1)
        for (x0, y0, _, _) in out:
            x0, y0 = x0 // f, y0 // f; T[max(0, y0 - int(h * .95)):y0 + int(h * .95), max(0, x0 - int(w * .95)):x0 + int(w * .95)] = -1
        while len(out) < 2:
            y, x = np.unravel_index(np.argmax(T), T.shape)
            if T[y, x] <= 0: break
            out.append([int(x * f), int(y * f), cw, ch])
            T[max(0, y - int(h * .95)):y + int(h * .95), max(0, x - int(w * .95)):x + int(w * .95)] = -1
        if len(out) == 2: break
    return out

jobs = []
for i in sel:
    p = byId[str(i)]; im = Image.open(f"{KIT}/{p['img']}").convert('RGBA'); a = np.asarray(im.split()[3])
    ys, xs = np.where(a > 128); bb = [int(xs.min()), int(ys.min()), int(xs.max()) + 1, int(ys.max()) + 1]
    bw, bh = bb[2] - bb[0], bb[3] - bb[1]
    wide = bw > bh * 1.15
    tw, th = (1848, 700) if wide else (900, 1320)      # tile size on the 2048 canvas
    sc = 1.12                                           # max upscale -> stays sharp
    cw, ch = int(min(tw / sc, .72 * bw)), int(min(th / sc, .72 * bh)); k = 1
    gray = np.asarray(im.convert('L')); mask = a > 250
    crops = windows(gray, mask, cw, ch)
    pal = PAL[p['palette']]
    jobs.append(dict(id=p['id'], slug=p['kicker'].lower().replace('the ', '', 1).replace(' ', '-').replace('&amp;', 'and'),
        img=f"../../reel-kit/{p['img']}", size=list(im.size), bbox=bb, crops=crops, wide=wide, tile=[int(cw * sc), int(ch * sc)], up=sc,
        cat=p['cat'], kick=p['kicker'], word=p['word'], head=p['head'], desc=p['desc'], chip=p['chip'], pal=pal))
json.dump(jobs, open(f'{HERE}/jobs.json', 'w'), indent=0)
print(len(jobs), 'jobs; crops<2:', [j['id'] for j in jobs if len(j['crops']) < 2], 'small tiles:', [(j['id'], j['tile']) for j in jobs if min(j['tile']) < 560])
