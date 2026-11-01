// Render the reel frame by frame and pipe PNG frames into ffmpeg (H.264, 30 fps).
const { chromium } = require('playwright');
const { spawn } = require('child_process');
(async () => {
  const [out, fps = 30, dur = 18] = [process.argv[2], +(process.argv[3] || 30), +(process.argv[4] || 18)];
  const ff = spawn('ffmpeg', ['-y', '-f', 'image2pipe', '-framerate', String(fps), '-i', '-',
    '-c:v', 'libx264', '-preset', 'slow', '-crf', '14', '-pix_fmt', 'yuv420p', '-profile:v', 'high', '-level', '5.1',
    '-x264-params', 'aq-mode=3', '-movflags', '+faststart', '-r', String(fps), out], { stdio: ['pipe', 'ignore', 'inherit'] });
  const b = await chromium.launch({ args: ['--use-gl=angle', '--use-angle=swiftshader', '--enable-unsafe-swiftshader', '--ignore-gpu-blocklist'] });
  const p = await b.newPage({ viewport: { width: 1440, height: 2560 } });
  p.on('pageerror', e => console.log('pageerror:', e.message));
  await p.goto('http://127.0.0.1:8765/index.html');
  await p.waitForFunction(() => window.READY || window.ERR, null, { timeout: 120000 });
  const N = Math.round(fps * dur), t0 = Date.now();
  for (let f = 0; f < N; f++) {
    await p.evaluate(t => window.renderAt(t), f / fps);
    const buf = await p.screenshot({ type: 'png' });
    if (!ff.stdin.write(buf)) await new Promise(r => ff.stdin.once('drain', r));
    if (f % 30 === 0) console.log(`frame ${f}/${N}  ${((Date.now() - t0) / 1000).toFixed(0)}s`);
  }
  ff.stdin.end(); await new Promise(r => ff.on('close', r)); await b.close(); console.log('done', out);
})();
