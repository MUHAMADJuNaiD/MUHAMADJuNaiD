# Outlook Styles – Product listing images

98 products × 4 images = 392 images. Every image is **2048 × 2048 (1:1)** JPG, the size Shopify recommends.

| File | What it is |
| --- | --- |
| `01-main.jpg` | Clean main image: product on a white background with a soft shadow, no text (marketplace standard) |
| `02-poster.jpg` | Square "Colour Pop" poster in the product's approved palette |
| `03-details.jpg` | Close-ups taken straight from the HD photo (max 1.12× zoom, so they stay sharp) |
| `04-info.jpg` | Info card: name, description, colour chip, category, highlights, DM TO ORDER, delivery line |

- `out/<id>-<name>/`: the images, one folder per product (the id matches `reel-kit/data/products.json` and the poster file names)
- `overview/`: contact sheets of every image type for a quick review
- `kit/`: the generator. `select.json` holds the chosen products, `prep.py` finds the detail crops, `listing.html` is the design, and `render.js` renders everything:
  `python3 kit/prep.py && node kit/render.js all out`

**Why 98 of 153:** each HD photo was checked at full size. Products were left out for soft or blurry photos, visible hangers or mannequin stands, brand logos or brand text, or a back-view-only photo.
