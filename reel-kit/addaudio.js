// Adds background music + animation-synced sound effects to a rendered reel.
// Makes two files:  name.mp4 (music + SFX)  and  name-sfx-only.mp4 (for adding Instagram trending audio).
const fs = require('fs'), path = require('path');
const { spawn } = require('child_process');
const ROOT = __dirname, AUD = path.join(ROOT, 'audio');
function hash(str) { let h = 2166136261; for (const c of str) { h ^= c.charCodeAt(0); h = Math.imul(h, 16777619); }
  h ^= h >>> 16; h = Math.imul(h, 0x85ebca6b); h ^= h >>> 13; h = Math.imul(h, 0xc2b2ae35); h ^= h >>> 16; return h >>> 0; }
const SFX = fs.existsSync(path.join(AUD, 'sfx')) ? fs.readdirSync(path.join(AUD, 'sfx')).filter(f => f.endsWith('.wav')) : [];
const variants = base => SFX.filter(f => f === base + '.wav' || f.startsWith(base + '--v'));
// choose one sound per slot: alternatives + variants, seeded by the product, no sound repeated inside one reel
function resolve(cues, salt) {
  const used = new Set();
  return cues.map(([at, names, v], i) => {
    const alts = (Array.isArray(names) ? names : [names]).filter(n => variants(n).length);
    const free = alts.filter(n => !used.has(n) || n === 'camera-shutter'); const pool = free.length ? free : alts; if (!pool.length) return null;
    const base = pool[hash(salt + '|' + i) % pool.length]; used.add(base);
    const vs = variants(base); return [at, vs[hash(salt + '|v' + i) % vs.length].replace(/\.wav$/, ''), v];
  }).filter(Boolean);
}

// Cue sheets: [seconds, sound, volume]. Times match each template's timeline.
const CUES = {
  hero: [[0, 'riser', .5], [1.42, 'boom-slam', 1], [2.8, 'whoosh', .8], [3.35, 'pop', .9], [4.55, 'shimmer', .7],
    [6.6, 'whoosh', .6], [6.95, 'click', .8], [7.7, 'click', .8], [8.45, 'click', .8], [9.2, 'click', .8],
    [10.6, 'whoosh', .6], [10.8, 'chime', .6], [11.0, 'pop', .7], [13.0, 'swoosh-reverse', .7], [13.75, 'pop', .9], [14.2, 'chime', .5]],
  // v4: per-story cue sheets. Every slot has alternatives; each reel picks its own (never the same sound twice in one reel).
  hero4: (calls, cfg) => {
    const TL = { drop: [1.4, 1.0, 4.4, 8.0, 10.4], unbox: [1.95, 1.0, 4.5, 8.1, 10.4], season: [1.8, 1.1, 4.4, 8.0, 10.4],
      colour: [2.2, 1.1, 4.7, 8.3, 10.5], runway: [1.5, 1.1, 4.4, 8.0, 10.4] }[cfg.story || 'drop'];
    const [rv, rd, lens, , shop] = TL, re = rv + rd, colour = lens + 3.6, winter = cfg.folder === 'tops-winterwear';
    const intro = {
      drop:   [[0, ['riser', 'bass-hit'], .13], [re - .25, ['shimmer', 'sparkle-sweep'], .2], [re + .05, ['boom-slam', 'bass-hit'], .18]],
      unbox:  [[.05, ['whoosh-long', 'whoosh'], .13], [.98, ['pop', 'bass-hit'], .22], [1.2, ['paper-rustle'], .2], [1.78, ['sparkle-sweep', 'shimmer'], .2]],
      season: [[0, winter ? ['wind'] : ['riser', 'sparkle-sweep'], .16], [.4, ['chime', 'bell-hit'], .12], [rv + .1, ['shimmer', 'sparkle-sweep'], .2]],
      colour: [[.1, ['whoosh-long', 'riser'], .13], [1.9, ['pluck-up', 'pop'], .2], [2.3, ['shimmer', 'sparkle-sweep'], .2]],
      runway: [[0, ['riser', 'bass-hit'], .12], [.35, ['camera-shutter'], .2], [.8, ['camera-shutter'], .14], [1.22, ['camera-shutter'], .17], [re - .05, ['boom-slam', 'bass-hit'], .16]],
    }[cfg.story || 'drop'];
    const tail = [[lens - .1, ['whoosh', 'swoosh-reverse', 'snap'], .16], [colour + .5, ['chime', 'bell-hit', 'pluck-up', 'sparkle-sweep'], .15],
      [shop - .1, ['swoosh-reverse', 'whoosh-long', 'whoosh'], .17], [shop + .75, ['click', 'pop', 'snap'], .22]];
    return intro.concat(tail);
  },
  // v3: few, different sounds - each used once, only on story beats
  hero3: (calls) => {
    const lens = 4.3, c = [[0, 'riser', .14], [1.5, 'shimmer', .22], [2.15, 'boom-slam', .22], [lens - .1, 'whoosh', .18],
      [8.05, 'chime', .16], [10.3, 'swoosh-reverse', .18], [11.15, 'click', .25]];
    return c;
  },
  hero2: (calls) => {
    const MAC0 = 4.0, MAC1 = 7.0, NM = Math.max(calls, 3), MDUR = (MAC1 - MAC0) / NM, c = [];
    c.push([0, 'riser', .45], [.8, 'whoosh', .7], [1.08, 'boom-slam', 1], [1.5, 'whoosh', .6], [2.0, 'pop', .9], [2.0, 'shimmer', .5], [3.0, 'whoosh', .55]);
    for (let i = 0; i <= NM; i++) c.push([MAC0 + i * MDUR, 'whoosh', .5]);
    for (let i = 0; i < Math.max(calls, 0); i++) c.push([MAC0 + i * MDUR + .15, 'click', .7]);
    c.push([7.75, 'shimmer', .6], [8.0, 'click', .6], [9.5, 'boom-slam', .75], [9.5, 'chime', .5], [11.0, 'pop', .7],
      [11.3, 'swoosh-reverse', .6], [12.0, 'pop', .85], [12.4, 'chime', .45]);
    return c;
  },
};
const DARK = ['black-gold', 'wine-blush', 'navy-butter', 'choc-peach', 'teal-blush', 'forest-pink', 'olive-orange', 'cherry-brand', 'cobalt-ice'];
function pickMusic(r, cfg, product) {
  const dir = path.join(AUD, 'music'); if (!fs.existsSync(dir)) return null;
  if (r.music && r.music !== 'auto') return path.join(dir, r.music);
  const cat = fs.existsSync(path.join(dir, 'tracks.json')) ? JSON.parse(fs.readFileSync(path.join(dir, 'tracks.json'))).filter(x => fs.existsSync(path.join(dir, x.file))) : [];
  const folder = product && product.folder, fit = cat.filter(x => x.fits.includes(folder)), pool = fit.length ? fit : cat;
  if (pool.length) return path.join(dir, pool[hash(String(r.product) + '|music') % pool.length].file);
  const files = fs.readdirSync(dir).filter(f => /\.(mp3|wav|m4a)$/i.test(f)).sort(); return files.length ? path.join(dir, files[0]) : null;
}
function run(args) {
  return new Promise((res, rej) => { const p = spawn('ffmpeg', args, { stdio: ['ignore', 'ignore', 'inherit'] });
    p.on('close', c => c === 0 ? res() : rej(new Error('ffmpeg failed ' + c))); });
}
async function mix(video, out, dur, cues, music) {
  const inp = ['-i', video], fl = [];
  let n = 1;
  if (music) { inp.push('-stream_loop', '-1', '-i', music); fl.push(`[${n}:a]atrim=0:${dur},afade=t=in:d=0.3,afade=t=out:st=${(dur - 1.2).toFixed(2)}:d=1.2,volume=0.55[m]`); n++; }
  const sx = [];
  cues.forEach(([at, name, v], k) => {
    const f = path.join(AUD, 'sfx', name + '.wav'); if (!fs.existsSync(f) || at >= dur) return;
    inp.push('-i', f); const ms = Math.round(at * 1000); fl.push(`[${n}:a]volume=${v},adelay=${ms}|${ms}[s${k}]`); sx.push(`[s${k}]`); n++;
  });
  fl.push(`${sx.join('')}amix=inputs=${sx.length}:normalize=0,apad,atrim=0:${dur}[sfx]`);
  if (music) {
    fl.push('[sfx]asplit[sa][sb]', '[m][sa]sidechaincompress=threshold=0.08:ratio=2.5:attack=10:release=300[duck]',
      `[duck][sb]amix=inputs=2:normalize=0,loudnorm=I=-14:TP=-1.5,atrim=0:${dur}[a]`);
  } else fl.push(`[sfx]loudnorm=I=-16:TP=-1.5,atrim=0:${dur}[a]`);
  await run(['-y', '-loglevel', 'error', ...inp, '-filter_complex', fl.join(';'), '-map', '0:v', '-map', '[a]',
    '-c:v', 'copy', '-c:a', 'aac', '-b:a', '256k', '-ar', '48000', '-t', String(dur), '-movflags', '+faststart', out]);
}
// Called by batch.js after a reel is rendered (silent video). Replaces it with the sound versions.
async function addAudio(video, r, cfg, product) {
  if (r.sound === false) return;
  const tpl = r.template || 'hero', cues = resolve(typeof CUES[tpl] === 'function' ? CUES[tpl]((cfg.calls || []).length, cfg) : (CUES[tpl] || CUES.hero), String(r.product) + (r.seed || ''));
  const silent = video.replace(/\.mp4$/, '-silent.mp4'); fs.renameSync(video, silent);
  const music = r.music === false ? null : pickMusic(r, cfg, product);
  await mix(silent, video, cfg.dur, cues, music);
  await mix(silent, video.replace(/\.mp4$/, '-sfx-only.mp4'), cfg.dur, cues, null);
  fs.unlinkSync(silent);
  console.log('   + sound: ' + (music ? path.basename(music) + ' + SFX' : 'SFX only'));
}
module.exports = { addAudio };
