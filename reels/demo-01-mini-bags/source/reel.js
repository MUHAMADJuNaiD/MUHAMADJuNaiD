// Outlook Styles – "Colour Pop 3D" reel: MINI BAGS, BIG MOOD (18 s, 1440x2560, 30 fps)
// Deterministic: window.renderAt(t) draws the frame for time t (seconds).
import * as THREE from 'three';
import { TTFLoader } from 'three/addons/loaders/TTFLoader.js';
import { Font } from 'three/addons/loaders/FontLoader.js';
import { TextGeometry } from 'three/addons/geometries/TextGeometry.js';
import { RoomEnvironment } from 'three/addons/environments/RoomEnvironment.js';

const W = 1440, H = 2560, DUR = 18;
const PAL = {
  brand: { bg: '#B0101C', bg2: '#D42536', word: '#FFB3C7', ink: '#FFF2EC', pod: '#C8202D' },
  pink:  { bg: '#F4BFCB', bg2: '#FDE6EC', word: '#B5121F', ink: '#3E0A12', pod: '#FBE1E8' },
  cobalt:{ bg: '#1B36C9', bg2: '#4062F0', word: '#F3F6FF', ink: '#F3F6FF', pod: '#3A57E4' },
  mint:  { bg: '#BFE6D3', bg2: '#E3F6EC', word: '#7A1230', ink: '#1E2A24', pod: '#D6F0E3' },
};
const BAGS = [
  { img: 'assets/bag212.png', pal: 'pink', word: 'CHERRY', kick: 'THE SADDLE BAG', head: 'Cherry <b>on top.</b>',
    desc: 'Glossy red leather, sculpted gold hardware.', chip: ['Cherry Red', '#B01C25'], h: 2.55 },
  { img: 'assets/bag106.png', pal: 'cobalt', word: 'SHINE', kick: 'THE CRYSTAL HOBO', head: 'Born <b>to shine.</b>',
    desc: 'Hand-set crystal mesh with a knotted handle.', chip: ['Silver Crystal', '#C9CDD3'], h: 2.05 },
  { img: 'assets/bag210.png', pal: 'mint', word: 'SPARKLE', kick: 'THE KNOT BAG', head: 'Red <b>alert.</b>',
    desc: 'Crystal mesh hobo with a knot handle.', chip: ['Ruby Red', '#B3121F'], h: 2.0 },
];
// timeline (s): sting 0-1.6, hook 1.6-3.2, bags 4.2 s each, end 15.8-18
const SEG = { sting: [0, 1.6], hook: [1.6, 3.2], bag: [[3.2, 7.4], [7.4, 11.6], [11.6, 15.8]], end: [15.8, 18] };

// ---------- easing
const clamp = (x, a = 0, b = 1) => Math.min(b, Math.max(a, x));
const prog = (t, a, b) => clamp((t - a) / (b - a));
const eOut = x => 1 - Math.pow(1 - x, 3);
const eInOut = x => x < .5 ? 4 * x * x * x : 1 - Math.pow(-2 * x + 2, 3) / 2;
const eBack = x => { const c1 = 1.70158, c3 = c1 + 1; return 1 + c3 * Math.pow(x - 1, 3) + c1 * Math.pow(x - 1, 2); };
const eBounce = x => { const n = 7.5625, d = 2.75;
  if (x < 1 / d) return n * x * x; if (x < 2 / d) return n * (x -= 1.5 / d) * x + .75;
  if (x < 2.5 / d) return n * (x -= 2.25 / d) * x + .9375; return n * (x -= 2.625 / d) * x + .984375; };
const lerp = (a, b, x) => a + (b - a) * x;

// ---------- renderer / scene
const canvas = document.getElementById('c');
const renderer = new THREE.WebGLRenderer({ canvas, antialias: true, preserveDrawingBuffer: true });
renderer.setPixelRatio(1); renderer.setSize(W, H, false);
renderer.outputColorSpace = THREE.SRGBColorSpace;
renderer.toneMapping = THREE.NoToneMapping;
renderer.shadowMap.enabled = true; renderer.shadowMap.type = THREE.PCFSoftShadowMap;
const scene = new THREE.Scene();
const pmrem = new THREE.PMREMGenerator(renderer);
scene.environment = pmrem.fromScene(new RoomEnvironment(), .04).texture;
const camera = new THREE.PerspectiveCamera(30, W / H, .1, 100);

scene.add(new THREE.HemisphereLight(0xffffff, 0x444444, .25));
const key = new THREE.DirectionalLight(0xffffff, 1.0);
key.position.set(3.5, 9, 7); key.castShadow = true;
key.shadow.mapSize.set(2048, 2048); key.shadow.radius = 6; key.shadow.bias = -.0005;
Object.assign(key.shadow.camera, { left: -6, right: 6, top: 8, bottom: -4, near: 1, far: 30 });
scene.add(key);
const rim = new THREE.DirectionalLight(0xffffff, .9); rim.position.set(-6, 5, -4); scene.add(rim);
const sweepLight = new THREE.PointLight(0xfff2d0, 0, 12, 1.5); scene.add(sweepLight);

const floor = new THREE.Mesh(new THREE.PlaneGeometry(60, 60), new THREE.ShadowMaterial({ opacity: .28 }));
floor.rotation.x = -Math.PI / 2; floor.receiveShadow = true; scene.add(floor);

// background: poster-style radial gradient + vignette (screen-space)
const bgCache = {};
function bgTex(p) {
  if (bgCache[p.bg]) return bgCache[p.bg];
  const c = document.createElement('canvas'); c.width = 720; c.height = 1280; const g = c.getContext('2d');
  let gr = g.createRadialGradient(360, 520, 0, 360, 560, 900);
  gr.addColorStop(0, p.bg2); gr.addColorStop(.62, p.bg); gr.addColorStop(1, p.bg);
  g.fillStyle = gr; g.fillRect(0, 0, 720, 1280);
  gr = g.createLinearGradient(0, 0, 0, 1280); gr.addColorStop(.66, 'rgba(0,0,0,0)'); gr.addColorStop(1, 'rgba(0,0,0,.14)');
  g.fillStyle = gr; g.fillRect(0, 0, 720, 1280);
  gr = g.createRadialGradient(360, 600, 380, 360, 600, 980); gr.addColorStop(0, 'rgba(0,0,0,0)'); gr.addColorStop(1, 'rgba(0,0,0,.30)');
  g.fillStyle = gr; g.fillRect(0, 0, 720, 1280);
  const t = new THREE.CanvasTexture(c); t.colorSpace = THREE.SRGBColorSpace; bgCache[p.bg] = t; return t;
}

// ---------- helpers
let FONT;
function text3d(str, { size = 1, depth = .3, color = '#fff', width = null, metal = false } = {}) {
  const geo = new TextGeometry(str, { font: FONT, size, depth, curveSegments: 10, bevelEnabled: true,
    bevelThickness: depth * .14, bevelSize: size * .022, bevelSegments: 4 });
  geo.computeBoundingBox(); const b = geo.boundingBox;
  geo.translate(-(b.max.x + b.min.x) / 2, -(b.max.y + b.min.y) / 2, -(b.max.z + b.min.z) / 2);
  const mat = metal
    ? new THREE.MeshStandardMaterial({ color: '#E2B55E', metalness: 1, roughness: .22, envMapIntensity: 1.6 })
    : new THREE.MeshLambertMaterial({ color, emissive: new THREE.Color(color), emissiveIntensity: .1 });
  const m = new THREE.Mesh(geo, mat); m.castShadow = true;
  const g = new THREE.Group(); g.add(m);
  if (width) { const s = width / (b.max.x - b.min.x); g.scale.setScalar(s); }
  g.userData.w = (b.max.x - b.min.x) * g.scale.x;
  return g;
}
const texLoader = new THREE.TextureLoader();
function productMesh(tex, h) {
  const ar = tex.image.width / tex.image.height, w = h * ar;
  const geo = new THREE.PlaneGeometry(w, h); geo.translate(0, h / 2, 0);
  const mat = new THREE.MeshBasicMaterial({ map: tex, transparent: true, alphaTest: .02, side: THREE.DoubleSide, toneMapped: false });
  mat.userData.shine = { value: -1 };
  mat.onBeforeCompile = sh => {
    sh.uniforms.uShine = mat.userData.shine;
    sh.fragmentShader = 'uniform float uShine;\n' + sh.fragmentShader.replace('#include <map_fragment>', `#include <map_fragment>
      float d = (vMapUv.x * .8 + (1.0 - vMapUv.y) * .6) - uShine;
      float band = exp(-d * d * 260.0) * .55 + exp(-d * d * 30.0) * .12;
      diffuseColor.rgb += band * diffuseColor.a;`);
  };
  const m = new THREE.Mesh(geo, mat);
  m.castShadow = true;
  m.customDepthMaterial = new THREE.MeshDepthMaterial({ depthPacking: THREE.RGBADepthPacking, map: tex, alphaTest: .5 });
  m.userData.w = w;
  return m;
}
function podium(color, r = 1.45, hgt = .42) {
  const g = new THREE.Group();
  const cyl = new THREE.Mesh(new THREE.CylinderGeometry(r, r * 1.02, hgt, 128),
    new THREE.MeshStandardMaterial({ color, roughness: .42, metalness: .04 }));
  cyl.position.y = hgt / 2; cyl.castShadow = cyl.receiveShadow = true; g.add(cyl);
  const ring = new THREE.Mesh(new THREE.TorusGeometry(r * 1.0, .03, 16, 160),
    new THREE.MeshStandardMaterial({ color: '#E2B55E', metalness: 1, roughness: .25 }));
  ring.rotation.x = Math.PI / 2; ring.position.y = hgt; g.add(ring);
  const base = new THREE.Mesh(new THREE.TorusGeometry(r * 1.02, .03, 16, 160), ring.material);
  base.rotation.x = Math.PI / 2; base.position.y = .02; g.add(base);
  g.userData.top = hgt;
  return g;
}

// ---------- overlay
const ov = document.getElementById('ov');
ov.innerHTML = `
 <div class="mast" id="mast"><div class="side">NEW IN</div><div class="brand">OUTLOOK STYLES</div><div class="side r"><span>THE BAG EDIT</span></div></div>
 <div class="rule" id="rule"></div>
 <div class="copy" id="copy"><div class="kick" id="kick"></div><div class="head" id="head"></div><div class="desc" id="desc"></div></div>
 <div class="chip" id="chip"><div class="sw" id="sw"></div><div class="t1">OUTLOOK STYLES</div><div class="t2" id="cn"></div></div>
 <div class="center" id="hookTag" style="top:1720px;font-weight:700;font-size:26px;letter-spacing:.42em">THE BAG EDIT</div>
 <div id="end" style="position:absolute;inset:0">
   <div class="center" style="top:1560px;font-family:'Playfair Display',serif;font-style:italic;font-weight:600;font-size:112px" id="endHead">Mini bags, <b style="font-weight:800;color:#FFB3C7">big mood.</b></div>
   <div class="center" style="top:1745px"><span class="pill" id="pill" style="background:#FFB3C7;color:#7A0812">DM TO ORDER &nbsp;&rarr;</span></div>
   <div class="center" style="top:1900px;font-weight:700;font-size:24px;letter-spacing:.32em">DELIVERY ALL OVER PAKISTAN</div>
 </div>
 <svg id="stars" width="1440" height="2560" style="position:absolute;left:0;top:0"></svg>
 <div class="wipe" id="wipe"></div>`;
const $ = id => document.getElementById(id);
const STAR = 'M50 0 C54 38 62 46 100 50 C62 54 54 62 50 100 C46 62 38 54 0 50 C38 46 46 38 50 0Z';
const starPos = [[1180, 520, 70, 0], [230, 860, 44, .9], [1250, 1180, 34, 1.7], [300, 380, 30, 2.4], [1120, 300, 26, 3.1]];
$('stars').innerHTML = starPos.map((s, i) => `<path id="st${i}" d="${STAR}"/>`).join('');

// ---------- build
let G = {};
async function build() {
  const ttf = await new Promise((res, rej) => new TTFLoader().load('assets/PlayfairBlack.ttf', res, null, rej));
  FONT = new Font(ttf);
  await document.fonts.ready;
  const texs = await Promise.all(BAGS.map(b => texLoader.loadAsync(b.img)));
  texs.forEach(t => { t.colorSpace = THREE.SRGBColorSpace; t.anisotropy = 8; });

  // sting letters
  G.sting = new THREE.Group(); scene.add(G.sting);
  G.letters = [];
  [['OUTLOOK', 2.55], ['STYLES', 1.75]].forEach(([word, y], li) => {
    const glyphs = [...word].map(ch => text3d(ch, { size: .5, depth: .22, metal: true }));
    const gap = .06, total = glyphs.reduce((s, g) => s + g.userData.w, 0) + gap * (glyphs.length - 1);
    let x = -total / 2;
    glyphs.forEach((g, i) => { g.userData.home = new THREE.Vector3(x + g.userData.w / 2, y, 0); x += g.userData.w + gap;
      g.userData.delay = (li ? .42 : 0) + i * .035; g.userData.dir = li ? -1 : 1; G.sting.add(g); G.letters.push(g); });
  });
  // hook words
  G.hook = new THREE.Group(); scene.add(G.hook);
  G.hook1 = text3d('MINI BAGS,', { size: 1, depth: .35, color: PAL.brand.word, width: 3.7 });
  G.hook2 = text3d('BIG MOOD.', { size: 1, depth: .35, color: PAL.brand.ink, width: 3.7 });
  G.hook1.position.set(0, 2.85, 0); G.hook2.position.set(0, 1.75, 0);
  G.hook.add(G.hook1, G.hook2);

  // bag scenes
  G.bags = BAGS.map((b, i) => {
    const p = PAL[b.pal], g = new THREE.Group(); scene.add(g);
    const pod = podium(p.pod); g.add(pod);
    const word = text3d(b.word, { size: 1, depth: .34, color: p.word, width: 3.55 });
    word.position.set(0, 3.05, -1.7); g.add(word);
    const prod = productMesh(texs[i], b.h * 1.13); prod.position.y = pod.userData.top; g.add(prod);
    return { g, pod, word, prod, p, b };
  });
  // end card: three podiums
  G.end = new THREE.Group(); scene.add(G.end);
  G.endItems = BAGS.map((b, i) => {
    const pod = podium(PAL.brand.pod, .52, .3); const x = (i - 1) * 1.28;
    pod.position.x = x; G.end.add(pod);
    const prod = productMesh(texs[i], b.h * .5); prod.position.set(x, pod.userData.top, 0); G.end.add(prod);
    return { pod, prod, x };
  });
  window.READY = true;
}

// ---------- per-frame state
function setCam(yaw, dist, ty, lift = 1.25) {
  camera.position.set(Math.sin(yaw) * dist, ty + lift, Math.cos(yaw) * dist);
  camera.lookAt(0, ty, 0);
}
function showOnly(name) {
  G.sting.visible = name === 'sting'; G.hook.visible = name === 'hook'; G.end.visible = name === 'end';
  G.bags.forEach((b, i) => b.g.visible = name === 'bag' + i);
}
function overlay(t, segName, p, bag) {
  const ink = p.ink;
  ov.style.color = ink;
  const mastOn = segName !== 'sting';
  $('mast').style.opacity = $('rule').style.opacity = mastOn ? 1 : 0;
  $('rule').style.opacity = mastOn ? .5 : 0;
  // copy + chip
  const copyOn = segName.startsWith('bag');
  $('copy').style.display = $('chip').style.display = copyOn ? 'block' : 'none';
  if (copyOn) {
    const [a] = SEG.bag[+segName.slice(3)], u = t - a;
    $('kick').textContent = bag.kick; $('head').innerHTML = bag.head; $('desc').textContent = bag.desc;
    $('head').querySelector('b').style.color = p.word === p.ink ? '#FFD66B' : p.word;
    const k = eOut(prog(u, .95, 1.45)), k2 = eOut(prog(u, 1.1, 1.6));
    $('kick').style.cssText = `opacity:${k};transform:translateY(${(1 - k) * 40}px)`;
    $('head').style.opacity = k2; $('head').style.transform = `translateY(${(1 - k2) * 70}px)`;
    $('desc').style.opacity = eOut(prog(u, 1.3, 1.8));
    const c = prog(u, 1.55, 2.15);
    $('chip').style.transform = `perspective(900px) rotateY(${lerp(95, 0, eBack(c))}deg) rotate(4deg)`;
    $('chip').style.opacity = c > 0 ? 1 : 0;
    $('sw').style.background = bag.chip[1]; $('cn').textContent = bag.chip[0];
  }
  // hook tag
  const hu = t - SEG.hook[0];
  $('hookTag').style.opacity = segName === 'hook' ? eOut(prog(hu, .7, 1.1)) : 0;
  // end card
  const eu = t - SEG.end[0];
  $('end').style.display = segName === 'end' ? 'block' : 'none';
  if (segName === 'end') {
    const a1 = eOut(prog(eu, .35, .75)), a2 = eBack(prog(eu, .6, 1.0));
    $('endHead').style.cssText += `;opacity:${a1};transform:translateY(${(1 - a1) * 60}px)`;
    $('pill').style.transform = `scale(${a2 * (1 + .035 * Math.sin((eu - 1) * Math.PI * 4) * (eu > 1.1 ? 1 : 0))})`;
  }
  // twinkling stars
  starPos.forEach(([x, y, s, ph], i) => {
    const k = .55 + .45 * Math.sin(t * 4.2 + ph * 2.1), sc = s * (.7 + .3 * k) / 100;
    const el = $('st' + i); el.setAttribute('transform', `translate(${x - s * sc * 50 / s} ${y - s * sc * 50 / s}) scale(${sc})`);
    el.setAttribute('fill', segName === 'sting' ? '#F2CC7A' : p.word === p.ink ? '#FFD66B' : p.word); el.setAttribute('opacity', .35 + .65 * k);
  });
  // iris wipes at every scene change
  const cuts = [[SEG.hook[1], 'pink'], [SEG.bag[0][1], 'cobalt'], [SEG.bag[1][1], 'mint'], [SEG.bag[2][1], 'brand']];
  let wipe = '';
  for (const [c, nxt] of cuts) {
    const d = t - c;
    if (d > -.28 && d < .28) {
      const r = d < 0 ? eInOut(prog(d, -.28, 0)) * 160 : (1 - eInOut(prog(d, 0, .28))) * 160;
      wipe = `background:${PAL[nxt].bg};clip-path:circle(${r}% at 50% 42%)`;
    }
  }
  $('wipe').style.cssText = wipe || 'display:none';
}

window.renderAt = (t) => {
  let seg, p, bag = null;
  if (t < SEG.sting[1]) seg = 'sting';
  else if (t < SEG.hook[1]) seg = 'hook';
  else if (t < SEG.bag[2][1]) { const i = SEG.bag.findIndex(([a, b]) => t >= a && t < b); seg = 'bag' + i; bag = BAGS[i]; }
  else seg = 'end';
  p = seg.startsWith('bag') ? PAL[bag.pal] : PAL.brand;
  showOnly(seg);
  floor.position.y = seg === 'end' ? 1.15 : 0;
  floor.visible = seg !== 'sting' && seg !== 'hook';
  scene.background = bgTex(p);
  sweepLight.intensity = 0;

  if (seg === 'sting') {
    const u = t;
    setCam(lerp(-.12, .1, eInOut(prog(u, 0, 1.6))), lerp(15.5, 13.5, eOut(prog(u, 0, 1.6))), 2.1, .9);
    G.letters.forEach(g => {
      const k = prog(u, g.userData.delay, g.userData.delay + .45), e = eBack(k), out = eInOut(prog(u, 1.22, 1.55));
      const h = g.userData.home;
      g.position.set(h.x, lerp(h.y + 3.2 * g.userData.dir, h.y, e) + out * 3.5, h.z + (1 - k) * 2);
      g.rotation.set((1 - e) * -1.4, (1 - e) * .9 + out * .6, 0);
      g.scale.setScalar(Math.max(.001, (k > 0 ? 1 : 0) * (1 - out * .6)));
    });
    sweepLight.intensity = 30 * Math.sin(Math.PI * prog(u, .55, 1.25));
    sweepLight.position.set(lerp(-4, 4, prog(u, .55, 1.25)), 2.6, 2.2);
  } else if (seg === 'hook') {
    const u = t - SEG.hook[0];
    setCam(lerp(.1, -.08, eInOut(prog(u, 0, 1.6))), lerp(13.5, 12.2, eOut(prog(u, 0, 1.6))), 2.1, .9);
    [[G.hook1, .05], [G.hook2, .5]].forEach(([g, d]) => {
      const k = prog(u, d, d + .45), e = eBack(k), base = g === G.hook1 ? 2.85 : 1.75;
      g.children[0].scale.setScalar(Math.max(.001, e)); g.rotation.set((1 - e) * .9, (1 - e) * -.5, 0);
      g.position.y = base + (1 - e) * -.6;
    });
  } else if (seg.startsWith('bag')) {
    const i = +seg.slice(3), [a, b] = SEG.bag[i], u = t - a, B = G.bags[i];
    const yaw = lerp(-.2, .2, eInOut(prog(u, 0, b - a)));
    setCam(yaw, lerp(12.6, 11.4, eInOut(prog(u, 0, b - a))), 0.8, 1.2);
    // podium pops in
    const pk = eBack(prog(u, 0, .45)); B.pod.scale.set(Math.max(.001, pk), Math.max(.001, pk), Math.max(.001, pk));
    // product drops with bounce + squash
    const dk = prog(u, .2, 1.0), drop = 1 - eBounce(dk);
    B.prod.position.y = B.pod.userData.top * pk + drop * 5.5;
    const land = Math.exp(-Math.pow((u - .58) * 9, 2)) + .5 * Math.exp(-Math.pow((u - .83) * 10, 2));
    B.prod.scale.set(1 + land * .05, 1 - land * .07, 1);
    B.prod.rotation.y = yaw * .6; B.prod.rotation.z = (1 - eOut(dk)) * .12;
    B.prod.material.userData.shine.value = lerp(-.4, 1.8, eInOut(prog(u, 2.0, 2.9)));
    // 3D word flips up behind
    const wk = prog(u, .55, 1.15), we = eBack(wk);
    B.word.rotation.x = (1 - we) * -1.5; B.word.scale.setScalar(Math.max(.001, B.word.userData.base * lerp(.6, 1, we)));
    B.word.visible = wk > 0;
    sweepLight.intensity = 22 * Math.sin(Math.PI * prog(u, 2.0, 2.9));
    sweepLight.position.set(lerp(-3.5, 3.5, prog(u, 2.0, 2.9)), 2.2, 2.4);
  } else {
    const u = t - SEG.end[0];
    setCam(lerp(-.08, .08, eInOut(prog(u, 0, 2.2))), lerp(13.8, 12.8, eOut(prog(u, 0, 2.2))), 1.65, 1.0);
    G.endItems.forEach((it, i) => {
      const k = eBack(prog(u, .05 + i * .12, .5 + i * .12));
      it.pod.scale.setScalar(Math.max(.001, k));
      it.prod.position.y = it.pod.userData.top * k + (1 - eBounce(prog(u, .15 + i * .12, .75 + i * .12))) * 3;
      it.prod.material.userData.shine.value = lerp(-.4, 1.8, prog(u, 1.1 + i * .15, 1.8 + i * .15));
    });
  }
  overlay(t, seg, p, bag);
  renderer.render(scene, camera);
};

build().then(() => {
  G.bags.forEach(B => B.word.userData.base = B.word.scale.x);
  G.end.position.y = 1.15;
  window.renderAt(0);
}).catch(e => { window.ERR = String(e && e.stack || e); });
