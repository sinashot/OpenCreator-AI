// Lego parts: plastic materials, bricks with studs, a baseplate, and the minifig rig.
// Units: 1 = 1 cm; a stud pitch is 0.8, a brick 0.96 tall, a plate 0.32.
import * as G from '../lib/gl.js';
import { drawFace, drawTorso, FACE_W, FACE_H, SKIN, SPARK_RAYS } from './faces.js';

const THREE = G.THREE;
export const P = 0.8, BRICK = 0.96, PLATE = 0.32, STUD_R = 0.24, STUD_H = 0.17;

const matCache = new Map();
// Standard (not physical) materials: software WebGL renders them far faster, and with a low
// roughness plus the environment map they still read as glossy ABS.
export const Mat = (o) => new THREE.MeshStandardMaterial(o);
export function plastic(color, o = {}) {
  const key = `${color}|${JSON.stringify(o)}`;
  if (matCache.has(key)) return matCache.get(key);
  const m = Mat({
    color, roughness: (o.roughness ?? 0.3) * 0.85, metalness: 0,
    envMap: G.ENV, envMapIntensity: (o.env ?? 0.35) * 1.3, transparent: !!o.opacity, opacity: o.opacity ?? 1,
    emissive: o.emissive ?? 0x000000, emissiveIntensity: o.emissiveIntensity ?? 0,
  });
  matCache.set(key, m);
  return m;
}

// ---------------------------------------------------------------- geometry helpers
const geoCache = new Map();
const cached = (k, f) => { if (!geoCache.has(k)) geoCache.set(k, f()); return geoCache.get(k); };
export const studGeo = () => cached('stud', () => new THREE.CylinderGeometry(STUD_R, STUD_R, STUD_H, 14));
// a box with softly rounded edges (cheap: chamfer by scaling a subdivided box toward a rounded shape)
export function roundBox(w, h, d, r = 0.04, seg = 2) {
  return cached(`rb${w}|${h}|${d}|${r}`, () => {
    const g = new THREE.BoxGeometry(w, h, d, seg * 2 + 1, seg * 2 + 1, seg * 2 + 1);
    const p = g.attributes.position, v = new THREE.Vector3();
    const hx = w / 2 - r, hy = h / 2 - r, hz = d / 2 - r;
    for (let i = 0; i < p.count; i++) {
      v.fromBufferAttribute(p, i);
      const cx = Math.max(-hx, Math.min(hx, v.x)), cy = Math.max(-hy, Math.min(hy, v.y)), cz = Math.max(-hz, Math.min(hz, v.z));
      const dx = v.x - cx, dy = v.y - cy, dz = v.z - cz, l = Math.hypot(dx, dy, dz);
      if (l > 1e-6) { v.set(cx + (dx / l) * r, cy + (dy / l) * r, cz + (dz / l) * r); p.setXYZ(i, v.x, v.y, v.z); }
    }
    g.computeVertexNormals();
    return g;
  });
}

// A brick (or plate) of nx x nz studs, origin at the bottom centre.
export function brick(nx, nz, color, { h = BRICK, studs = true, tile = false } = {}) {
  const grp = new THREE.Group();
  const m = plastic(color);
  const body = new THREE.Mesh(roundBox(nx * P - 0.02, h, nz * P - 0.02, 0.03, 1), m);
  body.position.y = h / 2; body.castShadow = body.receiveShadow = true;
  grp.add(body);
  if (studs && !tile) {
    for (let i = 0; i < nx; i++) for (let j = 0; j < nz; j++) {
      const s = new THREE.Mesh(studGeo(), m);
      s.position.set((i - (nx - 1) / 2) * P, h + STUD_H / 2, (j - (nz - 1) / 2) * P);
      s.castShadow = true;
      grp.add(s);
    }
  }
  return grp;
}

// Baseplate: one slab + instanced studs.
export function baseplate(nx, nz, color) {
  const grp = new THREE.Group();
  const m = plastic(color, { clearcoat: 0.2, roughness: 0.5, env: 0.12 });
  const slab = new THREE.Mesh(new THREE.BoxGeometry(nx * P, 0.16, nz * P), m);
  slab.position.y = -0.08; slab.receiveShadow = true;
  grp.add(slab);
  const inst = new THREE.InstancedMesh(studGeo(), m, nx * nz);
  const M4 = new THREE.Matrix4();
  let k = 0;
  for (let i = 0; i < nx; i++) for (let j = 0; j < nz; j++) {
    M4.makeTranslation((i - (nx - 1) / 2) * P, STUD_H / 2, (j - (nz - 1) / 2) * P);
    inst.setMatrixAt(k++, M4);
  }
  inst.receiveShadow = true; inst.castShadow = false;
  grp.add(inst);
  return grp;
}

// ---------------------------------------------------------------- minifig
function trapezoid(wb, wt, h, d) {
  const g = new THREE.BoxGeometry(1, h, d, 1, 1, 1);
  const p = g.attributes.position;
  for (let i = 0; i < p.count; i++) {
    const y = p.getY(i), x = p.getX(i);
    p.setX(i, x * (y > 0 ? wt : wb));
  }
  g.computeVertexNormals();
  return g;
}
function lathe(points, seg = 40) { return new THREE.LatheGeometry(points.map(([x, y]) => new THREE.Vector2(x, y)), seg); }

const HEAD_R = 0.47, HEAD_SIDE = 0.62, HEAD_ROUND = 0.11;

function headGeometry() {
  return cached('head', () => {
    const side = new THREE.CylinderGeometry(HEAD_R, HEAD_R, HEAD_SIDE, 64, 1, true, Math.PI, Math.PI * 2);
    side.translate(0, HEAD_ROUND + HEAD_SIDE / 2, 0);
    const r = HEAD_ROUND, pts = [];
    for (let i = 0; i <= 8; i++) { const a = (i / 8) * (Math.PI / 2); pts.push([HEAD_R - r + Math.sin(a) * r, r - Math.cos(a) * r]); }
    const bottom = lathe([[0.25, 0], ...pts.map(([x, y]) => [x, y])].map(([x, y]) => [x, y]), 64);
    const topPts = [];
    for (let i = 0; i <= 8; i++) { const a = (i / 8) * (Math.PI / 2); topPts.push([HEAD_R - r + Math.cos(a) * r, HEAD_ROUND + HEAD_SIDE + Math.sin(a) * r]); }
    topPts.push([0.0, HEAD_ROUND * 2 + HEAD_SIDE]);
    const top = lathe(topPts, 64);
    return { side, bottom, top };
  });
}

// Claude's spark: an extruded starburst
export function sparkGeometry(R = 0.3, depth = 0.08) {
  return cached(`spark${R}`, () => {
    const shapes = [];
    for (const [a, len, wid] of SPARK_RAYS) {
      const s = new THREE.Shape();
      const hw = R * wid * 0.5, ex = Math.cos(a) * R * len, ey = Math.sin(a) * R * len;
      const nx = -Math.sin(a), ny = Math.cos(a);
      s.moveTo(nx * hw * 0.6, ny * hw * 0.6);
      s.lineTo(ex + nx * hw, ey + ny * hw);
      s.absarc(ex, ey, hw, a + Math.PI / 2, a - Math.PI / 2, true);
      s.lineTo(-nx * hw * 0.6, -ny * hw * 0.6);
      s.closePath();
      shapes.push(s);
    }
    const c = new THREE.Shape(); c.absarc(0, 0, R * 0.24, 0, Math.PI * 2, false); shapes.push(c);
    const g = new THREE.ExtrudeGeometry(shapes, { depth, bevelEnabled: true, bevelThickness: 0.02, bevelSize: 0.015, bevelSegments: 2, curveSegments: 6 });
    g.translate(0, 0, -depth / 2);
    return g;
  });
}

function armGeometry() {
  return cached('arm', () => {
    // a bent tube: down from the shoulder, then forward to the wrist (built in +x-arm space)
    const curve = new THREE.CatmullRomCurve3([
      new THREE.Vector3(0, 0.05, 0), new THREE.Vector3(0.06, -0.28, -0.02), new THREE.Vector3(0.1, -0.56, 0.06),
      new THREE.Vector3(0.1, -0.74, 0.3), new THREE.Vector3(0.09, -0.8, 0.5),
    ]);
    const g = new THREE.TubeGeometry(curve, 24, 0.17, 16, false);
    // taper toward the wrist
    const p = g.attributes.position, n = 25, rs = 17;
    for (let i = 0; i < n; i++) {
      const c = curve.getPointAt(i / (n - 1)), k = 1 - 0.18 * (i / (n - 1));
      for (let j = 0; j < rs; j++) {
        const idx = i * rs + j;
        p.setXYZ(idx, c.x + (p.getX(idx) - c.x) * k, c.y + (p.getY(idx) - c.y) * k, c.z + (p.getZ(idx) - c.z) * k);
      }
    }
    g.computeVertexNormals();
    const cap = new THREE.SphereGeometry(0.17, 16, 12);
    return { tube: g, cap, wrist: curve.getPointAt(1) };
  });
}

// The minifig. who: 'sina' | 'claude'. Returns { root, parts, setPose(pose), face, update... }
export function minifig(who) {
  const C = who === 'sina'
    ? { torso: '#17171A', arm: '#17171A', hand: SKIN.sina, hip: '#2B3140', leg: '#2B3140', skin: SKIN.sina, hair: '#18120E' }
    : { torso: '#D2694A', arm: '#D2694A', hand: SKIN.claude, hip: '#3A3631', leg: '#3A3631', skin: SKIN.claude };
  const root = new THREE.Group();          // feet on y = 0
  const body = new THREE.Group(); root.add(body);   // squash/lean pivot at the feet
  const parts = {};
  const mesh = (geo, mat, cast = true) => { const m = new THREE.Mesh(geo, mat); m.castShadow = cast; m.receiveShadow = true; return m; };

  // hips + legs
  const hip = mesh(roundBox(1.5, 0.3, 0.74, 0.04), plastic(C.hip)); hip.position.y = 1.36; body.add(hip);
  for (const sd of [-1, 1]) {
    const pivot = new THREE.Group(); pivot.position.set(sd * 0.38, 1.18, 0); body.add(pivot);
    const leg = mesh(roundBox(0.72, 1.0, 0.66, 0.05), plastic(C.leg)); leg.position.set(0, -0.62, -0.04); pivot.add(leg);
    const foot = mesh(roundBox(0.72, 0.3, 0.86, 0.05), plastic(C.leg)); foot.position.set(0, -1.03, 0.06); pivot.add(foot);
    parts[sd < 0 ? 'legR' : 'legL'] = pivot;
  }
  // torso (pivot at the waist)
  const torso = new THREE.Group(); torso.position.y = 1.51; body.add(torso); parts.torso = torso;
  const tex = G.canvasTexture(512, 400);
  tex.draw((c, w, h) => drawTorso(c, who, w, h));
  const torsoMats = [plastic(C.torso), plastic(C.torso), plastic(C.torso), plastic(C.torso),
    Mat({ map: tex, roughness: 0.28, envMap: G.ENV, envMapIntensity: 0.45 }), plastic(C.torso)];
  const tg = trapezoid(1.56, 1.18, 1.24, 0.76);
  const tm = new THREE.Mesh(tg, torsoMats); tm.castShadow = tm.receiveShadow = true; tm.position.y = 0.62; torso.add(tm);
  const neck = mesh(new THREE.CylinderGeometry(0.25, 0.27, 0.14, 24), plastic(C.skin)); neck.position.y = 1.31; torso.add(neck);

  // arms (pivot at the shoulder)
  const A = armGeometry();
  for (const sd of [-1, 1]) {
    const pivot = new THREE.Group(); pivot.position.set(sd * 0.66, 1.0, 0); torso.add(pivot);
    const inner = new THREE.Group(); inner.scale.x = sd; pivot.add(inner);   // mirror the +x arm
    const tube = mesh(A.tube, plastic(C.arm)); inner.add(tube);
    const cap = mesh(A.cap, plastic(C.arm)); cap.position.set(0, 0.05, 0); inner.add(cap);
    // hand: the C-clip, at the wrist, opening forward
    const hand = new THREE.Group(); hand.position.copy(A.wrist); inner.add(hand);
    const wrist = mesh(new THREE.CylinderGeometry(0.09, 0.09, 0.16, 12), plastic(C.hand)); wrist.rotation.x = Math.PI / 2 - 0.25; wrist.position.set(0, -0.01, 0.04); hand.add(wrist);
    const clip = mesh(new THREE.TorusGeometry(0.15, 0.068, 10, 20, Math.PI * 1.55), plastic(C.hand));
    clip.rotation.set(0, Math.PI / 2, Math.PI * 0.72); clip.position.set(0, -0.05, 0.2); hand.add(clip);
    parts[sd < 0 ? 'armR' : 'armL'] = pivot;
    parts[sd < 0 ? 'handR' : 'handL'] = hand;
  }

  // head (pivot at the neck top)
  const head = new THREE.Group(); head.position.y = 1.38; torso.add(head); parts.head = head;
  const HG = headGeometry();
  const faceTex = G.canvasTexture(FACE_W, FACE_H);
  // redrawn every frame: no mipmap rebuild (costly in software GL), plain linear filtering
  faceTex.generateMipmaps = false; faceTex.minFilter = THREE.LinearFilter; faceTex.anisotropy = 1;
  const faceMat = Mat({ map: faceTex, roughness: 0.26, envMap: G.ENV, envMapIntensity: 0.45 });
  const skinMat = plastic(C.skin);
  head.add(mesh(HG.side, faceMat), mesh(HG.bottom, skinMat), mesh(HG.top, skinMat));
  const topY = HEAD_ROUND * 2 + HEAD_SIDE;
  parts.headTop = new THREE.Group(); parts.headTop.position.y = topY; head.add(parts.headTop);

  if (who === 'sina') {
    parts.hair = sinaHair(C.hair); parts.headTop.add(parts.hair);
  } else {
    const stud = mesh(studGeo(), skinMat); stud.position.y = STUD_H / 2; parts.headTop.add(stud);
    // the spark rides on a short stem from the stud (a Lego plant piece)
    const stem = mesh(new THREE.CylinderGeometry(0.035, 0.05, 0.3, 10), plastic('#B9583A')); stem.position.y = STUD_H + 0.12; parts.headTop.add(stem);
    const spark = new THREE.Group(); spark.position.y = STUD_H + 0.3; parts.headTop.add(spark);
    const sm = mesh(sparkGeometry(0.32), plastic('#D97757', { emissive: 0xD97757, emissiveIntensity: 0 }));
    spark.add(sm);
    parts.spark = spark; parts.sparkMesh = sm;
  }
  return { who, root, body, parts, faceTex, torsoTex: tex };
}

// Swept-back hair with a side part, short faded sides (from the photos)
function sinaHair(color) {
  const grp = new THREE.Group();
  const m = plastic(color, { roughness: 0.48, clearcoat: 0.25 });
  const R = HEAD_R + 0.04;
  // short sides + back: an open band hugging the head, low at the back, rising toward the temples
  const band = new THREE.CylinderGeometry(R, R, 0.42, 48, 4, true, Math.PI * 0.30, Math.PI * 1.4);
  const bp = band.attributes.position;
  for (let i = 0; i < bp.count; i++) {
    const x = bp.getX(i), y = bp.getY(i), z = bp.getZ(i);
    const back = Math.max(0, -z / R);                    // 1 at the back of the head
    if (y < 0) bp.setY(i, y * (0.55 + 0.9 * back));      // lower at the back
  }
  band.computeVertexNormals();
  const bandMesh = new THREE.Mesh(band, plastic('#2A211C', { roughness: 0.6, clearcoat: 0.1 }));
  bandMesh.position.y = -0.18; bandMesh.castShadow = true;
  bandMesh.material.side = THREE.DoubleSide;
  grp.add(bandMesh);
  // the top: a flattened dome, fuller toward the front and to his left, swept back
  const dome = new THREE.SphereGeometry(1, 48, 24, 0, Math.PI * 2, 0, Math.PI * 0.5);
  const dp = dome.attributes.position;
  for (let i = 0; i < dp.count; i++) {
    let x = dp.getX(i), y = dp.getY(i), z = dp.getZ(i);
    const front = Math.max(0, z), left = Math.max(0, x);
    y *= 0.34 + 0.16 * front + 0.05 * left;               // volume at the front
    z = z * (1 + 0.08 * Math.max(0, y));
    dp.setXYZ(i, x * 0.52, y, z * 0.54 + 0.02);
  }
  dome.computeVertexNormals();
  const domeMesh = new THREE.Mesh(dome, m); domeMesh.castShadow = true; domeMesh.position.y = -0.06; domeMesh.rotation.x = -0.12;
  grp.add(domeMesh);
  // a swoop at the front, swept back and over to his left
  const swoop = new THREE.Mesh(new THREE.SphereGeometry(1, 32, 16), m);
  swoop.scale.set(0.34, 0.15, 0.2); swoop.position.set(0.1, 0.24, 0.3); swoop.rotation.set(0.25, 0.35, -0.12);
  swoop.castShadow = true; grp.add(swoop);
  // the part line: a thin groove on his right
  const groove = new THREE.Mesh(new THREE.BoxGeometry(0.015, 0.03, 0.5), plastic('#0E0A08'));
  groove.position.set(-0.2, 0.22, 0.05); groove.rotation.set(-0.1, 0.0, 0.3); grp.add(groove);
  return grp;
}

// ---------------------------------------------------------------- posing
// A pose is a flat object of joint angles (radians). Missing keys fall back to REST.
export const REST = {
  armR: 0.08, armL: 0.08, outR: 0.06, outL: 0.06, twistR: 0, twistL: 0,
  legR: 0, legL: 0, lean: 0, twist: 0, side: 0,
  headY: 0, headX: 0, headZ: 0, handR: 0, handL: 0, bodyX: 0, bodyZ: 0,
};
export function applyPose(fig, q) {
  const P_ = fig.parts;
  // arm rotX: negative raises the arm forward
  P_.armR.rotation.set(-(q.armR ?? 0), q.twistR ?? 0, -(q.outR ?? 0), 'XYZ');
  P_.armL.rotation.set(-(q.armL ?? 0), -(q.twistL ?? 0), (q.outL ?? 0), 'XYZ');
  P_.handR.rotation.set(0, 0, q.handR ?? 0);
  P_.handL.rotation.set(0, 0, q.handL ?? 0);
  P_.legR.rotation.x = -(q.legR ?? 0);
  P_.legL.rotation.x = -(q.legL ?? 0);
  P_.torso.rotation.set(q.lean ?? 0, q.twist ?? 0, q.side ?? 0);
  P_.head.rotation.set(q.headX ?? 0, q.headY ?? 0, q.headZ ?? 0, 'YXZ');
  fig.body.rotation.set(q.bodyX ?? 0, 0, q.bodyZ ?? 0);
}
