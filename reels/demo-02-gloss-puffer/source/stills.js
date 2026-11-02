const { chromium } = require('playwright');
(async () => {
  const times = process.argv.slice(3).map(Number), out = process.argv[2];
  const b = await chromium.launch({ args: ['--use-gl=angle', '--use-angle=swiftshader', '--enable-unsafe-swiftshader', '--ignore-gpu-blocklist'] });
  const p = await b.newPage({ viewport: { width: 1440, height: 2560 } });
  p.on('console', m => { if (m.type() === 'error') console.log('console:', m.text()); });
  p.on('pageerror', e => console.log('pageerror:', e.message));
  await p.goto('http://127.0.0.1:8765/' + (process.env.PAGE || 'index.html'));
  await p.waitForFunction(() => window.READY || window.ERR, null, { timeout: 120000 });
  const err = await p.evaluate(() => window.ERR); if (err) { console.log(err); process.exit(1); }
  for (const t of times) {
    const t0 = Date.now(); await p.evaluate(t => window.renderAt(t), t);
    await p.screenshot({ path: `${out}/still_${t.toFixed(2)}.png` });
    console.log('t', t, (Date.now() - t0) + 'ms');
  }
  await b.close();
})();
