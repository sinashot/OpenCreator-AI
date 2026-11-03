// «آنفلوانزای پرندگان در شیر»: 3-D microscopy, a biohazard HUD and kinetic Persian type, timed on the
// voice-over's word timings. A pure function of time: window.seek(t) paints frame t.
import * as THREE from 'three';
import { mergeGeometries } from 'three/addons/utils/BufferGeometryUtils.js';
import { RoomEnvironment } from 'three/addons/environments/RoomEnvironment.js';
import { WORDS } from './words.js';

const W = 1080, H = 1920;
export const CUT = 65.75, DURATION = CUT + 3.2;
const GLS = Number(new URLSearchParams(location.search).get('gls') || 0.8);
const cv = document.getElementById('c'), ctx = cv.getContext('2d');
const glc = document.getElementById('gl');

const C = { bg: '#030305', red: '#FF1E3C', blood: '#B3001E', cyan: '#2EE6FF', white: '#FFFFFF', yel: '#FFD21A', grey: '#8B8F99', green: '#2BFF88' };
const FONT = (w, s) => `${w} ${s}px Vazir`;
const FA = (s) => String(s).replace(/[0-9]/g, (d) => '۰۱۲۳۴۵۶۷۸۹'[d]);
const ws = (i, o = 0) => WORDS[i][1] + o;
const we = (i, o = 0) => WORDS[i][2] + o;
const clamp = (x, a = 0, b = 1) => Math.min(b, Math.max(a, x));
const prog = (t, a, b) => clamp((t - a) / (b - a));
const lerp = (a, b, k) => a + (b - a) * k;
const E = { out: (k) => 1 - (1 - k) ** 3, inOut: (k) => (k < 0.5 ? 4 * k ** 3 : 1 - (-2 * k + 2) ** 3 / 2), in: (k) => k ** 3, back: (k, s = 1.8) => 1 + (s + 1) * (k - 1) ** 3 + s * (k - 1) ** 2 };
const pop = (t, t0, d = 0.3) => (t < t0 ? 0 : E.back(prog(t, t0, t0 + d)));
const bump = (t, t0, d = 0.25) => (t < t0 || t > t0 + d ? 0 : Math.sin(Math.PI * (t - t0) / d));
const TAU = Math.PI * 2;
function rng(seed) { let s = seed >>> 0; return () => ((s = (s * 1664525 + 1013904223) >>> 0) / 4294967296); }

// ---------------------------------------------------------------- scenes
const SC = {
  hook: [0, ws(5, -0.1)], target: [ws(5, -0.1), ws(16, -0.2)], resp: [ws(16, -0.2), ws(32, -0.2)], nose: [ws(32, -0.2), ws(47, -0.2)],
  teat: [ws(47, -0.2), ws(58, -0.2)], why: [ws(58, -0.2), ws(64, -0.25)], attach: [ws(64, -0.25), ws(85, -0.2)], boom: [ws(85, -0.2), ws(101, -0.2)],
  milk: [ws(101, -0.2), ws(116, -0.2)], raw: [ws(116, -0.2), CUT], cta: [CUT, DURATION],
};
const inSc = (t, id) => t >= SC[id][0] && t < SC[id][1];
const HITS = [0, ws(14), ws(30), ws(55), ws(65), ws(87), ws(91), ws(119), CUT];

// ---------------------------------------------------------------- 3-D
const renderer = new THREE.WebGLRenderer({ canvas: glc, antialias: true, preserveDrawingBuffer: true });
renderer.setPixelRatio(1); renderer.setSize(Math.round(W * GLS), Math.round(H * GLS), false);
renderer.toneMapping = THREE.ACESFilmicToneMapping; renderer.toneMappingExposure = 1.1;
renderer.outputColorSpace = THREE.SRGBColorSpace;
const scene = new THREE.Scene();
scene.background = new THREE.Color(0x030305);
scene.fog = new THREE.FogExp2(0x030305, 0.045);
const pmrem = new THREE.PMREMGenerator(renderer);
scene.environment = pmrem.fromScene(new RoomEnvironment(), 0.04).texture;
const cam = new THREE.PerspectiveCamera(38, W / H, 0.05, 200);
scene.add(new THREE.AmbientLight(0x221018, 0.6));
const key = new THREE.DirectionalLight(0xfff2ea, 1.1); key.position.set(3, 5, 6); scene.add(key);
const rimR = new THREE.PointLight(0xff1e3c, 60, 40, 1.6); rimR.position.set(-4, 2, -3); scene.add(rimR);
const rimC = new THREE.PointLight(0x2ee6ff, 35, 40, 1.6); rimC.position.set(4.5, -2, -2); scene.add(rimC);
const head = new THREE.PointLight(0xff6a6a, 0, 18, 1.4); scene.add(head);

// pseudo-noise for organic surfaces
const nz = (x, y, z) => Math.sin(x * 3.1 + Math.sin(y * 2.3)) * 0.5 + Math.sin(y * 4.7 + z * 1.9) * 0.3 + Math.sin(z * 5.3 + x * 2.1) * 0.2;
function displace(g, amp, f) {
  const p = g.attributes.position, v = new THREE.Vector3();
  for (let i = 0; i < p.count; i++) { v.fromBufferAttribute(p, i); const n = nz(v.x * f, v.y * f, v.z * f); v.multiplyScalar(1 + amp * n); p.setXYZ(i, v.x, v.y, v.z); }
  g.computeVertexNormals(); return g;
}
function fib(n) { const out = []; const ga = Math.PI * (3 - Math.sqrt(5)); for (let i = 0; i < n; i++) { const y = 1 - (i / (n - 1)) * 2, r = Math.sqrt(1 - y * y), th = ga * i; out.push(new THREE.Vector3(Math.cos(th) * r, y, Math.sin(th) * r)); } return out; }
// the influenza particle: a lumpy envelope studded with two kinds of spikes
function virusGeoms(detail, nSpikes, seg) {
  const body = displace(new THREE.IcosahedronGeometry(1, detail), 0.05, 2.2);
  const parts = [], up = new THREE.Vector3(0, 1, 0), r = rng(5);
  for (const [i, n] of fib(nSpikes).entries()) {
    const lolly = i % 5 === 0;
    const stalk = new THREE.CylinderGeometry(0.03, 0.045, 0.3, seg); stalk.translate(0, 0.15, 0);
    const top = lolly ? new THREE.SphereGeometry(0.075, seg + 2, seg) : new THREE.CylinderGeometry(0.07, 0.04, 0.13, seg);
    top.translate(0, lolly ? 0.34 : 0.33, 0);
    const g = mergeGeometries([stalk, top]);
    const q = new THREE.Quaternion().setFromUnitVectors(up, n);
    g.applyQuaternion(q); g.translate(n.x * 0.97, n.y * 0.97, n.z * 0.97);
    g.rotateZ((r() - 0.5) * 0.02);
    parts.push(g);
  }
  return { body, spikes: mergeGeometries(parts) };
}
const vHero = virusGeoms(5, 230, 7);
const hero = new THREE.Group();
const heroBody = new THREE.Mesh(vHero.body, new THREE.MeshStandardMaterial({ color: 0x9a1a2c, roughness: 0.55, metalness: 0.05, envMapIntensity: 0.6, emissive: 0x2a0008 }));
const heroSpikes = new THREE.Mesh(vHero.spikes, new THREE.MeshStandardMaterial({ color: 0xb87a70, roughness: 0.45, envMapIntensity: 0.5, emissive: 0x1a0604 }));
hero.add(heroBody, heroSpikes); scene.add(hero);
// a swarm of smaller particles
const vSmall = virusGeoms(2, 44, 5);
const smallGeo = mergeGeometries([vSmall.body, vSmall.spikes].map((g) => { const x = g.index ? g.toNonIndexed() : g; for (const k of Object.keys(x.attributes)) if (k !== 'position' && k !== 'normal') x.deleteAttribute(k); return x; }));
const SW = 700;
const swarm = new THREE.InstancedMesh(smallGeo, new THREE.MeshStandardMaterial({ color: 0xc0283c, roughness: 0.5, envMapIntensity: 0.7, emissive: 0x3a0010 }), SW);
swarm.instanceMatrix.setUsage(THREE.DynamicDrawUsage); scene.add(swarm);
// the host cell: a translucent fresnel membrane, a nucleus inside
const cellMat = new THREE.ShaderMaterial({
  uniforms: { uCore: { value: new THREE.Color(0x3a0a1c) }, uRim: { value: new THREE.Color(0xff8fb0) }, uHot: { value: 0 }, uT: { value: 0 } },
  vertexShader: `varying vec3 vN; varying vec3 vV; varying vec3 vP; void main(){ vec4 mv = modelViewMatrix*vec4(position,1.); vN = normalize(normalMatrix*normal); vV = normalize(-mv.xyz); vP = position; gl_Position = projectionMatrix*mv; }`,
  fragmentShader: `uniform vec3 uCore; uniform vec3 uRim; uniform float uHot; uniform float uT; varying vec3 vN; varying vec3 vV; varying vec3 vP;
    void main(){ float f = pow(1.-max(dot(vN,vV),0.),2.3); float vein = smoothstep(.82,1.,sin(vP.x*9.+sin(vP.y*7.+uT))*sin(vP.y*8.+vP.z*6.));
      vec3 rim = mix(uRim, vec3(1.,.16,.2), uHot); vec3 core = mix(uCore, vec3(.45,.02,.05), uHot);
      vec3 c = mix(core, rim, f) + vein*.25*rim; gl_FragColor = vec4(c, mix(.35,1.,f)); }`,
  transparent: true, depthWrite: false,
});
const cell = new THREE.Mesh(displace(new THREE.SphereGeometry(1, 120, 80), 0.06, 1.6), cellMat);
const nucleus = new THREE.Mesh(displace(new THREE.SphereGeometry(0.42, 48, 32), 0.08, 3), new THREE.MeshStandardMaterial({ color: 0x5a1a6a, roughness: 0.6, emissive: 0x1a0422 }));
const cellG = new THREE.Group(); cellG.add(nucleus, cell); scene.add(cellG);
// the milk duct: a tube of tissue we dive into
function veinTex() {
  const c = document.createElement('canvas'); c.width = 1024; c.height = 512; const x = c.getContext('2d');
  x.fillStyle = '#4a0612'; x.fillRect(0, 0, 1024, 512);
  const r = rng(9);
  for (let i = 0; i < 90; i++) {
    x.strokeStyle = `rgba(${200 + r() * 55},${40 + r() * 60},${60 + r() * 50},${0.25 + r() * 0.5})`; x.lineWidth = 1 + r() * 6;
    x.beginPath(); let px = r() * 1024, py = r() * 512; x.moveTo(px, py);
    for (let k = 0; k < 8; k++) { px += (r() - 0.5) * 160; py += (r() - 0.5) * 90; x.lineTo(px, py); }
    x.stroke();
  }
  const t = new THREE.CanvasTexture(c); t.wrapS = t.wrapT = THREE.RepeatWrapping; t.repeat.set(10, 2); t.colorSpace = THREE.SRGBColorSpace; return t;
}
const path3 = new THREE.CatmullRomCurve3(Array.from({ length: 12 }, (_, i) => new THREE.Vector3(Math.sin(i * 0.9) * 1.6, Math.cos(i * 0.7) * 1.2, -i * 6)));
const tunnel = new THREE.Mesh(displace(new THREE.TubeGeometry(path3, 500, 2.0, 48, false), 0.0, 1),
  new THREE.MeshStandardMaterial({ map: veinTex(), side: THREE.BackSide, roughness: 0.35, metalness: 0, envMapIntensity: 0.3, emissive: 0x2a0006, emissiveIntensity: 0.6 }));
scene.add(tunnel);
// milk
const milkGeo = new THREE.PlaneGeometry(40, 40, 170, 170); milkGeo.rotateX(-Math.PI / 2);
const milkBase = Float32Array.from(milkGeo.attributes.position.array);
const milk = new THREE.Mesh(milkGeo, new THREE.MeshStandardMaterial({ color: 0x8a857c, roughness: 0.14, metalness: 0, envMapIntensity: 0.35 }));
scene.add(milk);
// floating dust for depth
const dustGeo = new THREE.BufferGeometry(); {
  const r = rng(2), a = new Float32Array(1800 * 3);
  for (let i = 0; i < 1800; i++) { a[i * 3] = (r() - 0.5) * 30; a[i * 3 + 1] = (r() - 0.5) * 40; a[i * 3 + 2] = -r() * 40 + 8; }
  dustGeo.setAttribute('position', new THREE.BufferAttribute(a, 3));
}
const dust = new THREE.Points(dustGeo, new THREE.PointsMaterial({ color: 0xffb0b8, size: 0.035, transparent: true, opacity: 0.55, depthWrite: false, blending: THREE.AdditiveBlending }));
scene.add(dust);

const M4 = new THREE.Matrix4(), Q = new THREE.Quaternion(), V = new THREE.Vector3(), S3 = new THREE.Vector3(), EU = new THREE.Euler();
function inst(i, x, y, z, s, rx, ry) { EU.set(rx, ry, 0); Q.setFromEuler(EU); S3.setScalar(s); V.set(x, y, z); M4.compose(V, Q, S3); swarm.setMatrixAt(i, M4); }
const SPOTS = fib(SW);                                // docking spots on the cell, and launch directions
const R0 = (() => { const r = rng(21); return Array.from({ length: SW }, () => [r(), r(), r(), r()]); })();
const IMPACTS = (() => { const r = rng(4), out = []; for (let i = 0; i < 60; i++) out.push([lerp(ws(101), ws(115, 0.4), i / 60) + r() * 0.2, (r() - 0.5) * 9, -r() * 9 + 1]); return out; })();

function shakeAt(t) { let s = 0; for (const h of HITS) if (t >= h && t < h + 0.6) s = Math.max(s, Math.exp(-(t - h) * 8)); return s; }

function stage3D(t) {
  hero.visible = swarm.visible = cellG.visible = tunnel.visible = milk.visible = false;
  scene.fog.density = 0.045; head.intensity = 0; rimR.intensity = 60; rimC.intensity = 35;
  let n = 0; const hide = () => { for (let i = n; i < SW; i++) inst(i, 0, -999, 0, 0.0001, 0, 0); };
  const sh = shakeAt(t);
  dust.rotation.y = t * 0.02; dust.position.y = (t * 0.15) % 4;
  if (t < SC.why[0] && !inSc(t, 'teat')) {
    // the hero particle out of the dark
    hero.visible = true;
    const k = E.out(prog(t, 0, 3.0));
    let z = lerp(18, 7.2, k), x = 0, y = 0.4, s = 1.6;
    if (t >= SC.target[0]) { const m = E.inOut(prog(t, SC.target[0], SC.target[0] + 0.8)); x = lerp(0, 1.1, m); y = lerp(0.4, 2.6, m); z = lerp(7.2, 13, m); }
    if (t >= SC.resp[0]) { const m = E.inOut(prog(t, SC.resp[0], SC.resp[0] + 1)); x = lerp(1.1, 0, m); y = lerp(2.6, 0.2, m); z = lerp(13, 17, m); }
    hero.position.set(0, 0, 0); hero.scale.setScalar(s); hero.rotation.set(0.3 + t * 0.07, t * 0.35, 0.1);
    cam.position.set(-x * 0.6 + Math.sin(t * 0.6) * 0.15, -y * 0.3 + 0.3, z); cam.lookAt(x * 0.25, y * 0.5 - 0.6, 0);
    rimR.intensity = 60 + 140 * Math.max(bump(t, 0, 0.5), bump(t, 0.8, 0.4), bump(t, 1.6, 0.4));
    if (inSc(t, 'nose')) {
      // a few particles drifting in: infection that goes nowhere
      swarm.visible = true;
      for (let i = 0; i < 7; i++, n++) { const [a, b, c] = R0[i]; inst(i, (a - 0.5) * 7, (b - 0.5) * 9 + Math.sin(t + i) * 0.3, 3 + c * 3, 0.45, t * 0.5 + i, t * 0.3); }
    }
  }
  if (inSc(t, 'teat')) {
    // dive into the duct
    tunnel.visible = true; swarm.visible = true; scene.fog.density = 0.09;
    const [a, b] = SC.teat, u = 0.02 + 0.8 * E.inOut(prog(t, a, b + 0.3)) ** 1.2;
    const p = path3.getPointAt(u), q = path3.getPointAt(Math.min(1, u + 0.015));
    cam.position.copy(p); cam.lookAt(q); cam.rotateZ(Math.sin(t * 0.7) * 0.2);
    head.position.copy(p); head.intensity = 30;
    rimR.intensity = 0; rimC.intensity = 0;
    for (let i = 0; i < 90; i++, n++) {
      const [ra, rb, rc] = R0[i], uu = (ra + t * 0.012) % 1, pp = path3.getPointAt(Math.min(0.999, uu));
      inst(i, pp.x + (rb - 0.5) * 2.4, pp.y + (rc - 0.5) * 2.4, pp.z, 0.32, t + i, t * 0.6 + i);
    }
    const f = bump(t, ws(55), 0.8); head.color.setRGB(1, lerp(0.42, 0.1, f), lerp(0.42, 0.1, f)); head.intensity = 30 + 90 * f;
    cam.position.x += Math.sin(t * 80) * 0.06 * sh;
  }
  if (t >= SC.why[0] && t < SC.milk[0]) {
    cellG.visible = true; swarm.visible = true;
    const swell = 1 + 0.35 * E.out(prog(t, ws(91), ws(93, 0.4)));
    const pulse = 1 + 0.03 * Math.sin(t * 5);
    cellG.scale.setScalar(2.3 * swell * pulse); cellG.rotation.set(0.2, t * 0.12, 0);
    cellMat.uniforms.uT.value = t;
    cellMat.uniforms.uHot.value = Math.max(0.6 * prog(t, ws(80), ws(84)), prog(t, ws(87), ws(90)));
    nucleus.scale.setScalar(1 + 0.15 * Math.sin(t * 9) * prog(t, ws(80), ws(84)));
    const orbit = t * 0.18, dist = lerp(8.5, 10.5, prog(t, ws(87), ws(90)));
    cam.position.set(Math.sin(orbit) * dist + Math.sin(t * 70) * 0.08 * sh, 1.2 + Math.cos(t * 0.4) * 0.6, Math.cos(orbit) * dist); cam.lookAt(0, 0, 0);
    const R = 2.3 * swell * pulse * 1.08;
    const dockA = ws(64), dockB = ws(70, 0.3), make0 = ws(80), boom = ws(87);
    const nDock = 70, nMade = t < make0 ? 0 : Math.floor(lerp(0, 330, E.in(prog(t, make0, ws(84, 0.5)))));
    for (let i = 0; i < nDock && t >= dockA - 0.5; i++, n++) {
      const d = SPOTS[(i * 37) % SW], [ra, rb, rc, rd] = R0[i];
      const k = E.out(prog(t, dockA + ra * 1.6, dockB + ra * 1.6));
      const far = new THREE.Vector3((rb - 0.5) * 20, (rc - 0.5) * 22, (rd - 0.5) * 20 + 4);
      let p = far.lerp(d.clone().multiplyScalar(R).applyEuler(cellG.rotation), k);
      if (t > boom) p = d.clone().multiplyScalar(R + (t - boom - ra * 0.3) * 6).applyEuler(cellG.rotation);
      inst(n, p.x, p.y, p.z, 0.34, t * 0.4 + i, i);
    }
    for (let i = 0; i < nMade; i++, n++) {
      const d = SPOTS[(i * 13 + 5) % SW], [ra] = R0[(i + 100) % SW];
      const born = make0 + (i / 330) * (ws(84, 0.5) - make0);
      const out = t > boom ? (t - boom) * (4 + ra * 6) : Math.min(1.2, (t - born) * 0.6) * (0.3 + ra);
      const p = d.clone().multiplyScalar(R + out).applyEuler(cellG.rotation);
      inst(n, p.x, p.y, p.z, 0.3 * Math.min(1, (t - born) * 3), t + i, i * 0.7);
    }
    if (t > boom) for (let i = 0; i < 260 && n < SW; i++, n++) {   // the burst: a shell of fresh particles thrown out
      const d = SPOTS[(i * 29 + 11) % SW], [ra] = R0[(i + 400) % SW], out = (t - boom - ra * 0.5) * (5 + ra * 5);
      if (out < 0) { inst(n, 0, -999, 0, 0.0001, 0, 0); continue; }
      const p = d.clone().multiplyScalar(R + out); inst(n, p.x, p.y, p.z, 0.3, t + i, i);
    }
    rimR.intensity = 60 + 200 * bump(t, boom, 0.6) + 60 * prog(t, ws(87), ws(90));
  }
  if (t >= SC.milk[0]) {
    // milk, with the particles raining in
    milk.visible = true; swarm.visible = true; scene.fog.density = 0.03;
    const pa = milkGeo.attributes.position.array;
    for (let i = 0; i < pa.length; i += 3) {
      const x = milkBase[i], z = milkBase[i + 2];
      let y = 0.04 * Math.sin(x * 0.8 + t * 1.2) + 0.03 * Math.sin(z * 1.1 - t);
      for (const [ti, ix, iz] of IMPACTS) {
        const dt = t - ti; if (dt < 0 || dt > 2.5) continue;
        const d = Math.hypot(x - ix, z - iz), front = dt * 2.6;
        if (Math.abs(d - front) < 1.2) y += 0.13 * Math.cos((d - front) * 5) * Math.exp(-dt * 1.4) * (1 - Math.abs(d - front) / 1.2);
      }
      pa[i + 1] = y;
    }
    milkGeo.attributes.position.needsUpdate = true; milkGeo.computeVertexNormals();
    IMPACTS.forEach(([ti, ix, iz], i) => {
      if (n >= SW) return;
      const dt = t - ti; let y = dt < 0 ? 0.2 - dt * 7 : -dt * 0.35;
      if (y > 14) y = 14;
      inst(n++, ix, y, iz, 0.28, t + i, i);
    });
    const r = t >= SC.raw[0] ? E.inOut(prog(t, SC.raw[0], SC.raw[0] + 6)) : 0;
    cam.position.set(Math.sin(t * 0.15) * 1.2, lerp(2.0, 5.0, r), lerp(5.0, 8.5, r)); cam.lookAt(0, 0, lerp(-1.5, -2.5, r));
    key.intensity = 0.9; rimR.intensity = 40 + 120 * bump(t, ws(119), 0.8);
  } else key.intensity = 1.1;
  hide();
  swarm.instanceMatrix.needsUpdate = true;
  renderer.render(scene, cam);
}

// ---------------------------------------------------------------- 2-D layers
function text(s, x, y, size, color, o = {}) {
  if ((o.k ?? 1) <= 0.001) return;
  ctx.save(); ctx.translate(x, y); if (o.rot) ctx.rotate(o.rot); ctx.scale(o.k ?? 1, o.k ?? 1);
  ctx.globalAlpha *= o.a ?? 1; ctx.font = FONT(o.w ?? 900, size); ctx.direction = o.ltr ? 'ltr' : 'rtl'; ctx.textAlign = o.align ?? 'center'; ctx.textBaseline = 'middle';
  if (o.glow) { ctx.shadowColor = o.glow; ctx.shadowBlur = 40; }
  if (o.stroke) { ctx.lineJoin = 'round'; ctx.lineWidth = o.stroke; ctx.strokeStyle = o.strokeColor ?? '#000'; ctx.strokeText(s, 0, 0); }
  ctx.fillStyle = color; ctx.fillText(s, 0, 0); ctx.restore();
}
function measure(s, size, w = 900) { ctx.font = FONT(w, size); ctx.direction = 'rtl'; return ctx.measureText(s).width; }
function rrect(x, y, w, h, r) { ctx.beginPath(); ctx.roundRect(x, y, w, h, r); }
function tag(s, x, y, size, fg, bg, o = {}) {
  const k = o.k ?? 1; if (k <= 0.001) return;
  const pw = measure(s, size) + size * 1.0, ph = size * 1.55;
  ctx.save(); ctx.translate(x, y); ctx.rotate(o.rot ?? 0); ctx.scale(k, k);
  if (o.outline) { ctx.lineWidth = 5; ctx.strokeStyle = bg; rrect(-pw / 2, -ph / 2, pw, ph, 10); ctx.fillStyle = 'rgba(3,3,5,.72)'; ctx.fill(); ctx.stroke(); }
  else { ctx.fillStyle = bg; rrect(-pw / 2, -ph / 2, pw, ph, 10); ctx.fill(); }
  ctx.restore();
  text(s, x, y + size * 0.06, size, fg, { k, rot: o.rot });
}
function biohazard(x, y, r, color, ang = 0, k = 1) {
  if (k <= 0.001) return;
  ctx.save(); ctx.translate(x, y); ctx.rotate(ang); ctx.scale(k, k);
  ctx.fillStyle = color; ctx.strokeStyle = color;
  for (let i = 0; i < 3; i++) {
    ctx.save(); ctx.rotate(i * TAU / 3);
    ctx.beginPath(); ctx.arc(0, -r * 0.48, r * 0.5, 0, TAU); ctx.arc(0, -r * 0.6, r * 0.36, 0, TAU, true); ctx.fill('evenodd');
    ctx.restore();
  }
  ctx.globalCompositeOperation = 'destination-out';
  ctx.beginPath(); ctx.arc(0, 0, r * 0.2, 0, TAU); ctx.fill();
  for (let i = 0; i < 3; i++) { ctx.save(); ctx.rotate(i * TAU / 3 + Math.PI); ctx.fillRect(-r * 0.05, r * 0.05, r * 0.1, r * 0.3); ctx.restore(); }
  ctx.globalCompositeOperation = 'source-over';
  ctx.lineWidth = r * 0.09; ctx.beginPath(); ctx.arc(0, 0, r * 0.4, 0, TAU); ctx.stroke();
  ctx.restore();
}
function brackets(x, y, w, h, color, len = 40, lw = 6) {
  ctx.save(); ctx.strokeStyle = color; ctx.lineWidth = lw; ctx.lineCap = 'square';
  for (const [sx, sy] of [[0, 0], [1, 0], [0, 1], [1, 1]]) {
    const px = x + sx * w, py = y + sy * h, dx = sx ? -len : len, dy = sy ? -len : len;
    ctx.beginPath(); ctx.moveTo(px + dx, py); ctx.lineTo(px, py); ctx.lineTo(px, py + dy); ctx.stroke();
  }
  ctx.restore();
}
function reticle(x, y, r, color, lock, t) {
  ctx.save(); ctx.translate(x, y); ctx.rotate(t * (lock ? 0 : 1.5));
  ctx.strokeStyle = color; ctx.lineWidth = 6;
  ctx.beginPath(); ctx.arc(0, 0, r, 0, TAU); ctx.stroke();
  for (let i = 0; i < 4; i++) { ctx.save(); ctx.rotate(i * Math.PI / 2); ctx.beginPath(); ctx.moveTo(0, -r - 30); ctx.lineTo(0, -r + 26); ctx.stroke(); ctx.restore(); }
  ctx.restore();
}

function hud(t) {
  // frame, warning strip, a status line
  const pulse = 0.5 + 0.5 * Math.sin(t * 6);
  brackets(40, 130, W - 80, H - 380, `rgba(255,30,60,${0.55 + 0.3 * pulse})`, 60, 5);
  ctx.fillStyle = C.red; ctx.globalAlpha = 0.6 + 0.4 * pulse; ctx.beginPath(); ctx.arc(W - 80, 85, 12, 0, TAU); ctx.fill(); ctx.globalAlpha = 1;
  text('هشدار زیستی', W - 104, 87, 34, C.white, { align: 'right', w: 800 });
  text('H5N1', 60, 87, 34, C.red, { align: 'left', ltr: true, w: 900 });
  // progress
  ctx.fillStyle = 'rgba(255,255,255,.12)'; ctx.fillRect(0, 0, W, 10);
  ctx.fillStyle = C.red; const p = clamp(t / DURATION); ctx.fillRect(W - W * p, 0, W * p, 10);
}

function layers(t) {
  if (t >= SC.target[0] && t < SC.teat[0]) { ctx.fillStyle = `rgba(3,3,5,${0.5 * prog(t, SC.target[0], SC.target[0] + 0.5)})`; ctx.fillRect(0, 0, W, H); }
  // ---- hook
  if (inSc(t, 'hook')) {
    const k0 = pop(t, 0, 0.25);
    biohazard(540, 420, 120 * k0, C.yel, t * 0.6, 1);
    tag('هشدار', 540, 600, 64, '#000', C.yel, { k: k0 });
    text('آنفلوانزای پرندگان', 540, 1180, 112, C.white, { k: pop(t, ws(0, -0.05)), stroke: 14, glow: 'rgba(255,30,60,.8)' });
    tag('رسید به گاوداری‌ها', 540, 1350, 74, C.white, C.red, { k: pop(t, ws(2)), rot: -0.02 });
  }
  if (inSc(t, 'target')) {
    text('چرا؟', 540, 360, 200, C.white, { k: pop(t, ws(6)), stroke: 16, glow: 'rgba(255,30,60,.7)' });
    const yA = 1000, yB = 1250, lockT = ws(10, -0.1);
    tag('ریه', 540, yA, 70, C.white, C.grey, { k: pop(t, ws(9, -0.1)), outline: true });
    tag('غده‌ی پستان', 540, yB, 80, C.white, C.red, { k: pop(t, ws(10, -0.05)), outline: t < ws(14) });
    if (t > ws(9, -0.1)) {
      const m = E.inOut(prog(t, lockT, lockT + 0.5)), lock = t > lockT + 0.5;
      reticle(540, lerp(yA, yB, m), lerp(130, 300, m), lock ? C.red : C.cyan, lock, t);
      if (t > ws(10)) { ctx.strokeStyle = C.red; ctx.lineWidth = 10; ctx.beginPath(); ctx.moveTo(430, yA); ctx.lineTo(650, yA); ctx.stroke(); }
    }
    tag('هدف قفل شد', 540, 1500, 54, '#000', C.red, { k: pop(t, ws(14)) });
  }
  if (inSc(t, 'resp')) {
    tag('معمولاً: بیماری تنفسی', 540, 360, 64, C.white, C.cyan, { k: pop(t, ws(17)), outline: true });
    const kc = pop(t, ws(25, -0.1), 0.35);
    if (kc > 0) {
      const sick = t > ws(30);
      ctx.save(); ctx.translate(540, 1080); ctx.scale(kc, kc);
      ctx.fillStyle = 'rgba(3,3,5,.8)'; rrect(-380, -230, 760, 460, 24); ctx.fill();
      ctx.lineWidth = 6; ctx.strokeStyle = sick ? C.red : C.green; ctx.stroke();
      ctx.restore();
      text('گاو شیری', 540, 940, 74, C.white, { k: kc });
      text(sick ? 'وضعیت: آلوده' : 'وضعیت: سالم', 540, 1050, 66, sick ? C.red : C.green, { k: kc * (sick ? pop(t, ws(30), 0.3) : 1) });
      // a vitals line that turns erratic
      ctx.save(); ctx.strokeStyle = sick ? C.red : C.green; ctx.lineWidth = 7; ctx.shadowColor = ctx.strokeStyle; ctx.shadowBlur = 20; ctx.beginPath();
      for (let x = 0; x <= 620; x += 4) {
        const u = (x / 150 + t * (sick ? 2.6 : 1.2)) % 1; let v = u > 0.45 && u < 0.5 ? 1 : u >= 0.5 && u < 0.55 ? -0.6 : 0;
        if (sick) v += Math.sin(x * 0.3 + t * 30) * 0.2;
        const px = 540 - 310 * kc + x * kc, py = 1200 - v * 70 * kc; x ? ctx.lineTo(px, py) : ctx.moveTo(px, py);
      }
      ctx.stroke(); ctx.restore();
      if (t > ws(28)) tag('حین دوشیدن', 540, 1400, 56, '#000', C.yel, { k: pop(t, ws(28)) });
    }
  }
  if (inSc(t, 'nose')) {
    tag('مسیر ۱: بینی', 540, 360, 72, C.white, C.cyan, { k: pop(t, ws(35, -0.1)) });
    // a flat-ish growth curve
    const k = pop(t, ws(38, -0.1), 0.35), draw = prog(t, ws(38), ws(40, 0.3));
    if (k > 0) {
      ctx.save(); ctx.globalAlpha = k;
      ctx.fillStyle = 'rgba(3,3,5,.75)'; rrect(140, 820, 800, 480, 20); ctx.fill();
      ctx.strokeStyle = 'rgba(255,255,255,.25)'; ctx.lineWidth = 3; ctx.beginPath(); ctx.moveTo(200, 1240); ctx.lineTo(880, 1240); ctx.moveTo(200, 1240); ctx.lineTo(200, 880); ctx.stroke();
      ctx.strokeStyle = C.cyan; ctx.lineWidth = 9; ctx.shadowColor = C.cyan; ctx.shadowBlur = 20; ctx.beginPath();
      for (let i = 0; i <= 100 * draw; i++) { const x = 200 + i * 6.8, y = 1240 - 160 * (1 - Math.exp(-i / 25)); i ? ctx.lineTo(x, y) : ctx.moveTo(x, y); }
      ctx.stroke(); ctx.restore();
      text('تکثیر محدود', 540, 920, 64, C.cyan, { k });
    }
    tag('بدون علائم آشکار', 540, 1430, 60, C.white, C.grey, { k: pop(t, ws(43)) });
  }
  if (inSc(t, 'teat')) {
    tag('مسیر ۲: مجرای سرپستانک', 540, 360, 66, C.white, C.red, { k: pop(t, ws(51, -0.1)) });
    const kf = pop(t, ws(55, -0.05), 0.35);
    if (kf > 0) { ctx.fillStyle = `rgba(255,30,60,${0.35 * bump(t, ws(55), 0.5)})`; ctx.fillRect(0, 0, W, H); text('فاجعه', 540, 960, 260, C.red, { k: kf, stroke: 22, glow: 'rgba(255,30,60,1)' }); }
  }
  if (inSc(t, 'why')) {
    text('چرا این بافت', 540, 380, 100, C.white, { k: pop(t, ws(58)) });
    tag('این‌قدر آسیب‌پذیره؟', 540, 530, 80, C.white, C.red, { k: pop(t, ws(61)) });
  }
  if (inSc(t, 'attach')) {
    text('H5N1', 540, 380, 170, C.red, { k: pop(t, ws(65, -0.05)), ltr: true, stroke: 14, glow: 'rgba(255,30,60,.9)' });
    tag('می‌چسبه به سلول‌های مجاری شیر', 540, 560, 54, C.white, 'rgba(255,30,60,1)', { k: pop(t, ws(67)), outline: true });
    if (t > ws(80, -0.1)) {
      tag('کارخانه‌ی تولید ویروس', 540, 1480, 74, '#000', C.yel, { k: pop(t, ws(80, -0.1)) });
      const n = Math.floor(10 ** lerp(0, 5, E.in(prog(t, ws(80), ws(84, 0.6)))));
      text('×' + FA(n.toLocaleString('en-US')), 540, 1360, 96, C.yel, { ltr: true, k: pop(t, ws(80)), glow: 'rgba(255,210,26,.7)' });
    }
  }
  if (inSc(t, 'boom')) {
    text('تکثیر انفجاری', 540, 380, 116, C.white, { k: pop(t, ws(86, -0.05)), stroke: 14, glow: 'rgba(255,30,60,.9)' });
    const gauges = [['التهاب بافت', ws(89), C.red, 1], ['ورم شدید پستان', ws(91), C.red, 1], ['تولید شیر', ws(95), C.cyan, -1]];
    gauges.forEach(([name, t0, col, dir], i) => {
      const k = pop(t, t0 - 0.1, 0.3); if (k <= 0) return;
      const y = 1180 + i * 150, v = dir > 0 ? E.out(prog(t, t0, t0 + 0.9)) * 0.92 : 1 - E.out(prog(t, ws(96), ws(97, 0.6))) * 0.85;
      ctx.save(); ctx.globalAlpha = k;
      ctx.fillStyle = 'rgba(3,3,5,.78)'; rrect(110, y - 60, 860, 120, 16); ctx.fill();
      ctx.fillStyle = 'rgba(255,255,255,.12)'; rrect(150, y + 14, 520, 28, 14); ctx.fill();
      ctx.fillStyle = col; ctx.shadowColor = col; ctx.shadowBlur = 18; rrect(150 + 520 * (1 - v), y + 14, 520 * v, 28, 14); ctx.fill();
      ctx.restore();
      text(name, 930, y - 18, 50, C.white, { align: 'right', k: 1, a: k });
      text(dir > 0 ? '▲' : '▼', 760, y + 26, 54, col, { a: k });
    });
    if (t > ws(96)) tag('افت ناگهانی', 540, 1650, 64, '#000', C.cyan, { k: pop(t, ws(96)) });
  }
  if (inSc(t, 'milk')) {
    tag('ویروس‌های تازه بیرون می‌ریزن…', 540, 380, 60, C.white, C.red, { k: pop(t, ws(101)), outline: true });
    tag('مستقیماً', 540, 540, 90, C.white, '#000', { k: pop(t, ws(112)) });
    tag('درونِ شیر', 540, 690, 110, C.white, C.red, { k: pop(t, ws(113, -0.05)), rot: -0.02 });
  }
  if (inSc(t, 'raw')) {
    ctx.fillStyle = `rgba(3,3,5,${0.55 * prog(t, ws(119, -0.2), ws(119, 0.3))})`; ctx.fillRect(0, 0, W, H);
    const k = pop(t, ws(119, -0.05), 0.35);
    biohazard(540, 560, 150, C.red, t * 0.3, k);
    text('شیر خام', 540, 830, 190, C.white, { k, stroke: 18, glow: 'rgba(255,30,60,.9)' });
    tag('یکی از پرخطرترین منابع انتقال', 540, 1020, 62, C.white, C.red, { k: pop(t, ws(129)) });
    tag('آنفلوانزای پرندگان', 540, 1150, 54, '#000', C.yel, { k: pop(t, ws(132)) });
  }
  if (t >= SC.cta[0]) {
    const a = SC.cta[0];
    ctx.fillStyle = `rgba(3,3,5,${0.75 * prog(t, a, a + 0.3)})`; ctx.fillRect(0, 0, W, H);
    tag('شیر خام نخور', 540, 640, 110, C.white, C.red, { k: pop(t, a + 0.05) });
    text('فقط شیر پاستوریزه یا جوشیده', 540, 820, 74, C.white, { k: pop(t, a + 0.35) });
    text('اینو بفرست برای کسی که شیر محلی می‌خره', 540, 1000, 62, C.yel, { k: pop(t, a + 0.7) });
    text('این ویدیو جای مشورت با پزشک یا دامپزشک نیست', 540, 1700, 36, C.grey, { w: 600, a: prog(t, a + 0.9, a + 1.2) });
  }
}

// captions: the phrase being said, the word in yellow
const CHUNKS = (() => {
  const out = []; let cur = [];
  WORDS.forEach((w, i) => {
    if (cur.length && (cur.length === 3 || cur.reduce((n, j) => n + WORDS[j][0].length, 0) + w[0].length > 20)) { out.push(cur); cur = []; }
    cur.push(i); if (/[.،:؟!]$/.test(w[0])) { out.push(cur); cur = []; }
  });
  if (cur.length) out.push(cur); return out;
})();
function captions(t) {
  if (t >= CUT) return;
  let ci = -1; for (let i = 0; i < CHUNKS.length; i++) if (t >= ws(CHUNKS[i][0], -0.05)) ci = i;
  if (ci < 0) return;
  const c = CHUNKS[ci], next = ci + 1 < CHUNKS.length ? ws(CHUNKS[ci + 1][0], -0.05) : CUT;
  if (t > Math.min(next, we(c[c.length - 1], 1.0))) return;
  const words = c.map((i) => WORDS[i][0].replace(/[.،:؟]$/, '')), size = 60, gap = 18;
  const isLat = (s) => /^[A-Za-z0-9]+$/.test(s);
  const widths = words.map((s) => (isLat(s) ? (ctx.font = FONT(900, size), ctx.measureText(s).width) : measure(FA(s), size)));
  const total = widths.reduce((a, b) => a + b, 0) + gap * (words.length - 1), k = pop(t, ws(c[0], -0.05), 0.2);
  ctx.save(); ctx.translate(540, 1785); ctx.scale(k, k);
  ctx.fillStyle = 'rgba(0,0,0,.72)'; rrect(-total / 2 - 32, -56, total + 64, 112, 18); ctx.fill();
  let x = total / 2;
  words.forEach((s, j) => {
    const on = t >= ws(c[j], -0.04), cur = on && (j + 1 >= c.length || t < ws(c[j + 1], -0.04));
    text(isLat(s) ? s : FA(s), x - widths[j] / 2, 4, size, cur ? C.yel : on ? C.white : '#666A74', { ltr: isLat(s) });
    x -= widths[j] + gap;
  });
  ctx.restore();
}

// film grain, made once
const grain = (() => { const c = document.createElement('canvas'); c.width = c.height = 256; const x = c.getContext('2d'), d = x.createImageData(256, 256), r = rng(77);
  for (let i = 0; i < d.data.length; i += 4) { const v = r() * 255; d.data[i] = d.data[i + 1] = d.data[i + 2] = v; d.data[i + 3] = 22; } x.putImageData(d, 0, 0); return c; })();

function seek(t) {
  stage3D(t);
  ctx.globalCompositeOperation = 'source-over'; ctx.filter = 'none';
  ctx.drawImage(glc, 0, 0, W, H);
  // bloom: the frame blurred and added back
  ctx.save(); ctx.globalCompositeOperation = 'lighter'; ctx.globalAlpha = t >= SC.milk[0] ? 0.12 : 0.4; ctx.filter = 'blur(26px)'; ctx.drawImage(glc, 0, 0, W, H); ctx.restore();
  // vignette
  const g = ctx.createRadialGradient(540, 900, 300, 540, 960, 1250); g.addColorStop(0, 'rgba(0,0,0,0)'); g.addColorStop(1, 'rgba(0,0,0,.85)');
  ctx.fillStyle = g; ctx.fillRect(0, 0, W, H);
  // red alarm pulses on the hits
  let f = 0; for (const h of HITS) f = Math.max(f, bump(t, h, 0.35));
  if (f > 0) { ctx.fillStyle = `rgba(255,20,50,${0.22 * f})`; ctx.fillRect(0, 0, W, H); }
  const sh = shakeAt(t);
  ctx.save(); ctx.translate(Math.sin(t * 90) * 14 * sh, Math.cos(t * 70) * 10 * sh);
  layers(t);
  ctx.restore();
  hud(t);
  captions(t);
  const r = rng(Math.floor(t * 24) + 1);
  ctx.save(); ctx.globalCompositeOperation = 'overlay'; ctx.translate(-r() * 256, -r() * 256); ctx.fillStyle = ctx.createPattern(grain, 'repeat'); ctx.fillRect(0, 0, W + 256, H + 256); ctx.restore();
}
window.seek = seek; window.DURATION = DURATION;
window.ready = document.fonts.load(FONT(900, 60)).then(() => document.fonts.load(FONT(600, 40))).then(() => { seek(0); return true; });
