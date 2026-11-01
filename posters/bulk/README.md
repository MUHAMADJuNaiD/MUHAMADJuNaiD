# Outlook Styles – Bulk posters ("Colour Pop" theme)

181 Instagram posters, 4:5, **2160 × 2700 px (2K+)**, JPG quality 95 with full 4:4:4 colour and 300 dpi (about 1–2 MB each). See `before-after.jpg` for the quality jump. Every poster follows the approved v3 "Colour Pop" theme. Only products with a clean cut-out are used.

| Folder | Posters | What's inside |
| --- | --- | --- |
| `tops-winterwear/` | 53 | Hoodies, sweatshirts, knits, cardigans, jackets, puffers |
| `bottoms/` | 39 | Jeans, trousers, joggers, cargos, pleated skirts |
| `blouses-shirts/` | 25 | Blouses, shirts, tops |
| `coords-dresses/` | 17 | Co-ord sets, tracksuits, dresses, jumpsuit |
| `outfits/` | 16 | **Style It**: one top + one bottom paired into a full look |
| `edits/` | 10 | **Pick Your Hoodie / Jeans 3 Ways / Puffer Season / Knit Picks / Mini Bags / Pick Your Frame / Shades Season**, plus 3 **This or That** polls |
| `handbags/` | 6 | Clean bags only |
| `sunglasses/` | 6 | Frames with no brand text on the lenses |
| `eastern/` | 5 | Eid / kurta sets (jharoka arch) |
| `brand/` | 2 | Manifesto + How to Order |
| `flats-jewellery/` | 2 | Flats + star locket (callout style) |

- `captions.md` / `captions.csv` – a ready caption for every poster (Roman Urdu + English, hashtags, no price)
- `overview/` – contact sheets of every poster for quick review
- `source/` – generator and catalog (`catalog.py` holds all the copy, `bulk.py` picks the colours and layouts)

## HD upgrade (v2 of bulk)

- **Render:** every poster is rendered at 2× (2160 × 2700) so text, shapes and photos stay sharp on any phone.
- **Product photos:** AI upscaled with Real-ESRGAN (realesr-general-x4v3, run locally through ONNX). Then 35% of the AI result is blended with 65% of a sharpened Lanczos upscale. The AI gives clean edges, prints and stitching, and the blend keeps the real knit and leather texture so nothing looks plastic.
- **Depth:**
  - key light behind the product, a studio floor sweep and a soft vignette
  - 3D arches, panels and discs with a gradient, highlight edge, inner shade and drop shadow
  - three-layer product shadows plus a double contact shadow
  - lifted big word and headline, and raised button and colour chip

## What was done to the photos

- Background removed, then edges cleaned so no grey halo is left
- Small photos upscaled, with a light lift in contrast and colour, and sharpened
- Mannequin neck replaced on the leather jacket. Brand script painted out on the gold aviator lens
- Handle gaps on bags made transparent

## Colour logic

For every product the main colour is measured. The background is chosen from 24 palettes so that it contrasts strongly with the product, and is never the same colour family. A palette is never used on two posters in a row. The big word, headline highlight and button always use that palette's contrasting pop colour.

## Left out on purpose

- Bags with plastic wrap, tags, boxes or big monograms
- Sunglasses with brand names printed on the lens, a sticker, or a branded box (Cartier, Prada, Versace, LV)
- Clothing with big third-party brand or licensed prints (Esprit, CK, Jack Wills, Stranger Things, Minnie, Abercrombie), stripes lost in the cut-out, low-resolution photos, and visible hang-tags

## Suggested posting rhythm

5 posts a week (Mon, Wed, Thu, Sat, Sun, 8–10 pm PKT): 2 single products + 1 Style It outfit + 1 Edit / This or That + 1 product from a different category. Mix a dark, a medium and a light background in each grid row.
