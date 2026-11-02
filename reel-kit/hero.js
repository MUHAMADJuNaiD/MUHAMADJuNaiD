// Outlook Styles – "Colour Pop 3D" HERO reel template (one product, one colour world)
// 1440x2560 @30fps. Everything important stays inside the Instagram Reels safe zone.
// Deterministic: window.renderAt(t). Config below is the only per-reel part.
import * as THREE from 'three';
import { TTFLoader } from 'three/addons/loaders/TTFLoader.js';
import { Font } from 'three/addons/loaders/FontLoader.js';
import { TextGeometry } from 'three/addons/geometries/TextGeometry.js';
import { RoomEnvironment } from 'three/addons/environments/RoomEnvironment.js';

const CFG = window.REEL_CFG || {
  img: 'assets/p0.png', h: 2.12, float: true,
  pal: { bg: '#D2E86A', bg2: '#EEF8B4', word: '#5A2BD6', ink: '#1B1530', pod: '#5A2BD6', btnink: '#F2EEFF' },
  cat: 'WINTERWEAR', word: 'GLOSS', hookLine: 'WINTER, BUT MAKE IT SHINE.',
  kick: 'THE GLOSS PUFFER', head: 'Shine on, <b>winter.</b>', desc: 'High-shine quilted puffer with a stand collar.',
  chip: ['Gloss Black', '#121214'],
  calls: [ // uv on the product photo -> label side
    { uv: [.5, .06], label: 'STAND<br>COLLAR', side: 'r' },
    { uv: [.33, .36], label: 'HIGH-SHINE<br>FINISH', side: 'l' },
    { uv: [.5, .55], label: 'FULL ZIP<br>FRONT', side: 'r' },
    { uv: [.2, .93], label: 'DRAWCORD<br>HEM', side: 'l' },
  ],
  dur: 16,
};
const W = 1440, H = 2560, P = CFG.pal; CFG.calls = CFG.calls || []; CFG.dur = CFG.dur || 16;
// Instagram Reels safe zone (scaled from 1080x1920 guides): keep clear of top bar, caption area and right icons
export const SAFE = { top: 380, bottom: 2000, left: 96, right: 1250 };
// timeline (s)
const T = { sting: [0, 1.4], hook: [1.4, 2.8], reveal: [2.8, 6.6], detail: [6.6, 10.6], story: [10.6, 13.2], end: [13.2, CFG.dur] };

const clamp = (x, a = 0, b = 1) => Math.min(b, Math.max(a, x));
const prog = (t, a, b) => clamp((t - a) / (b - a));
const eOut = x => 1 - Math.pow(1 - x, 3);
const eInOut = x => x < .5 ? 4 * x * x * x : 1 - Math.pow(-2 * x + 2, 3) / 2;
const eBack = x => { const c1 = 1.70158, c3 = c1 + 1; return 1 + c3 * Math.pow(x - 1, 3) + c1 * Math.pow(x - 1, 2); };
const lerp = (a, b, x) => a + (b - a) * x;
const rand = (s => () => (s = (s * 16807) % 2147483647) / 2147483647)(42);

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
key.position.set(3.5, 9, 7); key.castShadow = true; key.shadow.mapSize.set(2048, 2048); key.shadow.radius = 8; key.shadow.bias = -.0005;
Object.assign(key.shadow.camera, { left: -6, right: 6, top: 8, bottom: -4, near: 1, far: 30 });
scene.add(key);
const rim = new THREE.DirectionalLight(0xffffff, .9); rim.position.set(-6, 5, -4); scene.add(rim);
const floor = new THREE.Mesh(new THREE.PlaneGeometry(60, 60), new THREE.ShadowMaterial({ opacity: .26 }));
floor.rotation.x = -Math.PI / 2; floor.receiveShadow = true; scene.add(floor);

// background (poster gradient + floor sweep + vignette)
(() => {
  const c = document.createElement('canvas'); c.width = 720; c.height = 1280; const g = c.getContext('2d');
  let gr = g.createRadialGradient(360, 540, 0, 360, 580, 900); gr.addColorStop(0, P.bg2); gr.addColorStop(.62, P.bg); gr.addColorStop(1, P.bg);
  g.fillStyle = gr; g.fillRect(0, 0, 720, 1280);
  gr = g.createLinearGradient(0, 0, 0, 1280); gr.addColorStop(.62, 'rgba(0,0,0,0)'); gr.addColorStop(1, 'rgba(0,0,0,.14)'); g.fillStyle = gr; g.fillRect(0, 0, 720, 1280);
  gr = g.createRadialGradient(360, 600, 380, 360, 600, 980); gr.addColorStop(0, 'rgba(0,0,0,0)'); gr.addColorStop(1, 'rgba(0,0,0,.26)'); g.fillStyle = gr; g.fillRect(0, 0, 720, 1280);
  const t = new THREE.CanvasTexture(c); t.colorSpace = THREE.SRGBColorSpace; scene.background = t;
})();

// ---------- builders
let FONT;
const lambert = color => new THREE.MeshLambertMaterial({ color, emissive: new THREE.Color(color), emissiveIntensity: .1 });
function text3d(str, { size = 1, depth = .3, color = P.word, width = null } = {}) {
  const geo = new TextGeometry(str, { font: FONT, size, depth, curveSegments: 10, bevelEnabled: true,
    bevelThickness: depth * .14, bevelSize: size * .022, bevelSegments: 4 });
  geo.computeBoundingBox(); const b = geo.boundingBox;
  geo.translate(-(b.max.x + b.min.x) / 2, -(b.max.y + b.min.y) / 2, -(b.max.z + b.min.z) / 2);
  const m = new THREE.Mesh(geo, lambert(color)); m.castShadow = true;
  const g = new THREE.Group(); g.add(m);
  if (width) g.scale.setScalar(width / (b.max.x - b.min.x));
  g.userData.w = (b.max.x - b.min.x) * g.scale.x; g.userData.base = g.scale.x;
  return g;
}
function productMesh(tex, h) {
  const w = h * tex.image.width / tex.image.height;
  const geo = new THREE.PlaneGeometry(w, h); geo.translate(0, h / 2, 0);
  const mat = new THREE.MeshBasicMaterial({ map: tex, transparent: true, alphaTest: .02, side: THREE.DoubleSide, toneMapped: false });
  mat.userData.shine = { value: -1 };
  mat.onBeforeCompile = sh => {
    sh.uniforms.uShine = mat.userData.shine;
    sh.fragmentShader = 'uniform float uShine;\n' + sh.fragmentShader.replace('#include <map_fragment>', `#include <map_fragment>
      float d = (vMapUv.x * .8 + (1.0 - vMapUv.y) * .6) - uShine;
      diffuseColor.rgb += (exp(-d * d * 260.0) * .5 + exp(-d * d * 30.0) * .1) * diffuseColor.a;`);
  };
  const m = new THREE.Mesh(geo, mat); m.castShadow = true;
  m.customDepthMaterial = new THREE.MeshDepthMaterial({ depthPacking: THREE.RGBADepthPacking, map: tex, alphaTest: .5 });
  m.userData = { w, h }; return m;
}
function podium(color, r = 1.3, hgt = .38) {
  const g = new THREE.Group();
  const cyl = new THREE.Mesh(new THREE.CylinderGeometry(r, r * 1.02, hgt, 128), new THREE.MeshLambertMaterial({ color }));
  cyl.position.y = hgt / 2; cyl.castShadow = cyl.receiveShadow = true; g.add(cyl);
  const gold = new THREE.MeshStandardMaterial({ color: '#E2B55E', metalness: 1, roughness: .25 });
  [hgt, .02].forEach(y => { const r2 = new THREE.Mesh(new THREE.TorusGeometry(r * 1.01, .028, 16, 160), gold); r2.rotation.x = Math.PI / 2; r2.position.y = y; g.add(r2); });
  g.userData.top = hgt; return g;
}
function bokehTex() {
  const c = document.createElement('canvas'); c.width = c.height = 128; const g = c.getContext('2d');
  const gr = g.createRadialGradient(64, 64, 0, 64, 64, 64); gr.addColorStop(0, 'rgba(255,255,255,1)'); gr.addColorStop(.45, 'rgba(255,255,255,.55)'); gr.addColorStop(1, 'rgba(255,255,255,0)');
  g.fillStyle = gr; g.fillRect(0, 0, 128, 128); const t = new THREE.CanvasTexture(c); return t;
}

// ---------- overlay
const ov = document.getElementById('ov');
ov.style.color = P.ink;
ov.innerHTML = `
 <div class="mast" id="mast" style="top:${SAFE.top + 10}px"><div class="side">NEW IN</div><div class="brand">OUTLOOK STYLES</div><div class="side r"><span>${CFG.cat}</span></div></div>
 <div class="rule" id="rule" style="top:${SAFE.top + 78}px"></div>
 <div class="center" id="hookLine" style="top:1290px;font-weight:800;font-size:30px;letter-spacing:.3em">${CFG.hookLine}</div>
 <div class="copy" id="copy" style="top:1745px"><div class="kick">${CFG.kick}</div><div class="head" style="font-size:104px">${CFG.head}</div><div class="desc">${CFG.desc}</div></div>
 <div class="chip" id="chip" style="left:1050px;top:1735px"><div class="sw" style="background:${CFG.chip[1]}"></div><div class="t1">OUTLOOK STYLES</div><div class="t2">${CFG.chip[0]}</div></div>
 <svg id="lines" width="1440" height="2560" style="position:absolute;left:0;top:0"></svg>
 <div id="labels"></div>
 <div id="end" style="position:absolute;inset:0">
   <div class="center" id="endHead" style="top:1700px;font-family:'Playfair Display',serif;font-style:italic;font-weight:600;font-size:100px">${CFG.head}</div>
   <div class="center" id="endPill" style="top:1835px"><span class="pill" style="background:${P.word};color:${P.btnink}">DM TO ORDER &nbsp;&rarr;</span></div>
   <div class="center" style="top:1962px;font-weight:700;font-size:22px;letter-spacing:.32em">DELIVERY ALL OVER PAKISTAN</div>
 </div>
 <svg id="stars" width="1440" height="2560" style="position:absolute;left:0;top:0"></svg>
 ${location.search.includes('safe') ? `<div style="position:absolute;left:0;right:0;top:0;height:${SAFE.top}px;background:rgba(255,0,0,.25)"></div>
   <div style="position:absolute;left:0;right:0;top:${SAFE.bottom}px;bottom:0;background:rgba(255,0,0,.25)"></div>
   <div style="position:absolute;left:${SAFE.right}px;right:0;top:1300px;bottom:${2560 - SAFE.bottom}px;background:rgba(255,0,0,.25)"></div>` : ''}`;
const $ = id => document.getElementById(id);
const st = (el, o, tf) => { el.style.opacity = o; if (tf !== undefined) el.style.transform = tf; };
ov.querySelector('#copy .head b') && (ov.querySelector('#copy .head b').style.color = P.word);
ov.querySelector('#endHead b') && (ov.querySelector('#endHead b').style.color = P.word);
const STAR = 'M50 0 C54 38 62 46 100 50 C62 54 54 62 50 100 C46 62 38 54 0 50 C38 46 46 38 50 0Z';
const starPos = [[1150, 640, 56, 0], [250, 900, 38, .9], [1160, 1250, 30, 1.7], [300, 600, 26, 2.4]];
$('stars').innerHTML = starPos.map((s, i) => `<path id="st${i}" d="${STAR}" fill="${P.word}"/>`).join('');
$('labels').innerHTML = CFG.calls.map((c, i) => `<div id="lb${i}" style="position:absolute;width:300px;font-weight:800;font-size:24px;letter-spacing:.2em;line-height:1.5;text-align:${c.side === 'l' ? 'left' : 'right'}">${c.label}</div>`).join('');
$('lines').innerHTML = CFG.calls.map((c, i) => `<g id="ln${i}"><line stroke="${P.ink}" stroke-width="3"/><circle r="11" fill="${P.word}"/><circle r="22" fill="none" stroke="#ffffff" stroke-width="4"/></g>`).join('');

// ---------- build
const G = {};
async function build() {
  FONT = new Font(await new Promise((res, rej) => new TTFLoader().load('assets/PlayfairBlack.ttf', res, null, rej)));
  await document.fonts.ready;
  const tex = await new THREE.TextureLoader().loadAsync(CFG.img); tex.colorSpace = THREE.SRGBColorSpace; tex.anisotropy = 8;
  // sting letters (same colour world)
  G.letters = []; G.sting = new THREE.Group(); scene.add(G.sting);
  [['OUTLOOK', 2.6, 1], ['STYLES', 1.85, -1]].forEach(([word, y, dir], li) => {
    const gl = [...word].map(ch => text3d(ch, { size: .44, depth: .2 }));
    const gap = .05, total = gl.reduce((s, g) => s + g.userData.w, 0) + gap * (gl.length - 1); let x = -total / 2;
    gl.forEach((g, i) => { g.userData.home = new THREE.Vector3(x + g.userData.w / 2, y, 0); x += g.userData.w + gap;
      g.userData.delay = (li ? .38 : 0) + i * .035; g.userData.dir = dir; G.sting.add(g); G.letters.push(g); });
  });
  G.word = text3d(CFG.word, { size: 1, depth: .36, width: 3.0 }); scene.add(G.word);
  G.pod = podium(P.pod, .98, .24); scene.add(G.pod);
  G.prod = productMesh(tex, CFG.h); scene.add(G.prod);
  // bokeh for depth
  const bt = bokehTex(); G.bokeh = [];
  for (let i = 0; i < 26; i++) {
    const front = i < 6, s = new THREE.Sprite(new THREE.SpriteMaterial({ map: bt, color: i % 3 ? '#ffffff' : P.word, transparent: true, depthWrite: false,
      opacity: front ? .18 : .32 }));
    s.userData = { x: (rand() - .5) * (front ? 4 : 7), y: rand() * 5.5 - .5, z: front ? 2 + rand() * 1.5 : -3 - rand() * 4, s: front ? .5 + rand() * .5 : .12 + rand() * .22, ph: rand() * 6.28 };
    scene.add(s); G.bokeh.push(s);
  }
  window.READY = true;
}

// ---------- frame
const v3 = new THREE.Vector3();
function toScreen(obj, u, v) {
  const { w, h } = obj.userData; v3.set((u - .5) * w, (1 - v) * h, 0); obj.localToWorld(v3); v3.project(camera);
  return [(v3.x + 1) / 2 * W, (1 - v3.y) / 2 * H];
}
window.renderAt = (t) => {
  const D = CFG.dur;
  // camera: calm, small orbit only (no big dolly)
  const yaw = lerp(-.1, .1, eInOut(prog(t, 0, D)));
  const zoom = 1 + .06 * eInOut(prog(t, T.detail[0], T.detail[0] + 1)) - .06 * eInOut(prog(t, T.story[0], T.story[0] + .8));
  const dist = 12.4 / zoom;
  camera.position.set(Math.sin(yaw) * dist, 1.0 + 1.1, Math.cos(yaw) * dist); camera.lookAt(0, 1.0, 0);

  // sting
  const su = t;
  G.sting.visible = t < T.sting[1];
  G.letters.forEach(g => {
    const k = prog(su, g.userData.delay, g.userData.delay + .42), e = eBack(k), out = eInOut(prog(su, 1.08, 1.38)), h = g.userData.home;
    g.position.set(h.x * (1 - out * .35), lerp(h.y + 2.6 * g.userData.dir, h.y, e) + out * (1.9 - h.y) * .5, h.z + (1 - k) * 1.5 - out * 2.5);
    g.rotation.set((1 - e) * -1.3, (1 - e) * .8 + out * 1.2, 0); g.scale.setScalar(Math.max(.001, (k > 0 ? g.userData.base : 0) * (1 - out)));
  });
  // hook word slams in, then becomes the backdrop word
  const hk = prog(t, T.hook[0], T.hook[0] + .45), mv = eInOut(prog(t, T.reveal[0], T.reveal[0] + .8));
  G.word.visible = t >= T.hook[0];
  const slam = hk < 1 ? lerp(2.2, 1, eOut(hk)) : 1 + .04 * Math.exp(-Math.pow((t - T.hook[0] - .5) * 7, 2));
  G.word.scale.setScalar(Math.max(.001, G.word.userData.base * slam * lerp(.98, 1, mv)));
  G.word.position.set(0, lerp(1.75, 2.72, mv), lerp(0, -1.7, mv));
  G.word.rotation.x = (1 - eOut(hk)) * -.5;

  floor.visible = t >= T.reveal[0];
  // podium + product
  const pk = eBack(prog(t, T.reveal[0] + .2, T.reveal[0] + .7));
  G.pod.visible = t >= T.reveal[0]; G.pod.scale.setScalar(Math.max(.001, pk));
  const endK = eInOut(prog(t, T.end[0], T.end[0] + .7));
  const dk = eOut(prog(t, T.reveal[0] + .55, T.reveal[0] + 1.6));
  const hover = CFG.float ? .17 + .05 * Math.sin((t - T.reveal[0]) * 2.2) : 0;
  G.prod.visible = t >= T.reveal[0] + .5;
  G.prod.position.set(0, G.pod.userData.top * pk + hover + (1 - dk) * 4.5, 0);
  G.prod.rotation.y = yaw * .6 + .05 * Math.sin(t * 1.3);
  const ps = lerp(1, .8, endK); G.prod.scale.setScalar(ps); G.pod.scale.multiplyScalar(lerp(1, .85, endK));
  G.prod.position.y += endK * .1;
  G.prod.material.userData.shine.value = Math.max(
    lerp(-.4, 1.8, eInOut(prog(t, T.reveal[0] + 1.8, T.reveal[0] + 2.7))) * (t < T.reveal[0] + 2.75 ? 1 : 0),
    lerp(-.4, 1.8, eInOut(prog(t, T.story[0] + .2, T.story[0] + 1.1))) * (t > T.story[0] && t < T.story[0] + 1.15 ? 1 : 0), -1);
  // bokeh drift
  G.bokeh.forEach(b => { const u = b.userData; b.position.set(u.x + .15 * Math.sin(t * .5 + u.ph), u.y + .25 * Math.sin(t * .4 + u.ph), u.z); b.scale.setScalar(u.s);
    b.visible = t >= T.hook[0]; });

  // ---------- overlay
  $('mast').style.opacity = $('rule').style.opacity = t >= T.hook[0] ? 1 : 0; $('rule').style.opacity = t >= T.hook[0] ? .5 : 0;
  const hl = eOut(prog(t, T.hook[0] + .4, T.hook[0] + .8)) * (1 - eOut(prog(t, T.reveal[0], T.reveal[0] + .3)));
  st($('hookLine'), hl, `translateY(${(1 - hl) * 30}px)`);
  const copyOn = (t >= T.reveal[0] + 1.3 && t < T.detail[0] + .3) || (t >= T.story[0] && t < T.end[0]);
  const cA = t < T.detail[0] + .3 ? eOut(prog(t, T.reveal[0] + 1.3, T.reveal[0] + 1.8)) * (1 - eOut(prog(t, T.detail[0], T.detail[0] + .3)))
                                  : eOut(prog(t, T.story[0] + .1, T.story[0] + .6)) * (1 - eOut(prog(t, T.end[0], T.end[0] + .3)));
  st($('copy'), copyOn ? cA : 0, `translateY(${(1 - cA) * 50}px)`);
  const ck = prog(t, T.story[0] + .4, T.story[0] + .9);
  $('chip').style.opacity = t >= T.story[0] + .4 && t < T.end[0] ? 1 - eOut(prog(t, T.end[0] - .01, T.end[0] + .3)) : 0;
  $('chip').style.transform = `perspective(900px) rotateY(${lerp(95, 0, eBack(ck))}deg) rotate(4deg)`;
  // feature callouts (projected from the product photo)
  scene.updateMatrixWorld(true); camera.updateMatrixWorld(true);
  CFG.calls.forEach((c, i) => {
    const a = T.detail[0] + .35 + i * .75, k = eOut(prog(t, a, a + .4)) * (1 - eOut(prog(t, T.detail[1] - .3, T.detail[1])));
    const [x, y] = toScreen(G.prod, c.uv[0], c.uv[1]);
    const lx = c.side === 'l' ? SAFE.left + 10 : SAFE.right - 10, ly = Math.min(Math.max(y, 860), 1500);
    const lb = $('lb' + i), g = $('ln' + i);
    st(lb, k, `translateX(${(1 - k) * (c.side === 'l' ? -30 : 30)}px)`); lb.style.left = (c.side === 'l' ? lx : lx - 300) + 'px'; lb.style.top = (ly - 86) + 'px';
    const ex = lerp(x, lx, k);
    const [ln, d1, d2] = g.children;
    ln.setAttribute('x1', x); ln.setAttribute('y1', y); ln.setAttribute('x2', ex); ln.setAttribute('y2', ly);
    d1.setAttribute('cx', x); d1.setAttribute('cy', y); d2.setAttribute('cx', x); d2.setAttribute('cy', y);
    g.style.opacity = k;
  });
  // end card
  $('end').style.display = t >= T.end[0] ? 'block' : 'none';
  const e1 = eOut(prog(t, T.end[0] + .3, T.end[0] + .7)), e2 = eBack(prog(t, T.end[0] + .55, T.end[0] + .95));
  st($('endHead'), e1, `translateY(${(1 - e1) * 50}px)`);
  $('endPill').style.transform = `scale(${Math.max(0, e2) * (1 + (t > T.end[0] + 1 ? .035 * Math.sin((t - T.end[0]) * Math.PI * 4) : 0))})`;
  starPos.forEach(([x, y, s, ph], i) => { const k = .55 + .45 * Math.sin(t * 4.2 + ph * 2.1), sc = (s / 100) * (.7 + .3 * k);
    const el = $('st' + i); el.setAttribute('transform', `translate(${x - 50 * sc} ${y - 50 * sc}) scale(${sc})`); el.setAttribute('opacity', (.35 + .65 * k) * (t >= T.hook[0] ? 1 : 0)); });

  renderer.render(scene, camera);
};
build().then(() => window.renderAt(0)).catch(e => { window.ERR = String(e && e.stack || e); });
