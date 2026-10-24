// Model sheet: both minifigs, a few expressions and poses. Dev only.
import * as M from '../lib/motion.js';
import * as G from '../lib/gl.js';
import { minifig, baseplate, applyPose, REST } from '../sets/lego.js';
import { drawFace } from '../sets/faces.js';
const THREE = G.THREE;
let S = null;
const F0 = { eyes: 'open', mouth: 'smile', open: 1, lookX: 0, lookY: 0, brow: 0, browY: 0, talk: 0, blush: 0, tear: 0 };
const EXPR = [
  { ...F0 }, { ...F0, eyes: 'happy', mouth: 'grin' }, { ...F0, eyes: 'spiral', mouth: 'wavy', brow: -0.5 },
  { ...F0, eyes: 'flat', mouth: 'flat' }, { ...F0, eyes: 'heart', mouth: 'grin', blush: 1 }, { ...F0, brow: 1, mouth: 'frown' },
];
function set() {
  const scene = new THREE.Scene(), cam = G.camera(30);
  const L = G.keyLights(scene, { key: 3.4, rim: 1.4, fill: 0.35, keyPos: [-7, 11, 5] });
  L.key.castShadow = true; L.key.shadow.mapSize.set(2048, 2048);
  Object.assign(L.key.shadow.camera, { left: -8, right: 8, top: 8, bottom: -8, near: 1, far: 40 }); L.key.shadow.bias = -0.0005; L.key.shadow.camera.updateProjectionMatrix(); L.key.shadow.radius = 3;
  scene.add(baseplate(24, 16, '#D8C7A0'));
  const figs = [];
  for (let i = 0; i < 6; i++) {
    const f = minifig(i % 2 ? 'claude' : 'sina');
    f.root.position.set((i - 2.5) * 2.2, 0, 0);
    scene.add(f.root); figs.push(f);
  }
  return { scene, camera: cam, figs, update(t, u, o) {
    const close = new URLSearchParams(location.search).get('view') === 'close';
    if (close) G.lookFrom(cam, [-2.2, 3.9, 7.5], [-2.2, 3.2, 0]); else G.lookFrom(cam, [0, 5.5, 26], [0, 2.3, 0]);
    figs.forEach((f, i) => {
      const F = EXPR[Math.floor(i / 1) % EXPR.length];
      f.faceTex.draw((c) => drawFace(c, f.who, F, t));
      const poses = [REST, { ...REST, armR: 1.4, armL: 0.3, headY: 0.3 }, { ...REST, armR: 2.6, armL: 2.6, outR: 0.3, outL: 0.3 },
        { ...REST, headY: 0.5 }, { ...REST, armR: 2.9, armL: 2.9, outR: 0.6, outL: 0.6 }, { ...REST, armR: 1.2, armL: 1.2, outR: -0.45, outL: -0.45 }];
      applyPose(f, poses[i]);
      f.root.rotation.y = [0.35, -0.35, 0.2, -0.6, 0.0, 0.4][i];
    });
  } };
}
M.film({
  fonts: ['700 40px Vazir'],
  async init() { await G.initGL(); S = set(); },
  draw(ctx, u, t) {
    const g = ctx.createLinearGradient(0, 0, 0, M.H); g.addColorStop(0, '#8FB3C2'); g.addColorStop(1, '#E8DCC2');
    ctx.fillStyle = g; ctx.fillRect(0, 0, M.W, M.H);
    G.renderSet(ctx, S, t, u, {});
  },
});
