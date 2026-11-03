// Render listing images: node render.js [ids,comma | all] [outDir]
// Needs reel-kit/node_modules (playwright). Writes <out>/<id>-<slug>/01-main.jpg 02-poster.jpg 03-details.jpg 04-info.jpg
const http = require('http'), fs = require('fs'), path = require('path');
const { chromium } = require('../../reel-kit/node_modules/playwright');
const ROOT = path.resolve(__dirname, '..', '..');
const MIME = { '.html': 'text/html', '.js': 'text/javascript', '.css': 'text/css', '.webp': 'image/webp', '.woff2': 'font/woff2', '.ttf': 'font/ttf' };
const MODES = [['main', '01-main'], ['poster', '02-poster'], ['detail', '03-details'], ['info', '04-info']];
(async () => {
  const [which = 'all', out = path.join(__dirname, '..', 'out')] = process.argv.slice(2);
  let jobs = JSON.parse(fs.readFileSync(path.join(__dirname, 'jobs.json')));
  if (which !== 'all') { const ids = which.split(','); jobs = jobs.filter(j => ids.includes(j.id)); }
  const srv = http.createServer((q, s) => { const f = path.join(ROOT, decodeURIComponent(q.url.split('?')[0]));
    if (!f.startsWith(ROOT) || !fs.existsSync(f) || fs.statSync(f).isDirectory()) { s.writeHead(404); return s.end(); }
    s.writeHead(200, { 'Content-Type': MIME[path.extname(f)] || 'application/octet-stream' }); fs.createReadStream(f).pipe(s); }).listen(0, '127.0.0.1');
  await new Promise(r => srv.once('listening', r));
  const browser = await chromium.launch(process.env.CHROME_PATH ? { executablePath: process.env.CHROME_PATH } : {});
  const page = await browser.newPage({ viewport: { width: 2048, height: 2048 } });
  page.on('pageerror', e => console.log('pageerror', e.message));
  for (const j of jobs) {
    const dir = path.join(out, `${j.id.padStart(3, '0')}-${j.slug}`); fs.mkdirSync(dir, { recursive: true });
    for (const [mode, name] of MODES) {
      await page.addInitScript(x => { window.JOB = x; }, j);
      await page.goto(`http://127.0.0.1:${srv.address().port}/listings/kit/listing.html?mode=${mode}`);
      await page.waitForFunction(() => window.READY, null, { timeout: 60000 });
      await page.screenshot({ path: path.join(dir, name + '.jpg'), type: 'jpeg', quality: 90 });
    }
    console.log('done', dir);
  }
  await browser.close(); srv.close();
})().catch(e => { console.error(e); process.exit(1); });
