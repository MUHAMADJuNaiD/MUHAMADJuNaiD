"""Build every bulk poster config from catalog.py, pick contrasting palettes, write HTML + captions.
Usage: python3 bulk.py <build_dir> <cutbulk_dir>
"""
import json, os, sys, colorsys
from PIL import Image

BUILD, CUTB = sys.argv[1], sys.argv[2]
sys.argv = [sys.argv[0], BUILD, CUTB]
sys.path.insert(0, os.path.dirname(__file__))
import gen3
from catalog import PRODUCTS, OUTFITS, ROW3, DUOS

gen3.OUT = f"{BUILD}/htmlbulk"
os.makedirs(gen3.OUT, exist_ok=True)

# extra palettes for bulk variety (same roles as gen3.PAL)
gen3.PAL.update({
    "lilac-plum":     dict(bg="#C9B6F2", bg2="#DCCEFA", word="#3D1A6E", ink="#24113F", btn="#3D1A6E", btnink="#F1EAFF", acc="#3D1A6E", shape="#B9A2EC"),
    "forest-pink":    dict(bg="#1E4D2B", bg2="#2B6A3B", word="#F7A8C4", ink="#FFF1E6", btn="#F7A8C4", btnink="#1E4D2B", acc="#F7A8C4", shape="#2B6A3B"),
    "sky-red":        dict(bg="#A9D3F5", bg2="#CBE5FA", word="#D2232A", ink="#0F2440", btn="#D2232A", btnink="#FFFFFF", acc="#D2232A", shape="#93C3EC"),
    "choc-peach":     dict(bg="#3B2218", bg2="#5A3426", word="#FFB58A", ink="#FCEBDD", btn="#FFB58A", btnink="#3B2218", acc="#FFB58A", shape="#5A3426"),
    "mint-burgundy":  dict(bg="#BFE6D3", bg2="#D9F2E5", word="#7A1230", ink="#1E2A24", btn="#7A1230", btnink="#FFF0F3", acc="#7A1230", shape="#A8DAC2"),
    "navy-butter":    dict(bg="#14213D", bg2="#22345E", word="#FFD66B", ink="#F6F1E3", btn="#FFD66B", btnink="#14213D", acc="#FFD66B", shape="#22345E"),
    "terracotta-cream": dict(bg="#B4472A", bg2="#C95E3E", word="#FCE8CF", ink="#FFF5EA", btn="#FCE8CF", btnink="#B4472A", acc="#FCE8CF", shape="#9C3A20"),
    "olive-orange":   dict(bg="#4E5A2E", bg2="#66753C", word="#FF9B4A", ink="#F7F1E1", btn="#FF9B4A", btnink="#2C3318", acc="#FF9B4A", shape="#66753C"),
    "fuchsia-lime":   dict(bg="#C2185B", bg2="#D63A75", word="#E6F56A", ink="#FFF0F5", btn="#E6F56A", btnink="#6A0B31", acc="#E6F56A", shape="#D63A75"),
    "sand-cobalt":    dict(bg="#E9DCC9", bg2="#F4ECE0", word="#2340C8", ink="#1C1A17", btn="#2340C8", btnink="#FFFFFF", acc="#2340C8", shape="#DDCCB4"),
})
POOL = [k for k in gen3.PAL if k not in ("cherry-brand",)]

FOLDER = dict(T="tops-winterwear", B="blouses-shirts", P="bottoms", C="coords-dresses", E="eastern",
              S="sunglasses", H="handbags")
CATNAME = dict(T="WINTERWEAR", B="BLOUSES", P="BOTTOMS", C="CO-ORDS", E="EID EDIT", S="SUNGLASSES", H="HANDBAGS")
VARIANT = dict(T="stacked", B="stacked", P="vertical", C="vertical", E="jharoka", S="wide", H="spotlight")
TAGS = dict(T="#winterwear #hoodies #knitwear", B="#blouses #shirtstyle #westernwear", P="#jeans #trousers #bottoms",
            C="#coordset #dresses #westernwear", E="#eidcollection #kurtaset #easternwear", S="#sunglasses #shades",
            H="#handbags #bags", O="#outfitideas #styleit #ootd", R="#newin #shopping", D="#thisorthat #ootd")
URDU = dict(T="Sardiyon ke liye perfect pick.", B="Har mauqe ke liye ek elegant choice.",
            P="Har top ke saath easily match ho jaye.", C="Poora look, ek hi set mein.",
            E="Eid aur dawaton ke liye ready.", S="Dhoop mein bhi style kam na ho.",
            H="Ye bag har outfit ko upgrade kar deta hai.", O="Ye poora look aap ka ho sakta hai.",
            R="Aap ka favourite kaunsa hai? Comment karein.", D="Comment mein apna pick batayein.")


def lum(c):
    def ch(v):
        v /= 255
        return v / 12.92 if v <= .03928 else ((v + .055) / 1.055) ** 2.4
    r, g, b = c
    return .2126 * ch(r) + .7152 * ch(g) + .0722 * ch(b)


def hexrgb(h):
    h = h.lstrip('#')
    return tuple(int(h[i:i + 2], 16) for i in (0, 2, 4))


def contrast(a, b):
    la, lb = lum(a), lum(b)
    return (max(la, lb) + .05) / (min(la, lb) + .05)


INFO = {}


def info(i):
    if i not in INFO:
        im = Image.open(f"{CUTB}/{i}.png")
        ar = im.width / im.height
        sm = im.copy(); sm.thumbnail((120, 120))
        px = [p[:3] for p in sm.getdata() if p[3] > 200]
        q = Image.new('RGB', (len(px), 1)); q.putdata(px)
        q = q.quantize(5)
        pal = q.getpalette()
        cnt = sorted(q.getcolors(), reverse=True)
        dom = tuple(pal[cnt[0][1] * 3: cnt[0][1] * 3 + 3])
        mean = tuple(sum(p[k] for p in px) // len(px) for k in range(3))
        INFO[i] = dict(ar=ar, dom=dom, mean=mean)
    return INFO[i]


USES, RECENT = {k: 0 for k in POOL}, []


def pick_palette(ids, prefer=None):
    best, bs = None, -99
    cols = [c for i in ids for c in (info(i)["dom"], info(i)["mean"])]
    for k in POOL:
        p = gen3.PAL[k]
        bg = hexrgb(p["bg"])
        cr = min(contrast(c, bg) for c in cols)
        if cr < 1.7:
            continue
        h1 = colorsys.rgb_to_hsv(*[v / 255 for v in bg])
        hues = [colorsys.rgb_to_hsv(*[v / 255 for v in c]) for c in cols]
        huediff = min(min(abs(h1[0] - h[0]), 1 - abs(h1[0] - h[0])) if h[1] > .25 else .5 for h in hues)
        s = min(cr, 4.5) + huediff * 1.5 - .9 * USES[k] - (4 if k in RECENT[-4:] else 0)
        if k == "black-gold":
            s -= 1.5
        if prefer and k in prefer:
            s += 1
        if s > bs:
            best, bs = k, s
    if best is None:
        best = max(POOL, key=lambda k: min(contrast(c, hexrgb(gen3.PAL[k]["bg"])) for c in cols))
    USES[best] += 1; RECENT.append(best)
    return best


def fit(ar, maxw, maxh):
    h = min(maxh, maxw / ar)
    return round(h * ar), round(h)


def box_for(variant, i):
    ar = info(i)["ar"]
    if variant == "stacked":
        w, h = fit(ar, 720, 750); return [540 - w // 2, 985 - h, w, h], [w * .75, 985 - 18]
    if variant == "vertical":
        w, h = fit(ar, 500, 805); return [705 - w // 2, 985 - h, w, h], [w * .8, 985 - 16]
    if variant == "jharoka":
        w, h = fit(ar, 560, 735); return [540 - w // 2, 985 - h, w, h], [w * .75, 985 - 18]
    if variant == "spotlight":
        w, h = fit(ar, 700, 660); return [540 - w // 2, 980 - h, w, h], [w * .75, 980 - 20]
    if variant == "wide":
        w, h = fit(ar, 940, 380); return [540 - w // 2, 650 - h // 2, w, h], None


def hexs(c):
    return '#%02X%02X%02X' % c


posters, captions = [], []


def caption(c, code, plain_head):
    return (f"{plain_head} ✨\n{c.get('desc','')} {URDU[code]}\n"
            f"DM to order 📩 Delivery all over Pakistan.\n#outlookstyles #pakistanfashion #lahorefashion {TAGS[code]}")


def plain(h):
    import re, html
    return html.unescape(re.sub('<[^>]+>', '', h))


# ---------------- singles
for (i, code, kicker, word, head, desc, colname) in PRODUCTS:
    v = VARIANT[code]
    bx, sh = box_for(v, i)
    c = dict(slug=f"{FOLDER[code]}/{i:03d}-{word.lower().replace(' ','-')}", variant=v, pal=pick_palette([i]),
             cat=CATNAME[code] if code != "T" else ("SWEATSHIRTS" if any(k in kicker for k in ("HOODIE", "SWEATSHIRT", "ZIP")) else "KNITWEAR" if any(k in kicker for k in ("KNIT", "CARDIGAN", "VEST", "SWEATER", "POLO", "NECK")) else "WINTERWEAR"),
             img=str(i), word=word, box=bx, kicker=kicker, head=head, desc=desc, chip=[colname, hexs(info(i)["dom"])])
    if code == "P" and kicker.endswith(("PLEATS",)):
        c["cat"] = "SKIRTS"
    if code == "C" and any(k in kicker for k in ("DRESS", "MAXI", "WRAP", "JUMPSUIT")):
        c["cat"] = "DRESSES"
    if sh:
        c["shadow"] = sh
    if v == "vertical":
        c["vtag"] = kicker.replace("THE ", "")
    if v == "jharoka":
        c.update(archtop=322, archh=668)
    if v == "wide":
        c.update(dr=300, disctop=350)
    posters.append(c); captions.append((c["slug"], caption(c, code, plain(head))))

# ---------------- outfits
for k, (t, tl, b, bl, word, head, desc) in enumerate(OUTFITS):
    tw, th = fit(info(t)["ar"], 470, 520)
    bw, bh = fit(info(b)["ar"], 400, 750)
    tbox = [300 - tw // 2, 330 + (520 - th) // 2, tw, th]
    bbox = [770 - bw // 2, 985 - bh, bw, bh]
    c = dict(slug=f"outfits/style-it-{k+1:02d}-{word.lower()}", variant="outfit", pal=pick_palette([t, b]), cat="STYLE IT",
             left="THE LOOK", word=word, timg=str(t), bimg=str(b), tbox=tbox, bbox=bbox, tlabel=tl, blabel=bl,
             plusx=(tbox[0] + tw + bbox[0]) // 2, plusy=620, kicker="STYLE IT", head=head, desc=desc)
    posters.append(c); captions.append((c["slug"], caption(c, "O", plain(head))))

# ---------------- three of a kind
for (slug, ids, labels, word, kicker, head, desc) in ROW3:
    items = []
    glasses = all(info(i)["ar"] > 1.8 for i in ids)
    for i, cx in zip(ids, (210, 540, 870)):
        w, h = fit(info(i)["ar"], 300, 120 if glasses else 560)
        items.append([str(i), cx - w // 2, 905 - h, w, h])
    c = dict(slug=f"edits/{slug}", variant="row3", pal=pick_palette(ids), cat="THE EDIT", left="THE EDIT", word=word,
             items=items, labels=labels, kicker=kicker, head=head, desc=desc)
    if glasses:  # stack sunglasses vertically instead of a cramped row
        c["variant"] = "trio"
        c["items"] = [[str(i), x, y, 640, round(640 / info(i)["ar"]), lab, lx, ly, al] for i, lab, (x, y, lx, ly, al) in
                      zip(ids, labels, [(70, 300, 770, 380, "left"), (370, 530, 72, 600, "right"), (100, 750, 770, 830, "left")])]
    posters.append(c); captions.append((c["slug"], caption(c, "R", plain(head))))

# ---------------- this or that
for (slug, a, al, b, bl, kicker, head, desc) in DUOS:
    items = []
    for i, cx in ((a, 290), (b, 790)):
        w, h = fit(info(i)["ar"], 430, 600)
        items.append([str(i), cx - w // 2, 905 - h, w, h])
    if all(info(i)["ar"] > 1.8 for i in (a, b)):  # sunglasses: stack big, one above the other
        items = []
        for i, top in ((a, 330), (b, 640)):
            w, h = fit(info(i)["ar"], 760, 250)
            items.append([str(i), 1008 - w, top, w, h])
    c = dict(slug=f"edits/{slug}", variant="duo", pal=pick_palette([a, b]), cat="THIS OR THAT", left="YOUR PICK",
             word="THIS OR THAT", items=items, labels=[al, bl], kicker=kicker, head=head, desc=desc)
    if all(info(i)["ar"] > 1.8 for i in (a, b)):
        c.update(stack=True, orx=200, ory=600)
    posters.append(c); captions.append((c["slug"], caption(c, "D", plain(head))))

# ---------------- brand: how to order
posters.append(dict(slug="brand/how-to-order", variant="manifesto", pal="navy-butter", cat="HOW TO ORDER", left="EASY AS",
    lines=[["Ordering is", 225, 124, "font-style:italic;font-weight:600"],
           ["easy.", 352, 250, "font-weight:900;color:var(--word);letter-spacing:-.02em"],
           ["&rarr;&nbsp; SEND US A DM ON INSTAGRAM", 640, 25, "font-family:Montserrat;font-weight:800;letter-spacing:.12em"],
           ["&rarr;&nbsp; CONFIRM YOUR SIZE &amp; ADDRESS", 692, 25, "font-family:Montserrat;font-weight:800;letter-spacing:.12em"],
           ["&rarr;&nbsp; DELIVERED TO YOUR DOOR", 744, 25, "font-family:Montserrat;font-weight:800;letter-spacing:.12em;color:var(--word)"]],
    strip=[["210", 72, 865, 160, 150], ["116", 255, 845, 180, 170], ["264", 455, 950, 190, 65], ["7", 670, 840, 160, 175], ["206", 858, 850, 150, 165]]))
captions.append(("brand/how-to-order", "Order karna bohat easy hai ✨\n1) Humein Instagram pe DM karein 2) Size aur address confirm karein 3) Order aap ke ghar tak.\nDelivery all over Pakistan.\n#outlookstyles #pakistanfashion #lahorefashion"))

# ---------------- demo posters (already tuned), re-rendered with enhanced photos
demo_folder = {"01": "handbags", "02": "handbags", "03": "tops-winterwear", "04": "tops-winterwear", "05": "tops-winterwear",
               "06": "blouses-shirts", "07": "bottoms", "08": "bottoms", "09": "coords-dresses", "10": "eastern",
               "11": "sunglasses", "12": "edits", "13": "flats-jewellery", "14": "flats-jewellery", "15": "brand"}
for c in json.load(open(f"{BUILD}/posters3.json")):
    c = dict(c); c["slug"] = f"{demo_folder[c['slug'][:2]]}/{c['slug'][3:]}"
    posters.append(c)
    code = {"handbags": "H", "tops-winterwear": "T", "blouses-shirts": "B", "bottoms": "P", "coords-dresses": "C",
            "eastern": "E", "sunglasses": "S", "edits": "R", "flats-jewellery": "R"}.get(c["slug"].split("/")[0])
    if code:
        captions.append((c["slug"], caption(c, code, plain(c["head"]))))
    else:
        captions.append((c["slug"], "Style that speaks before you do ✨\nOutlook Styles: women's western wear, handbags, shades and flats.\nDelivery all over Pakistan.\n#outlookstyles #pakistanfashion #lahorefashion"))

for c in posters:
    os.makedirs(os.path.dirname(f"{gen3.OUT}/{c['slug']}.html"), exist_ok=True)
    gen3.build(c)
json.dump(posters, open(f"{BUILD}/posters_bulk.json", "w"), indent=1)
json.dump(captions, open(f"{BUILD}/captions_bulk.json", "w"), indent=1, ensure_ascii=False)
print("posters", len(posters), "palette uses", sorted(USES.items(), key=lambda x: -x[1]))
