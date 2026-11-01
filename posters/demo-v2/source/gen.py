"""Outlook Styles - "Colour Story" poster generator.
One master theme (tonal colour-block) + per-category layout variants.
Usage: python3 gen.py <build_dir> <cut_dir>
Writes <build_dir>/html/<slug>.html ; render with render.js
"""
import json, math, os, sys

BUILD, CUT = sys.argv[1], sys.argv[2]
os.makedirs(f"{BUILD}/html", exist_ok=True)

# ---------------------------------------------------------------- palettes
# bg = base, glow = centre light, edge = vignette, word = big word, ink = text, acc = accent
PAL = {
    "cabernet": dict(bg="#541821", glow="#82283A", edge="#2E0B10", word="#8E3B47", ink="#F7ECDF", acc="#D9AE6C"),
    "midnight": dict(bg="#141C31", glow="#2C3C66", edge="#090E1A", word="#33456F", ink="#EEF2F8", acc="#BCCBE6"),
    "varsity":  dict(bg="#1D3A2C", glow="#2F5A44", edge="#10231A", word="#3D6A54", ink="#F2E9D7", acc="#E0BC6E", acc2="#B8282D"),
    "camel":    dict(bg="#B27C4E", glow="#CD9A6B", edge="#8A5A33", word="#94623A", ink="#26170D", acc="#FBEEDC"),
    "glacier":  dict(bg="#B4C8D8", glow="#DCE8F1", edge="#8BA3B8", word="#93ABBF", ink="#0E1926", acc="#1D3B5C"),
    "sage":     dict(bg="#8A927C", glow="#AEB59E", edge="#666E58", word="#727A64", ink="#191C14", acc="#F5EACD"),
    "terracotta": dict(bg="#A3462A", glow="#C35F3D", edge="#78301A", word="#BD6343", ink="#FFF1E5", acc="#F8D7A6"),
    "berry":    dict(bg="#7A2B40", glow="#A0465E", edge="#521A2A", word="#9C4A62", ink="#FFF0EF", acc="#F0C08A"),
    "saffron":  dict(bg="#C18A33", glow="#DFAE55", edge="#966419", word="#A97424", ink="#22160A", acc="#FFF4DE", acc2="#5A1424"),
    "cobalt":   dict(bg="#1F3B8C", glow="#3459C2", edge="#132564", word="#3B5BB3", ink="#FFFFFF", acc="#CBDAFF"),
    "espresso": dict(bg="#2C1E16", glow="#553B2A", edge="#170F0A", word="#4F3728", ink="#F4E8D7", acc="#D8AA66"),
    "teal":     dict(bg="#11403E", glow="#1E605B", edge="#082725", word="#245F5A", ink="#F3EADB", acc="#E6AE72"),
    "onyx":     dict(bg="#161514", glow="#34302A", edge="#070707", word="#2A2724", ink="#F3EBDD", acc="#D8B26A"),
    "marigold": dict(bg="#E0AA35", glow="#F3C85E", edge="#C08E22", word="#C9952A", ink="#1E1508", acc="#1E1508"),
}

STAR = "M50 0 C54 38 62 46 100 50 C62 54 54 62 50 100 C46 62 38 54 0 50 C38 46 46 38 50 0Z"


def star(x, y, s, color, op=1.0, rot=0):
    return (f'<svg class="star" style="left:{x}px;top:{y}px;width:{s}px;height:{s}px;opacity:{op};'
            f'transform:rotate({rot}deg)" viewBox="0 0 100 100"><path d="{STAR}" fill="{color}"/></svg>')


def jharoka_path(W, H, s, n=7, cusp=0.45):
    """Mughal cusped arch: straight sides up to springline s, scalloped pointed top."""
    def curve(t):  # left half: from (0,s) to apex (W/2,0) via quadratic bezier
        A, C, B = (0, s), (0, s * 0.18), (W / 2, 0)
        x = (1 - t) ** 2 * A[0] + 2 * (1 - t) * t * C[0] + t * t * B[0]
        y = (1 - t) ** 2 * A[1] + 2 * (1 - t) * t * C[1] + t * t * B[1]
        return x, y
    left = [curve(i / n) for i in range(n + 1)]
    right = [(W - x, y) for x, y in reversed(left)]
    d = f"M0 {H} L0 {s:.1f} "
    pts = left + right[1:]
    for (x0, y0), (x1, y1) in zip(pts, pts[1:]):
        r = math.hypot(x1 - x0, y1 - y0) * cusp * 1.25
        d += f"A{r:.1f} {r:.1f} 0 0 1 {x1:.1f} {y1:.1f} "
    d += f"L{W} {H}"
    return d


BASE_CSS = """
*{box-sizing:border-box;margin:0;padding:0}
html,body{width:1080px;height:1350px;overflow:hidden}
body{font-family:'Montserrat',sans-serif;-webkit-font-smoothing:antialiased}
.p{position:relative;width:1080px;height:1350px;overflow:hidden;color:var(--ink);
  background:radial-gradient(ellipse 70% 55% at 50% var(--gy,46%),var(--glow) 0%,var(--bg) 55%,var(--edge) 100%)}
.grain{position:absolute;inset:0;z-index:50;pointer-events:none;opacity:.20;mix-blend-mode:overlay;
  background-image:url("data:image/svg+xml;utf8,<svg xmlns='http://www.w3.org/2000/svg' width='300' height='300'><filter id='n'><feTurbulence type='fractalNoise' baseFrequency='.85' numOctaves='3' stitchTiles='stitch'/><feColorMatrix values='0 0 0 0 .5  0 0 0 0 .5  0 0 0 0 .5  0 0 0 1.4 -.2'/></filter><rect width='100%' height='100%' filter='url(%23n)'/></svg>")}
.frame{position:absolute;inset:30px;border:1.5px solid var(--acc);opacity:.42;z-index:40;pointer-events:none}
.mast{position:absolute;top:104px;left:72px;right:72px;z-index:30;display:flex;align-items:center;justify-content:space-between}
.mast .brand{font-weight:600;font-size:30px;letter-spacing:.42em;margin-right:-.42em}
.mast .side{font-weight:600;font-size:13px;letter-spacing:.32em;opacity:.85;width:190px}
.mast .side.r{text-align:right}
.rule{position:absolute;left:72px;right:72px;height:1.5px;background:var(--ink);opacity:.35;z-index:30}
.word{position:absolute;left:0;right:0;text-align:center;font-family:'Playfair Display',serif;font-weight:900;
  color:var(--word);line-height:.8;white-space:nowrap;z-index:2;letter-spacing:-.01em}
.prod{position:absolute;z-index:10}
.prod img{width:100%;height:100%;object-fit:contain;object-position:50% 100%;
  filter:drop-shadow(0 26px 30px rgba(0,0,0,.42)) drop-shadow(0 6px 8px rgba(0,0,0,.25))}
.cshadow{position:absolute;z-index:9;border-radius:50%;background:radial-gradient(ellipse at center,rgba(0,0,0,.55) 0%,rgba(0,0,0,0) 70%)}
.copy{position:absolute;left:72px;bottom:178px;z-index:30;max-width:690px}
.kick{font-weight:600;font-size:16px;letter-spacing:.34em;color:var(--acc);display:flex;align-items:center;gap:16px}
.kick:before{content:"";width:44px;height:2px;background:var(--acc)}
.head{font-family:'Playfair Display',serif;font-style:italic;font-weight:500;font-size:74px;line-height:1.02;margin:14px 0 14px;letter-spacing:-.01em}
.desc{font-size:20px;font-weight:500;letter-spacing:.02em;opacity:.9}
.cta{position:absolute;left:72px;right:72px;bottom:110px;z-index:30;display:flex;justify-content:space-between;align-items:center;
  padding-top:18px;border-top:1.5px solid color-mix(in srgb,var(--ink) 45%,transparent)}
.cta .l{font-weight:700;font-size:19px;letter-spacing:.3em}
.cta .r{font-weight:500;font-size:14px;letter-spacing:.26em;opacity:.9}
.chip{position:absolute;right:72px;bottom:182px;z-index:31;width:128px;background:#FBF7F0;padding:8px 8px 0;
  box-shadow:0 14px 26px rgba(0,0,0,.35);transform:rotate(3deg)}
.chip .sw{height:104px}
.chip .t1{font-size:8.5px;font-weight:700;letter-spacing:.24em;color:#1a1a1a;padding:9px 0 2px}
.chip .t2{font-size:11.5px;font-weight:600;letter-spacing:.12em;color:#1a1a1a;padding-bottom:10px;text-transform:uppercase;line-height:1.25}
.star{position:absolute;z-index:20}
.arch{position:absolute;z-index:1}
"""

FIT_JS = """
<script>
document.fonts.ready.then(()=>{
  document.querySelectorAll('[data-fitw]').forEach(el=>{
    el.style.fontSize='100px'; const tf=el.style.transform; el.style.transform='none';
    const r=document.createRange(); r.selectNodeContents(el); const w=r.getBoundingClientRect().width;
    el.style.fontSize=(100*el.dataset.fitw/w)+'px'; el.style.transform=tf;
  });
  document.body.dataset.ready='1';
});
</script>"""


def css_vars(p):
    return ";".join(f"--{k}:{v}" for k, v in p.items())


def head_html(title):
    return (f'<!doctype html><html><head><meta charset="utf-8"><title>{title}</title>'
            f'<link rel="stylesheet" href="../fonts/fonts.css"><style>{BASE_CSS}</style></head><body>')


def common(c):
    left = c.get("left", "COLOUR STORY")
    return (f'<div class="frame"></div><div class="grain"></div>'
            f'<div class="mast"><div class="side">{left}</div><div class="brand">OUTLOOK STYLES</div>'
            f'<div class="side r">{c["cat"]}</div></div><div class="rule" style="top:156px"></div>'
            f'<div class="cta"><div class="l">DM TO ORDER &nbsp;&rarr;</div><div class="r">DELIVERY ALL OVER PAKISTAN</div></div>')


def copy_block(c):
    return (f'<div class="copy"><div class="kick">{c["kicker"]}</div><div class="head">{c["head"]}</div>'
            f'<div class="desc">{c["desc"]}</div></div>')


def chip(c):
    if not c.get("chip"):
        return ""
    name, col = c["chip"]
    return (f'<div class="chip"><div class="sw" style="background:{col}"></div>'
            f'<div class="t1">OUTLOOK STYLES</div><div class="t2">{name}</div></div>')


def product(img, x, top, w, h, shadow=None, extra_style=""):
    s = ""
    if shadow:
        sw, sy = shadow
        s = f'<div class="cshadow" style="left:{x + w/2 - sw/2}px;top:{sy}px;width:{sw}px;height:{sw*0.12}px"></div>'
    return s + (f'<div class="prod" style="left:{x}px;top:{top}px;width:{w}px;height:{h}px;{extra_style}">'
                f'<img src="file://{CUT}/{img}.png"></div>')


# ---------------------------------------------------------------- variants
def v_spotlight(c, p):
    """BAGS: tonal arch + spotlight, big serif word behind, gold sparkles."""
    b = c["box"]
    arch = (f'<div class="arch" style="left:{540-330}px;top:250px;width:660px;height:760px;border-radius:330px 330px 0 0;'
            f'background:linear-gradient(180deg,color-mix(in srgb,var(--glow) 70%,transparent),color-mix(in srgb,var(--bg) 40%,transparent));'
            f'border:2px solid color-mix(in srgb,var(--acc) 60%,transparent);border-bottom:none"></div>')
    word = f'<div class="word" data-fitw="930" style="top:{c.get("wordtop",186)}px">{c["word"]}</div>'
    stars = star(800, 330, 46, p["acc"]) + star(232, 600, 30, p["acc"], .9) + star(845, 410, 20, p["acc"], .8)
    return arch + word + product(c["img"], *b, shadow=c.get("shadow")) + stars


def v_stacked(c, p):
    """TOPS & WINTERWEAR: big word stacked 3x (solid / outline / outline)."""
    w = c["word"]
    t = c.get("wordtop", 196)
    lines = ""
    for i, style in enumerate(["", "-webkit-text-stroke:2.5px var(--word);color:transparent;",
                               "-webkit-text-stroke:2.5px var(--word);color:transparent;opacity:.75"]):
        lines += f'<div class="word" data-fitw="940" style="top:{t + i*c.get("gap",232)}px;{style}">{w}</div>'
    stars = star(850, 300, 40, p["acc"]) + star(190, 770, 26, p["acc"], .85)
    return lines + product(c["img"], *c["box"], shadow=c.get("shadow")) + stars


def v_vertical(c, p):
    """BOTTOMS & DRESSES: giant vertical word on the left, tall product right."""
    word = (f'<div class="word" data-fitw="{c.get("vlen",860)}" style="left:auto;right:auto;top:0;'
            f'transform-origin:0 0;transform:translate({c.get("vx",70)}px,{c.get("vy",1035)}px) rotate(-90deg);text-align:left;line-height:.78">{c["word"]}</div>')
    side = (f'<div style="position:absolute;z-index:3;left:{c.get("tagx",330)}px;top:200px;font-weight:600;font-size:13px;letter-spacing:.32em;'
            f'writing-mode:vertical-rl;opacity:.8">{c.get("vtag","")}</div>')
    stars = star(900, 260, 40, p["acc"]) + star(330, 900, 24, p["acc"], .85)
    return word + side + product(c["img"], *c["box"], shadow=c.get("shadow")) + stars


def v_jharoka(c, p):
    """EASTERN / EID: Mughal cusped arch with double outline."""
    W, H, s = 700, c.get("archh", 830), 330
    d = jharoka_path(W, H, s)
    d2 = jharoka_path(W - 44, H - 22, s - 4)
    W, H = 700, c.get("archh", 830)
    svg = (f'<svg class="arch" style="left:{540-W/2}px;top:{c.get("archtop",200)}px" width="{W}" height="{H}" viewBox="0 0 {W} {H}">'
           f'<defs><linearGradient id="ag" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="{p["glow"]}"/>'
           f'<stop offset="1" stop-color="{p["bg"]}" stop-opacity=".2"/></linearGradient></defs>'
           f'<path d="{d}" fill="url(#ag)" stroke="{p["acc"]}" stroke-width="3"/>'
           f'<g transform="translate(22,22)"><path d="{d2}" fill="none" stroke="{p["acc"]}" stroke-width="1.5" opacity=".8"/></g>'
           f'<circle cx="{W/2}" cy="-2" r="7" fill="{p["acc"]}"/></svg>')
    word = f'<div class="word" data-fitw="930" style="top:{c.get("wordtop",205)}px">{c["word"]}</div>'
    stars = (star(110, 330, 34, p["acc"]) + star(930, 330, 34, p["acc"]) + star(150, 820, 20, p["acc"], .8)
             + star(905, 820, 20, p["acc"], .8))
    return word + svg + product(c["img"], *c["box"], shadow=c.get("shadow")) + stars


def v_wide(c, p):
    """SUNGLASSES: sun disc, two-line word, product with floor reflection."""
    x, top, w, h = c["box"]
    disc = (f'<div class="arch" style="left:{540-330}px;top:{c.get("disctop",300)}px;width:660px;height:660px;border-radius:50%;'
            f'background:radial-gradient(circle at 50% 40%,var(--glow),color-mix(in srgb,var(--glow) 30%,transparent) 70%);'
            f'border:2px solid color-mix(in srgb,var(--acc) 55%,transparent)"></div>')
    words = "".join(f'<div class="word" data-fitw="{fw}" style="top:{tp}px">{wd}</div>' for wd, tp, fw in c["words"])
    refl = (f'<div class="prod" style="left:{x}px;top:{top+h-6}px;width:{w}px;height:{h}px;transform:scaleY(-1);opacity:.28;'
            f'-webkit-mask-image:linear-gradient(to top,rgba(0,0,0,.9),transparent 55%)"><img src="file://{CUT}/{c["img"]}.png" style="filter:none"></div>')
    stars = star(860, 330, 44, p["acc"]) + star(170, 450, 26, p["acc"], .85)
    return disc + words + refl + product(c["img"], x, top, w, h) + stars


def v_details(c, p):
    """FLATS & JEWELLERY: medallion spotlight + callout labels."""
    med = (f'<div class="arch" style="left:{540-c.get("mr",350)}px;top:{c.get("mtop",270)}px;width:{2*c.get("mr",350)}px;height:{2*c.get("mr",350)}px;border-radius:50%;'
           f'background:radial-gradient(circle,var(--glow) 0%,color-mix(in srgb,var(--glow) 40%,transparent) 65%,transparent 72%);'
           f'box-shadow:0 0 0 2px color-mix(in srgb,var(--acc) 70%,transparent),0 0 0 16px color-mix(in srgb,var(--acc) 0%,transparent),0 0 0 18px color-mix(in srgb,var(--acc) 35%,transparent)"></div>')
    word = f'<div class="word" data-fitw="930" style="top:{c.get("wordtop",186)}px">{c["word"]}</div>'
    calls = '<svg style="position:absolute;left:0;top:0;z-index:25" width="1080" height="1350">'
    labels = ""
    for (dx, dy, lx, ly, txt, al) in c["calls"]:
        calls += (f'<circle cx="{dx}" cy="{dy}" r="6" fill="{p["acc"]}"/><circle cx="{dx}" cy="{dy}" r="13" fill="none" stroke="{p["acc"]}" stroke-width="1.5"/>'
                  f'<line x1="{dx}" y1="{dy}" x2="{lx}" y2="{ly}" stroke="{p["acc"]}" stroke-width="1.5"/>')
        tx = lx - 230 if al == "r" else lx
        calls += f'<line x1="{lx}" y1="{ly}" x2="{lx + (-230 if al == "r" else 230)}" y2="{ly}" stroke="{p["acc"]}" stroke-width="1.5" opacity=".6"/>'
        labels += (f'<div style="position:absolute;z-index:26;left:{tx}px;bottom:{1350-ly+10}px;width:230px;text-align:{"right" if al=="r" else "left"};'
                   f'font-size:13px;font-weight:700;letter-spacing:.24em;line-height:1.6;color:var(--acc)">{txt}</div>')
    calls += "</svg>"
    stars = star(860, 290, 36, p["acc"]) + star(190, 330, 22, p["acc"], .85)
    return med + word + product(c["img"], *c["box"], shadow=c.get("shadow")) + calls + labels + stars


def v_trio(c, p):
    """CATEGORY DROP: three products of one category, labelled."""
    word = f'<div class="word" data-fitw="930" style="top:{c.get("wordtop",186)}px">{c["word"]}</div>'
    out = word
    for (img, x, top, w, h, label, lx, ly, al) in c["items"]:
        out += product(img, x, top, w, h)
        out += (f'<div style="position:absolute;z-index:26;left:{lx}px;top:{ly}px;font-size:14px;font-weight:700;letter-spacing:.3em;'
                f'text-align:{al};width:240px">{label}<div style="height:2px;width:36px;background:var(--ink);margin-top:10px;'
                f'{"margin-left:auto" if al=="right" else ""}"></div></div>')
    out += star(870, 300, 40, p["ink"]) + star(160, 700, 24, p["ink"], .8)
    return out


def v_manifesto(c, p):
    """BRAND: typography-only manifesto with a product strip."""
    lines = ""
    for txt, top, size, style in c["lines"]:
        lines += (f'<div style="position:absolute;left:72px;right:72px;top:{top}px;z-index:20;font-family:\'Playfair Display\',serif;'
                  f'font-size:{size}px;line-height:1;{style}">{txt}</div>')
    strip = ""
    for (img, x, top, w, h) in c["strip"]:
        strip += product(img, x, top, w, h)
    return lines + strip + star(880, 250, 46, p["acc"]) + star(800, 700, 24, p["acc"], .85)


VARIANTS = dict(spotlight=v_spotlight, stacked=v_stacked, vertical=v_vertical, jharoka=v_jharoka,
                wide=v_wide, details=v_details, trio=v_trio, manifesto=v_manifesto)


def build(c):
    p = PAL[c["pal"]]
    body = VARIANTS[c["variant"]](c, p)
    gy = c.get("gy", "46%")
    html = (head_html(c["slug"]) + f'<div class="p" style="{css_vars(p)};--gy:{gy}">' + common(c) + body
            + (copy_block(c) if c.get("head") else "") + chip(c) + "</div>" + FIT_JS + "</body></html>")
    open(f"{BUILD}/html/{c['slug']}.html", "w").write(html)


if __name__ == "__main__":
    posters = json.load(open(f"{BUILD}/posters.json"))
    only = sys.argv[3].split(",") if len(sys.argv) > 3 else None
    for c in posters:
        if only and c["slug"] not in only:
            continue
        build(c)
        print("built", c["slug"])
