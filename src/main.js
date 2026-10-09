import * as THREE from 'three';
import { GLTFLoader } from 'three/examples/jsm/loaders/GLTFLoader.js';
import { MeshoptDecoder } from 'three/examples/jsm/libs/meshopt_decoder.module.js';
import '@fontsource/bebas-neue/latin-400.css';
import '@fontsource/dm-mono/latin-400.css';
import '@fontsource/dm-mono/latin-500.css';
import './style.css';
import { ME, STATIONS, SUMMARY, CV, SKILLS, EDU } from './content.js';

const V3 = THREE.Vector3;
const clamp = (v, a, b) => Math.min(b, Math.max(a, v));
const lerp = (a, b, t) => a + (b - a) * t;
const sstep = (a, b, v) => { const t = clamp((v - a) / (b - a), 0, 1); return t * t * (3 - 2 * t); };
const $ = (id) => document.getElementById(id);
const TOUCH = matchMedia('(pointer:coarse)').matches || 'ontouchstart' in window;
if (TOUCH) document.documentElement.classList.add('touch');
const TOP = 216; // y of the summit plateau

/* ---------------------------------------------------------------- noise */
function hash(x, y) {
  let h = Math.imul(x | 0, 374761393) + Math.imul(y | 0, 668265263) | 0;
  h = Math.imul(h ^ (h >>> 13), 1274126177);
  return ((h ^ (h >>> 16)) >>> 0) / 4294967296;
}
function vnoise(x, y) {
  const xi = Math.floor(x); const yi = Math.floor(y); const xf = x - xi; const yf = y - yi;
  const u = xf * xf * (3 - 2 * xf); const v = yf * yf * (3 - 2 * yf);
  const a = hash(xi, yi); const b = hash(xi + 1, yi); const c = hash(xi, yi + 1); const d = hash(xi + 1, yi + 1);
  return a + (b - a) * u + (c - a) * v + (a - b - c + d) * u * v;
}
function fbm(x, y, o = 4) { let s = 0; let a = 0.5; let f = 1; for (let i = 0; i < o; i++) { s += a * vnoise(x * f, y * f); f *= 2; a *= 0.5; } return s; }
let seed = 7;
const rnd = () => { seed = (seed * 16807) % 2147483647; return (seed - 1) / 2147483646; };

/* ---------------------------------------------------------------- renderer */
const canvas = $('c');
const renderer = new THREE.WebGLRenderer({ canvas, antialias: !TOUCH, powerPreference: 'high-performance' });
renderer.setPixelRatio(Math.min(devicePixelRatio, TOUCH ? 2 : 2));
renderer.shadowMap.enabled = true;
renderer.shadowMap.type = THREE.PCFSoftShadowMap;
renderer.outputColorSpace = THREE.SRGBColorSpace;
renderer.toneMapping = THREE.ACESFilmicToneMapping;
renderer.toneMappingExposure = 1.05;
const scene = new THREE.Scene();
scene.fog = new THREE.Fog(0x6b3f7a, 120, 900);
const cam = new THREE.PerspectiveCamera(42, 1, 0.5, 2000);
const hemi = new THREE.HemisphereLight(0xbfb0ff, 0x6a4a38, 0.9);
scene.add(hemi);
const sun = new THREE.DirectionalLight(0xffc89a, 2.6);
sun.castShadow = true;
const SH = TOUCH ? 1024 : 2048;
sun.shadow.mapSize.set(SH, SH);
Object.assign(sun.shadow.camera, { left: -17, right: 17, top: 14, bottom: -14, near: 1, far: 90 });
sun.shadow.bias = -0.0006; sun.shadow.normalBias = 0.03;
scene.add(sun, sun.target);
const SUN_DIR = new V3(-0.55, 0.62, 0.8).normalize();

/* ---------------------------------------------------------------- sky (altitude driven) */
const SKY = [
  { top: 0x15183f, mid: 0x6b3f7a, bot: 0xff7a55, fog: 0x6b3f7a, sun: 0xff9a66, hemi: 0xa08cff, i: 2.0 },
  { top: 0x2b3d78, mid: 0xc7607a, bot: 0xffb15c, fog: 0xc7607a, sun: 0xffb27a, hemi: 0xc9b8ff, i: 2.6 },
  { top: 0x4f86c9, mid: 0xffbfa0, bot: 0xffe2a0, fog: 0xffcfa8, sun: 0xffe2b8, hemi: 0xdce8ff, i: 3.0 },
];
const skyMat = new THREE.ShaderMaterial({
  side: THREE.BackSide, depthWrite: false, fog: false,
  uniforms: { top: { value: new THREE.Color() }, mid: { value: new THREE.Color() }, bot: { value: new THREE.Color() }, sunDir: { value: SUN_DIR.clone() }, sunCol: { value: new THREE.Color(0xffd29a) } },
  vertexShader: 'varying vec3 vP; void main(){ vP = normalize(position); gl_Position = projectionMatrix * modelViewMatrix * vec4(position,1.0); }',
  fragmentShader: `uniform vec3 top; uniform vec3 mid; uniform vec3 bot; uniform vec3 sunDir; uniform vec3 sunCol; varying vec3 vP;
    void main(){ float h = clamp(vP.y,-0.2,1.0); vec3 c = mix(bot, mid, smoothstep(-0.05,0.28,h)); c = mix(c, top, smoothstep(0.2,0.85,h));
      float s = max(dot(normalize(vP), normalize(sunDir)),0.0); c += sunCol * (pow(s,28.0)*0.65 + pow(s,400.0)*1.6);
      gl_FragColor = vec4(c,1.0); }`,
});
const skyDome = new THREE.Mesh(new THREE.SphereGeometry(1200, 24, 16), skyMat);
skyDome.renderOrder = -10;
scene.add(skyDome);
const stars = (() => {
  const n = 380; const p = new Float32Array(n * 3);
  for (let i = 0; i < n; i++) { const a = rnd() * 6.283; const e = 0.12 + rnd() * 0.85; const r = 1100; p[i * 3] = Math.cos(a) * Math.cos(e) * r; p[i * 3 + 1] = Math.sin(e) * r; p[i * 3 + 2] = Math.sin(a) * Math.cos(e) * r; }
  const g = new THREE.BufferGeometry(); g.setAttribute('position', new THREE.BufferAttribute(p, 3));
  const m = new THREE.PointsMaterial({ color: 0xffffff, size: 2.6, sizeAttenuation: false, transparent: true, opacity: 0.9, fog: false, depthWrite: false });
  const pts = new THREE.Points(g, m); scene.add(pts); return pts;
})();
const cA = new THREE.Color(); const cB = new THREE.Color();
function setSky(t) {
  const f = t * 2; const i = Math.min(1, Math.floor(f)); const k = f - i;
  const A = SKY[i]; const B = SKY[i + 1];
  const mix = (key, tgt) => { cA.set(A[key]); cB.set(B[key]); tgt.copy(cA).lerp(cB, k); };
  mix('top', skyMat.uniforms.top.value); mix('mid', skyMat.uniforms.mid.value); mix('bot', skyMat.uniforms.bot.value);
  mix('fog', scene.fog.color); mix('sun', sun.color); mix('hemi', hemi.color);
  sun.intensity = lerp(A.i, B.i, k); skyMat.uniforms.sunCol.value.copy(sun.color);
  stars.material.opacity = clamp(1 - t * 2.4, 0, 0.9);
}

/* ---------------------------------------------------------------- layout: stations, rects */
const ST = STATIONS.map((s, i) => ({ ...s, i }));
const RECTS = []; // flatten + keep-clear rectangles
const BOARDS = [];
ST.forEach((s) => {
  s.boards.forEach((b) => {
    const cx = b.cx !== undefined ? b.cx : s.x + b.dx; const cy = b.cy !== undefined ? b.cy : s.y + b.dy;
    const o = { ...b, cx, cy, st: s.i };
    o.r = { x0: cx - b.w / 2, x1: cx + b.w / 2, y0: cy - b.h / 2, y1: cy + b.h / 2 };
    BOARDS.push(o); RECTS.push({ ...o.r, m: 0.6 });
  });
  if (!s.ground) RECTS.push({ x0: s.x - 4.8, x1: s.x + 4.8, y0: s.y - 2.2, y1: s.y + 1.2, m: 0.2 });
});
function flatMask(x, y) {
  let m = 1;
  for (const r of RECTS) {
    const dx = Math.max(r.x0 - x, 0, x - r.x1); const dy = Math.max(r.y0 - y, 0, y - r.y1);
    const d = Math.hypot(dx, dy); if (d < 2.4) m = Math.min(m, sstep(0, 2.4, d));
  }
  return m;
}
function rawZ(x, y) {
  const big = fbm(x * 0.085 + 3, y * 0.065, 4) - 0.5;
  const mid = fbm(x * 0.33, y * 0.3 + 9, 3) - 0.5;
  const crack = Math.pow(1 - Math.abs(vnoise(x * 0.5 + 20, y * 0.045) - 0.5) * 2, 12);
  const bands = Math.sin(y * 0.5 + fbm(x * 0.1, y * 0.1) * 6) * 0.1;
  return big * 4.4 + mid * 1.0 + bands - crack * 0.8;
}
const wallZ = (x, y) => rawZ(x, y) * flatMask(x, y);

/* ---------------------------------------------------------------- wall mesh */
const WALL = { w: 150, x0: -75, y0: -3, y1: TOP, cell: 0.6 };
const wallMat = new THREE.MeshStandardMaterial({ vertexColors: true, roughness: 0.95, metalness: 0 });
(function buildWall() {
  const nx = Math.round(WALL.w / WALL.cell); const ny = Math.round((WALL.y1 - WALL.y0) / WALL.cell);
  const pos = new Float32Array((nx + 1) * (ny + 1) * 3); const col = new Float32Array((nx + 1) * (ny + 1) * 3);
  const lo = new THREE.Color(0xd2a070); const mid = new THREE.Color(0xb8664a); const hi = new THREE.Color(0x8d8aa6); const c = new THREE.Color();
  let k = 0;
  for (let j = 0; j <= ny; j++) {
    const y = WALL.y0 + j * WALL.cell * ((WALL.y1 - WALL.y0) / (ny * WALL.cell));
    for (let i = 0; i <= nx; i++) {
      const x = WALL.x0 + i * WALL.cell;
      const z = wallZ(x, y);
      pos[k] = x; pos[k + 1] = y; pos[k + 2] = z;
      const t1 = sstep(30, 100, y); const t2 = sstep(100, 190, y);
      c.copy(lo).lerp(mid, t1).lerp(hi, t2);
      const strata = 0.5 + 0.5 * Math.sin(y * 0.62 + fbm(x * 0.07, y * 0.07) * 5);
      const n = fbm(x * 0.22, y * 0.22 + 4, 3);
      const sh = (0.62 + 0.55 * sstep(-2.4, 2.2, z)) * (0.82 + 0.3 * n) * (1 - strata * 0.16);
      col[k] = c.r * sh; col[k + 1] = c.g * sh; col[k + 2] = c.b * sh;
      k += 3;
    }
  }
  const idx = new Uint32Array(nx * ny * 6); let q = 0;
  for (let j = 0; j < ny; j++) for (let i = 0; i < nx; i++) {
    const a = j * (nx + 1) + i; const b = a + 1; const d = a + nx + 1; const e = d + 1;
    idx[q++] = a; idx[q++] = b; idx[q++] = d; idx[q++] = b; idx[q++] = e; idx[q++] = d;
  }
  const g = new THREE.BufferGeometry();
  g.setAttribute('position', new THREE.BufferAttribute(pos, 3)); g.setAttribute('color', new THREE.BufferAttribute(col, 3));
  g.setIndex(new THREE.BufferAttribute(idx, 1)); g.computeVertexNormals();
  const m = new THREE.Mesh(g, wallMat); m.receiveShadow = true; m.castShadow = true; scene.add(m);
})();

/* ground + plateau + peaks */
(function buildGround() {
  const mk = (w, d, y, z, c1, c2) => {
    const sx = Math.round(w / 3); const sz = Math.round(d / 3);
    const g = new THREE.PlaneGeometry(w, d, sx, sz); g.rotateX(-Math.PI / 2);
    const p = g.attributes.position; const cols = new Float32Array(p.count * 3); const a = new THREE.Color(c1); const b = new THREE.Color(c2); const c = new THREE.Color();
    for (let i = 0; i < p.count; i++) { const n = fbm(p.getX(i) * 0.12, p.getZ(i) * 0.12 + 7, 3); c.copy(a).lerp(b, n * 1.4); cols[i * 3] = c.r; cols[i * 3 + 1] = c.g; cols[i * 3 + 2] = c.b; p.setY(i, (n - 0.5) * 0.5 * (Math.abs(p.getZ(i)) > 3 ? 1 : 0.2)); }
    g.setAttribute('color', new THREE.BufferAttribute(cols, 3)); g.computeVertexNormals();
    const m = new THREE.Mesh(g, new THREE.MeshStandardMaterial({ vertexColors: true, roughness: 1 })); m.position.set(0, y, z); m.receiveShadow = true; scene.add(m);
  };
  mk(300, 160, 0, 80 - 0.5, 0x6b6a3a, 0x9c8452);          // base camp ground
  mk(300, 260, TOP, -130 + 1.5, 0xe9eef7, 0xb9c6e0);       // summit snow plateau
})();
function peak(x, z, r, h, seed2) {
  const g = new THREE.ConeGeometry(r, h, 9, 6, true); const p = g.attributes.position; const col = new Float32Array(p.count * 3);
  const rock = new THREE.Color(0x58526b); const snow = new THREE.Color(0xf3f6ff); const c = new THREE.Color();
  for (let i = 0; i < p.count; i++) {
    const y = p.getY(i); const t = (y + h / 2) / h; const a = Math.atan2(p.getZ(i), p.getX(i));
    const n = (vnoise(a * 2.2 + seed2, y * 0.06 + seed2) - 0.5);
    p.setX(i, p.getX(i) * (1 + n * 0.35)); p.setZ(i, p.getZ(i) * (1 + n * 0.35)); p.setY(i, y + n * h * 0.08);
    c.copy(rock).lerp(snow, sstep(0.52 + n * 0.3, 0.7 + n * 0.2, t)); const sh = 0.8 + 0.4 * vnoise(a * 4 + seed2, t * 6);
    col[i * 3] = c.r * sh; col[i * 3 + 1] = c.g * sh; col[i * 3 + 2] = c.b * sh;
  }
  g.setAttribute('color', new THREE.BufferAttribute(col, 3)); g.computeVertexNormals();
  const m = new THREE.Mesh(g, new THREE.MeshStandardMaterial({ vertexColors: true, roughness: 1, flatShading: true }));
  m.position.set(x, TOP + h / 2 - 2, z); scene.add(m); return m;
}
[[-140, -330, 90, 190, 1], [-30, -420, 130, 300, 2], [95, -360, 100, 220, 3], [210, -300, 80, 150, 4], [-250, -280, 80, 140, 5], [20, -620, 220, 420, 6]].forEach((a) => peak(...a));

/* ---------------------------------------------------------------- boards */
const FD = '"Bebas Neue", Impact, "Arial Narrow", sans-serif';
const FM = '"DM Mono", ui-monospace, Menlo, monospace';
function fitText(g, text, maxW, px, min, font, weight = '') {
  let s = px; g.font = `${weight} ${s}px ${font}`;
  while (s > min && g.measureText(text).width > maxW) { s -= 2; g.font = `${weight} ${s}px ${font}`; }
  return s;
}
function wrap(g, text, maxW) {
  const words = text.split(' '); const out = []; let cur = '';
  for (const w of words) { const t = cur ? cur + ' ' + w : w; if (g.measureText(t).width > maxW && cur) { out.push(cur); cur = w; } else cur = t; }
  if (cur) out.push(cur); return out;
}
function boardTexture(b) {
  const W = 1024; const H = Math.round(W * b.h / b.w);
  const c = document.createElement('canvas'); c.width = W; c.height = H; const g = c.getContext('2d');
  const acc = b.accent || '#ff6a2b'; const pad = 54;
  g.fillStyle = '#10141c'; g.fillRect(0, 0, W, H);
  const gr = g.createLinearGradient(0, 0, W, H); gr.addColorStop(0, 'rgba(255,255,255,.05)'); gr.addColorStop(1, 'rgba(255,255,255,0)'); g.fillStyle = gr; g.fillRect(0, 0, W, H);
  g.strokeStyle = 'rgba(255,255,255,.035)'; g.lineWidth = 20;
  for (let i = -H; i < W + H; i += 56) { g.beginPath(); g.moveTo(i, 0); g.lineTo(i + H, H); g.stroke(); }
  g.fillStyle = acc; g.fillRect(0, 0, 16, H); g.fillRect(0, 0, W, 8);
  g.strokeStyle = acc; g.lineWidth = 6; g.strokeRect(3, 3, W - 6, H - 6);
  g.textBaseline = 'alphabetic'; g.textAlign = 'left';
  let y = 34;
  if (b.kicker) { g.fillStyle = acc; const s = fitText(g, b.kicker, W - pad * 2, 30, 18, FM, '500'); y += s; g.fillText(b.kicker, pad, y); y += 12; }
  g.fillStyle = '#f4f1ea';
  const hasT2 = !!b.title2; const lines = b.lines || [];
  const tmax = lines.length ? (hasT2 ? 112 : 132) : 150;
  const s1 = fitText(g, b.title, W - pad * 2, tmax, 50, FD); y += s1 * 0.8; g.fillText(b.title, pad, y); y += s1 * 0.12;
  if (hasT2) { g.fillStyle = acc; const s2 = fitText(g, b.title2, W - pad * 2, 80, 40, FD); y += s2 * 0.9; g.fillText(b.title2, pad, y); y += s2 * 0.04; }
  if (b.sub && !lines.length) { g.fillStyle = '#9fb0c8'; const s = fitText(g, b.sub, W - pad * 2, 38, 20, FM, '500'); y += s + 14; g.fillText(b.sub, pad, y); }
  if (lines.length) {
    const bottom = H - (b.sub ? 78 : 30); const top = y + 24; let lw = 250;
    let fs = 40; let rows;
    for (; fs >= 22; fs -= 2) {
      g.font = `${Math.round(fs * 1.12)}px ${FD}`; lw = Math.max(...lines.map(([l]) => g.measureText(l).width)) + 34;
      g.font = `500 ${fs}px ${FM}`;
      rows = lines.map(([l, r]) => wrap(g, r, W - pad * 2 - lw));
      const tot = rows.reduce((a, r) => a + r.length * fs * 1.22 + 22, 0);
      if (top + tot <= bottom) break;
    }
    let yy = top;
    lines.forEach(([l, r], i) => {
      const rh = rows[i].length * fs * 1.22 + 22;
      if (i % 2 === 0) { g.fillStyle = 'rgba(255,255,255,.055)'; g.fillRect(pad - 16, yy, W - pad * 2 + 32, rh); }
      g.fillStyle = acc; g.font = `${Math.round(fs * 1.12)}px ${FD}`; g.fillText(l, pad, yy + fs * 1.0 + 6);
      g.fillStyle = '#f4f1ea'; g.font = `500 ${fs}px ${FM}`;
      rows[i].forEach((t, k) => g.fillText(t, pad + lw, yy + fs * 1.0 + 6 + k * fs * 1.22));
      yy += rh;
    });
  }
  if (b.sub && lines.length) { g.fillStyle = '#9fb0c8'; fitText(g, b.sub, W - pad * 2, 30, 18, FM, '500'); g.fillText(b.sub, pad, H - 28); }
  const t = new THREE.CanvasTexture(c); t.colorSpace = THREE.SRGBColorSpace; t.anisotropy = 8; t.generateMipmaps = true; return t;
}
function makeBoard(b) {
  const g = new THREE.Group();
  const fm = new THREE.MeshStandardMaterial({ color: 0x1b1f28, roughness: 0.7, metalness: 0.3 });
  const frame = new THREE.Mesh(new THREE.BoxGeometry(b.w + 0.5, b.h + 0.5, 0.36), fm); frame.position.z = 0.18; frame.castShadow = true; frame.receiveShadow = true; g.add(frame);
  const face = new THREE.Mesh(new THREE.PlaneGeometry(b.w, b.h), new THREE.MeshBasicMaterial({ map: boardTexture(b), toneMapped: false }));
  face.position.z = 0.365; g.add(face);
  const bm = new THREE.MeshStandardMaterial({ color: 0xc9ced6, metalness: 0.8, roughness: 0.3 });
  [[-1, -1], [1, -1], [-1, 1], [1, 1]].forEach(([sx, sy]) => { const s = new THREE.Mesh(new THREE.CylinderGeometry(0.16, 0.16, 0.2, 8), bm); s.rotation.x = Math.PI / 2; s.position.set(sx * (b.w / 2 + 0.02), sy * (b.h / 2 + 0.02), 0.4); g.add(s); });
  g.position.set(b.cx, b.cy, 0);
  scene.add(g); return g;
}

/* ---------------------------------------------------------------- models */
const lm = new THREE.LoadingManager();
lm.onProgress = (u, a, t) => { const p = Math.round((a / t) * 100); $('lp').textContent = p + '%'; $('lbar').style.width = p + '%'; };
const gl = new GLTFLoader(lm); gl.setMeshoptDecoder(MeshoptDecoder);
const load = (u) => new Promise((res, rej) => gl.load(u, res, undefined, rej));
const VC = new THREE.MeshStandardMaterial({ vertexColors: true, roughness: 0.82, metalness: 0.02 });
const MET = new THREE.MeshStandardMaterial({ vertexColors: true, roughness: 0.4, metalness: 0.5 });
function prep(o, shadow = true) { o.traverse((m) => { if (m.isMesh) { m.material = VC; m.castShadow = shadow; m.receiveShadow = true; } }); return o; }

/* ---------------------------------------------------------------- route, holds, nodes */
const NODES = [];
const GEAR = [];
const LEDGE_STATIONS = ST.filter((s) => !s.ground);
function routeX(y) {
  const pts = [{ y: 0, x: 0 }];
  LEDGE_STATIONS.forEach((s) => { pts.push({ y: s.y - 6, x: s.x }); pts.push({ y: s.y + (s.summit ? 14 : 15), x: s.x }); });
  if (y <= 0) return 0;
  for (let i = 0; i < pts.length - 1; i++) {
    if (y >= pts[i].y && y <= pts[i + 1].y) { const t = sstep(pts[i].y, pts[i + 1].y, y); return lerp(pts[i].x, pts[i + 1].x, t); }
  }
  return pts[pts.length - 1].x;
}
function blocked(x, y) {
  for (const r of RECTS) { if (r.m === 0.6 && x > r.x0 - 0.6 && x < r.x1 + 0.6 && y > r.y0 - 0.7 && y < r.y1 + 0.7) return true; }
  for (const s of LEDGE_STATIONS) { if (Math.abs(x - s.x) < 4.5 && y > s.y - 2.6 && y < s.y + 3.0) return true; }
  return inTree(x, y, 0.4);
}
const TREES = [];
function planTrees(skip = new Set()) {
  TREES.length = 0; seed = 5;
  for (let y = 12, i = 0; y < TOP - 22; y += 11 + rnd() * 3, i++) {
    const side = i % 2 ? 1 : -1;
    for (const off of [side * 4.4, -side * 4.4, side * 2.6, -side * 2.6, side * 6]) {
      const x = routeX(y) + off + (rnd() - 0.5) * 1.2; const r = { x0: x - 3.2, x1: x + 3.2, y0: y - 1.4, y1: y + 5.4 };
      const hitB = BOARDS.some((b) => r.x1 > b.r.x0 - 1.5 && r.x0 < b.r.x1 + 1.5 && r.y1 > b.r.y0 - 1.0 && r.y0 < b.r.y1 + 1.0);
      const hitL = LEDGE_STATIONS.some((l) => Math.abs(x - l.x) < 8.2 && y + 5.4 > l.y - 4.2 && y - 1.4 < l.y + 4.5);
      const hitT = TREES.some((t) => Math.abs(t.x - x) < 7 && Math.abs(t.y - y) < 7);
      if (hitB || hitL || hitT || Math.abs(x) > 17) continue;
      if (skip.has(i)) break;
      TREES.push({ key: i, x, y, h: { x0: x - 2.7, x1: x + 2.7, y0: y - 1.0, y1: y + 5.0 } }); break;
    }
  }
}
const inTree = (x, y, m = 0.3) => TREES.some((t) => x > t.h.x0 - m && x < t.h.x1 + m && y > t.h.y0 - m && y < t.h.y1 + m);
const HOLD_COLORS = [0xff6a2b, 0x2ec4b6, 0xffc83d, 0xf4f1ea, 0xe0457b, 0x7aa6ff, 0x9be564];
function genHolds() {
  const out = [];
  seed = 11;
  let y = 2.5;
  while (y < TOP - 0.7) {
    const xc = routeX(y);
    const summitZone = y > 205;
    const half = summitZone ? 1.0 : 7.0; const step = summitZone ? 1.6 : 1.85;
    for (let x = xc - half; x <= xc + half + 0.01; x += step) {
      const px = x + (rnd() - 0.5) * 0.9; const py = y + (rnd() - 0.5) * 0.9;
      if (blocked(px, py) || py > TOP - 0.6) continue;
      const r = rnd(); const type = r < 0.3 ? 'jug' : r < 0.56 ? 'crimp' : r < 0.76 ? 'sloper' : r < 0.92 ? 'pinch' : 'foot';
      out.push({ x: px, y: py, z: wallZ(px, py), type, rot: (rnd() - 0.5) * 1.2, col: HOLD_COLORS[Math.floor(rnd() * HOLD_COLORS.length)], s: 0.68 + rnd() * 0.22 });
    }
    y += 1.5 + rnd() * 0.35;
  }
  // access ladders beside each ledge so the stand nodes are always reachable from the sides
  LEDGE_STATIONS.forEach((s) => {
    [-1, 1].forEach((side) => {
      const x = s.x + side * 5.2;
      for (let yy = s.y - 4.2; yy <= s.y + 0.75; yy += 1.45) {
        if (inTree(x, yy, 0.4) || RECTS.some((r) => r.m === 0.6 && x > r.x0 - 0.3 && x < r.x1 + 0.3 && yy > r.y0 - 0.3 && yy < r.y1 + 0.3)) continue;
        out.push({ x, y: yy, z: wallZ(x, yy), type: rnd() < 0.6 ? 'jug' : 'pinch', rot: (rnd() - 0.5) * 0.6, col: HOLD_COLORS[Math.floor(rnd() * HOLD_COLORS.length)], s: 0.85 });
      }
    });
  });
  return out;
}
const DRAIN = { jug: 0.5, crimp: 1.6, sloper: 2.4, pinch: 1.3, foot: 0, stand: -14 };
function reachInfo() {
  const start = NODES.findIndex((n) => n.ground && n.x === 0); const seen = new Set([start]); const q = [start];
  while (q.length) { const a = q.shift(); for (const e of NODES[a].nb) if (!seen.has(e.j)) { seen.add(e.j); q.push(e.j); } }
  let top = NODES[start]; let ok = true;
  NODES.forEach((n) => { if (seen.has(n.id)) { if (n.hip.y > top.hip.y) top = n; } else if (n.k === 'stand') ok = false; });
  return { ok, x: top.x, y: top.y };
}
function buildNodes(holds) {
  NODES.length = 0;
  const add = (n) => { n.id = NODES.length; n.nb = []; NODES.push(n); return n; };
  ST.forEach((s) => {
    if (s.ground) { for (let i = -3; i <= 3; i++) add({ k: 'stand', x: i * 2.8, y: 0, z: 2.2, st: s.i, hip: new V3(i * 2.8, 1.1, 2.2), surf: 0, type: 'stand', ground: true }); return; }
    [-3.0, 0, 3.0].forEach((dx, j) => add({ k: 'stand', x: s.x + dx, y: s.y, z: 1.8, st: s.i, hip: new V3(s.x + dx, s.y + 1.1, 1.8), surf: s.y, type: 'stand', mid: j === 1, ledge: true }));
  });
  [-3, 0, 3].forEach((x) => add({ k: 'stand', x, y: TOP, z: -3.5, st: ST.length - 1, hip: new V3(x, TOP + 1.1, -3.5), surf: TOP, type: 'stand', plateau: true }));
  holds.forEach((h, i) => { if (h.type !== 'foot') add({ k: 'hold', x: h.x, y: h.y, z: h.z, st: -1, hip: new V3(h.x, h.y - 1.25, h.z + 0.95), type: h.type, h: i }); });
  const n = NODES.length;
  for (let a = 0; a < n; a++) for (let b = a + 1; b < n; b++) {
    const A = NODES[a]; const B = NODES[b];
    const dx = B.hip.x - A.hip.x; const dy = B.hip.y - A.hip.y; const d = Math.hypot(dx, dy);
    let lim = (A.k === 'stand' && B.k === 'stand') ? 3.0 : (A.k === 'stand' || B.k === 'stand') ? 3.15 : 2.85;
    if ((A.plateau || B.plateau) && A.k !== B.k) lim = 3.9;
    if (d > lim || d < 0.5) continue;
    if (A.k === 'stand' && B.k === 'stand' && (A.st !== B.st || A.plateau !== B.plateau)) continue;
    if (A.k === 'stand' && B.k === 'stand' && Math.abs(dy) > 0.3) continue;
    if (A.k === 'hold' && B.k === 'hold') { let hit = false; for (let q = 1; q < 6 && !hit; q++) { const f = q / 6; if (inTree(lerp(A.x, B.x, f), lerp(A.y, B.y, f), 0.5)) hit = true; } if (hit) continue; }
    A.nb.push({ j: b, dx, dy, d }); B.nb.push({ j: a, dx: -dx, dy: -dy, d });
  }
}

/* ---------------------------------------------------------------- game state */
const S = {
  node: 0, hip: new V3(), mv: null, mode: 'stand', // stand | move | zip | fall | roll | top
  chalk: 100, chalkCd: 0, last: 0, side: 'L', idle: 0, rack: new Set(), reached: new Set(), tNow: 0, started: false, done: false,
  draws: 10, clips: [], clipT: null, clipAnim: 0, freeHand: 'L', hit: 0, birdWarn: false, missedSeen: new Set(), pump: 0,
  lastLedge: 0, rollT: 0, zipT: 0, zipTo: null, fallT: 0, stationNow: -1, muted: false,
};
const IN = { dir: new V3(), keys: new Set(), rep: 0 };
const DRAWMAX = 10; let FA; let harnessDraws = []; let ropeMesh; let clipRing; const BIRDS = []; let birdSrc; let birdT = 4;
let climberG; let CN = {}; let PROPS; let HOLDS = []; let gearMeshes = []; let planeObj; let flagObj; let ropeLine; let dust;
const LIMB = {};
const DOWN = new V3(0, -1, 0);
const AU = 0.42; const AL = 0.45; const LU = 0.55; const LL = 0.55;
const SHO = { L: new V3(-0.34, 0.72, 0), R: new V3(0.34, 0.72, 0) };
const HIPO = { L: new V3(-0.16, 0, 0), R: new V3(0.16, 0, 0) };
const tmpA = new V3(); const tmpB = new V3(); const tmpC = new V3(); const tmpQ = new THREE.Quaternion();

function solveLimb(S0, T, l1, l2, pole, upNode, loNode) {
  const d = tmpA.copy(T).sub(S0); let dist = d.length(); const maxd = l1 + l2 - 0.002;
  if (dist > maxd) { d.multiplyScalar(maxd / dist); dist = maxd; }
  if (dist < 0.12) { dist = 0.12; }
  const dir = tmpB.copy(d).normalize();
  const a = clamp((l1 * l1 + dist * dist - l2 * l2) / (2 * l1 * dist), -1, 1); const ang = Math.acos(a);
  const p = tmpC.copy(pole); p.addScaledVector(dir, -p.dot(dir)); if (p.lengthSq() < 1e-5) p.set(0, 0, 1); p.normalize();
  const J = new V3().copy(S0).addScaledVector(dir, l1 * Math.cos(ang)).addScaledVector(p, l1 * Math.sin(ang));
  const E = new V3().copy(S0).addScaledVector(dir, dist);
  upNode.position.copy(S0); upNode.quaternion.setFromUnitVectors(DOWN, tmpA.copy(J).sub(S0).normalize());
  loNode.position.copy(J); loNode.quaternion.setFromUnitVectors(DOWN, tmpA.copy(E).sub(J).normalize());
}

function pickHoldNear(p, maxD, skip) {
  let best = -1; let bd = maxD;
  for (const n of NODES) { if (n.k !== 'hold' || n.id === skip) continue; const d = Math.hypot(n.x - p.x, n.y - p.y); if (d < bd) { bd = d; best = n.id; } }
  return best;
}
function pickFootNear(p, maxD) {
  let best = null; let bd = maxD;
  for (const h of HOLDS) { const d = Math.hypot(h.x - p.x, h.y - p.y); if (d < bd) { bd = d; best = h; } }
  return best;
}

// desired limb targets for the climber resting on node n (world space)
function poseFor(n, out) {
  const hip = n.hip;
  if (n.k === 'stand') {
    [['L', -1], ['R', 1]].forEach(([k, s]) => {
      out['h' + k] = new V3(hip.x + s * 0.5, hip.y - 0.55, hip.z + 0.06);
      out['f' + k] = new V3(hip.x + s * 0.2, n.surf, hip.z - 0.12);
    });
    return;
  }
  // climbing: one hand on this hold, other hand on another hold if close
  const grab = S.side; const other = grab === 'L' ? 'R' : 'L';
  out['h' + grab] = new V3(n.x, n.y - 0.04, n.z + 0.22);
  S.side = other; S.freeHand = other;
  const want = new V3(hip.x + (other === 'L' ? -0.55 : 0.55), hip.y + 1.35, 0);
  const oh = pickHoldNear(want, 1.5, n.id);
  out['h' + other] = oh >= 0 ? new V3(NODES[oh].x, NODES[oh].y - 0.04, NODES[oh].z + 0.22) : new V3(want.x, want.y - 0.1, n.z + 0.3);
  [['L', -1], ['R', 1]].forEach(([k, s]) => {
    const wf = new V3(hip.x + s * 0.28, hip.y - 1.0, 0);
    const fh = pickFootNear(wf, 0.95);
    out['f' + k] = fh ? new V3(fh.x, fh.y + 0.05, fh.z + 0.28) : new V3(wf.x, wf.y - 0.1, wallZ(wf.x, wf.y) + 0.3);
  });
}

function setupClimber(src) {
  climberG = new THREE.Group(); scene.add(climberG);
  const root = src.scene;
  root.traverse((o) => { if (o.name) CN[o.name] = o; if (o.isMesh) { o.material = VC; o.castShadow = true; o.receiveShadow = false; } });
  ['torso', 'head', 'up_L', 'lo_L', 'up_R', 'lo_R', 'th_L', 'sh_L', 'th_R', 'sh_R'].forEach((k) => climberG.add(CN[k]));
  ['hL', 'hR', 'fL', 'fR'].forEach((k) => { LIMB[k] = { cur: new V3(), tgt: new V3(), init: false }; });
  // chalk dust
  const N = 60; const pos = new Float32Array(N * 3); const g = new THREE.BufferGeometry(); g.setAttribute('position', new THREE.BufferAttribute(pos, 3));
  dust = new THREE.Points(g, new THREE.PointsMaterial({ color: 0xffffff, size: 0.35, transparent: true, opacity: 0.0, depthWrite: false }));
  dust.userData = { vel: Array.from({ length: N }, () => new V3()), life: 0 }; dust.frustumCulled = false; scene.add(dust);
  buildHarness();
}
function buildHarness() {
  const web = new THREE.MeshStandardMaterial({ color: 0x1c1e26, roughness: 0.8 }); const acc = new THREE.MeshStandardMaterial({ color: 0xff6a2b, roughness: 0.6 });
  const ring = (r, y, x, sx = 1, sz = 0.8, m = web, t = 0.05) => { const o = new THREE.Mesh(new THREE.TorusGeometry(r, t, 6, 20), m); o.rotation.x = Math.PI / 2; o.scale.set(sx, sz, 1); o.position.set(x, y, 0); climberG.add(o); return o; };
  ring(0.29, 0.06, 0, 1, 0.78, web, 0.06); ring(0.15, -0.3, -0.16, 1, 1, web, 0.045); ring(0.15, -0.3, 0.16, 1, 1, web, 0.045);
  const bk = new THREE.Mesh(new THREE.BoxGeometry(0.12, 0.09, 0.05), acc); bk.position.set(0, 0.06, -0.24); climberG.add(bk);
  const loopG = new THREE.TorusGeometry(0.05, 0.015, 4, 8);
  harnessDraws = [];
  for (let side = -1; side <= 1; side += 2) for (let k = 0; k < 5; k++) {
    const gl2 = new THREE.Mesh(loopG, METAL); gl2.position.set(side * 0.3, 0.06, -0.18 + k * 0.09); gl2.rotation.y = Math.PI / 2; climberG.add(gl2);
    const d = makeDraw(SLINGC[(k + (side > 0 ? 2 : 0)) % 4]); d.scale.setScalar(0.34); d.position.set(side * 0.33, 0.05, -0.18 + k * 0.09); d.rotation.set(0, Math.PI / 2, side * 0.12); climberG.add(d); harnessDraws.push(d);
  }
  updateDrawsHUD();
}
function setupRope() {
  const g = new THREE.BufferGeometry(); g.setAttribute('position', new THREE.BufferAttribute(new Float32Array(RN * 4 * 3), 3));
  const idx = []; for (let i = 0; i < RN - 1; i++) for (let k = 0; k < 4; k++) { const a = i * 4 + k; const b = i * 4 + (k + 1) % 4; idx.push(a, a + 4, b, b, a + 4, b + 4); }
  g.setIndex(idx);
  ropeMesh = new THREE.Mesh(g, new THREE.MeshBasicMaterial({ color: 0xffb21a, side: THREE.DoubleSide })); ropeMesh.frustumCulled = false; scene.add(ropeMesh);
  clipRing = new THREE.Mesh(new THREE.RingGeometry(0.42, 0.55, 28), new THREE.MeshBasicMaterial({ color: 0xff6a2b, transparent: true, depthTest: false })); clipRing.renderOrder = 20; clipRing.visible = false; scene.add(clipRing);
}
const RN = 90; const RP = []; const RSEG = [];
function updateRope() {
  const a = NODES[S.lastLedge]; RP.length = 0;
  RP.push(new V3(a.hip.x + 0.4, (a.surf || 0) + 1.0, a.hip.z - 0.2));
  S.clips.forEach((g) => RP.push(g.pt));
  RP.push(new V3(S.hip.x, S.hip.y - 0.05, S.hip.z - 0.24));
  let total = 0; RSEG.length = 0;
  for (let i = 0; i < RP.length - 1; i++) { const l = RP[i].distanceTo(RP[i + 1]); RSEG.push(l); total += l; }
  const pos = ropeMesh.geometry.attributes.position; const r = 0.055; const last = RP.length - 2;
  let seg = 0; let acc = 0;
  for (let i = 0; i < RN; i++) {
    const d = (i / (RN - 1)) * total;
    while (seg < last && acc + RSEG[seg] < d) { acc += RSEG[seg]; seg++; }
    const t = RSEG[seg] > 0 ? clamp((d - acc) / RSEG[seg], 0, 1) : 0;
    const A = RP[seg]; const B = RP[seg + 1];
    let x = lerp(A.x, B.x, t); let y = lerp(A.y, B.y, t); let z = lerp(A.z, B.z, t);
    const sag = Math.sin(Math.PI * t) * Math.min(1.4, RSEG[seg] * (seg === last ? 0.09 : 0.03));
    y -= sag * 0.5; z += sag * 0.9; x += sag * 0.2 * Math.sin(S.tNow * 0.8 + seg);
    const o = i * 12; pos.array[o] = x + r; pos.array[o + 1] = y; pos.array[o + 2] = z; pos.array[o + 3] = x; pos.array[o + 4] = y; pos.array[o + 5] = z + r;
    pos.array[o + 6] = x - r; pos.array[o + 7] = y; pos.array[o + 8] = z; pos.array[o + 9] = x; pos.array[o + 10] = y; pos.array[o + 11] = z - r;
  }
  pos.needsUpdate = true;
}
function setupBirds() { birdSrc = FA; }
function spawnBird() {
  const body = birdSrc.getObjectByName('bird_body'); const wl = birdSrc.getObjectByName('bird_wL'); const wr = birdSrc.getObjectByName('bird_wR'); if (!body) return;
  const g = new THREE.Group(); const bd = prep(body.clone(true), false); const l = prep(wl.clone(true), false); const r = prep(wr.clone(true), false); g.add(bd, l, r); g.scale.setScalar(2.6);
  const side = Math.random() > 0.5 ? 1 : -1;
  const b = { g, wl: l, wr: r, st: 'in', t: 0, p: new V3(S.hip.x + side * (20 + Math.random() * 6), S.hip.y + 4 + Math.random() * 6, S.hip.z + 3), v: new V3(-side * 6, -2, 0), ph: Math.random() * 6 };
  g.position.copy(b.p); scene.add(g); BIRDS.push(b);
  if (!S.birdWarn) { S.birdWarn = true; toast('BIRD!', 'MOVE, DYNO OR CHALK UP TO SHOO IT'); }
  sfx.bird();
}
const HEAD = new V3();
function updateBirds(dt) {
  const n = NODES[S.node]; const alt = S.hip.y;
  const maxB = alt < 48 ? 0 : clamp(Math.floor((alt - 48) / 36) + 1, 1, 5);
  const climbing = n.k === 'hold' && (S.mode === 'stand' || S.mode === 'move') && !S.done && S.started;
  birdT -= dt;
  if (climbing && BIRDS.length < maxB && birdT <= 0) { spawnBird(); birdT = lerp(7, 3.4, clamp(alt / TOP, 0, 1)) + Math.random() * 2; }
  HEAD.set(S.hip.x, S.hip.y + 1.55, S.hip.z + 0.25);
  for (let i = BIRDS.length - 1; i >= 0; i--) {
    const b = BIRDS[i]; b.t += dt; b.ph += dt * 16;
    if (b.st === 'in' && !climbing) { b.st = 'out'; b.t = 0; }
    const speed = b.st === 'in' ? 7 + (alt / TOP) * 4.5 : 10;
    const want = tmpA.copy(b.st === 'in' ? HEAD : tmpB.set(b.p.x + (b.p.x > S.hip.x ? 30 : -30), b.p.y + 10, b.p.z)).sub(b.p);
    const dist = want.length(); want.normalize().multiplyScalar(speed);
    b.v.lerp(want, 1 - Math.exp(-dt * (b.st === 'in' ? 2.6 : 3)));
    b.p.addScaledVector(b.v, dt); if (b.st === 'in') b.p.y += Math.sin(b.ph * 0.5) * dt * 1.2;
    b.g.position.copy(b.p); b.g.rotation.y = Math.atan2(-b.v.z, b.v.x); b.g.rotation.z = clamp(b.v.y * 0.05, -0.5, 0.5);
    const f = Math.sin(b.ph) * 0.9; b.wl.rotation.x = f; b.wr.rotation.x = -f;
    if (b.st === 'in' && dist < 1.0) {
      const dodge = S.mode !== 'stand' || n.k !== 'hold';
      if (!dodge) { S.chalk -= 22; S.hit = 0.45; sfx.slip(); toast('BIRD!', 'CHALK DOWN · MOVE OR CHALK UP'); } else toast('DODGED', 'NICE MOVE');
      b.st = 'out'; b.t = 0; b.v.set((Math.random() - 0.5) * 8, 7, 4);
    }
    if (b.t > 7 || Math.abs(b.p.x - S.hip.x) > 36 || Math.abs(b.p.y - S.hip.y) > 40) { scene.remove(b.g); BIRDS.splice(i, 1); }
  }
}
function updateClimber(dt) {
  const n = NODES[S.node];
  // body position
  let hip = S.hip; let roll = 0; let hang = false; let rest = true;
  if (S.mode === 'move') {
    S.mv.t += dt / S.mv.dur; const t = clamp(S.mv.t, 0, 1); const e = t * t * (3 - 2 * t);
    hip.lerpVectors(S.mv.from, S.mv.to, e); hip.z += (S.mv.dyno ? 0.7 : 0.28) * Math.sin(Math.PI * e); hip.y += (S.mv.dyno ? 0.55 : 0.12) * Math.sin(Math.PI * e);
    if (S.mv.dyno && t > 0.12 && t < 0.85) hang = true;
    if (S.mv.t >= 1) arrive(S.mv.toId);
  } else if (S.mode === 'zip') {
    S.zipT += dt / S.zipDur; const t = clamp(S.zipT, 0, 1); const e = t * t * (3 - 2 * t);
    hip.lerpVectors(S.zipFrom, S.zipTo, e); hip.z += 0.4 + 0.2 * Math.sin(S.tNow * 3); hang = true;
    if (S.zipT >= 1) arrive(S.zipId);
  } else if (S.mode === 'fall') {
    S.fallT += dt / (S.fallDur || 1.5); const t = clamp(S.fallT, 0, 1); const e = 1 - Math.pow(1 - t, 3);
    hip.lerpVectors(S.zipFrom, S.zipTo, e); hip.x += Math.sin(t * 9) * (1 - t) * 0.9; hip.z += 0.5 * (1 - t); hang = true;
    if (S.fallT >= 1) arrive(S.zipId);
  } else {
    hip.lerp(n.hip, 1 - Math.exp(-dt * 14));
    if (S.mode === 'roll') {
      S.rollT += dt / 1.1; const t = clamp(S.rollT, 0, 1); roll = t * Math.PI * 2; hip.y = n.hip.y + Math.sin(t * Math.PI) * 0.8 - 0.15 * Math.sin(t * Math.PI * 2) ; if (t >= 1) { S.mode = 'stand'; roll = 0; }
    }
  }
  if (S.hit > 0) { S.hit = Math.max(0, S.hit - dt); hip.y -= Math.sin(S.hit * 20) * 0.06; }
  if (S.clipAnim > 0) { S.clipAnim -= dt; if (S.clipAnim <= 0 && n.k === 'hold' && S.mode === 'stand') poseFor(n, S.targets); }
  const standing = n.k === 'stand' && (S.mode === 'stand' || S.mode === 'roll' || S.mode === 'move');
  const breathe = Math.sin(S.tNow * 1.7) * 0.012;
  climberG.position.set(hip.x, hip.y + breathe, hip.z);
  const lean = (S.mode === 'move' ? -0.05 : (n.k === 'hold' ? -0.14 : -0.02));
  climberG.rotation.set(lean - roll, 0, (S.mv ? (S.mv.dir || 0) : 0) * 0.0 + Math.sin(S.tNow * 0.9) * (n.k === 'hold' ? 0.02 : 0.0), 'XYZ');
  if (S.mode === 'move' && S.mv) climberG.rotation.z = clamp(-(S.mv.to.x - S.mv.from.x) * 0.06 * Math.sin(Math.PI * clamp(S.mv.t, 0, 1)), -0.2, 0.2);
  CN.head.rotation.x = n.k === 'hold' ? 0.22 : 0.0; CN.head.rotation.y = Math.sin(S.tNow * 0.6) * 0.15;
  climberG.updateMatrixWorld(true);
  // limb targets
  const tg = S.targets;
  const smooth = (k, spd) => {
    const L = LIMB[k]; const g = tg[k] || L.cur; if (!L.init) { L.cur.copy(g); L.init = true; }
    L.cur.lerp(g, 1 - Math.exp(-dt * spd)); return L.cur;
  };
  let tL; let tR; let fL; let fR;
  if (hang) {
    tL = tmpA.set(hip.x - 0.28, hip.y + 1.3, hip.z - 0.1); tR = tmpB.set(hip.x + 0.28, hip.y + 1.3, hip.z - 0.1);
    LIMB.hL.cur.lerp(tL, 1 - Math.exp(-dt * 12)); LIMB.hR.cur.lerp(tR, 1 - Math.exp(-dt * 12));
    LIMB.fL.cur.lerp(tmpC.set(hip.x - 0.2, hip.y - 1.0, hip.z + 0.1 + Math.sin(S.tNow * 6) * 0.15), 1 - Math.exp(-dt * 10));
    LIMB.fR.cur.lerp(tmpC.set(hip.x + 0.2, hip.y - 1.0, hip.z + 0.1 - Math.sin(S.tNow * 6) * 0.15), 1 - Math.exp(-dt * 10));
  } else if (S.mode === 'roll') {
    LIMB.hL.cur.set(hip.x - 0.3, hip.y + 0.4, hip.z - 0.5); LIMB.hR.cur.set(hip.x + 0.3, hip.y + 0.4, hip.z - 0.5);
    LIMB.fL.cur.set(hip.x - 0.2, hip.y - 0.4, hip.z + 0.2); LIMB.fR.cur.set(hip.x + 0.2, hip.y - 0.4, hip.z + 0.2);
  } else {
    smooth('hL', n.k === 'hold' ? 20 : 10); smooth('hR', n.k === 'hold' ? 20 : 10); smooth('fL', 14); smooth('fR', 14);
  }
  const poleH = { L: new V3(-1, -0.8, 0.55), R: new V3(1, -0.8, 0.55) };
  const poleF = { L: new V3(-0.5, 0.25, -0.9), R: new V3(0.5, 0.25, -0.9) };
  ['L', 'R'].forEach((k) => {
    const hl = climberG.worldToLocal(LIMB['h' + k].cur.clone()); const fl = climberG.worldToLocal(LIMB['f' + k].cur.clone());
    solveLimb(SHO[k], hl, AU, AL, poleH[k], CN['up_' + k], CN['lo_' + k]);
    solveLimb(HIPO[k], fl, LU, LL, poleF[k], CN['th_' + k], CN['sh_' + k]);
  });
}
S.targets = {};

/* ---------------------------------------------------------------- audio */
let AC = null;
function audio() { if (!AC) { try { AC = new (window.AudioContext || window.webkitAudioContext)(); } catch (e) { AC = false; } } return AC; }
function beep(f, d = 0.1, type = 'triangle', v = 0.06, f2 = 0, delay = 0) {
  if (S.muted) return; const a = audio(); if (!a) return; const t = a.currentTime + delay;
  const o = a.createOscillator(); const g = a.createGain(); o.type = type; o.frequency.setValueAtTime(f, t); if (f2) o.frequency.exponentialRampToValueAtTime(f2, t + d);
  g.gain.setValueAtTime(v, t); g.gain.exponentialRampToValueAtTime(0.0001, t + d); o.connect(g); g.connect(a.destination); o.start(t); o.stop(t + d + 0.02);
}
function noise(d = 0.3, v = 0.05) {
  if (S.muted) return; const a = audio(); if (!a) return; const n = a.sampleRate * d; const b = a.createBuffer(1, n, a.sampleRate); const ch = b.getChannelData(0);
  for (let i = 0; i < n; i++) ch[i] = (Math.random() * 2 - 1) * (1 - i / n);
  const s = a.createBufferSource(); const g = a.createGain(); const f = a.createBiquadFilter(); f.type = 'highpass'; f.frequency.value = 1800; s.buffer = b; g.gain.value = v; s.connect(f); f.connect(g); g.connect(a.destination); s.start();
}
const sfx = {
  grab: () => beep(240 + Math.random() * 60, 0.07, 'square', 0.025),
  chalk: () => noise(0.35, 0.06),
  clip: () => { beep(660, 0.12, 'triangle', 0.07); beep(990, 0.18, 'triangle', 0.06, 0, 0.09); },
  station: () => [523, 659, 784].forEach((f, i) => beep(f, 0.25, 'triangle', 0.06, 0, i * 0.09)),
  top: () => [523, 659, 784, 1047, 1319].forEach((f, i) => beep(f, 0.4, 'triangle', 0.07, 0, i * 0.12)),
  slip: () => beep(440, 0.5, 'sawtooth', 0.04, 90),
  bird: () => { beep(1400, 0.12, 'square', 0.03, 900); beep(1700, 0.1, 'square', 0.03, 1100, 0.14); },
  roll: () => { beep(200, 0.5, 'sine', 0.05, 500); },
};

/* ---------------------------------------------------------------- HUD */
let toastT = 0;
function toast(big, small = '') { const t = $('toast'); t.innerHTML = big + (small ? `<small>${small}</small>` : ''); t.classList.add('on'); clearTimeout(toastT); toastT = setTimeout(() => t.classList.remove('on'), 2300); }
function buildTopo() {
  const l = $('topoList'); l.innerHTML = '';
  ST.forEach((s) => {
    const d = document.createElement('div'); d.className = 'tp'; d.dataset.i = s.i; d.style.bottom = (s.y / TOP * 100) + '%';
    d.innerHTML = `<i>${s.ground ? '0' : s.num}</i><span>${s.short}</span>`;
    d.addEventListener('click', () => zipToStation(s.i)); l.appendChild(d);
  });
}
function updateTopo() {
  document.querySelectorAll('.tp').forEach((e) => { const i = +e.dataset.i; e.classList.toggle('done', S.reached.has(i)); e.classList.toggle('on', S.stationNow === i); });
  $('topoMe').style.bottom = (clamp(S.hip.y / TOP, 0, 1) * 100) + '%';
}
function buildRack() { const gearTotal = ST.reduce((a, s) => a + (s.gear ? s.gear.length : 0), 0); $('rackM').textContent = gearTotal; }
function addRackChip(name) { const c = document.createElement('span'); c.className = 'gc'; c.textContent = name.toUpperCase(); $('rackList').appendChild(c); $('rackN').textContent = S.rack.size; }
function buildCV() {
  $('cvMail').textContent = ME.email; $('cvMail').href = 'mailto:' + ME.email;
  $('cvWa').textContent = 'WhatsApp ' + ME.whatsappLabel; $('cvWa').href = ME.whatsapp;
  $('cvLi').textContent = ME.linkedinLabel; $('cvLi').href = ME.linkedin;
  $('cvSum').textContent = SUMMARY;
  $('cvExp').innerHTML = CV.map((j) => `<h3>${j.h}</h3><div class="d">${j.d}</div><ul>${j.b.map((b) => `<li>${b}</li>`).join('')}</ul>`).join('');
  $('cvSk').innerHTML = `<ul>${SKILLS.map(([a, b]) => `<li><b>${a}:</b> ${b}</li>`).join('')}</ul>`;
  $('cvEdu').innerHTML = `<ul>${EDU.map((e) => `<li>${e}</li>`).join('')}</ul>`;
  $('aMail').href = 'mailto:' + ME.email; $('aWa').href = ME.whatsapp; $('aLi').href = ME.linkedin;
}
function updateHint() {
  const n = NODES[S.node]; const st = ST[n.st >= 0 ? n.st : 0]; let t = '';
  if (!S.started) t = TOUCH ? 'DRAG THE STICK TO CLIMB' : 'WASD OR ARROWS TO CLIMB';
  else if (S.done) t = 'YOU MADE IT · SAY HELLO BELOW';
  else if (st && st.mat && n.k === 'stand') t = TOUCH ? 'TAP ROLL' : 'PRESS R TO ROLL';
  else if (S.clipT) t = TOUCH ? 'TAP CLIP TO CLIP IN' : 'PRESS E TO CLIP IN';
  else if (S.chalk < 35) t = n.k === 'hold' ? (n.type === 'jug' ? 'LOW CHALK · HOLD STILL TO REST' : 'LOW CHALK · FIND A JUG OR CHALK UP') : 'LOW CHALK';
  $('hint').textContent = t;
}

/* ---------------------------------------------------------------- actions */
function station(i) { return ST[i]; }
function arrive(id) {
  const was = S.mode; const n = NODES[id];
  S.node = id; S.mode = 'stand'; S.mv = null;
  if (was === 'zip' || was === 'fall') { Object.keys(S.targets).forEach((k) => delete S.targets[k]); poseFor(n, S.targets); }
  S.clipAnim = 0;
  if (n.k !== 'hold') {
    S.lastLedge = id; cleanPitch(n); if (n.ledge || n.ground) S.chalk = Math.min(100, S.chalk + 8);
    const si = n.plateau ? ST.length - 1 : n.st;
    if (n.plateau) { if (!S.done) { S.done = true; sfx.top(); toast('SUMMIT', 'TBILISI IS NEXT · JANUARY 2027'); $('cta').classList.add('on'); S.reached.add(si); } }
    else if (!S.reached.has(si)) {
      S.reached.add(si); const s = ST[si]; sfx.station();
      if (!s.ground) toast(s.summit ? 'ALMOST THERE' : 'PITCH ' + s.num, s.short);
    }
    S.stationNow = si;
  }
  updateTopo(); updateHint();
}
function cleanPitch(n) {
  // the belayer cleans the draws when you reach the ledge and re-racks them
  S.clips.forEach((g) => { g.g.visible = false; g.bolt.visible = false; });
  S.clips.length = 0; S.draws = DRAWMAX; updateDrawsHUD();
  const si = n.plateau ? ST.length - 1 : n.st;
  const miss = GEAR.filter((g) => g.name && !g.clipped && g.st === si).length;
  if (miss && !S.missedSeen.has(si)) { S.missedSeen.add(si); setTimeout(() => toast(miss + ' GEAR NOT CLIPPED', 'DOWNCLIMB AND CLIP IT FOR YOUR RACK'), 2600); }
}
function updateDrawsHUD() { $('drawsN').textContent = S.draws; harnessDraws.forEach((d, i) => { d.visible = i < S.draws; }); }
function updateClipTarget() {
  S.clipT = null; const n = NODES[S.node]; if (n.k !== 'hold' || S.done || S.mode !== 'stand') return;
  const rx = S.hip.x; const ry = S.hip.y + 1.35; let bd = 2.5;
  for (const g of GEAR) { if (g.clipped) continue; const d = Math.hypot(g.pt.x - rx, g.pt.y - ry, (g.pt.z - S.hip.z) * 0.4); if (d < bd) { bd = d; S.clipT = g; } }
}
function doClip() {
  const n = NODES[S.node];
  if (S.mode !== 'stand' || n.k !== 'hold') { toast('HANG ON A HOLD', 'THEN CLIP IN'); return; }
  const g = S.clipT; if (!g) { toast('NOTHING IN REACH', 'CLIMB UP TO A QUICKDRAW'); return; }
  if (S.draws <= 0) { toast('NO QUICKDRAWS', 'RESTOCK ON THE NEXT LEDGE'); return; }
  g.clipped = true; g.pop = 0; S.draws--; S.clips.push(g); S.clips.sort((a, b) => a.pt.y - b.pt.y);
  g.g.userData.sling.color.setHex(0x2ec4b6); S.chalk = Math.max(0, S.chalk - 3);
  S.clipAnim = 0.7; S.targets['h' + S.freeHand] = g.pt.clone().add(new V3(0, 0.15, 0.2));
  sfx.clip(); updateDrawsHUD();
  if (g.name) { S.rack.add(g.name); addRackChip(g.name); toast('CLIPPED IN', g.name.toUpperCase()); } else toast('CLIPPED IN', S.draws + ' DRAWS LEFT');
}
function pickMove(dx, dy) {
  const n = NODES[S.node]; const len = Math.hypot(dx, dy); if (len < 0.3) return null; dx /= len; dy /= len;
  let best = null; let bs = -9;
  for (const e of n.nb) { const dot = (e.dx * dx + e.dy * dy) / e.d; if (dot < 0.5) continue; const sc = dot * 2 - e.d * 0.2; if (sc > bs) { bs = sc; best = e; } }
  return best;
}
function startMove(e, dyno = false) {
  const to = NODES[e.j];
  S.mode = 'move'; S.clipAnim = 0; S.mv = { from: S.hip.clone(), to: to.hip.clone(), toId: e.j, dur: dyno ? 0.62 : 0.3 + e.d * 0.09, t: 0, dyno };
  poseFor(to, S.targets);
  S.chalk -= dyno ? 12 : (to.k === 'hold' ? 2.2 + e.d * 1.0 : 0); S.started = true; dyno ? sfx.roll() : sfx.grab();
}
function doDyno() {
  const n = NODES[S.node];
  if (S.mode !== 'stand' || n.k !== 'hold') { toast('DYNO NEEDS A HOLD', 'HANG ON FIRST'); return; }
  if (S.chalk < 18) { toast('TOO PUMPED TO JUMP', 'REST OR CHALK UP'); return; }
  let dx = IN.dir.x; let dy = IN.dir.y; const l = Math.hypot(dx, dy); if (l < 0.3) { dx = 0; dy = 1; } else { dx /= l; dy /= l; }
  let best = null; let bs = -9;
  for (const m of NODES) {
    if (m.k !== 'hold' || m.id === n.id) continue;
    const ex = m.hip.x - S.hip.x; const ey = m.hip.y - S.hip.y; const d = Math.hypot(ex, ey); if (d < 2.9 || d > 4.8) continue;
    const dot = (ex * dx + ey * dy) / d; if (dot < 0.75) continue;
    let hit = false; for (let q = 1; q < 6 && !hit; q++) { const f = q / 6; if (inTree(lerp(n.x, m.x, f), lerp(n.y, m.y, f), 0.5)) hit = true; } if (hit) continue;
    const sc = dot * 2 - Math.abs(d - 3.8) * 0.3 + (m.type === 'jug' ? 0.35 : 0); if (sc > bs) { bs = sc; best = { j: m.id, dx: ex, dy: ey, d }; }
  }
  if (!best) { toast('NO HOLD TO JUMP TO', 'POINT THE STICK AT ONE'); return; }
  startMove(best, true);
}
function chalkUp() {
  if (S.mode === 'zip' || S.mode === 'fall') return;
  if (S.chalkCd > 0) { toast('BAG IS EMPTY', 'WAIT ' + Math.ceil(S.chalkCd) + 'S'); return; }
  S.chalk = Math.min(100, S.chalk + 45); S.chalkCd = 4; sfx.chalk();
  const p = dust.geometry.attributes.position; const v = dust.userData.vel;
  for (let i = 0; i < p.count; i++) { p.setXYZ(i, S.hip.x + (Math.random() - 0.5) * 0.4, S.hip.y + 1.1 + Math.random() * 0.5, S.hip.z + 0.3); v[i].set((Math.random() - 0.5) * 2.2, Math.random() * 1.6, 0.6 + Math.random()); }
  dust.userData.life = 1; p.needsUpdate = true;
  let shoo = 0; BIRDS.forEach((b) => { if (b.st === 'in' && b.p.distanceTo(S.hip) < 11) { b.st = 'out'; b.t = 0; shoo++; } });
  if (shoo) toast('SHOO!', 'CHALK CLOUD SPOOKED THE BIRD');
  if (S.clipAnim <= 0 && NODES[S.node].k === 'hold') { S.clipAnim = 0.5; S.targets['h' + S.freeHand] = new V3(S.hip.x + 0.28, S.hip.y - 0.05, S.hip.z - 0.3); }
  updateHint();
}
function doRoll() {
  const n = NODES[S.node]; const st = ST[n.st >= 0 ? n.st : 0];
  if (S.mode !== 'stand' || n.k !== 'stand') return;
  if (!(st && st.mat)) { toast('NEEDS A MAT', 'TRY THE LEDGE AT PITCH 6'); return; }
  S.mode = 'roll'; S.rollT = 0; sfx.roll(); setTimeout(() => toast('OSS', 'TAP EARLY. TAP OFTEN.'), 700);
}
function zipToStation(i) {
  if (S.mode === 'zip' || S.mode === 'fall') return;
  const cand = NODES.filter((n) => n.k === 'stand' && (i === ST.length - 1 && n.plateau ? false : n.st === i && !n.plateau));
  const t = cand.find((n) => n.mid) || cand.find((n) => n.ground && n.x === 0) || cand[0]; if (!t) return;
  const from = S.hip.clone(); const d = from.distanceTo(t.hip);
  S.mode = 'zip'; S.zipFrom = from; S.zipTo = t.hip.clone(); S.zipId = t.id; S.zipT = 0; S.zipDur = clamp(0.9 + d / 70, 1.0, 3.2); S.started = true; sfx.roll();
}
function slip() {
  const led = NODES[S.lastLedge]; let target = led; let msg = 'NO CLIPS · BACK TO THE LEDGE';
  const L = S.clips[S.clips.length - 1];
  if (L) {
    const over = Math.max(0.6, S.hip.y + 1.35 - L.pt.y); const ty = L.pt.y - over - 1.0; msg = 'CAUGHT BY THE CLIP · ' + Math.round(over * 2) + ' M FALL';
    let bd = 1e9; const want = new V3(L.pt.x, ty, L.pt.z);
    for (const m of NODES) { if (m.k === 'stand' && !m.ground && m.y > S.hip.y) continue; const d = Math.hypot(m.hip.x - want.x, m.hip.y - want.y) + (m.k === 'stand' ? 3 : 0); if (m.hip.y > led.hip.y - 0.1 && d < bd) { bd = d; target = m; } }
  }
  S.mode = 'fall'; S.fallT = 0; S.fallDur = clamp(0.9 + S.hip.distanceTo(target.hip) * 0.06, 1.0, 2.2); S.zipFrom = S.hip.clone(); S.zipTo = target.hip.clone(); S.zipId = target.id; S.chalk = 55; S.clipAnim = 0; sfx.slip(); toast('TAKE!', msg);
}

/* ---------------------------------------------------------------- boot */
const PN = {};
function bakeGeo(root, name) {
  let geo = null; root.updateMatrixWorld(true);
  root.traverse((o) => { if (o.name === name || (o.parent && o.parent.name === name && o.isMesh)) { if (o.isMesh && !geo) { geo = o.geometry.clone(); geo.applyMatrix4(o.matrixWorld); } } });
  if (!geo) root.traverse((o) => { if (o.isMesh && !geo && o.parent && o.parent.name === name) { geo = o.geometry.clone(); geo.applyMatrix4(o.matrixWorld); } });
  return geo;
}
function buildHolds(src) {
  const types = ['jug', 'crimp', 'sloper', 'pinch', 'foot'];
  const dummy = new THREE.Object3D(); const col = new THREE.Color();
  types.forEach((t) => {
    const list = HOLDS.filter((h) => h.type === t); if (!list.length) return;
    const geo = bakeGeo(src.scene, 'hold_' + t); if (!geo) { console.warn('missing hold', t); return; }
    const im = new THREE.InstancedMesh(geo, VC, list.length);
    list.forEach((h, i) => { dummy.position.set(h.x, h.y, h.z); dummy.rotation.set(0, 0, h.rot); dummy.scale.setScalar(h.s); dummy.updateMatrix(); im.setMatrixAt(i, dummy.matrix); col.setHex(h.col); im.setColorAt(i, col); });
    im.castShadow = true; im.receiveShadow = true; im.frustumCulled = false; scene.add(im);
  });
}
function pn(name) { const o = PROPS.getObjectByName(name); return o ? o.clone(true) : null; }
function put(name, x, y, z, ry = 0, s = 1) {
  const o = pn(name); if (!o) { console.warn('missing prop', name); return null; }
  prep(o); o.position.set(x, y, z); o.rotation.y = ry; o.scale.setScalar(s); scene.add(o); return o;
}
function placeProps() {
  // base camp
  put('tent', -19, 0, 7, 0.5, 1.4); put('jacaranda', 21, 0, 2.5, 0, 1.25); put('jacaranda', -23, 0, 1.5, 0, 1.1);
  put('boulder_a', 12.5, 0, 4.5, 0.4, 1.0); put('boulder_b', -12.5, 0, 4.2, 1, 0.9); put('boulder_c', 26, 0, 6, 2, 1.8);
  put('backpack', -5.2, 0, 3.4, 0.6, 1.1); put('lantern', -3.9, 0, 3.4, 0, 1.2); put('rope_coil', 5.4, 0, 3.4, 0.3, 1.1);
  // ledges
  LEDGE_STATIONS.forEach((s) => {
    put('ledge', s.x, s.y, 0, 0, 1);
    const L = { bui: [['laptop', -2.6, 0.9, 0.3], ['lantern', 3.5, 0.7]], fw: [['backpack', 3.4, 0.8, -0.4], ['lantern', -3.6, 0.7]], salt: [['laptop', 2.7, 0.9, -0.3], ['rope_coil', -3.4, 0.8]], yireh: [['laptop', -2.8, 0.9, 0.3], ['lantern', 3.6, 0.7]], vellvii: [['laptop', -2.7, 0.9, 0.2], ['backpack', 3.5, 0.8], ['lantern', -3.6, 0.7]] }[s.id];
    if (L) L.forEach(([n, dx, dz, ry]) => put(n, s.x + dx, s.y, dz, ry || 0, 1));
    if (s.mat) put('mat', s.x, s.y + 0.02, 1.9, 0, 1);
  });
  // summit plateau
  put('church', -16, TOP, -32, 0.4, 2.2); put('flag', 6.5, TOP, -10, 0, 1.6); put('cairn', 4, TOP, -9, 0.2, 1.3); put('tent', 13, TOP, -15, -0.6, 1.4);
  put('boulder_a', -10, TOP, -12, 0, 1.6); put('boulder_b', 20, TOP, -24, 1, 2.2); put('boulder_c', -26, TOP, -18, 2, 2.4); put('anchor', 0, TOP, -6.2, 0, 1.2);
  flagObj = scene.children[scene.children.length - 1];
  planeObj = pn('plane'); if (planeObj) { prep(planeObj, false); planeObj.scale.setScalar(2.6); scene.add(planeObj); }
}
const METAL = new THREE.MeshStandardMaterial({ color: 0xd5dbe3, metalness: 0.85, roughness: 0.28 });
const SLINGC = [0xff6a2b, 0x2ec4b6, 0xffc83d, 0xe0457b];
const TORUS = new THREE.TorusGeometry(0.16, 0.042, 6, 14);
function makeDraw(accent) {
  const g = new THREE.Group(); const sm = new THREE.MeshStandardMaterial({ color: accent, roughness: 0.7 });
  const top = new THREE.Mesh(TORUS, METAL); top.scale.set(0.78, 1.25, 1);
  const sl = new THREE.Mesh(new THREE.BoxGeometry(0.1, 0.62, 0.04), sm); sl.position.y = -0.46;
  const bot = new THREE.Mesh(TORUS, METAL); bot.scale.set(0.78, 1.25, 1); bot.position.y = -0.92;
  g.add(top, sl, bot); g.userData.sling = sm; g.userData.top = top; g.userData.bot = bot; return g;
}
function placeGear() {
  const hanger = new THREE.CylinderGeometry(0.07, 0.07, 0.5, 8); hanger.rotateX(Math.PI / 2);
  const add = (id, name, st, k) => {
    const n = NODES[id]; const skill = !!name; const sc = skill ? 1.85 : 1.5;
    const g = makeDraw(skill ? 0xffc83d : SLINGC[k % 4]); g.scale.setScalar(sc);
    const top = new V3(n.x, n.y + 0.6, n.z + 0.45); g.position.copy(top);
    const bolt = new THREE.Mesh(hanger, METAL); bolt.position.set(n.x, n.y + 0.6, n.z + 0.2); scene.add(bolt);
    scene.add(g);
    const pt = new V3(top.x, top.y - 0.92 * sc, top.z);
    GEAR.push({ node: id, name: name || null, g, bolt, clipped: false, st, pt, top, k, pop: -1 });
  };
  const near = (x, y, d) => GEAR.some((q) => Math.hypot(q.top.x - x, q.top.y - y) < d);
  ST.forEach((s) => {
    if (s.i === 0) return;
    const prev = ST[s.i - 1]; const y0 = prev.y + 6; const y1 = s.y - 5;
    (s.gear || []).forEach((name, k) => {
      const ty = y0 + (y1 - y0) * ((k + 0.5) / s.gear.length); const tx = routeX(ty) + (k % 2 ? 1.6 : -1.6);
      const id = pickHoldNear({ x: tx, y: ty }, 4, -1); if (id >= 0 && !near(NODES[id].x, NODES[id].y, 2)) add(id, name, s.i, k);
    });
  });
  // plain bolts along every pitch (summit pitch included)
  const pitches = ST.slice(1).map((s) => ({ st: s.i, a: ST[s.i - 1].y + 2.4, b: s.y - 3.2 }));
  pitches.push({ st: ST.length - 1, a: ST[ST.length - 1].y + 4.2, b: TOP - 2.6 });
  pitches.forEach((p) => {
    let k = 0;
    for (let y = p.a + 1.5; y < p.b; y += 5.0, k++) {
      const tx = routeX(y) + (k % 2 ? 1.3 : -1.3); const id = pickHoldNear({ x: tx, y: y + 0.6 }, 3.2, -1);
      if (id < 0) continue; const n = NODES[id]; if (near(n.x, n.y, 3.0)) continue; add(id, null, p.st, k);
    }
  });
}
function placeTrees() {
  TREES.forEach((t) => { const o = FA.getObjectByName('cliff_tree'); if (!o) return; const c = prep(o.clone(true)); c.position.set(t.x, t.y, wallZ(t.x, t.y) - 0.25); c.rotation.y = (rnd() - 0.5) * 0.5; scene.add(c); });
}
function waitFonts() { return Promise.race([document.fonts ? document.fonts.load('48px "Bebas Neue"').then(() => document.fonts.load('16px "DM Mono"')).catch(() => 0) : 0, new Promise((r) => setTimeout(r, 2500))]); }
const BOARD_OBJS = [];
async function boot() {
  const [cl, hl, pl, fl] = await Promise.all([load('/models/climber.glb'), load('/models/holds.glb'), load('/models/props.glb'), load('/models/fauna.glb')]);
  FA = fl.scene; FA.updateMatrixWorld(true);
  await waitFonts();
  PROPS = pl.scene; PROPS.updateMatrixWorld(true);
  BOARDS.forEach((b) => BOARD_OBJS.push(makeBoard(b)));
  const skip = new Set();
  for (let tries = 0; tries < 10; tries++) {
    planTrees(skip); HOLDS = genHolds(); buildNodes(HOLDS);
    const r = reachInfo(); if (r.ok) break;
    let bt = null; let bd = 1e9; TREES.forEach((t) => { const d = Math.hypot(t.x - r.x, t.y - r.y); if (d < bd) { bd = d; bt = t.key; } });
    if (bt === null) break; skip.add(bt);
  }
  buildHolds(hl);
  placeProps(); placeTrees(); placeGear(); setupClimber(cl); setupRope(); setupBirds();
  const start = NODES.find((n) => n.ground && n.x === 0); S.node = start.id; S.hip.copy(start.hip); S.reached.add(0); S.stationNow = 0; S.lastLedge = start.id;
  poseFor(start, S.targets); Object.keys(LIMB).forEach((k) => { if (S.targets[k]) { LIMB[k].cur.copy(S.targets[k]); LIMB[k].init = true; } });
  buildTopo(); buildRack(); buildCV(); updateTopo(); updateHint();
  resize(); snapCam(); updateClimber(0.016);
  $('loader').classList.add('off'); setTimeout(() => { $('loader').style.display = 'none'; }, 700);
  last = performance.now(); requestAnimationFrame(frame);
}

/* ---------------------------------------------------------------- input */
const KEYMAP = { KeyW: 'u', ArrowUp: 'u', KeyS: 'd', ArrowDown: 'd', KeyA: 'l', ArrowLeft: 'l', KeyD: 'r', ArrowRight: 'r' };
addEventListener('keydown', (e) => {
  if (e.code === 'Escape') { $('cv').hidden = true; return; }
  if (!$('cv').hidden) return;
  const k = KEYMAP[e.code]; if (k) { IN.keys.add(k); e.preventDefault(); audio(); }
  if (e.code === 'KeyC' || e.code === 'Space') { chalkUp(); e.preventDefault(); }
  if (e.code === 'KeyR') doRoll();
  if (e.code === 'KeyE') doClip();
  if (e.code === 'KeyF' || e.code === 'ShiftLeft' || e.code === 'ShiftRight') doDyno();
});
addEventListener('keyup', (e) => { const k = KEYMAP[e.code]; if (k) IN.keys.delete(k); });
addEventListener('blur', () => IN.keys.clear());
const stick = $('stick'); const knob = $('knob'); const SD = { id: -1, x: 0, y: 0 };
function stickMove(e) {
  const r = stick.getBoundingClientRect(); const cx = r.left + r.width / 2; const cy = r.top + r.height / 2;
  let dx = e.clientX - cx; let dy = e.clientY - cy; const R = r.width / 2 - 10; const l = Math.hypot(dx, dy);
  if (l > R) { dx = dx / l * R; dy = dy / l * R; }
  knob.style.transform = `translate(${dx}px,${dy}px)`; SD.x = dx / R; SD.y = -dy / R;
}
stick.addEventListener('pointerdown', (e) => { SD.id = e.pointerId; stick.setPointerCapture(e.pointerId); stickMove(e); audio(); e.preventDefault(); });
stick.addEventListener('pointermove', (e) => { if (e.pointerId === SD.id) stickMove(e); });
const stickEnd = (e) => { if (e.pointerId === SD.id) { SD.id = -1; SD.x = SD.y = 0; knob.style.transform = 'translate(0,0)'; } };
stick.addEventListener('pointerup', stickEnd); stick.addEventListener('pointercancel', stickEnd);
if (TOUCH) document.body.classList.add('touch');
$('bClip').addEventListener('click', doClip); $('bDyno').addEventListener('click', doDyno); $('bChalk').addEventListener('click', chalkUp); $('bRoll').addEventListener('click', doRoll);
$('bCv').addEventListener('click', () => { $('cv').hidden = false; }); $('cvX').addEventListener('click', () => { $('cv').hidden = true; });
$('bMute').addEventListener('click', () => { S.muted = !S.muted; $('bMute').textContent = S.muted ? 'SOUND OFF' : 'SOUND ON'; });
function readDir() {
  let x = (IN.keys.has('r') ? 1 : 0) - (IN.keys.has('l') ? 1 : 0); let y = (IN.keys.has('u') ? 1 : 0) - (IN.keys.has('d') ? 1 : 0);
  if (SD.id >= 0) { x += SD.x; y += SD.y; }
  IN.dir.set(x, y, 0);
}

/* ---------------------------------------------------------------- camera */
const camT = new V3(); let camDist = 26;
let camW = 0;
function wantWidth(aspect) { const climbing = NODES[S.node] && NODES[S.node].k === 'hold' || S.mode === 'move' && NODES[S.mv.toId].k === 'hold'; return aspect >= 1.2 ? (climbing ? 27 : 40) : aspect >= 0.8 ? (climbing ? 16 : 24) : (climbing ? 11 : 16); }
function camGoal(out) {
  const aspect = cam.aspect; const tanH = Math.tan(THREE.MathUtils.degToRad(cam.fov / 2));
  const tw = wantWidth(aspect); camW = camW ? lerp(camW, tw, 0.04) : tw; let w = camW; if (S.done) w *= 1.25;
  const dist = (w / 2) / (tanH * aspect);
  let fx = S.hip.x; let fy = S.hip.y + 3.0;
  const nn = NODES[S.node];
  if (nn && nn.k === 'stand' && S.mode !== 'zip') {
    const bs = BOARDS.filter((b) => Math.abs(b.cy - S.hip.y) < 9);
    if (bs.length) {
      const x0 = Math.min(...bs.map((b) => b.r.x0)); const x1 = Math.max(...bs.map((b) => b.r.x1));
      if (aspect >= 1.2) { fx = lerp(S.hip.x, (x0 + x1) / 2, 0.75); const yt = Math.max(...bs.map((b) => b.r.y1)); fy = lerp(fy, (S.hip.y - 2 + yt) / 2, 0.85); }
      else if (S.idle > 0.8) {
        let b = bs[0]; bs.forEach((q) => { if (Math.abs(q.cx - S.hip.x) < Math.abs(b.cx - S.hip.x)) b = q; });
        const k = sstep(0.8, 1.8, S.idle); fx = lerp(fx, b.cx - 1.2, k * 0.85); fy = lerp(fy, b.cy - 0.3, k * 0.8);
      }
    }
  }
  if (S.done) fy += 3;
  out.set(fx, fy, dist); return dist;
}
function snapCam() { camDist = camGoal(camT); cam.position.copy(camT); cam.lookAt(camT.x, camT.y, 0); }
function updateCamera(dt) {
  camGoal(tmpA); const k = 1 - Math.exp(-dt * 3.2);
  camT.lerp(tmpA, k); cam.position.copy(camT); cam.position.x += Math.sin(S.tNow * 0.3) * 0.15 + (S.hit > 0 ? Math.sin(S.tNow * 60) * S.hit * 0.5 : 0);
  cam.lookAt(camT.x, camT.y + (S.done ? 1.5 : 0), 0);
}
function resize() {
  const w = innerWidth; const h = innerHeight; renderer.setPixelRatio(Math.min(devicePixelRatio, TOUCH ? 2 : 2)); renderer.setSize(w, h, false);
  cam.aspect = w / h; cam.updateProjectionMatrix();
}
addEventListener('resize', () => { resize(); });

/* ---------------------------------------------------------------- loop */
let last = 0; const tmpV = new V3();
function frame(now) {
  requestAnimationFrame(frame);
  const dt = Math.min(0.05, (now - last) / 1000); last = now; S.tNow += dt;
  S.chalkCd = Math.max(0, S.chalkCd - dt);
  readDir();
  const n = NODES[S.node];
  if (IN.dir.lengthSq() > 0.09) S.idle = 0; else S.idle += dt;
  S.status = 'STEADY';
  if (S.mode === 'stand' && $('cv').hidden) {
    if (IN.dir.lengthSq() > 0.09) { const e = pickMove(IN.dir.x, IN.dir.y); if (e) startMove(e); }
    if (S.started) {
      if (n.k === 'hold') {
        if (n.type === 'jug' && S.idle > 1.0) { S.chalk = Math.min(100, S.chalk + 3.2 * dt); S.status = 'RESTING'; }
        else { const d = DRAIN[n.type] * dt * 1.7; S.chalk -= d; S.status = n.type === 'jug' ? 'STEADY' : 'PUMPING'; }
        if (S.chalk <= 0) { S.chalk = 0; slip(); }
      } else { S.chalk = Math.min(100, S.chalk + 18 * dt); if (S.chalk < 100) S.status = 'RECOVERING'; }
    }
    updateClipTarget();
  } else S.clipT = null;
  updateClimber(dt);
  updateBirds(dt);
  // quickdraws on the wall
  GEAR.forEach((g) => {
    if (g.pop >= 0 && g.clipped) { g.pop += dt * 3; const k = 1 + Math.sin(Math.min(1, g.pop) * Math.PI) * 0.35; g.g.scale.setScalar((g.name ? 1.85 : 1.5) * k); if (g.pop >= 1) g.pop = -1; }
    if (!g.clipped && g.g.visible) g.g.rotation.z = Math.sin(S.tNow * 1.5 + g.node) * 0.05;
  });
  if (clipRing) { const t = S.clipT; clipRing.visible = !!t; if (t) { clipRing.position.set(t.pt.x, t.pt.y, t.pt.z + 0.1); clipRing.scale.setScalar(1 + Math.sin(S.tNow * 8) * 0.18); } }
  harnessDraws.forEach((d, i) => { if (d.visible) d.rotation.x = Math.sin(S.tNow * 2 + i) * 0.05 + (n.k === 'hold' ? 0.1 : 0); });
  // chalk dust
  if (dust && dust.userData.life > 0) {
    dust.userData.life -= dt * 0.9; dust.material.opacity = Math.max(0, dust.userData.life) * 0.8;
    const p = dust.geometry.attributes.position; const v = dust.userData.vel;
    for (let i = 0; i < p.count; i++) { p.setXYZ(i, p.getX(i) + v[i].x * dt, p.getY(i) + v[i].y * dt - dt * 0.4, p.getZ(i) + v[i].z * dt); v[i].multiplyScalar(0.96); }
    p.needsUpdate = true;
  }
  if (ropeMesh) updateRope();
  if (planeObj) { const a = S.tNow * 0.12; planeObj.position.set(Math.cos(a) * 80, TOP + 38 + Math.sin(a * 2) * 4, -90 + Math.sin(a) * 50); planeObj.rotation.y = -a + Math.PI; planeObj.rotation.z = 0.25; }
  if (flagObj) flagObj.rotation.y = Math.sin(S.tNow * 1.4) * 0.12;
  // sky + sun
  setSky(clamp(S.hip.y / TOP, 0, 1));
  skyDome.position.copy(cam.position);
  sun.position.set(S.hip.x, S.hip.y, 0).addScaledVector(SUN_DIR, 60); sun.target.position.set(S.hip.x, S.hip.y, 0);
  stars.position.copy(cam.position);
  updateCamera(dt);
  // HUD
  $('altN').textContent = Math.max(0, Math.round((S.hip.y - 1.1) * 13));
  const cp = clamp(S.chalk, 0, 100); $('chalkB').style.width = cp + '%'; $('chalkP').textContent = Math.round(cp);
  const cw = $('chalkW'); cw.classList.toggle('low', cp < 30); cw.classList.toggle('mid', cp >= 30 && cp < 60);
  $('chalkS').textContent = cp < 30 && NODES[S.node].k === 'hold' ? 'PUMPED OUT' : S.status;
  $('vig').classList.toggle('on', (cp < 22 && NODES[S.node].k === 'hold') || S.hit > 0);
  $('bClip').classList.toggle('ready', !!S.clipT);
  if (((now / 250) | 0) !== S._hb) { S._hb = (now / 250) | 0; updateTopo(); updateHint(); $('bChalk').disabled = S.chalkCd > 0; $('bChalk').textContent = S.chalkCd > 0 ? 'CHALK ' + Math.ceil(S.chalkCd) : 'CHALK'; }
  renderer.render(scene, cam);
}

window.__a = { doClip, doDyno, BIRDS, TREES, spawnBird, snapCam, S, NODES, HOLDS, GEAR, ST, BOARDS, cam, scene, renderer, zipToStation, pickMove, startMove, arrive, chalkUp, doRoll, slip, TOP };
boot().catch((e) => { console.error(e); $('lp').textContent = 'FAILED TO LOAD'; });
