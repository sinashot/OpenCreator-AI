// Pose audit: frame t shows pose number floor(t) on Claude (left, 3/4) and Sina (right, profile). Dev only.
import * as M from '../lib/motion.js';
import * as G from '../lib/gl.js';
import { minifig, baseplate, applyPose, REST } from '../sets/lego.js';
import { drawFace } from '../sets/faces.js';
import { POSES } from '../script.js';
const THREE = G.THREE;
let S = null;
const names = Object.keys(POSES).filter((n) => !['faint', 'thumbFloor'].includes(n));
window.POSE_NAMES = names;
function set() {
  const scene = new THREE.Scene(), cam = G.camera(30);
  G.keyLights(scene, { key: 3.0, rim: 1.2, fill: 0.6, keyPos: [-6, 12, 9] });
  scene.add(baseplate(16, 12, '#DCC7A0'));
  const a = minifig('claude'), b = minifig('sina');
  for (const f of [a, b]) { f.faceTex.draw((c) => drawFace(c, f.who, { eyes: 'open', mouth: 'smile', open: 1 }, 0)); scene.add(f.root); }
  a.root.position.set(-1.4, 0, 0); a.root.rotation.y = 0.5;
  b.root.position.set(1.4, 0, 0); b.root.rotation.y = -1.3;
  return { scene, camera: cam, update(t) {
    const q = { ...REST, ...POSES[names[Math.floor(t) % names.length]] };
    applyPose(a, q); applyPose(b, q);
    G.lookFrom(cam, [-0.9, 3.4, 7.5], [-1.0, 2.6, 0]);
  } };
}
M.film({
  fonts: ['800 60px Vazir'],
  async init() { await G.initGL({ scale: 1 }); S = set(); },
  draw(ctx, u, t) {
    ctx.fillStyle = '#9BB8C6'; ctx.fillRect(0, 0, M.W, M.H);
    G.renderSet(ctx, S, t, u, {});
    ctx.font = '800 60px Vazir'; ctx.fillStyle = '#111'; ctx.textAlign = 'center';
    ctx.fillText(names[Math.floor(t) % names.length], M.W / 2, 120);
  },
});
