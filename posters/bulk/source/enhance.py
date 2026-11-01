"""Enhance cut-outs: clean edge halo, upscale small images, lift contrast/colour, sharpen."""
import sys, os
from PIL import Image, ImageFilter, ImageEnhance
src_dirs, out, ids = sys.argv[1].split(','), sys.argv[2], sys.argv[3].split(',')
os.makedirs(out, exist_ok=True)
for i in ids:
    src = next(f"{d}/{i}.png" for d in src_dirs if os.path.exists(f"{d}/{i}.png"))
    im = Image.open(src).convert('RGBA')
    if max(im.size) < 1100:                      # upscale small photos
        s = 1100 / max(im.size)
        im = im.resize((round(im.width * s), round(im.height * s)), Image.LANCZOS)
    r, g, b, a = im.split()
    a = a.filter(ImageFilter.MinFilter(3)).filter(ImageFilter.GaussianBlur(0.7))   # kill grey halo
    rgb = Image.merge('RGB', (r, g, b))
    rgb = ImageEnhance.Contrast(rgb).enhance(1.07)
    rgb = ImageEnhance.Color(rgb).enhance(1.08)
    rgb = rgb.filter(ImageFilter.UnsharpMask(radius=2, percent=70, threshold=2))
    o = rgb.convert('RGBA'); o.putalpha(a)
    bb = a.point(lambda v: 255 if v > 20 else 0).getbbox()
    o.crop(bb).save(f"{out}/{i}.png")
print('enhanced', len(ids))
