// Outlook Styles – STORY ENGINE v4 (4:5, 1728x2160 @30fps). Product always ends centred; every reel varies.
// Stories: drop | unbox | season | colour | runway.  Reveals: drop | twirl | slices | dissolve | portal | rise | curtain | slide.
// Variety knobs (picked per product by batch.js): story, reveal, detail style (lens|card), transitions, camera sign, text style.
import * as THREE from 'three';
import { TTFLoader } from 'three/addons/loaders/TTFLoader.js';
import { Font } from 'three/addons/loaders/FontLoader.js';
import { TextGeometry } from 'three/addons/geometries/TextGeometry.js';
import { RoomEnvironment } from 'three/addons/environments/RoomEnvironment.js';

const CFG = window.REEL_CFG || {
  img: 'products/212.webp', folder: 'handbags', dur: 14, story: 'unbox', reveal: 'rise', detail: 'card', trans: ['iris', 'bars'], camSign: 1, text: 'pop',
  pal: { bg: '#F4BFCB', bg2: '#FBDDE4', word: '#B5121F', ink: '#3E0A12', btnink: '#FFF2F4' },
  cat: 'HANDBAGS', word: 'CHERRY', kick: 'THE SADDLE BAG', head: 'Cherry <b>on top.</b>', desc: 'Glossy red leather, sculpted gold hardware.',
  chip: ['Cherry Red', '#B01C25'], details: [], brand: { website: 'outlookstyles.com', instagram: '@outlook_.styles', address: 'Jasmine Mall (3rd Floor), Bahria Town, Lahore' },
};
const W = 1728, H = 2160, P = CFG.pal, D = CFG.dur || 14, B = CFG.brand || {}, STORY = CFG.story || 'drop';
const REVEAL = CFG.reveal || 'drop', SIGN = CFG.camSign || 1, TR = CFG.trans || ['wipe', 'wipe'], DSTYLE = CFG.detail || 'lens';

// ---------- story timelines (s)
const TL = {
  drop:   { rv: 1.4, rd: 1.0, lens: 4.4, colour: 8.0, shop: 10.4 },
  unbox:  { rv: 1.95, rd: 1.0, lens: 4.5, colour: 8.1, shop: 10.4 },
  season: { rv: 1.8, rd: 1.1, lens: 4.4, colour: 8.0, shop: 10.4 },
  colour: { rv: 2.2, rd: 1.1, lens: 4.7, colour: 8.3, shop: 10.5 },
  runway: { rv: 1.5, rd: 1.1, lens: 4.4, colour: 8.0, shop: 10.4 },
}[STORY];
const LE = 1.2; TL.lensEnd = TL.lens + 3 * LE;
const SEASON = {
  'tops-winterwear': [['WINTER', 'IS HERE.'], 'snow'], 'bottoms': [['WEEKEND', 'MODE ON.'], 'confetti'],
  'blouses-shirts': [['DESK TO', 'DINNER.'], 'sparkle'], 'coords-dresses': [['DRESSED TO', 'IMPRESS.'], 'sparkle'],
  'eastern': [['EID', 'READY.'], 'gold'], 'handbags': [['PARTY', 'SEASON.'], 'confetti'],
  'flats-jewellery': [['MADE TO', 'SHINE.'], 'gold'], 'sunglasses': [["SUN'S", 'OUT.'], 'rays'],
}[CFG.folder] || [['NEW', 'SEASON.'], 'sparkle'];
const INTRO = { drop: ['SOMETHING NEW', 'IS COMING'], unbox: ['SPECIAL', 'DELIVERY'], season: SEASON[0], colour: ["THIS SEASON'S", 'COLOUR'], runway: ['NOW ON THE', 'RUNWAY'] }[STORY];
const PFX = STORY === 'season' ? SEASON[1] : STORY === 'unbox' ? 'confetti' : STORY === 'runway' ? 'sparkle' : 'bokeh';
// benefits for the "why you'll love it" beats (from the product's own description – no invented claims)
const BEN = (CFG.desc || '').replace(/\.$/, '').split(/,\s*| with /i).map(s => s.trim()).filter(Boolean).map(s => s[0].toUpperCase() + s.slice(1));
const DET = (CFG.calls && CFG.calls.length ? CFG.calls : CFG.details || []).slice(0, 3).map((c, i) => [c.uv[0], c.uv[1],
  STORY === 'unbox' && BEN[i] ? BEN[i].toUpperCase() : (c.label || '').replace(/<br>/g, ' ')]);
while (DET.length < 3) DET.push([.5, .3 + DET.length * .25, ['DETAIL', 'FABRIC', 'FINISH'][DET.length]]);

const clamp = (x, a = 0, b = 1) => Math.min(b, Math.max(a, x));
const prog = (t, a, b) => clamp((t - a) / (b - a));
const eOut = x => 1 - Math.pow(1 - x, 3);
const eInOut = x => x < .5 ? 4 * x * x * x : 1 - Math.pow(-2 * x + 2, 3) / 2;
const eBack = x => { const c1 = 1.70158, c3 = c1 + 1; return 1 + c3 * Math.pow(x - 1, 3) + c1 * Math.pow(x - 1, 2); };
const eBounce = x => { const n = 7.5625, d = 2.75; if (x < 1 / d) return n * x * x; if (x < 2 / d) return n * (x -= 1.5 / d) * x + .75;
  if (x < 2.5 / d) return n * (x -= 2.25 / d) * x + .9375; return n * (x -= 2.625 / d) * x + .984375; };
const lerp = (a, b, x) => a + (b - a) * x;
const pulse = (t, c, w = 9) => Math.exp(-Math.pow((t - c) * w, 2));
const rand = (s => () => (s = (s * 16807) % 2147483647) / 2147483647)(11 + (CFG.seed || 0));

// ---------- renderer & world
const canvas = document.getElementById('c');
const renderer = new THREE.WebGLRenderer({ canvas, antialias: true, preserveDrawingBuffer: true });
renderer.setPixelRatio(1); renderer.setSize(W, H, false);
renderer.outputColorSpace = THREE.SRGBColorSpace; renderer.toneMapping = THREE.NoToneMapping;
renderer.shadowMap.enabled = true; renderer.shadowMap.type = THREE.PCFSoftShadowMap;
const scene = new THREE.Scene();
scene.environment = new THREE.PMREMGenerator(renderer).fromScene(new RoomEnvironment(), .04).texture;
const camera = new THREE.PerspectiveCamera(30, W / H, .1, 100);
scene.add(new THREE.HemisphereLight(0xffffff, 0x444444, .3));
const key = new THREE.DirectionalLight(0xffffff, 1.0);
key.position.set(3, 9, 7); key.castShadow = true; key.shadow.mapSize.set(2048, 2048); key.shadow.radius = 10; key.shadow.bias = -.0005;
Object.assign(key.shadow.camera, { left: -5, right: 5, top: 7, bottom: -3, near: 1, far: 30 }); scene.add(key);
const floor = new THREE.Mesh(new THREE.PlaneGeometry(60, 60), new THREE.ShadowMaterial({ opacity: .24 }));
floor.rotation.x = -Math.PI / 2; floor.receiveShadow = true; scene.add(floor);
(() => {
  const c = document.createElement('canvas'); c.width = 864; c.height = 1080; const g = c.getContext('2d');
  let gr = g.createRadialGradient(432, 470, 0, 432, 520, 820); gr.addColorStop(0, P.bg2); gr.addColorStop(.6, P.bg); gr.addColorStop(1, P.bg);
  g.fillStyle = gr; g.fillRect(0, 0, 864, 1080);
  g.save(); g.translate(432, 880); g.scale(1, .22); gr = g.createRadialGradient(0, 0, 0, 0, 0, 420);
  gr.addColorStop(0, 'rgba(255,255,255,.35)'); gr.addColorStop(1, 'rgba(255,255,255,0)'); g.fillStyle = gr; g.beginPath(); g.arc(0, 0, 420, 0, 7); g.fill(); g.restore();
  gr = g.createRadialGradient(432, 540, 330, 432, 540, 820); gr.addColorStop(0, 'rgba(0,0,0,0)'); gr.addColorStop(1, 'rgba(0,0,0,.24)'); g.fillStyle = gr; g.fillRect(0, 0, 864, 1080);
  const t = new THREE.CanvasTexture(c); t.colorSpace = THREE.SRGBColorSpace; scene.background = t;
})();

// ---------- builders
let FONT;
const lam = (color, e = .1) => new THREE.MeshLambertMaterial({ color, emissive: new THREE.Color(color), emissiveIntensity: e });
function text3d(str, color, width) {
  const geo = new TextGeometry(str, { font: FONT, size: 1, depth: .34, curveSegments: 10, bevelEnabled: true, bevelThickness: .05, bevelSize: .022, bevelSegments: 4 });
  geo.computeBoundingBox(); const b = geo.boundingBox;
  geo.translate(-(b.max.x + b.min.x) / 2, -(b.max.y + b.min.y) / 2, -(b.max.z + b.min.z) / 2);
  const m = new THREE.Mesh(geo, lam(color)); m.castShadow = true;
  const g = new THREE.Group(); g.add(m); g.scale.setScalar(width / (b.max.x - b.min.x)); g.userData.base = g.scale.x; return g;
}
function productMesh(tex, h) {
  const w = h * tex.image.width / tex.image.height;
  const geo = new THREE.PlaneGeometry(w, h); geo.translate(0, -h / 2 + h / 2, 0); // centred on its own middle
  const mat = new THREE.MeshBasicMaterial({ map: tex, transparent: true, alphaTest: .02, side: THREE.DoubleSide, toneMapped: false });
  const U = mat.userData = { shine: { value: -1 }, light: { value: 1 }, dis: { value: 1.2 }, slice: { value: 0 }, glow: { value: new THREE.Color(P.word) } };
  mat.onBeforeCompile = sh => {
    Object.assign(sh.uniforms, { uShine: U.shine, uLight: U.light, uDis: U.dis, uSlice: U.slice, uGlow: U.glow });
    sh.fragmentShader = `uniform float uShine; uniform float uLight; uniform float uDis; uniform float uSlice; uniform vec3 uGlow;
      float h21(vec2 p){ return fract(sin(dot(p, vec2(127.1, 311.7))) * 43758.5453); }
      float vn(vec2 p){ vec2 i = floor(p), f = fract(p); f = f*f*(3.0-2.0*f);
        return mix(mix(h21(i), h21(i+vec2(1,0)), f.x), mix(h21(i+vec2(0,1)), h21(i+vec2(1,1)), f.x), f.y); }\n` +
      sh.fragmentShader.replace('#include <map_fragment>', `
      float sl = floor(vMapUv.y * 14.0);
      vec2 uv2 = vMapUv + vec2((mod(sl, 2.0) * 2.0 - 1.0) * uSlice * (1.0 + sl * .04), 0.0);
      if (uv2.x < 0.0 || uv2.x > 1.0) discard;
      vec4 sampledDiffuseColor = texture2D(map, uv2);
      diffuseColor *= sampledDiffuseColor;
      float n = vn(vMapUv * 22.0) * .75 + vn(vMapUv * 70.0) * .25;
      if (n > uDis) discard;
      float edge = smoothstep(uDis - .06, uDis, n) * step(uDis, 1.05);
      diffuseColor.rgb = mix(diffuseColor.rgb, uGlow * 1.6 + .3, edge);
      diffuseColor.rgb *= mix(0.04, 1.0, uLight);
      float d = (vMapUv.x * .8 + (1.0 - vMapUv.y) * .6) - uShine;
      diffuseColor.rgb += (exp(-d * d * 260.0) * .45 + exp(-d * d * 30.0) * .08) * diffuseColor.a * uLight;`);
  };
  const m = new THREE.Mesh(geo, mat); m.castShadow = true;
  m.customDepthMaterial = new THREE.MeshDepthMaterial({ depthPacking: THREE.RGBADepthPacking, map: tex, alphaTest: .5 });
  m.userData.w = w; m.userData.h = h; return m;
}
function dotTex() { const c = document.createElement('canvas'); c.width = c.height = 128; const g = c.getContext('2d');
  const gr = g.createRadialGradient(64, 64, 0, 64, 64, 64); gr.addColorStop(0, 'rgba(255,255,255,1)'); gr.addColorStop(.4, 'rgba(255,255,255,.55)'); gr.addColorStop(1, 'rgba(255,255,255,0)');
  g.fillStyle = gr; g.fillRect(0, 0, 128, 128); return new THREE.CanvasTexture(c); }

// ---------- overlay
const ov = document.getElementById('ov'); ov.style.color = P.ink; ov.style.setProperty('--word', P.word);
const site = (B.website || '').replace(/^https?:\/\//, '').replace(/\/$/, '');
const darkIntro = STORY === 'drop' || STORY === 'runway';
ov.innerHTML = `
 <div class="mast" id="mast"><div class="side">NEW IN</div><div class="brand">OUTLOOK STYLES</div><div class="side r"><span>${CFG.cat}</span></div></div>
 <div class="rule" id="rule"></div>
 <div id="rays" style="position:absolute;inset:-20%;opacity:0;background:repeating-conic-gradient(from 0deg at 50% 30%, rgba(255,255,255,.22) 0deg 6deg, rgba(255,255,255,0) 6deg 18deg)"></div>
 <div class="copy" id="copy"><div class="kick">${CFG.kick}</div><div class="head">${CFG.head}</div><div class="desc">${CFG.desc}</div></div>
 <div class="kt" id="kt1" style="top:780px;font-size:190px"></div>
 <div class="kt" id="kt2" style="top:980px;font-size:190px"></div>
 <div class="kt" id="kt3" style="top:1745px;font-size:84px;font-style:italic;font-weight:800"></div>
 <svg id="lnsvg" width="${W}" height="${H}" style="position:absolute;left:0;top:0"><line id="lnl" stroke="${P.ink}" stroke-width="4"/><circle id="lnd" r="14" fill="${P.word}" stroke="#fff" stroke-width="5"/></svg>
 <div class="lens" id="lens" style="background-image:url(${CFG.img})"></div>
 <div class="dcard" id="dcard" style="background-image:url(${CFG.img})"><b id="dlab"></b></div>
 <div class="lenslab" id="lenslab"></div>
 <div class="chip" id="chip"><div class="sw" style="background:${CFG.chip[1]}"></div><div class="t1">OUTLOOK STYLES</div><div class="t2">${CFG.chip[0]}</div></div>
 <div id="shop" style="position:absolute;inset:0">
   <div class="center" id="s1" style="top:1700px;font-weight:800;font-size:26px;letter-spacing:.42em">${site ? 'NOW LIVE ON OUR WEBSITE' : 'SHOP NOW ON INSTAGRAM'}</div>
   <div class="center" id="s2" style="top:1756px"><span class="browser"><span class="dots"><i style="background:#FF5F57"></i><i style="background:#FEBC2E"></i><i style="background:#28C840"></i></span>${site || B.instagram || '@outlook_.styles'}</span></div>
   <div class="center" id="s3" style="top:1900px"><span class="pill" style="background:${P.word};color:${P.btnink}">DM TO ORDER &nbsp;&rarr;</span>
     <span style="display:inline-block;margin-left:26px;font-weight:800;font-size:30px;letter-spacing:.12em;vertical-align:middle">${site ? (B.instagram || '@outlook_.styles') : ''}</span></div>
   <div class="center" id="s4" style="top:2046px;font-weight:700;font-size:21px;letter-spacing:.3em">DELIVERY ALL OVER PAKISTAN${B.address ? ' &middot; ' + B.address.toUpperCase() : ''}</div>
 </div>
 <div id="dark" style="position:absolute;inset:0"></div>
 <div class="kt" id="ktd1" style="top:300px;font-family:Montserrat;font-weight:700;font-size:40px;letter-spacing:.42em;color:#fff">OUTLOOK STYLES</div>
 <div class="kt" id="ktd2" style="top:1760px;font-family:Montserrat;font-weight:700;font-size:34px;letter-spacing:.42em;color:#fff"></div>
 <div id="flash" style="position:absolute;inset:0;background:#fff;opacity:0"></div>
 <div id="wipe" style="position:absolute;left:-30%;top:-10%;width:160%;height:120%;opacity:0"></div>
 <div id="iris" style="position:absolute;inset:0;opacity:0;background:${P.word}"></div>
 <div id="bars" style="position:absolute;inset:0;opacity:0">${[0, 1, 2, 3, 4, 5].map(i => `<div style="top:${i * 16.667}%;height:16.8%;background:${i % 2 ? P.word : P.ink}"></div>`).join('')}</div>`;
const $ = id => document.getElementById(id);
const st = (el, o, tf) => { el.style.opacity = o; if (tf !== undefined) el.style.transform = tf; };
$('copy').querySelector('b') && ($('copy').querySelector('b').style.color = P.word);
// kinetic text: split into letters once, animate per frame
function setKT(id, text, color) { const el = $(id); el.innerHTML = [...text].map(ch => `<span>${ch === ' ' ? '&nbsp;' : ch}</span>`).join(''); if (color) el.style.color = color; }
function animKT(id, t, t0, t1, style = CFG.text || 'pop') {
  const el = $(id), sp = el.children, n = sp.length; let vis = 0;
  for (let i = 0; i < n; i++) {
    const k = prog(t, t0 + i * .035, t0 + i * .035 + .35), out = prog(t, t1 - .25, t1); const a = k * (1 - out);
    let tf = style === 'slide' ? `translateY(${(1 - eOut(k)) * 120 - out * 80}px)` : style === 'type' ? `scale(1)` : `scale(${Math.max(0, eBack(k)) * (1 - out * .4)}) rotate(${(1 - k) * -12}deg)`;
    sp[i].style.opacity = style === 'type' ? (k > 0 ? 1 : 0) * (1 - out) : a; sp[i].style.transform = tf; vis += a;
  }
  el.style.display = vis > 0 ? 'block' : 'none';
}

// ---------- build
const G = {};
async function build() {
  FONT = new Font(await new Promise((res, rej) => new TTFLoader().load('assets/PlayfairBlack.ttf', res, null, rej)));
  await document.fonts.ready;
  const tex = await new THREE.TextureLoader().loadAsync(CFG.img); tex.colorSpace = THREE.SRGBColorSpace; tex.anisotropy = 8;
  G.ar = tex.image.width / tex.image.height;
  const PH = Math.min(2.4, 3.1 / Math.max(G.ar, .01)); G.PH = PH;
  G.cy = .18 + PH / 2;
  G.prod = productMesh(tex, PH); G.prod.position.set(0, G.cy, 0); scene.add(G.prod);
  G.word = text3d(CFG.word, P.word, 3.5); G.word.position.set(0, G.cy + PH * .42, -1.6); scene.add(G.word);
  // rings + shapes (motion everywhere)
  G.rings = [0, 1].map(i => { const m = new THREE.Mesh(new THREE.TorusGeometry(i ? 2.15 : 1.85, i ? .012 : .02, 12, 220),
    new THREE.MeshBasicMaterial({ color: i ? '#ffffff' : P.word, transparent: true, opacity: i ? .55 : .85 })); m.position.y = G.cy; scene.add(m); return m; });
  G.shapes = [];
  for (let i = 0; i < 9; i++) {
    const geo = i % 3 === 0 ? new THREE.SphereGeometry(.09, 24, 16) : i % 3 === 1 ? new THREE.BoxGeometry(.13, .13, .13) : new THREE.OctahedronGeometry(.11);
    const m = new THREE.Mesh(geo, lam(i % 2 ? P.word : '#ffffff', .25)); m.castShadow = true;
    m.userData = { a: i / 9 * 6.283, r: 1.9 + rand() * .7, y: (rand() - .5) * 2.2, sp: .35 + rand() * .3, s: .8 + rand() * .7 }; scene.add(m); G.shapes.push(m);
  }
  // particles: snow / sparkle / gold / bokeh (points) and confetti (instanced)
  const dt = dotTex(), N = 220, pos = new Float32Array(N * 3); G.pBase = [];
  for (let i = 0; i < N; i++) G.pBase.push([(rand() - .5) * 8, rand() * 7, -3 + rand() * 5, .3 + rand() * .7, rand() * 6.28]);
  const pg = new THREE.BufferGeometry(); pg.setAttribute('position', new THREE.BufferAttribute(pos, 3));
  const pcol = { snow: '#ffffff', sparkle: '#ffffff', gold: '#F2CC7A', bokeh: '#ffffff', confetti: '#ffffff', rays: '#FFF3C4' }[PFX];
  G.pts = new THREE.Points(pg, new THREE.PointsMaterial({ map: dt, color: pcol, size: PFX === 'snow' ? .14 : PFX === 'bokeh' ? .22 : .07, transparent: true, depthWrite: false, opacity: 0, sizeAttenuation: true }));
  scene.add(G.pts);
  const cg = new THREE.PlaneGeometry(.08, .13); G.conf = new THREE.InstancedMesh(cg, new THREE.MeshBasicMaterial({ side: THREE.DoubleSide }), 90);
  const cc = [P.word, '#ffffff', P.bg2, CFG.chip[1], '#F2CC7A']; G.confB = [];
  for (let i = 0; i < 90; i++) { G.conf.setColorAt(i, new THREE.Color(cc[i % cc.length])); G.confB.push([(rand() - .5) * 1.2, (rand() - .5) * 1.2, (rand() - .5) * 1.0, 2 + rand() * 3, rand() * 6.28, rand() * 6.28]); }
  G.conf.visible = false; scene.add(G.conf);
  // story props
  if (STORY === 'unbox') {
    G.box = new THREE.Group(); const bw = Math.max(1.5, Math.min(2.4, PH * G.ar * .9)), bh = Math.min(1.6, PH * .55);
    const body = new THREE.Mesh(new THREE.BoxGeometry(bw, bh, bw), lam(P.word, .12)); body.castShadow = true; G.box.add(body);
    const rib = lam('#ffffff', .2);
    [[.16, bh + .01, bw + .01], [bw + .01, bh + .01, .16]].forEach(([x, y, z]) => G.box.add(new THREE.Mesh(new THREE.BoxGeometry(x, y, z), rib)));
    G.lid = new THREE.Group(); const lid = new THREE.Mesh(new THREE.BoxGeometry(bw * 1.06, .28, bw * 1.06), lam(P.word, .16)); lid.castShadow = true; G.lid.add(lid);
    [[.17, .3, bw * 1.07], [bw * 1.07, .3, .17]].forEach(([x, y, z]) => G.lid.add(new THREE.Mesh(new THREE.BoxGeometry(x, y, z), rib)));
    [-1, 1].forEach(s => { const bow = new THREE.Mesh(new THREE.TorusGeometry(.2, .06, 12, 40), rib); bow.position.set(s * .18, .3, 0); bow.rotation.set(0, s * .5, s * .6); G.lid.add(bow); });
    G.lid.position.y = bh / 2 + .14; G.box.add(G.lid); G.box.userData.bh = bh; scene.add(G.box);
  }
  if (STORY === 'colour') {
    const cols = [CFG.chip[1], P.word, P.bg2, '#ffffff', P.ink, CFG.chip[1]];
    G.sw = cols.map(c => { const m = new THREE.Mesh(new THREE.BoxGeometry(.85, 1.25, .04), lam(c, .2)); m.castShadow = true; scene.add(m); return m; });
    G.portal = new THREE.Mesh(new THREE.TorusGeometry(1.45, .07, 20, 160), new THREE.MeshStandardMaterial({ color: '#E2B55E', metalness: 1, roughness: .25 }));
    G.disc = new THREE.Mesh(new THREE.CircleGeometry(1.42, 96), new THREE.MeshBasicMaterial({ color: CFG.chip[1] }));
    G.portal.position.set(0, G.cy, -.2); G.disc.position.set(0, G.cy, -.3); scene.add(G.portal, G.disc);
  }
  if (REVEAL === 'curtain') {
    const c = document.createElement('canvas'); c.width = 256; c.height = 8; const g = c.getContext('2d');
    for (let x = 0; x < 256; x++) { const v = .78 + .22 * Math.sin(x / 256 * Math.PI * 10); g.fillStyle = `rgba(0,0,0,${(1 - v).toFixed(3)})`; g.fillRect(x, 0, 1, 8); }
    const tx = new THREE.CanvasTexture(c);
    G.curt = [-1, 1].map(s => { const m = new THREE.Mesh(new THREE.PlaneGeometry(2.6, 6.5), new THREE.MeshLambertMaterial({ color: P.word, map: tx, emissive: new THREE.Color(P.word), emissiveIntensity: .25 }));
      m.position.set(s * 1.3, G.cy, 1.4); scene.add(m); return m; });
  }
  if (STORY === 'runway') {
    G.beams = [-1, 1].map(s => { const m = new THREE.Mesh(new THREE.ConeGeometry(1.4, 9, 48, 1, true),
      new THREE.MeshBasicMaterial({ color: '#ffffff', transparent: true, opacity: .08, blending: THREE.AdditiveBlending, depthWrite: false, side: THREE.DoubleSide }));
      m.position.set(s * 2.2, G.cy + 4, -1); scene.add(m); return m; });
  }
  ['kt1', 'kt2'].forEach((id, i) => setKT(id, INTRO[i], darkIntro ? '#ffffff' : P.word));
  if (STORY === 'unbox' || STORY === 'colour') { $('kt1').style.top = '250px'; $('kt2').style.top = '420px'; $('kt1').style.fontSize = $('kt2').style.fontSize = '150px'; }
  setKT('ktd2', STORY === 'drop' ? 'SOMETHING NEW IS COMING' : STORY === 'runway' ? 'NOW ON THE RUNWAY' : '', '#ffffff');
  setKT('kt3', STORY === 'unbox' ? "Why you'll love it" : STORY === 'colour' ? CFG.chip[0] : '', P.ink);
  window.READY = true;
}

const v3 = new THREE.Vector3();
function toScreen(u, v) {
  const { w, h } = G.prod.userData; v3.set((u - .5) * w, (.5 - v) * h, 0); G.prod.localToWorld(v3); v3.project(camera);
  return [(v3.x + 1) / 2 * W, (1 - v3.y) / 2 * H];
}

// ---------- frame
window.renderAt = (t) => {
  const rv = TL.rv, re = TL.rv + TL.rd, k = prog(t, rv, re);
  // ---- camera (always aimed at the product centre)
  let yaw = 0, dist = 9, ch = 0, look = G.cy;
  if (t < rv) {
    if (STORY === 'unbox') { yaw = SIGN * lerp(-.25, -.1, eInOut(prog(t, 0, rv))); dist = lerp(10.5, 9.4, eInOut(prog(t, 0, rv))); ch = 1.2; }
    else if (STORY === 'colour') { yaw = SIGN * .35 * Math.sin(t * .9); dist = 9.2; ch = .3; }
    else if (STORY === 'runway') { yaw = SIGN * -.15; dist = 10.2; ch = -.6; }
    else { yaw = SIGN * lerp(-.3, -.1, eInOut(prog(t, 0, rv))); dist = 9.8; ch = -.8; }
  } else if (t < TL.lens) { const p = prog(t, rv, TL.lens); yaw = SIGN * lerp(-.22, .22, eInOut(p)); dist = lerp(9.2, 8.0, eInOut(p)); ch = lerp(-.2, .2, p); }
  else if (t < TL.lensEnd) { const i = Math.min(2, Math.floor((t - TL.lens) / LE)), p = prog(t, TL.lens + i * LE, TL.lens + (i + 1) * LE);
    yaw = SIGN * (i % 2 ? .24 : -.24) * lerp(1, .75, eOut(p)); dist = lerp(7.3, 6.8, eOut(p)); ch = [.55, 0, -.5][i]; }
  else if (t < TL.shop) { const p = prog(t, TL.lensEnd, TL.shop); yaw = SIGN * lerp(.42, -.42, eInOut(p)); dist = 8.3; ch = (SIGN > 0 ? 1 : -1) * lerp(1.2, .6, eInOut(p)); }
  else { const p = prog(t, TL.shop, D); yaw = lerp(-.12, .12, eInOut(p)); dist = lerp(9.4, 10.0, eOut(p)); ch = .15; }
  camera.position.set(Math.sin(yaw) * dist, look + ch, Math.cos(yaw) * dist); camera.lookAt(0, look, 0);

  // ---- product reveal styles (ends exactly at the centre)
  const pr = G.prod, U = pr.material.userData; let px = 0, py = G.cy, pz = 0, sc = 1, rz = 0, ry = yaw * .7, vis = t >= rv;
  U.dis.value = 1.2; U.slice.value = 0; U.light.value = 1;
  switch (REVEAL) {
    case 'drop': py += (1 - eBounce(k)) * 4.8; { const land = pulse(t, rv + .36 * TL.rd, 10) + .5 * pulse(t, rv + .73 * TL.rd, 11); pr.scale.set(1 + land * .06, 1 - land * .08, 1); } break;
    case 'twirl': sc = Math.max(.001, eBack(k)); rz = (1 - eOut(k)) * Math.PI * 2; break;
    case 'slices': U.slice.value = (1 - eOut(k)) * 1.3; break;
    case 'dissolve': U.dis.value = lerp(-.05, 1.2, eInOut(k)); break;
    case 'portal': pz = lerp(-6, 0, eOut(k)); sc = lerp(.25, 1, eOut(k)); rz = (1 - eOut(k)) * .6; break;
    case 'rise': py = lerp(G.cy - G.PH * .55, G.cy, eBack(k)); sc = lerp(.35, 1, eOut(k)); break;
    case 'curtain': vis = true; U.light.value = lerp(.25, 1, prog(t, rv, rv + .5)); break;
    case 'slide': px = (1 - eOut(k)) * 5.5 * SIGN; ry += (1 - eOut(k)) * -.5 * SIGN; break;
  }
  if (STORY === 'runway' && t < re) U.light.value = Math.min(U.light.value, lerp(.35, 1, prog(t, re - .3, re)));
  const cutPop = [re, TL.lens, TL.lens + LE, TL.lens + 2 * LE, TL.lensEnd, TL.shop].reduce((m, c) => m + .05 * pulse(t, c) * (t > c ? 1 : 0), 0);
  const shopSc = t >= TL.shop ? lerp(1, .86, eOut(prog(t, TL.shop, TL.shop + .6))) : 1;
  if (REVEAL !== 'drop' || t > re) pr.scale.setScalar(sc * shopSc * (1 + .012 * Math.sin(t * 1.6) + cutPop));
  pr.visible = vis; pr.position.set(px, py, pz); pr.rotation.set(0, ry, rz);
  U.shine.value = t < re + 1.2 ? lerp(-.4, 1.8, eInOut(prog(t, re, re + 1.0))) : lerp(-.4, 1.8, eInOut(prog(t, TL.lensEnd + .2, TL.lensEnd + 1.1)));

  // ---- word, rings, shapes
  const wk = prog(t, re + .05, re + .6), we = eBack(wk);
  G.word.visible = wk > 0; G.word.rotation.x = (1 - we) * -1.5; G.word.scale.setScalar(Math.max(.001, G.word.userData.base * lerp(.7, 1, we)));
  const after = t > re - .2;
  G.rings.forEach((r, i) => { r.visible = after; r.rotation.set(1.28 + .1 * Math.sin(t * .7 + i), 0, t * (i ? -.5 : .35));
    r.scale.setScalar(Math.max(.001, eBack(prog(t, re + i * .15, re + .6 + i * .15))) * (1 + .06 * Math.sin(t * 2 + i))); });
  G.shapes.forEach(m => { const u = m.userData, a = u.a + t * u.sp; m.visible = after;
    m.position.set(Math.cos(a) * u.r, G.cy + u.y + .15 * Math.sin(t * 1.3 + u.a), Math.sin(a) * u.r); m.rotation.set(t * .8, t * 1.1, 0); m.scale.setScalar(u.s * eOut(prog(t, re, re + .6))); });
  floor.material.opacity = .24;

  // ---- story props
  if (G.box) { // drop, shake, lid pops, box sinks away while the product rises
    const bh = G.box.userData.bh, land = eBounce(prog(t, 0, 1.0)), shake = prog(t, 1.05, 1.75) * (1 - prog(t, 1.7, 1.8));
    const sink = eInOut(prog(t, 2.05, 2.9));
    G.box.visible = t < 2.95; G.box.position.set(0, lerp(6, G.cy - G.PH * .5 + bh / 2, land) - sink * 3.2, 0);
    G.box.rotation.set(0, SIGN * .5 + .1 * Math.sin(t), .07 * Math.sin(t * 38) * shake);
    const lk = eOut(prog(t, 1.75, 2.35)); G.lid.position.set(SIGN * lk * 2.4, bh / 2 + .14 + lk * 3.2, lk * 1.2); G.lid.rotation.set(lk * -1.2, 0, SIGN * lk * 1.4);
  }
  if (G.sw) { // swatches fan, collapse into a colour disc, disc turns into a portal
    const fan = eBack(prog(t, .1, .9)), col = eInOut(prog(t, 1.65, 2.2));
    G.sw.forEach((m, i) => { const a = i / G.sw.length * 6.283 + t * .9 * SIGN, r = 1.55 * fan * (1 - col);
      m.position.set(Math.cos(a) * r, G.cy + Math.sin(a) * r * .9, .2 * Math.sin(a)); m.rotation.set(0, a * .3, a + Math.PI / 2 * (1 - col)); m.scale.setScalar(Math.max(.001, fan * (1 - col * .9))); m.visible = t < 2.25; });
    const dk = eBack(prog(t, 1.95, 2.35)) * (1 - eInOut(prog(t, 3.0, 3.5)));
    G.disc.scale.setScalar(Math.max(.001, dk)); G.portal.scale.setScalar(Math.max(.001, dk)); G.portal.rotation.z = t * 1.5;
    G.disc.visible = G.portal.visible = dk > .01;
  }
  if (G.curt) G.curt.forEach((m, i) => { const o = eInOut(prog(t, rv, re)); m.position.x = (i ? 1 : -1) * (1.3 + o * 2.6); m.visible = o < .99; m.rotation.y = (i ? -1 : 1) * o * .3; });
  if (G.beams) G.beams.forEach((m, i) => { m.visible = t < re + 1.5; m.rotation.z = (i ? -1 : 1) * (.35 + .25 * Math.sin(t * 2.2 + i * 2)); m.material.opacity = .1 * (1 - prog(t, re + .5, re + 1.5)); });
  // particles
  const pp = G.pts.geometry.attributes.position.array, pOn = PFX === 'bokeh' ? after : (STORY === 'season' ? 1 : after);
  G.pBase.forEach(([x, y, z, sp, ph], i) => { let yy = y, xx = x;
    if (PFX === 'snow') { yy = ((y - t * sp * .9) % 7 + 7) % 7; xx = x + .25 * Math.sin(t + ph); }
    else if (PFX === 'gold' || PFX === 'sparkle' || PFX === 'rays') { yy = y + .2 * Math.sin(t * sp + ph); }
    else { yy = y + .15 * Math.sin(t * .4 + ph); }
    pp[i * 3] = xx; pp[i * 3 + 1] = yy; pp[i * 3 + 2] = z; });
  G.pts.geometry.attributes.position.needsUpdate = true;
  const tw = PFX === 'sparkle' || PFX === 'gold' ? .55 + .45 * Math.sin(t * 6) : 1;
  G.pts.material.opacity = (PFX === 'confetti' ? 0 : (PFX === 'bokeh' ? .35 : .85)) * tw * (pOn ? 1 : 0) * (STORY === 'season' ? 1 : eOut(prog(t, re, re + .5)));
  const burst = STORY === 'unbox' ? re - .3 : (PFX === 'confetti' ? .05 : -9);
  G.conf.visible = PFX === 'confetti' && t > burst && t < burst + 3.4;
  if (G.conf.visible) { const m4 = new THREE.Matrix4(), q = new THREE.Quaternion(), e = new THREE.Euler(); const ct = t - burst;
    G.confB.forEach(([vx, vy, vz, sp, a, b], i) => { const x = vx * sp * ct, y = G.cy + vy * sp * ct * 1.2 + 2.2 * ct - 2.6 * ct * ct * .9, z = vz * sp * ct;
      e.set(a + ct * 6, b + ct * 4, 0); q.setFromEuler(e); m4.compose(new THREE.Vector3(x, y, z), q, new THREE.Vector3(1, 1, 1)); G.conf.setMatrixAt(i, m4); });
    G.conf.instanceMatrix.needsUpdate = true; }
  scene.updateMatrixWorld(true); camera.updateMatrixWorld(true);

  // ---------- overlay
  const introEnd = rv + .1;
  // darkness for drop/runway intros
  const dk = darkIntro ? 1 - eInOut(prog(t, re - .4, re + .1)) : 0;
  const spot = lerp(10, 32, eOut(prog(t, 0, rv)));
  $('dark').style.background = dk > 0 ? `radial-gradient(ellipse ${spot}% ${spot * .75}% at 50% ${STORY === 'runway' ? 40 : 50}%, rgba(0,0,0,${.3 * dk}) 0%, rgba(0,0,0,${.92 * dk}) 70%)` : 'none';
  st($('ktd1'), darkIntro ? eOut(prog(t, .1, .6)) * (1 - prog(t, rv - .2, rv)) : 0);
  animKT('ktd2', t, .35, rv, 'slide');
  // big intro words (season / unbox / colour)
  if (!darkIntro) { animKT('kt1', t, .15, introEnd); animKT('kt2', t, .45, introEnd); } else { $('kt1').style.display = $('kt2').style.display = 'none'; }
  $('rays').style.opacity = PFX === 'rays' ? .8 * (1 - prog(t, TL.shop - .3, TL.shop)) : 0; $('rays').style.transform = `rotate(${t * 6}deg)`;
  const mk = eOut(prog(t, re - .2, re + .3)); st($('mast'), mk); $('rule').style.opacity = .45 * mk;
  // copy / story caption
  const kt3 = (STORY === 'unbox' || STORY === 'colour');
  const showCopy = (t > re && t < TL.lens && !kt3) || (t >= TL.lensEnd && t < TL.shop);
  const ca = t < TL.lens ? eOut(prog(t, re + .4, re + .9)) * (1 - prog(t, TL.lens - .3, TL.lens)) : eOut(prog(t, TL.lensEnd + .3, TL.lensEnd + .8)) * (1 - prog(t, TL.shop - .3, TL.shop));
  st($('copy'), showCopy ? ca : 0, `translateY(${(1 - ca) * 40}px)`);
  if (kt3) animKT('kt3', t, re + .3, TL.lens); else $('kt3').style.display = 'none';
  // details: lens or card
  let li = Math.floor((t - TL.lens) / LE); const inD = t >= TL.lens && li < 3;
  ['lens', 'lenslab', 'dcard'].forEach(id => st($(id), 0)); $('lnsvg').style.opacity = 0;
  if (inD) {
    const lt = (t - TL.lens) - li * LE, kk = eOut(prog(lt, 0, .35)) * (1 - prog(lt, LE - .25, LE));
    const [u, v, label] = DET[li], [x, y] = toScreen(u, v);
    const onH = toScreen(.5, 1)[1] - toScreen(.5, 0)[1], left = u > .5 ? 0 : 1;
    if (DSTYLE === 'card') {
      const cw = 560, cx = left ? 110 : W - 110 - cw, cy = clamp(y - cw / 2, 260, 1180), zoom = 2.6, sh = zoom * onH, bw = sh * G.ar;
      const el = $('dcard'); el.style.left = cx + 'px'; el.style.top = cy + 'px'; el.style.backgroundSize = `${bw}px ${sh}px`;
      el.style.backgroundPosition = `${cw / 2 - u * bw}px ${cw / 2 - v * sh}px`; el.style.backgroundColor = P.bg2; $('dlab').textContent = label;
      st(el, kk, `translateX(${(1 - eOut(kk)) * (left ? -260 : 260)}px) rotate(${(left ? -3 : 3) * kk}deg)`);
      $('lnl').setAttribute('x1', x); $('lnl').setAttribute('y1', y); $('lnl').setAttribute('x2', lerp(x, cx + cw / 2, kk)); $('lnl').setAttribute('y2', lerp(y, cy + cw / 2, kk));
    } else {
      const lx = left ? 130 : W - 130 - 440, ly = clamp(y - 220, 260, 1240), zoom = 2.3, sh = zoom * onH, bw = sh * G.ar;
      const el = $('lens'); el.style.left = lx + 'px'; el.style.top = ly + 'px'; el.style.backgroundSize = `${bw}px ${sh}px`;
      el.style.backgroundPosition = `${220 - u * bw}px ${220 - v * sh}px`; el.style.backgroundColor = P.bg2; st(el, kk, `scale(${lerp(.6, 1, eBack(clamp(kk)))})`);
      const lab = $('lenslab'); lab.textContent = label; lab.style.left = lx + 'px'; lab.style.top = (ly + 470) + 'px'; st(lab, kk);
      $('lnl').setAttribute('x1', x); $('lnl').setAttribute('y1', y); $('lnl').setAttribute('x2', lerp(x, lx + 220, kk)); $('lnl').setAttribute('y2', lerp(y, ly + 220, kk));
    }
    $('lnd').setAttribute('cx', x); $('lnd').setAttribute('cy', y); $('lnsvg').style.opacity = kk;
  }
  // colour chip
  const ck = prog(t, TL.lensEnd + .5, TL.lensEnd + 1.0);
  $('chip').style.left = (SIGN > 0 ? W - 130 - 210 : 130) + 'px'; $('chip').style.top = '300px';
  st($('chip'), t >= TL.lensEnd + .5 && t < TL.shop ? 1 - prog(t, TL.shop - .3, TL.shop) : 0, `perspective(900px) rotateY(${lerp(95, 0, eBack(ck))}deg) rotate(${SIGN * 5}deg)`);
  // shop
  $('shop').style.display = t >= TL.shop ? 'block' : 'none';
  if (t >= TL.shop) {
    [['s1', .1], ['s2', .35], ['s3', .7], ['s4', 1.0]].forEach(([id, d]) => { const kq = eOut(prog(t, TL.shop + d, TL.shop + d + .45)); st($(id), kq, `translateY(${(1 - kq) * 36}px)`); });
    const pk = eBack(prog(t, TL.shop + .7, TL.shop + 1.1));
    $('s3').firstElementChild.style.transform = `scale(${Math.max(0, pk) * (t > TL.shop + 1.3 ? 1 + .03 * Math.sin((t - TL.shop) * Math.PI * 4) : 1)})`;
  }
  // ---------- transitions: flash on reveal (dark intros), runway camera flashes, styled cuts into details & shop
  let fl = darkIntro ? .85 * pulse(t, re - .25, 7) : 0;
  if (STORY === 'runway' && t < re) [.35, .62, .8, 1.05, 1.22].forEach(c => fl = Math.max(fl, .55 * pulse(t, c, 26)));
  $('flash').style.opacity = fl;
  ['wipe', 'iris', 'bars'].forEach(id => $(id).style.opacity = 0);
  [[TL.lens, TR[0], 1], [TL.shop, TR[1], -1]].forEach(([c, sty, dir]) => {
    const q = prog(t, c - .28, c + .28); if (q <= 0 || q >= 1) return;
    if (sty === 'wipe') { const wp = $('wipe'); wp.style.opacity = 1; wp.style.background = `linear-gradient(${dir > 0 ? 100 : 80}deg, transparent 0%, ${P.word} 18%, ${P.word} 82%, transparent 100%)`;
      wp.style.transform = `translateX(${dir * lerp(-110, 110, eInOut(q))}%) skewX(-12deg)`; }
    else if (sty === 'iris') { const r = q < .5 ? eInOut(q * 2) * 150 : (1 - eInOut((q - .5) * 2)) * 150; const el = $('iris'); el.style.opacity = 1; el.style.clipPath = `circle(${r}% at 50% 50%)`; }
    else { const el = $('bars'); el.style.opacity = 1; [...el.children].forEach((b, i) => { const s = q < .5 ? eInOut(q * 2) : 1 - eInOut((q - .5) * 2);
      b.style.transform = `translateX(${(i % 2 ? 1 : -1) * (1 - s) * 105}%)`; }); }
  });
  const blur = [TL.lens + LE, TL.lens + 2 * LE, TL.lensEnd].reduce((m, c) => Math.max(m, 14 * pulse(t, c, 11)), 0) + (REVEAL === 'slide' ? 10 * Math.sin(Math.PI * k) * (k < 1 ? 1 : 0) : 0);
  canvas.style.filter = blur > .3 ? `blur(${blur.toFixed(1)}px)` : 'none';
  renderer.render(scene, camera);
};
build().then(() => window.renderAt(0)).catch(e => { window.ERR = String(e && e.stack || e); });
