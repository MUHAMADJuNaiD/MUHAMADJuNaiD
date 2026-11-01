const { chromium } = require('playwright');
const fs = require('fs'), path = require('path');
(async () => {
  const [htmlDir, outDir, only] = process.argv.slice(2);
  const b = await chromium.launch({ args: ['--allow-file-access-from-files'] });
  const pg = await b.newPage({ viewport: { width: 1080, height: 1350 } });
  for (const f of fs.readdirSync(htmlDir).filter(f => f.endsWith('.html')).sort()) {
    if (only && !only.split(',').some(o => f.startsWith(o))) continue;
    await pg.goto('file://' + path.resolve(htmlDir, f));
    await pg.waitForFunction(() => document.body.dataset.ready === '1');
    await pg.waitForTimeout(150);
    await pg.screenshot({ path: path.join(outDir, f.replace('.html', '.png')) });
    console.log('rendered', f);
  }
  await b.close();
})();
