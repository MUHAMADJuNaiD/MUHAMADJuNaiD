"""Outlook Styles - "Colour Pop" poster generator (v3).
Each poster = bold background + ONE contrasting pop colour (big word, CTA button,
headline highlight) + neutral ink. Per-category layout variants.
Usage: python3 gen3.py <build_dir> <cut_dir> [slug,slug]
Reads <build_dir>/posters3.json, writes <build_dir>/html3/<slug>.html
"""
import json, math, os, sys

BUILD, CUT = sys.argv[1], sys.argv[2]
OUT = f"{BUILD}/html3"
os.makedirs(OUT, exist_ok=True)

# bg/bg2 = background + centre light, word = pop colour (big word, highlight),
# ink = text, btn/btnink = CTA button, acc = stars & fine lines, shape = arch/disc/panel
PAL = {
    "pink-cherry":   dict(bg="#F4BFCB", bg2="#FBDDE4", word="#B5121F", ink="#3E0A12", btn="#B5121F", btnink="#FFF2F4", acc="#B5121F", shape="#F9D3DC"),
    "cobalt-ice":    dict(bg="#1B36C9", bg2="#3554E6", word="#F3F6FF", ink="#F3F6FF", btn="#F3F6FF", btnink="#1B36C9", acc="#FFFFFF", shape="#2A47DA"),
    "red-varsity":   dict(bg="#B3162A", bg2="#CF2B3F", word="#F6EAD2", ink="#FFF6E8", btn="#13224A", btnink="#F6EAD2", acc="#F6EAD2", shape="#13224A"),
    "butter-rust":   dict(bg="#F2D27A", bg2="#F8E4A8", word="#B4441C", ink="#3A1F10", btn="#3A1F10", btnink="#F8E4A8", acc="#B4441C", shape="#3A1F10"),
    "lime-violet":   dict(bg="#D2E86A", bg2="#E6F49E", word="#5A2BD6", ink="#1B1530", btn="#5A2BD6", btnink="#F2EEFF", acc="#5A2BD6", shape="#5A2BD6"),
    "wine-blush":    dict(bg="#6A1430", bg2="#8C2245", word="#FFAFC5", ink="#FFEEF2", btn="#FFAFC5", btnink="#6A1430", acc="#FFAFC5", shape="#FFAFC5"),
    "champagne-ink": dict(bg="#E6C88E", bg2="#F2DDB2", word="#141414", ink="#141414", btn="#141414", btnink="#F2DDB2", acc="#141414", shape="#D7B472"),
    "orange-navy":   dict(bg="#EC5B2A", bg2="#F57A45", word="#18285E", ink="#FFF3EA", btn="#18285E", btnink="#FFF3EA", acc="#FFF3EA", shape="#D84A1C"),
    "sun-cobalt":    dict(bg="#FFD54A", bg2="#FFE480", word="#1F3BD1", ink="#151A33", btn="#1F3BD1", btnink="#FFFFFF", acc="#1F3BD1", shape="#FFC61F"),
    "ivory-emerald": dict(bg="#F4E7CC", bg2="#FBF3E2", word="#0E5A43", ink="#1C2A22", btn="#0E5A43", btnink="#F4E7CC", acc="#B88A2E", shape="#EAD6AE"),
    "tangerine":     dict(bg="#FF7A2F", bg2="#FF9A55", word="#3E1606", ink="#2A0E03", btn="#3E1606", btnink="#FFE3CC", acc="#3E1606", shape="#FFC23D"),
    "pink-yellow":   dict(bg="#FF5C9D", bg2="#FF86B6", word="#FFE14D", ink="#2A0016", btn="#FFE14D", btnink="#2A0016", acc="#FFE14D", shape="#FF77AE"),
    "teal-blush":    dict(bg="#0E4F47", bg2="#17695E", word="#FFA9BC", ink="#FFF3EA", btn="#FFA9BC", btnink="#0E4F47", acc="#FFA9BC", shape="#17695E"),
    "black-gold":    dict(bg="#0D0D0D", bg2="#262420", word="#E2BE6E", gold="1", ink="#F4ECDC", btn="#D9B25F", btnink="#0D0D0D", acc="#D9B25F", shape="#1E1C19"),
    "cherry-brand":  dict(bg="#B0101C", bg2="#C8202D", word="#FFB3C7", ink="#FFF2EC", btn="#FFB3C7", btnink="#7A0812", acc="#FFB3C7", shape="#C8202D"),
}

STAR = "M50 0 C54 38 62 46 100 50 C62 54 54 62 50 100 C46 62 38 54 0 50 C38 46 46 38 50 0Z"


def star(x, y, s, color, op=1.0):
    return (f'<svg class="star" style="left:{x}px;top:{y}px;width:{s}px;height:{s}px;opacity:{op}" '
            f'viewBox="0 0 100 100"><path d="{STAR}" fill="{color}"/></svg>')


def jharoka_path(W, H, s, n=7, cusp=0.45):
    def curve(t):
        A, C, B = (0, s), (0, s * 0.18), (W / 2, 0)
        return ((1 - t) ** 2 * A[0] + 2 * (1 - t) * t * C[0] + t * t * B[0],
                (1 - t) ** 2 * A[1] + 2 * (1 - t) * t * C[1] + t * t * B[1])
    left = [curve(i / n) for i in range(n + 1)]
    pts = left + [(W - x, y) for x, y in reversed(left)][1:]
    d = f"M0 {H} L0 {s:.1f} "
    for (x0, y0), (x1, y1) in zip(pts, pts[1:]):
        r = math.hypot(x1 - x0, y1 - y0) * cusp * 1.25
        d += f"A{r:.1f} {r:.1f} 0 0 1 {x1:.1f} {y1:.1f} "
    return d + f"L{W} {H}"


CSS = """
*{box-sizing:border-box;margin:0;padding:0}
html,body{width:1080px;height:1350px;overflow:hidden}
body{font-family:'Montserrat',sans-serif;-webkit-font-smoothing:antialiased}
.p{position:relative;width:1080px;height:1350px;overflow:hidden;color:var(--ink);
  background:radial-gradient(ellipse 75% 60% at 50% var(--gy,48%),var(--bg2) 0%,var(--bg) 62%)}
.grain{position:absolute;inset:0;z-index:50;pointer-events:none;opacity:.16;mix-blend-mode:overlay;
  background-image:url("data:image/svg+xml;utf8,<svg xmlns='http://www.w3.org/2000/svg' width='300' height='300'><filter id='n'><feTurbulence type='fractalNoise' baseFrequency='.85' numOctaves='3' stitchTiles='stitch'/><feColorMatrix values='0 0 0 0 .5  0 0 0 0 .5  0 0 0 0 .5  0 0 0 1.4 -.2'/></filter><rect width='100%' height='100%' filter='url(%23n)'/></svg>")}
.mast{position:absolute;top:100px;left:72px;right:72px;z-index:30;display:flex;align-items:center;justify-content:space-between}
.mast .brand{font-weight:700;font-size:30px;letter-spacing:.42em;margin-right:-.42em}
.mast .side{font-weight:700;font-size:13px;letter-spacing:.3em;width:190px}
.mast .side.r{text-align:right}
.mast .side span{display:inline-block;padding:7px 12px;border:1.5px solid var(--ink);border-radius:99px;letter-spacing:.24em}
.rule{position:absolute;left:72px;right:72px;top:152px;height:2px;background:var(--ink);opacity:.5;z-index:30}
.word{position:absolute;left:0;right:0;text-align:center;font-family:'Playfair Display',serif;font-weight:900;
  color:var(--word);line-height:.8;white-space:nowrap;z-index:3;letter-spacing:-.015em}
.word.gold{background:linear-gradient(180deg,#F6DE9A 0%,#D9B25F 45%,#9C7426 100%);-webkit-background-clip:text;background-clip:text;color:transparent}
.prod{position:absolute;z-index:10}
.prod img{width:100%;height:100%;object-fit:contain;object-position:50% 100%;
  filter:drop-shadow(0 30px 34px rgba(0,0,0,.42)) drop-shadow(0 8px 10px rgba(0,0,0,.28))}
.cshadow{position:absolute;z-index:9;border-radius:50%;background:radial-gradient(ellipse at center,rgba(0,0,0,.5) 0%,rgba(0,0,0,0) 70%)}
.copy{position:absolute;left:72px;bottom:196px;z-index:30;max-width:800px}
.kick{font-weight:700;font-size:16px;letter-spacing:.34em;display:flex;align-items:center;gap:16px}
.kick:before{content:"";width:44px;height:2.5px;background:var(--ink)}
.head{font-family:'Playfair Display',serif;font-style:italic;font-weight:600;font-size:80px;line-height:1;margin:12px 0 12px;white-space:nowrap;letter-spacing:-.015em}
.head b{color:var(--word);font-weight:800}
.desc{font-size:21px;font-weight:500;letter-spacing:.01em}
.cta{position:absolute;left:72px;right:72px;bottom:104px;z-index:30;display:flex;justify-content:space-between;align-items:center}
.cta .btn{background:var(--btn);color:var(--btnink);font-weight:800;font-size:19px;letter-spacing:.24em;padding:19px 34px 18px 38px;border-radius:99px;
  box-shadow:0 10px 22px rgba(0,0,0,.22)}
.cta .r{font-weight:700;font-size:14px;letter-spacing:.24em;text-align:right;line-height:1.6}
.chip{position:absolute;right:72px;bottom:200px;z-index:31;width:132px;background:#FFFCF6;padding:8px 8px 0;
  box-shadow:0 16px 28px rgba(0,0,0,.32);transform:rotate(4deg)}
.chip .sw{height:108px}
.chip .t1{font-size:8.5px;font-weight:700;letter-spacing:.24em;color:#1a1a1a;padding:9px 0 2px}
.chip .t2{font-size:11.5px;font-weight:700;letter-spacing:.12em;color:#1a1a1a;padding-bottom:10px;text-transform:uppercase;line-height:1.25}
.star{position:absolute;z-index:20}
.shape{position:absolute;z-index:1}
"""

FIT_JS = """
<script>
document.fonts.ready.then(()=>{
  document.querySelectorAll('[data-fitw]').forEach(el=>{
    const tf=el.style.transform; el.style.transform='none'; el.style.fontSize='100px';
    const r=document.createRange(); r.selectNodeContents(el); const w=r.getBoundingClientRect().width;
    el.style.fontSize=(100*el.dataset.fitw/w)+'px'; el.style.transform=tf;
  });
  document.body.dataset.ready='1';
});
</script>"""


def word_div(text, top, fitw=960, style="", p=None, cls=""):
    gold = " gold" if p and p.get("gold") else ""
    return f'<div class="word{gold} {cls}" data-fitw="{fitw}" style="top:{top}px;{style}">{text}</div>'


def product(img, x, top, w, h, shadow=None, style=""):
    s = ""
    if shadow:
        sw, sy = shadow
        s = f'<div class="cshadow" style="left:{x + w/2 - sw/2}px;top:{sy}px;width:{sw}px;height:{sw*0.12}px"></div>'
    return s + (f'<div class="prod" style="left:{x}px;top:{top}px;width:{w}px;height:{h}px;{style}">'
                f'<img src="file://{CUT}/{img}.png"></div>')


def common(c):
    return (f'<div class="grain"></div>'
            f'<div class="mast"><div class="side">{c.get("left","NEW IN")}</div><div class="brand">OUTLOOK STYLES</div>'
            f'<div class="side r"><span>{c["cat"]}</span></div></div><div class="rule"></div>'
            f'<div class="cta"><div class="btn">DM TO ORDER &nbsp;&rarr;</div>'
            f'<div class="r">DELIVERY ALL<br>OVER PAKISTAN</div></div>')


def copy_block(c):
    return (f'<div class="copy"><div class="kick">{c["kicker"]}</div><div class="head">{c["head"]}</div>'
            f'<div class="desc">{c["desc"]}</div></div>')


def chip(c):
    if not c.get("chip"):
        return ""
    name, col = c["chip"]
    return (f'<div class="chip"><div class="sw" style="background:{col}"></div>'
            f'<div class="t1">OUTLOOK STYLES</div><div class="t2">{name}</div></div>')


# ------------------------------------------------------------------ variants
def v_spotlight(c, p):
    """BAGS: big pop word on top, filled arch behind product."""
    arch = (f'<div class="shape" style="left:{540-c.get("aw",340)}px;top:{c.get("atop",330)}px;width:{2*c.get("aw",340)}px;height:{1030-c.get("atop",330)}px;'
            f'border-radius:{c.get("aw",340)}px {c.get("aw",340)}px 0 0;background:var(--shape)"></div>')
    return (arch + word_div(c["word"], c.get("wordtop", 172), p=p) + product(c["img"], *c["box"], shadow=c.get("shadow"))
            + star(850, 360, 48, p["acc"]) + star(200, 640, 30, p["acc"]))


def v_stacked(c, p):
    """TOPS & WINTERWEAR: solid pop word + two outline repeats behind garment."""
    t, gap = c.get("wordtop", 172), c.get("gap", 228)
    out = word_div(c["word"], t, p=p)
    for i in (1, 2):
        out += word_div(c["word"], t + i * gap, p=p,
                        style=f"-webkit-text-stroke:3px var(--word);color:transparent;opacity:{.6 if i==1 else .35}")
    return out + product(c["img"], *c["box"], shadow=c.get("shadow")) + star(860, 330, 44, p["acc"]) + star(170, 780, 28, p["acc"])


def v_vertical(c, p):
    """BOTTOMS & DRESSES: giant vertical pop word left, rounded panel + tall product right."""
    panel = (f'<div class="shape" style="left:{c.get("px",420)}px;top:200px;width:{c.get("pw",560)}px;height:800px;'
             f'border-radius:280px 280px 24px 24px;background:var(--shape)"></div>')
    word = (f'<div class="word" data-fitw="{c.get("vlen",800)}" style="left:auto;right:auto;top:0;transform-origin:0 0;'
            f'transform:translate({c.get("vx",66)}px,{c.get("vy",1000)}px) rotate(-90deg);text-align:left;line-height:.78">{c["word"]}</div>')
    tag = (f'<div style="position:absolute;z-index:3;left:{c.get("tagx",332)}px;top:205px;font-weight:700;font-size:13px;'
           f'letter-spacing:.32em;writing-mode:vertical-rl">{c.get("vtag","")}</div>')
    return panel + word + tag + product(c["img"], *c["box"], shadow=c.get("shadow")) + star(940, 240, 40, p["acc"]) + star(350, 880, 26, p["acc"])


def v_jharoka(c, p):
    """EID: cusped Mughal arch (shape + gold double line) under a pop word."""
    W, H, s = 720, c.get("archh", 700), 330
    d, d2 = jharoka_path(W, H, s), jharoka_path(W - 44, H - 22, s - 4)
    svg = (f'<svg class="shape" style="left:{540-W/2}px;top:{c.get("archtop",320)}px" width="{W}" height="{H}" viewBox="0 0 {W} {H}">'
           f'<path d="{d}" fill="{p["shape"]}" stroke="{p["acc"]}" stroke-width="3.5"/>'
           f'<g transform="translate(22,22)"><path d="{d2}" fill="none" stroke="{p["acc"]}" stroke-width="1.6"/></g>'
           f'<circle cx="{W/2}" cy="-4" r="8" fill="{p["acc"]}"/></svg>')
    return (word_div(c["word"], c.get("wordtop", 172), p=p) + svg + product(c["img"], *c["box"], shadow=c.get("shadow"))
            + star(96, 420, 36, p["acc"]) + star(948, 420, 36, p["acc"]) + star(130, 820, 22, p["acc"]) + star(926, 820, 22, p["acc"]))


def v_wide(c, p):
    """SUNGLASSES: contrasting sun disc, pop word, product + reflection."""
    x, top, w, h = c["box"]
    disc = (f'<div class="shape" style="left:{540-c.get("dr",320)}px;top:{c.get("disctop",330)}px;width:{2*c.get("dr",320)}px;'
            f'height:{2*c.get("dr",320)}px;border-radius:50%;background:var(--shape)"></div>')
    refl = (f'<div class="prod" style="left:{x}px;top:{top+h-6}px;width:{w}px;height:{h}px;transform:scaleY(-1);opacity:.22;'
            f'-webkit-mask-image:linear-gradient(to top,rgba(0,0,0,.9),transparent 55%)"><img src="file://{CUT}/{c["img"]}.png" style="filter:none"></div>')
    return (disc + word_div(c["word"], c.get("wordtop", 172), p=p) + refl + product(c["img"], x, top, w, h)
            + star(880, 360, 46, p["acc"]) + star(160, 470, 28, p["acc"]))


def v_details(c, p):
    """FLATS & JEWELLERY: medallion + callouts."""
    r, mt = c.get("mr", 340), c.get("mtop", 300)
    med = (f'<div class="shape" style="left:{540-r}px;top:{mt}px;width:{2*r}px;height:{2*r}px;border-radius:50%;background:var(--shape);'
           f'box-shadow:0 0 0 3px var(--acc),0 0 0 18px transparent,0 0 0 20px color-mix(in srgb,var(--acc) 45%,transparent)"></div>')
    svg, labels = '<svg style="position:absolute;left:0;top:0;z-index:25" width="1080" height="1350">', ""
    for (dx, dy, lx, ly, txt, al) in c["calls"]:
        svg += (f'<circle cx="{dx}" cy="{dy}" r="7" fill="{p["acc"]}"/><circle cx="{dx}" cy="{dy}" r="15" fill="none" stroke="{p["acc"]}" stroke-width="2"/>'
                f'<line x1="{dx}" y1="{dy}" x2="{lx}" y2="{ly}" stroke="{p["acc"]}" stroke-width="2"/>'
                f'<line x1="{lx}" y1="{ly}" x2="{lx + (-220 if al == "r" else 220)}" y2="{ly}" stroke="{p["acc"]}" stroke-width="2"/>')
        tx = lx - 220 if al == "r" else lx
        labels += (f'<div style="position:absolute;z-index:26;left:{tx}px;bottom:{1350-ly+10}px;width:220px;text-align:{"right" if al=="r" else "left"};'
                   f'font-size:14px;font-weight:800;letter-spacing:.22em;line-height:1.55;color:var(--ink)">{txt}</div>')
    svg += "</svg>"
    return (med + word_div(c["word"], c.get("wordtop", 172), p=p) + product(c["img"], *c["box"], shadow=c.get("shadow"))
            + svg + labels + star(880, 300, 38, p["acc"]) + star(180, 330, 24, p["acc"]))


def v_trio(c, p):
    out = word_div(c["word"], c.get("wordtop", 172), p=p)
    for (img, x, top, w, h, label, lx, ly, al) in c["items"]:
        out += product(img, x, top, w, h)
        out += (f'<div style="position:absolute;z-index:26;left:{lx}px;top:{ly}px;width:230px;text-align:{al}">'
                f'<span style="display:inline-block;background:var(--ink);color:var(--bg);font-size:13px;font-weight:800;'
                f'letter-spacing:.26em;padding:9px 14px 8px 16px;border-radius:99px">{label}</span></div>')
    return out + star(880, 300, 44, p["acc"]) + star(150, 720, 28, p["acc"])


def v_manifesto(c, p):
    out = ""
    for txt, top, size, style in c["lines"]:
        out += (f'<div style="position:absolute;left:72px;right:72px;top:{top}px;z-index:20;font-family:\'Playfair Display\',serif;'
                f'font-size:{size}px;line-height:1;{style}">{txt}</div>')
    for (img, x, top, w, h) in c["strip"]:
        out += product(img, x, top, w, h)
    return out + star(880, 250, 50, p["acc"]) + star(820, 690, 26, p["acc"])


VARIANTS = dict(spotlight=v_spotlight, stacked=v_stacked, vertical=v_vertical, jharoka=v_jharoka,
                wide=v_wide, details=v_details, trio=v_trio, manifesto=v_manifesto)


def build(c):
    p = PAL[c["pal"]]
    vars_ = ";".join(f"--{k}:{v}" for k, v in p.items() if k != "gold")
    html = (f'<!doctype html><html><head><meta charset="utf-8"><title>{c["slug"]}</title>'
            f'<link rel="stylesheet" href="../fonts/fonts.css"><style>{CSS}</style></head><body>'
            f'<div class="p" style="{vars_};--gy:{c.get("gy","48%")}">' + common(c) + VARIANTS[c["variant"]](c, p)
            + (copy_block(c) if c.get("head") else "") + chip(c) + "</div>" + FIT_JS + "</body></html>")
    open(f"{OUT}/{c['slug']}.html", "w").write(html)


if __name__ == "__main__":
    only = sys.argv[3].split(",") if len(sys.argv) > 3 else None
    for c in json.load(open(f"{BUILD}/posters3.json")):
        if not only or any(c["slug"].startswith(o) for o in only):
            build(c)
            print("built", c["slug"])
