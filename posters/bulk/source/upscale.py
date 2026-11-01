"""Real-ESRGAN (ONNX) x4 upscale + texture blend + clean-up for product cut-outs.
Usage: upscale.py model.onnx out_dir maxside src_dir1,src_dir2 id,id,..."""
import sys, numpy as np, onnxruntime as ort
from PIL import Image
import os
from PIL import ImageFilter, ImageEnhance
model, odir, maxside, srcs, ids = sys.argv[1], sys.argv[2], int(sys.argv[3]), sys.argv[4].split(','), sys.argv[5].split(',')
os.makedirs(odir, exist_ok=True)
so = ort.SessionOptions(); so.intra_op_num_threads = 4
sess = ort.InferenceSession(model, so, providers=['CPUExecutionProvider'])
for i in ids:
    src = next(f"{d}/{i}.png" for d in srcs if os.path.exists(f"{d}/{i}.png")); dst = f"{odir}/{i}.png"
    if os.path.exists(dst): continue
    im = Image.open(src).convert('RGBA'); rgb = np.asarray(im.convert('RGB'), np.float32) / 255.
    H, W, _ = rgb.shape; T, P = 256, 12
    out = np.zeros((H * 4, W * 4, 3), np.float32)
    for y in range(0, H, T):
        for x in range(0, W, T):
            y0, x0, y1, x1 = max(y - P, 0), max(x - P, 0), min(y + T + P, H), min(x + T + P, W)
            t = rgb[y0:y1, x0:x1].transpose(2, 0, 1)[None]
            o = sess.run(None, {'input': t})[0][0].transpose(1, 2, 0)
            oy, ox = (y - y0) * 4, (x - x0) * 4
            h, w = min(T, H - y) * 4, min(T, W - x) * 4
            out[y * 4:y * 4 + h, x * 4:x * 4 + w] = o[oy:oy + h, ox:ox + w]
    sr = Image.fromarray((np.clip(out, 0, 1) * 255).round().astype(np.uint8))
    lz = (im.convert('RGB').resize(sr.size, Image.LANCZOS)
          .filter(ImageFilter.UnsharpMask(4, 90, 1)).filter(ImageFilter.UnsharpMask(1.5, 60, 1)))
    up = Image.blend(sr, lz, 0.65)   # 35% AI (clean edges) + 65% sharpened upscale (real texture)
    up = ImageEnhance.Contrast(up).enhance(1.06); up = ImageEnhance.Color(up).enhance(1.07)
    a = im.getchannel('A').resize(up.size, Image.LANCZOS).filter(ImageFilter.MinFilter(7)).filter(ImageFilter.GaussianBlur(1.6))
    up.putalpha(a)
    s = min(1, maxside / max(up.size))
    if s < 1: up = up.resize((round(up.width * s), round(up.height * s)), Image.LANCZOS)
    bb = up.getchannel('A').point(lambda v: 255 if v > 20 else 0).getbbox(); up = up.crop(bb)
    up.save(dst); print(i, up.size, flush=True)