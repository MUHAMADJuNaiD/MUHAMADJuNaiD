// Adds background music + animation-synced sound effects to a rendered reel.
// Makes two files:  name.mp4 (music + SFX)  and  name-sfx-only.mp4 (for adding Instagram trending audio).
const fs = require('fs'), path = require('path');
const { spawn } = require('child_process');
const ROOT = __dirname, AUD = path.join(ROOT, 'audio');

// Cue sheets: [seconds, sound, volume]. Times match each template's timeline.
const CUES = {
  hero: [[0, 'riser', .5], [1.42, 'boom-slam', 1], [2.8, 'whoosh', .8], [3.35, 'pop', .9], [4.55, 'shimmer', .7],
    [6.6, 'whoosh', .6], [6.95, 'click', .8], [7.7, 'click', .8], [8.45, 'click', .8], [9.2, 'click', .8],
    [10.6, 'whoosh', .6], [10.8, 'chime', .6], [11.0, 'pop', .7], [13.0, 'swoosh-reverse', .7], [13.75, 'pop', .9], [14.2, 'chime', .5]],
  // v3: few, different sounds - each used once, only on story beats
  hero3: (calls) => {
    const lens = 4.3, c = [[0, 'riser', .32], [1.5, 'shimmer', .55], [2.15, 'boom-slam', .6], [lens, 'whoosh', .45],
      [8.2, 'chime', .45], [10.4, 'swoosh-reverse', .5], [11.15, 'click', .7]];
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
  const files = fs.existsSync(path.join(AUD, 'music')) ? fs.readdirSync(path.join(AUD, 'music')).filter(f => /\.(mp3|wav|m4a)$/i.test(f)).sort() : [];
  if (!files.length) return null;
  if (r.music && r.music !== 'auto') return path.join(AUD, 'music', r.music);
  const want = DARK.includes(r.palette || (product && product.palette)) ? 'luxe'
    : product && /blouses|coords|eastern/.test(product.folder) ? 'soft' : 'house';
  return path.join(AUD, 'music', files.find(f => f.includes(want)) || files[0]);
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
    fl.push('[sfx]asplit[sa][sb]', '[m][sa]sidechaincompress=threshold=0.05:ratio=6:attack=5:release=250[duck]',
      `[duck][sb]amix=inputs=2:normalize=0,loudnorm=I=-14:TP=-1.5,atrim=0:${dur}[a]`);
  } else fl.push(`[sfx]loudnorm=I=-16:TP=-1.5,atrim=0:${dur}[a]`);
  await run(['-y', '-loglevel', 'error', ...inp, '-filter_complex', fl.join(';'), '-map', '0:v', '-map', '[a]',
    '-c:v', 'copy', '-c:a', 'aac', '-b:a', '256k', '-ar', '48000', '-t', String(dur), '-movflags', '+faststart', out]);
}
// Called by batch.js after a reel is rendered (silent video). Replaces it with the sound versions.
async function addAudio(video, r, cfg, product) {
  if (r.sound === false) return;
  const tpl = r.template || 'hero', cues = typeof CUES[tpl] === 'function' ? CUES[tpl]((cfg.calls || []).length) : (CUES[tpl] || CUES.hero);
  const silent = video.replace(/\.mp4$/, '-silent.mp4'); fs.renameSync(video, silent);
  const music = r.music === false ? null : pickMusic(r, cfg, product);
  await mix(silent, video, cfg.dur, cues, music);
  await mix(silent, video.replace(/\.mp4$/, '-sfx-only.mp4'), cfg.dur, cues, null);
  fs.unlinkSync(silent);
  console.log('   + sound: ' + (music ? path.basename(music) + ' + SFX' : 'SFX only'));
}
module.exports = { addAudio };
