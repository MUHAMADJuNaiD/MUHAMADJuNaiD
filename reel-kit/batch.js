// Outlook Styles reel kit: render every reel in a list with ONE command.
//   node batch.js reels.json out          (CPU / any machine)
//   GPU=1 node batch.js reels.json out    (faster on a PC with a graphics card)
// Needs: Node 18+, ffmpeg on PATH, `npm install` and `npx playwright install chromium`.
const http = require('http'), fs = require('fs'), path = require('path');
const { spawn } = require('child_process');
const { chromium } = require('playwright');
const { addAudio } = require('./addaudio');
const ROOT = __dirname;
const MIME = { '.html': 'text/html', '.js': 'text/javascript', '.css': 'text/css', '.json': 'application/json', '.png': 'image/png',
  '.webp': 'image/webp', '.ttf': 'font/ttf', '.woff2': 'font/woff2' };
const data = JSON.parse(fs.readFileSync(path.join(ROOT, 'data/products.json')));
const PAL = JSON.parse(fs.readFileSync(path.join(ROOT, 'data/palettes.json')));
const BRAND = fs.existsSync(path.join(ROOT, 'data/brand.json')) ? JSON.parse(fs.readFileSync(path.join(ROOT, 'data/brand.json'))) : {};
const byId = Object.fromEntries(data.products.map(p => [p.id, p]));

// Variety for the v4 story engine: deterministic per product (same product -> same story on re-runs)
function hash(str) { let h = 2166136261; for (const c of str) { h ^= c.charCodeAt(0); h = Math.imul(h, 16777619); }
  h ^= h >>> 16; h = Math.imul(h, 0x85ebca6b); h ^= h >>> 13; h = Math.imul(h, 0xc2b2ae35); h ^= h >>> 16; return h >>> 0; }
function variety(r) {
  const H = k => hash(String(r.product) + '|' + k + '|' + (r.seed || ''));
  const S = ['drop', 'unbox', 'season', 'colour', 'runway'], RV = ['drop', 'twirl', 'slices', 'dissolve', 'curtain'], TR = ['wipe', 'iris', 'bars'];
  const story = r.story || S[H('story') % 5];
  return { story, reveal: r.reveal || ({ unbox: 'rise', colour: 'portal', runway: 'slide' }[story] || RV[H('reveal') % 5]),
    detail: ['lens', 'card'][H('detail') % 2], trans: [TR[H('t1') % 3], TR[H('t2') % 3]], camSign: H('cam') % 2 ? 1 : -1,
    text: ['pop', 'slide', 'type'][H('text') % 3], seed: H('seed') % 997 };
}
// Turn a short reel entry into the full template config (product data + palette are filled in automatically)
function buildCfg(r) {
  const p = byId[String(r.product)]; if (!p) throw new Error('unknown product ' + r.product);
  const pal = PAL[r.palette || p.palette];
  return Object.assign({
    img: p.img, h: 2.12, float: true, dur: ['hero2', 'hero3', 'hero4'].includes(r.template) ? 14 : 16, folder: p.folder, brand: BRAND, details: p.details || [],
    pal: { bg: pal.bg, bg2: pal.bg2, word: pal.word, ink: pal.ink, pod: pal.word, btnink: pal.btnink },
    cat: p.cat, word: p.word, hookLine: '', kick: p.kicker, head: p.head, desc: p.desc,
    chip: p.chip || ['', pal.word], calls: [], comment: p.word,
  }, r.template === 'hero4' ? variety(r) : {}, r.override || {}, r.calls ? { calls: r.calls } : {}, r.hookLine ? { hookLine: r.hookLine } : {});
}

async function main() {
  const [list = 'reels.json', outDir = 'out'] = process.argv.slice(2);
  const reels = JSON.parse(fs.readFileSync(path.resolve(list)));
  fs.mkdirSync(outDir, { recursive: true });
  const server = http.createServer((q, s) => {
    const f = path.join(ROOT, decodeURIComponent(q.url.split('?')[0]));
    if (!f.startsWith(ROOT) || !fs.existsSync(f) || fs.statSync(f).isDirectory()) { s.writeHead(404); return s.end(); }
    s.writeHead(200, { 'Content-Type': MIME[path.extname(f)] || 'application/octet-stream' }); fs.createReadStream(f).pipe(s);
  }).listen(0, '127.0.0.1');
  await new Promise(r => server.once('listening', r));
  const port = server.address().port;
  const args = process.env.GPU ? [] : ['--use-gl=angle', '--use-angle=swiftshader', '--enable-unsafe-swiftshader', '--ignore-gpu-blocklist'];
  const browser = await chromium.launch({ args, ...(process.env.CHROME_PATH ? { executablePath: process.env.CHROME_PATH } : {}) });
  for (const r of reels) {
    const cfg = buildCfg(r), fps = 30, N = Math.round(fps * cfg.dur);
    const out = path.join(outDir, (r.name || `reel-${r.product}`) + '.mp4');
    // resume: skip reels that are already finished (the cover is written last)
    if (fs.existsSync(out) && fs.existsSync(out.replace('.mp4', '-cover.jpg'))) { console.log('skip (already done) ' + out); continue; }
    const page = await browser.newPage({ viewport: ['hero3', 'hero4'].includes(r.template) ? { width: 1728, height: 2160 } : { width: 1440, height: 2560 } });
    await page.addInitScript(c => { window.REEL_CFG = c; }, cfg);
    page.on('pageerror', e => console.log('pageerror:', e.message));
    await page.goto(`http://127.0.0.1:${port}/${r.template || 'hero'}.html`);
    await page.waitForFunction(() => window.READY || window.ERR, null, { timeout: 180000 });
    const err = await page.evaluate(() => window.ERR); if (err) { console.log('ERROR', r.name, err); await page.close(); continue; }
    const ff = spawn('ffmpeg', ['-y', '-loglevel', 'error', '-f', 'image2pipe', '-framerate', String(fps), '-i', '-',
      '-c:v', 'libx264', '-preset', 'slow', '-crf', '12', '-pix_fmt', 'yuv420p', '-profile:v', 'high', '-level', '5.1',
      '-x264-params', 'aq-mode=3', '-movflags', '+faststart', out], { stdio: ['pipe', 'inherit', 'inherit'] });
    const t0 = Date.now();
    for (let f = 0; f < N; f++) {
      await page.evaluate(t => window.renderAt(t), f / fps);
      const buf = await page.screenshot({ type: 'png' });
      if (!ff.stdin.write(buf)) await new Promise(res => ff.stdin.once('drain', res));
    }
    ff.stdin.end(); await new Promise(res => ff.on('close', res));
    try { await addAudio(out, r, cfg, byId[String(r.product)]); } catch (e) { console.log('   sound skipped:', e.message); }
    // cover image from the middle of the reel
    await page.evaluate(t => window.renderAt(t), cfg.coverAt != null ? cfg.coverAt : cfg.dur * .72);
    await page.screenshot({ path: out.replace('.mp4', '-cover.jpg'), type: 'jpeg', quality: 95 });
    await page.close();
    if (cfg.story) console.log(`   story: ${cfg.story} | reveal: ${cfg.reveal} | details: ${cfg.detail}`);
    console.log(`done ${out}  (${((Date.now() - t0) / 1000).toFixed(0)} s)`);
  }
  await browser.close(); server.close();
}
module.exports = { buildCfg };
if (require.main === module) main().catch(e => { console.error(e); process.exit(1); });
