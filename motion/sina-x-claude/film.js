// Sina x Claude: a brick-film conversation. Pure function of time: window.seek(t) paints frame t.
// script.js holds the acting (dialogue, poses, faces, camera); this file builds the set and plays it.
import * as M from './lib/motion.js';
import * as G from './lib/gl.js';
import * as L from './sets/lego.js';
import * as PR from './sets/props.js';
import { drawFace } from './sets/faces.js';
import * as S from './script.js';
import { speech, mouthAt } from './syllables.js';
import * as O from './overlay.js';

const THREE = G.THREE;
const { W, H, E, clamp, lerp, prog, hash01, noise1, wobble, bump } = M;
const TAU = Math.PI * 2;

// ---------------------------------------------------------------- tracks
const EASE = {
  io: E.inOutCubic, out: E.outCubic, cut: () => 1, sine: E.inOutSine,
  back: (p) => E.outBack(p, 1.4), snap: (p) => E.outBack(p, 2.0),
};
function chain(track, t, lerpFn, defEase = 'back', defD = 0.25) {
  let cur = track[0][1];
  for (let i = 1; i < track.length; i++) {
    const k = track[i];
    if (t < k[0]) break;
    const d = k[2] ?? defD, e = EASE[k[3] || defEase];
    const p = d <= 0 ? 1 : e(clamp((t - k[0]) / d));
    cur = lerpFn(cur, k[1], p);
  }
  return cur;
}
const lerpArr = (a, b, p) => a.map((x, i) => lerp(x, b[i], p));
function lerpObj(a, b, p) {
  const o = {};
  for (const k in a) o[k] = lerp(a[k], b[k] ?? 0, p);
  for (const k in b) if (!(k in o)) o[k] = lerp(0, b[k], p);
  return o;
}
const poseOf = (name) => ({ ...L.REST, ...(S.POSES[name] || {}) });
const POSE_TRACK = {
  C: S.POSE_C.map(([t, n, d]) => [t, poseOf(n), d]),
  S: S.POSE_S.map(([t, n, d]) => [t, poseOf(n), d]),
};
const F0 = { open: 1, lookX: 0, lookY: 0, brow: 0, browY: 0, blush: 0, tear: 0 };
const faceOf = (n) => { const e = S.EXPR[n]; const o = { ...F0 }; for (const k in e) if (typeof e[k] === 'number') o[k] = e[k]; return o; };
const EXPR_TRACK = { C: S.EXPR_C, S: S.EXPR_S };
const EXPR_NUM = { C: S.EXPR_C.map(([t, n]) => [t, faceOf(n), 0.14, 'out']), S: S.EXPR_S.map(([t, n]) => [t, faceOf(n), 0.14, 'out']) };
const LINES_OF = { C: [], S: [] };
S.LINES.forEach((l, i) => { l.index = i; LINES_OF[l.who].push(l); });
const SPEECH = new Map(S.LINES.map((l) => [l, speech(l, l.index)]));
const mouthCache = new Map(SPEECH);

function exprAt(who, t) {
  const tr = EXPR_TRACK[who];
  let i = 0;
  while (i + 1 < tr.length && tr[i + 1][0] <= t) i++;
  const e = S.EXPR[tr[i][1]];
  const F = chain(EXPR_NUM[who], t, lerpObj, 'out', 0.14);
  F.eyes = e.eyes; F.mouth = e.mouth;
  // a blink hides every face swap, plus natural blinks every few seconds
  const since = t - tr[i][0];
  let open = since < 0.07 && i > 0 ? 0.05 : 1;
  const per = 3.3, k = Math.floor(t / per), off = hash01(k, who === 'C' ? 4 : 9) * 1.6;
  if (t - k * per - off >= 0 && t - k * per - off < 0.11) open = 0.05;
  F.open = (F.open ?? 1) * open;
  return F;
}

// hops: y offset and landing squash
function hopAt(hops, t) {
  let y = 0, sq = 0;
  for (const [t0, h, d] of hops) {
    if (d > 0 && t >= t0 && t < t0 + d) { const p = (t - t0) / d; y += h * 4 * p * (1 - p); sq -= 0.06 * Math.sin(Math.PI * p); }
    if (t >= t0 + d && t < t0 + d + 0.6) sq += 0.09 * wobble(t - t0 - d, 3, 7) * Math.min(1, h * 2 + 0.3);
  }
  return { y, sq };
}

// spark spin: piecewise-constant extra rates, integrated in closed form
const SPIN = [[4.1, 5.5, 14], [7.8, 8.6, 9], [15.2, 17.0, -10], [17.6, 19.0, 6], [33.45, 34.0, 20], [40.3, 42.5, 16], [59.1, 60.8, 18], [63.0, 63.8, 12], [79.6, 80.3, 10]];
function sparkAngle(t) {
  let a = t * 0.6;
  for (const [t0, t1, r] of SPIN) a += r * clamp(t - t0, 0, t1 - t0);
  return a;
}

// ---------------------------------------------------------------- the set
let SET = null, W3 = null;

function build(IMG) {
  const scene = new THREE.Scene();
  const cam = G.camera(30, 0.1, 200);
  const key = new THREE.DirectionalLight(0xfff1e2, 3.0);
  key.position.set(-6, 12, 9); key.castShadow = !new URLSearchParams(location.search).has('noshadow');
  key.shadow.mapSize.set(2048, 2048);
  Object.assign(key.shadow.camera, { left: -10, right: 10, top: 10, bottom: -10, near: 1, far: 50 });
  key.shadow.camera.updateProjectionMatrix(); key.shadow.bias = -0.0004; key.shadow.normalBias = 0.02;
  scene.add(key);
  const rim = new THREE.DirectionalLight(0xffd8c4, 1.3); rim.position.set(6, 6, -8); scene.add(rim);
  const hemi = new THREE.HemisphereLight(0xffffff, 0x3a2a20, 0.55); scene.add(hemi);
  const spot = new THREE.SpotLight(0xfff0d0, 0, 40, 0.42, 0.5, 0);
  spot.position.set(0, 16, 2); spot.castShadow = false;
  scene.add(spot); scene.add(spot.target);

  const floor = L.baseplate(40, 40, '#DCC7A0'); scene.add(floor);

  const claude = L.minifig('claude'), sina = L.minifig('sina');
  scene.add(claude.root, sina.root);

  // clones: four Sinas (morning editor, noon designer, evening motion, night prompts) on a riser
  const riser = new THREE.Group();
  const rb = L.brick(14, 3, '#5E6A7A', { h: 1.2 }); riser.add(rb);
  riser.position.set(0, -1.4, -2.9); scene.add(riser);
  const sClones = [];
  const cloneFaces = ['proud', 'happy', 'smug', 'curious'];
  const cloneProps = [PR.clapper(), { group: PR.pencil() }, { group: PR.keyframe() }, { group: PR.laptop() }];
  for (let i = 0; i < 4; i++) {
    const f = L.minifig('sina');
    f.faceTex.draw((c) => drawFace(c, 'sina', { ...faceOf(cloneFaces[i]), eyes: S.EXPR[cloneFaces[i]].eyes, mouth: S.EXPR[cloneFaces[i]].mouth }, 0));
    f.prop = cloneProps[i];
    f.parts.handR.add(f.prop.group);
    scene.add(f.root); sClones.push(f);
  }
  // prop placement in the right hand
  sClones[0].prop.group.position.set(0, 0.1, 0.45); sClones[0].prop.group.scale.setScalar(0.8);
  sClones[1].prop.group.position.set(0, 0.3, 0.25); sClones[1].prop.group.rotation.x = 0.4;
  sClones[2].prop.group.position.set(0, 0.45, 0.3);
  sClones[3].prop.group.position.set(-0.1, -0.05, 0.6); sClones[3].prop.group.rotation.x = -0.9; sClones[3].prop.group.scale.setScalar(0.85);
  const cClones = [];
  for (let i = 0; i < 3; i++) { const f = L.minifig('claude'); scene.add(f.root); cClones.push(f); }

  // props
  const jet = PR.jet(); jet.scale.setScalar(0.62); scene.add(jet);
  const pill = PR.capsule(); pill.scale.setScalar(0.9); scene.add(pill);
  const cards = Array.from({ length: 8 }, (_, i) => { const c = PR.refCard(i); scene.add(c); return c; });
  const cap = PR.gradCap(); claude.parts.headTop.add(cap);
  const scroll = PR.scroll(); scene.add(scroll.group);
  const ped = PR.pedestal(); ped.group.position.set(0, -6, -2.8); scene.add(ped.group);
  const hiroStack = PR.tileStack(14, 0); hiroStack.group.position.set(1.85, 0, -2.6); scene.add(hiroStack.group);
  const myStack = PR.tileStack(2, 3); myStack.group.position.set(-2.9, 0, -1.2); scene.add(myStack.group);
  const lbrick = PR.labelBrick(); scene.add(lbrick.group);
  const tom = PR.tomato(); tom.group.position.set(1.85, 0, 2.4); scene.add(tom.group);
  const tl = PR.timeline(); tl.group.position.set(-0.5, 0, 2.2); tl.group.scale.setScalar(0.42); scene.add(tl.group);
  const frame = PR.frameWithPhoto(IMG.portrait); scene.add(frame);
  const cupC = PR.cup(), cupS = PR.cup();
  claude.parts.handR.add(cupC); sina.parts.handR.add(cupS);
  const conf = PR.confetti(110); scene.add(conf.mesh);
  const puffs = PR.puffs(12); scene.add(puffs.group);
  const scroll2 = PR.scroll('new'); scene.add(scroll2.group);
  const looseSpark = new THREE.Mesh(L.sparkGeometry(0.32), L.plastic('#D97757')); looseSpark.castShadow = true; scene.add(looseSpark);

  W3 = { scene, cam, key, rim, hemi, spot, floor, claude, sina, riser, sClones, cClones, jet, pill, cards, cap, scroll, ped, hiroStack, myStack, lbrick, tom, tl, frame, cupC, cupS, conf, puffs, scroll2, looseSpark };
  return { scene, camera: cam, update };
}

// ---------------------------------------------------------------- per-frame
const show = (o, v) => { o.visible = v; };
function scaleIn(o, t, t0, t1 = 1e9, d = 0.3) {
  const k = Math.min(E.outBack(prog(t, t0, t0 + d), 2.2), 1 - E.inBack(prog(t, t1, t1 + d * 0.6), 1.5));
  o.visible = k > 0.001; o.scale.setScalar(Math.max(0.001, k));
  return k;
}

function actor(fig, who, t) {
  const tq = Math.floor(t * 12) / 12;                // on twos at 24 fps: the brick-film cadence
  const pose = chain(POSE_TRACK[who], tq, lerpObj, 'back', 0.25);
  const look = chain(who === 'C' ? S.LOOK_C : S.LOOK_S, tq, lerpArr, 'out', 0.25);
  const root = chain(who === 'C' ? S.ROOT_C : S.ROOT_S, tq, lerpArr, 'out', 0.3);
  const rootPrev = chain(who === 'C' ? S.ROOT_C : S.ROOT_S, tq - 0.07, lerpArr, 'out', 0.3);
  const speed = Math.hypot(root[0] - rootPrev[0], root[1] - rootPrev[1]) / 0.07;
  const hop = hopAt(who === 'C' ? S.HOPS_C : S.HOPS_S, tq);
  let y = hop.y;
  if (who === 'C') for (const [a, b, h] of S.FLOAT_C) {
    const k = E.outCubic(prog(tq, a, a + 0.6)) * (1 - E.inCubic(prog(tq, b - 0.15, b)));
    y += k * (h + 0.08 * Math.sin(tq * 3));
  }
  const m = mouthAt(LINES_OF[who], tq, mouthCache);
  const talking = m.open > 0.02 || LINES_OF[who].some((l) => tq > l.t && tq < SPEECH.get(l).end);
  const q = { ...pose };
  q.headY += look[0]; q.headX += look[1];
  if (talking) {
    q.headX += 0.05 * m.open - 0.02;
    q.armR += 0.1 * Math.sin(tq * 9.0) * (pose.armR > 0.5 && pose.armR < 2 ? 1 : 0);
    q.armL += 0.08 * Math.sin(tq * 7.0 + 1) * (pose.armL > 0.5 && pose.armL < 2 ? 1 : 0);
  }
  // walking legs when the root moves
  if (speed > 0.3) { const sw = Math.min(0.7, speed * 0.25) * Math.sin(tq * 22); q.legR += sw; q.legL -= sw; q.armR -= sw * 0.7; q.armL += sw * 0.7; }
  // idle life: a slow sway
  q.side = (q.side || 0) + 0.02 * Math.sin(tq * 1.7 + (who === 'C' ? 0 : 2));
  L.applyPose(fig, q);
  fig.root.position.set(root[0], y, root[1]);
  fig.root.rotation.y = root[2];
  fig.body.scale.set(1 - hop.sq * 0.5, 1 + hop.sq, 1 - hop.sq * 0.5);
  const F = exprAt(who, tq);
  F.talk = m.open; F.vis = m.vis;
  fig.faceTex.draw((c) => drawFace(c, fig.who, F, tq));
  return { F, talking };
}

function update(t) {
  const w = W3, tq = Math.floor(t * 12) / 12;
  if (t >= 83.3) sparkStart();
  const a = actor(w.claude, 'C', t);
  actor(w.sina, 'S', t);

  // Claude's spark: spins, glows when happy, droops when sad
  const sp = w.claude.parts.spark;
  sp.rotation.set(0, 0, sparkAngle(tq));
  const sad = ['sad', 'cry', 'deadpan', 'ko'].includes(exprName('C', tq));
  sp.rotation.x = sad ? 0.9 : 0;
  const capK = Math.max(0, Math.min(E.outBack(prog(t, 33.6, 33.9), 2.2), 1 - E.inBack(prog(t, 36.1, 36.28), 1.5)));
  sp.position.y = L.STUD_H + 0.3 - (sad ? 0.05 : 0) + 0.22 * capK;
  const glow = ['love', 'joy', 'starry', 'shy'].includes(exprName('C', tq)) ? 0.6 : 0;
  w.claude.parts.sparkMesh.material.emissiveIntensity = glow;
  const loose = t >= 83.3;
  sp.visible = !loose;

  // camera
  const camv = chain(S.CAM.map(([tt, p, g, d, e]) => [tt, [...p, ...g], d, e]), t, lerpArr, 'io', 0.6);
  let [px, py, pz, gx, gy, gz] = camv;
  for (const [t0, amp, dec] of S.SHAKES) {
    if (t < t0 || t > t0 + dec * 4) continue;
    const k = amp * Math.exp(-(t - t0) / dec);
    px += k * noise1(t * 40, 3); py += k * noise1(t * 40, 7);
  }
  // a hand-held breath on everything
  px += 0.03 * noise1(t * 0.7, 21); py += 0.025 * noise1(t * 0.6, 22);
  G.lookFrom(w.cam, [px, py, pz], [gx, gy, gz]);

  // lights by mood
  const mw = O.moodWeights(S.MOOD, t);
  const mv = (k) => { let s = 0; for (const m in mw) s += (LIGHT[m][k] ?? LIGHT.studio[k]) * mw[m]; return s; };
  w.key.intensity = mv('key'); w.hemi.intensity = mv('hemi'); w.rim.intensity = mv('rim');
  w.key.color.setRGB(mv('kr'), mv('kg'), mv('kb'));
  w.spot.intensity = mv('spot'); w.spot.visible = w.spot.intensity > 0.01;
  w.rim.visible = w.rim.intensity > 0.01;
  const spotOnClaude = t > 48.5 && t < 54;
  w.spot.target.position.set(spotOnClaude ? S.CX : 0, 0, spotOnClaude ? 0 : -2.8);
  w.spot.position.set(spotOnClaude ? S.CX : 0, 16, spotOnClaude ? 3 : 1);

  events(t, tq, a);
}
const LIGHT = {
  studio: { key: 3.0, hemi: 0.55, rim: 1.3, kr: 1, kg: 0.95, kb: 0.88, spot: 0 },
  angry: { key: 2.8, hemi: 0.45, rim: 2.2, kr: 1, kg: 0.72, kb: 0.55, spot: 0 },
  spot: { key: 0.25, hemi: 0.12, rim: 0.6, kr: 0.7, kg: 0.75, kb: 1, spot: 7 },
  deadpan: { key: 1.4, hemi: 0.7, rim: 0.3, kr: 0.85, kg: 0.88, kb: 0.95, spot: 0 },
  warm: { key: 3.2, hemi: 0.6, rim: 1.6, kr: 1, kg: 0.86, kb: 0.62, spot: 0 },
  golden: { key: 3.2, hemi: 0.6, rim: 1.8, kr: 1, kg: 0.8, kb: 0.55, spot: 0 },
  end: { key: 3.0, hemi: 0.6, rim: 1.2, kr: 1, kg: 0.95, kb: 0.88, spot: 0 },
};
function exprName(who, t) {
  const tr = EXPR_TRACK[who];
  let i = 0;
  while (i + 1 < tr.length && tr[i + 1][0] <= t) i++;
  return tr[i][1];
}

// ---------------------------------------------------------------- props and events
function events(t, tq, act) {
  const w = W3;
  // --- clones (8.8 .. 14.6)
  const riserK = E.outBack(prog(t, 8.6, 9.1), 1.6) * (1 - E.inCubic(prog(t, 14.3, 14.8)));
  w.riser.position.y = -1.4 + 1.4 * riserK; w.riser.visible = riserK > 0.001;
  const cloneX = [2.75, 0.95, -0.95, -2.75];
  w.sClones.forEach((f, i) => {
    const t0 = 9.0 + i * 0.5, k = scaleIn(f.root, t, t0, 14.2 + i * 0.05, 0.35);
    if (k <= 0) return;
    f.root.position.set(cloneX[i], 1.2 * riserK + 0.17 + 0.6 * Math.max(0, Math.sin(Math.PI * prog(t, t0, t0 + 0.35))), -2.9);
    f.root.rotation.y = -cloneX[i] * 0.08;
    const act2 = [
      { armR: 1.4 + 0.25 * Math.max(0, Math.sin(tq * 9)), armL: 1.2, outL: -0.2 },
      { armR: 1.7 + 0.2 * Math.sin(tq * 6), outR: 0.1 },
      { armR: 2.6, outR: 0.25, armL: 0.3 },
      { armR: 1.1, armL: 1.1, outR: -0.15, outL: -0.15, headX: 0.25 },
    ][i];
    L.applyPose(f, { ...L.REST, ...act2, headY: Math.sin(tq * 2 + i) * 0.15 });
    if (i === 0) f.prop.arm.rotation.z = 0.5 * Math.max(0, Math.sin(tq * 9));
    if (i === 2) f.prop.group.rotation.y = tq * 3;
  });
  // Claude clones run around him and crash (14.6 .. 16.9)
  w.cClones.forEach((f, i) => {
    const k = scaleIn(f.root, t, 14.6 + i * 0.08, 16.75, 0.25);
    if (k <= 0) return;
    const run = clamp((tq - 14.7) / 1.1), a0 = (i / 3) * TAU + 0.6;
    const ang = a0 + run * 7 + (i - 1) * 0.15 * (tq > 15.8 ? 1 : 0);
    const r = tq < 15.8 ? 1.35 : 1.35 - 0.5 * E.outBack(prog(tq, 15.8, 16.0), 2);
    f.root.position.set(S.CX + Math.cos(ang) * r, tq > 15.8 && tq < 16.1 ? 0.25 * Math.sin(Math.PI * prog(tq, 15.8, 16.1)) : 0, Math.sin(ang) * r * 0.75 + 0.3);
    f.root.rotation.y = tq < 15.8 ? -ang : -ang + Math.PI * 0.6;
    const sw = tq < 15.8 ? 0.7 * Math.sin(tq * 24 + i) : 0;
    L.applyPose(f, { ...L.REST, legR: sw, legL: -sw, armR: 1.0 - sw, armL: 1.0 + sw, lean: tq < 15.8 ? 0.25 : -0.1, bodyZ: tq > 16.0 ? 0.25 * Math.sin(tq * 14 + i) : 0 });
    const dizzy = tq > 15.8;
    f.faceTex.draw((c) => drawFace(c, 'claude', { ...F0, eyes: dizzy ? 'spiral' : 'open', mouth: dizzy ? 'wavy' : 'grin', brow: dizzy ? -0.6 : 0.4, browY: 0.3 }, tq + i));
    f.parts.spark.rotation.z = sparkAngle(tq) * (1 + i * 0.3);
  });

  // --- the F-14 (17.6 .. 19.3), right to left, banking
  {
    const p = prog(t, 17.55, 19.3);
    show(w.jet, p > 0 && p < 1);
    w.jet.position.set(lerp(9.5, -10.5, p), 5.4 - 0.6 * Math.sin(Math.PI * p), -6.0 + 1.5 * Math.sin(Math.PI * p));
    w.jet.rotation.set(0.5 * Math.sin(p * 6) * 0.3 - 0.45, Math.PI + 0.25, 0.1);
  }
  // --- the capsule (20.0 .. 22.4): drops, bounces, rolls away
  {
    const t0 = 19.95;
    show(w.pill, t > t0 && t < 22.6);
    if (w.pill.visible) {
      const tt = t - t0;
      let y;
      if (tt < 0.42) y = 7.5 - 0.5 * 40 * tt * tt;
      else { const b = tt - 0.42; y = Math.abs(Math.sin(b * 6)) * 1.2 * Math.exp(-b * 2.2); }
      y = Math.max(0, y) + 0.45;
      const roll = E.inCubic(prog(t, 21.7, 22.6));
      w.pill.position.set(S.CX + 1.15 + roll * 7, y, 1.0);
      w.pill.rotation.set(0, 0.4, -roll * 10 + (tt < 0.42 ? tt * 4 : 0));
    }
  }
  // --- reference cards (29.2 .. 34.3)
  {
    const drops = [[29.2, -2.6, 0.9, 0], [29.45, -0.5, 1.2, 0], [29.7, -1.9, 1.7, 0], [31.5, -1.35, 0.15, 1], [31.7, -1.35, 0.15, 2], [31.9, -1.35, 0.15, 3], [32.1, -1.35, 0.15, 4], [32.9, -1.35, 0.15, 5]];
    const claudeTop = 4.0 - 1.2 * E.outCubic(prog(t, 31.7, 32.0)) - 0.5 * E.outCubic(prog(t, 32.9, 33.05)) + 1.7 * E.outBack(prog(t, 33.45, 33.7));
    w.cards.forEach((c, i) => {
      const [t0, x, z, stackIdx] = drops[i];
      const vis = t > t0 && t < 34.6;
      c.visible = vis;
      if (!vis) return;
      const fall = clamp((t - t0) / 0.45);
      const restY = stackIdx === 0 ? 0.06 : Math.max(0.06, claudeTop - 0.2) + stackIdx * 0.13;
      let y = lerp(9, restY, E.inQuad(fall));
      let x2 = x, z2 = z, ry = i * 0.7, rx = (1 - fall) * 3;
      // scatter when Claude pops out
      const sc = prog(t, 33.45, 34.4);
      if (sc > 0) {
        const dir = (i * 2.399) % TAU;
        x2 += Math.cos(dir) * sc * 4; z2 += Math.sin(dir) * sc * 2.5 + sc;
        y = y + 3.5 * sc - 6 * sc * sc; rx += sc * 8; ry += sc * 5;
      }
      c.position.set(x2, y, z2); c.rotation.set(rx, ry, stackIdx ? Math.sin(i) * 0.15 : 0);
    });
    // Claude squashes under the pile
    if (t > 31.7 && t < 33.45) {
      const sq = 0.18 * E.outCubic(prog(t, 31.7, 32.0)) + 0.14 * E.outCubic(prog(t, 32.9, 33.05));
      w.claude.body.scale.set(1 + sq * 0.6, 1 - sq, 1 + sq * 0.6);
    }
  }
  // graduation cap, on Claude's head with the spark poking through
  {
    const k = scaleIn(w.cap, t, 33.6, 36.1, 0.25);
    if (k > 0) { w.cap.position.y = 0.02; w.cap.rotation.y = 0.3; }
  }
  // --- the rules scroll (36.3 .. 42.8)
  {
    const vis = t > 36.3 && t < 40.5;
    w.scroll.group.visible = vis;
    if (vis) {
      const unroll = E.outCubic(prog(t, 36.6, 39.0));
      const hangTop = 3.55, fold = E.inCubic(prog(t, 40.0, 40.45));
      w.scroll.layout(S.CX, hangTop * (1 - fold) + 0.05, 0.85, unroll * 5.4 * (1 - fold));
      w.scroll.group.visible = fold < 0.98;
      // the glitch gag: rule one glitches for a quarter second, then the buzzer
      const g = t > 38.9 && t < 39.15 ? 1 : 0;
      const want = g ? `g${Math.floor(t * 30)}` : 'clean';
      if (w.scroll.state !== want) { w.scroll.paint(g, Math.floor(t * 30)); w.scroll.state = want; }
    }
  }
  // --- steam puffs (40.5 .. 42.6)
  {
    const on = t > 40.5 && t < 42.8;
    w.puffs.group.visible = on;
    if (on) {
      const head = new THREE.Vector3(); w.claude.parts.headTop.getWorldPosition(head);
      w.puffs.list.forEach((s, i) => {
        const per = 0.6, ph = ((t - 40.5) / per + i / w.puffs.list.length) % 1;
        const side = i % 2 ? 1 : -1;
        s.position.set(head.x + side * (0.35 + ph * 0.8), head.y - 0.2 + ph * 1.6, head.z + 0.1);
        s.scale.setScalar(0.4 + ph * 1.4);
        s.material.opacity = 0.9 * (1 - ph);
      });
    }
  }
  // --- Hiro's pedestal (42.8 .. 53.6)
  {
    const up = E.outBack(prog(t, 42.8, 43.7), 1.2) * (1 - E.inCubic(prog(t, 53.4, 54.2)));
    w.ped.group.position.y = -6 + 6 * up; w.ped.group.visible = up > 0.001;
    w.ped.crown.rotation.y = t * 1.2;
    w.ped.crown.position.y = 2.4 + L.PLATE + 2.75 + 0.08 * Math.sin(t * 3);
    w.hiroStack.tiles.forEach((tile, i) => { const k = scaleIn(tile, t, 44.9 + i * 0.08, 47.75, 0.18); if (k > 0) tile.position.y = i * (L.PLATE + 0.005) + (1 - k) * 0.5; });
    w.myStack.tiles.forEach((tile, i) => { const k = scaleIn(tile, t, 45.9 + i * 0.25, 47.75, 0.2); if (k > 0) tile.position.y = i * (L.PLATE + 0.005); });
  }
  // --- confetti (59.3)
  w.conf.at(t - 59.3, [0, 4.2, 0.5]);
  w.conf.mesh.visible = t > 59.3 && t < 62.9;
  // --- mistake brick -> rule brick (61.4 .. 64.6)
  {
    const k = scaleIn(w.lbrick.group, t, 61.4, 64.4, 0.35);
    if (k > 0) {
      const flip = E.outBack(prog(t, 63.0, 63.55), 1.6);
      w.lbrick.group.position.set(0, 1.4 + 0.12 * Math.sin(t * 2.4) + 0.7 * Math.sin(Math.PI * prog(t, 63.0, 63.55)), 1.4);
      w.lbrick.group.rotation.set(0.15, -0.25 + flip * Math.PI, 0);
    }
  }
  // --- tomato timer + brick timeline (65.3 .. 67.9)
  {
    const k = scaleIn(w.tom.group, t, 65.3, 67.7, 0.35);
    if (k > 0) {
      const ang = -prog(t, 65.6, 67.7) * TAU * 0.9;
      w.tom.dialTex.draw((c, W_, H_) => {
        c.translate(W_ / 2, H_ / 2);
        c.fillStyle = '#FFF6EA'; c.beginPath(); c.arc(0, 0, 118, 0, TAU); c.fill();
        c.fillStyle = 'rgba(224,54,44,.85)'; c.beginPath(); c.moveTo(0, 0); c.arc(0, 0, 110, -Math.PI / 2, -Math.PI / 2 + ang, true); c.closePath(); c.fill();
        c.strokeStyle = '#3A2A20'; c.lineWidth = 6; for (let i = 0; i < 12; i++) { const a2 = i / 12 * TAU; c.beginPath(); c.moveTo(Math.cos(a2) * 96, Math.sin(a2) * 96); c.lineTo(Math.cos(a2) * 112, Math.sin(a2) * 112); c.stroke(); }
        c.fillStyle = '#3A2A20'; c.font = `900 54px ${O.FA}`; c.textAlign = 'center'; c.textBaseline = 'middle'; c.fillText(O.faNum(25), 0, 4);
      });
      w.tom.group.rotation.y = -0.5 + 0.08 * Math.sin(t * 20) * (1 - prog(t, 65.3, 65.8));
    }
    const kt = scaleIn(w.tl.group, t, 65.9, 67.7, 0.3) * 0.42; if (kt > 0) w.tl.group.scale.setScalar(kt);
    if (kt > 0) {
      w.tl.clips.forEach((c, i) => { const ki = E.outBack(prog(t, 66.0 + i * 0.08, 66.25 + i * 0.08), 2); c.visible = ki > 0.01; c.scale.set(1, Math.max(0.01, ki), 1); });
      w.tl.head.position.x = lerp(-4.6, 4.6, prog(t, 66.8, 67.8));
      w.tl.group.rotation.y = 0.0;
    }
  }
  // --- the framed portrait (73.3 .. 75.7), held up by Claude
  {
    const k = scaleIn(w.frame, t, 73.35, 75.5, 0.3);
    if (k > 0) {
      const hp = new THREE.Vector3(), hp2 = new THREE.Vector3();
      w.claude.parts.handR.getWorldPosition(hp); w.claude.parts.handL.getWorldPosition(hp2);
      w.frame.position.set((hp.x + hp2.x) / 2, (hp.y + hp2.y) / 2 + 0.3, (hp.z + hp2.z) / 2 + 0.25);
      w.frame.rotation.set(-0.05, w.claude.root.rotation.y * 0.6, 0.04 * Math.sin(t * 3));
    }
  }
  // --- coffee cups (76.0 .. 83)
  {
    const k1 = scaleIn(w.cupC, t, 76.0, 1e9, 0.25), k2 = scaleIn(w.cupS, t, 76.1, 1e9, 0.25);
    for (const c of [w.cupC, w.cupS]) { c.position.set(0, 0.18, 0.28); c.rotation.set(-0.2, 0, 0); }
    if (t > 82.7) {
      // Claude's cup flies off as he faints
      w.cupC.visible = false;
    }
  }
  // --- Sina's new scroll (81.3 .. 88), unrolls toward Claude along the floor
  {
    const vis = t > 81.4;
    w.scroll2.group.visible = vis;
    if (vis) {
      const un = E.outCubic(prog(t, 81.6, 82.8));
      w.scroll2.layout(0, 2.4, 0, un * 3.4);
      w.scroll2.group.position.set(w.sina.root.position.x - 0.35, 0, 0.7);
      w.scroll2.group.rotation.y = -Math.PI / 2;
    }
  }
  // --- the spark pops off when Claude faints (83.3 ..)
  {
    const on = t >= 83.3;
    w.looseSpark.visible = on;
    if (on) {
      const tt = t - 83.3;
      const [x0, y0, z0] = sparkStart();
      let y; const g = 14;
      if (tt < 0.62) y = y0 + 4.2 * tt - 0.5 * g * tt * tt;
      else { const b = tt - 0.62; y = Math.max(0, Math.abs(Math.sin(b * 5)) * 0.9 * Math.exp(-b * 2.5)); }
      w.looseSpark.position.set(x0 + 1.4 * Math.min(tt, 1.2), Math.max(0.16, y + 0.16), z0 + 1.2 * Math.min(tt, 1.2));
      w.looseSpark.rotation.set(-Math.PI / 2 * clamp(tt), 0, tt * 8 * Math.exp(-tt));
    }
  }
}

// where the spark sits at the moment it pops off (a constant of the film, computed once)
let SPARK0 = null;
function sparkStart() {
  if (SPARK0) return SPARK0;
  actor(W3.claude, 'C', 83.3);
  const p = new THREE.Vector3(); W3.claude.parts.spark.getWorldPosition(p);
  SPARK0 = [p.x, p.y, p.z];
  return SPARK0;
}

// ---------------------------------------------------------------- 2-D overlays
const v3 = new THREE.Vector3();
function screen(obj, off = [0, 0, 0]) {
  v3.set(...off);
  obj.localToWorld(v3);
  v3.project(W3.cam);
  return [(v3.x + 1) / 2 * W, (1 - v3.y) / 2 * H, v3.z];
}
const CUTS = [10.85, 47.8];
function lineEnd(i) {
  const l = S.LINES[i], nx = S.LINES[i + 1];
  let e = Math.min(nx ? nx.t - 0.06 : 1e9, l.t + l.d + 0.75);
  for (const c of CUTS) if (l.t < c && e > c) e = c;
  return e;
}

function overlays(ctx, t) {
  const w = W3;
  const headC = screen(w.claude.parts.head, [0, 0.42, 0.45]), topC = screen(w.claude.parts.headTop, [0, 0.8, 0]);
  const headS = screen(w.sina.parts.head, [0, 0.3, 0.45]), topS = screen(w.sina.parts.headTop, [0, 0.4, 0]);

  // loading bar over Claude (4.1 .. 5.5)
  if (t > 4.1 && t < 5.6) {
    const k = E.outBack(prog(t, 4.1, 4.3), 2) * (1 - prog(t, 5.4, 5.6));
    const p = E.inOutCubic(prog(t, 4.25, 5.25));
    const x = clamp(headC[0], 260, W - 260), y = Math.max(topC[1] - 90, 330);
    ctx.save(); ctx.translate(x, y); ctx.scale(k, k);
    ctx.fillStyle = '#1F1B2E'; ctx.beginPath(); ctx.roundRect(-220, -52, 440, 104, 52); ctx.fill();
    ctx.fillStyle = '#3A3550'; ctx.beginPath(); ctx.roundRect(-190, 4, 380, 22, 11); ctx.fill();
    ctx.fillStyle = '#D97757'; ctx.beginPath(); ctx.roundRect(190 - 380 * p, 4, 380 * p, 22, 11); ctx.fill();   // fills right to left
    ctx.fillStyle = '#FFF8EE'; ctx.font = `800 34px ${O.FA}`; ctx.direction = 'rtl'; ctx.textAlign = 'right'; ctx.textBaseline = 'middle';
    ctx.fillText('در حال تحلیل سینا…', 185, -22);
    ctx.textAlign = 'left'; ctx.fillText(O.faNum(Math.round(p * 100)) + '٪', -185, -22);
    ctx.restore();
  }
  // clone tags (11.0 .. 14.3): right to left, morning first
  {
    const tags = [['صبح · تدوینگر', 'sunrise'], ['ظهر · گرافیست', 'sun'], ['عصر · موشن‌دیزاینر', 'sunset'], ['شب · پرامپت‌نویس', 'moon']];
    w.sClones.forEach((f, i) => {
      const t0 = 10.9 + i * 0.5;
      const k = E.outBack(prog(t, t0, t0 + 0.3), 2) * (1 - E.inBack(prog(t, 13.3, 13.55)));
      if (k <= 0 || !f.root.visible) return;
      const p = screen(f.parts.headTop, [0, 0.55, 0]);
      const y = p[1] - 110 - (i % 2) * 100, x = clamp(p[0], 200, W - 200);
      // a leader line from the tag down to its Sina
      ctx.save(); ctx.globalAlpha = clamp(k); ctx.strokeStyle = 'rgba(22,22,26,.75)'; ctx.lineWidth = 5; ctx.setLineDash([2, 10]); ctx.lineCap = 'round';
      ctx.beginPath(); ctx.moveTo(x, y + 30); ctx.lineTo(p[0], p[1] - 10); ctx.stroke(); ctx.restore();
      O.tag(ctx, tags[i][0], x, y, k, { size: 34, icon: tags[i][1], bg: i === 3 ? '#262A4A' : '#16161A', iconColor: i === 3 ? '#E9ECFF' : '#FFC93C' });
    });
  }
  // line art around the floating Claude (22.2 .. 24.5)
  if (t > 22.2 && t < 24.6) {
    const p = prog(t, 22.3, 23.6) * (1 - prog(t, 24.3, 24.6));
    const c = screen(w.claude.parts.torso, [0, 0.9, 0]);
    ctx.save(); ctx.globalAlpha = 1 - prog(t, 24.3, 24.6);
    O.lineArt(ctx, c[0], c[1], 300, prog(t, 22.3, 23.8), t, '#6B4A2A');
    ctx.restore();
  }
  // question marks (25.0 ..)
  if (t > 24.95 && t < 27.4) {
    [[25.0, -1, 0, 120], [25.3, 1, -70, 150], [25.6, -1, -260, 100]].forEach(([t0, sd, dy, sz], i) => {
      const k = E.outBack(prog(t, t0, t0 + 0.25), 2.5) * (1 - prog(t, 27.0, 27.35));
      if (k <= 0) return;
      O.bigText(ctx, '؟', clamp(headC[0] + sd * 330, 120, W - 120), Math.max(700, headC[1] - 60) + dy + 10 * Math.sin(t * 4 + i), sz, '#2A1F1A', k, 900, '#FFF8EE');
    });
  }
  // the complaint stamp (27.5 ..) and the chapter tag
  if (t > 27.45 && t < 28.9) {
    const k = lerp(3.2, 1, E.outCubic(prog(t, 27.45, 27.6))) * (1 - E.inBack(prog(t, 28.5, 28.85)));
    O.stamp(ctx, 'گلایه‌ها!', W / 2, H * 0.32, k, -0.12, { size: 150, fill: 'rgba(255,248,238,.92)' });
  }
  // card counters
  {
    const cnt = [[29.8, '۳', 31.2], [32.2, '+۴', 32.85], [32.95, '+۱', 33.45]];
    for (const [t0, s, t1] of cnt) {
      const k = E.outBack(prog(t, t0, t0 + 0.2), 3) * (1 - prog(t, t1, t1 + 0.12));
      if (k > 0) O.bigText(ctx, s, clamp(headC[0] + 300, 200, W - 200), clamp(headC[1] + 160, 700, 1300), 150, '#FFF8EE', k, 900, '#B8261C', 'ltr');
    }
  }
  // the glitch buzzer (39.15 .. 39.8)
  if (t > 39.12 && t < 39.85) {
    const k = E.outBack(prog(t, 39.12, 39.25), 3) * (1 - prog(t, 39.7, 39.85));
    const p = screen(w.scroll.group, [0, 0.2, 0.85 + (1110 / 2700) * 9 - 3.5]);
    ctx.save(); ctx.translate(p[0], p[1]); ctx.scale(k, k);
    ctx.strokeStyle = '#E5262E'; ctx.lineWidth = 26; ctx.beginPath(); ctx.arc(0, 0, 150, 0, TAU); ctx.stroke();
    ctx.beginPath(); ctx.moveTo(-106, 106); ctx.lineTo(106, -106); ctx.stroke();
    ctx.restore();
    O.bigText(ctx, 'گلیچ نه!', p[0], p[1] + 230, 80, '#FFFFFF', k, 900, '#E5262E');
  }
  // frazzled marks (40.4 .. 42.6)
  if (t > 40.4 && t < 42.7) {
    const k = E.outBack(prog(t, 40.4, 40.6), 2.5) * (1 - prog(t, 42.4, 42.7));
    const pulse = 1 + 0.15 * Math.sin(t * 18);
    O.angerMark(ctx, topC[0] + 150, topC[1] + 40, 46 * k * pulse);
    for (let i = 0; i < 4; i++) {
      const ph = ((t - 40.4) * 1.8 + i / 4) % 1, sd = i % 2 ? 1 : -1;
      O.drop(ctx, headC[0] + sd * (160 + ph * 140), headC[1] - 80 + ph * ph * 260 - ph * 120, 22 * k, sd * 0.6);
    }
  }
  // Hiro: "more projects" chips under the stacks (45 .. 47.7)
  if (t > 45.0 && t < 47.75) {
    const hs = screen(w.hiroStack.group, [0, 14 * 0.33 + 0.5, 0]), ms = screen(w.myStack.group, [0, 1.2, 0]);
    const k1 = E.outBack(prog(t, 45.9, 46.15), 2) * (1 - prog(t, 47.6, 47.75)), k2 = E.outBack(prog(t, 46.2, 46.45), 2) * (1 - prog(t, 47.6, 47.75));
    O.tag(ctx, 'پروژه‌های هیرو: ' + O.faNum(14), clamp(hs[0], 260, W - 260), Math.max(560, hs[1] - 30), k1, { bg: '#B7791F', size: 34 });
    O.tag(ctx, 'پروژه‌های من: ' + O.faNum(2), clamp(ms[0], 260, W - 260), ms[1] - 30, k2, { bg: '#5A6390', size: 34 });
  }
  // whisper hearts (52.4 .. 53.8)
  if (t > 52.4 && t < 53.9) {
    for (let i = 0; i < 5; i++) {
      const ph = clamp((t - 52.4 - i * 0.18) / 1.2);
      if (ph <= 0 || ph >= 1) continue;
      O.heart(ctx, headC[0] + Math.sin(i * 2.3 + ph * 4) * 90 + (i - 2) * 40, headC[1] - 120 - ph * 380, 22 * (1 - ph * 0.4), `rgba(226,50,75,${1 - ph})`);
    }
  }
  // Sina's sharp eye: a glint (54.6)
  if (t > 54.5 && t < 55.4) {
    const k = bump(t, 54.75, 0.3);
    const e = screen(w.sina.parts.head, [-0.13, 0.37, 0.46]);
    O.sparkle(ctx, e[0], e[1], 110 * k, t * 4);
  }
  // the professional stamp (63.5 .. 64.5)
  if (t > 63.5 && t < 64.6) {
    const k = lerp(2.4, 1, E.outCubic(prog(t, 63.5, 63.65))) * (1 - E.inBack(prog(t, 64.3, 64.55)));
    const b = screen(w.lbrick.group, [0, 2.4, 0]);
    O.stamp(ctx, 'حرفه‌ای', b[0], b[1] - 40, k * 0.75, 0.1, { color: '#8A5A00', size: 110, fill: 'rgba(255,236,170,.92)' });
  }
  // sparkles on the brick flip and the cup clink
  for (const [t0, obj, off] of [[63.3, w.lbrick.group, [0, 1.2, 0]], [79.62, null, null]]) {
    if (t < t0 || t > t0 + 0.7) continue;
    let p;
    if (obj) p = screen(obj, off);
    else { const a = screen(w.claude.parts.handR, [0, 0.3, 0.3]), b = screen(w.sina.parts.handR, [0, 0.3, 0.3]); p = [(a[0] + b[0]) / 2, (a[1] + b[1]) / 2 - 30]; }
    const ph = prog(t, t0, t0 + 0.7);
    for (let i = 0; i < 7; i++) {
      const a = (i / 7) * TAU + 0.3, r = 60 + ph * 220;
      O.sparkle(ctx, p[0] + Math.cos(a) * r, p[1] + Math.sin(a) * r * 0.8, 34 * (1 - ph), ph * 3, i % 2 ? '#FFF6C8' : '#FFD27A');
    }
  }
  // work badges (69.0 .. 71.5): right to left
  {
    const badges = [['شهرداری', 'building', '#3D7DD8'], ['دامپزشکی', 'paw', '#2FB08A'], ['کلینیک', 'cross', '#E0478E']];
    badges.forEach(([txt, ic, col], i) => {
      const t0 = 69.0 + i * 0.45, k = E.outBack(prog(t, t0, t0 + 0.3), 2.2) * (1 - E.inBack(prog(t, 71.5, 71.75)));
      if (k <= 0) return;
      const x = W - 230 - i * 310, y = 300 + (i % 2) * 56 + 8 * Math.sin(t * 3 + i);
      O.tag(ctx, txt, x, y, k, { bg: col, size: 40, icon: ic, iconColor: '#FFFFFF' });
    });
  }
  // the deadpan beat: nothing but a tiny cricket chirp line
  if (t > 47.95 && t < 48.9) {
    const k = E.outCubic(prog(t, 48.1, 48.3)) * (1 - prog(t, 48.75, 48.9));
    O.bigText(ctx, '…', W - 180, 520, 90, 'rgba(255,255,255,.55)', k, 400);
  }

  // speech bubbles
  S.LINES.forEach((l, i) => {
    const end = lineEnd(i);
    if (t < l.t - 0.05 || t > end) return;
    const C = l.who === 'C';
    const mouth = C ? headC : headS, top = C ? topC : topS;
    O.bubble(ctx, l, SPEECH.get(l), t, [mouth[0], mouth[1]], top[1], end);
  });

  // end card (84.6 ..)
  if (t > 84.5) {
    const k = E.outBack(prog(t, 84.6, 85.0), 1.6);
    const k2 = E.outBack(prog(t, 85.2, 85.6), 1.8);
    ctx.save();
    ctx.globalAlpha = clamp(prog(t, 84.5, 84.8));
    const g = ctx.createLinearGradient(0, 0, 0, 900); g.addColorStop(0, 'rgba(244,235,221,.95)'); g.addColorStop(1, 'rgba(244,235,221,0)');
    ctx.fillStyle = g; ctx.fillRect(0, 0, W, 900);
    ctx.restore();
    O.bigText(ctx, 'سینا', W / 2 + 190, 470, 150, '#16161A', k, 900);
    O.bigText(ctx, '×', W / 2, 470, 110, '#D3121E', k, 700);
    O.bigText(ctx, 'کلاد', W / 2 - 190, 470, 150, '#C8623F', k, 900);
    O.bigText(ctx, 'یه نفر، پنج‌تا شغل، یه هوش مصنوعیِ خسته', W / 2, 640, 46, '#3A2F28', k2, 700);
    O.claudeSpark(ctx, W / 2 - 400, 400, 46 * k, '#D97757', t);
  }
}

// ---------------------------------------------------------------- sound hits
// [seconds, label, sfx, opts]; converted to beats (120 bpm, offset 0) for sfx.mjs
const HIT_S = [
  [0.05, 'sina leaps in', 'boing', { pitch: 260, to: 520, gain: 0.25 }], [0.6, 'sina lands', 'thud'],
  [3.9, 'claude freezes', 'pop', { pitch: 'E6' }], [4.2, 'processing', 'type', { len: 1.0 }], [5.3, '100%', 'bell', { pitch: 'A6' }],
  [7.75, 'claude hop', 'boing', { pitch: 300, to: 600, gain: 0.2 }],
  [8.6, 'riser rises', 'whoosh', { len: 0.5, from: 300, to: 1500 }], [9.1, 'riser lands', 'thud', { gain: 0.3 }],
  [9.0, 'clone 1', 'pop', { pitch: 'C6' }], [9.5, 'clone 2', 'pop', { pitch: 'D6' }], [10.0, 'clone 3', 'pop', { pitch: 'E6' }], [10.5, 'clone 4', 'pop', { pitch: 'G6' }],
  [10.9, 'tag 1', 'click'], [11.4, 'tag 2', 'click'], [11.9, 'tag 3', 'click'], [12.4, 'tag 4', 'click'],
  [14.2, 'clones vanish', 'pop', { pitch: 'G5', to: 'C5' }], [14.6, 'claude splits', 'pop', { pitch: 'C6' }], [14.68, 'split 2', 'pop', { pitch: 'E6' }], [14.76, 'split 3', 'pop', { pitch: 'G6' }],
  [15.8, 'clones crash', 'thud'], [15.82, 'crash boing', 'boing', { pitch: 400, to: 150 }], [16.75, 'clones poof', 'pop', { pitch: 'A5', to: 'D5' }],
  [17.6, 'f-14 flyby', 'whoosh', { len: 1.7, from: 250, to: 3200, gain: 0.45 }],
  [20.0, 'pill drops', 'whoosh', { len: 0.4, from: 2000, to: 500 }], [20.37, 'pill bounce', 'boing', { pitch: 220, to: 440 }], [20.9, 'pill bounce 2', 'boing', { pitch: 280, to: 500, gain: 0.18 }], [21.75, 'pill rolls', 'whoosh', { len: 0.8, from: 400, to: 1200, gain: 0.2 }],
  [22.3, 'zen', 'bell', { pitch: 'D6', verb: 0.8 }], [22.9, 'zen 2', 'bell', { pitch: 'A5', verb: 0.8, gain: 0.2 }],
  [24.45, 'claude drops', 'thud'], [25.0, '? 1', 'tok', { pitch: 'C6' }], [25.3, '? 2', 'tok', { pitch: 'E6' }], [25.6, '? 3', 'tok', { pitch: 'G6' }],
  [27.45, 'complaints stamp', 'impact'],
  [29.4, 'card 1', 'thud', { pitch: 140, gain: 0.25 }], [29.65, 'card 2', 'thud', { pitch: 150, gain: 0.25 }], [29.9, 'card 3', 'thud', { pitch: 160, gain: 0.25 }], [29.8, 'counter 3', 'pop', { pitch: 'E6' }],
  [31.95, 'card 4', 'click'], [32.15, 'card 5', 'click'], [32.35, 'card 6', 'click'], [32.55, 'card 7', 'click'], [32.2, 'counter +4', 'pop', { pitch: 'G6' }],
  [33.0, 'bonk', 'thud', { pitch: 300, to: 120 }], [32.95, 'counter +1', 'pop', { pitch: 'C7' }],
  [33.45, 'claude pops out', 'boing', { pitch: 200, to: 800 }], [33.6, 'grad cap', 'bell', { pitch: 'C6' }],
  [36.6, 'scroll unrolls', 'whoosh', { len: 2.4, from: 300, to: 900, gain: 0.3 }],
  [38.9, 'glitch', 'blip', { pitch: 'C7', gain: 0.3 }], [38.98, 'glitch b', 'blip', { pitch: 'F#6', gain: 0.3 }], [39.06, 'glitch c', 'click'],
  [40.0, 'scroll snaps shut', 'whoosh', { len: 0.4, from: 1200, to: 300 }],
  [42.8, 'hiro reveal', 'crash', { len: 2.5 }], [42.82, 'hiro sub', 'sub', { len: 1.4 }], [43.6, 'crown', 'bell', { pitch: 'E6', verb: 0.6 }],
  [44.9, 'tiles', 'coins'], [45.9, 'my tile 1', 'tok', { pitch: 'C5' }], [46.15, 'my tile 2', 'tok', { pitch: 'C5' }],
  [52.35, 'blush', 'blip', { pitch: 'E6' }], [52.5, 'blush 2', 'blip', { pitch: 'G6' }],
  [53.6, 'into praise', 'swell', { len: 1.2 }], [54.75, 'glint', 'bell', { pitch: 'C7' }],
  [59.1, 'claude jumps', 'boing', { pitch: 300, to: 900 }], [59.3, 'confetti', 'crash', { len: 1.4, gain: 0.2 }], [59.32, 'confetti coins', 'coins'],
  [61.4, 'mistake brick', 'pop', { pitch: 'C6' }], [63.0, 'brick flips', 'whoosh', { len: 0.5, from: 500, to: 2500 }], [63.3, 'rule!', 'bell', { pitch: 'G6' }], [63.5, 'professional stamp', 'thud'],
  [65.3, 'tomato', 'pop', { pitch: 'D6' }],
  ...Array.from({ length: 8 }, (_, i) => [65.7 + i * 0.25, `tick ${i}`, 'tick']),
  ...Array.from({ length: 9 }, (_, i) => [66.0 + i * 0.08, `clip ${i}`, 'click', { gain: 0.18 }]),
  [69.0, 'badge 1', 'pop', { pitch: 'E6' }], [69.45, 'badge 2', 'pop', { pitch: 'G6' }], [69.9, 'badge 3', 'pop', { pitch: 'B6' }],
  [73.35, 'frame', 'pop', { pitch: 'A5' }], [73.5, 'frame ding', 'bell', { pitch: 'E6' }],
  [76.0, 'cup 1', 'pop', { pitch: 'D6' }], [76.1, 'cup 2', 'pop', { pitch: 'F6' }], [79.62, 'clink', 'bell', { pitch: 'A6', verb: 0.5 }], [79.64, 'clink 2', 'bell', { pitch: 'E7', gain: 0.18 }],
  [81.6, 'new scroll', 'whoosh', { len: 1.1, from: 300, to: 1400 }], [82.2, 'shock', 'blip', { pitch: 'A6' }],
  [82.75, 'faint', 'whoosh', { len: 0.55, from: 1500, to: 200 }], [83.25, 'thud floor', 'thud'], [83.3, 'spark pops', 'boing', { pitch: 300, to: 1100 }],
  [83.92, 'spark bounce', 'tok', { pitch: 'G5' }], [84.5, 'spark bounce 2', 'tok', { pitch: 'G5', gain: 0.15 }],
  [84.6, 'end card', 'bell', { pitch: 'F6', verb: 0.5 }], [85.4, 'thumb', 'pop', { pitch: 'C6' }],
];
const HITS = HIT_S.map(([t, l, s, o]) => [+(t * 2).toFixed(3), l, s, o]);

// ---------------------------------------------------------------- film
M.film({
  hits: HITS,
  fonts: ['800 58px Vazir', '900 120px Vazir', '700 40px Vazir', '400 40px Vazir'],
  images: { portrait: 'assets/ref_portrait.png' },
  samples: 1,
  async init(ctx, IMG) {
    await G.initGL({ exposure: 1.0, scale: Number(new URLSearchParams(location.search).get('gls') || 0.85) });
    SET = build(IMG);
  },
  draw(ctx, u, t) {
    const mw = O.moodWeights(S.MOOD, t);
    const pedX = W / 2;
    O.background(ctx, mw, t, pedX);
    SET.update(t);
    G.renderSet(ctx, { scene: SET.scene, camera: SET.camera, update() {} }, t, u, {});
    O.vignette(ctx, mw);
    overlays(ctx, t);
  },
});
