// Sina x Claude: a brick-film conversation. Pure function of time: window.seek(t) paints frame t.
// script.js holds the acting, timed from the voice (cues.json); this file builds the set and plays it.
import * as M from './lib/motion.js';
import * as G from './lib/gl.js';
import * as L from './sets/lego.js';
import * as PR from './sets/props.js';
import { drawFace } from './sets/faces.js';
import * as S from './script.js';
import * as O from './overlay.js';

const THREE = G.THREE;
const { W, H, E, clamp, lerp, prog, hash01, noise1, wobble, bump } = M;
const TAU = Math.PI * 2;
const { T, TE, W: Wd, CUE } = S;
const DUR = S.DURATION;

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
const sortT = (tr) => [...tr].sort((a, b) => a[0] - b[0]);
const poseOf = (name) => ({ ...L.REST, ...(S.POSES[name] || {}) });
const POSE_TRACK = { C: sortT(S.POSE_C).map(([t, n, d]) => [t, poseOf(n), d]), S: sortT(S.POSE_S).map(([t, n, d]) => [t, poseOf(n), d]) };
const F0 = { open: 1, lookX: 0, lookY: 0, brow: 0, browY: 0, blush: 0, tear: 0 };
const faceOf = (n) => { const e = S.EXPR[n]; const o = { ...F0 }; for (const k in e) if (typeof e[k] === 'number') o[k] = e[k]; return o; };
const EXPR_TRACK = { C: sortT(S.EXPR_C), S: sortT(S.EXPR_S) };
const EXPR_NUM = { C: EXPR_TRACK.C.map(([t, n]) => [t, faceOf(n), 0.14, 'out']), S: EXPR_TRACK.S.map(([t, n]) => [t, faceOf(n), 0.14, 'out']) };
const LOOK = { C: sortT(S.LOOK_C), S: sortT(S.LOOK_S) }, ROOT = { C: sortT(S.ROOT_C), S: sortT(S.ROOT_S) };
const CAMK = sortT(S.CAM).map(([tt, p, g, d, e]) => [tt, [...p, ...g], d, e]);

// speech from the real takes: display words on their spoken onsets; the mouth follows the loudness
const SPEECH = new Map(S.LINES.map((l) => {
  const c = CUE.lines[l.id], disp = l.text.split(/\s+/).filter(Boolean), n = disp.length, m = c.words.length;
  const words = disp.map((text, i) => ({ text, t: m === n ? c.words[i] : c.t0 + (c.t1 - c.t0) * (i / n) }));
  return [l, { words, end: c.t1 }];
}));
function mouth(who, t) {
  const e = CUE.env[who], i = Math.round(t * 100);
  return { open: Math.min(1, (e[i] || 0) * 1.15), vis: 0.85 + 0.15 * ((i >> 3) % 3) };
}
const talkingAt = (who, t) => S.LINES.some((l) => l.who === who && t > l.t && t < SPEECH.get(l).end);

function exprIndex(who, t) { const tr = EXPR_TRACK[who]; let i = 0; while (i + 1 < tr.length && tr[i + 1][0] <= t) i++; return i; }
const exprName = (who, t) => EXPR_TRACK[who][exprIndex(who, t)][1];
function exprAt(who, t) {
  const tr = EXPR_TRACK[who], i = exprIndex(who, t);
  const e = S.EXPR[tr[i][1]];
  const F = chain(EXPR_NUM[who], t, lerpObj, 'out', 0.14);
  F.eyes = e.eyes; F.mouth = e.mouth;
  // a blink hides every face swap, plus natural blinks every few seconds
  let open = t - tr[i][0] < 0.07 && i > 0 ? 0.05 : 1;
  const per = 3.3, k = Math.floor(t / per), off = hash01(k, who === 'C' ? 4 : 9) * 1.6;
  if (t - k * per - off >= 0 && t - k * per - off < 0.11) open = 0.05;
  F.open = (F.open ?? 1) * open;
  return F;
}
function hopAt(hops, t) {
  let y = 0, sq = 0;
  for (const [t0, h, d] of hops) {
    if (d > 0 && t >= t0 && t < t0 + d) { const p = (t - t0) / d; y += h * 4 * p * (1 - p); sq -= 0.06 * Math.sin(Math.PI * p); }
    if (t >= t0 + d && t < t0 + d + 0.6) sq += 0.09 * wobble(t - t0 - d, 3, 7) * Math.min(1, h * 2 + 0.3);
  }
  return { y, sq };
}
// Claude's spark spins faster in his big moments (closed form, so it stays a pure function of time)
const SPIN = [[TE('ask'), T('sure'), 14], [Wd('ten', 7), TE('ten'), 9], [T('jobs2'), TE('jobs2'), -10], [Wd('jobs3', 3), Wd('jobs3', 5), 6],
  [T('job'), Wd('job', 6), 16], [T('uni', -0.35), T('uni', 0.2), 20], [T('doom'), TE('doom'), 16], [Wd('yay', 4), TE('yay'), 18],
  [Wd('once', 8), TE('once'), 12], [Wd('tired', 5), TE('tired'), 10]];
const sparkAngle = (t) => SPIN.reduce((a, [t0, t1, r]) => a + r * clamp(t - t0, 0, t1 - t0), t * 0.6);

// key moments
const FAINT = Wd('new', 4, 0.2);            // Claude starts to fall
const POP = FAINT + 0.6;                     // the spark pops off as he lands
const RANT_OUT = Wd('job', 6);               // the ten Sinas vanish

// ---------------------------------------------------------------- the set
let SET = null, W3 = null;
const CLONE_POS = [[2.6, -3.7, 1.7], [1.3, -3.7, 1.7], [0, -3.7, 1.7], [-1.3, -3.7, 1.7], [-2.6, -3.7, 1.7],
  [2.95, -2.35, 0.85], [1.75, -2.35, 0.85], [0, -2.35, 0.85], [-1.75, -2.35, 0.85], [-2.95, -2.35, 0.85]];
const CLONE_FACES = ['proud', 'happy', 'smug', 'curious', 'happy', 'joy', 'proud', 'starry', 'curious', 'calm'];

function build(IMG) {
  const scene = new THREE.Scene();
  const cam = G.camera(30, 0.1, 200);
  const key = new THREE.DirectionalLight(0xfff1e2, 3.0);
  key.position.set(-6, 12, 9); key.castShadow = true;
  key.shadow.mapSize.set(2048, 2048);
  Object.assign(key.shadow.camera, { left: -10, right: 10, top: 10, bottom: -10, near: 1, far: 50 });
  key.shadow.camera.updateProjectionMatrix(); key.shadow.bias = -0.0004; key.shadow.normalBias = 0.02;
  scene.add(key);
  const rim = new THREE.DirectionalLight(0xffd8c4, 1.3); rim.position.set(6, 6, -8); scene.add(rim);
  const hemi = new THREE.HemisphereLight(0xffffff, 0x3a2a20, 0.55); scene.add(hemi);
  const spot = new THREE.SpotLight(0xfff0d0, 0, 40, 0.42, 0.5, 0);
  spot.position.set(0, 16, 2); spot.castShadow = false;
  scene.add(spot); scene.add(spot.target);
  scene.add(L.baseplate(40, 40, '#DCC7A0'));

  const claude = L.minifig('claude'), sina = L.minifig('sina');
  scene.add(claude.root, sina.root);

  // Sina's marks: his portrait on a brick billboard, and a name stand in front of each of them
  const poster = PR.posterBoard(IMG.portrait); poster.position.set(3.35, 0, -5.2); poster.rotation.y = -0.3; scene.add(poster);
  const standS = PR.nameStand('سینا', '#D3121E', '#FFFFFF'); standS.position.set(S.SX + 0.1, 0, 1.25); standS.rotation.y = -0.15; scene.add(standS);
  const standC = PR.nameStand('کلاد', '#C8623F', '#FFF8EE'); standC.position.set(S.CX - 0.1, 0, 1.25); standC.rotation.y = 0.15; scene.add(standC);

  // the ten Sinas, on two risers
  const risers = [L.brick(16, 3, '#5E6A7A', { h: 1.7 }), L.brick(18, 3, '#6E7B8C', { h: 0.85 })];
  risers[0].position.set(0, -2, -3.7); risers[1].position.set(0, -1, -2.35);
  risers.forEach((r) => scene.add(r));
  const propFor = [() => PR.clapper(), () => ({ group: PR.pencil() }), () => ({ group: PR.keyframe() }), () => ({ group: PR.laptop() }),
    null, null, () => ({ group: PR.megaphone() }), () => { const j = PR.jet(); j.scale.setScalar(0.16); return { group: j }; },
    () => { const c = PR.capsule(); c.scale.setScalar(0.32); return { group: c }; }, () => ({ group: PR.pencil() })];
  const sClones = CLONE_POS.map((p, i) => {
    const f = L.minifig('sina');
    const n = CLONE_FACES[i];
    f.faceTex.draw((c) => drawFace(c, 'sina', { ...faceOf(n), eyes: S.EXPR[n].eyes, mouth: S.EXPR[n].mouth }, 0));
    if (propFor[i]) { f.prop = propFor[i](); f.parts.handR.add(f.prop.group); }
    scene.add(f.root);
    return f;
  });
  const placeProp = (i, pos, rot = [0, 0, 0], s = 1) => { const g = sClones[i].prop.group; g.position.set(...pos); g.rotation.set(...rot); if (s !== 1) g.scale.multiplyScalar(s); };
  placeProp(0, [0, 0.1, 0.45], [0, 0, 0], 0.8); placeProp(1, [0, 0.3, 0.25], [0.4, 0, 0]); placeProp(2, [0, 0.45, 0.3]);
  placeProp(3, [-0.1, -0.05, 0.6], [-0.9, 0, 0], 0.85); placeProp(6, [0, 0.15, 0.45], [0.3, 0, 0]); placeProp(7, [0, 0.3, 0.35], [0, Math.PI / 2, 0.3]);
  placeProp(8, [0, 0.2, 0.3]); placeProp(9, [0, 0.3, 0.25], [0.4, 0, 0.3]);
  const cClones = [0, 1, 2].map(() => { const f = L.minifig('claude'); scene.add(f.root); return f; });

  // props
  const jet = PR.jet(); jet.scale.setScalar(0.8); scene.add(jet);
  const pill = PR.capsule(); pill.scale.setScalar(0.9); scene.add(pill);
  const cards = Array.from({ length: 8 }, (_, i) => { const c = PR.refCard(i); scene.add(c); return c; });
  const cap = PR.gradCap(); claude.parts.headTop.add(cap);
  const scroll = PR.scroll(); scene.add(scroll.group);
  const ped = PR.pedestal(); ped.group.position.set(0, -6, -2.8); scene.add(ped.group);
  const hiroStack = PR.tileStack(14, 0); hiroStack.group.position.set(1.85, 0, -2.6); scene.add(hiroStack.group);
  const myStack = PR.tileStack(2, 3); myStack.group.position.set(-1.75, 0, 1.7); myStack.group.scale.setScalar(0.8); scene.add(myStack.group);
  const lbrick = PR.labelBrick(); scene.add(lbrick.group);
  const tom = PR.tomato(); tom.group.position.set(1.85, 0, 2.4); scene.add(tom.group);
  const tl = PR.timeline(); tl.group.position.set(-0.5, 0, 2.2); scene.add(tl.group);
  const frame = PR.frameWithPhoto(IMG.portrait); scene.add(frame);
  const cupC = PR.cup(), cupS = PR.cup(), cupFly = PR.cup();
  claude.parts.handR.add(cupC); sina.parts.handR.add(cupS); scene.add(cupFly);
  const conf = PR.confetti(110); scene.add(conf.mesh);
  const puffs = PR.puffs(12); scene.add(puffs.group);
  const poofs = PR.puffs(10); scene.add(poofs.group);
  const scroll2 = PR.scroll('new'); scene.add(scroll2.group);
  const looseSpark = new THREE.Mesh(L.sparkGeometry(0.32), L.plastic('#D97757')); looseSpark.castShadow = true; scene.add(looseSpark);

  W3 = { scene, cam, key, rim, hemi, spot, claude, sina, poster, standS, standC, risers, sClones, cClones, jet, pill, cards, cap, scroll, ped, hiroStack, myStack, lbrick, tom, tl, frame, cupC, cupS, cupFly, conf, puffs, poofs, scroll2, looseSpark };
  return { scene, camera: cam, update };
}

// ---------------------------------------------------------------- per-frame
function scaleIn(o, t, t0, t1 = 1e9, d = 0.3, s = 1) {
  const k = Math.min(E.outBack(prog(t, t0, t0 + d), 2.2), 1 - E.inBack(prog(t, t1, t1 + d * 0.6), 1.5));
  o.visible = k > 0.001; o.scale.setScalar(Math.max(0.001, k) * s);
  return k;
}

function actor(fig, who, t) {
  const tq = Math.floor(t * 12) / 12;                // on twos at 24 fps: the brick-film cadence
  const pose = chain(POSE_TRACK[who], tq, lerpObj, 'back', 0.25);
  const look = chain(LOOK[who], tq, lerpArr, 'out', 0.25);
  const root = chain(ROOT[who], tq, lerpArr, 'out', 0.3);
  const rootPrev = chain(ROOT[who], tq - 0.07, lerpArr, 'out', 0.3);
  const speed = Math.hypot(root[0] - rootPrev[0], root[1] - rootPrev[1]) / 0.07;
  const hop = hopAt(who === 'C' ? S.HOPS_C : S.HOPS_S, tq);
  let y = hop.y;
  if (who === 'C') for (const [a, b, h] of S.FLOAT_C) {
    const k = E.outCubic(prog(tq, a, a + 0.5)) * (1 - E.inCubic(prog(tq, b - 0.15, b)));
    y += k * (h + 0.08 * Math.sin(tq * 3));
  }
  const m = mouth(who, tq);
  const q = { ...pose };
  q.headY += look[0]; q.headX += look[1];
  if (talkingAt(who, tq)) {
    q.headX += 0.05 * m.open - 0.02;
    q.armR += 0.1 * Math.sin(tq * 9.0) * (pose.armR > 0.5 && pose.armR < 2 ? 1 : 0);
    q.armL += 0.08 * Math.sin(tq * 7.0 + 1) * (pose.armL > 0.5 && pose.armL < 2 ? 1 : 0);
  }
  if (speed > 0.3) { const sw = Math.min(0.7, speed * 0.25) * Math.sin(tq * 22); q.legR += sw; q.legL -= sw; q.armR -= sw * 0.7; q.armL += sw * 0.7; }
  q.side = (q.side || 0) + 0.02 * Math.sin(tq * 1.7 + (who === 'C' ? 0 : 2));
  L.applyPose(fig, q);
  fig.root.position.set(root[0], y, root[1]);
  fig.root.rotation.y = root[2];
  fig.body.scale.set(1 - hop.sq * 0.5, 1 + hop.sq, 1 - hop.sq * 0.5);
  const F = exprAt(who, tq);
  F.talk = m.open; F.vis = m.vis;
  fig.faceTex.draw((c) => drawFace(c, fig.who, F, tq));
}

// constants of the film computed once from the rig: where the spark and the cup are when Claude faints
let SPARK0 = null, CUP0 = null;
function faintStart() {
  if (SPARK0) return;
  actor(W3.claude, 'C', POP); W3.claude.root.updateMatrixWorld(true);
  const p = new THREE.Vector3(); W3.claude.parts.spark.getWorldPosition(p); SPARK0 = [p.x, p.y, p.z];
  actor(W3.claude, 'C', FAINT); W3.claude.root.updateMatrixWorld(true);
  W3.claude.parts.handR.getWorldPosition(p); CUP0 = [p.x, p.y, p.z];
}

function update(t) {
  const w = W3, tq = Math.floor(t * 12) / 12;
  if (t >= FAINT) faintStart();
  actor(w.claude, 'C', t);
  actor(w.sina, 'S', t);

  // Claude's spark: spins, glows when happy, droops when sad; rides up through the grad cap
  const sp = w.claude.parts.spark, en = exprName('C', tq);
  sp.rotation.set(['sad', 'cry', 'deadpan', 'ko'].includes(en) ? 0.9 : 0, 0, sparkAngle(tq));
  const capK = Math.max(0, Math.min(E.outBack(prog(t, T('uni', -0.2), T('uni', 0.1)), 2.2), 1 - E.inBack(prog(t, T('rules', -0.4), T('rules', -0.22)), 1.5)));
  sp.position.y = L.STUD_H + 0.3 + 0.22 * capK;
  w.claude.parts.sparkMesh.material.emissiveIntensity = ['love', 'joy', 'starry', 'shy'].includes(en) ? 0.6 : 0;
  sp.visible = t < POP;

  // camera
  let [px, py, pz, gx, gy, gz] = chain(CAMK, t, lerpArr, 'io', 0.6);
  for (const [t0, amp, dec] of S.SHAKES) {
    if (t < t0 || t > t0 + dec * 4) continue;
    const k = amp * Math.exp(-(t - t0) / dec);
    px += k * noise1(t * 40, 3); py += k * noise1(t * 40, 7);
  }
  px += 0.03 * noise1(t * 0.7, 21); py += 0.025 * noise1(t * 0.6, 22);
  G.lookFrom(w.cam, [px, py, pz], [gx, gy, gz]);

  // lights by mood
  const mw = O.moodWeights(S.MOOD, t);
  const mv = (k) => { let s = 0; for (const m in mw) s += (LIGHT[m][k] ?? LIGHT.studio[k]) * mw[m]; return s; };
  w.key.intensity = mv('key'); w.hemi.intensity = mv('hemi'); w.rim.intensity = mv('rim');
  w.key.color.setRGB(mv('kr'), mv('kg'), mv('kb'));
  w.spot.intensity = mv('spot'); w.spot.visible = w.spot.intensity > 0.01; w.rim.visible = w.rim.intensity > 0.01;
  const onClaude = t > TE('hiro2') && t < T('eye');
  w.spot.target.position.set(onClaude ? S.CX : 0, 0, onClaude ? 0 : -2.8);
  w.spot.position.set(onClaude ? S.CX : 0, 16, onClaude ? 3 : 1);

  events(t, tq);
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

// ---------------------------------------------------------------- props and events
function events(t, tq) {
  const w = W3;
  // name stands: the opening only (the end card names them both)
  for (const st of [w.standS, w.standC]) {
    const k = scaleIn(st, t, 0.15, T('jobs1', -0.3), 0.3);
    st.visible = k > 0.001; st.scale.setScalar(Math.max(0.001, k) * 0.55);
  }

  // --- the ten Sinas: the risers come up on "ten", each Sina pops on his role, all go on "I still..."
  const rk = E.outBack(prog(t, Wd('ten', 7, -0.3), Wd('ten', 7, 0.25)), 1.6) * (1 - E.inCubic(prog(t, RANT_OUT, RANT_OUT + 0.5)));
  w.risers[0].position.y = -2 + 2 * rk; w.risers[1].position.y = -1 + 1 * rk;
  w.risers.forEach((r) => { r.visible = rk > 0.001; });
  w.sClones.forEach((f, i) => {
    const t0 = S.ROLES[i].t, k = scaleIn(f.root, t, t0, RANT_OUT + i * 0.03, 0.3);
    if (k <= 0) return;
    const [x, z, h] = CLONE_POS[i];
    f.root.position.set(x, h * rk + 0.17 + 0.7 * Math.max(0, Math.sin(Math.PI * prog(t, t0, t0 + 0.35))), z);
    f.root.rotation.y = -x * 0.07;
    const beat = Math.max(0, Math.sin(tq * 8 + i));
    const act = [
      { armR: 1.4 + 0.25 * beat, armL: 1.2, outL: -0.2 }, { armR: 1.7 + 0.2 * Math.sin(tq * 6), outR: 0.1 },
      { armR: 2.6, outR: 0.25, armL: 0.3 }, { armR: 1.1, armL: 1.1, outR: -0.12, outL: -0.12, headX: 0.25 },
      { armR: 0.9 + 0.3 * beat, armL: 0.9, outR: 0.3, outL: 0.3 }, { armR: 2.4, outR: 0.4, armL: 0.6, headZ: 0.15 },
      { armR: 1.5, outR: 0.05, armL: 1.0 + 0.4 * beat }, { armR: 2.2, outR: 0.3, armL: 2.2, outL: 0.3 },
      { armR: 1.3, outR: 0.0, armL: 0.3 }, { armR: 1.1, outR: 0.6, armL: 1.1, outL: 0.6, headX: -0.1 },
    ][i];
    L.applyPose(f, { ...L.REST, ...act, headY: Math.sin(tq * 2 + i) * 0.15 });
    if (i === 0) f.prop.arm.rotation.z = 0.5 * beat;
    if (i === 2) f.prop.group.rotation.y = tq * 3;
  });
  // poof puffs where the Sinas vanish
  {
    const on = t > RANT_OUT && t < RANT_OUT + 0.7;
    w.poofs.group.visible = on;
    if (on) {
      const ph = prog(t, RANT_OUT, RANT_OUT + 0.7);
      w.poofs.list.forEach((s, i) => { const [x, z, h] = CLONE_POS[i]; s.position.set(x, h + 2.2 + ph * 0.6, z); s.scale.setScalar(1.5 + ph * 3); s.material.opacity = 0.85 * (1 - ph); });
    }
  }
  // Claude splits into three on "ten wishes, ten styles", they collide on "I still..."
  {
    const c0 = T('job', 0.05), crash = Wd('job', 6, -0.15), gone = TE('job', 0.1);
    w.cClones.forEach((f, i) => {
      const k = scaleIn(f.root, t, c0 + i * 0.08, gone, 0.25);
      if (k <= 0) return;
      const run = clamp((tq - c0) / (crash - c0)), a0 = (i / 3) * TAU + 0.6, hit = tq > crash;
      const ang = a0 + run * 7;
      // the circle is wide enough that no clone passes through Claude; on the crash they stop dead, bounce and go dizzy
      const r = 1.9;
      f.root.position.set(S.CX + Math.cos(ang) * r, hit && tq < crash + 0.3 ? 0.25 * Math.sin(Math.PI * prog(tq, crash, crash + 0.3)) : 0, Math.sin(ang) * r * 0.62 + 0.3);
      f.root.rotation.y = hit ? -ang + Math.PI * 0.6 : -ang;
      const sw = hit ? 0 : 0.7 * Math.sin(tq * 24 + i);
      L.applyPose(f, { ...L.REST, legR: sw, legL: -sw, armR: 1.0 - sw, armL: 1.0 + sw, lean: hit ? -0.1 : 0.25, bodyZ: hit ? 0.25 * Math.sin(tq * 14 + i) : 0 });
      f.faceTex.draw((c) => drawFace(c, 'claude', { ...F0, eyes: hit ? 'spiral' : 'open', mouth: hit ? 'wavy' : 'grin', brow: hit ? -0.6 : 0.4, browY: 0.3 }, tq + i));
      f.parts.spark.rotation.z = sparkAngle(tq) * (1 + i * 0.3);
    });
  }
  // the F-14 crosses behind on "F-14 Tomcat"
  {
    const a = Wd('jobs3', 2, -0.3), p = prog(t, a, a + 1.9);
    w.jet.visible = p > 0 && p < 1;
    w.jet.position.set(lerp(11, -12, p), 6.7 - 0.4 * Math.sin(Math.PI * p), -7.5 + 1.0 * Math.sin(Math.PI * p));
    w.jet.rotation.set(0.15 * Math.sin(p * 6) - 0.45, Math.PI + 0.25, 0.1);
  }
  // the capsule lands on "absorption", bounces, rolls off
  {
    const land = Wd('jobs3', 6, -0.05), t0 = land - 0.42;
    w.pill.visible = t > t0 && t < Wd('jobs3', 8, 0.4);
    if (w.pill.visible) {
      const tt = t - t0;
      let y = tt < 0.42 ? 7.5 - 0.5 * 40 * tt * tt : Math.abs(Math.sin((tt - 0.42) * 6)) * 1.2 * Math.exp(-(tt - 0.42) * 2.2);
      const roll = E.inCubic(prog(t, Wd('jobs3', 8, -0.4), Wd('jobs3', 8, 0.4)));
      w.pill.position.set(S.CX + 1.15 + roll * 7, Math.max(0, y) + 0.45, 1.0);
      w.pill.rotation.set(0, 0.4, -roll * 10 + (tt < 0.42 ? tt * 4 : 0));
    }
  }
  // reference tiles: three on "three", four on his head on "four more", one more on "one more"
  {
    const d3 = Wd('refs', 4), d4 = Wd('refs', 5), d1 = Wd('refs', 7), out = T('uni', -0.35);
    const drops = [[d3 - 0.5, -2.6, 0.9, 0], [d3 - 0.38, -0.5, 1.2, 0], [d3 - 0.26, -1.9, 1.7, 0],
      [d4 - 0.45, -1.35, 0.15, 1], [d4 - 0.33, -1.35, 0.15, 2], [d4 - 0.21, -1.35, 0.15, 3], [d4 - 0.09, -1.35, 0.15, 4], [d1 - 0.35, -1.35, 0.15, 5]];
    const top = 4.0 - 1.2 * E.outCubic(prog(t, d4 - 0.3, d4)) - 0.5 * E.outCubic(prog(t, d1 - 0.05, d1 + 0.1)) + 1.7 * E.outBack(prog(t, out, out + 0.25));
    w.cards.forEach((c, i) => {
      const [t0, x, z, idx] = drops[i];
      c.visible = t > t0 && t < out + 1.1;
      if (!c.visible) return;
      const fall = clamp((t - t0) / 0.45);
      let y = lerp(9, idx === 0 ? 0.06 : Math.max(0.06, top - 0.2) + idx * 0.13, E.inQuad(fall));
      let x2 = x, z2 = z, ry = i * 0.7, rx = (1 - fall) * 3;
      const sc = prog(t, out, out + 0.95);
      if (sc > 0) { const dir = (i * 2.399) % TAU; x2 += Math.cos(dir) * sc * 4; z2 += Math.sin(dir) * sc * 2.5 + sc; y += 3.5 * sc - 6 * sc * sc; rx += sc * 8; ry += sc * 5; }
      c.position.set(x2, y, z2); c.rotation.set(rx, ry, idx ? Math.sin(i) * 0.15 : 0);
    });
    if (t > d4 - 0.3 && t < out) {
      const sq = 0.18 * E.outCubic(prog(t, d4 - 0.3, d4)) + 0.14 * E.outCubic(prog(t, d1 - 0.05, d1 + 0.1));
      w.claude.body.scale.set(1 + sq * 0.6, 1 - sq, 1 + sq * 0.6);
    }
  }
  // graduation cap, the spark poking through
  if (scaleIn(w.cap, t, T('uni', -0.2), T('rules', -0.4), 0.25) > 0) { w.cap.position.y = 0.02; w.cap.rotation.y = 0.3; }
  // the rules scroll: unrolls on "your rules", each rule lights up as it is read, the first one glitches
  {
    const vis = t > T('rules', 0.05) && t < T('doom', 0.15);
    w.scroll.group.visible = vis;
    if (vis) {
      const unroll = E.outCubic(prog(t, T('rules', 0.25), T('rulesRead', 0.2)));
      const fold = E.inCubic(prog(t, T('doom', -0.3), T('doom', 0.1)));
      w.scroll.layout(S.CX, 3.55 * (1 - fold) + 0.05, 0.85, unroll * 5.4 * (1 - fold));
      const reads = [Wd('rulesRead', 0), Wd('rulesRead', 2), Wd('rulesRead', 4), Wd('rulesRead', 6)];
      let hl = -1; reads.forEach((r, i) => { if (t >= r - 0.05) hl = i; });
      if (t > TE('rulesRead', 0.2)) hl = -1;
      const g0 = Wd('rulesRead', 0, 0.05), glitch = t > g0 && t < g0 + 0.25 ? 1 : 0;
      const want = glitch ? `g${Math.floor(t * 24)}` : `h${hl}`;
      if (w.scroll.state !== want) { w.scroll.paint(glitch, Math.floor(t * 24), hl); w.scroll.state = want; }
    }
  }
  // steam out of Claude's head on "I'm doomed"
  {
    const on = t > T('doom') && t < TE('doom', 0.4);
    w.puffs.group.visible = on;
    if (on) {
      const head = new THREE.Vector3(); w.claude.parts.headTop.getWorldPosition(head);
      w.puffs.list.forEach((s, i) => {
        const ph = ((t - T('doom')) / 0.6 + i / w.puffs.list.length) % 1, side = i % 2 ? 1 : -1;
        s.position.set(head.x + side * (0.35 + ph * 0.8), head.y - 0.2 + ph * 1.6, head.z + 0.1);
        s.scale.setScalar(0.4 + ph * 1.4); s.material.opacity = 0.9 * (1 - ph);
      });
    }
  }
  // Hiro's shrine
  {
    const up = E.outBack(prog(t, T('hiro', -0.45), T('hiro', 0.45)), 1.2) * (1 - E.inCubic(prog(t, T('eye', -0.3), T('eye', 0.5))));
    w.ped.group.position.y = -6 + 6 * up; w.ped.group.visible = up > 0.001;
    w.ped.crown.rotation.y = t * 1.2;
    w.ped.crown.position.y = 2.4 + L.PLATE + 2.75 + 0.08 * Math.sin(t * 3);
    const h0 = Wd('hiro2', 2), m0 = Wd('hiro2', 4, 0.1), gone = TE('hiro2', 0.05);
    w.hiroStack.tiles.forEach((tile, i) => { const k = scaleIn(tile, t, h0 + i * 0.06, gone, 0.18); if (k > 0) tile.position.y = i * (L.PLATE + 0.005) + (1 - k) * 0.5; });
    w.myStack.tiles.forEach((tile, i) => { const k = scaleIn(tile, t, m0 + i * 0.25, gone, 0.2); if (k > 0) tile.position.y = i * (L.PLATE + 0.005); });
  }
  // confetti on "it really is good"
  w.conf.at(t - Wd('yay', 4, 0.25), [0, 2.6, 0.8]);
  w.conf.mesh.visible = t > Wd('yay', 4, 0.25) && t < Wd('yay', 4, 3.7);
  // the mistake brick flips into a rule brick
  if (scaleIn(w.lbrick.group, t, T('once', 0.1), TE('once', 0.5), 0.35) > 0) {
    const f0 = Wd('once', 7, -0.1), flip = E.outBack(prog(t, f0, f0 + 0.55), 1.6);
    w.lbrick.group.position.set(0, 1.4 + 0.12 * Math.sin(t * 2.4) + 0.7 * Math.sin(Math.PI * prog(t, f0, f0 + 0.55)), 1.4);
    w.lbrick.group.rotation.set(0.15, -0.25 + flip * Math.PI, 0);
  }
  // his tools: the tomato timer and the brick timeline
  {
    const a = T('tools', -0.05), b = T('iran', 0.3);
    if (scaleIn(w.tom.group, t, a, b, 0.35) > 0) {
      const ang = -prog(t, a + 0.2, b) * TAU * 0.9;
      w.tom.dialTex.draw((c, W_, H_) => {
        c.translate(W_ / 2, H_ / 2);
        c.fillStyle = '#FFF6EA'; c.beginPath(); c.arc(0, 0, 118, 0, TAU); c.fill();
        c.fillStyle = 'rgba(224,54,44,.85)'; c.beginPath(); c.moveTo(0, 0); c.arc(0, 0, 110, -Math.PI / 2, -Math.PI / 2 + ang, true); c.closePath(); c.fill();
        c.strokeStyle = '#3A2A20'; c.lineWidth = 6; for (let i = 0; i < 12; i++) { const a2 = (i / 12) * TAU; c.beginPath(); c.moveTo(Math.cos(a2) * 96, Math.sin(a2) * 96); c.lineTo(Math.cos(a2) * 112, Math.sin(a2) * 112); c.stroke(); }
        c.fillStyle = '#3A2A20'; c.font = `900 54px ${O.FA}`; c.textAlign = 'center'; c.textBaseline = 'middle'; c.fillText(O.faNum(25), 0, 4);
      });
      w.tom.group.rotation.y = -0.5 + 0.08 * Math.sin(t * 20) * (1 - prog(t, a, a + 0.5));
    }
    const kt = scaleIn(w.tl.group, t, a + 0.25, b, 0.3, 0.42);
    if (kt > 0) {
      w.tl.clips.forEach((c, i) => { const ki = E.outBack(prog(t, a + 0.35 + i * 0.07, a + 0.6 + i * 0.07), 2); c.visible = ki > 0.01; c.scale.set(1, Math.max(0.01, ki), 1); });
      w.tl.head.position.x = lerp(-4.6, 4.6, prog(t, a + 1.0, b));
    }
  }
  // the framed portrait, held at the chest so his face stays in view
  if (scaleIn(w.frame, t, T('photo', -0.1), TE('photo', 0.3), 0.3) > 0) {
    const a = new THREE.Vector3(), b = new THREE.Vector3();
    w.claude.parts.handR.getWorldPosition(a); w.claude.parts.handL.getWorldPosition(b);
    w.frame.position.set((a.x + b.x) / 2, (a.y + b.y) / 2 - 0.12, (a.z + b.z) / 2 + 0.3);
    w.frame.rotation.set(-0.05, w.claude.root.rotation.y * 0.6, 0.04 * Math.sin(t * 3));
  }
  // coffee: in hand for the toast, Claude's cup flies off when he faints
  {
    scaleIn(w.cupC, t, T('tired', -0.3), FAINT, 0.25);
    // Sina puts his cup away to hold up the new rule, and has it back once the rule has dropped
    const back = Wd('new', 4, 0.7);
    if (t < back) scaleIn(w.cupS, t, T('tired', -0.2), Wd('new', 1, -0.3), 0.25); else scaleIn(w.cupS, t, back, 1e9, 0.25);
    for (const c of [w.cupC, w.cupS]) { c.position.set(0, 0.18, 0.28); c.rotation.set(-0.2, 0, 0); }
    const on = t >= FAINT && t < FAINT + 2.5;
    w.cupFly.visible = on;
    if (on) {
      const tt = t - FAINT, [x0, y0, z0] = CUP0;
      const land = 0.75, y = tt < land ? y0 + 3.2 * tt - 0.5 * 14 * tt * tt : 0.3;
      w.cupFly.position.set(x0 - 1.3 * Math.min(tt, land) / land, Math.max(0.3, y), z0 + 1.0 * Math.min(tt, land) / land);
      w.cupFly.rotation.set(Math.min(tt, land) * 9, 0, tt < land ? tt * 4 : Math.PI / 2);
    }
  }
  // the new rule: Sina holds it up to us on "just...", it drops and rolls out toward us on "new"
  {
    const up = Wd('new', 1, -0.05), drop = Wd('new', 4, 0.1);
    w.scroll2.group.visible = t > up;
    if (t > up) {
      const hang = 0.05 + 1.75 * E.outCubic(prog(t, up, up + 0.45));
      const fall = E.inCubic(prog(t, drop, drop + 0.3));
      const roll = E.outCubic(prog(t, drop + 0.25, drop + 0.95));
      // the top rod sits in his hands until it drops
      const a = new THREE.Vector3(), b = new THREE.Vector3();
      w.sina.parts.handR.getWorldPosition(a); w.sina.parts.handL.getWorldPosition(b);
      const top = Math.min(a.y, b.y) - 0.04;
      w.scroll2.layout(0, lerp(top, 0.06, fall), 0, roll * 4.2, fall >= 1 ? 99 : hang);
      w.scroll2.group.position.set((a.x + b.x) / 2, 0, (a.z + b.z) / 2 + 0.12);
      w.scroll2.group.rotation.y = w.sina.root.rotation.y * 0.6;
      w.scroll2.group.scale.set(0.9, 1, 1);
    }
  }
  // the spark pops off as Claude lands, and bounces
  {
    const on = t >= POP;
    w.looseSpark.visible = on;
    if (on) {
      const tt = t - POP, [x0, y0, z0] = SPARK0;
      const y = tt < 0.62 ? y0 + 4.2 * tt - 0.5 * 14 * tt * tt : Math.abs(Math.sin((tt - 0.62) * 5)) * 0.9 * Math.exp(-(tt - 0.62) * 2.5);
      w.looseSpark.position.set(x0 + 1.4 * Math.min(tt, 1.2), Math.max(0.16, y + 0.16), z0 + 1.2 * Math.min(tt, 1.2));
      w.looseSpark.rotation.set(-Math.PI / 2 * clamp(tt), 0, tt * 8 * Math.exp(-tt));
    }
  }
}

// ---------------------------------------------------------------- 2-D overlays
const v3 = new THREE.Vector3();
function screen(obj, off = [0, 0, 0]) {
  v3.set(...off); obj.localToWorld(v3); v3.project(W3.cam);
  return [(v3.x + 1) / 2 * W, (1 - v3.y) / 2 * H, v3.z];
}
// bubbles end at the next line, at hard cuts, and never before their words are said
const CUTS = [TE('ask', -0.08), Wd('ten', 7, 0.6), T('refs', -0.42), T('rules', -0.35), T('hiro', -0.45), TE('hiro2', 0.1)];
function lineEnd(i) {
  const l = S.LINES[i], nx = S.LINES[i + 1];
  let e = Math.min(nx ? nx.t - 0.06 : DUR, SPEECH.get(l).end + 0.7);
  for (const c of CUTS) if (l.t < c && e > c) e = c;
  return Math.max(e, Math.min(nx ? nx.t - 0.06 : DUR, SPEECH.get(l).end + 0.25));
}

function overlays(ctx, t, IMG) {
  const w = W3;
  const headC = screen(w.claude.parts.head, [0, 0.42, 0.45]), topC = screen(w.claude.parts.headTop, [0, 0.8, 0]);
  const headS = screen(w.sina.parts.head, [0, 0.3, 0.45]), topS = screen(w.sina.parts.headTop, [0, 0.4, 0]);

  // the scan: Claude reads Sina's own selfie before answering
  {
    const a = TE('ask', -0.05), b = T('sure', 0.35);
    if (t > a && t < b + 0.2) {
      const k = E.outBack(prog(t, a, a + 0.25), 1.8) * (1 - E.inBack(prog(t, b, b + 0.2), 1.5));
      const p = E.inOutCubic(prog(t, a + 0.15, b - 0.15));
      const x = W / 2, y = 560, pw = 460, ph = 460;
      ctx.save(); ctx.translate(x, y); ctx.scale(k, k);
      ctx.fillStyle = 'rgba(16,18,30,.92)'; ctx.beginPath(); ctx.roundRect(-pw / 2 - 24, -ph / 2 - 24, pw + 48, ph + 150, 34); ctx.fill();
      ctx.save(); ctx.beginPath(); ctx.roundRect(-pw / 2, -ph / 2, pw, ph, 20); ctx.clip();
      const im = IMG.selfie;
      if (im) { const s = pw / (im.width * 0.5); ctx.drawImage(im, -im.width * 0.47 * s, -im.height * 0.4 * s, im.width * s, im.height * s); }
      // scan line + grid, in Claude's colour
      ctx.fillStyle = 'rgba(217,119,87,.16)'; for (let gx = -pw / 2; gx < pw / 2; gx += 40) ctx.fillRect(gx, -ph / 2, 1.5, ph); for (let gy = -ph / 2; gy < ph / 2; gy += 40) ctx.fillRect(-pw / 2, gy, pw, 1.5);
      const sy = -ph / 2 + ((t - a) * 1.6 % 1) * ph;
      const gr = ctx.createLinearGradient(0, sy - 60, 0, sy); gr.addColorStop(0, 'rgba(217,119,87,0)'); gr.addColorStop(1, 'rgba(217,119,87,.55)');
      ctx.fillStyle = gr; ctx.fillRect(-pw / 2, sy - 60, pw, 60); ctx.fillStyle = '#FFB38F'; ctx.fillRect(-pw / 2, sy - 3, pw, 4);
      ctx.restore();
      ctx.strokeStyle = '#D97757'; ctx.lineWidth = 7;
      for (const [cx, cy, sx, sy2] of [[-1, -1, 1, 1], [1, -1, -1, 1], [-1, 1, 1, -1], [1, 1, -1, -1]]) {
        ctx.beginPath(); ctx.moveTo(cx * pw / 2, cy * ph / 2 + sy2 * 48); ctx.lineTo(cx * pw / 2, cy * ph / 2); ctx.lineTo(cx * pw / 2 + sx * 48, cy * ph / 2); ctx.stroke();
      }
      ctx.fillStyle = '#3A3550'; ctx.beginPath(); ctx.roundRect(-pw / 2, ph / 2 + 70, pw, 20, 10); ctx.fill();
      ctx.fillStyle = '#D97757'; ctx.beginPath(); ctx.roundRect(pw / 2 - pw * p, ph / 2 + 70, pw * p, 20, 10); ctx.fill();
      ctx.fillStyle = '#FFF8EE'; ctx.font = `800 40px ${O.FA}`; ctx.direction = 'rtl'; ctx.textAlign = 'right'; ctx.textBaseline = 'middle';
      ctx.fillText('در حال تحلیل سینا…', pw / 2, ph / 2 + 36);
      ctx.textAlign = 'left'; ctx.fillText(O.faNum(Math.round(p * 100)) + '٪', -pw / 2, ph / 2 + 36);
      ctx.restore();
    }
  }
  // the rant: the role being named, big; an icon over every Sina; a counter with his face
  {
    const r = S.ROLES, end = Math.min(TE('jobs3', 0.35), T('job', -0.3));   // off before Claude's next bubble
    let cur = -1; r.forEach((x, i) => { if (t >= x.t) cur = i; });
    if (cur >= 0 && t < end + 0.25) {
      const x = r[cur], k = E.outBack(prog(t, x.t, x.t + 0.22), 2.2) * (1 - E.inBack(prog(t, end, end + 0.22)));
      const nextT = cur + 1 < r.length ? r[cur + 1].t : end;
      const kk = Math.min(k, 1 - E.inQuad(prog(t, nextT - 0.06, nextT)) * (cur + 1 < r.length ? 1 : 0));
      if (kk > 0.01) {
        ctx.save(); ctx.translate(W / 2, 330); ctx.scale(kk, kk); ctx.rotate((cur % 2 ? 1 : -1) * 0.03);
        const f1 = `700 40px ${O.FA}`, f2 = `900 76px ${O.FA}`;
        ctx.font = f2; const w2 = ctx.measureText(x.role).width;
        const bw = Math.max(w2 + 210, 420), bh = 170;
        ctx.fillStyle = 'rgba(0,0,0,.22)'; ctx.beginPath(); ctx.roundRect(-bw / 2 + 8, -bh / 2 + 10, bw, bh, 40); ctx.fill();
        ctx.fillStyle = '#16161A'; ctx.beginPath(); ctx.roundRect(-bw / 2, -bh / 2, bw, bh, 40); ctx.fill();
        ctx.fillStyle = '#D3121E'; ctx.beginPath(); ctx.roundRect(-bw / 2, -bh / 2, bw, 16, [40, 40, 0, 0]); ctx.fill();
        O.drawIcon(ctx, x.icon, -bw / 2 + 85, 8, 50, '#FFC93C');
        ctx.direction = 'rtl'; ctx.textAlign = 'right'; ctx.textBaseline = 'middle';
        ctx.fillStyle = '#FFC93C'; ctx.font = f1; ctx.fillText(x.when, bw / 2 - 40, -36);
        ctx.fillStyle = '#FFFFFF'; ctx.font = f2; ctx.fillText(x.role, bw / 2 - 40, 30);
        ctx.restore();
      }
    }
    // icons over the Sinas that have been named
    w.sClones.forEach((f, i) => {
      if (!f.root.visible) return;
      const k = E.outBack(prog(t, r[i].t + 0.1, r[i].t + 0.35), 2) * (1 - prog(t, T('job', -0.05), T('job', 0.1)));
      if (k <= 0) return;
      const p = screen(f.parts.headTop, [0, 0.75, 0]);
      ctx.save(); ctx.translate(p[0], p[1]); ctx.scale(k, k);
      ctx.fillStyle = i === cur ? '#D3121E' : '#16161A'; ctx.beginPath(); ctx.arc(0, 0, 38, 0, TAU); ctx.fill();
      ctx.lineWidth = 5; ctx.strokeStyle = '#FFFFFF'; ctx.stroke();
      O.drawIcon(ctx, r[i].icon, 0, 0, 22, '#FFFFFF');
      ctx.restore();
    });
    // the counter: Sina x n
    const n = r.filter((x) => t >= x.t).length;
    const kc = E.outBack(prog(t, r[0].t, r[0].t + 0.25), 2) * (1 - E.inBack(prog(t, T('job', -0.1), T('job', 0.12))));   // gone before Claude's bubble
    if (n > 0 && kc > 0.01) {
      const pulse = 1 + 0.12 * bump(t, r[n - 1].t + 0.06, 0.12);
      ctx.save(); ctx.translate(200, 560); ctx.scale(kc * pulse, kc * pulse);
      ctx.fillStyle = '#FFFFFF'; ctx.beginPath(); ctx.roundRect(-120, -56, 240, 112, 56); ctx.fill();
      ctx.lineWidth = 6; ctx.strokeStyle = '#D3121E'; ctx.stroke();
      O.avatar(ctx, 'S', -64, 0, 44);
      ctx.fillStyle = '#16161A'; ctx.font = `900 64px ${O.FA}`; ctx.direction = 'ltr'; ctx.textAlign = 'left'; ctx.textBaseline = 'middle';
      ctx.fillText('×' + O.faNum(n), -12, 4);
      ctx.restore();
    }
  }
  // the mystical line art around the floating Claude
  {
    const a = Wd('jobs3', 8, -0.1), b = T('job', 0.05);
    if (t > a && t < b + 0.3) {
      const c = screen(w.claude.parts.torso, [0, 0.9, 0]);
      ctx.save(); ctx.globalAlpha = 1 - prog(t, b - 0.1, b + 0.3);
      O.lineArt(ctx, c[0], c[1], 300, prog(t, a + 0.05, a + 1.0), t, '#6B4A2A');
      ctx.restore();
    }
  }
  // question marks on "I still don't know what my job is"
  if (t > Wd('job', 6) && t < TE('job', 0.5)) {
    [[Wd('job', 6), -1, 0, 120], [Wd('job', 8), 1, -70, 150], [Wd('job', 9), -1, -260, 100]].forEach(([t0, sd, dy, sz], i) => {
      const k = E.outBack(prog(t, t0, t0 + 0.25), 2.5) * (1 - prog(t, TE('job', 0.15), TE('job', 0.5)));
      if (k > 0) O.bigText(ctx, '؟', clamp(headC[0] + sd * 330, 120, W - 120), Math.max(700, headC[1] - 60) + dy + 10 * Math.sin(t * 4 + i), sz, '#2A1F1A', k, 900, '#FFF8EE');
    });
  }
  // numbered complaints: the stamps
  for (const [t0, label] of [[T('refs', -0.4), 'گلایه‌ی ۱'], [T('rules', -0.33), 'گلایه‌ی ۲'], [T('hiro', -0.43), 'گلایه‌ی ۳']]) {
    if (t < t0 || t > t0 + 1.0) continue;
    const k = lerp(3.0, 1, E.outCubic(prog(t, t0, t0 + 0.15))) * (1 - E.inBack(prog(t, t0 + 0.7, t0 + 0.95)));
    O.stamp(ctx, label, W / 2, H * 0.42, k, -0.1, { size: 140, fill: 'rgba(255,248,238,.94)' });
  }
  // the tile counters, on the words
  for (const [t0, s, t1] of [[Wd('refs', 4), '۳', Wd('refs', 5, -0.1)], [Wd('refs', 5), '+۴', Wd('refs', 7, -0.1)], [Wd('refs', 7), '+۱', T('uni', -0.4)]]) {
    const k = E.outBack(prog(t, t0, t0 + 0.2), 3) * (1 - prog(t, t1, t1 + 0.12));
    if (k > 0) O.bigText(ctx, s, clamp(headC[0] + 300, 200, W - 200), clamp(headC[1] + 160, 700, 1300), 150, '#FFF8EE', k, 900, '#B8261C', 'ltr');
  }
  // the glitch buzzer on "forbidden!"
  {
    const b0 = Wd('rulesRead', 1);
    if (t > b0 - 0.05 && t < b0 + 0.6) {
      const k = E.outBack(prog(t, b0 - 0.05, b0 + 0.08), 3) * (1 - prog(t, b0 + 0.45, b0 + 0.6));
      const p = screen(w.scroll.group, [0, 0.25, 0.85 + (1110 / 2700) * 9 - 3.5]);
      ctx.save(); ctx.translate(p[0], p[1]); ctx.scale(k, k);
      ctx.strokeStyle = '#E5262E'; ctx.lineWidth = 26; ctx.beginPath(); ctx.arc(0, 0, 150, 0, TAU); ctx.stroke();
      ctx.beginPath(); ctx.moveTo(-106, 106); ctx.lineTo(106, -106); ctx.stroke();
      ctx.restore();
    }
  }
  // frazzled marks on "I'm doomed"
  if (t > T('doom') && t < TE('doom', 0.4)) {
    const k = E.outBack(prog(t, T('doom'), T('doom', 0.2)), 2.5) * (1 - prog(t, TE('doom', 0.1), TE('doom', 0.4)));
    O.angerMark(ctx, topC[0] + 150, topC[1] + 40, 46 * k * (1 + 0.15 * Math.sin(t * 18)));
    for (let i = 0; i < 4; i++) {
      const ph = ((t - T('doom')) * 1.8 + i / 4) % 1, sd = i % 2 ? 1 : -1;
      O.drop(ctx, headC[0] + sd * (160 + ph * 140), headC[1] - 80 + ph * ph * 260 - ph * 120, 22 * k, sd * 0.6);
    }
  }
  // Hiro: the project counts, on the words
  {
    const h0 = Wd('hiro2', 2, 0.3), m0 = Wd('hiro2', 4, 0.3), gone = TE('hiro2', 0.05);
    if (t > h0 && t < gone + 0.2) {
      const hs = screen(w.hiroStack.group, [0, 7 * 0.33, 0]), ms = screen(w.myStack.group, [0, 1.0, 0]);
      O.tag(ctx, 'پروژه‌های هیرو: ' + O.faNum(14), clamp(hs[0], 260, W - 250), clamp(hs[1], 760, 1300), E.outBack(prog(t, h0, h0 + 0.25), 2) * (1 - prog(t, gone, gone + 0.15)), { bg: '#B7791F', size: 38 });
      if (t > m0) O.tag(ctx, 'پروژه‌های من: ' + O.faNum(2), clamp(ms[0], 250, W - 260), clamp(ms[1] - 40, 760, 1400), E.outBack(prog(t, m0, m0 + 0.25), 2) * (1 - prog(t, gone, gone + 0.15)), { bg: '#5A6390', size: 38 });
    }
  }
  // the deadpan: a silence you can see
  {
    const a = TE('hiro2', 0.1), b = T('but', -0.05);
    if (t > a + 0.15 && t < b) O.bigText(ctx, '…', W - 180, 520, 90, 'rgba(255,255,255,.55)', E.outCubic(prog(t, a + 0.15, a + 0.35)) * (1 - prog(t, b - 0.15, b)), 400);
  }
  // hearts after "I'm happy with you"
  {
    const a = Wd('psst', 3);
    for (let i = 0; i < 5; i++) {
      const ph = clamp((t - a - i * 0.18) / 1.2);
      if (ph <= 0 || ph >= 1) continue;
      O.heart(ctx, headC[0] + Math.sin(i * 2.3 + ph * 4) * 90 + (i - 2) * 40, headC[1] - 120 - ph * 380, 22 * (1 - ph * 0.4), `rgba(226,50,75,${1 - ph})`);
    }
  }
  // a glint in Sina's sharp eye
  {
    const a = Wd('eye', 1, 0.2);
    if (t > a - 0.3 && t < a + 0.5) { const e = screen(w.sina.parts.head, [-0.13, 0.37, 0.46]); O.sparkle(ctx, e[0], e[1], 110 * bump(t, a, 0.3), t * 4); }
  }
  // "professional!" on the rule brick
  {
    const a = Wd('once', 9);
    if (t > a && t < TE('once', 0.55)) {
      const k = lerp(2.4, 1, E.outCubic(prog(t, a, a + 0.15))) * (1 - E.inBack(prog(t, TE('once', 0.3), TE('once', 0.55))));
      const b = screen(w.lbrick.group, [0, 2.4, 0]);
      O.stamp(ctx, 'حرفه‌ای', b[0], b[1] - 40, k * 0.75, 0.1, { color: '#8A5A00', size: 110, fill: 'rgba(255,236,170,.92)' });
    }
  }
  // sparkles: the brick turning into a rule, and the toast
  for (const [t0, obj, off] of [[Wd('once', 9, -0.2), w.lbrick.group, [0, 1.2, 0]], [Wd('tired', 5, 0.05), null, null]]) {
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

  // speech bubbles (the rant and the rule reading speak through the picture instead)
  S.LINES.forEach((l, i) => {
    if (l.bubble === false) return;
    const end = lineEnd(i);
    if (t < l.t - 0.05 || t > end) return;
    const C = l.who === 'C';
    O.bubble(ctx, l, SPEECH.get(l), t, C ? [headC[0], headC[1]] : [headS[0], headS[1]], (C ? topC : topS)[1], end);
  });

  // end card: both names, big, with his face
  const ec = TE('new', 0.3);
  if (t > ec) {
    const k = E.outBack(prog(t, ec, ec + 0.4), 1.6), k2 = E.outBack(prog(t, ec + 0.5, ec + 0.9), 1.8);
    ctx.save(); ctx.globalAlpha = clamp(prog(t, ec - 0.1, ec + 0.2));
    const g = ctx.createLinearGradient(0, 0, 0, 980); g.addColorStop(0, 'rgba(244,235,221,.97)'); g.addColorStop(1, 'rgba(244,235,221,0)');
    ctx.fillStyle = g; ctx.fillRect(0, 0, W, 980);
    ctx.restore();
    O.avatar(ctx, 'S', W / 2 + 410, 470, 80 * k);
    O.avatar(ctx, 'C', W / 2 - 410, 470, 80 * k);
    O.bigText(ctx, 'سینا', W / 2 + 195, 470, 124, '#16161A', k, 900);
    O.bigText(ctx, '×', W / 2, 474, 96, '#D3121E', k, 700);
    O.bigText(ctx, 'کلاد', W / 2 - 195, 470, 124, '#C8623F', k, 900);
    O.bigText(ctx, 'یه نفر، ده‌تا شغل، یه هوش مصنوعیِ خسته', W / 2, 650, 46, '#3A2F28', k2, 700);
  }
}

// ---------------------------------------------------------------- sound hits
// [seconds, label, sfx, opts]; converted to beats (120 bpm, offset 0) for sfx.mjs
const HIT_S = [
  [0.0, 'sina leaps in', 'boing', { pitch: 260, to: 520, gain: 0.25 }], [0.45, 'sina lands', 'thud'],
  [TE('ask', -0.05), 'scanner on', 'blip', { pitch: 'E6' }], [TE('ask', 0.1), 'scanning', 'type', { len: 0.8 }], [T('sure', 0.2), 'scan done', 'bell', { pitch: 'A6' }],
  [Wd('ten', 7, -0.3), 'risers rise', 'whoosh', { len: 0.5, from: 300, to: 1500 }], [Wd('ten', 7, 0.25), 'risers land', 'thud', { gain: 0.3 }],
  ...S.ROLES.map((r, i) => [r.t, `sina ${i + 1}`, 'pop', { pitch: ['C6', 'D6', 'E6', 'G6', 'A6', 'C7', 'D7', 'E7', 'G7', 'A7'][i], gain: 0.3 }]),
  [Wd('jobs3', 2, -0.2), 'f-14 flyby', 'whoosh', { len: 1.7, from: 250, to: 3200, gain: 0.45 }],
  [Wd('jobs3', 6, -0.47), 'pill drops', 'whoosh', { len: 0.4, from: 2000, to: 500 }], [Wd('jobs3', 6, -0.05), 'pill bounce', 'boing', { pitch: 220, to: 440 }],
  [Wd('jobs3', 8, -0.4), 'pill rolls', 'whoosh', { len: 0.8, from: 400, to: 1200, gain: 0.2 }], [Wd('jobs3', 8), 'zen', 'bell', { pitch: 'D6', verb: 0.8 }],
  [T('job', 0.05), 'claude splits', 'pop', { pitch: 'C6' }], [T('job', 0.13), 'split 2', 'pop', { pitch: 'E6' }], [T('job', 0.21), 'split 3', 'pop', { pitch: 'G6' }],
  [Wd('job', 6, -0.15), 'clones crash', 'thud'], [Wd('job', 6, -0.13), 'crash boing', 'boing', { pitch: 400, to: 150 }], [RANT_OUT, 'sinas vanish', 'pop', { pitch: 'G5', to: 'C5' }],
  [Wd('job', 6), '? 1', 'tok', { pitch: 'C6' }], [Wd('job', 8), '? 2', 'tok', { pitch: 'E6' }], [Wd('job', 9), '? 3', 'tok', { pitch: 'G6' }],
  [T('refs', -0.4), 'complaint 1', 'impact'],
  [Wd('refs', 4, -0.05), 'tiles 3', 'thud', { pitch: 150, gain: 0.25 }], [Wd('refs', 4), 'counter 3', 'pop', { pitch: 'E6' }],
  [Wd('refs', 5, -0.1), 'tiles 4', 'click'], [Wd('refs', 5), 'counter +4', 'pop', { pitch: 'G6' }], [Wd('refs', 7, 0.05), 'bonk', 'thud', { pitch: 300, to: 120 }], [Wd('refs', 7), 'counter +1', 'pop', { pitch: 'C7' }],
  [T('uni', -0.35), 'claude pops out', 'boing', { pitch: 200, to: 800 }], [T('uni', -0.2), 'grad cap', 'bell', { pitch: 'C6' }],
  [T('rules', -0.33), 'complaint 2', 'impact'], [T('rules', 0.25), 'scroll unrolls', 'whoosh', { len: 1.8, from: 300, to: 900, gain: 0.3 }],
  [Wd('rulesRead', 0, 0.05), 'glitch', 'blip', { pitch: 'C7', gain: 0.3 }], [Wd('rulesRead', 0, 0.13), 'glitch b', 'blip', { pitch: 'F#6', gain: 0.3 }],
  [Wd('rulesRead', 2), 'rule 2', 'tick'], [Wd('rulesRead', 4), 'rule 3', 'tick'], [Wd('rulesRead', 6), 'rule 4', 'tick'],
  [T('doom', -0.3), 'scroll snaps shut', 'whoosh', { len: 0.4, from: 1200, to: 300 }],
  [T('hiro', -0.43), 'complaint 3', 'impact'], [T('hiro', -0.3), 'hiro reveal', 'crash', { len: 2.5 }], [T('hiro', 0.4), 'crown', 'bell', { pitch: 'E6', verb: 0.6 }],
  [Wd('hiro2', 2), 'tiles', 'coins'], [Wd('hiro2', 4, 0.1), 'my tile 1', 'tok', { pitch: 'C5' }], [Wd('hiro2', 4, 0.35), 'my tile 2', 'tok', { pitch: 'C5' }],
  [Wd('psst', 3), 'blush', 'blip', { pitch: 'E6' }], [Wd('psst', 3, 0.15), 'blush 2', 'blip', { pitch: 'G6' }],
  [T('eye', -0.5), 'into praise', 'swell', { len: 1.0 }], [Wd('eye', 1, 0.2), 'glint', 'bell', { pitch: 'C7' }],
  [Wd('yay', 4, -0.05), 'claude jumps', 'boing', { pitch: 300, to: 900 }], [Wd('yay', 4, 0.25), 'confetti', 'crash', { len: 1.4, gain: 0.2 }], [Wd('yay', 4, 0.27), 'confetti coins', 'coins'],
  [T('once', 0.1), 'mistake brick', 'pop', { pitch: 'C6' }], [Wd('once', 7, -0.1), 'brick flips', 'whoosh', { len: 0.5, from: 500, to: 2500 }], [Wd('once', 9, -0.2), 'rule!', 'bell', { pitch: 'G6' }], [Wd('once', 9), 'professional stamp', 'thud'],
  [T('tools', -0.05), 'tomato', 'pop', { pitch: 'D6' }], ...Array.from({ length: 6 }, (_, i) => [T('tools', 0.3 + i * 0.25), `tick ${i}`, 'tick']),
  ...Array.from({ length: 9 }, (_, i) => [T('tools', 0.35 + i * 0.07), `clip ${i}`, 'click', { gain: 0.18 }]),
  [T('photo', -0.1), 'frame', 'pop', { pitch: 'A5' }], [T('photo', 0.05), 'frame ding', 'bell', { pitch: 'E6' }],
  [T('tired', -0.3), 'cup 1', 'pop', { pitch: 'D6' }], [T('tired', -0.2), 'cup 2', 'pop', { pitch: 'F6' }], [Wd('tired', 5, 0.02), 'clink', 'bell', { pitch: 'A6', verb: 0.5 }], [Wd('tired', 5, 0.04), 'clink 2', 'bell', { pitch: 'E7', gain: 0.18 }],
  [Wd('new', 1, -0.05), 'new scroll', 'whoosh', { len: 0.5, from: 300, to: 1400 }], [Wd('new', 3), 'shock', 'blip', { pitch: 'A6' }],
  [Wd('new', 4, 0.1), 'scroll drops', 'whoosh', { len: 0.8, from: 900, to: 300, gain: 0.25 }],
  [FAINT, 'faint', 'whoosh', { len: 0.55, from: 1500, to: 200 }], [FAINT + 0.55, 'thud floor', 'thud'], [POP, 'spark pops', 'boing', { pitch: 300, to: 1100 }],
  [FAINT + 0.75, 'cup lands', 'click'], [POP + 0.62, 'spark bounce', 'tok', { pitch: 'G5' }], [POP + 1.2, 'spark bounce 2', 'tok', { pitch: 'G5', gain: 0.15 }],
  [TE('new', 0.3), 'end card', 'bell', { pitch: 'F6', verb: 0.5 }], [DUR - 1.5, 'thumb', 'pop', { pitch: 'C6' }],
];
const HITS = HIT_S.filter(([t]) => t >= 0 && t < DUR).map(([t, l, s, o]) => [+(t * 2).toFixed(3), l, s, o]);

// ---------------------------------------------------------------- film
let IMGS = null;
M.film({
  hits: HITS,
  fonts: ['800 58px Vazir', '900 120px Vazir', '700 40px Vazir', '400 40px Vazir'],
  images: { portrait: 'assets/ref_portrait.png', selfie: 'assets/ref_selfie.jpg' },
  samples: 1,
  async init(ctx, IMG) {
    IMGS = IMG; O.setImages(IMG);
    await G.initGL({ exposure: 1.0, scale: Number(new URLSearchParams(location.search).get('gls') || 0.85) });
    SET = build(IMG);
  },
  draw(ctx, u, t) {
    const mw = O.moodWeights(S.MOOD, t);
    O.background(ctx, mw, t, W / 2);
    SET.update(t);
    G.renderSet(ctx, { scene: SET.scene, camera: SET.camera, update() {} }, t, u, {});
    O.vignette(ctx, mw);
    overlays(ctx, t, IMGS);
  },
});
