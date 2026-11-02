// Outlook Styles – "Hero Reel v2" (one product, one colour world, fast 120 BPM edit)
// 1440x2560 @30fps, 14 s. Full-bleed 3D world; only essential info inside the Instagram safe zone.
// Deterministic: window.renderAt(t). Same config shape as hero.js (window.REEL_CFG, filled by batch.js).
import * as THREE from 'three';
import { TTFLoader } from 'three/addons/loaders/TTFLoader.js';
import { Font } from 'three/addons/loaders/FontLoader.js';
import { TextGeometry } from 'three/addons/geometries/TextGeometry.js';
import { RoomEnvironment } from 'three/addons/environments/RoomEnvironment.js';

const CFG = Object.assign({
  img: 'products/0.webp', h: 2.12, float: true,
  pal: { bg: '#D2E86A', bg2: '#E6F49E', word: '#5A2BD6', ink: '#1B1530', pod: '#5A2BD6', btnink: '#F2EEFF' },
  cat: 'WINTERWEAR', word: 'GLOSS', hookLine: 'WINTER, BUT MAKE IT SHINE.',
  kick: 'THE GLOSS PUFFER', head: 'Shine on, <b>winter.</b>', desc: 'High-shine quilted puffer with a stand collar.',
  chip: ['Gloss Black', '#121214'], calls: [], dur: 14,
}, window.REEL_CFG || {});
const W = 1440, H = 2560, P = CFG.pal, D = Math.max(14, CFG.dur || 14);
const CALLS = (CFG.calls || []).slice(0, 4);
const COMMENT = (CFG.comment || CFG.word).toUpperCase();
// Instagram Reels safe zone (1080x1920 guides scaled to 2K)
export const SAFE = { top: 380, bottom: 2000, left: 96, right: 1250, iconsTop: 1300 };

// ---------- edit timeline (120 BPM: 1 beat = 0.5 s)
const MAC0 = 4.0, MAC1 = 7.0, NM = Math.max(CALLS.length, 3), MDUR = (MAC1 - MAC0) / NM;
const T = { sting: .8, hook: .8, drop: 1.5, land: 2.0, low: 3.0, mac: MAC0, spin: MAC1, kin: 8.0, blast: 9.5, beats: 9.5, end: 11.5 };
const PUNCH = [1.08, 1.5, 2.0, 2.5, 3.0, 3.5, 7.0, 7.5, 8.0, 8.5, 9.0, 9.5, 10.0, 10.5, 11.0, 11.5, 12.0, 12.5, 13.0];
const BOUNCE = [2.0, 9.5, 10.0, 11.0, 12.0, 13.0];
const BURSTS = [1.08, 2.0, 7.75, 9.5, 11.0, 12.0];
const WHIPS = []; for (let i = 0; i <= NM; i++) WHIPS.push([MAC0 + i * MDUR, i % 2 ? 1 : -1]);
WHIPS.push([T.end, 1]);

const clamp = (x, a = 0, b = 1) => Math.min(b, Math.max(a, x));
const prog = (t, a, b) => clamp((t - a) / (b - a));
const eOut = x => 1 - Math.pow(1 - x, 3), eIn = x => x * x * x;
const eInOut = x => x < .5 ? 4 * x * x * x : 1 - Math.pow(-2 * x + 2, 3) / 2;
const eBack = x => { const c1 = 1.9, c3 = c1 + 1; return 1 + c3 * Math.pow(x - 1, 3) + c1 * Math.pow(x - 1, 2); };
const ramp = x => .35 * x + .65 * (4 * Math.pow(x - .5, 3) + .5);            // speed ramp: fast-slow-fast
const lerp = (a, b, x) => a + (b - a) * x;
const rand = (s => () => (s = (s * 16807) % 2147483647) / 2147483647)(7);
const plain = s => s.replace(/<[^>]+>/g, '');

// ---------- renderer / world
const canvas = document.getElementById('c');
const renderer = new THREE.WebGLRenderer({ canvas, antialias: true, preserveDrawingBuffer: true });
renderer.setPixelRatio(1); renderer.setSize(W, H, false);
renderer.outputColorSpace = THREE.SRGBColorSpace; renderer.toneMapping = THREE.NoToneMapping;
const scene = new THREE.Scene();
scene.environment = new THREE.PMREMGenerator(renderer).fromScene(new RoomEnvironment(), .04).texture;
scene.fog = new THREE.Fog(P.bg, 13, 34);
const FOV = 30, camera = new THREE.PerspectiveCamera(FOV, W / H, .05, 120); scene.add(camera);
const tanH = Math.tan(FOV / 2 * Math.PI / 180), visW = d => 2 * d * tanH * W / H, visH = d => 2 * d * tanH;
scene.add(new THREE.HemisphereLight(0xffffff, 0x666666, .55));
const key = new THREE.DirectionalLight(0xffffff, 1.15); key.position.set(4, 8, 7); scene.add(key);
const rim = new THREE.DirectionalLight(0xffffff, .8); rim.position.set(-6, 5, -4); scene.add(rim);

const canvasTex = (w, h, draw) => { const c = document.createElement('canvas'); c.width = w; c.height = h; draw(c.getContext('2d'), w, h);
  const t = new THREE.CanvasTexture(c); t.colorSpace = THREE.SRGBColorSpace; return t; };
scene.background = canvasTex(720, 1280, (g, w, h) => {
  let gr = g.createLinearGradient(0, 0, 0, h); gr.addColorStop(0, P.bg); gr.addColorStop(.48, P.bg2); gr.addColorStop(1, P.bg); g.fillStyle = gr; g.fillRect(0, 0, w, h);
  gr = g.createRadialGradient(w / 2, h * .45, 0, w / 2, h * .45, h * .8); gr.addColorStop(0, 'rgba(255,255,255,.22)'); gr.addColorStop(.5, 'rgba(255,255,255,0)'); gr.addColorStop(1, 'rgba(0,0,0,.22)');
  g.fillStyle = gr; g.fillRect(0, 0, w, h);
});
// floor: radial glow + rings in the pop colour (gives motion cues on every cut)
const floor = new THREE.Mesh(new THREE.PlaneGeometry(80, 80), new THREE.MeshBasicMaterial({ depthWrite: false, toneMapped: false,
  map: canvasTex(2048, 2048, (g, w) => {
    g.fillStyle = P.bg; g.fillRect(0, 0, w, w);
    const gr = g.createRadialGradient(w / 2, w / 2, 0, w / 2, w / 2, w * .12); gr.addColorStop(0, P.bg2); gr.addColorStop(1, P.bg); g.fillStyle = gr; g.fillRect(0, 0, w, w);
    g.strokeStyle = P.word; [1.9, 2.6, 3.6, 5, 7, 9.5].forEach((r, i) => { g.globalAlpha = .22 - i * .025; g.lineWidth = 5; g.beginPath(); g.arc(w / 2, w / 2, r * w / 80, 0, 7); g.stroke(); });
  }) }));
floor.rotation.x = -Math.PI / 2; floor.renderOrder = -10; scene.add(floor);
const softTex = canvasTex(128, 128, (g) => { const gr = g.createRadialGradient(64, 64, 0, 64, 64, 64);
  gr.addColorStop(0, 'rgba(255,255,255,1)'); gr.addColorStop(.45, 'rgba(255,255,255,.55)'); gr.addColorStop(1, 'rgba(255,255,255,0)'); g.fillStyle = gr; g.fillRect(0, 0, 128, 128); });
const sparkTex = canvasTex(128, 128, (g) => {
  const gr = g.createRadialGradient(64, 64, 0, 64, 64, 30); gr.addColorStop(0, 'rgba(255,255,255,1)'); gr.addColorStop(1, 'rgba(255,255,255,0)'); g.fillStyle = gr; g.fillRect(0, 0, 128, 128);
  g.fillStyle = '#fff'; g.beginPath(); g.moveTo(64, 0); g.quadraticCurveTo(70, 58, 128, 64); g.quadraticCurveTo(70, 70, 64, 128); g.quadraticCurveTo(58, 70, 0, 64); g.quadraticCurveTo(58, 58, 64, 0); g.fill(); });

// ---------- builders
let FONT;
const lambert = (color, em = .12) => new THREE.MeshLambertMaterial({ color, emissive: new THREE.Color(color), emissiveIntensity: em });
function text3d(str, { size = 1, depth = .3, color = P.word } = {}) {
  const geo = new TextGeometry(str, { font: FONT, size, depth, curveSegments: 10, bevelEnabled: true,
    bevelThickness: depth * .14, bevelSize: size * .022, bevelSegments: 4 });
  geo.computeBoundingBox(); const b = geo.boundingBox;
  geo.translate(-(b.max.x + b.min.x) / 2, -(b.max.y + b.min.y) / 2, -(b.max.z + b.min.z) / 2);
  const g = new THREE.Group(); g.add(new THREE.Mesh(geo, lambert(color)));
  g.userData.w = b.max.x - b.min.x; g.userData.h = b.max.y - b.min.y; return g;
}
function productMesh(tex, h, mirror) {
  const w = h * tex.image.width / tex.image.height;
  const geo = new THREE.PlaneGeometry(w, h); geo.translate(0, h / 2, 0);
  const mat = new THREE.MeshBasicMaterial({ map: tex, transparent: true, alphaTest: mirror ? 0 : .02, side: THREE.DoubleSide, toneMapped: false,
    depthWrite: !mirror, opacity: mirror ? .2 : 1 });
  mat.userData.shine = { value: -1 };
  mat.onBeforeCompile = sh => {
    sh.uniforms.uShine = mat.userData.shine;
    sh.fragmentShader = 'uniform float uShine;\n' + sh.fragmentShader.replace('#include <map_fragment>', mirror
      ? `#include <map_fragment>\n diffuseColor.a *= 1.0 - smoothstep(0.0, 0.3, vMapUv.y);`
      : `#include <map_fragment>
      float d = (vMapUv.x * .8 + (1.0 - vMapUv.y) * .6) - uShine;
      diffuseColor.rgb += (exp(-d * d * 260.0) * .55 + exp(-d * d * 30.0) * .12) * diffuseColor.a;`);
  };
  const m = new THREE.Mesh(geo, mat); m.userData = { w, h }; m.renderOrder = mirror ? 1 : 5; return m;
}
// one deterministic particle burst (sparkles in the palette)
function burst(n = 150) {
  const geo = new THREE.BufferGeometry(), pos = new Float32Array(n * 3), col = new Float32Array(n * 3), seeds = [];
  const cs = [P.word, '#ffffff', '#E9C46A', P.word, '#ffffff'].map(c => new THREE.Color(c));
  for (let i = 0; i < n; i++) {
    const u = rand() * 2 - 1, a = rand() * 6.283, s = Math.sqrt(1 - u * u);
    seeds.push([s * Math.cos(a), u * .8 + .15, s * Math.sin(a) * .6, .8 + rand() * 1.6]);
    cs[i % cs.length].toArray(col, i * 3);
  }
  geo.setAttribute('position', new THREE.BufferAttribute(pos, 3)); geo.setAttribute('color', new THREE.BufferAttribute(col, 3));
  const pts = new THREE.Points(geo, new THREE.PointsMaterial({ size: .16, map: sparkTex, vertexColors: true, transparent: true, depthWrite: false, toneMapped: false }));
  pts.userData.seeds = seeds; pts.renderOrder = 20; pts.frustumCulled = false; return pts;
}

// ---------- overlay (only essentials inside the safe zone; marquee lives under the IG top bar)
const ov = document.getElementById('ov');
ov.style.color = P.ink;
const MQ1 = `OUTLOOK STYLES &nbsp;•&nbsp; NEW IN &nbsp;•&nbsp; ${CFG.cat} &nbsp;•&nbsp; `;
const MQ2 = `${CFG.word} &nbsp;✦&nbsp; DM TO ORDER &nbsp;✦&nbsp; DELIVERY ALL OVER PAKISTAN &nbsp;✦&nbsp; `;
const bubble = c => `<svg width="46" height="44" viewBox="0 0 46 44"><path d="M23 3C11 3 3 10.5 3 19.5c0 5 2.6 9.4 6.7 12.4L8 41l10-5.2c1.6.3 3.3.5 5 .5 12 0 20-7.5 20-16.8S35 3 23 3Z" fill="${c}"/></svg>`;
ov.innerHTML = `
 <div class="mq" id="mq2" style="top:250px;height:62px;line-height:62px;font-size:26px;letter-spacing:.3em;background:${P.ink};color:${P.bg};transform:rotate(2.2deg)"><span id="mq2s">${MQ2.repeat(8)}</span></div>
 <div class="mq" id="mq1" style="top:130px;height:100px;line-height:102px;font-size:44px;letter-spacing:.28em;background:${P.word};color:${P.btnink};transform:rotate(-3deg);box-shadow:0 14px 30px rgba(0,0,0,.25)"><span id="mq1s">${MQ1.repeat(8)}</span></div>
 <div class="center" id="hookLine" style="top:1640px;font-weight:700;font-size:36px;letter-spacing:.3em">${CFG.hookLine || CFG.kick}</div>
 <svg id="lines" width="1440" height="2560" style="position:absolute;left:0;top:0"></svg>
 <div id="labels"></div>
 <div class="chip" id="chip"><div class="sw" style="background:${CFG.chip[1]}"></div><div class="t1">OUTLOOK STYLES</div><div class="t2">${CFG.chip[0]}</div></div>
 <div class="center" id="cmt" style="top:1790px"><span class="pill" style="background:${P.ink};color:#fff;font-size:32px;letter-spacing:.16em">${bubble(P.bg)}COMMENT&nbsp;<b style="color:${P.bg};font-size:38px">${COMMENT}</b>&nbsp;FOR DETAILS</span></div>
 <div id="end" style="position:absolute;inset:0">
   <div class="center" id="endKick" style="top:1572px;font-weight:700;font-size:26px;letter-spacing:.34em">${CFG.kick}</div>
   <div class="center head" id="endHead" style="top:1622px">${CFG.head}</div>
   <div class="center" id="endPill" style="top:1772px"><span class="pill" style="background:${P.word};color:${P.btnink}">DM TO ORDER &nbsp;&rarr;</span></div>
   <div class="center" id="endFoot" style="top:1914px;font-weight:700;font-size:24px;letter-spacing:.32em">DELIVERY ALL OVER PAKISTAN</div>
 </div>
 <svg id="stars" width="1440" height="2560" style="position:absolute;left:0;top:0"></svg>
 <div id="flash" style="position:absolute;inset:0;background:radial-gradient(circle at 50% 45%, ${P.bg2}, ${P.bg} 75%)"></div>
 ${location.search.includes('safe') ? `<div style="position:absolute;left:0;right:0;top:0;height:${SAFE.top}px;background:rgba(255,0,0,.3)"></div>
   <div style="position:absolute;left:0;right:0;top:${SAFE.bottom}px;bottom:0;background:rgba(255,0,0,.3)"></div>
   <div style="position:absolute;left:${SAFE.right}px;right:0;top:${SAFE.iconsTop}px;height:${SAFE.bottom - SAFE.iconsTop}px;background:rgba(255,0,0,.3)"></div>
   <div style="position:absolute;left:${SAFE.left}px;width:3px;top:${SAFE.top}px;height:${SAFE.bottom - SAFE.top}px;background:rgba(255,0,0,.6)"></div>` : ''}`;
const $ = id => document.getElementById(id);
const st = (el, o, tf) => { el.style.opacity = o; if (tf !== undefined) el.style.transform = tf; };
ov.querySelectorAll('#endHead b').forEach(b => b.style.color = P.word);
const STAR = 'M50 0 C54 38 62 46 100 50 C62 54 54 62 50 100 C46 62 38 54 0 50 C38 46 46 38 50 0Z';
const starPos = [[1180, 560, 64, 0], [230, 820, 42, .9], [1200, 1180, 34, 1.7], [260, 1420, 30, 2.4], [700, 470, 26, 3.1], [1120, 2150, 48, 1.2], [200, 2300, 40, 2.2]];
$('stars').innerHTML = starPos.map((s, i) => `<path id="st${i}" d="${STAR}" fill="${i % 2 ? '#ffffff' : P.word}"/>`).join('');
$('labels').innerHTML = CALLS.map((c, i) => `<div class="lbl" id="lb${i}" style="background:${P.word};color:${P.btnink}">${c.label}</div>`).join('');
$('lines').innerHTML = CALLS.map((c, i) => `<g id="ln${i}"><line stroke="#ffffff" stroke-width="4"/><circle r="14" fill="${P.word}" stroke="#fff" stroke-width="4"/><circle r="30" fill="none" stroke="#ffffff" stroke-width="4"/></g>`).join('');

// ---------- build
const G = {};
async function build() {
  FONT = new Font(await new Promise((res, rej) => new TTFLoader().load('assets/PlayfairBlack.ttf', res, null, rej)));
  await document.fonts.ready;
  const tex = await new THREE.TextureLoader().loadAsync(CFG.img); tex.colorSpace = THREE.SRGBColorSpace;
  tex.anisotropy = renderer.capabilities.getMaxAnisotropy();
  G.mqW = [$('mq1s').offsetWidth / 8, $('mq2s').offsetWidth / 8];

  // brand sting: OUTLOOK / STYLES, fitted to the safe width; camera later flies through the "O"
  G.sting = new THREE.Group(); scene.add(G.sting); G.letters = [];
  const SD = 4.5, SY = 1.4;
  [['OUTLOOK', .3, 1], ['STYLES', -.3, -1]].forEach(([word, y, dir], li) => {
    const gl = [...word].map(ch => text3d(ch, { size: .44, depth: .2 }));
    const gap = .05, total = gl.reduce((s, g) => s + g.userData.w, 0) + gap * (gl.length - 1); let x = -total / 2;
    if (!li) G.stingW = total;
    gl.forEach((g, i) => { g.userData.home = new THREE.Vector3(x + g.userData.w / 2, y, 0); x += g.userData.w + gap;
      g.userData.delay = (li ? .1 : 0) + i * .025; g.userData.dir = dir; G.sting.add(g); G.letters.push(g); });
  });
  G.stingS = .8 * visW(SD) / G.stingW; G.sting.scale.setScalar(G.stingS); G.sting.position.set(0, SY, 0);
  G.hole = G.letters[0].userData.home.clone().multiplyScalar(G.stingS).add(G.sting.position); G.SD = SD; G.SY = SY;

  // hook word (fits the safe width; becomes the backdrop word)
  G.word = text3d(CFG.word, { size: 1, depth: .36 }); scene.add(G.word);
  // product + reflection + contact shadow
  G.prod = productMesh(tex, CFG.h); scene.add(G.prod);
  G.mirror = productMesh(tex, CFG.h, true); scene.add(G.mirror);
  G.shadow = new THREE.Mesh(new THREE.PlaneGeometry(1, 1), new THREE.MeshBasicMaterial({ map: softTex, color: '#000', transparent: true, opacity: .32, depthWrite: false }));
  G.shadow.rotation.x = -Math.PI / 2; G.shadow.renderOrder = 2; scene.add(G.shadow);

  // 3D text ring orbiting the product
  G.ring = new THREE.Group(); G.ringIn = new THREE.Group(); G.ring.add(G.ringIn); scene.add(G.ring);
  const toks = []; const unit = `${CFG.word}*NEW IN*OUTLOOK STYLES*`;
  [...unit].forEach(ch => toks.push(ch));
  const R = 1.18, circ = 2 * Math.PI * R, gold = new THREE.MeshStandardMaterial({ color: '#E2B55E', metalness: 1, roughness: .25 });
  const sz = .2, parts = toks.map(ch => ch === '*' ? { dot: true, w: sz * .9 } : ch === ' ' ? { w: sz * .35 } : { g: text3d(ch, { size: sz, depth: .06 }) });
  parts.forEach(p => { if (p.g) p.w = p.g.userData.w + sz * .08; });
  const tot = parts.reduce((s, p) => s + p.w, 0), k = circ / tot; let a = 0; G.ringLetters = [];
  parts.forEach(p => {
    const th = (a + p.w * k / 2) / R; a += p.w * k;
    const node = p.dot ? new THREE.Mesh(new THREE.SphereGeometry(sz * .16, 20, 12), gold) : p.g; if (!node) return;
    node.position.set(Math.sin(th) * R, 0, Math.cos(th) * R); node.rotation.y = th; G.ringIn.add(node); G.ringLetters.push(node);
  });

  // kinetic headline (camera-locked 3D type, one line per beat)
  const tokens = []; CFG.head.replace(/<b>(.*?)<\/b>|([^<]+)/g, (m, b, n) => { (b || n).trim().split(/\s+/).filter(Boolean).forEach(w => tokens.push({ w, b: !!b })); });
  const lines = []; const per = Math.ceil(tokens.length / 3);
  if (tokens.length <= 3) tokens.forEach(t => lines.push(t)); else for (let i = 0; i < tokens.length; i += per) { const s = tokens.slice(i, i + per); lines.push({ w: s.map(x => x.w).join(' '), b: s.some(x => x.b) }); }
  G.kin = new THREE.Group(); camera.add(G.kin); G.kinZ = 4;
  const kw = .74 * visW(G.kinZ), kh = visH(G.kinZ) * .2;
  G.kinLines = lines.map((l, i) => {
    const g = text3d(l.w, { size: 1, depth: .32, color: l.b ? P.word : P.ink });
    g.userData.base = Math.min(kw / g.userData.w, kh / g.userData.h);
    const n = lines.length; g.userData.y = ((n - 1) / 2 - i) * visH(G.kinZ) * .19; G.kin.add(g); return g;
  });

  // floating 3D shapes in the palette (fill the whole frame, also under the IG UI)
  const geos = [new THREE.TorusGeometry(.3, .11, 24, 64), new THREE.SphereGeometry(.24, 40, 24), new THREE.CapsuleGeometry(.12, .36, 8, 24),
    new THREE.ConeGeometry(.22, .46, 40), new THREE.TorusKnotGeometry(.18, .06, 96, 16), new THREE.OctahedronGeometry(.28), new THREE.IcosahedronGeometry(.22, 0)];
  const mats = [new THREE.MeshStandardMaterial({ color: P.word, metalness: .2, roughness: .2 }), new THREE.MeshStandardMaterial({ color: '#ffffff', metalness: .1, roughness: .15 }),
    gold, new THREE.MeshStandardMaterial({ color: P.bg2, metalness: .1, roughness: .3 }), new THREE.MeshStandardMaterial({ color: P.ink, metalness: .3, roughness: .2 })];
  G.shapes = [];
  const spots = [[-2.3, 4.1, -1.5], [2.2, 3.7, -.8], [-1.7, .5, 1.6], [1.9, .45, 1.2], [-3.4, 2.2, -4], [3.3, 1.6, -3.5], [-1.2, 3.4, -5],
    [1.5, 4.8, -4.5], [-2.6, 1.3, .2], [2.7, 2.6, -.4], [0, 5.6, -7], [-4.5, 3.8, -8], [4.6, 3.4, -7.5], [-1, -.0, 3.0], [1.1, .1, 3.3], [0.2, 4.6, -2.6]];
  spots.forEach((p, i) => {
    const m = new THREE.Mesh(geos[i % geos.length], mats[(i * 3) % mats.length]);
    m.userData = { p: new THREE.Vector3(...p), ph: rand() * 6.28, sp: .4 + rand() * .6, s: .8 + rand() * .7, ax: new THREE.Vector3(rand() - .5, rand() - .5, rand() - .5).normalize() };
    scene.add(m); G.shapes.push(m);
  });
  // light rays from above
  const rayTex = canvasTex(64, 512, (g, w, h) => { const gr = g.createLinearGradient(0, 0, 0, h); gr.addColorStop(0, 'rgba(255,255,255,.9)'); gr.addColorStop(1, 'rgba(255,255,255,0)');
    g.fillStyle = gr; g.fillRect(0, 0, w, h); g.globalCompositeOperation = 'destination-in';
    const gx = g.createLinearGradient(0, 0, w, 0); gx.addColorStop(0, 'rgba(0,0,0,0)'); gx.addColorStop(.5, 'rgba(0,0,0,1)'); gx.addColorStop(1, 'rgba(0,0,0,0)'); g.fillStyle = gx; g.fillRect(0, 0, w, h); });
  G.rays = new THREE.Group(); G.rays.position.set(0, 9.5, -6); scene.add(G.rays);
  for (let i = 0; i < 6; i++) {
    const geo = new THREE.PlaneGeometry(1.1 + i % 3 * .5, 18); geo.translate(0, -9, 0);
    const m = new THREE.Mesh(geo, new THREE.MeshBasicMaterial({ map: rayTex, transparent: true, opacity: .17, depthWrite: false, blending: THREE.AdditiveBlending, fog: false }));
    m.userData = { a: (i - 2.5) * .16, ph: i * 1.3 }; m.renderOrder = -5; G.rays.add(m);
  }
  // bokeh
  G.bokeh = [];
  for (let i = 0; i < 28; i++) {
    const front = i < 7, s = new THREE.Sprite(new THREE.SpriteMaterial({ map: softTex, color: i % 3 ? '#ffffff' : P.word, transparent: true, depthWrite: false, opacity: front ? .2 : .34 }));
    s.userData = { x: (rand() - .5) * (front ? 5 : 9), y: rand() * 6.5 - .5, z: front ? 2.2 + rand() * 1.5 : -3 - rand() * 5, s: front ? .5 + rand() * .5 : .12 + rand() * .24, ph: rand() * 6.28 };
    s.renderOrder = front ? 15 : 0; scene.add(s); G.bokeh.push(s);
  }
  G.bursts = BURSTS.map(() => { const b = burst(); scene.add(b); return b; });
  window.READY = true;
}

// ---------- helpers per frame
const v3 = new THREE.Vector3(), tg = new THREE.Vector3();
function orbit(x, y, z, d, yaw, pitch) {
  tg.set(x, y, z);
  camera.position.set(x + Math.sin(yaw) * Math.cos(pitch) * d, y + Math.sin(pitch) * d, z + Math.cos(yaw) * Math.cos(pitch) * d);
  camera.lookAt(tg);
}
const prodPoint = (u, v, out = new THREE.Vector3()) => { const { w, h } = G.prod.userData; out.set((u - .5) * w, (1 - v) * h, 0); return G.prod.localToWorld(out); };
function toScreen(p) { v3.copy(p).project(camera); return [(v3.x + 1) / 2 * W, (1 - v3.y) / 2 * H]; }
const punch = t => PUNCH.reduce((s, b) => s + (t >= b && t < b + .45 ? Math.exp(-(t - b) * 11) : 0), 0);
const hop = t => BOUNCE.reduce((s, b) => { const u = t - b; return s + (u >= 0 && u < .34 ? .2 * Math.sin(Math.PI * u / .34) : u >= .34 && u < .52 ? .05 * Math.sin(Math.PI * (u - .34) / .18) : 0); }, 0);
function whip(t) { // returns [yaw offset, blur]
  for (const [b, dir] of WHIPS) {
    if (t >= b - .1 && t < b) { const k = eIn((t - (b - .1)) / .1); return [dir * .55 * k, k]; }
    if (t >= b && t < b + .13) { const k = 1 - eOut((t - b) / .13); return [-dir * .55 * k, k]; }
  }
  return [0, 0];
}

window.renderAt = (t) => {
  const PH = CFG.h, base = .12;
  const inSting = t < T.sting, inMac = t >= MAC0 && t < MAC1, inKin = t >= T.kin && t < T.blast, inEnd = t >= T.end;
  // ---------- product state
  const endK = eInOut(prog(t, T.end, T.end + .6));
  let py = base + (CFG.float ? .05 * Math.sin(t * 2.6) : 0) + hop(t), pRot = .06 * Math.sin(t * 1.4), pS = lerp(1, .78, endK);
  const fall = prog(t, T.drop, T.land);
  if (t < T.land) { py = lerp(6.5, base, eIn(fall)); pRot = (1 - eOut(prog(t, T.drop - .05, T.land + .05))) * -4 * Math.PI; }
  if (t >= T.spin && t < T.kin) pRot = -2 * Math.PI * eInOut(prog(t, T.spin + .05, T.spin + .75));          // speed-ramped 360
  if (t >= T.kin && t < T.blast + .3) {                                                                        // poof out, pop back
    const out = eIn(prog(t, T.kin, T.kin + .22)), back = eBack(prog(t, T.blast, T.blast + .3));
    pS = t < T.blast ? 1 - out : back; pRot += t < T.blast ? out * 3 : (1 - prog(t, T.blast, T.blast + .3)) * -3;
  }
  const land = t >= T.land ? Math.exp(-(t - T.land) * 9) : 0;
  G.prod.visible = t >= T.drop && pS > .002;
  G.prod.position.set(0, py, 0); G.prod.rotation.y = pRot;
  G.prod.scale.set(pS * (1 + .06 * land), pS * (1 - .08 * land), pS);
  G.mirror.visible = G.prod.visible; G.mirror.position.set(0, -py, 0); G.mirror.rotation.y = pRot; G.mirror.scale.set(G.prod.scale.x, -G.prod.scale.y, pS);
  G.shadow.visible = G.prod.visible; const sh = clamp(1 - (py - base) / 4); G.shadow.scale.set(2.3 * pS * (.5 + .5 * sh), .9 * pS * (.5 + .5 * sh), 1);
  G.shadow.position.set(0, .006, .05); G.shadow.material.opacity = .34 * sh;
  G.prod.material.userData.shine.value = Math.max(
    t >= T.low && t < T.low + .65 ? lerp(-.4, 1.8, eInOut(prog(t, T.low, T.low + .6))) : -1,
    t >= T.end + .5 && t < T.end + 1.15 ? lerp(-.4, 1.8, eInOut(prog(t, T.end + .5, T.end + 1.1))) : -1);
  scene.updateMatrixWorld(true);

  // ---------- camera (shot list)
  const pc = punch(t), pz = 1 - .075 * pc; camera.fov = FOV; camera.near = .05;
  const cy = base + PH * .5;
  if (inSting) {
    // look at the words, slide onto the "O", then fly through it
    const k = eInOut(prog(t, .3, .52));
    const cx = lerp(0, G.hole.x, k), cyy = lerp(G.SY, G.hole.y, k);
    camera.position.set(cx, cyy, G.SD); camera.lookAt(cx, cyy, 0);
  } else if (t < T.low) {
    const k = eInOut(prog(t, T.drop, T.land + .3));
    orbit(.05 * k, lerp(1.3, cy, k), 0, lerp(8.4, 7.2, k) * pz, lerp(0, .1, k) + .14 * prog(t, T.land, T.low), lerp(.1, .12, k));
  } else if (t < MAC0) {
    const k = prog(t, T.low, MAC0);
    orbit(.05, cy + .15, 0, lerp(6.5, 5.9, k) * pz, lerp(-.42, -.22, k), -.14);
  } else if (inMac) {
    const i = Math.min(NM - 1, Math.floor((t - MAC0) / MDUR)), k = ramp(prog(t, MAC0 + i * MDUR, MAC0 + (i + 1) * MDUR));
    const c = CALLS[i] || { uv: [[.5, .12], [.4, .45], [.5, .85]][i] };
    const p = prodPoint(c.uv[0], c.uv[1], new THREE.Vector3());
    const yaw = (i % 2 ? .28 : -.28) * (1 - k * .5);
    orbit(p.x, p.y - .16, p.z, lerp(4.3, 3.6, k), yaw, lerp(.06, -.02, k));
  } else if (t < T.kin) {
    const k = prog(t, T.spin, T.kin);
    orbit(.05, cy, 0, lerp(6.9, 7.4, k) * pz, lerp(.35, -.2, eInOut(k)), .1);
  } else if (inKin) {
    const k = prog(t, T.kin, T.blast);
    orbit(0, cy, 0, lerp(8.0, 7.3, k) * pz, lerp(-.15, .15, k), .1 + .05 * k);
  } else if (!inEnd) {
    const s = Math.floor((t - T.beats) / .5);           // a new camera angle on every beat
    const shots = [[0, cy + .1, 0, 5.6, .32, -.14], [.05, cy, 0, 7.3, -.16, .12], [0, base + PH * .78, 0, 4.4, -.26, .04], [.05, cy, 0, 7.4, .2, .1]];
    const [x, y, z, d, yaw, pit] = shots[Math.min(3, s)]; const k = prog(t, T.beats + s * .5, T.beats + s * .5 + .5);
    orbit(x, y, z, d * (1 - .05 * k) * pz, yaw * (1 - .2 * k), pit);
  } else {
    const k = prog(t, T.end, D);
    orbit(.05, .42, 0, lerp(9.0, 8.7, eOut(prog(t, T.end, T.end + .6))) * (1 - .03 * pc), lerp(.12, -.06, k), .1);
  }
  const [wo, wb] = whip(t); camera.rotateY(wo); camera.rotateZ(.012 * pc * Math.sin(t * 40));
  camera.updateProjectionMatrix(); camera.updateMatrixWorld(true);
  canvas.style.filter = wb > .03 ? 'url(#whip)' : 'none';
  $('wb').setAttribute('stdDeviation', `${(wb * 70).toFixed(1)} ${(wb * 4).toFixed(1)}`);

  // ---------- sting
  G.sting.visible = inSting;
  const fly = prog(t, .5, .8), flyS = Math.exp(Math.log(90) * fly * fly);
  G.sting.scale.setScalar(G.stingS * flyS);
  const ho = G.letters[0].userData.home, S = G.stingS * flyS;
  G.sting.position.set(G.hole.x - S * ho.x, G.hole.y - S * ho.y, -S * ho.z);
  G.letters.forEach(g => {
    const k = prog(t, .04 + g.userData.delay, .04 + g.userData.delay + .26), e = eBack(k), h = g.userData.home;
    g.position.set(h.x, lerp(h.y + 1.4 * g.userData.dir, h.y, e), h.z + (1 - k) * 1.2);
    g.rotation.set((1 - e) * -1.4, (1 - e) * .9, 0); g.scale.setScalar(Math.max(.001, k > 0 ? Math.min(1.2, e) : 0));
  });

  // ---------- hook word -> backdrop word
  G.word.visible = t >= T.hook && !inMac && !inKin;
  const hk = prog(t, T.hook, T.hook + .28), mv = eInOut(prog(t, T.drop, T.land + .1));
  const hookW = .74 * visW(8.6), backW = .86 * visW(7.2 + 2.4);
  const ws = lerp(hookW, backW, mv) / G.word.userData.w * (hk < 1 ? Math.max(.001, eBack(hk)) : 1);
  G.word.scale.setScalar(ws * lerp(1, .8, endK));
  G.word.position.set(0, lerp(1.62, base + PH * .93, mv) + endK * .1, lerp(0, -2.4, mv) - (1 - eOut(hk)) * 5);
  G.word.rotation.set((1 - eOut(hk)) * -1.1, 0, (1 - eOut(hk)) * .25);

  // ---------- ring
  const ringOn = t >= T.land && !inMac;
  G.ring.visible = ringOn;
  G.ring.position.set(0, base + PH * .42 * pS + (py - base), 0); G.ring.rotation.set(.3, 0, -.12);
  G.ringIn.rotation.y = t * (inKin ? 2.4 : 1.1); const ringEnd = 1 - eIn(prog(t, T.end, T.end + .35)); G.ring.visible = ringOn && ringEnd > .002;
  G.ring.scale.setScalar(Math.max(.001, ringEnd * (inKin ? 1.25 : 1)));
  G.ringLetters.forEach((n, i) => n.scale.setScalar(Math.max(.001, eBack(prog(t, T.land + i * .012, T.land + i * .012 + .25)))));

  // ---------- kinetic headline
  G.kin.visible = inKin;
  G.kinLines.forEach((g, i) => {
    const a = T.kin + i * .5, k = prog(t, a, a + .3), e = eBack(k), outK = eIn(prog(t, T.blast - .22, T.blast));
    const dir = [[-1, .3], [1, -.2], [0, -1]][i % 3];
    g.visible = t >= a;
    g.position.set(dir[0] * (1 - e) * 2.4, g.userData.y + dir[1] * (1 - e) * 2 + outK * g.userData.y * 1.5, -G.kinZ + outK * 3.4);
    g.rotation.set((1 - e) * .9 * dir[1], (1 - e) * -1.2 * dir[0], (1 - e) * .3);
    g.scale.setScalar(g.userData.base * Math.max(.001, k > 0 ? e : 0) * (1 + .05 * Math.exp(-(t - a - .3) * 10) * (t > a + .3)));
  });

  // ---------- world
  G.shapes.forEach((m, i) => {
    const u = m.userData, pop = punch(t) * .12;
    m.position.set(u.p.x + .15 * Math.sin(t * u.sp + u.ph), u.p.y + .25 * Math.sin(t * u.sp * 1.3 + u.ph), u.p.z);
    m.rotation.set(t * u.sp * .9 + u.ph, t * u.sp * 1.3, u.ph);
    const intro = eBack(prog(t, T.hook + (i % 6) * .05, T.hook + (i % 6) * .05 + .35));
    m.scale.setScalar(Math.max(.001, u.s * intro * (1 + pop)));
    m.visible = !inSting;
  });
  G.rays.children.forEach(r => { r.rotation.z = r.userData.a + .06 * Math.sin(t * .9 + r.userData.ph); r.material.opacity = .14 + .06 * Math.sin(t * 3 + r.userData.ph); });
  G.rays.visible = !inSting; floor.visible = !inSting;
  G.bokeh.forEach(b => { const u = b.userData; b.position.set(u.x + .15 * Math.sin(t * .6 + u.ph), u.y + .3 * Math.sin(t * .5 + u.ph), u.z); b.scale.setScalar(u.s); b.visible = !inSting; });
  G.bursts.forEach((b, j) => {
    const t0 = BURSTS[j], tau = t - t0; b.visible = tau >= 0 && tau < 1;
    if (!b.visible) return;
    const pos = b.geometry.attributes.position, cY = j === 0 ? 1.62 : base + PH * .5;
    b.userData.seeds.forEach((s, i) => { const r = s[3] * eOut(clamp(tau / .9)) * (j === 0 ? 1.4 : 1.2);
      pos.setXYZ(i, s[0] * r, cY + s[1] * r - .7 * tau * tau, s[2] * r + (j === 0 ? .4 : .6)); });
    pos.needsUpdate = true; b.material.opacity = 1 - eIn(clamp(tau)); b.material.size = .17 * (1 - .5 * tau);
  });

  // ---------- overlay
  $('mq1').style.opacity = $('mq2').style.opacity = 1;
  $('mq1s').style.transform = `translateX(${-((t * 300) % G.mqW[0])}px)`;
  $('mq2s').style.transform = `translateX(${-G.mqW[1] + ((t * 220) % G.mqW[1])}px)`;
  const hl = eOut(prog(t, T.hook + .25, T.hook + .5)) * (1 - eOut(prog(t, T.drop + .1, T.drop + .3)));
  st($('hookLine'), hl, `translateY(${(1 - hl) * 40}px)`);
  // macro callouts
  CALLS.forEach((c, i) => {
    const a = MAC0 + i * MDUR, on = t >= a && t < a + MDUR;
    const lb = $('lb' + i), g = $('ln' + i);
    if (!on) { lb.style.opacity = 0; g.style.opacity = 0; return; }
    const k = eBack(prog(t, a + .1, a + .32)), o = 1 - prog(t, a + MDUR - .12, a + MDUR - .02);
    st(lb, o, `translateX(${(1 - k) * -500}px) skewX(${(1 - k) * -14}deg) scale(${.9 + .1 * k})`);
    const [x, y] = toScreen(prodPoint(c.uv[0], c.uv[1], new THREE.Vector3()));
    const r = lb.getBoundingClientRect(), lx = 96 + 60, ly = 1560;
    const ex = lerp(x, lx, eOut(prog(t, a + .08, a + .3))), ey = lerp(y, ly, eOut(prog(t, a + .08, a + .3)));
    const [ln, d1, d2] = g.children;
    ln.setAttribute('x1', x); ln.setAttribute('y1', y); ln.setAttribute('x2', ex); ln.setAttribute('y2', ey);
    d1.setAttribute('cx', x); d1.setAttribute('cy', y); d2.setAttribute('cx', x); d2.setAttribute('cy', y);
    d2.setAttribute('r', 22 + 18 * ((t - a) * 2 % 1)); d2.style.opacity = 1 - ((t - a) * 2 % 1);
    g.style.opacity = o;
  });
  // colour chip
  const ck = prog(t, T.blast + .1, T.blast + .45);
  $('chip').style.opacity = t >= T.blast + .1 ? 1 : 0;
  $('chip').style.transform = `perspective(900px) rotateY(${lerp(100, 0, eBack(ck))}deg) rotate(-5deg) scale(${1 + .04 * punch(t)})`;
  // comment prompt
  const cm = eBack(prog(t, T.beats + .5, T.beats + .8)) * (1 - eIn(prog(t, T.end - .12, T.end)));
  $('cmt').style.opacity = t >= T.beats + .5 && t < T.end ? 1 : 0;
  $('cmt').style.transform = `scale(${Math.max(0, cm) * (1 + .04 * punch(t))}) rotate(${(1 - clamp(cm)) * -6}deg)`;
  // end card
  $('end').style.display = inEnd ? 'block' : 'none';
  const e0 = eOut(prog(t, T.end + .2, T.end + .45)), e1 = eOut(prog(t, T.end + .35, T.end + .7)), e2 = eBack(prog(t, T.end + .6, T.end + .9));
  st($('endKick'), e0, `translateY(${(1 - e0) * 40}px)`); st($('endHead'), e1, `translateY(${(1 - e1) * 60}px)`);
  st($('endFoot'), eOut(prog(t, T.end + .8, T.end + 1.1)));
  $('endPill').style.transform = `scale(${Math.max(0, e2) * (1 + (t > T.end + 1 ? .05 * punch(t) : 0))})`;
  starPos.forEach(([x, y, s, ph], i) => { const k = .5 + .5 * Math.sin(t * 2 * Math.PI + ph * 2), sc = (s / 100) * (.6 + .4 * k + .4 * punch(t));
    const el = $('st' + i); el.setAttribute('transform', `translate(${x - 50 * sc} ${y - 50 * sc}) scale(${sc})`);
    el.setAttribute('opacity', (inSting || inMac ? 0 : .35 + .65 * k)); });
  // loop flash: the last frames melt into the colour that the first frame starts from
  $('flash').style.opacity = t < .15 ? 1 - eOut(t / .15) : eIn(prog(t, D - .4, D));

  renderer.render(scene, camera);
};
build().then(() => window.renderAt(0)).catch(e => { window.ERR = String(e && e.stack || e); });
