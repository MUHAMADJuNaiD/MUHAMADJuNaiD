const { chromium } = require('playwright');
const fs = require('fs'), path = require('path');
function walk(d){return fs.readdirSync(d,{withFileTypes:true}).flatMap(e=>e.isDirectory()?walk(path.join(d,e.name)):e.name.endsWith('.html')?[path.join(d,e.name)]:[]);}
(async () => {
  const [htmlDir, outDir, only] = process.argv.slice(2);
  const b = await chromium.launch({ args: ['--allow-file-access-from-files'] });
  const pg = await b.newPage({ viewport: { width: 1080, height: 1350 } });
  let n=0;
  for (const f of walk(htmlDir).sort()) {
    const rel = path.relative(htmlDir, f);
    if (only && !only.split(',').some(o => rel.includes(o))) continue;
    const out = path.join(outDir, rel.replace('.html', '.png'));
    fs.mkdirSync(path.dirname(out), { recursive: true });
    await pg.goto('file://' + path.resolve(f));
    await pg.waitForFunction(() => document.body.dataset.ready === '1');
    await pg.waitForTimeout(80);
    await pg.screenshot({ path: out }); n++;
  }
  console.log('rendered', n);
  await b.close();
})();
