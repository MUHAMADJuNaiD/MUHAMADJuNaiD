// Collects finished reels into FINAL-REELS/ with a ready Instagram caption for each.
// Copies (does not move) so the "skip already done" resume keeps working.
//   node collect.js [out] [FINAL-REELS]
const fs = require('fs'), path = require('path');
const ROOT = __dirname;
const [src = 'out', dst = 'FINAL-REELS'] = process.argv.slice(2).map(p => path.resolve(ROOT, p));
const prods = JSON.parse(fs.readFileSync(path.join(ROOT, 'data/products.json'))).products;
const brand = fs.existsSync(path.join(ROOT, 'data/brand.json')) ? JSON.parse(fs.readFileSync(path.join(ROOT, 'data/brand.json'))) : {};
const list = fs.existsSync(path.join(ROOT, 'reels.json')) ? JSON.parse(fs.readFileSync(path.join(ROOT, 'reels.json'))) : [];
const byName = Object.fromEntries(list.map(r => [r.name || `reel-${r.product}`, r]));
const byId = Object.fromEntries(prods.map(p => [p.id, p]));

const URDU = {
  'tops-winterwear': 'Sardiyon ke liye perfect pick - warm bhi, stylish bhi.',
  'blouses-shirts': 'Office ho ya dinner, har mauqe ke liye ek elegant choice.',
  'bottoms': 'Har top ke saath easily match ho jaye - comfort aur style dono.',
  'coords-dresses': 'Poora look, ek hi set mein - bas pehno aur nikal jao.',
  'eastern': 'Eid aur dawaton ke liye bilkul ready.',
  'handbags': 'Ye bag har outfit ko upgrade kar deta hai.',
  'sunglasses': 'Dhoop mein bhi style kam na ho.',
  'flats-jewellery': 'Chhoti si detail, bada sa farq.',
};
const TAGS = {
  'tops-winterwear': '#winterwear #hoodies #knitwear #winterfashion', 'blouses-shirts': '#blouses #shirtstyle #westernwear #officewear',
  'bottoms': '#jeans #trousers #denim #ootd', 'coords-dresses': '#coordset #dresses #westernwear #ootd',
  'eastern': '#eidcollection #kurtaset #easternwear #eidoutfit', 'handbags': '#handbags #bags #bagsoftheday',
  'sunglasses': '#sunglasses #shades #eyewear', 'flats-jewellery': '#flats #jewellery #accessories',
};
const plain = s => (s || '').replace(/<[^>]+>/g, '').replace(/&amp;/g, '&').replace(/&[a-z]+;/g, '').trim();

function caption(p) {
  const site = (brand.website || '').replace(/^https?:\/\//, '');
  return [
    `${plain(p.head)} ✨`,
    `${plain(p.desc)}`,
    `${URDU[p.folder] || 'Naya collection ab available hai.'}`,
    ``,
    `🛍️ Order: DM karein${site ? ` ya ${site} pe shop karein` : ''}`,
    `🚚 Delivery all over Pakistan`,
    brand.address ? `📍 ${brand.address}` : '',
    ``,
    `💬 Comment "${(p.word || '').toUpperCase()}" for details`,
    ``,
    `#outlookstyles #pakistanfashion #lahorefashion #bahriatownlahore ${TAGS[p.folder] || ''} #newin #reels`,
  ].filter((l, i, a) => !(l === '' && a[i - 1] === '')).join('\n').trim();
}

if (!fs.existsSync(src)) { console.log('"out" folder nahi mila - pehle reels banayein.'); process.exit(0); }
fs.mkdirSync(path.join(dst, 'covers'), { recursive: true });
const all = [];
let n = 0, skipped = 0;
for (const f of fs.readdirSync(src).filter(f => f.endsWith('.mp4') && !f.endsWith('-sfx-only.mp4') && !f.endsWith('-silent.mp4')).sort()) {
  const name = f.replace(/\.mp4$/, ''), cover = path.join(src, name + '-cover.jpg');
  if (!fs.existsSync(cover)) { skipped++; continue; }           // still rendering / unfinished
  const r = byName[name], m = name.match(/-(\d{3})-/), id = r ? String(r.product) : m ? String(+m[1]) : null, p = byId[id];
  const out = path.join(dst, f);
  if (!fs.existsSync(out) || fs.statSync(out).size !== fs.statSync(path.join(src, f)).size) fs.copyFileSync(path.join(src, f), out);
  fs.copyFileSync(cover, path.join(dst, 'covers', name + '-cover.jpg'));
  const cap = p ? caption(p) : `New in at Outlook Styles ✨\nDM to order 🛍️ Delivery all over Pakistan\n#outlookstyles #pakistanfashion #lahorefashion`;
  fs.writeFileSync(path.join(dst, name + '.txt'), cap + '\n');
  all.push(`==================== ${name} ====================\n${cap}\n`);
  n++;
}
fs.writeFileSync(path.join(dst, 'ALL-CAPTIONS.txt'), all.join('\n'));
console.log(`\n${n} final reels "FINAL-REELS" folder mein (caption ke saath).` + (skipped ? `  ${skipped} abhi adhuri thin - skip.` : ''));
