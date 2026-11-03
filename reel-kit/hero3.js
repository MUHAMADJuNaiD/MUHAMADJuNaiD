// Outlook Styles – Story Reel v3 (4:5, 1728x2160 @30fps). One product, one colour world, product ALWAYS centred.
// Story: 1 Tease (dark, silhouette)  2 Lights on (reveal + 3D word)  3 Details (magnifying lens on the HD photo)
//        4 Colour & name  5 Shop (website live, Instagram, DM, delivery). Deterministic: window.renderAt(t).
import * as THREE from 'three';
import { TTFLoader } from 'three/addons/loaders/TTFLoader.js';
import { Font } from 'three/addons/loaders/FontLoader.js';
import { TextGeometry } from 'three/addons/geometries/TextGeometry.js';
import { RoomEnvironment } from 'three/addons/environments/RoomEnvironment.js';

const CFG = window.REEL_CFG || {
  img: 'products/0.webp', folder: 'tops-winterwear', dur: 14,
  pal: { bg: '#D2E86A', bg2: '#EEF8B4', word: '#5A2BD6', ink: '#1B1530', btnink: '#F2EEFF' },
  cat: 'WINTERWEAR', word: 'GLOSS', kick: 'THE GLOSS PUFFER', head: 'Shine on, <b>winter.</b>',
  desc: 'High-shine quilted puffer with a stand collar.', chip: ['Gloss Black', '#121214'], calls: [],
  brand: { website: '', instagram: '@outlook_.styles', address: 'Lahore, Pakistan' },
};
const W = 1728, H = 2160, P = CFG.pal, D = CFG.dur || 14, B = CFG.brand || {};
// Default detail points per category (uv on the product photo) — used when a reel has no "calls"
const DEF = {
  'tops-winterwear': [[.5, .1, 'NECKLINE'], [.38, .45, 'FABRIC'], [.5, .9, 'HEM']],
  'blouses-shirts': [[.5, .1, 'COLLAR'], [.42, .45, 'FABRIC'], [.8, .82, 'CUFFS']],
  'bottoms': [[.5, .04, 'WAISTBAND'], [.38, .42, 'FABRIC'], [.32, .95, 'HEM']],
  'coords-dresses': [[.5, .1, 'NECKLINE'], [.45, .42, 'PRINT & FABRIC'], [.5, .9, 'LENGTH']],
  'eastern': [[.5, .14, 'EMBROIDERY'], [.42, .45, 'FABRIC'], [.5, .93, 'FINISHING']],
  'handbags': [[.5, .12, 'HANDLE'], [.5, .58, 'FINISH'], [.25, .78, 'HARDWARE']],
  'flats-jewellery': [[.35, .45, 'DETAIL'], [.62, .3, 'FINISH'], [.5, .78, 'COMFORT']],
};
const SRC = (CFG.calls && CFG.calls.length) ? CFG.calls : (CFG.details && CFG.details.length ? CFG.details : null);
const CALLS = (SRC ? SRC.map(c => [c.uv[0], c.uv[1], c.label.replace(/<br>/g, ' ')]) : (DEF[CFG.folder] || DEF['tops-winterwear'])).slice(0, 3);
// timeline (seconds)
const T = { tease: 0, lights: 1.5, word: 2.1, copy: 2.7, lens: 4.3, lensEach: 1.25, colour: 8.2, shop: 10.4 };
T.lensEnd = T.lens + CALLS.length * T.lensEach;

const clamp = (x, a = 0, b = 1) => Math.min(b, Math.max(a, x));
const prog = (t, a, b) => clamp((t - a) / (b - a));
const eOut = x => 1 - Math.pow(1 - x, 3);
const eInOut = x => x < .5 ? 4 * x * x * x : 1 - Math.pow(-2 * x + 2, 3) / 2;
const eBack = x => { const c1 = 1.70158, c3 = c1 + 1; return 1 + c3 * Math.pow(x - 1, 3) + c1 * Math.pow(x - 1, 2); };
const lerp = (a, b, x) => a + (b - a) * x;
const rand = (s => () => (s = (s * 16807) % 2147483647) / 2147483647)(7);

// ---------- renderer
const canvas = document.getElementById('c');
const renderer = new THREE.WebGLRenderer({ canvas, antialias: true, preserveDrawingBuffer: true });
renderer.setPixelRatio(1); renderer.setSize(W, H, false);
renderer.outputColorSpace = THREE.SRGBColorSpace; renderer.toneMapping = THREE.NoToneMapping;
renderer.shadowMap.enabled = true; renderer.shadowMap.type = THREE.PCFSoftShadowMap;
const scene = new THREE.Scene();
scene.environment = new THREE.PMREMGenerator(renderer).fromScene(new RoomEnvironment(), .04).texture;
const camera = new THREE.PerspectiveCamera(30, W / H, .1, 100);
scene.add(new THREE.HemisphereLight(0xffffff, 0x444444, .25));
const key = new THREE.DirectionalLight(0xffffff, 1.0);
key.position.set(3, 9, 7); key.castShadow = true; key.shadow.mapSize.set(2048, 2048); key.shadow.radius = 10; key.shadow.bias = -.0005;
Object.assign(key.shadow.camera, { left: -5, right: 5, top: 6, bottom: -3, near: 1, far: 30 });
scene.add(key);
const floor = new THREE.Mesh(new THREE.PlaneGeometry(60, 60), new THREE.ShadowMaterial({ opacity: .24 }));
floor.rotation.x = -Math.PI / 2; floor.receiveShadow = true; scene.add(floor);
(() => { // full-bleed background: palette gradient + soft floor glow + vignette
  const c = document.createElement('canvas'); c.width = 864; c.height = 1080; const g = c.getContext('2d');
  let gr = g.createRadialGradient(432, 470, 0, 432, 520, 820); gr.addColorStop(0, P.bg2); gr.addColorStop(.6, P.bg); gr.addColorStop(1, P.bg);
  g.fillStyle = gr; g.fillRect(0, 0, 864, 1080);
  g.save(); g.translate(432, 870); g.scale(1, .22); gr = g.createRadialGradient(0, 0, 0, 0, 0, 420);
  gr.addColorStop(0, 'rgba(255,255,255,.35)'); gr.addColorStop(1, 'rgba(255,255,255,0)'); g.fillStyle = gr; g.beginPath(); g.arc(0, 0, 420, 0, 7); g.fill(); g.restore();
  gr = g.createRadialGradient(432, 540, 330, 432, 540, 820); gr.addColorStop(0, 'rgba(0,0,0,0)'); gr.addColorStop(1, 'rgba(0,0,0,.24)'); g.fillStyle = gr; g.fillRect(0, 0, 864, 1080);
  const t = new THREE.CanvasTexture(c); t.colorSpace = THREE.SRGBColorSpace; scene.background = t;
})();

// ---------- builders
let FONT;
function text3d(str, color, width) {
  const geo = new TextGeometry(str, { font: FONT, size: 1, depth: .34, curveSegments: 10, bevelEnabled: true, bevelThickness: .05, bevelSize: .022, bevelSegments: 4 });
  geo.computeBoundingBox(); const b = geo.boundingBox;
  geo.translate(-(b.max.x + b.min.x) / 2, -(b.max.y + b.min.y) / 2, -(b.max.z + b.min.z) / 2);
  const m = new THREE.Mesh(geo, new THREE.MeshLambertMaterial({ color, emissive: new THREE.Color(color), emissiveIntensity: .1 })); m.castShadow = true;
  const g = new THREE.Group(); g.add(m); g.scale.setScalar(width / (b.max.x - b.min.x)); g.userData.base = g.scale.x; return g;
}
function productMesh(tex, h) {
  const w = h * tex.image.width / tex.image.height;
  const geo = new THREE.PlaneGeometry(w, h); geo.translate(0, h / 2, 0);
  const mat = new THREE.MeshBasicMaterial({ map: tex, transparent: true, alphaTest: .02, side: THREE.DoubleSide, toneMapped: false });
  mat.userData = { shine: { value: -1 }, light: { value: 0 } };
  mat.onBeforeCompile = sh => {
    sh.uniforms.uShine = mat.userData.shine; sh.uniforms.uLight = mat.userData.light;
    sh.fragmentShader = 'uniform float uShine; uniform float uLight;\n' + sh.fragmentShader.replace('#include <map_fragment>', `#include <map_fragment>
      diffuseColor.rgb *= mix(0.04, 1.0, uLight);
      float d = (vMapUv.x * .8 + (1.0 - vMapUv.y) * .6) - uShine;
      diffuseColor.rgb += (exp(-d * d * 260.0) * .45 + exp(-d * d * 30.0) * .08) * diffuseColor.a * uLight;`);
  };
  const m = new THREE.Mesh(geo, mat); m.castShadow = true;
  m.customDepthMaterial = new THREE.MeshDepthMaterial({ depthPacking: THREE.RGBADepthPacking, map: tex, alphaTest: .5 });
  m.userData = { w, h }; return m;
}

// ---------- overlay
const ov = document.getElementById('ov'); ov.style.color = P.ink; ov.style.setProperty('--word', P.word);
const site = (B.website || '').replace(/^https?:\/\//, '').replace(/\/$/, '');
const plain = s => s.replace(/<[^>]+>/g, '');
ov.innerHTML = `
 <div class="mast" id="mast"><div class="side">NEW IN</div><div class="brand">OUTLOOK STYLES</div><div class="side r"><span>${CFG.cat}</span></div></div>
 <div class="rule" id="rule"></div>
 <div class="copy" id="copy"><div class="kick">${CFG.kick}</div><div class="head">${CFG.head}</div><div class="desc">${CFG.desc}</div></div>
 <svg id="lnsvg" width="${W}" height="${H}" style="position:absolute;left:0;top:0"><line id="lnl" stroke="${P.ink}" stroke-width="4"/><circle id="lnd" r="14" fill="${P.word}" stroke="#fff" stroke-width="5"/></svg>
 <div class="lens" id="lens" style="background-image:url(${CFG.img})"></div>
 <div class="lenslab" id="lenslab"></div>
 <div class="chip" id="chip"><div class="sw" style="background:${CFG.chip[1]}"></div><div class="t1">OUTLOOK STYLES</div><div class="t2">${CFG.chip[0]}</div></div>
 <div id="shop" style="position:absolute;inset:0">
   <div class="center" id="s1" style="top:1700px;font-weight:800;font-size:26px;letter-spacing:.42em">${site ? 'NOW LIVE ON OUR WEBSITE' : 'SHOP NOW ON INSTAGRAM'}</div>
   <div class="center" id="s2" style="top:1756px"><span class="browser"><span class="dots"><i style="background:#FF5F57"></i><i style="background:#FEBC2E"></i><i style="background:#28C840"></i></span>${site || B.instagram || '@outlook_.styles'}</span></div>
   <div class="center" id="s3" style="top:1900px"><span class="pill" style="background:${P.word};color:${P.btnink}">DM TO ORDER &nbsp;&rarr;</span>
     <span style="display:inline-block;margin-left:26px;font-weight:800;font-size:30px;letter-spacing:.12em;vertical-align:middle">${site ? (B.instagram || '@outlook_.styles') : ''}</span></div>
   <div class="center" id="s4" style="top:2046px;font-weight:700;font-size:21px;letter-spacing:.3em">DELIVERY ALL OVER PAKISTAN${B.address ? ' &middot; ' + B.address.toUpperCase() : ''}</div>
 </div>
 <div id="dark"></div>
 <div id="flash" style="position:absolute;inset:0;background:#fff;opacity:0"></div>
 <div id="wipe" style="position:absolute;left:-30%;top:-10%;width:160%;height:120%;opacity:0"></div>
 <div class="center" id="tease" style="top:1760px;color:#fff;font-weight:700;font-size:30px;letter-spacing:.5em">SOMETHING NEW IS COMING</div>
 <div class="center" id="tease2" style="top:300px;color:#fff;font-weight:700;font-size:40px;letter-spacing:.42em;margin-right:-.42em">OUTLOOK STYLES</div>`;
const $ = id => document.getElementById(id);
const st = (el, o, tf) => { el.style.opacity = o; if (tf !== undefined) el.style.transform = tf; };
$('copy').querySelector('b') && ($('copy').querySelector('b').style.color = P.word);

// ---------- build
const G = {};
async function build() {
  FONT = new Font(await new Promise((res, rej) => new TTFLoader().load('assets/PlayfairBlack.ttf', res, null, rej)));
  await document.fonts.ready;
  const tex = await new THREE.TextureLoader().loadAsync(CFG.img); tex.colorSpace = THREE.SRGBColorSpace; tex.anisotropy = 8;
  G.ar = tex.image.width / tex.image.height;
  // product height: 54% of frame for tall items, narrower for wide ones (keeps it inside the frame)
  const PH = Math.min(2.4, 3.1 / Math.max(G.ar, .01));
  G.prod = productMesh(tex, PH); G.prod.position.y = .18; scene.add(G.prod);
  G.cy = .18 + PH / 2;                                         // product centre = camera target = frame centre
  G.word = text3d(CFG.word, P.word, 3.5); G.word.position.set(0, G.cy + PH * .42, -1.6); scene.add(G.word);
  const bt = (() => { const c = document.createElement('canvas'); c.width = c.height = 128; const g = c.getContext('2d');
    const gr = g.createRadialGradient(64, 64, 0, 64, 64, 64); gr.addColorStop(0, 'rgba(255,255,255,1)'); gr.addColorStop(.45, 'rgba(255,255,255,.5)'); gr.addColorStop(1, 'rgba(255,255,255,0)');
    g.fillStyle = gr; g.fillRect(0, 0, 128, 128); return new THREE.CanvasTexture(c); })();
  G.bokeh = [];
  for (let i = 0; i < 22; i++) {
    const front = i < 5, s = new THREE.Sprite(new THREE.SpriteMaterial({ map: bt, color: i % 3 ? '#ffffff' : P.word, transparent: true, depthWrite: false, opacity: front ? .16 : .3 }));
    s.userData = { x: (rand() - .5) * (front ? 4 : 7), y: rand() * 4.5, z: front ? 2 + rand() * 1.2 : -3 - rand() * 4, s: front ? .45 + rand() * .45 : .1 + rand() * .2, ph: rand() * 6.28 };
    scene.add(s); G.bokeh.push(s);
  }
  G.rings = [0, 1].map(i => { const m = new THREE.Mesh(new THREE.TorusGeometry(i ? 2.15 : 1.85, i ? .012 : .02, 12, 220),
    new THREE.MeshBasicMaterial({ color: i ? '#ffffff' : P.word, transparent: true, opacity: i ? .55 : .85 })); m.position.y = G.cy; scene.add(m); return m; });
  G.shapes = [];
  for (let i = 0; i < 9; i++) {
    const geo = i % 3 === 0 ? new THREE.SphereGeometry(.09, 24, 16) : i % 3 === 1 ? new THREE.BoxGeometry(.13, .13, .13) : new THREE.OctahedronGeometry(.11);
    const m = new THREE.Mesh(geo, new THREE.MeshLambertMaterial({ color: i % 2 ? P.word : '#ffffff', emissive: new THREE.Color(i % 2 ? P.word : '#ffffff'), emissiveIntensity: .25 }));
    m.castShadow = true; m.userData = { a: i / 9 * 6.283, r: 1.9 + rand() * .7, y: (rand() - .5) * 2.2, sp: .35 + rand() * .3, s: .8 + rand() * .7 };
    scene.add(m); G.shapes.push(m);
  }
  window.READY = true;
}

const v3 = new THREE.Vector3();
function toScreen(u, v) {
  const { w, h } = G.prod.userData; v3.set((u - .5) * w, (1 - v) * h, 0); G.prod.localToWorld(v3); v3.project(camera);
  return [(v3.x + 1) / 2 * W, (1 - v3.y) / 2 * H];
}

window.renderAt = (t) => {
  // ---- camera shots (cuts hidden by flash / wipe / whip). Camera ALWAYS looks at the product centre.
  let yaw, dist, ch;
  if (t < T.lights) { const p = prog(t, 0, T.lights); yaw = lerp(-.35, -.12, eInOut(p)); dist = 9.6; ch = -.95; }
  else if (t < T.lens) { const p = prog(t, T.lights, T.lens); yaw = lerp(-.2, .2, eInOut(p)); dist = lerp(9.0, 8.0, eInOut(p)); ch = lerp(-.25, .15, p); }
  else if (t < T.lensEnd) { const i = Math.min(CALLS.length - 1, Math.floor((t - T.lens) / T.lensEach)), p = prog(t, T.lens + i * T.lensEach, T.lens + (i + 1) * T.lensEach);
    yaw = (i % 2 ? .24 : -.24) * lerp(1, .75, eOut(p)); dist = lerp(7.3, 6.8, eOut(p)); ch = [.55, 0, -.5][i] || 0; }
  else if (t < T.shop) { const p = prog(t, T.lensEnd, T.shop); yaw = lerp(.42, -.42, eInOut(p)); dist = 8.3; ch = lerp(1.25, .6, eInOut(p)); }
  else { const p = prog(t, T.shop, D); yaw = lerp(-.12, .12, eInOut(p)); dist = lerp(9.4, 10.0, eOut(p)); ch = .15; }
  camera.position.set(Math.sin(yaw) * dist, G.cy + ch, Math.cos(yaw) * dist); camera.lookAt(0, G.cy, 0);
  // ---- product: spin-in on "lights on", follows the camera, pops on every cut
  const L = eOut(prog(t, T.lights, T.lights + .6));
  G.prod.material.userData.light.value = L;
  G.prod.material.userData.shine.value = t < T.lights + 1.6 ? lerp(-.4, 1.8, eInOut(prog(t, T.lights + .5, T.lights + 1.5)))
                                       : lerp(-.4, 1.8, eInOut(prog(t, T.lensEnd + .2, T.lensEnd + 1.1)));
  const spin = t < T.lights ? 0 : (1 - eBack(prog(t, T.lights, T.lights + .75))) * -.9;
  const cutPop = [T.lights, T.lens, T.lens + T.lensEach, T.lens + 2 * T.lensEach, T.lensEnd, T.shop].reduce((m, c) => m + .05 * Math.exp(-Math.pow((t - c) * 9, 2)) * (t > c ? 1 : 0), 0);
  const sc = lerp(.82, 1, eOut(prog(t, T.lights, T.lights + .8))) * (t >= T.shop ? lerp(1, .86, eOut(prog(t, T.shop, T.shop + .6))) : 1);
  G.prod.scale.setScalar(sc * (1 + .012 * Math.sin(t * 1.6) + cutPop));
  G.prod.rotation.y = (t < T.lights ? yaw * .95 + .08 * Math.sin(t * 1.2) : yaw * .7) + spin;
  // ---- rings + floating shapes orbit the product (motion in every frame)
  G.rings.forEach((r, i) => { r.visible = t > T.lights; r.rotation.set(1.28 + .1 * Math.sin(t * .7 + i), 0, t * (i ? -.5 : .35));
    r.scale.setScalar(Math.max(.001, eBack(prog(t, T.lights + .1 + i * .15, T.lights + .7 + i * .15))) * (1 + .06 * Math.sin(t * 2 + i))); });
  G.shapes.forEach(m => { const u = m.userData, a = u.a + t * u.sp; m.visible = t > T.lights;
    m.position.set(Math.cos(a) * u.r, G.cy + u.y + .15 * Math.sin(t * 1.3 + u.a), Math.sin(a) * u.r); m.rotation.set(t * .8, t * 1.1, 0);
    m.scale.setScalar(u.s * eOut(prog(t, T.lights + .2, T.lights + .8))); });
  // 3D word flips up behind once the lights are on
  const wk = prog(t, T.word, T.word + .55), we = eBack(wk);
  G.word.visible = wk > 0; G.word.rotation.x = (1 - we) * -1.5; G.word.scale.setScalar(Math.max(.001, G.word.userData.base * lerp(.7, 1, we)));
  G.bokeh.forEach(b => { const u = b.userData; b.position.set(u.x + .12 * Math.sin(t * .5 + u.ph), u.y + .2 * Math.sin(t * .4 + u.ph), u.z); b.scale.setScalar(u.s); b.material.opacity = (u.z > 0 ? .16 : .3) * L; });
  floor.material.opacity = .24 * L;
  scene.updateMatrixWorld(true); camera.updateMatrixWorld(true);

  // ---------- overlay
  // 1 tease: darkness with a spotlight on the silhouette
  const dk = 1 - eInOut(prog(t, T.lights, T.lights + .5));
  const spot = lerp(8, 30, eOut(prog(t, 0, T.lights)));
  $('dark').style.background = `radial-gradient(ellipse ${spot}% ${spot * .75}% at 50% 50%, rgba(0,0,0,${.35 * dk}) 0%, rgba(0,0,0,${.93 * dk}) 70%)`;
  st($('tease'), eOut(prog(t, .3, .8)) * (1 - prog(t, T.lights - .2, T.lights)));
  st($('tease2'), eOut(prog(t, .1, .6)) * (1 - prog(t, T.lights - .2, T.lights)));
  // 2 masthead + copy
  const mk = eOut(prog(t, T.lights + .2, T.lights + .7));
  st($('mast'), mk); $('rule').style.opacity = .45 * mk;
  const showCopy = (t < T.lens) || (t >= T.colour && t < T.shop);
  const ca = t < T.lens ? eOut(prog(t, T.copy, T.copy + .5)) * (1 - prog(t, T.lens - .3, T.lens))
                        : eOut(prog(t, T.colour + .3, T.colour + .8)) * (1 - prog(t, T.shop - .3, T.shop));
  st($('copy'), showCopy ? ca : 0, `translateY(${(1 - ca) * 40}px)`);
  // 3 details: magnifying lens visits each point
  let li = Math.floor((t - T.lens) / T.lensEach); const inLens = t >= T.lens && li < CALLS.length;
  if (inLens) {
    const lt = (t - T.lens) - li * T.lensEach, k = eOut(prog(lt, 0, .35)) * (1 - prog(lt, T.lensEach - .25, T.lensEach));
    const [u, v, label] = CALLS[li], [px, py] = toScreen(u, v);
    const left = u > .5 ? 0 : 1, lx = left ? 130 : W - 130 - 440, ly = clamp(py - 220, 260, 1240);
    const zoom = 2.3, onScreenH = (toScreen(.5, 1)[1] - toScreen(.5, 0)[1]), scale = zoom * onScreenH; // px per image-height
    const bw = scale * G.ar, bx = 220 - u * bw, by = 220 - v * scale;
    const L2 = $('lens'); L2.style.left = lx + 'px'; L2.style.top = ly + 'px'; L2.style.backgroundSize = `${bw}px ${scale}px`;
    L2.style.backgroundPosition = `${bx}px ${by}px`; L2.style.backgroundColor = P.bg2;
    st(L2, k, `scale(${lerp(.6, 1, eBack(clamp(k)))})`);
    const lab = $('lenslab'); lab.textContent = label; lab.style.left = lx + 'px'; lab.style.top = (ly + 470) + 'px'; st(lab, k);
    const cx = lx + 220, cy = ly + 220, ex = lerp(px, cx + (left ? 220 : -220) * .0, 1);
    $('lnl').setAttribute('x1', px); $('lnl').setAttribute('y1', py); $('lnl').setAttribute('x2', lerp(px, cx, k)); $('lnl').setAttribute('y2', lerp(py, cy, k));
    $('lnd').setAttribute('cx', px); $('lnd').setAttribute('cy', py);
    $('lnsvg').style.opacity = k;
  } else { st($('lens'), 0); st($('lenslab'), 0); $('lnsvg').style.opacity = 0; }
  // 4 colour chip
  const ck = prog(t, T.colour + .5, T.colour + 1.0);
  $('chip').style.left = (W - 130 - 210) + 'px'; $('chip').style.top = '300px';
  st($('chip'), t >= T.colour + .5 && t < T.shop ? 1 - prog(t, T.shop - .3, T.shop) : 0, `perspective(900px) rotateY(${lerp(95, 0, eBack(ck))}deg) rotate(5deg)`);
  // 5 shop card
  const sk = t >= T.shop;
  $('shop').style.display = sk ? 'block' : 'none';
  if (sk) {
    [['s1', .1], ['s2', .35], ['s3', .7], ['s4', 1.0]].forEach(([id, d]) => { const k = eOut(prog(t, T.shop + d, T.shop + d + .45)); st($(id), k, `translateY(${(1 - k) * 36}px)`); });
    const pk = eBack(prog(t, T.shop + .7, T.shop + 1.1));
    $('s3').firstElementChild.style.transform = `scale(${Math.max(0, pk) * (t > T.shop + 1.3 ? 1 + .03 * Math.sin((t - T.shop) * Math.PI * 4) : 1)})`;
  }
  // transitions
  $('flash').style.opacity = .85 * Math.exp(-Math.pow((t - T.lights) * 7, 2)) * (t > T.lights - .1 ? 1 : 0);
  let wk2 = null; for (const [c, dir] of [[T.lens, 1], [T.shop, -1]]) { const q = prog(t, c - .28, c + .28); if (q > 0 && q < 1) wk2 = [q, dir]; }
  const wp = $('wipe');
  if (wk2) { const [q, dir] = wk2; wp.style.opacity = 1; wp.style.background = `linear-gradient(${dir > 0 ? 100 : 80}deg, transparent 0%, ${P.word} 18%, ${P.word} 82%, transparent 100%)`;
    wp.style.transform = `translateX(${dir * lerp(-110, 110, eInOut(q))}%) skewX(-12deg)`; } else wp.style.opacity = 0;
  const whips = [T.lensEnd, T.lens + T.lensEach, T.lens + 2 * T.lensEach];
  const blur = whips.reduce((m, c) => Math.max(m, 14 * Math.exp(-Math.pow((t - c) * 11, 2))), 0);
  canvas.style.filter = blur > .3 ? `blur(${blur.toFixed(1)}px)` : 'none';
  renderer.render(scene, camera);
};
build().then(() => window.renderAt(0)).catch(e => { window.ERR = String(e && e.stack || e); });
